const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

class NovelAnimeApp {
  constructor() {
    this.mainWindow = null;
    this.setupApp();
  }

  setupApp() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'default',
      title: '小说动漫生成器'
    });

    // 加载应用
    const isDev = !app.isPackaged;
    if (isDev) {
      // 等待Vite服务器启动
      setTimeout(() => {
        this.mainWindow.loadURL('http://localhost:5174');
        this.mainWindow.webContents.openDevTools();
      }, 2000);
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
    }
  }

  setupMenu() {
    const template = [
      {
        label: '文件',
        submenu: [
          { label: '新建项目', accelerator: 'CmdOrCtrl+N', click: () => this.newProject() },
          { label: '打开项目', accelerator: 'CmdOrCtrl+O', click: () => this.openProject() },
          { type: 'separator' },
          { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
        ]
      },
      {
        label: '工具',
        submenu: [
          { label: '工作流编辑器', click: () => this.openWorkflowEditor() },
          { label: '生成动画', click: () => this.generateAnimation() }
        ]
      },
      {
        label: '帮助',
        submenu: [
          { label: '关于', click: () => this.showAbout() }
        ]
      }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

  setupIPC() {
    // 项目管理
    ipcMain.handle('create-project', async (_, projectData) => {
      // 实现项目创建逻辑
      return { success: true, project: projectData };
    });

    ipcMain.handle('open-project', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      });
      return result.filePaths[0];
    });

    // 文件操作
    ipcMain.handle('read-file', async (_, filePath) => {
      const fs = require('fs').promises;
      return await fs.readFile(filePath, 'utf8');
    });

    ipcMain.handle('write-file', async (_, filePath, content) => {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, content, 'utf8');
    });
  }

  newProject() {
    this.mainWindow.webContents.send('menu-action', 'new-project');
  }

  openProject() {
    this.mainWindow.webContents.send('menu-action', 'open-project');
  }

  openWorkflowEditor() {
    this.mainWindow.webContents.send('menu-action', 'workflow-editor');
  }

  generateAnimation() {
    this.mainWindow.webContents.send('menu-action', 'generate-animation');
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '关于小说动漫生成器',
      message: '小说动漫生成器 v1.0.0',
      detail: '使用AI技术将小说转换为精美动画的专业工具'
    });
  }
}

new NovelAnimeApp();
