import * as vscode from 'vscode';
import { ProjectManager } from '../project/ProjectManager';
import { Character, DialogueStyle } from '../types';

export class WritingAssistant {
    private disposables: vscode.Disposable[] = [];
    private characterStyles: Map<string, DialogueStyle> = new Map();
    private chapterTemplates: ChapterTemplate[] = [];
    private scriptTerms: ScriptTerm[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager
    ) {
        this.initializeTemplates();
        this.initializeScriptTerms();
    }

    async register(): Promise<void> {
        // 注册代码动作提供者
        this.disposables.push(
            vscode.languages.registerCodeActionsProvider(
                { scheme: 'file', pattern: '**/*.{txt,md,novel}' },
                new WritingCodeActionProvider(this),
                {
                    providedCodeActionKinds: [
                        vscode.CodeActionKind.QuickFix,
                        vscode.CodeActionKind.Refactor
                    ]
                }
            )
        );

        // 注册补全提供者增强
        this.disposables.push(
            vscode.languages.registerCompletionItemProvider(
                { scheme: 'file', pattern: '**/*.{txt,md,novel}' },
                new WritingCompletionProvider(this),
                '：', '"', '「', '[', '（', '【'
            )
        );

        // 注册悬停提供者增强
        this.disposables.push(
            vscode.languages.registerHoverProvider(
                { scheme: 'file', pattern: '**/*.{txt,md,novel}' },
                new WritingHoverProvider(this)
            )
        );

        console.log('智能写作辅助已注册');
    }

    // 初始化章节模板
    private initializeTemplates(): void {
        this.chapterTemplates = [
            {
                id: 'opening',
                name: '开场章节',
                description: '故事开始，介绍主要角色和背景',
                structure: [
                    '环境描述',
                    '主角登场',
                    '初始冲突',
                    '章节结尾钩子'
                ],
                suggestedLength: '1500-2500字',
                keyElements: ['角色介绍', '世界观建立', '故事钩子']
            },
            {
                id: 'development',
                name: '发展章节',
                description: '推进情节，深化角色关系',
                structure: [
                    '承接上章',
                    '情节推进',
                    '角色互动',
                    '新信息揭示'
                ],
                suggestedLength: '2000-3000字',
                keyElements: ['情节发展', '角色成长', '伏笔埋设']
            },
            {
                id: 'climax',
                name: '高潮章节',
                description: '故事的转折点和最激烈的冲突',
                structure: [
                    '紧张氛围营造',
                    '冲突爆发',
                    '角色选择',
                    '结果揭示'
                ],
                suggestedLength: '2500-4000字',
                keyElements: ['激烈冲突', '角色决断', '情感高潮']
            },
            {
                id: 'resolution',
                name: '结局章节',
                description: '解决冲突，完成角色弧线',
                structure: [
                    '冲突解决',
                    '角色成长体现',
                    '故事线收束',
                    '开放式结尾'
                ],
                suggestedLength: '1500-2500字',
                keyElements: ['问题解决', '角色变化', '情感满足']
            }
        ];
    }

