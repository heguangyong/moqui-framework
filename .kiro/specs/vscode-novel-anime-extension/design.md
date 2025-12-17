# VS Code 小说动漫生成器扩展 - 设计文档

## 概述

本设计文档描述了如何将现有的小说动漫生成器 Web 应用转换为 VS Code 扩展，创建一个集成的桌面版本行业工具。该扩展将利用 VS Code 的强大扩展 API，提供无缝的开发体验，同时保持现有 Web 应用的所有功能。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code 扩展宿主                          │
├─────────────────────────────────────────────────────────────┤
│  扩展主进程 (Extension Host)                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   命令处理器     │  │   文件监听器     │  │   状态管理器     ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   语言服务器     │  │   项目管理器     │  │   配置管理器     ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Webview 容器                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Vue.js 应用 (现有)                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │  主布局组件  │  │  工作流编辑  │  │  素材管理    │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │  小说解析器  │  │  角色系统    │  │  视频生成    │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  VS Code API 桥接层                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   文件系统API    │  │   通知系统API    │  │   终端API       ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **扩展框架**: VS Code Extension API
- **前端应用**: Vue.js 3.5.x + Quasar 2.18.x (重用现有)
- **构建工具**: Webpack + TypeScript
- **通信机制**: Webview Message API
- **文件处理**: VS Code File System API
- **语言服务**: Language Server Protocol (LSP)

## 组件和接口

### 1. 扩展主入口 (Extension Entry Point)

```typescript
interface ExtensionContext {
  subscriptions: vscode.Disposable[];
  extensionUri: vscode.Uri;
  globalState: vscode.Memento;
  workspaceState: vscode.Memento;
}

interface ExtensionActivation {
  activate(context: ExtensionContext): Promise<void>;
  deactivate(): Promise<void>;
}
```

**职责**:
- 注册所有命令和事件监听器
- 初始化扩展状态和配置
- 管理扩展生命周期

### 2. Webview 管理器 (Webview Manager)

```typescript
interface WebviewManager {
  createMainPanel(): vscode.WebviewPanel;
  sendMessage(message: WebviewMessage): void;
  onMessage(handler: (message: WebviewMessage) => void): void;
  updateContent(html: string): void;
}

interface WebviewMessage {
  command: string;
  data: any;
  requestId?: string;
}
```

**职责**:
- 创建和管理 Webview 面板
- 处理扩展与 Web 应用之间的消息通信
- 管理 Web 应用资源的加载

### 3. 文件系统桥接器 (File System Bridge)

```typescript
interface FileSystemBridge {
  readFile(uri: vscode.Uri): Promise<Uint8Array>;
  writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void>;
  createDirectory(uri: vscode.Uri): Promise<void>;
  watchFiles(pattern: string, handler: FileChangeHandler): vscode.Disposable;
}

interface FileChangeHandler {
  (event: vscode.FileChangeEvent): void;
}
```

**职责**:
- 为 Web 应用提供安全的文件系统访问
- 监听文件变化并通知 Web 应用
- 管理项目文件结构

### 4. 项目管理器 (Project Manager)

```typescript
interface ProjectManager {
  createProject(name: string, location: vscode.Uri): Promise<NovelAnimeProject>;
  loadProject(uri: vscode.Uri): Promise<NovelAnimeProject>;
  getCurrentProject(): NovelAnimeProject | null;
  switchProject(project: NovelAnimeProject): Promise<void>;
}

interface NovelAnimeProject {
  name: string;
  rootUri: vscode.Uri;
  config: ProjectConfig;
  novels: NovelFile[];
  assets: AssetFile[];
  workflows: WorkflowConfig[];
}
```

**职责**:
- 管理小说动漫项目的创建和加载
- 维护项目状态和配置
- 提供项目切换功能

### 5. 语言服务提供者 (Language Service Provider)

```typescript
interface NovelLanguageService extends vscode.Disposable {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]>;
  
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover>;
  
  provideDiagnostics(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]>;
}
```

