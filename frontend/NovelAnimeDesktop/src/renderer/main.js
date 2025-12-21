console.log('🚀 Starting Novel Anime Desktop App...');

// 清除旧的导航状态缓存，避免状态残留问题
// 这是一次性修复，之后可以移除这段代码
const NAV_STATE_VERSION = 'v2';
const savedVersion = localStorage.getItem('navigation-state-version');
if (savedVersion !== NAV_STATE_VERSION) {
  console.log('🧹 Clearing old navigation state cache...');
  localStorage.removeItem('navigation-state');
  localStorage.setItem('navigation-state-version', NAV_STATE_VERSION);
}

try {
  console.log('📦 Importing Vue...');
  const { createApp } = await import('vue');
  
  console.log('📦 Importing Pinia...');
  const { createPinia } = await import('pinia');
  
  console.log('📦 Importing App component...');
  const App = await import('./App.vue');
  
  console.log('📦 Importing router...');
  const router = await import('./router/index.js');
  
  console.log('🎨 Importing global styles...');
  await import('./styles/main.scss');
  
  console.log('⚙️ Creating Vue app...');
  const app = createApp(App.default || App);
  
  console.log('🗃️ Setting up Pinia...');
  app.use(createPinia());
  
  console.log('🛣️ Setting up router...');
  app.use(router.default || router);
  
  console.log('🎯 Mounting app to #app...');
  app.mount('#app');
  
  console.log('✅ App mounted successfully!');
  
} catch (error) {
  console.error('💥 Error starting app:', error);
  
  // 显示错误信息给用户
  document.getElementById('app').innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>应用启动失败</h2>
      <p>错误信息: ${error.message}</p>
      <p>请检查控制台获取详细信息</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}