    // 初始化分镜脚本术语
    private initializeScriptTerms(): void {
        this.scriptTerms = [
            // 镜头类型
            { term: '特写', category: 'shot', description: '突出细节，强调情感', example: '[镜头：特写] 主角眼中的泪水' },
            { term: '中景', category: 'shot', description: '显示角色上半身，适合对话', example: '[镜头：中景] 两人面对面交谈' },
            { term: '全景', category: 'shot', description: '显示完整场景，建立环境', example: '[镜头：全景] 学校操场全貌' },
            { term: '远景', category: 'shot', description: '展现宏大场面，营造氛围', example: '[镜头：远景] 夕阳下的城市天际线' },
            
            // 镜头运动
            { term: '推镜', category: 'movement', description: '镜头向前推进，增强紧张感', example: '[镜头：推镜] 慢慢推向角色面部' },
            { term: '拉镜', category: 'movement', description: '镜头后拉，显示更大范围', example: '[镜头：拉镜] 从角色拉到整个房间' },
            { term: '摇镜', category: 'movement', description: '镜头左右摇摆，跟随动作', example: '[镜头：摇镜] 跟随角色走动' },
            { term: '升降', category: 'movement', description: '镜头上下移动，改变视角', example: '[镜头：升降] 从低角度仰视角色' },
            
            // 转场效果
            { term: '切换', category: 'transition', description: '直接切换到下一个镜头', example: '[转场：切换] 直接切到下一场景' },
            { term: '淡入', category: 'transition', description: '画面从黑色渐显', example: '[转场：淡入] 新的一天开始' },
            { term: '淡出', category: 'transition', description: '画面渐隐至黑色', example: '[转场：淡出] 回忆结束' },
            { term: '叠化', category: 'transition', description: '两个画面重叠过渡', example: '[转场：叠化] 现实与回忆交替' },
            
            // 音效和音乐
            { term: 'BGM', category: 'audio', description: '背景音乐', example: '[音乐：BGM] 轻快的日常音乐' },
            { term: '音效', category: 'audio', description: '环境或动作音效', example: '[音效] 脚步声渐近' },
            { term: '配音', category: 'audio', description: '角色对话配音', example: '[配音：温柔] "没关系的"' },
            
            // 情感表现
            { term: '内心独白', category: 'emotion', description: '角色内心想法', example: '[内心独白] 我该怎么办呢？' },
            { term: '情感特写', category: 'emotion', description: '突出情感表达', example: '[情感特写] 眼中的坚定' },
            { term: '氛围营造', category: 'emotion', description: '通过环境营造情感', example: '[氛围：紧张] 乌云密布的天空' }
        ];
    }

    // 分析角色语言风格
    analyzeCharacterStyle(character: Character, dialogues: string[]): DialogueStyle {
        const style: DialogueStyle = {
            formality: 'casual',
            vocabulary: 'simple',
            tone: 'gentle',
            speechPatterns: []
        };

        // 分析正式程度
        const formalWords = ['您', '请', '谢谢', '不好意思', '打扰了'];
        const casualWords = ['你', '嗯', '哦', '呀', '吧'];
        
        let formalCount = 0;
        let casualCount = 0;

        dialogues.forEach(dialogue => {
            formalWords.forEach(word => {
                if (dialogue.includes(word)) formalCount++;
            });
            casualWords.forEach(word => {
                if (dialogue.includes(word)) casualCount++;
            });
        });

        if (formalCount > casualCount * 1.5) {
            style.formality = 'formal';
        } else if (casualCount > formalCount * 1.5) {
            style.formality = 'casual';
        } else {
            style.formality = 'mixed';
        }

        // 分析词汇复杂度
        const complexWords = ['因此', '然而', '况且', '毕竟', '显然'];
        const simpleWords = ['所以', '但是', '而且', '因为', '当然'];
        
        let complexCount = 0;
        let simpleCount = 0;

        dialogues.forEach(dialogue => {
            complexWords.forEach(word => {
                if (dialogue.includes(word)) complexCount++;
            });
            simpleWords.forEach(word => {
                if (dialogue.includes(word)) simpleCount++;
            });
        });

        if (complexCount > simpleCount) {
            style.vocabulary = 'complex';
        } else {
            style.vocabulary = 'simple';
        }

        // 分析语调
        const seriousWords = ['必须', '应该', '绝对', '肯定'];
        const humorousWords = ['哈哈', '嘿嘿', '有趣', '好玩'];
        const gentleWords = ['慢慢', '轻轻', '小心', '温柔'];

        let seriousCount = 0;
        let humorousCount = 0;
        let gentleCount = 0;

        dialogues.forEach(dialogue => {
            seriousWords.forEach(word => {
                if (dialogue.includes(word)) seriousCount++;
            });
            humorousWords.forEach(word => {
                if (dialogue.includes(word)) humorousCount++;
            });
            gentleWords.forEach(word => {
                if (dialogue.includes(word)) gentleCount++;
            });
        });

        if (seriousCount > Math.max(humorousCount, gentleCount)) {
            style.tone = 'serious';
        } else if (humorousCount > Math.max(seriousCount, gentleCount)) {
            style.tone = 'humorous';
        } else {
            style.tone = 'gentle';
        }

        // 提取语言模式
        const patterns = this.extractSpeechPatterns(dialogues);
        style.speechPatterns = patterns;

        this.characterStyles.set(character.id, style);
        return style;
    }