**职责**:
- 为小说文件提供智能编辑功能
- 实现角色名称自动补全
- 提供章节结构分析和验证

## 数据模型

### 扩展配置模型

```typescript
interface ExtensionConfig {
  aiServices: {
    apiKey: string;
    endpoint: string;
    model: string;
  };
  outputSettings: {
    videoFormat: string;
    resolution: string;
    frameRate: number;
  };
  workflowTemplates: WorkflowTemplate[];
  shortcuts: KeyboardShortcut[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}
```

### 项目数据模型

```typescript
interface ProjectConfig {
  version: string;
  name: string;
  description: string;
  settings: {
    defaultLanguage: string;
    outputDirectory: string;
    backupEnabled: boolean;
  };
  characters: Character[];
  chapters: Chapter[];
}

interface Character {
  id: string;
  name: string;
  description: string;
  traits: string[];
  relationships: Relationship[];
}
```

### 消息通信模型

```typescript
interface ExtensionToWebviewMessage {
  type: 'file-changed' | 'project-loaded' | 'config-updated';
  payload: any;
}

interface WebviewToExtensionMessage {
  type: 'save-file' | 'create-project' | 'run-workflow';
  payload: any;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是关键的正确性属性：

### 属性 1: 扩展安装和激活一致性
*对于任何* VS Code 环境，当扩展安装完成后，活动栏应该显示小说动漫生成器图标，点击图标应该打开相应的侧边面板
**验证需求: 1.2, 1.3**

### 属性 2: 文件类型识别和处理
*对于任何* .txt 或 .md 格式的小说文件，打开时应该激活语法高亮和自动补全功能，保存时应该触发解析和分析流程
**验证需求: 2.1, 2.3**

### 属性 3: 项目结构一致性
*对于任何* 新创建的小说动漫项目，系统应该生成标准的文件夹结构，并且包含小说文件的文件夹应该被自动识别为项目类型
**验证需求: 3.1, 3.2**

### 属性 4: 工作流状态持久化
*对于任何* 工作流编辑操作，包括节点拖拽和连接创建，系统应该实时保存配置到项目文件中
**验证需求: 4.2**

### 属性 5: Web应用集成安全性
*对于任何* Web应用的文件系统访问请求，系统应该通过VS Code API提供安全访问，生成的文件应该保存到工作区的适当位置
**验证需求: 5.2, 5.3**

### 属性 6: 智能补全一致性
*对于任何* 在小说文件中的角色名称输入，系统应该提供已识别角色的自动补全建议
**验证需求: 6.1**

### 属性 7: Git集成完整性
*对于任何* 新初始化的项目，系统应该自动配置Git仓库和.gitignore文件，文件修改应该在源代码管理面板中显示
**验证需求: 7.1, 7.2**

### 属性 8: 配置验证有效性
*对于任何* AI服务配置的修改，系统应该验证API密钥的有效性，输出格式设置应该在所有生成操作中生效
**验证需求: 8.2, 8.4**

### 属性 9: 实时预览同步性
*对于任何* 小说内容或角色设定的编辑，系统应该在相应的预览面板中实时显示更新
**验证需求: 9.1, 9.2**

### 属性 10: 构建打包完整性
*对于任何* 扩展构建操作，系统应该自动打包所有Web应用资源到扩展包中
**验证需求: 10.1**

## 错误处理

### 1. Webview 通信错误

```typescript
class WebviewCommunicationError extends Error {
  constructor(message: string, public readonly requestId?: string) {
    super(message);
    this.name = 'WebviewCommunicationError';
  }
}

// 错误处理策略
const handleWebviewError = (error: WebviewCommunicationError) => {
  vscode.window.showErrorMessage(`通信错误: ${error.message}`);
  // 记录错误日志
  console.error('Webview communication failed:', error);
  // 尝试重新建立连接
  reconnectWebview();
};
```

### 2. 文件系统访问错误

```typescript
class FileSystemAccessError extends Error {
  constructor(message: string, public readonly uri: vscode.Uri) {
    super(message);
    this.name = 'FileSystemAccessError';
  }
}

