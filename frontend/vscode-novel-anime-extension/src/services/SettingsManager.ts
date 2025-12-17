import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { ProjectManager } from '../project/ProjectManager';

export class SettingsManager {
    private disposables: vscode.Disposable[] = [];
    private settingsPanel: vscode.WebviewPanel | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private configManager: ConfigurationManager,
        private projectManager: ProjectManager
    ) {}

    async register(): Promise<void> {
        // 注册设置相关命令
        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.openSettings', this.openSettingsPanel.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.resetSettings', this.resetSettings.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.exportSettings', this.exportSettings.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.importSettings', this.importSettings.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.validateAIConfig', this.validateAIConfiguration.bind(this))
        );

        // 监听配置变化
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this))
        );

        console.log('设置管理器已注册');
    }

    // 打开设置面板
    async openSettingsPanel(): Promise<void> {
        if (this.settingsPanel) {
            this.settingsPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.settingsPanel = vscode.window.createWebviewPanel(
            'novelAnimeSettings',
            '小说动漫生成器 - 设置',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui')
                ]
            }
        );

        this.settingsPanel.webview.html = this.getSettingsWebviewContent();

        // 处理来自webview的消息
        this.settingsPanel.webview.onDidReceiveMessage(
            this.handleSettingsMessage.bind(this),
            undefined,
            this.disposables
        );

        // 处理面板关闭
        this.settingsPanel.onDidDispose(
            () => {
                this.settingsPanel = undefined;
            },
            null,
            this.disposables
        );

        // 发送初始设置数据
        await this.sendSettingsData();
    }

    // 生成设置页面HTML
    private getSettingsWebviewContent(): string {
        const webview = this.settingsPanel!.webview;
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'vue-styles.css')
        );

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline';">
    <link href="${styleUri}" rel="stylesheet">
    <title>小说动漫生成器设置</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .settings-container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .settings-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .settings-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        
        .settings-description {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .settings-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 20px 0;
            color: var(--vscode-foreground);
        }
        
        .setting-group {
            margin-bottom: 25px;
            padding: 20px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
        }
        
        .setting-label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        
        .setting-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .setting-input,
        .setting-select,
        .setting-textarea {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            color: var(--vscode-input-foreground);
            font-size: 14px;
            font-family: inherit;
            box-sizing: border-box;
        }
        
        .setting-input:focus,
        .setting-select:focus,
        .setting-textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .setting-textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .setting-checkbox {
            margin-right: 8px;
        }
        
        .checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: normal;
        }
        
        .setting-buttons {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .validation-status {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .validation-success {
            background-color: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .validation-error {
            background-color: rgba(244, 67, 54, 0.1);
            color: #F44336;
            border: 1px solid rgba(244, 67, 54, 0.3);
        }
        
        .workflow-template-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background-color: var(--vscode-list-inactiveSelectionBackground);
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .template-info {
            flex: 1;
        }
        
        .template-name {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .template-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .template-actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-small {
            padding: 4px 8px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <div class="settings-header">
            <h1 class="settings-title">小说动漫生成器设置</h1>
            <p class="settings-description">配置AI服务、工作流模板和扩展行为</p>
        </div>

        <!-- AI服务配置 -->
        <div class="settings-section">
            <h2 class="section-title">🤖 AI服务配置</h2>
            
            <div class="setting-group">
                <label class="setting-label" for="ai-provider">AI服务提供商</label>
                <p class="setting-description">选择用于文本生成和图像处理的AI服务</p>
                <select class="setting-select" id="ai-provider">
                    <option value="zhipu">智谱AI (GLM-4)</option>
                    <option value="openai">OpenAI (GPT-4)</option>
                    <option value="claude">Anthropic (Claude)</option>
                    <option value="local">本地模型</option>
                </select>
            </div>

            <div class="setting-group">
                <label class="setting-label" for="ai-api-key">API密钥</label>
                <p class="setting-description">输入您的AI服务API密钥，将安全存储在本地</p>
                <input type="password" class="setting-input" id="ai-api-key" placeholder="输入API密钥">
                <div class="setting-buttons">
                    <button class="btn btn-primary" onclick="validateAIConfig()">验证配置</button>
                    <button class="btn btn-secondary" onclick="clearAPIKey()">清除密钥</button>
                </div>
                <div id="ai-validation-status" class="validation-status" style="display: none;"></div>
            </div>

            <div class="setting-group">
                <label class="setting-label" for="ai-endpoint">API端点</label>
                <p class="setting-description">自定义API端点URL（可选）</p>
                <input type="url" class="setting-input" id="ai-endpoint" placeholder="https://api.example.com/v1">
            </div>

            <div class="setting-group">
                <label class="setting-label" for="ai-model">模型选择</label>
                <p class="setting-description">选择用于不同任务的AI模型</p>
                <select class="setting-select" id="ai-model">
                    <option value="glm-4">GLM-4 (通用)</option>
                    <option value="glm-4v">GLM-4V (视觉)</option>
                    <option value="glm-4-plus">GLM-4-Plus (增强)</option>
                </select>
            </div>
        </div>

        <!-- 输出设置 -->
        <div class="settings-section">
            <h2 class="section-title">🎬 输出设置</h2>
            
            <div class="setting-group">
                <label class="setting-label" for="output-resolution">视频分辨率</label>
                <p class="setting-description">生成视频的分辨率设置</p>
                <select class="setting-select" id="output-resolution">
                    <option value="1920x1080">1920x1080 (Full HD)</option>
                    <option value="1280x720">1280x720 (HD)</option>
                    <option value="3840x2160">3840x2160 (4K)</option>
                    <option value="custom">自定义</option>
                </select>
            </div>

            <div class="setting-group">
                <label class="setting-label" for="output-fps">帧率</label>
                <p class="setting-description">视频帧率设置</p>
                <select class="setting-select" id="output-fps">
                    <option value="24">24 FPS (电影标准)</option>
                    <option value="30">30 FPS (标准)</option>
                    <option value="60">60 FPS (高帧率)</option>
                </select>
            </div>

            <div class="setting-group">
                <label class="setting-label" for="output-format">输出格式</label>
                <p class="setting-description">生成文件的格式</p>
                <select class="setting-select" id="output-format">
                    <option value="mp4">MP4 (推荐)</option>
                    <option value="avi">AVI</option>
                    <option value="mov">MOV</option>
                    <option value="mkv">MKV</option>
                </select>
            </div>

            <div class="setting-group">
                <label class="setting-label" for="output-quality">视频质量</label>
                <p class="setting-description">平衡文件大小和视频质量</p>
                <select class="setting-select" id="output-quality">
                    <option value="high">高质量 (大文件)</option>
                    <option value="medium">中等质量 (平衡)</option>
                    <option value="low">低质量 (小文件)</option>
                </select>
            </div>
        </div>

        <!-- 工作流模板 -->
        <div class="settings-section">
            <h2 class="section-title">⚙️ 工作流模板</h2>
            
            <div class="setting-group">
                <label class="setting-label">已保存的模板</label>
                <p class="setting-description">管理您的工作流模板，可以导出分享或导入他人的模板</p>
                
                <div id="workflow-templates">
                    <!-- 模板列表将在这里动态生成 -->
                </div>
                
                <div class="setting-buttons">
                    <button class="btn btn-primary" onclick="createTemplate()">创建新模板</button>
                    <button class="btn btn-secondary" onclick="importTemplate()">导入模板</button>
                </div>
            </div>
        </div>

        <!-- 扩展行为 -->
        <div class="settings-section">
            <h2 class="section-title">🔧 扩展行为</h2>
            
            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" class="setting-checkbox" id="auto-save">
                    自动保存项目
                </label>
                <p class="setting-description">编辑时自动保存项目文件</p>
            </div>

            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" class="setting-checkbox" id="auto-backup">
                    自动备份
                </label>
                <p class="setting-description">定期创建项目备份</p>
            </div>

            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" class="setting-checkbox" id="smart-suggestions">
                    智能建议
                </label>
                <p class="setting-description">启用AI驱动的写作建议</p>
            </div>

            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" class="setting-checkbox" id="telemetry">
                    发送使用统计
                </label>
                <p class="setting-description">帮助改进扩展（不包含个人内容）</p>
            </div>
        </div>

        <!-- 快捷键设置 -->
        <div class="settings-section">
            <h2 class="section-title">⌨️ 快捷键</h2>
            
            <div class="setting-group">
                <label class="setting-label">自定义快捷键</label>
                <p class="setting-description">为常用功能设置快捷键</p>
                
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>创建新项目</span>
                        <code>Ctrl+Shift+N</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>打开工作流编辑器</span>
                        <code>Ctrl+Shift+W</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>解析小说</span>
                        <code>Ctrl+Shift+P</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>生成视频</span>
                        <code>Ctrl+Shift+G</code>
                    </div>
                </div>
                
                <button class="btn btn-secondary" onclick="openKeybindingSettings()">
                    自定义快捷键
                </button>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="settings-section">
            <div class="setting-buttons">
                <button class="btn btn-primary" onclick="saveSettings()">保存设置</button>
                <button class="btn btn-secondary" onclick="resetSettings()">重置为默认</button>
                <button class="btn btn-secondary" onclick="exportSettings()">导出设置</button>
                <button class="btn btn-secondary" onclick="importSettings()">导入设置</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentSettings = {};

        // 接收来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'settings-data':
                    currentSettings = message.data;
                    loadSettings(message.data);
                    break;
                case 'validation-result':
                    showValidationResult(message.data);
                    break;
                case 'workflow-templates':
                    loadWorkflowTemplates(message.data);
                    break;
            }
        });

        // 加载设置到界面
        function loadSettings(settings) {
            document.getElementById('ai-provider').value = settings.aiProvider || 'zhipu';
            document.getElementById('ai-api-key').value = settings.aiApiKey || '';
            document.getElementById('ai-endpoint').value = settings.aiEndpoint || '';
            document.getElementById('ai-model').value = settings.aiModel || 'glm-4';
            
            document.getElementById('output-resolution').value = settings.outputResolution || '1920x1080';
            document.getElementById('output-fps').value = settings.outputFps || '24';
            document.getElementById('output-format').value = settings.outputFormat || 'mp4';
            document.getElementById('output-quality').value = settings.outputQuality || 'high';
            
            document.getElementById('auto-save').checked = settings.autoSave !== false;
            document.getElementById('auto-backup').checked = settings.autoBackup !== false;
            document.getElementById('smart-suggestions').checked = settings.smartSuggestions !== false;
            document.getElementById('telemetry').checked = settings.telemetry === true;
        }

        // 保存设置
        function saveSettings() {
            const settings = {
                aiProvider: document.getElementById('ai-provider').value,
                aiApiKey: document.getElementById('ai-api-key').value,
                aiEndpoint: document.getElementById('ai-endpoint').value,
                aiModel: document.getElementById('ai-model').value,
                
                outputResolution: document.getElementById('output-resolution').value,
                outputFps: document.getElementById('output-fps').value,
                outputFormat: document.getElementById('output-format').value,
                outputQuality: document.getElementById('output-quality').value,
                
                autoSave: document.getElementById('auto-save').checked,
                autoBackup: document.getElementById('auto-backup').checked,
                smartSuggestions: document.getElementById('smart-suggestions').checked,
                telemetry: document.getElementById('telemetry').checked
            };

            vscode.postMessage({
                command: 'save-settings',
                data: settings
            });
        }

        // 验证AI配置
        function validateAIConfig() {
            const provider = document.getElementById('ai-provider').value;
            const apiKey = document.getElementById('ai-api-key').value;
            const endpoint = document.getElementById('ai-endpoint').value;

            vscode.postMessage({
                command: 'validate-ai-config',
                data: { provider, apiKey, endpoint }
            });
        }

        // 显示验证结果
        function showValidationResult(result) {
            const statusDiv = document.getElementById('ai-validation-status');
            statusDiv.style.display = 'block';
            
            if (result.isValid) {
                statusDiv.className = 'validation-status validation-success';
                statusDiv.textContent = '✓ AI配置验证成功';
            } else {
                statusDiv.className = 'validation-status validation-error';
                statusDiv.textContent = '✗ ' + result.error;
            }
        }

        // 清除API密钥
        function clearAPIKey() {
            document.getElementById('ai-api-key').value = '';
        }

        // 重置设置
        function resetSettings() {
            vscode.postMessage({ command: 'reset-settings' });
        }

        // 导出设置
        function exportSettings() {
            vscode.postMessage({ command: 'export-settings' });
        }

        // 导入设置
        function importSettings() {
            vscode.postMessage({ command: 'import-settings' });
        }

        // 打开快捷键设置
        function openKeybindingSettings() {
            vscode.postMessage({ command: 'open-keybinding-settings' });
        }

        // 工作流模板相关
        function loadWorkflowTemplates(templates) {
            const container = document.getElementById('workflow-templates');
            container.innerHTML = '';
            
            templates.forEach(template => {
                const item = document.createElement('div');
                item.className = 'workflow-template-item';
                item.innerHTML = \`
                    <div class="template-info">
                        <div class="template-name">\${template.name}</div>
                        <div class="template-description">\${template.description}</div>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-small btn-secondary" onclick="exportTemplate('\${template.id}')">导出</button>
                        <button class="btn btn-small btn-secondary" onclick="deleteTemplate('\${template.id}')">删除</button>
                    </div>
                \`;
                container.appendChild(item);
            });
        }

        function createTemplate() {
            vscode.postMessage({ command: 'create-template' });
        }

        function importTemplate() {
            vscode.postMessage({ command: 'import-template' });
        }

        function exportTemplate(templateId) {
            vscode.postMessage({ command: 'export-template', data: { templateId } });
        }

        function deleteTemplate(templateId) {
            vscode.postMessage({ command: 'delete-template', data: { templateId } });
        }

        // 页面加载完成后请求设置数据
        vscode.postMessage({ command: 'get-settings' });
    </script>
</body>
</html>`;
    }

    // 处理设置消息
    private async handleSettingsMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'get-settings':
                await this.sendSettingsData();
                break;

            case 'save-settings':
                await this.saveSettings(message.data);
                break;

            case 'validate-ai-config':
                await this.validateAIConfig(message.data);
                break;

            case 'reset-settings':
                await this.resetSettings();
                break;

            case 'export-settings':
                await this.exportSettings();
                break;

            case 'import-settings':
                await this.importSettings();
                break;

            case 'open-keybinding-settings':
                await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
                break;

            case 'create-template':
                await this.createWorkflowTemplate();
                break;

            case 'import-template':
                await this.importWorkflowTemplate();
                break;

            case 'export-template':
                await this.exportWorkflowTemplate(message.data.templateId);
                break;

            case 'delete-template':
                await this.deleteWorkflowTemplate(message.data.templateId);
                break;
        }
    }

    // 发送设置数据
    private async sendSettingsData(): Promise<void> {
        if (!this.settingsPanel) return;

        const config = vscode.workspace.getConfiguration('novelAnime');
        const settings = {
            aiProvider: config.get('ai.provider', 'zhipu'),
            aiApiKey: config.get('ai.apiKey', ''),
            aiEndpoint: config.get('ai.endpoint', ''),
            aiModel: config.get('ai.model', 'glm-4'),
            
            outputResolution: config.get('output.resolution', '1920x1080'),
            outputFps: config.get('output.fps', 24),
            outputFormat: config.get('output.format', 'mp4'),
            outputQuality: config.get('output.quality', 'high'),
            
            autoSave: config.get('behavior.autoSave', true),
            autoBackup: config.get('behavior.autoBackup', true),
            smartSuggestions: config.get('behavior.smartSuggestions', true),
            telemetry: config.get('behavior.telemetry', false)
        };

        this.settingsPanel.webview.postMessage({
            command: 'settings-data',
            data: settings
        });
    }

    // 保存设置
    private async saveSettings(settings: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('novelAnime');
        
        await config.update('ai.provider', settings.aiProvider, vscode.ConfigurationTarget.Global);
        await config.update('ai.apiKey', settings.aiApiKey, vscode.ConfigurationTarget.Global);
        await config.update('ai.endpoint', settings.aiEndpoint, vscode.ConfigurationTarget.Global);
        await config.update('ai.model', settings.aiModel, vscode.ConfigurationTarget.Global);
        
        await config.update('output.resolution', settings.outputResolution, vscode.ConfigurationTarget.Global);
        await config.update('output.fps', parseInt(settings.outputFps), vscode.ConfigurationTarget.Global);
        await config.update('output.format', settings.outputFormat, vscode.ConfigurationTarget.Global);
        await config.update('output.quality', settings.outputQuality, vscode.ConfigurationTarget.Global);
        
        await config.update('behavior.autoSave', settings.autoSave, vscode.ConfigurationTarget.Global);
        await config.update('behavior.autoBackup', settings.autoBackup, vscode.ConfigurationTarget.Global);
        await config.update('behavior.smartSuggestions', settings.smartSuggestions, vscode.ConfigurationTarget.Global);
        await config.update('behavior.telemetry', settings.telemetry, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage('设置已保存');
    }

    // 验证AI配置
    private async validateAIConfig(config: any): Promise<void> {
        if (!this.settingsPanel) return;

        try {
            const isValid = await this.configManager.validateAIServiceConfig();
            
            this.settingsPanel.webview.postMessage({
                command: 'validation-result',
                data: {
                    isValid,
                    error: isValid ? null : 'API密钥无效或网络连接失败'
                }
            });
        } catch (error) {
            this.settingsPanel.webview.postMessage({
                command: 'validation-result',
                data: {
                    isValid: false,
                    error: error instanceof Error ? error.message : '验证失败'
                }
            });
        }
    }

    // 重置设置
    private async resetSettings(): Promise<void> {
        const confirmed = await vscode.window.showWarningMessage(
            '确定要重置所有设置为默认值吗？',
            '确定',
            '取消'
        );

        if (confirmed === '确定') {
            const config = vscode.workspace.getConfiguration('novelAnime');
            
            // 重置所有设置
            await config.update('ai.provider', undefined, vscode.ConfigurationTarget.Global);
            await config.update('ai.apiKey', undefined, vscode.ConfigurationTarget.Global);
            await config.update('ai.endpoint', undefined, vscode.ConfigurationTarget.Global);
            await config.update('ai.model', undefined, vscode.ConfigurationTarget.Global);
            
            await config.update('output.resolution', undefined, vscode.ConfigurationTarget.Global);
            await config.update('output.fps', undefined, vscode.ConfigurationTarget.Global);
            await config.update('output.format', undefined, vscode.ConfigurationTarget.Global);
            await config.update('output.quality', undefined, vscode.ConfigurationTarget.Global);
            
            await config.update('behavior.autoSave', undefined, vscode.ConfigurationTarget.Global);
            await config.update('behavior.autoBackup', undefined, vscode.ConfigurationTarget.Global);
            await config.update('behavior.smartSuggestions', undefined, vscode.ConfigurationTarget.Global);
            await config.update('behavior.telemetry', undefined, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage('设置已重置为默认值');
            await this.sendSettingsData();
        }
    }

    // 导出设置
    private async exportSettings(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('novelAnime');
            const settings = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                settings: {
                    ai: {
                        provider: config.get('ai.provider'),
                        endpoint: config.get('ai.endpoint'),
                        model: config.get('ai.model')
                        // 不导出API密钥
                    },
                    output: {
                        resolution: config.get('output.resolution'),
                        fps: config.get('output.fps'),
                        format: config.get('output.format'),
                        quality: config.get('output.quality')
                    },
                    behavior: {
                        autoSave: config.get('behavior.autoSave'),
                        autoBackup: config.get('behavior.autoBackup'),
                        smartSuggestions: config.get('behavior.smartSuggestions'),
                        telemetry: config.get('behavior.telemetry')
                    }
                }
            };

            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('novel-anime-settings.json'),
                filters: {
                    'JSON文件': ['json']
                }
            });

            if (saveUri) {
                await vscode.workspace.fs.writeFile(
                    saveUri,
                    Buffer.from(JSON.stringify(settings, null, 2), 'utf8')
                );
                
                vscode.window.showInformationMessage('设置已导出');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`导出设置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 导入设置
    private async importSettings(): Promise<void> {
        try {
            const openUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON文件': ['json']
                }
            });

            if (!openUri || openUri.length === 0) {
                return;
            }

            const content = await vscode.workspace.fs.readFile(openUri[0]);
            const importedSettings = JSON.parse(content.toString());

            if (!importedSettings.settings) {
                vscode.window.showErrorMessage('无效的设置文件格式');
                return;
            }

            const config = vscode.workspace.getConfiguration('novelAnime');
            const settings = importedSettings.settings;

            // 导入设置
            if (settings.ai) {
                await config.update('ai.provider', settings.ai.provider, vscode.ConfigurationTarget.Global);
                await config.update('ai.endpoint', settings.ai.endpoint, vscode.ConfigurationTarget.Global);
                await config.update('ai.model', settings.ai.model, vscode.ConfigurationTarget.Global);
            }

            if (settings.output) {
                await config.update('output.resolution', settings.output.resolution, vscode.ConfigurationTarget.Global);
                await config.update('output.fps', settings.output.fps, vscode.ConfigurationTarget.Global);
                await config.update('output.format', settings.output.format, vscode.ConfigurationTarget.Global);
                await config.update('output.quality', settings.output.quality, vscode.ConfigurationTarget.Global);
            }

            if (settings.behavior) {
                await config.update('behavior.autoSave', settings.behavior.autoSave, vscode.ConfigurationTarget.Global);
                await config.update('behavior.autoBackup', settings.behavior.autoBackup, vscode.ConfigurationTarget.Global);
                await config.update('behavior.smartSuggestions', settings.behavior.smartSuggestions, vscode.ConfigurationTarget.Global);
                await config.update('behavior.telemetry', settings.behavior.telemetry, vscode.ConfigurationTarget.Global);
            }

            vscode.window.showInformationMessage('设置已导入');
            await this.sendSettingsData();

        } catch (error) {
            vscode.window.showErrorMessage(`导入设置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 验证AI配置
    private async validateAIConfiguration(): Promise<void> {
        try {
            const isValid = await this.configManager.validateAIServiceConfig();
            
            if (isValid) {
                vscode.window.showInformationMessage('✓ AI服务配置有效');
            } else {
                vscode.window.showWarningMessage('✗ AI服务配置无效，请检查API密钥和网络连接');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`验证AI配置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 工作流模板管理
    private async createWorkflowTemplate(): Promise<void> {
        const templateName = await vscode.window.showInputBox({
            prompt: '输入模板名称',
            placeHolder: '我的工作流模板'
        });

        if (templateName) {
            // 这里将实现创建模板的逻辑
            vscode.window.showInformationMessage(`模板 "${templateName}" 创建成功`);
        }
    }

    private async importWorkflowTemplate(): Promise<void> {
        // 实现导入工作流模板
        vscode.window.showInformationMessage('工作流模板导入功能');
    }

    private async exportWorkflowTemplate(templateId: string): Promise<void> {
        // 实现导出工作流模板
        vscode.window.showInformationMessage(`导出模板: ${templateId}`);
    }

    private async deleteWorkflowTemplate(templateId: string): Promise<void> {
        const confirmed = await vscode.window.showWarningMessage(
            '确定要删除这个模板吗？',
            '删除',
            '取消'
        );

        if (confirmed === '删除') {
            // 实现删除模板逻辑
            vscode.window.showInformationMessage(`模板已删除: ${templateId}`);
        }
    }

    // 配置变化处理
    private onConfigurationChanged(e: vscode.ConfigurationChangeEvent): void {
        if (e.affectsConfiguration('novelAnime')) {
            console.log('小说动漫生成器配置已更改');
            
            // 如果设置面板打开，更新显示
            if (this.settingsPanel) {
                this.sendSettingsData();
            }
        }
    }

    dispose(): void {
        if (this.settingsPanel) {
            this.settingsPanel.dispose();
        }
        
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}