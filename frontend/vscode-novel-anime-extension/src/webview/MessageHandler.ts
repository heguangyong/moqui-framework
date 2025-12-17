import * as vscode from 'vscode';
import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '../types';
import { ProjectManager } from '../project/ProjectManager';
import { FileSystemBridge } from '../filesystem/FileSystemBridge';
import { ConfigurationManager } from '../config/ConfigurationManager';

export class MessageHandler {
    private requestHandlers: Map<string, (message: WebviewToExtensionMessage) => Promise<any>> = new Map();

    constructor(
        private projectManager: ProjectManager,
        private fileSystemBridge: FileSystemBridge,
        private configManager: ConfigurationManager
    ) {
        this.registerHandlers();
    }

    private registerHandlers(): void {
        // 文件操作处理器
        this.requestHandlers.set('save-file', this.handleSaveFile.bind(this));
        this.requestHandlers.set('read-file', this.handleReadFile.bind(this));
        this.requestHandlers.set('delete-file', this.handleDeleteFile.bind(this));
        this.requestHandlers.set('list-files', this.handleListFiles.bind(this));

        // 项目操作处理器
        this.requestHandlers.set('create-project', this.handleCreateProject.bind(this));
        this.requestHandlers.set('load-project', this.handleLoadProject.bind(this));
        this.requestHandlers.set('update-project', this.handleUpdateProject.bind(this));
        this.requestHandlers.set('get-project-info', this.handleGetProjectInfo.bind(this));

        // 工作流操作处理器
        this.requestHandlers.set('run-workflow', this.handleRunWorkflow.bind(this));
        this.requestHandlers.set('save-workflow', this.handleSaveWorkflow.bind(this));
        this.requestHandlers.set('load-workflow', this.handleLoadWorkflow.bind(this));
        this.requestHandlers.set('validate-workflow', this.handleValidateWorkflow.bind(this));

        // 配置操作处理器
        this.requestHandlers.set('get-config', this.handleGetConfig.bind(this));
        this.requestHandlers.set('update-config', this.handleUpdateConfig.bind(this));
        this.requestHandlers.set('validate-ai-config', this.handleValidateAIConfig.bind(this));

        // 角色和内容处理器
        this.requestHandlers.set('update-character', this.handleUpdateCharacter.bind(this));
        this.requestHandlers.set('analyze-novel', this.handleAnalyzeNovel.bind(this));
        this.requestHandlers.set('generate-script', this.handleGenerateScript.bind(this));

        // 素材管理处理器
        this.requestHandlers.set('upload-asset', this.handleUploadAsset.bind(this));
        this.requestHandlers.set('search-assets', this.handleSearchAssets.bind(this));
        this.requestHandlers.set('delete-asset', this.handleDeleteAsset.bind(this));

        console.log(`已注册 ${this.requestHandlers.size} 个消息处理器`);
    }

    async handleMessage(message: WebviewToExtensionMessage): Promise<ExtensionToWebviewMessage | null> {
        const handler = this.requestHandlers.get(message.type);
        
        if (!handler) {
            console.warn(`未找到消息类型 "${message.type}" 的处理器`);
            return this.createErrorResponse(message, `未知的消息类型: ${message.type}`);
        }

        try {
            console.log(`处理消息: ${message.type}`, message.data);
            const result = await handler(message);
            
            return {
                command: `${message.type}-response`,
                type: 'config-updated',
                data: result,
                requestId: message.requestId,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`处理消息 "${message.type}" 时出错:`, error);
            return this.createErrorResponse(message, error instanceof Error ? error.message : String(error));
        }
    }

    private createErrorResponse(originalMessage: WebviewToExtensionMessage, errorMessage: string): ExtensionToWebviewMessage {
        return {
            command: 'error',
            type: 'error',
            data: {
                message: errorMessage,
                originalType: originalMessage.type,
                requestId: originalMessage.requestId
            },
            requestId: originalMessage.requestId,
            timestamp: Date.now()
        };
    }

    // 文件操作处理器
    private async handleSaveFile(message: WebviewToExtensionMessage): Promise<any> {
        const { filePath, content, encoding = 'utf8' } = message.data;
        
        if (!filePath || content === undefined) {
            throw new Error('保存文件需要 filePath 和 content 参数');
        }

        const uri = vscode.Uri.file(filePath);
        await this.fileSystemBridge.writeTextFile(uri, content);

        return { success: true, filePath };
    }