    // 提取语言模式
    private extractSpeechPatterns(dialogues: string[]): string[] {
        const patterns: string[] = [];
        const commonPatterns = [
            { pattern: /(.+)呢[？?]/, description: '疑问语气词' },
            { pattern: /(.+)吧[！!。.]/, description: '推测语气词' },
            { pattern: /(.+)啊[！!。.]/, description: '感叹语气词' },
            { pattern: /(.+)嘛[，,。.]/, description: '撒娇语气词' },
            { pattern: /(.+)哦[，,。.]/, description: '恍然语气词' }
        ];

        dialogues.forEach(dialogue => {
            commonPatterns.forEach(({ pattern, description }) => {
                if (pattern.test(dialogue) && !patterns.includes(description)) {
                    patterns.push(description);
                }
            });
        });

        return patterns;
    }

    // 生成角色对话建议
    generateDialogueSuggestions(characterId: string, context: string): string[] {
        const style = this.characterStyles.get(characterId);
        if (!style) return [];

        const suggestions: string[] = [];
        
        // 基于正式程度生成建议
        if (style.formality === 'formal') {
            suggestions.push('"请您稍等一下。"');
            suggestions.push('"不好意思，打扰了。"');
            suggestions.push('"谢谢您的理解。"');
        } else if (style.formality === 'casual') {
            suggestions.push('"等等我！"');
            suggestions.push('"没事啦。"');
            suggestions.push('"你说得对。"');
        }

        // 基于语调生成建议
        if (style.tone === 'humorous') {
            suggestions.push('"哈哈，有意思！"');
            suggestions.push('"这可真是太好玩了。"');
        } else if (style.tone === 'gentle') {
            suggestions.push('"慢慢来，不着急。"');
            suggestions.push('"小心一点哦。"');
        }

        return suggestions.slice(0, 5); // 返回最多5个建议
    }

    // 生成章节标题建议
    generateChapterTitleSuggestions(chapterContent: string): string[] {
        const suggestions: string[] = [];
        
        // 分析章节内容
        const hasConflict = /冲突|争吵|打架|对立/.test(chapterContent);
        const hasEmotion = /眼泪|哭泣|笑容|开心|悲伤/.test(chapterContent);
        const hasAction = /跑|跳|飞|战斗|追逐/.test(chapterContent);
        const hasMeeting = /见面|相遇|初次|第一次/.test(chapterContent);
        const hasParting = /离别|再见|分开|告别/.test(chapterContent);

        if (hasMeeting) {
            suggestions.push('初次相遇', '命运的邂逅', '意外的见面', '新的开始');
        }
        
        if (hasConflict) {
            suggestions.push('激烈的对抗', '不可调和', '针锋相对', '冲突爆发');
        }
        
        if (hasEmotion) {
            suggestions.push('心中的波澜', '情感的涌动', '内心的声音', '真情流露');
        }
        
        if (hasAction) {
            suggestions.push('紧张时刻', '生死一瞬', '全力以赴', '决定性的行动');
        }
        
        if (hasParting) {
            suggestions.push('离别的时刻', '再见的话语', '分别的路口', '各自的道路');
        }

        // 如果没有特定模式，提供通用建议
        if (suggestions.length === 0) {
            suggestions.push('新的一天', '故事继续', '意外的发展', '重要的决定', '转折点');
        }

        return suggestions.slice(0, 8);
    }

    // 生成分镜脚本建议
    generateScriptSuggestions(context: string): ScriptSuggestion[] {
        const suggestions: ScriptSuggestion[] = [];
        
        // 分析上下文
        const isDialogue = /：/.test(context);
        const isAction = /跑|走|坐|站|拿|放/.test(context);
        const isEmotion = /高兴|悲伤|愤怒|惊讶|害怕/.test(context);
        const isEnvironment = /房间|学校|公园|街道|天空/.test(context);

        if (isDialogue) {
            suggestions.push({
                type: 'shot',
                suggestion: '[镜头：中景] 两人对话',
                description: '适合对话场景的镜头'
            });
            suggestions.push({
                type: 'shot',
                suggestion: '[镜头：特写] 角色表情',
                description: '突出角色情感表达'
            });
        }

        if (isAction) {
            suggestions.push({
                type: 'shot',
                suggestion: '[镜头：全景] 动作场面',
                description: '展现完整的动作过程'
            });
            suggestions.push({
                type: 'movement',
                suggestion: '[镜头：跟镜] 跟随角色移动',
                description: '跟随角色的动作'
            });
        }

        if (isEmotion) {
            suggestions.push({
                type: 'shot',
                suggestion: '[镜头：特写] 情感表现',
                description: '突出角色的情感状态'
            });
            suggestions.push({
                type: 'emotion',
                suggestion: '[内心独白] 角色心理',
                description: '表现角色内心想法'
            });
        }

        if (isEnvironment) {
            suggestions.push({
                type: 'shot',
                suggestion: '[镜头：远景] 环境全貌',
                description: '建立场景环境'
            });
            suggestions.push({
                type: 'transition',
                suggestion: '[转场：淡入] 场景切换',
                description: '平滑的场景过渡'
            });
        }

        return suggestions;
    }

