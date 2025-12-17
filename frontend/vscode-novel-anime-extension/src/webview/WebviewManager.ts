import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewMessage, ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../types';
import { ProjectManager } from '../project/ProjectManager';
import { FileSystemBridge } from '../filesystem/FileSystemBridge';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { MessageHandler } from './MessageHandler';

export class WebviewManager {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];
    private messageHandler: MessageHandler;

    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager,
        private fileSystemBridge: FileSystemBridge,
        private configManager: ConfigurationManager
    ) {
        this.messageHandler = new MessageHandler(
            this.projectManager,
            this.fileSystemBridge,
            this.configManager
        );
    }

    async showWorkflowEditor(): Promise<void> {
        if (this.panel) {
            // 如果面板已存在，显示它
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // 创建新的 webview 面板
        this.panel = vscode.window.createWebviewPanel(
            'novelAnimeWorkflow',
            '小说动漫生成器 - 工作流编辑器',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui'),
                    vscode.Uri.joinPath(this.context.extensionUri, 'assets')
                ]
            }
        );

        // 设置 webview 内容
        this.panel.webview.html = this.getWebviewContent();

        // 处理消息
        this.panel.webview.onDidReceiveMessage(
            this.handleWebviewMessage.bind(this),
            undefined,
            this.disposables
        );

        // 处理面板关闭
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.disposables.forEach(d => d.dispose());
                this.disposables = [];
            },
            null,
            this.disposables
        );

        // 发送初始数据
        await this.sendInitialData();

        console.log('工作流编辑器已打开');
    }

    private getWebviewContent(): string {
        if (!this.panel) {
            return '';
        }

        const webview = this.panel.webview;
        
        // 获取资源URI
        const mainScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'main.js')
        );
        const vueAdapterUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'vue-adapter.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'style.css')
        );
        const vueStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'vue-styles.css')
        );
        const workflowEditorStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'workflow-editor.css')
        );
        const workflowEditorScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'workflow-editor.js')
        );

        // 生成随机 nonce 用于 CSP
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource};">
    <link href="${styleUri}" rel="stylesheet">
    <link href="${vueStyleUri}" rel="stylesheet">
    <link href="${workflowEditorStyleUri}" rel="stylesheet">
    <title>小说动漫生成器 - 工作流编辑器</title>
</head>
<body>
    <div id="app">
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>正在加载小说动漫生成器...</p>
        </div>
    </div>
    
    <script nonce="${nonce}">
        // 获取 VS Code API
        const vscode = acquireVsCodeApi();
        
        // 全局消息处理
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('收到来自扩展的消息:', message);
            
            // 优先使用 Vue 适配器处理消息
            if (window.vueAdapter && window.vueAdapter.handleExtensionMessage) {
                window.vueAdapter.handleExtensionMessage(message);
            } else if (window.handleExtensionMessage) {
                window.handleExtensionMessage(message);
            }
        });
        
        // 发送消息到扩展
        window.sendMessageToExtension = function(message) {
            vscode.postMessage(message);
        };
        
        // 页面加载完成后请求初始数据
        window.addEventListener('load', () => {
            // 等待 Vue 适配器初始化完成
            setTimeout(() => {
                vscode.postMessage({
                    command: 'ready',
                    data: {},
                    timestamp: Date.now()
                });
            }, 100);
        });
        
        // Vue 适配器初始化完成后的回调
        window.onVueAdapterReady = function() {
            console.log('Vue 适配器已就绪');
            
            // 渲染 Vue 应用界面
            const app = document.getElementById('app');
            if (app && window.vueAdapter) {
                app.innerHTML = window.vueAdapter.renderMainLayout();
                app.classList.add('vue-fade-in');
            }
        };
    </script>
    
    <!-- 加载 Vue 桥接器 -->
    <script nonce="${nonce}" src="${this.getVueBridgeUri(webview)}"></script>
    
    <!-- 加载 Vue 适配器 -->
    <script nonce="${nonce}" src="${vueAdapterUri}"></script>
    
    <!-- 加载工作流编辑器 -->
    <script nonce="${nonce}" src="${workflowEditorScriptUri}"></script>
    
    <!-- 加载主脚本 -->
    <script nonce="${nonce}" src="${mainScriptUri}"></script>
    
    <script nonce="${nonce}">
        // 确保 Vue 桥接器初始化后调用回调
        if (window.vueBridge) {
            window.vueBridge.initialize().then(() => {
                if (window.onVueAdapterReady) {
                    window.onVueAdapterReady();
                }
            }).catch(error => {
                console.error('Vue 桥接器初始化失败:', error);
            });
        }
    </script>
</body>
</html>`;
    }

    private async handleWebviewMessage(message: WebviewToExtensionMessage): Promise<void> {
        console.log('收到来自 webview 的消息:', message);

        try {
            // 使用消息处理器处理消息
            const response = await this.messageHandler.handleMessage(message);
            
            if (response) {
                this.sendMessage(response);
            }

            // 处理特殊消息类型
            if (message.command === 'ready') {
                await this.sendInitialData();
            }
        } catch (error) {
            console.error('处理 webview 消息时出错:', error);
            this.sendMessage({
                command: 'error',
                type: 'error',
                data: {
                    message: error instanceof Error ? error.message : String(error),
                    requestId: message.requestId
                },
                timestamp: Date.now()
            });
        }
    }



    private async sendInitialData(): Promise<void> {
        const currentProject = this.projectManager.getCurrentProject();
        
        this.sendMessage({
            command: 'initial-data',
            type: 'project-loaded',
            data: {
                project: currentProject,
                projects: this.projectManager.getProjects(),
                config: vscode.workspace.getConfiguration('novelAnime')
            },
            timestamp: Date.now()
        });
    }

    sendMessage(message: ExtensionToWebviewMessage): void {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    private getVueBridgeUri(webview: vscode.Webview): vscode.Uri {
        return webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'vue-bridge.js')
        );
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
        
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}