    private async handleReadFile(message: WebviewToExtensionMessage): Promise<any> {
        const { filePath } = message.data;
        
        if (!filePath) {
            throw new Error('读取文件需要 filePath 参数');
        }

        const uri = vscode.Uri.file(filePath);
        const content = await this.fileSystemBridge.readTextFile(uri);

        return { content, filePath };
    }

    private async handleDeleteFile(message: WebviewToExtensionMessage): Promise<any> {
        const { filePath } = message.data;
        
        if (!filePath) {
            throw new Error('删除文件需要 filePath 参数');
        }

        const uri = vscode.Uri.file(filePath);
        await this.fileSystemBridge.deleteFile(uri);

        return { success: true, filePath };
    }

    private async handleListFiles(message: WebviewToExtensionMessage): Promise<any> {
        const { directoryPath, pattern } = message.data;
        
        if (!directoryPath) {
            throw new Error('列出文件需要 directoryPath 参数');
        }

        const uri = vscode.Uri.file(directoryPath);
        const files = await this.fileSystemBridge.listDirectory(uri);

        return { files, directoryPath };
    }

    // 项目操作处理器
    private async handleCreateProject(message: WebviewToExtensionMessage): Promise<any> {
        const { name, location } = message.data;
        
        if (!name) {
            throw new Error('创建项目需要项目名称');
        }

        const locationUri = location ? vscode.Uri.file(location) : 
            (vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(process.cwd()));

        const project = await this.projectManager.createProject(name, locationUri);

        return { project };
    }

    private async handleLoadProject(message: WebviewToExtensionMessage): Promise<any> {
        const { projectPath } = message.data;
        
        if (!projectPath) {
            throw new Error('加载项目需要 projectPath 参数');
        }

        const uri = vscode.Uri.file(projectPath);
        const project = await this.projectManager.loadProject(uri);

        return { project };
    }

    private async handleUpdateProject(message: WebviewToExtensionMessage): Promise<any> {
        const { projectId, updates } = message.data;
        
        if (!projectId || !updates) {
            throw new Error('更新项目需要 projectId 和 updates 参数');
        }

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject || currentProject.id !== projectId) {
            throw new Error('项目未找到或不是当前项目');
        }

        // 更新项目配置
        Object.assign(currentProject.config, updates);
        
        // 保存配置文件
        await this.fileSystemBridge.writeJsonFile(currentProject.configPath, currentProject.config);

