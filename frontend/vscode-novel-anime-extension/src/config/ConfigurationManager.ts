import * as vscode from 'vscode';
import { ExtensionConfig, AIServiceConfig, OutputSettings, WorkspaceSettings } from '../types';

export class ConfigurationManager {
    private config: ExtensionConfig;

    constructor(private context: vscode.ExtensionContext) {
        this.config = this.loadConfiguration();
    }

    private loadConfiguration(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration('novelAnime');
        
        return {
            aiService: {
                apiKey: config.get<string>('aiService.apiKey', ''),
                endpoint: config.get<string>('aiService.endpoint', 'https://api.zhipuai.cn/api/paas/v4/'),
                model: config.get<string>('aiService.model', 'glm-4')
            },
            outputSettings: {
                videoFormat: config.get<string>('output.videoFormat', 'mp4'),
                resolution: config.get<string>('output.resolution', '1920x1080'),
                frameRate: config.get<number>('output.frameRate', 30),
                quality: 'high'
            },
            workflowTemplates: [],
            shortcuts: [],
            workspace: {
                autoSave: config.get<boolean>('workspace.autoSave', true),
                backupEnabled: config.get<boolean>('workspace.backupEnabled', true),
                backupInterval: 300000, // 5分钟
                maxBackups: 10
            }
        };
    }

    reload(): void {
        this.config = this.loadConfiguration();
        console.log('配置已重新加载');
    }

    getConfig(): ExtensionConfig {
        return { ...this.config };
    }

    getAIServiceConfig(): AIServiceConfig {
        return { ...this.config.aiService };
    }

    getOutputSettings(): OutputSettings {
        return { ...this.config.outputSettings };
    }

    getWorkspaceSettings(): WorkspaceSettings {
        return { ...this.config.workspace };
    }

    async updateAIServiceConfig(config: Partial<AIServiceConfig>): Promise<void> {
        const vsConfig = vscode.workspace.getConfiguration('novelAnime');
        
        if (config.apiKey !== undefined) {
            await vsConfig.update('aiService.apiKey', config.apiKey, vscode.ConfigurationTarget.Global);
        }
        if (config.endpoint !== undefined) {
            await vsConfig.update('aiService.endpoint', config.endpoint, vscode.ConfigurationTarget.Global);
        }
        if (config.model !== undefined) {
            await vsConfig.update('aiService.model', config.model, vscode.ConfigurationTarget.Global);
        }

        this.reload();
    }

    async updateOutputSettings(settings: Partial<OutputSettings>): Promise<void> {
        const vsConfig = vscode.workspace.getConfiguration('novelAnime');
        
        if (settings.videoFormat !== undefined) {
            await vsConfig.update('output.videoFormat', settings.videoFormat, vscode.ConfigurationTarget.Workspace);
        }
        if (settings.resolution !== undefined) {
            await vsConfig.update('output.resolution', settings.resolution, vscode.ConfigurationTarget.Workspace);
        }
        if (settings.frameRate !== undefined) {
            await vsConfig.update('output.frameRate', settings.frameRate, vscode.ConfigurationTarget.Workspace);
        }

        this.reload();
    }

    async validateAIServiceConfig(): Promise<boolean> {
        const aiConfig = this.getAIServiceConfig();
        
        if (!aiConfig.apiKey || aiConfig.apiKey.trim().length === 0) {
            vscode.window.showWarningMessage(
                'AI服务API密钥未配置',
                '打开设置'
            ).then(selection => {
                if (selection === '打开设置') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'novelAnime.aiService.apiKey');
                }
            });
            return false;
        }

        if (!aiConfig.endpoint || aiConfig.endpoint.trim().length === 0) {
            vscode.window.showWarningMessage(
                'AI服务端点未配置',
                '打开设置'
            ).then(selection => {
                if (selection === '打开设置') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'novelAnime.aiService.endpoint');
                }
            });
            return false;
        }

        // 这里可以添加实际的API连接测试
        try {
            // 模拟API连接测试
            console.log('验证AI服务配置:', aiConfig.endpoint, aiConfig.model);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`AI服务连接失败: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    getConfigurationValue<T>(section: string, defaultValue: T): T {
        return vscode.workspace.getConfiguration('novelAnime').get<T>(section, defaultValue);
    }

    async setConfigurationValue(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        await vscode.workspace.getConfiguration('novelAnime').update(section, value, target);
        this.reload();
    }

    onConfigurationChanged(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('novelAnime')) {
                this.reload();
                callback(e);
            }
        });
    }

    dispose(): void {
        // 清理资源
    }
}