    // 检查写作一致性
    checkWritingConsistency(document: vscode.TextDocument): ConsistencyIssue[] {
        const issues: ConsistencyIssue[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // 检查角色名称一致性
        const characterNames = new Set<string>();
        const characterVariations = new Map<string, string[]>();

        lines.forEach((line, lineIndex) => {
            const dialogueMatch = line.match(/^([^：\s]+)：/);
            if (dialogueMatch) {
                const name = dialogueMatch[1].trim();
                characterNames.add(name);
                
                // 检查相似名称
                for (const existingName of characterNames) {
                    if (existingName !== name && this.isSimilarName(name, existingName)) {
                        if (!characterVariations.has(existingName)) {
                            characterVariations.set(existingName, []);
                        }
                        characterVariations.get(existingName)!.push(name);
                        
                        issues.push({
                            type: 'character-inconsistency',
                            line: lineIndex,
                            message: `角色名称可能不一致："${name}" 与 "${existingName}" 相似`,
                            severity: 'warning',
                            suggestion: `统一使用 "${existingName}"`
                        });
                    }
                }
            }
        });

        // 检查时间线一致性
        this.checkTimelineConsistency(lines, issues);

        // 检查场景一致性
        this.checkSceneConsistency(lines, issues);

        return issues;
    }

    // 检查时间线一致性
    private checkTimelineConsistency(lines: string[], issues: ConsistencyIssue[]): void {
        const timeReferences: any[] = [];
        
        lines.forEach((line, lineIndex) => {
            const timeMatch = line.match(/(早上|上午|中午|下午|晚上|深夜|昨天|今天|明天)/);
            if (timeMatch) {
                timeReferences.push({
                    line: lineIndex,
                    time: timeMatch[1],
                    context: line
                });
            }
        });

        // 检查时间逻辑
        for (let i = 1; i < timeReferences.length; i++) {
            const prev = timeReferences[i - 1];
            const curr = timeReferences[i];
            
            if (this.isTimeInconsistent(prev.time, curr.time)) {
                issues.push({
                    type: 'timeline-inconsistency',
                    line: curr.line,
                    message: `时间线可能不一致：从"${prev.time}"到"${curr.time}"`,
                    severity: 'info',
                    suggestion: '检查时间顺序是否合理'
                });
            }
        }
    }

    // 检查场景一致性
    private checkSceneConsistency(lines: string[], issues: ConsistencyIssue[]): void {
        let currentScene = '';
        
        lines.forEach((line, lineIndex) => {
            const sceneMatch = line.match(/\[场景：([^\]]+)\]/);
            if (sceneMatch) {
                const newScene = sceneMatch[1];
                
                // 检查场景切换是否需要转场说明
                if (currentScene && currentScene !== newScene) {
                    const hasTransition = lines[lineIndex - 1]?.includes('转场') || 
                                        lines[lineIndex + 1]?.includes('转场');
                    
                    if (!hasTransition) {
                        issues.push({
                            type: 'scene-transition',
                            line: lineIndex,
                            message: `场景切换可能需要转场说明：从"${currentScene}"到"${newScene}"`,
                            severity: 'info',
                            suggestion: '添加转场描述，如：[转场：切换]'
                        });
                    }
                }
                
                currentScene = newScene;
            }
        });
    }

    // 判断名称是否相似
    private isSimilarName(name1: string, name2: string): boolean {
        if (Math.abs(name1.length - name2.length) > 2) return false;
        
        let differences = 0;
        const maxLen = Math.max(name1.length, name2.length);
        
        for (let i = 0; i < maxLen; i++) {
            if (name1[i] !== name2[i]) {
                differences++;
                if (differences > 1) return false;
            }
        }
        
        return differences === 1;
    }

