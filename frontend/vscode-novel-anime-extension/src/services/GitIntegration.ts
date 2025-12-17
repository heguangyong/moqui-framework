import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectManager } from '../project/ProjectManager';
import { FileSystemBridge } from '../filesystem/FileSystemBridge';

export class GitIntegration {
    private disposables: vscode.Disposable[] = [];
    private gitExtension: any;

    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager,
        private fileSystemBridge: FileSystemBridge
    ) {}

    async register(): Promise<void> {
        // 获取Git扩展
        this.gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        
        if (!this.gitExtension) {
            console.warn('Git扩展未找到，Git集成功能将不可用');
            return;
        }

        // 监听项目创建事件
        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.initGitRepo', this.initializeGitRepository.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.commitChanges', this.commitChanges.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('novelAnime.setupGitLFS', this.setupGitLFS.bind(this))
        );

        console.log('Git集成服务已注册');
    }

    // 初始化Git仓库
    async initializeGitRepository(projectUri?: vscode.Uri): Promise<void> {
        try {
            const targetUri = projectUri || this.projectManager.getCurrentProject()?.rootUri;
            if (!targetUri) {
                vscode.window.showWarningMessage('请先选择或创建一个项目');
                return;
            }

            // 检查是否已经是Git仓库
            const gitDir = vscode.Uri.joinPath(targetUri, '.git');
            if (await this.fileSystemBridge.exists(gitDir)) {
                vscode.window.showInformationMessage('该项目已经是Git仓库');
                return;
            }

            // 初始化Git仓库
            const git = this.gitExtension.getAPI(1);
            await git.init(targetUri);

            // 创建.gitignore文件
            await this.createGitIgnore(targetUri);

            // 创建.gitattributes文件
            await this.createGitAttributes(targetUri);

            // 创建初始提交
            await this.createInitialCommit(targetUri);

            vscode.window.showInformationMessage(
                'Git仓库初始化成功！',
                '查看源代码管理',
                '设置Git LFS'
            ).then(selection => {
                if (selection === '查看源代码管理') {
                    vscode.commands.executeCommand('workbench.view.scm');
                } else if (selection === '设置Git LFS') {
                    this.setupGitLFS(targetUri);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`初始化Git仓库失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 创建.gitignore文件
    private async createGitIgnore(projectUri: vscode.Uri): Promise<void> {
        const gitignoreContent = `# VS Code
.vscode/settings.json
.vscode/launch.json
.vscode/extensions.json

# 操作系统
.DS_Store
Thumbs.db
desktop.ini

# 临时文件
*.tmp
*.temp
*.log
*.cache

# 输出文件
output/
temp/
cache/

# 备份文件
backup/
*.backup
*.bak

# AI模型缓存
.ai-cache/
model-cache/

# 个人配置
.env
.env.local
personal-settings.json

# 大型媒体文件（使用Git LFS）
*.mp4
*.avi
*.mov
*.mkv
*.wav
*.mp3
*.ogg
*.flac
*.png
*.jpg
*.jpeg
*.gif
*.bmp
*.tiff
*.psd
*.ai
*.eps

# 编译输出
dist/
build/
out/

# 依赖
node_modules/
.npm/
.yarn/

# 日志文件
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 运行时数据
pids/
*.pid
*.seed
*.pid.lock

# 覆盖率目录
coverage/
.nyc_output/

# 测试输出
test-results/
test-reports/
`;

        const gitignorePath = vscode.Uri.joinPath(projectUri, '.gitignore');
        await this.fileSystemBridge.writeTextFile(gitignorePath, gitignoreContent);
    }

    // 创建.gitattributes文件
    private async createGitAttributes(projectUri: vscode.Uri): Promise<void> {
        const gitattributesContent = `# 文本文件
*.txt text eol=lf
*.md text eol=lf
*.novel text eol=lf
*.json text eol=lf
*.xml text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# 脚本文件
*.js text eol=lf
*.ts text eol=lf
*.css text eol=lf
*.scss text eol=lf
*.html text eol=lf

# 配置文件
*.config text eol=lf
*.conf text eol=lf
*.ini text eol=lf
*.properties text eol=lf

# Git LFS 跟踪的文件类型
# 视频文件
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
*.mkv filter=lfs diff=lfs merge=lfs -text
*.wmv filter=lfs diff=lfs merge=lfs -text
*.flv filter=lfs diff=lfs merge=lfs -text
*.webm filter=lfs diff=lfs merge=lfs -text

# 音频文件
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.flac filter=lfs diff=lfs merge=lfs -text
*.aac filter=lfs diff=lfs merge=lfs -text
*.wma filter=lfs diff=lfs merge=lfs -text

# 图像文件
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.gif filter=lfs diff=lfs merge=lfs -text
*.bmp filter=lfs diff=lfs merge=lfs -text
*.tiff filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.ai filter=lfs diff=lfs merge=lfs -text
*.eps filter=lfs diff=lfs merge=lfs -text

# 3D模型文件
*.fbx filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.dae filter=lfs diff=lfs merge=lfs -text
*.3ds filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text

# 压缩文件
*.zip filter=lfs diff=lfs merge=lfs -text
*.rar filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text

# 二进制文件
*.exe filter=lfs diff=lfs merge=lfs -text
*.dll filter=lfs diff=lfs merge=lfs -text
*.so filter=lfs diff=lfs merge=lfs -text
*.dylib filter=lfs diff=lfs merge=lfs -text
`;

        const gitattributesPath = vscode.Uri.joinPath(projectUri, '.gitattributes');
        await this.fileSystemBridge.writeTextFile(gitattributesPath, gitattributesContent);
    }

    // 创建初始提交
    private async createInitialCommit(projectUri: vscode.Uri): Promise<void> {
        try {
            const git = this.gitExtension.getAPI(1);
            const repository = git.getRepository(projectUri);
            
            if (repository) {
                // 添加所有文件到暂存区
                await repository.add(['.']);
                
                // 创建初始提交
                const commitMessage = this.generateCommitMessage('initial', {
                    type: 'initial',
                    action: '初始化项目',
                    files: ['项目结构', '配置文件', 'Git设置'],
                    novelFiles: 0,
                    configFiles: 1,
                    assetFiles: 0,
                    workflowFiles: 0
                });
                
                await repository.commit(commitMessage);
                
                console.log('初始提交已创建');
            }
        } catch (error) {
            console.warn('创建初始提交失败:', error);
        }
    }

    // 设置Git LFS
    async setupGitLFS(projectUri?: vscode.Uri): Promise<void> {
        try {
            const targetUri = projectUri || this.projectManager.getCurrentProject()?.rootUri;
            if (!targetUri) {
                vscode.window.showWarningMessage('请先选择一个项目');
                return;
            }

            // 检查Git LFS是否已安装
            const terminal = vscode.window.createTerminal({
                name: 'Git LFS Setup',
                cwd: targetUri.fsPath
            });

            terminal.show();

            // 初始化Git LFS
            terminal.sendText('git lfs install');
            
            // 等待用户确认
            const confirmed = await vscode.window.showInformationMessage(
                'Git LFS正在设置中，请在终端中确认操作完成',
                '完成',
                '取消'
            );

            if (confirmed === '完成') {
                // 跟踪大文件类型
                const lfsTrackCommands = [
                    'git lfs track "*.mp4"',
                    'git lfs track "*.avi"',
                    'git lfs track "*.mov"',
                    'git lfs track "*.wav"',
                    'git lfs track "*.mp3"',
                    'git lfs track "*.png"',
                    'git lfs track "*.jpg"',
                    'git lfs track "*.jpeg"',
                    'git lfs track "*.psd"',
                    'git lfs track "*.ai"'
                ];

                lfsTrackCommands.forEach(command => {
                    terminal.sendText(command);
                });

                // 提交.gitattributes更改
                terminal.sendText('git add .gitattributes');
                terminal.sendText('git commit -m "配置Git LFS跟踪大文件"');

                vscode.window.showInformationMessage('Git LFS设置完成！大型媒体文件将自动使用LFS管理。');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`设置Git LFS失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 智能提交更改
    async commitChanges(): Promise<void> {
        try {
            const currentProject = this.projectManager.getCurrentProject();
            if (!currentProject) {
                vscode.window.showWarningMessage('请先打开一个项目');
                return;
            }

            const git = this.gitExtension.getAPI(1);
            const repository = git.getRepository(currentProject.rootUri);
            
            if (!repository) {
                const initRepo = await vscode.window.showInformationMessage(
                    '该项目还不是Git仓库',
                    '初始化Git仓库',
                    '取消'
                );
                
                if (initRepo === '初始化Git仓库') {
                    await this.initializeGitRepository(currentProject.rootUri);
                }
                return;
            }

            // 获取更改的文件
            const changes = repository.state.workingTreeChanges;
            if (changes.length === 0) {
                vscode.window.showInformationMessage('没有需要提交的更改');
                return;
            }

            // 分析更改类型
            const changeAnalysis = this.analyzeChanges(changes);
            
            // 生成智能提交信息
            const suggestedMessage = this.generateCommitMessage(changeAnalysis.type, changeAnalysis);
            
            // 让用户确认或修改提交信息
            const commitMessage = await vscode.window.showInputBox({
                prompt: '输入提交信息',
                value: suggestedMessage,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '提交信息不能为空';
                    }
                    if (value.length > 100) {
                        return '提交信息不应超过100个字符';
                    }
                    return null;
                }
            });

            if (!commitMessage) {
                return;
            }

            // 添加所有更改到暂存区
            await repository.add(changes.map((change: any) => change.uri.fsPath));
            
            // 提交更改
            await repository.commit(commitMessage.trim());
            
            vscode.window.showInformationMessage(`提交成功: ${commitMessage}`);

        } catch (error) {
            vscode.window.showErrorMessage(`提交失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 分析更改类型
    private analyzeChanges(changes: any[]): ChangeAnalysis {
        const analysis: ChangeAnalysis = {
            type: 'update',
            action: '更新',
            files: [],
            novelFiles: 0,
            configFiles: 0,
            assetFiles: 0,
            workflowFiles: 0
        };

        changes.forEach(change => {
            const fileName = path.basename(change.uri.fsPath);
            const fileExt = path.extname(fileName).toLowerCase();
            const relativePath = path.relative(this.projectManager.getCurrentProject()?.rootUri.fsPath || '', change.uri.fsPath);

            analysis.files.push(fileName);

            // 分类文件类型
            if (['.txt', '.md', '.novel'].includes(fileExt)) {
                analysis.novelFiles++;
            } else if (['.json', '.xml', '.yml', '.yaml', '.config'].includes(fileExt)) {
                analysis.configFiles++;
            } else if (relativePath.startsWith('assets/')) {
                analysis.assetFiles++;
            } else if (relativePath.startsWith('workflows/')) {
                analysis.workflowFiles++;
            }
        });

        // 确定主要更改类型
        if (analysis.novelFiles > 0 && analysis.novelFiles >= analysis.configFiles) {
            analysis.type = 'content';
            analysis.action = '更新小说内容';
        } else if (analysis.workflowFiles > 0) {
            analysis.type = 'workflow';
            analysis.action = '更新工作流配置';
        } else if (analysis.assetFiles > 0) {
            analysis.type = 'assets';
            analysis.action = '更新素材文件';
        } else if (analysis.configFiles > 0) {
            analysis.type = 'config';
            analysis.action = '更新配置';
        }

        return analysis;
    }

    // 生成智能提交信息
    private generateCommitMessage(type: string, analysis: ChangeAnalysis): string {
        const templates: Record<string, string> = {
            'initial': '🎉 初始化项目\n\n- 创建项目结构\n- 配置Git和Git LFS\n- 添加示例文件',
            'content': `📝 ${analysis.action}\n\n- 更新了 ${analysis.novelFiles} 个小说文件`,
            'workflow': `⚙️ ${analysis.action}\n\n- 更新了 ${analysis.workflowFiles} 个工作流文件`,
            'assets': `🎨 ${analysis.action}\n\n- 更新了 ${analysis.assetFiles} 个素材文件`,
            'config': `🔧 ${analysis.action}\n\n- 更新了 ${analysis.configFiles} 个配置文件`,
            'update': `✨ ${analysis.action}\n\n- 更新了 ${analysis.files.length} 个文件`
        };

        let message = templates[type] || templates['update'];

        // 添加文件列表（如果文件不多）
        if (analysis.files.length <= 5) {
            message += '\n\n文件列表:\n' + analysis.files.map(f => `- ${f}`).join('\n');
        }

        return message;
    }

    // 获取Git状态
    async getGitStatus(projectUri: vscode.Uri): Promise<GitStatus | null> {
        try {
            const git = this.gitExtension.getAPI(1);
            const repository = git.getRepository(projectUri);
            
            if (!repository) {
                return null;
            }

            const state = repository.state;
            
            return {
                isRepository: true,
                branch: state.HEAD?.name || 'main',
                hasChanges: state.workingTreeChanges.length > 0,
                hasUncommittedChanges: state.indexChanges.length > 0,
                workingTreeChanges: state.workingTreeChanges.length,
                indexChanges: state.indexChanges.length,
                remotes: repository.state.remotes.map((r: any) => r.name)
            };

        } catch (error) {
            console.warn('获取Git状态失败:', error);
            return null;
        }
    }

    // 创建分支
    async createBranch(branchName: string, projectUri?: vscode.Uri): Promise<void> {
        try {
            const targetUri = projectUri || this.projectManager.getCurrentProject()?.rootUri;
            if (!targetUri) {
                vscode.window.showWarningMessage('请先选择一个项目');
                return;
            }

            const git = this.gitExtension.getAPI(1);
            const repository = git.getRepository(targetUri);
            
            if (!repository) {
                vscode.window.showWarningMessage('该项目不是Git仓库');
                return;
            }

            await repository.createBranch(branchName, true);
            vscode.window.showInformationMessage(`分支 "${branchName}" 创建成功并已切换`);

        } catch (error) {
            vscode.window.showErrorMessage(`创建分支失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}

// 类型定义
interface ChangeAnalysis {
    type: string;
    action: string;
    files: string[];
    novelFiles: number;
    configFiles: number;
    assetFiles: number;
    workflowFiles: number;
}

interface GitStatus {
    isRepository: boolean;
    branch: string;
    hasChanges: boolean;
    hasUncommittedChanges: boolean;
    workingTreeChanges: number;
    indexChanges: number;
    remotes: string[];
}