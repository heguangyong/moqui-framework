const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { fileAccessControl } = require('./security/FileAccessControl');

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
        // 开发模式下打开调试窗口
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
        label: '编辑',
        submenu: [
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
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
    const fs = require('fs').promises;
    const os = require('os');
    
    // Try to load keytar for secure credential storage
    let keytar = null;
    try {
      keytar = require('keytar');
      console.log('✅ Keytar loaded successfully');
    } catch (error) {
      console.warn('⚠️ Keytar not available:', error.message);
    }
    
    // Get projects directory
    const getProjectsDir = () => {
      return path.join(os.homedir(), 'NovelAnimeProjects');
    };

    // Ensure projects directory exists
    const ensureProjectsDir = async () => {
      const projectsDir = getProjectsDir();
      try {
        await fs.access(projectsDir);
      } catch {
        await fs.mkdir(projectsDir, { recursive: true });
      }
      return projectsDir;
    };

    // Keytar IPC Handlers - Requirements: 12.1
    ipcMain.handle('keytar-test', async () => {
      return { success: keytar !== null };
    });

    ipcMain.handle('keytar-get', async (_, service, account) => {
      if (!keytar) {
        throw new Error('Keytar not available');
      }
      try {
        return await keytar.getPassword(service, account);
      } catch (error) {
        console.error('Keytar getPassword error:', error);
        return null;
      }
    });

    ipcMain.handle('keytar-set', async (_, service, account, password) => {
      if (!keytar) {
        throw new Error('Keytar not available');
      }
      try {
        await keytar.setPassword(service, account, password);
        return true;
      } catch (error) {
        console.error('Keytar setPassword error:', error);
        throw error;
      }
    });

    ipcMain.handle('keytar-delete', async (_, service, account) => {
      if (!keytar) {
        throw new Error('Keytar not available');
      }
      try {
        return await keytar.deletePassword(service, account);
      } catch (error) {
        console.error('Keytar deletePassword error:', error);
        return false;
      }
    });

    // File System API - with access control
    ipcMain.handle('fs:read-file', async (_, filePath) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, filePath);
        // Use file access control
        return await fileAccessControl.safeReadFile(fullPath);
      } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
    });

    ipcMain.handle('fs:write-file', async (_, filePath, content) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, filePath);
        // Use file access control
        await fileAccessControl.safeWriteFile(fullPath, content);
      } catch (error) {
        throw new Error(`Failed to write file: ${error.message}`);
      }
    });

    ipcMain.handle('fs:delete-file', async (_, filePath) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, filePath);
        // Use file access control
        await fileAccessControl.safeDeleteFile(fullPath);
      } catch (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    });

    ipcMain.handle('fs:read-dir', async (_, dirPath) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, dirPath);
        // Use file access control
        return await fileAccessControl.safeReadDir(fullPath);
      } catch (error) {
        throw new Error(`Failed to read directory: ${error.message}`);
      }
    });

    ipcMain.handle('fs:create-dir', async (_, dirPath) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, dirPath);
        // Use file access control
        await fileAccessControl.safeCreateDir(fullPath);
      } catch (error) {
        throw new Error(`Failed to create directory: ${error.message}`);
      }
    });

    ipcMain.handle('fs:exists', async (_, filePath) => {
      try {
        const projectsDir = await ensureProjectsDir();
        const fullPath = path.join(projectsDir, filePath);
        // Use file access control
        return await fileAccessControl.safeExists(fullPath);
      } catch {
        return false;
      }
    });

    ipcMain.handle('fs:select-directory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory', 'createDirectory']
      });
      return result.filePaths[0] || null;
    });

    ipcMain.handle('fs:get-projects-directory', async () => {
      return await ensureProjectsDir();
    });

    // Legacy project management (keep for compatibility)
    ipcMain.handle('create-project', async (_, projectData) => {
      return { success: true, project: projectData };
    });

    ipcMain.handle('open-project', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      });
      return result.filePaths[0];
    });

    // Legacy file operations (keep for compatibility)
    ipcMain.handle('open-file', async (_, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: options?.filters || [
          { name: '小说文件', extensions: ['txt', 'docx', 'pdf', 'epub', 'md'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });
      return result.filePaths[0] || null;
    });

    ipcMain.handle('read-file', async (_, filePath) => {
      return await fs.readFile(filePath, 'utf8');
    });

    ipcMain.handle('write-file', async (_, filePath, content) => {
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
