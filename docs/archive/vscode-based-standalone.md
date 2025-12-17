# 基于VS Code OSS创建独立应用

## 🎯 目标
将VS Code扩展转换为基于VS Code OSS的独立桌面应用，就像Kiro一样

## 📋 实现步骤

### 1. 克隆VS Code OSS源码
```bash
git clone https://github.com/microsoft/vscode.git
cd vscode
git checkout release/1.85  # 选择稳定版本
```

### 2. 自定义品牌和配置
```bash
# 修改产品配置
cp product.json product.json.backup

# 编辑 product.json
{
  "nameShort": "小说动漫生成器",
  "nameLong": "小说动漫生成器",
  "applicationName": "novel-anime-generator",
  "dataFolderName": ".novel-anime-generator",
  "win32MutexName": "novelanimegenerator",
  "licenseName": "MIT",
  "licenseUrl": "https://github.com/your-repo/LICENSE",
  "serverApplicationName": "novel-anime-generator-server",
  "urlProtocol": "novel-anime-generator",
  "extensionsGallery": {
    "serviceUrl": "https://marketplace.visualstudio.com/_apis/public/gallery",
    "cacheUrl": "https://vscode.blob.core.windows.net/gallery/index",
    "itemUrl": "https://marketplace.visualstudio.com/items"
  }
}
```

### 3. 集成你的扩展
```bash
# 创建内置扩展目录
mkdir -p extensions/novel-anime-generator

# 复制你的扩展代码
cp -r ../vscode-novel-anime-extension/* extensions/novel-anime-generator/

# 修改扩展为内置扩展
# 在 extensions/novel-anime-generator/package.json 中添加:
{
  "isBuiltin": true,
  "activationEvents": ["*"]
}
```

### 4. 自定义界面和功能
```typescript
// src/vs/workbench/contrib/novelAnime/browser/novelAnimeContribution.ts
import { Registry } from 'vs/platform/registry/common/platform';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';

export class NovelAnimeContribution {
  constructor() {
    // 自定义启动逻辑
    this.initializeNovelAnimeFeatures();
  }

  private initializeNovelAnimeFeatures(): void {
    // 添加自定义菜单
    // 注册自定义命令
    // 设置默认布局
  }
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
  .registerWorkbenchContribution(NovelAnimeContribution, LifecyclePhase.Starting);
```

### 5. 构建和打包
```bash
# 安装依赖
yarn install

# 构建应用
yarn run compile
yarn run download-builtin-extensions

# 打包不同平台
yarn run gulp vscode-darwin-x64  # macOS
yarn run gulp vscode-win32-x64   # Windows
yarn run gulp vscode-linux-x64   # Linux
```

## 🎨 自定义外观

### 修改启动画面
```typescript
// src/vs/workbench/browser/parts/splash/splash.ts
export class SplashScreen {
  private createSplash(): HTMLElement {
    const splash = document.createElement('div');
    splash.innerHTML = `
      <div class="novel-anime-splash">
        <img src="./resources/app/novel-anime-logo.png" alt="小说动漫生成器" />
        <h1>小说动漫生成器</h1>
        <p>正在启动...</p>
      </div>
    `;
    return splash;
  }
}
```

### 自定义欢迎页面
```typescript
// extensions/novel-anime-generator/src/welcomePage.ts
export function createWelcomePage(): string {
  return `
    <div class="welcome-page">
      <h1>欢迎使用小说动漫生成器</h1>
      <div class="actions">
        <button onclick="createNewProject()">创建新项目</button>
        <button onclick="openExistingProject()">打开项目</button>
        <button onclick="showTutorial()">查看教程</button>
      </div>
    </div>
  `;
}
```

## 🔧 配置文件修改

### 默认设置
```json
// src/vs/platform/userDataSync/common/settingsSync.ts
{
  "workbench.startupEditor": "welcomePageInEmptyWorkbench",
  "workbench.colorTheme": "Novel Anime Dark",
  "extensions.autoUpdate": false,
  "telemetry.enableTelemetry": false,
  "update.mode": "manual"
}
```

### 禁用不需要的功能
```typescript
// src/vs/workbench/workbench.web.main.ts
// 移除或禁用不需要的贡献点
const contributions = [
  // 保留需要的功能
  'vs/workbench/contrib/files/browser/files.contribution',
  'vs/workbench/contrib/search/browser/search.contribution',
  // 移除不需要的功能
  // 'vs/workbench/contrib/git/browser/git.contribution',
];
```