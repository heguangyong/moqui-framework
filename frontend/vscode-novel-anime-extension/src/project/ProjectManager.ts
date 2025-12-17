import * as vscode from 'vscode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NovelAnimeProject, ProjectConfig, Character, Chapter } from '../types';
import { FileSystemBridge } from '../filesystem/FileSystemBridge';

interface ExportOptions {
    includeAssets?: boolean;
    includeBackups?: boolean;
    includeOutput?: boolean;
    format?: 'zip' | 'folder';
}

interface ProjectStatistics {
    totalFiles: number;
    novelFiles: number;
    characterFiles: number;
    assetFiles: number;
    workflowFiles: number;
    totalSize: number;
    lastModified: Date;
    wordCount: number;
    characterCount: number;
}

export class ProjectManager {
    private currentProject: NovelAnimeProject | null = null;
    private projects: NovelAnimeProject[] = [];
    private disposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private fileSystemBridge: FileSystemBridge
    ) {}

    async register(): Promise<void> {
        // 监听工作区变化
        this.disposables.push(
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                this.refreshProjects();
            })
        );

        // 初始化时扫描现有项目
        await this.refreshProjects();

        console.log('项目管理器已注册');
    }

    async createProject(name: string, location: vscode.Uri): Promise<NovelAnimeProject> {
        const projectId = uuidv4();
        const projectFolderName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_]/g, '-');
        const projectUri = vscode.Uri.joinPath(location, projectFolderName);

        try {
            // 创建项目文件夹结构
            await this.createProjectStructure(projectUri);

            // 创建项目配置
            const config: ProjectConfig = {
                version: '1.0.0',
                name: name,
                description: `${name} - 小说动漫生成项目`,
                settings: {
                    defaultLanguage: 'zh-CN',
                    outputDirectory: 'output',
                    backupEnabled: true,
                    autoSave: true,
                    aiService: {
                        apiKey: '',
                        endpoint: 'https://api.zhipuai.cn/api/paas/v4/',
                        model: 'glm-4'
                    }
                },
                characters: [],
                chapters: []
            };

            // 保存项目配置
            const configPath = vscode.Uri.joinPath(projectUri, 'novel-anime.config.json');
            await this.fileSystemBridge.writeFile(
                configPath,
                Buffer.from(JSON.stringify(config, null, 2), 'utf8')
            );

            // 创建项目对象
            const project: NovelAnimeProject = {
                id: projectId,
                name: name,
                rootUri: projectUri,
                configPath: configPath,
                config: config,
                novels: [],
                assets: [],
                workflows: [],
                createdAt: new Date(),
                lastModified: new Date()
            };

            // 添加到项目列表
            this.projects.push(project);
            this.currentProject = project;

            // 更新上下文
            await this.updateContext();

            // 如果当前没有工作区，打开项目文件夹
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                const openInNewWindow = await vscode.window.showInformationMessage(
                    `项目 "${name}" 创建成功！`,
                    '在当前窗口打开',
                    '在新窗口打开'
                );

                if (openInNewWindow) {
                    const newWindow = openInNewWindow === '在新窗口打开';
                    await vscode.commands.executeCommand('vscode.openFolder', projectUri, newWindow);
                }
            }

            console.log(`项目创建成功: ${name} at ${projectUri.fsPath}`);
            return project;

        } catch (error) {
            throw new Error(`创建项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async loadProject(uri: vscode.Uri): Promise<NovelAnimeProject> {
        try {
            // 查找配置文件
            const configPath = vscode.Uri.joinPath(uri, 'novel-anime.config.json');
            
            let configExists = false;
            try {
                await vscode.workspace.fs.stat(configPath);
                configExists = true;
            } catch {
                // 配置文件不存在
            }

            if (!configExists) {
                throw new Error('所选文件夹不是有效的小说动漫项目（缺少配置文件）');
            }

            // 读取配置文件
            const configData = await this.fileSystemBridge.readFile(configPath);
            const config: ProjectConfig = JSON.parse(configData.toString());

            // 创建项目对象
            const project: NovelAnimeProject = {
                id: uuidv4(),
                name: config.name,
                rootUri: uri,
                configPath: configPath,
                config: config,
                novels: [],
                assets: [],
                workflows: [],
                createdAt: new Date(),
                lastModified: new Date()
            };

            // 扫描项目文件
            await this.scanProjectFiles(project);

            // 添加到项目列表（如果不存在）
            const existingIndex = this.projects.findIndex(p => p.rootUri.fsPath === uri.fsPath);
            if (existingIndex >= 0) {
                this.projects[existingIndex] = project;
            } else {
                this.projects.push(project);
            }

            this.currentProject = project;
            await this.updateContext();

            console.log(`项目加载成功: ${project.name} from ${uri.fsPath}`);
            return project;

        } catch (error) {
            throw new Error(`加载项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async switchProject(project: NovelAnimeProject): Promise<void> {
        // 保存当前项目状态
        if (this.currentProject) {
            await this.saveProjectState(this.currentProject);
        }
        
        this.currentProject = project;
        
        // 加载新项目状态
        await this.loadProjectState(project);
        
        await this.updateContext();
        console.log(`切换到项目: ${project.name}`);
    }

    async deleteProject(project: NovelAnimeProject, deleteFiles: boolean = false): Promise<void> {
        try {
            // 从项目列表中移除
            const index = this.projects.findIndex(p => p.id === project.id);
            if (index >= 0) {
                this.projects.splice(index, 1);
            }

            // 如果是当前项目，切换到其他项目
            if (this.currentProject?.id === project.id) {
                this.currentProject = this.projects.length > 0 ? this.projects[0] : null;
            }

            // 删除文件（如果请求）
            if (deleteFiles) {
                await this.fileSystemBridge.deleteFile(project.rootUri);
            }

            await this.updateContext();
            console.log(`项目已删除: ${project.name}`);
        } catch (error) {
            throw new Error(`删除项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async duplicateProject(project: NovelAnimeProject, newName: string, location?: vscode.Uri): Promise<NovelAnimeProject> {
        try {
            const targetLocation = location || vscode.Uri.joinPath(project.rootUri, '..');
            const newProjectFolderName = newName.replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_]/g, '-');
            const newProjectUri = vscode.Uri.joinPath(targetLocation, newProjectFolderName);

            // 复制整个项目文件夹
            await this.fileSystemBridge.copyFile(project.rootUri, newProjectUri);

            // 更新配置文件
            const newConfigPath = vscode.Uri.joinPath(newProjectUri, 'novel-anime.config.json');
            const newConfig = { ...project.config };
            newConfig.name = newName;
            newConfig.description = `${newName} - 复制自 ${project.name}`;

            await this.fileSystemBridge.writeJsonFile(newConfigPath, newConfig);

            // 加载新项目
            const newProject = await this.loadProject(newProjectUri);
            
            console.log(`项目复制成功: ${newName}`);
            return newProject;
        } catch (error) {
            throw new Error(`复制项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async exportProject(project: NovelAnimeProject, exportPath: vscode.Uri, options: ExportOptions = {}): Promise<void> {
        try {
            const {
                includeAssets = true,
                includeBackups = false,
                includeOutput = false,
                format = 'zip'
            } = options;

            // 创建临时导出目录
            const tempDir = vscode.Uri.joinPath(exportPath, `${project.name}-export-temp`);
            await this.fileSystemBridge.ensureDirectory(tempDir);

            // 复制项目文件
            const filesToCopy = await this.getProjectFiles(project, {
                includeAssets,
                includeBackups,
                includeOutput
            });

            for (const file of filesToCopy) {
                const relativePath = path.relative(project.rootUri.fsPath, file.fsPath);
                const targetPath = vscode.Uri.joinPath(tempDir, relativePath);
                
                await this.fileSystemBridge.ensureDirectory(vscode.Uri.joinPath(targetPath, '..'));
                await this.fileSystemBridge.copyFile(file, targetPath);
            }

            // 创建导出包
            if (format === 'zip') {
                // 这里需要实现ZIP压缩功能
                console.log('ZIP导出功能需要额外实现');
            }

            console.log(`项目导出成功: ${project.name}`);
        } catch (error) {
            throw new Error(`导出项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async importProject(importPath: vscode.Uri, targetLocation: vscode.Uri): Promise<NovelAnimeProject> {
        try {
            // 检查导入文件类型
            const fileName = path.basename(importPath.fsPath);
            
            if (fileName.endsWith('.zip')) {
                // 解压ZIP文件
                console.log('ZIP导入功能需要额外实现');
                throw new Error('ZIP导入功能暂未实现');
            } else {
                // 直接复制文件夹
                const projectName = path.basename(importPath.fsPath);
                const targetUri = vscode.Uri.joinPath(targetLocation, projectName);
                
                await this.fileSystemBridge.copyFile(importPath, targetUri);
                return await this.loadProject(targetUri);
            }
        } catch (error) {
            throw new Error(`导入项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getProjectStatistics(project: NovelAnimeProject): Promise<ProjectStatistics> {
        try {
            const stats: ProjectStatistics = {
                totalFiles: 0,
                novelFiles: 0,
                characterFiles: 0,
                assetFiles: 0,
                workflowFiles: 0,
                totalSize: 0,
                lastModified: project.lastModified,
                wordCount: 0,
                characterCount: project.config.characters.length
            };

            // 扫描所有文件
            const allFiles = await this.getAllProjectFiles(project);
            
            for (const file of allFiles) {
                const stat = await vscode.workspace.fs.stat(file);
                stats.totalSize += stat.size;
                stats.totalFiles++;

                const fileName = path.basename(file.fsPath);
                const ext = path.extname(fileName).toLowerCase();
                const relativePath = path.relative(project.rootUri.fsPath, file.fsPath);

                if (relativePath.startsWith('novels/')) {
                    stats.novelFiles++;
                    
                    // 计算字数
                    if (['.txt', '.md'].includes(ext)) {
                        try {
                            const content = await this.fileSystemBridge.readTextFile(file);
                            stats.wordCount += this.countWords(content);
                        } catch {
                            // 忽略读取错误
                        }
                    }
                } else if (relativePath.startsWith('characters/')) {
                    stats.characterFiles++;
                } else if (relativePath.startsWith('assets/')) {
                    stats.assetFiles++;
                } else if (relativePath.startsWith('workflows/')) {
                    stats.workflowFiles++;
                }
            }

            return stats;
        } catch (error) {
            throw new Error(`获取项目统计失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async saveProjectState(project: NovelAnimeProject): Promise<void> {
        try {
            const statePath = vscode.Uri.joinPath(project.rootUri, '.vscode', 'novel-anime-state.json');
            const state = {
                lastOpened: new Date(),
                openFiles: [], // 这里可以保存打开的文件列表
                workflowState: {}, // 工作流状态
                uiState: {} // UI状态
            };

            await this.fileSystemBridge.ensureDirectory(vscode.Uri.joinPath(statePath, '..'));
            await this.fileSystemBridge.writeJsonFile(statePath, state);
        } catch (error) {
            console.warn(`保存项目状态失败: ${error}`);
        }
    }

    private async loadProjectState(project: NovelAnimeProject): Promise<void> {
        try {
            const statePath = vscode.Uri.joinPath(project.rootUri, '.vscode', 'novel-anime-state.json');
            const state = await this.fileSystemBridge.readJsonFile(statePath);
            
            // 恢复项目状态
            console.log('项目状态已恢复:', state);
        } catch (error) {
            // 状态文件不存在或读取失败，使用默认状态
            console.log('使用默认项目状态');
        }
    }

    private async getProjectFiles(project: NovelAnimeProject, options: {
        includeAssets: boolean;
        includeBackups: boolean;
        includeOutput: boolean;
    }): Promise<vscode.Uri[]> {
        const files: vscode.Uri[] = [];
        const folders = ['novels', 'characters', 'workflows'];
        
        if (options.includeAssets) folders.push('assets');
        if (options.includeBackups) folders.push('backup');
        if (options.includeOutput) folders.push('output');

        for (const folder of folders) {
            const folderUri = vscode.Uri.joinPath(project.rootUri, folder);
            try {
                const folderFiles = await this.fileSystemBridge.findFiles('*', folderUri);
                files.push(...folderFiles);
            } catch {
                // 文件夹不存在，跳过
            }
        }

        // 添加配置文件
        files.push(project.configPath);
        
        // 添加README文件
        const readmePath = vscode.Uri.joinPath(project.rootUri, 'README.md');
        if (await this.fileSystemBridge.exists(readmePath)) {
            files.push(readmePath);
        }

        return files;
    }

    private async getAllProjectFiles(project: NovelAnimeProject): Promise<vscode.Uri[]> {
        return await this.fileSystemBridge.findFiles('*', project.rootUri, 1000);
    }

    private countWords(text: string): number {
        // 简单的中英文字数统计
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        return chineseChars + englishWords;
    }

    getCurrentProject(): NovelAnimeProject | null {
        return this.currentProject;
    }

    getProjects(): NovelAnimeProject[] {
        return [...this.projects];
    }

    async refreshProjects(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this.projects = [];
            this.currentProject = null;
            await this.updateContext();
            return;
        }

        const foundProjects: NovelAnimeProject[] = [];

        for (const folder of workspaceFolders) {
            try {
                const project = await this.loadProject(folder.uri);
                foundProjects.push(project);
            } catch {
                // 不是有效的项目文件夹，忽略
            }
        }

        this.projects = foundProjects;
        
        // 如果当前项目不在列表中，选择第一个项目
        if (!this.currentProject || !foundProjects.find(p => p.id === this.currentProject?.id)) {
            this.currentProject = foundProjects.length > 0 ? foundProjects[0] : null;
        }

        await this.updateContext();
        console.log(`刷新项目列表，找到 ${foundProjects.length} 个项目`);
    }

    private async createProjectStructure(projectUri: vscode.Uri): Promise<void> {
        const folders = [
            'novels',      // 小说文件
            'characters',  // 角色定义
            'assets',      // 素材文件
            'assets/images',
            'assets/audio',
            'assets/models',
            'workflows',   // 工作流配置
            'output',      // 生成的视频
            'backup'       // 备份文件
        ];

        // 创建主项目文件夹
        await vscode.workspace.fs.createDirectory(projectUri);

        // 创建子文件夹
        for (const folder of folders) {
            const folderUri = vscode.Uri.joinPath(projectUri, folder);
            await vscode.workspace.fs.createDirectory(folderUri);
        }

        // 创建示例文件
        await this.createExampleFiles(projectUri);
    }

    private async createExampleFiles(projectUri: vscode.Uri): Promise<void> {
        // 创建示例小说文件
        const exampleNovelPath = vscode.Uri.joinPath(projectUri, 'novels', 'example.txt');
        const exampleNovelContent = `第一章 开始

这是一个示例小说文件。

主角：小明，一个普通的高中生。
配角：小红，小明的同学。

"你好，小红。"小明说道。
"你好，小明。"小红回答。

[场景：学校教室，上午]

故事就这样开始了...

第二章 发展

故事继续发展...
`;

        await this.fileSystemBridge.writeFile(
            exampleNovelPath,
            Buffer.from(exampleNovelContent, 'utf8')
        );

        // 创建README文件
        const readmePath = vscode.Uri.joinPath(projectUri, 'README.md');
        const readmeContent = `# 小说动漫生成项目

这是一个使用小说动漫生成器创建的项目。

## 文件夹结构

- \`novels/\` - 小说文件
- \`characters/\` - 角色定义
- \`assets/\` - 素材文件
- \`workflows/\` - 工作流配置
- \`output/\` - 生成的视频
- \`backup/\` - 备份文件

## 使用方法

1. 在 \`novels/\` 文件夹中编写你的小说
2. 使用命令面板中的"解析小说"功能分析内容
3. 在工作流编辑器中配置生成参数
4. 运行工作流生成动画视频

## 快速开始

- 按 \`Ctrl+Shift+P\` 打开命令面板
- 输入"小说动漫生成器"查看所有可用命令
- 编辑 \`novels/example.txt\` 开始创作

祝你创作愉快！
`;

        await this.fileSystemBridge.writeFile(
            readmePath,
            Buffer.from(readmeContent, 'utf8')
        );
    }

    private async scanProjectFiles(project: NovelAnimeProject): Promise<void> {
        try {
            // 扫描小说文件
            const novelsFolder = vscode.Uri.joinPath(project.rootUri, 'novels');
            try {
                const novelFiles = await vscode.workspace.fs.readDirectory(novelsFolder);
                // 这里可以添加实际的文件扫描逻辑
                console.log(`扫描到 ${novelFiles.length} 个文件在 novels 文件夹`);
            } catch {
                // novels 文件夹不存在
            }

            // 扫描素材文件
            const assetsFolder = vscode.Uri.joinPath(project.rootUri, 'assets');
            try {
                const assetFiles = await vscode.workspace.fs.readDirectory(assetsFolder);
                console.log(`扫描到 ${assetFiles.length} 个文件在 assets 文件夹`);
            } catch {
                // assets 文件夹不存在
            }

        } catch (error) {
            console.warn(`扫描项目文件失败: ${error}`);
        }
    }

    private async updateContext(): Promise<void> {
        const hasProjects = this.projects.length > 0;
        const hasActiveProject = this.currentProject !== null;

        await vscode.commands.executeCommand('setContext', 'novelAnime.hasProjects', hasProjects);
        await vscode.commands.executeCommand('setContext', 'novelAnime.hasActiveProject', hasActiveProject);
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}