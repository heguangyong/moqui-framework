import * as vscode from 'vscode';
import { WebviewManager } from './webview/WebviewManager';
import { ProjectManager } from './project/ProjectManager';
import { FileSystemBridge } from './filesystem/FileSystemBridge';
import { NovelLanguageService } from './language/NovelLanguageService';
import { ConfigurationManager } from './config/ConfigurationManager';
import { CommandManager } from './commands/CommandManager';
import { WritingAssistant } from './services/WritingAssistant';
import { GitIntegration } from './services/GitIntegration';
import { SettingsManager } from './services/SettingsManager';

let webviewManager: WebviewManager;
let projectManager: ProjectManager;
let fileSystemBridge: FileSystemBridge;
let languageService: NovelLanguageService;
let configManager: ConfigurationManager;
let commandManager: CommandManager;
let writingAssistant: WritingAssistant;
let gitIntegration: GitIntegration;
let settingsManager: SettingsManager;

export async function activate(context: vscode.ExtensionContext) {
    console.log('小说动漫生成器扩展正在激活...');

    // 初始化核心组件
    configManager = new ConfigurationManager(context);
    fileSystemBridge = new FileSystemBridge(context);
    projectManager = new ProjectManager(context, fileSystemBridge);
    webviewManager = new WebviewManager(context, projectManager, fileSystemBridge, configManager);
    languageService = new NovelLanguageService(context, projectManager);
    commandManager = new CommandManager(context, webviewManager, projectManager);
    writingAssistant = new WritingAssistant(context, projectManager);
    gitIntegration = new GitIntegration(context, projectManager, fileSystemBridge);
    settingsManager = new SettingsManager(context, configManager, projectManager);

    // 注册所有组件
    await registerComponents(context);

    // 设置状态栏
    updateStatusBar();

    // 监听配置变化
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('novelAnime')) {
                configManager.reload();
                updateStatusBar();
            }
        })
    );

    // 监听工作区变化
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            projectManager.refreshProjects();
        })
    );

    console.log('小说动漫生成器扩展已激活');
}

async function registerComponents(context: vscode.ExtensionContext) {
    // 注册命令管理器
    await commandManager.register();

    // 注册语言服务
    await languageService.register();

    // 注册写作辅助
    await writingAssistant.register();

    // 注册Git集成
    await gitIntegration.register();

    // 注册设置管理器
    await settingsManager.register();

    // 注册文件系统监听器
    await fileSystemBridge.register();

    // 注册项目管理器
    await projectManager.register();

    // 设置上下文变量
    await vscode.commands.executeCommand('setContext', 'novelAnime.activated', true);
}

function updateStatusBar() {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    
    const activeProject = projectManager.getCurrentProject();
    if (activeProject) {
        statusBarItem.text = `$(movie) ${activeProject.name}`;
        statusBarItem.tooltip = `当前项目: ${activeProject.name}`;
        statusBarItem.command = 'novelAnime.openWorkflow';
        vscode.commands.executeCommand('setContext', 'novelAnime.hasActiveProject', true);
    } else {
        statusBarItem.text = '$(movie) 小说动漫生成器';
        statusBarItem.tooltip = '点击创建新项目';
        statusBarItem.command = 'novelAnime.createProject';
        vscode.commands.executeCommand('setContext', 'novelAnime.hasActiveProject', false);
    }
    
    statusBarItem.show();
}

export function deactivate() {
    console.log('小说动漫生成器扩展正在停用...');
    
    // 清理资源
    if (webviewManager) {
        webviewManager.dispose();
    }
    if (languageService) {
        languageService.dispose();
    }
    if (fileSystemBridge) {
        fileSystemBridge.dispose();
    }
    if (projectManager) {
        projectManager.dispose();
    }
    if (writingAssistant) {
        writingAssistant.dispose();
    }
    if (gitIntegration) {
        gitIntegration.dispose();
    }
    if (settingsManager) {
        settingsManager.dispose();
    }
    
    console.log('小说动漫生成器扩展已停用');
}