        return { project: currentProject };
    }

    private async handleGetProjectInfo(message: WebviewToExtensionMessage): Promise<any> {
        const currentProject = this.projectManager.getCurrentProject();
        const projects = this.projectManager.getProjects();

        return {
            currentProject,
            projects,
            hasActiveProject: currentProject !== null
        };
    }

    // 工作流操作处理器
    private async handleRunWorkflow(message: WebviewToExtensionMessage): Promise<any> {
        const { workflowConfig } = message.data;
        
        if (!workflowConfig) {
            throw new Error('运行工作流需要 workflowConfig 参数');
        }

        console.log('开始执行工作流:', workflowConfig.name);

        // 这里将实现实际的工作流执行逻辑
        // 目前返回模拟结果
        return {
            workflowId: workflowConfig.id,
            status: 'started',
            message: '工作流开始执行'
        };
    }

    private async handleSaveWorkflow(message: WebviewToExtensionMessage): Promise<any> {
        const { workflow } = message.data;
        
        if (!workflow) {
            throw new Error('保存工作流需要 workflow 参数');
        }

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject) {
            throw new Error('没有活动项目');
        }

        const workflowPath = vscode.Uri.joinPath(
            currentProject.rootUri, 
            'workflows', 
            `${workflow.id}.json`
        );

        await this.fileSystemBridge.writeJsonFile(workflowPath, workflow);

        return { success: true, workflowPath: workflowPath.fsPath };
    }

    private async handleLoadWorkflow(message: WebviewToExtensionMessage): Promise<any> {
        const { workflowId } = message.data;
        
        if (!workflowId) {
            throw new Error('加载工作流需要 workflowId 参数');
        }

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject) {
            throw new Error('没有活动项目');
        }

        const workflowPath = vscode.Uri.joinPath(
            currentProject.rootUri, 
            'workflows', 
            `${workflowId}.json`
        );

        const workflow = await this.fileSystemBridge.readJsonFile(workflowPath);

        return { workflow };
    }

    private async handleValidateWorkflow(message: WebviewToExtensionMessage): Promise<any> {
        const { workflow } = message.data;
        
        if (!workflow) {
            throw new Error('验证工作流需要 workflow 参数');
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        // 基本验证
        if (!workflow.name || workflow.name.trim().length === 0) {
            errors.push('工作流名称不能为空');
        }

        if (!workflow.nodes || workflow.nodes.length === 0) {
            warnings.push('工作流没有节点');
        }

        // 节点验证
        if (workflow.nodes) {
            workflow.nodes.forEach((node: any, index: number) => {
                if (!node.id) {
                    errors.push(`节点 ${index + 1} 缺少 ID`);
                }
                if (!node.type) {
                    errors.push(`节点 ${index + 1} 缺少类型`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // 配置操作处理器
    private async handleGetConfig(message: WebviewToExtensionMessage): Promise<any> {
        const currentProject = this.projectManager.getCurrentProject();
        const extensionConfig = this.configManager.getConfig();

        return {
            project: currentProject,
            extensionConfig,
            aiServiceConfig: this.configManager.getAIServiceConfig(),
            outputSettings: this.configManager.getOutputSettings()
        };
    }

    private async handleUpdateConfig(message: WebviewToExtensionMessage): Promise<any> {
        const { configType, updates } = message.data;
        
        if (!configType || !updates) {
            throw new Error('更新配置需要 configType 和 updates 参数');
        }

        switch (configType) {
            case 'aiService':
                await this.configManager.updateAIServiceConfig(updates);
                break;
            case 'output':
                await this.configManager.updateOutputSettings(updates);
                break;
            default:
                throw new Error(`未知的配置类型: ${configType}`);
        }

        return { success: true, configType };
    }

    private async handleValidateAIConfig(message: WebviewToExtensionMessage): Promise<any> {
        const isValid = await this.configManager.validateAIServiceConfig();
        const config = this.configManager.getAIServiceConfig();

        return {
            isValid,
            config,
            message: isValid ? 'AI服务配置有效' : 'AI服务配置无效'
        };
    }

    // 角色和内容处理器
    private async handleUpdateCharacter(message: WebviewToExtensionMessage): Promise<any> {
        const { character } = message.data;
        
        if (!character) {
            throw new Error('更新角色需要 character 参数');
        }

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject) {
            throw new Error('没有活动项目');
        }

        // 更新或添加角色
        const existingIndex = currentProject.config.characters.findIndex(c => c.id === character.id);
        if (existingIndex >= 0) {
            currentProject.config.characters[existingIndex] = character;
        } else {
            currentProject.config.characters.push(character);
        }

        // 保存项目配置
        await this.fileSystemBridge.writeJsonFile(currentProject.configPath, currentProject.config);

        return { character, success: true };
    }

    private async handleAnalyzeNovel(message: WebviewToExtensionMessage): Promise<any> {
        const { filePath } = message.data;
        
        if (!filePath) {
            throw new Error('分析小说需要 filePath 参数');
        }

        const uri = vscode.Uri.file(filePath);
        const content = await this.fileSystemBridge.readTextFile(uri);

        // 这里将实现实际的小说分析逻辑
        // 目前返回模拟结果
        const analysis = {
            chapters: this.extractChapters(content),
            characters: this.extractCharacters(content),
            scenes: this.extractScenes(content),
            wordCount: content.length,
            estimatedReadingTime: Math.ceil(content.length / 1000) // 假设每分钟1000字
        };

        return { analysis, filePath };
    }

    private async handleGenerateScript(message: WebviewToExtensionMessage): Promise<any> {
        const { novelContent, options = {} } = message.data;
        
        if (!novelContent) {
            throw new Error('生成脚本需要 novelContent 参数');
        }

        // 这里将实现实际的脚本生成逻辑
        // 目前返回模拟结果
        const script = {
            scenes: [
                {
                    id: 'scene_1',
                    title: '开场',
                    description: '故事开始的场景',
                    dialogue: ['角色A: "你好，世界！"', '角色B: "很高兴见到你。"'],
                    actions: ['角色A走向角色B', '两人握手']
                }
            ],
            characters: ['角色A', '角色B'],
            estimatedDuration: '5分钟'
        };

        return { script, options };
    }

    // 素材管理处理器
    private async handleUploadAsset(message: WebviewToExtensionMessage): Promise<any> {
        const { assetData, assetType, fileName } = message.data;
        
        if (!assetData || !fileName) {
            throw new Error('上传素材需要 assetData 和 fileName 参数');
        }

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject) {
            throw new Error('没有活动项目');
        }

        const assetsDir = vscode.Uri.joinPath(currentProject.rootUri, 'assets');
        const assetPath = vscode.Uri.joinPath(assetsDir, fileName);

        // 确保素材目录存在
        await this.fileSystemBridge.ensureDirectory(assetsDir);

        // 保存素材文件（这里需要根据实际数据格式处理）
        await this.fileSystemBridge.writeFile(assetPath, Buffer.from(assetData, 'base64'));

        return {
            success: true,
            assetPath: assetPath.fsPath,
            fileName,
            assetType
        };
    }

    private async handleSearchAssets(message: WebviewToExtensionMessage): Promise<any> {
        const { query, assetType, limit = 50 } = message.data;

        const currentProject = this.projectManager.getCurrentProject();
        if (!currentProject) {
            throw new Error('没有活动项目');
        }

        const assetsDir = vscode.Uri.joinPath(currentProject.rootUri, 'assets');
        
        try {
            const files = await this.fileSystemBridge.listDirectory(assetsDir);
            
            // 简单的文件名搜索
            let filteredFiles = files;
            if (query) {
                filteredFiles = files.filter(([name]) => 
                    name.toLowerCase().includes(query.toLowerCase())
                );
            }

            if (assetType) {
                filteredFiles = filteredFiles.filter(([name]) => {
                    const ext = name.split('.').pop()?.toLowerCase();
                    switch (assetType) {
                        case 'image':
                            return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '');
                        case 'audio':
                            return ['mp3', 'wav', 'ogg', 'aac'].includes(ext || '');
                        case 'video':
                            return ['mp4', 'avi', 'mov', 'mkv'].includes(ext || '');
                        default:
                            return true;
                    }
                });
            }

            const assets = filteredFiles.slice(0, limit).map(([name, type]) => ({
                name,
                type: type === vscode.FileType.Directory ? 'directory' : 'file',
                path: vscode.Uri.joinPath(assetsDir, name).fsPath
            }));

            return { assets, query, assetType };
        } catch (error) {
            return { assets: [], query, assetType };
        }
    }

    private async handleDeleteAsset(message: WebviewToExtensionMessage): Promise<any> {
        const { assetPath } = message.data;
        
        if (!assetPath) {
            throw new Error('删除素材需要 assetPath 参数');
        }

        const uri = vscode.Uri.file(assetPath);
        await this.fileSystemBridge.deleteFile(uri);

        return { success: true, assetPath };
    }

    // 辅助方法
    private extractChapters(content: string): any[] {
        const chapters: any[] = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const chapterMatch = line.match(/^第(.+)章\s*(.*)$/);
            if (chapterMatch) {
                chapters.push({
                    id: `chapter_${chapters.length + 1}`,
                    title: line.trim(),
                    lineNumber: index + 1,
                    content: chapterMatch[2] || ''
                });
            }
        });

        return chapters;
    }

    private extractCharacters(content: string): any[] {
        const characters: any[] = [];
        const characterNames = new Set<string>();
        const lines = content.split('\n');

        lines.forEach(line => {
            const match = line.match(/^([^\s：]+)：/);
            if (match) {
                characterNames.add(match[1]);
            }
        });

        characterNames.forEach(name => {
            characters.push({
                id: `character_${characters.length + 1}`,
                name,
                description: `角色：${name}`,
                traits: []
            });
        });

        return characters;
    }

    private extractScenes(content: string): any[] {
        const scenes: any[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const sceneMatch = line.match(/\[场景：([^\]]+)\]/);
            if (sceneMatch) {
                scenes.push({
                    id: `scene_${scenes.length + 1}`,
                    description: sceneMatch[1],
                    lineNumber: index + 1
                });
            }
        });

        return scenes;
    }
}