# VS Code扩展 → 独立桌面应用转换计划

## 🎯 目标
将"小说动漫生成器"从VS Code扩展转换为独立的Electron桌面应用

## 📊 项目结构对比

### 当前结构 (VS Code扩展)
```
vscode-novel-anime-extension/
├── src/
│   ├── extension.ts          # VS Code扩展入口
│   ├── commands/             # VS Code命令
│   ├── webview/              # VS Code Webview
│   └── services/             # 业务逻辑
├── webview-ui/               # 前端界面
└── package.json              # VS Code扩展配置
```

### 目标结构 (Electron应用)
```
novel-anime-desktop/
├── src/
│   ├── main/                 # Electron主进程
│   │   ├── main.ts           # 应用入口
│   │   ├── menu.ts           # 菜单栏
│   │   ├── windows.ts        # 窗口管理
│   │   └── services/         # 后端服务
│   ├── renderer/             # Electron渲染进程
│   │   ├── index.html        # 主页面
│   │   ├── main.ts           # 前端入口
│   │   ├── components/       # Vue组件
│   │   └── stores/           # 状态管理
│   └── shared/               # 共享代码
│       ├── types/            # 类型定义
│       └── utils/            # 工具函数
├── build/                    # 构建配置
├── dist/                     # 构建输出
└── package.json              # Electron应用配置
```

## 🔄 转换步骤

### 第1阶段：项目初始化 (1-2天)

1. **创建Electron项目骨架**
   ```bash
   npm create electron-app novel-anime-desktop
   cd novel-anime-desktop
   npm install
   ```

2. **安装必要依赖**
   ```bash
   # Electron相关
   npm install electron electron-builder
   
   # Vue.js生态
   npm install vue@3 pinia vue-router@4
   
   # 构建工具
   npm install vite @vitejs/plugin-vue typescript
   
   # 现有依赖
   npm install axios uuid chokidar
   ```

3. **配置构建系统**
   - 设置Vite配置
   - 配置TypeScript
   - 设置Electron Builder

### 第2阶段：核心架构迁移 (3-5天)

1. **主进程开发**
   ```typescript
   // src/main/main.ts
   import { app, BrowserWindow, Menu, ipcMain } from 'electron';
   import { ProjectManager } from './services/ProjectManager';
   import { FileSystemService } from './services/FileSystemService';
   
   class NovelAnimeApp {
     private mainWindow: BrowserWindow | null = null;
     private projectManager: ProjectManager;
     private fileSystemService: FileSystemService;
   
     constructor() {
       this.projectManager = new ProjectManager();
       this.fileSystemService = new FileSystemService();
     }
   
     async createWindow() {
       this.mainWindow = new BrowserWindow({
         width: 1200,
         height: 800,
         webPreferences: {
           nodeIntegration: false,
           contextIsolation: true,
           preload: path.join(__dirname, 'preload.js')
         }
       });
   
       await this.mainWindow.loadFile('dist/index.html');
     }
   }
   ```

2. **API桥接层**
   ```typescript
   // src/main/preload.ts
   import { contextBridge, ipcRenderer } from 'electron';
   
   contextBridge.exposeInMainWorld('electronAPI', {
     // 项目管理
     createProject: (name: string) => ipcRenderer.invoke('project:create', name),
     openProject: (path: string) => ipcRenderer.invoke('project:open', path),
     
     // 文件操作
     readFile: (path: string) => ipcRenderer.invoke('fs:read', path),
     writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:write', path, content),
     
     // 工作流
     executeWorkflow: (config: any) => ipcRenderer.invoke('workflow:execute', config),
   });
   ```

3. **服务层迁移**
   - 将`ProjectManager`从VS Code API迁移到Node.js API
   - 将`FileSystemBridge`重构为纯Node.js实现
   - 保持业务逻辑不变

### 第3阶段：前端界面迁移 (2-3天)

1. **Vue应用重构**
   ```typescript
   // src/renderer/main.ts
   import { createApp } from 'vue';
   import { createPinia } from 'pinia';
   import { createRouter, createWebHashHistory } from 'vue-router';
   import App from './App.vue';
   
   const app = createApp(App);
   app.use(createPinia());
   app.use(router);
   app.mount('#app');
   ```