    // 判断时间是否不一致
    private isTimeInconsistent(prevTime: string, currTime: string): boolean {
        const timeOrder = ['早上', '上午', '中午', '下午', '晚上', '深夜'];
        const prevIndex = timeOrder.indexOf(prevTime);
        const currIndex = timeOrder.indexOf(currTime);
        
        if (prevIndex >= 0 && currIndex >= 0) {
            return currIndex < prevIndex; // 时间倒退
        }
        
        return false;
    }

    // 获取章节模板
    getChapterTemplates(): ChapterTemplate[] {
        return this.chapterTemplates;
    }

    // 获取分镜术语
    getScriptTerms(): ScriptTerm[] {
        return this.scriptTerms;
    }

    // 获取角色风格
    getCharacterStyle(characterId: string): DialogueStyle | undefined {
        return this.characterStyles.get(characterId);
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}

// 写作代码动作提供者
class WritingCodeActionProvider implements vscode.CodeActionProvider {
    constructor(private writingAssistant: WritingAssistant) {}

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        
        // 添加章节标题建议
        const line = document.lineAt(range.start.line);
        if (line.text.includes('第') && line.text.includes('章')) {
            const action = new vscode.CodeAction('生成章节标题建议', vscode.CodeActionKind.Refactor);
            action.command = {
                command: 'novelAnime.generateChapterTitle',
                title: '生成章节标题建议',
                arguments: [document.uri, range]
            };
            actions.push(action);
        }

        // 添加对话风格建议
        if (line.text.includes('：')) {
            const action = new vscode.CodeAction('优化对话风格', vscode.CodeActionKind.Refactor);
            action.command = {
                command: 'novelAnime.optimizeDialogue',
                title: '优化对话风格',
                arguments: [document.uri, range]
            };
            actions.push(action);
        }

        return actions;
    }
}

// 写作补全提供者
class WritingCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private writingAssistant: WritingAssistant) {}

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const line = document.lineAt(position);
        const lineText = line.text;
        const beforeCursor = lineText.substring(0, position.character);

        const completionItems: vscode.CompletionItem[] = [];

        // 分镜脚本补全
        if (beforeCursor.includes('[')) {
            const scriptTerms = this.writingAssistant.getScriptTerms();
            scriptTerms.forEach(term => {
                const item = new vscode.CompletionItem(term.example, vscode.CompletionItemKind.Snippet);
                item.detail = term.description;
                item.documentation = new vscode.MarkdownString(`**${term.term}** (${term.category})\n\n${term.description}`);
                item.insertText = term.example;
                completionItems.push(item);
            });
        }

        // 章节模板补全
        if (beforeCursor.match(/第.*章/)) {
            const templates = this.writingAssistant.getChapterTemplates();
            templates.forEach(template => {
                const item = new vscode.CompletionItem(template.name, vscode.CompletionItemKind.Snippet);
                item.detail = template.description;
                item.documentation = new vscode.MarkdownString(
                    `**${template.name}**\n\n${template.description}\n\n` +
                    `建议长度：${template.suggestedLength}\n\n` +
                    `结构：\n${template.structure.map(s => `- ${s}`).join('\n')}`
                );
                completionItems.push(item);
            });
        }

        return completionItems;
    }
}

// 写作悬停提供者
class WritingHoverProvider implements vscode.HoverProvider {
    constructor(private writingAssistant: WritingAssistant) {}

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | null {
        const range = document.getWordRangeAtPosition(position);
        if (!range) return null;

        const word = document.getText(range);
        
        // 检查是否是分镜术语
        const scriptTerms = this.writingAssistant.getScriptTerms();
        const term = scriptTerms.find(t => t.term === word);
        
        if (term) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${term.term}** _(${term.category})_\n\n`);
            markdown.appendMarkdown(`${term.description}\n\n`);
            markdown.appendMarkdown(`示例：\`${term.example}\``);
            
            return new vscode.Hover(markdown, range);
        }

        return null;
    }
}

// 类型定义
interface ChapterTemplate {
    id: string;
    name: string;
    description: string;
    structure: string[];
    suggestedLength: string;
    keyElements: string[];
}

interface ScriptTerm {
    term: string;
    category: 'shot' | 'movement' | 'transition' | 'audio' | 'emotion';
    description: string;
    example: string;
}

interface ScriptSuggestion {
    type: string;
    suggestion: string;
    description: string;
}

interface ConsistencyIssue {
    type: string;
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion: string;
}