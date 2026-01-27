#!/usr/bin/env node
import { spawn } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MOQUI_URL = process.env.MOQUI_URL || 'http://localhost:8080';
const USERNAME = process.env.MOQUI_USERNAME || 'john.doe';
const PASSWORD = process.env.MOQUI_PASSWORD || 'moqui';
const DEBUG_PORT = 9233;
const ASSERT_SUCCESS = process.argv.includes('--assert');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return { json: await res.json(), res };
}

async function loginForTokens() {
  const body = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const { json, res } = await fetchJson(`${MOQUI_URL}/rest/s1/moqui/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  // Pure JWT mode: Only extract JWT tokens, ignore session cookies
  if (!json.accessToken) throw new Error('Missing JWT access token in response');
  return { accessToken: json.accessToken, refreshToken: json.refreshToken };
}

async function waitForDevTools(port, retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch (err) {
      // ignore
    }
    await sleep(250);
  }
  throw new Error('Timed out waiting for Chrome DevTools endpoint');
}

function oncePromise(ws, event) {
  return new Promise((resolve, reject) => {
    const handle = (ev) => {
      cleanup();
      resolve(ev);
    };
    const handleError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      ws.removeEventListener(event, handle);
      ws.removeEventListener('error', handleError);
    };
    ws.addEventListener(event, handle);
    ws.addEventListener('error', handleError);
  });
}

function createCommandSender(ws, options = {}) {
  const networkEvents = options.networkEvents;
  let idCounter = 1;
  const pending = new Map();
  const eventListeners = [];

  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data.toString());
    if (msg.method && networkEvents && msg.method.startsWith('Network.')) {
      networkEvents.push(msg);
    }
    if (msg.id) {
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message || 'Command failed'));
      else entry.resolve(msg.result);
    } else if (msg.method) {
      for (const listener of [...eventListeners]) {
        if (listener.method === msg.method) {
          eventListeners.splice(eventListeners.indexOf(listener), 1);
          listener.handler(msg);
        }
      }
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = idCounter++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const waitForEvent = (method, timeout = 5000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = eventListeners.indexOf(listener);
      if (idx >= 0) eventListeners.splice(idx, 1);
      reject(new Error(`Timed out waiting for ${method}`));
    }, timeout);
    const listener = {
      method,
      handler: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      }
    };
    eventListeners.push(listener);
  });

  return { send, waitForEvent };
}

async function run() {
  const { accessToken, refreshToken } = await loginForTokens();
  console.log('✅ REST login succeeded');

  const profileDir = await mkdtemp(join(tmpdir(), 'vue-debug-profile-'));
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--remote-allow-origins=*'
  ], { stdio: 'ignore' });

  let chromeExited = false;
  chrome.on('exit', code => {
    chromeExited = true;
    if (code !== 0) console.error(`Chrome exited with code ${code}`);
  });

  try {
    const versionInfo = await waitForDevTools(DEBUG_PORT);
    const browserWs = new WebSocket(versionInfo.webSocketDebuggerUrl);
    await oncePromise(browserWs, 'open');

    const { send: sendBrowserCommand } = createCommandSender(browserWs);
    const { targetId } = await sendBrowserCommand('Target.createTarget', { url: 'about:blank' });

    const pageList = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then(r => r.json());
    const pageEntry = pageList.find(entry => entry.id === targetId);
    if (!pageEntry) throw new Error('Failed to locate page target entry');

    const pageWs = new WebSocket(pageEntry.webSocketDebuggerUrl);
    await oncePromise(pageWs, 'open');

    const networkEvents = [];
    const { send, waitForEvent } = createCommandSender(pageWs, { networkEvents });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setExtraHTTPHeaders', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    await send('Page.navigate', { url: `${MOQUI_URL}/qapps` });
    await waitForEvent('Page.loadEventFired', 10000);

    const injectScript = `
      // Pure JWT mode: Only JWT tokens, no session authentication
      localStorage.setItem('jwt_access_token', ${JSON.stringify(accessToken)});
      localStorage.setItem('jwt_refresh_token', ${JSON.stringify(refreshToken ?? '')});
      sessionStorage.setItem('jwt_access_token', ${JSON.stringify(accessToken)});
      sessionStorage.setItem('jwt_refresh_token', ${JSON.stringify(refreshToken ?? '')});
      document.cookie = 'jwt_access_token=' + ${JSON.stringify(accessToken)} + '; path=/; SameSite=Lax';
      true;
    `;
    await send('Runtime.evaluate', { expression: injectScript });
    await send('Page.reload', { ignoreCache: true });
    await waitForEvent('Page.loadEventFired', 10000);
    await sleep(2500);

    // Wait up to 6 seconds for nav/account plugins to load
    for (let i = 0; i < 12; i++) {
      const check = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ nav: (window.moqui?.webrootVue?.navPlugins || []).length, account: (window.moqui?.webrootVue?.accountPlugins || []).length })',
        returnByValue: true
      });
      try {
        const parsed = JSON.parse(check.result.value || "{\"nav\":0,\"account\":0}");
        if (parsed.nav > 0 || parsed.account > 0) {
          break;
        }
      } catch (err) {
        // ignore parse errors and continue waiting
      }
      await sleep(500);
    }

    const vueMounted = await send('Runtime.evaluate', {
      expression: '!!(window.moqui && window.moqui.webrootVue && document.getElementById("apps-root") && document.getElementById("apps-root").__vue_app__)',
      returnByValue: true
    });

    const diagnosticsEval = await send('Runtime.evaluate', {
      expression: 'window.moquiPluginDiagnostics ? JSON.stringify(window.moquiPluginDiagnostics) : null',
      returnByValue: true
    });

    const countsEval = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ nav: (window.moqui?.webrootVue?.navPlugins || []).length, account: (window.moqui?.webrootVue?.accountPlugins || []).length })',
      returnByValue: true
    });

    const failuresEval = await send('Runtime.evaluate', {
      expression: 'JSON.stringify(window.moqui?.webrootVue?.pluginLoadFailures || [])',
      returnByValue: true
    });

    const historyEval = await send('Runtime.evaluate', {
      expression: 'JSON.stringify(window.moqui?.webrootVue?.pluginLoadHistory || [])',
      returnByValue: true
    });

    const domEval = await send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true
    });

    const hiddenCountsEval = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ navInputs: document.querySelectorAll(\".confNavPluginUrl\").length, accountInputs: document.querySelectorAll(\".confAccountPluginUrl\").length, navValues: Array.from(document.querySelectorAll(\".confNavPluginUrl\"), el => el.value), accountValues: Array.from(document.querySelectorAll(\".confAccountPluginUrl\"), el => el.value) })',
      returnByValue: true
    });

    const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });

    await writeFile('/tmp/vue_debug_screenshot.png', Buffer.from(screenshot.data, 'base64'));
    await writeFile('/tmp/qapps_dom.html', domEval.result.value || '');
    await writeFile('/tmp/moqui_plugin_diagnostics.json', diagnosticsEval.result.value || 'null');
    await writeFile('/tmp/moqui_plugin_counts.json', countsEval.result.value || '{}');
    await writeFile('/tmp/moqui_plugin_failures.json', failuresEval.result.value || '[]');
    await writeFile('/tmp/moqui_plugin_history.json', historyEval.result.value || '[]');
    await writeFile('/tmp/moqui_plugin_hidden_counts.json', hiddenCountsEval.result.value || '{}');
    await writeFile('/tmp/moqui_network_events.json', JSON.stringify(networkEvents, null, 2));

    console.log('✅ Vue mounted?', vueMounted.result.value);
    console.log('🔌 Plugin counts:', countsEval.result.value);
    console.log('⚠️ Plugin failures:', failuresEval.result.value);
    console.log('📜 Plugin history:', historyEval.result.value);
    console.log('📦 Hidden inputs:', hiddenCountsEval.result.value);
    console.log('📝 Diagnostics saved to /tmp/moqui_plugin_diagnostics.json');

    if (ASSERT_SUCCESS) {
      const counts = JSON.parse(countsEval.result.value || '{\"nav\":0,\"account\":0}');
      if (!vueMounted.result.value) {
        throw new Error('Vue failed to mount while running with --assert');
      }
      if ((counts.nav || 0) === 0) {
        throw new Error('Navbar plugin list empty with --assert');
      }
      if ((counts.account || 0) === 0) {
        throw new Error('Account plugin list empty with --assert');
      }
      const failures = JSON.parse(failuresEval.result.value || '[]');
      if (failures.length) {
        throw new Error('Plugin failures detected while running with --assert');
      }
    }

    await sendBrowserCommand('Target.closeTarget', { targetId });
    browserWs.close();
    pageWs.close();
  } finally {
    if (!chromeExited) {
      chrome.kill();
      await new Promise(resolve => chrome.once('exit', resolve));
    }
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

run().catch(err => {
  console.error('❌ debug run failed:', err);
  process.exit(1);
});