// 错误恢复机制
const handleFileSystemError = async (error: FileSystemAccessError) => {
  const action = await vscode.window.showErrorMessage(
    `文件访问失败: ${error.message}`,
    '重试',
    '选择其他位置'
  );
  
  if (action === '重试') {
    return retryFileOperation(error.uri);
  } else if (action === '选择其他位置') {
    return selectAlternativeLocation();
  }
};
```

### 3. 项目加载错误

```typescript
class ProjectLoadError extends Error {
  constructor(message: string, public readonly projectPath: string) {
    super(message);
    this.name = 'ProjectLoadError';
  }
}

// 项目恢复策略
const handleProjectLoadError = async (error: ProjectLoadError) => {
  const action = await vscode.window.showErrorMessage(
    `项目加载失败: ${error.message}`,
    '创建新项目',
    '选择其他项目'
  );
  
  switch (action) {
    case '创建新项目':
      return createNewProject();
    case '选择其他项目':
      return selectExistingProject();
  }
};
```

## 测试策略

### 单元测试

单元测试将验证各个组件的独立功能：

- **扩展激活测试**: 验证扩展正确注册命令和事件监听器
- **Webview管理器测试**: 测试消息通信和面板管理
- **文件系统桥接器测试**: 验证文件操作的安全性和正确性
- **项目管理器测试**: 测试项目创建、加载和切换功能
- **语言服务测试**: 验证智能编辑功能的准确性

### 属性测试

属性测试将使用 **fast-check** 库验证系统的通用正确性：

- 每个属性测试将运行最少 100 次迭代
- 每个属性测试将使用注释格式标记对应的设计文档属性
- 测试将生成随机的项目配置、文件内容和用户操作序列

**属性测试库**: fast-check (JavaScript/TypeScript)

### 集成测试

集成测试将验证组件间的协作：

- **端到端工作流测试**: 从项目创建到视频生成的完整流程
- **VS Code API集成测试**: 验证与VS Code各种API的正确集成
- **Web应用集成测试**: 测试现有Vue.js应用在Webview中的运行

### 测试环境

- **开发环境**: VS Code Extension Development Host
- **CI/CD环境**: GitHub Actions with VS Code Test Runner
- **用户验收测试**: VS Code Insiders 版本

## 部署和分发

### 构建流程

1. **Web应用构建**: 使用Vite构建Vue.js应用
2. **扩展打包**: 使用vsce工具打包扩展
3. **资源嵌入**: 将Web应用资源嵌入到扩展包中
4. **签名和验证**: 对扩展包进行数字签名

### 发布策略

1. **开发版本**: 通过GitHub Releases分发
2. **预览版本**: 发布到VS Code扩展市场的预览频道
3. **正式版本**: 发布到VS Code扩展市场
4. **企业版本**: 提供私有部署选项

### 更新机制

- **自动更新**: 通过VS Code扩展市场的自动更新机制
- **增量更新**: 仅更新变更的组件和资源
- **回滚支持**: 提供版本回滚功能
- **变更日志**: 详细的版本变更说明

## 性能优化

### Webview优化

- **懒加载**: 按需加载Web应用组件
- **资源缓存**: 缓存静态资源以提高加载速度
- **内存管理**: 及时释放不使用的Webview实例

### 文件处理优化

- **流式处理**: 对大型小说文件使用流式读取
- **增量解析**: 仅解析文件的变更部分
- **后台处理**: 在后台线程中执行耗时的分析任务

### 通信优化

- **消息批处理**: 批量发送多个消息以减少通信开销
- **压缩传输**: 对大型数据使用压缩传输
- **连接池**: 复用通信连接以提高效率