2. **组件迁移**
   - 将webview-ui中的组件迁移到Vue 3
   - 重构消息通信为IPC调用
   - 保持UI设计和交互逻辑

3. **状态管理**
   ```typescript
   // src/renderer/stores/project.ts
   import { defineStore } from 'pinia';
   
   export const useProjectStore = defineStore('project', {
     state: () => ({
       currentProject: null,
       projects: []
     }),
     
     actions: {
       async createProject(name: string) {
         const project = await window.electronAPI.createProject(name);
         this.currentProject = project;
       }
     }
   });
   ```

### 第4阶段：功能完善 (3-4天)

1. **菜单栏和快捷键**
   ```typescript
   // src/main/menu.ts
   const menuTemplate = [
     {
       label: '文件',
       submenu: [
         { label: '新建项目', accelerator: 'CmdOrCtrl+N', click: () => createProject() },
         { label: '打开项目', accelerator: 'CmdOrCtrl+O', click: () => openProject() },
         { type: 'separator' },
         { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
       ]
     },
     {
       label: '编辑',
       submenu: [
         { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
         { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' }
       ]
     }
   ];
   ```

2. **窗口管理**
   - 主窗口
   - 设置窗口
   - 预览窗口
   - 关于窗口

3. **文件关联**
   - 注册.novel文件类型
   - 双击打开功能
   - 图标和缩略图

### 第5阶段：打包和分发 (1-2天)

1. **构建配置**
   ```json
   // package.json
   {
     "build": {
       "appId": "com.novelanime.desktop",
       "productName": "小说动漫生成器",
       "directories": {
         "output": "dist"
       },
       "files": [
         "dist/**/*",
         "node_modules/**/*"
       ],
       "mac": {
         "category": "public.app-category.productivity"
       },
       "win": {
         "target": "nsis"
       },
       "linux": {
         "target": "AppImage"
       }
     }
   }
   ```

2. **自动更新**
   ```typescript
   import { autoUpdater } from 'electron-updater';
   
   autoUpdater.checkForUpdatesAndNotify();
   ```

## 🔧 关键技术迁移

### VS Code API → Electron API 映射

| VS Code API | Electron API | 说明 |
|-------------|--------------|------|
| `vscode.workspace.fs` | `fs/promises` | 文件系统操作 |
| `vscode.window.showInformationMessage` | `dialog.showMessageBox` | 消息提示 |
| `vscode.commands.registerCommand` | `ipcMain.handle` | 命令注册 |
| `vscode.workspace.onDidChangeConfiguration` | `app.on('ready')` | 配置监听 |
| `vscode.Uri` | `path` + `url` | 路径处理 |

### 数据存储迁移

```typescript
// VS Code扩展 (使用VS Code存储)
context.globalState.update('projects', projects);

// Electron应用 (使用本地文件)
import { app } from 'electron';
import path from 'path';

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config));
```

## 📦 部署和分发

### 1. 本地构建
```bash
npm run build          # 构建应用
npm run dist           # 打包分发版本
```

### 2. 自动化构建 (GitHub Actions)
```yaml
name: Build and Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run dist
      - uses: actions/upload-artifact@v3
```

### 3. 应用商店发布
- **Mac App Store**: 需要Apple开发者账号
- **Microsoft Store**: 需要Microsoft开发者账号
- **Snap Store**: Linux应用商店
- **直接下载**: GitHub Releases

## 🎯 预期成果

转换完成后，你将获得：

1. **跨平台桌面应用**
   - Windows (.exe安装包)
   - macOS (.dmg安装包)
   - Linux (.AppImage文件)

2. **完整的桌面体验**
   - 原生菜单栏
   - 文件关联
   - 系统托盘
   - 自动更新

3. **独立运行**
   - 无需VS Code
   - 独立安装
   - 完整功能

## ⏱️ 时间估算

- **总开发时间**: 10-15天
- **测试和优化**: 3-5天
- **打包和发布**: 2-3天

**总计**: 约3-4周完成完整转换

## 💡 建议

1. **先做MVP**: 先实现核心功能，再添加高级特性
2. **保持架构**: 尽量保持现有的模块化设计
3. **渐进迁移**: 一个模块一个模块地迁移
4. **充分测试**: 在不同平台上测试应用

这个转换计划可以让你的VS Code扩展变成一个功能完整的独立桌面应用，就像Kiro一样！