import * as vscode from 'vscode';
import { ProjectManager } from '../project/ProjectManager';
import { CharacterInfo, SceneInfo, DiagnosticInfo } from '../types';

export class NovelLanguageService {
    private disposables: vscode.Disposable[] = [];
    private diagnosticCollection: vscode.DiagnosticCollection;
    private characterDatabase: Map<string, CharacterInfo> = new Map();
    private sceneDatabase: Map<string, SceneInfo> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager
    ) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('novel-anime');
    }

    async register(): Promise<void> {
        // 注册补全提供者
        this.disposables.push(
            vscode.languages.registerCompletionItemProvider(
                { scheme: 'file', language: 'novel' },
                this,
                '：', // 触发字符：角色名后的冒号
                '"', // 触发字符：对话引号
                '「', // 触发字符：中文对话引号
                '['  // 触发字符：场景描述
            )
        );

        // 注册悬停提供者
        this.disposables.push(
            vscode.languages.registerHoverProvider(
                { scheme: 'file', language: 'novel' },
                this
            )
        );

        // 注册诊断提供者
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(this.validateDocument.bind(this))
        );

        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(this.validateDocument.bind(this))
        );

        // 注册文档符号提供者（大纲视图）
        this.disposables.push(
            vscode.languages.registerDocumentSymbolProvider(
                { scheme: 'file', language: 'novel' },
                this
            )
        );

        console.log('小说语言服务已注册');
    }

    // 实现 CompletionItemProvider
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const line = document.lineAt(position);
        const lineText = line.text;
        const beforeCursor = lineText.substring(0, position.character);

        const completionItems: vscode.CompletionItem[] = [];

        // 角色名称补全
        if (beforeCursor.match(/[\u4e00-\u9fff\w]*：?$/)) {
            const characters = await this.getKnownCharacters(document);
            for (const character of characters) {
                const item = new vscode.CompletionItem(character.name, vscode.CompletionItemKind.Variable);
                item.detail = character.description;
                item.documentation = new vscode.MarkdownString(`**${character.name}**\n\n${character.description}`);
                item.insertText = `${character.name}：`;
                completionItems.push(item);
            }
        }

        // 章节标题补全
        if (beforeCursor.match(/^第.*$/)) {
            const chapterTemplates = [
                '第一章 开始',
                '第二章 发展',
                '第三章 转折',
                '第四章 高潮',
                '第五章 结局'
            ];

            for (const template of chapterTemplates) {
                const item = new vscode.CompletionItem(template, vscode.CompletionItemKind.Snippet);
                item.detail = '章节标题模板';
                item.insertText = template;
                completionItems.push(item);
            }
        }

        // 场景描述补全
        if (beforeCursor.includes('[')) {
            const sceneTemplates = [
                '[场景：学校教室，上午]',
                '[场景：家中客厅，晚上]',
                '[场景：公园，下午]',
                '[镜头：特写]',
                '[镜头：远景]',
                '[镜头：切换]'
            ];

            for (const template of sceneTemplates) {
                const item = new vscode.CompletionItem(template, vscode.CompletionItemKind.Snippet);
                item.detail = '场景描述模板';
                item.insertText = template;
                completionItems.push(item);
            }
        }

        // 对话风格建议
        if (beforeCursor.includes('"') || beforeCursor.includes('「')) {
            const currentProject = this.projectManager.getCurrentProject();
            if (currentProject) {
                // 根据角色特征提供对话建议
                const dialogueTemplates = [
                    '"你好，很高兴见到你。"',
                    '"这件事情我需要仔细考虑一下。"',
                    '"让我们一起努力吧！"'
                ];

                for (const template of dialogueTemplates) {
                    const item = new vscode.CompletionItem(template, vscode.CompletionItemKind.Text);
                    item.detail = '对话模板';
                    item.insertText = template;
                    completionItems.push(item);
                }
            }
        }

        return completionItems;
    }

    // 实现 HoverProvider
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        
        // 检查是否是已知角色
        const characters = await this.getKnownCharacters(document);
        const character = characters.find(c => c.name === word);
        
        if (character) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${character.name}**\n\n`);
            markdown.appendMarkdown(`${character.description}\n\n`);
            
            if (character.traits && character.traits.length > 0) {
                markdown.appendMarkdown(`**特征**: ${character.traits.join(', ')}\n\n`);
            }
            
            return new vscode.Hover(markdown, range);
        }

        return null;
    }

    // 实现 DocumentSymbolProvider
    async provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检测章节标题
            const chapterMatch = line.match(/^第(.+)章\s*(.*)$/);
            if (chapterMatch) {
                const range = new vscode.Range(i, 0, i, line.length);
                const symbol = new vscode.DocumentSymbol(
                    line.trim(),
                    chapterMatch[2] || '',
                    vscode.SymbolKind.Module,
                    range,
                    range
                );
                symbols.push(symbol);
            }

            // 检测角色对话
            const characterMatch = line.match(/^([^\s：]+)：/);
            if (characterMatch) {
                const range = new vscode.Range(i, 0, i, line.length);
                const symbol = new vscode.DocumentSymbol(
                    characterMatch[1],
                    '角色对话',
                    vscode.SymbolKind.Object,
                    range,
                    range
                );
                
                // 将角色对话作为章节的子符号
                if (symbols.length > 0) {
                    const lastChapter = symbols[symbols.length - 1];
                    if (!lastChapter.children) {
                        lastChapter.children = [];
                    }
                    lastChapter.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
            }
        }

        return symbols;
    }

    private async validateDocument(document: vscode.TextDocument): Promise<void> {
        if (document.languageId !== 'novel' && !document.fileName.endsWith('.novel')) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检查角色名称一致性
            const characterMatch = line.match(/^([^\s：]+)：/);
            if (characterMatch) {
                const characterName = characterMatch[1];
                
                // 检查角色名称是否包含特殊字符
                if (!/^[\u4e00-\u9fff\w\s]+$/.test(characterName)) {
                    const range = new vscode.Range(i, 0, i, characterName.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `角色名称 "${characterName}" 包含特殊字符，建议使用中文或字母`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.source = 'novel-anime';
                    diagnostics.push(diagnostic);
                }
            }

            // 检查章节格式
            if (line.match(/第.+章/) && !line.match(/^第.+章/)) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    '章节标题应该在行首',
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.source = 'novel-anime';
                diagnostics.push(diagnostic);
            }

            // 检查对话格式
            if (line.includes('"') && !line.match(/^[^：]*：.*".*".*$/)) {
                const quoteIndex = line.indexOf('"');
                if (quoteIndex >= 0) {
                    const range = new vscode.Range(i, quoteIndex, i, quoteIndex + 1);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        '建议对话前添加角色名称',
                        vscode.DiagnosticSeverity.Hint
                    );
                    diagnostic.source = 'novel-anime';
                    diagnostics.push(diagnostic);
                }
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private async getKnownCharacters(document: vscode.TextDocument): Promise<any[]> {
        // 从当前项目获取角色信息
        const currentProject = this.projectManager.getCurrentProject();
        if (currentProject && currentProject.config.characters) {
            return currentProject.config.characters;
        }

        // 从文档中提取角色
        const characters: any[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        const characterNames = new Set<string>();

        for (const line of lines) {
            const match = line.match(/^([^\s：]+)：/);
            if (match) {
                characterNames.add(match[1]);
            }
        }

        for (const name of characterNames) {
            characters.push({
                name,
                description: `角色：${name}`,
                traits: []
            });
        }

        return characters;
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}