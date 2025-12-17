import * as vscode from 'vscode';
import { WebviewManager } from '../webview/WebviewManager';
import { ProjectManager } from '../project/ProjectManager';

export class CommandManager {
    private disposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private webviewManager: WebviewManager,
        private projectManager: ProjectManager
    ) {}

    async register(): Promise<void> {
        // 注册所有命令
        this.registerCommand('novelAnime.createProject', this.createProject.bind(this));
        this.registerCommand('novelAnime.openProject', this.openProject.bind(this));
        this.registerCommand('novelAnime.openWorkflow', this.openWorkflow.bind(this));
        this.registerCommand('novelAnime.parseNovel', this.parseNovel.bind(this));
        this.registerCommand('novelAnime.generateVideo', this.generateVideo.bind(this));
        this.registerCommand('novelAnime.showSettings', this.showSettings.bind(this));
        this.registerCommand('novelAnime.generateChapterTitle', this.generateChapterTitle.bind(this));
        this.registerCommand('novelAnime.optimizeDialogue', this.optimizeDialogue.bind(this));

        console.log('命令管理器已注册所有命令');
    }

    private registerCommand(command: string, callback: (...args: any[]) => any): void {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.disposables.push(disposable);
        this.context.subscriptions.push(disposable);
    }

    private async createProject(): Promise<void> {
        try {
            const projectName = await vscode.window.showInputBox({
                prompt: '请输入项目名称',
                placeHolder: '我的小说项目',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '项目名称不能为空';
                    }
                    if (!/^[a-zA-Z0-9\u4e00-\u9fff\-_\s]+$/.test(value)) {
                        return '项目名称只能包含字母、数字、中文、连字符和下划线';
                    }
                    return null;
                }
            });

            if (!projectName) {
                return;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            let targetFolder: vscode.Uri;

            if (workspaceFolders && workspaceFolders.length > 0) {
                // 在当前工作区创建项目
                targetFolder = workspaceFolders[0].uri;
            } else {
                // 选择项目位置
                const folderUri = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectFiles: false,
                    canSelectMany: false,
                    openLabel: '选择项目位置'
                });

                if (!folderUri || folderUri.length === 0) {
                    return;
                }

                targetFolder = folderUri[0];
            }

            // 创建项目
            const project = await this.projectManager.createProject(projectName.trim(), targetFolder);
            
            vscode.window.showInformationMessage(
                `项目 "${project.name}" 创建成功！`,
                '打开工作流编辑器'
            ).then(selection => {
                if (selection === '打开工作流编辑器') {
                    this.openWorkflow();
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`创建项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async openProject(): Promise<void> {
        try {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: '选择项目文件夹'
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            const project = await this.projectManager.loadProject(folderUri[0]);
            
            vscode.window.showInformationMessage(
                `项目 "${project.name}" 已加载`,
                '打开工作流编辑器'
            ).then(selection => {
                if (selection === '打开工作流编辑器') {
                    this.openWorkflow();
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`打开项目失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async openWorkflow(): Promise<void> {
        try {
            const currentProject = this.projectManager.getCurrentProject();
            if (!currentProject) {
                const action = await vscode.window.showWarningMessage(
                    '请先创建或打开一个项目',
                    '创建新项目',
                    '打开现有项目'
                );

                if (action === '创建新项目') {
                    await this.createProject();
                } else if (action === '打开现有项目') {
                    await this.openProject();
                }
                return;
            }

            // 打开工作流编辑器
            await this.webviewManager.showWorkflowEditor();

        } catch (error) {
            vscode.window.showErrorMessage(`打开工作流编辑器失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async parseNovel(uri?: vscode.Uri): Promise<void> {
        try {
            let targetUri = uri;
            
            if (!targetUri) {
                // 获取当前活动编辑器的文件
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    targetUri = activeEditor.document.uri;
                } else {
                    vscode.window.showWarningMessage('请选择要解析的小说文件');
                    return;
                }
            }

            // 检查文件类型
            const fileExtension = targetUri.path.toLowerCase().split('.').pop();
            if (!['txt', 'md', 'novel'].includes(fileExtension || '')) {
                vscode.window.showWarningMessage('只支持 .txt、.md 和 .novel 格式的文件');
                return;
            }

            // 显示进度
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '正在解析小说...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: '读取文件内容...' });
                
                // 这里将调用实际的解析逻辑
                await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟处理时间
                progress.report({ increment: 50, message: '分析章节结构...' });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                progress.report({ increment: 30, message: '识别角色信息...' });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                progress.report({ increment: 20, message: '完成解析' });
            });

            vscode.window.showInformationMessage('小说解析完成！');

        } catch (error) {
            vscode.window.showErrorMessage(`解析小说失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async generateVideo(uri?: vscode.Uri): Promise<void> {
        try {
            const currentProject = this.projectManager.getCurrentProject();
            if (!currentProject) {
                vscode.window.showWarningMessage('请先创建或打开一个项目');
                return;
            }

            let targetUri = uri;
            if (!targetUri) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    targetUri = activeEditor.document.uri;
                } else {
                    vscode.window.showWarningMessage('请选择要生成视频的小说文件');
                    return;
                }
            }

            // 确认生成参数
            const options = await vscode.window.showQuickPick([
                {
                    label: '$(play) 快速生成',
                    description: '使用默认设置快速生成视频',
                    detail: '1080p, 30fps, MP4格式'
                },
                {
                    label: '$(settings-gear) 自定义设置',
                    description: '打开工作流编辑器进行详细配置',
                    detail: '可调整分辨率、帧率、AI模型等参数'
                }
            ], {
                placeHolder: '选择生成方式'
            });

            if (!options) {
                return;
            }

            if (options.label.includes('自定义设置')) {
                await this.openWorkflow();
                return;
            }

            // 开始生成视频
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '正在生成动画视频...',
                cancellable: true
            }, async (progress, token) => {
                const steps = [
                    '解析小说内容...',
                    '分析角色和场景...',
                    '生成分镜脚本...',
                    '创建视觉素材...',
                    '渲染视频帧...',
                    '合成最终视频...'
                ];

                for (let i = 0; i < steps.length; i++) {
                    if (token.isCancellationRequested) {
                        vscode.window.showWarningMessage('视频生成已取消');
                        return;
                    }

                    progress.report({ 
                        increment: 100 / steps.length, 
                        message: steps[i] 
                    });
                    
                    // 模拟处理时间
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            });

            const outputPath = vscode.Uri.joinPath(currentProject.rootUri, 'output', 'generated_video.mp4');
            
            vscode.window.showInformationMessage(
                '视频生成完成！',
                '打开输出文件夹',
                '预览视频'
            ).then(selection => {
                if (selection === '打开输出文件夹') {
                    vscode.commands.executeCommand('revealFileInOS', outputPath);
                } else if (selection === '预览视频') {
                    vscode.env.openExternal(outputPath);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`生成视频失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async showSettings(): Promise<void> {
        try {
            // 打开扩展设置
            await vscode.commands.executeCommand('workbench.action.openSettings', 'novelAnime');
        } catch (error) {
            vscode.window.showErrorMessage(`打开设置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async generateChapterTitle(uri: vscode.Uri, range: vscode.Range): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const chapterContent = document.getText(range);
            
            // 这里将调用 WritingAssistant 的方法生成标题建议
            const suggestions = [
                '新的开始',
                '意外的相遇', 
                '命运的转折',
                '重要的决定',
                '真相大白'
            ];

            const selectedTitle = await vscode.window.showQuickPick(suggestions, {
                placeHolder: '选择章节标题',
                canPickMany: false
            });

            if (selectedTitle) {
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(range.start.line);
                const chapterMatch = line.text.match(/^(第.+章)\s*(.*)/);
                
                if (chapterMatch) {
                    const newTitle = `${chapterMatch[1]} ${selectedTitle}`;
                    edit.replace(uri, line.range, newTitle);
                    await vscode.workspace.applyEdit(edit);
                    
                    vscode.window.showInformationMessage(`章节标题已更新为: ${newTitle}`);
                }
            }

        } catch (error) {
            vscode.window.showErrorMessage(`生成章节标题失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async optimizeDialogue(uri: vscode.Uri, range: vscode.Range): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const dialogueLine = document.getText(range);
            
            const dialogueMatch = dialogueLine.match(/^([^：]+)：(.+)$/);
            if (!dialogueMatch) {
                vscode.window.showWarningMessage('请选择一行对话内容');
                return;
            }

            const characterName = dialogueMatch[1].trim();
            const originalDialogue = dialogueMatch[2].trim();

            // 生成对话优化建议
            const suggestions = [
                `${characterName}："${originalDialogue}"（保持原样）`,
                `${characterName}："嗯，${originalDialogue}"（添加语气词）`,
                `${characterName}："${originalDialogue}呢。"（温和语气）`,
                `${characterName}："${originalDialogue}！"（强调语气）`,
                `${characterName}："${originalDialogue}..."（犹豫语气）`
            ];

            const selectedDialogue = await vscode.window.showQuickPick(suggestions, {
                placeHolder: '选择优化后的对话',
                canPickMany: false
            });

            if (selectedDialogue && !selectedDialogue.includes('保持原样')) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, range, selectedDialogue.split('：')[1].replace(/[""]/g, ''));
                await vscode.workspace.applyEdit(edit);
                
                vscode.window.showInformationMessage('对话已优化');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`优化对话失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}