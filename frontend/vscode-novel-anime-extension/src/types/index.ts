import * as vscode from 'vscode';

// 项目相关类型
export interface NovelAnimeProject {
    id: string;
    name: string;
    rootUri: vscode.Uri;
    configPath: vscode.Uri;
    config: ProjectConfig;
    novels: NovelFile[];
    assets: AssetFile[];
    workflows: WorkflowConfig[];
    createdAt: Date;
    lastModified: Date;
}

export interface ProjectConfig {
    version: string;
    name: string;
    description: string;
    settings: ProjectSettings;
    characters: Character[];
    chapters: Chapter[];
}

export interface ProjectSettings {
    defaultLanguage: string;
    outputDirectory: string;
    backupEnabled: boolean;
    autoSave: boolean;
    aiService: AIServiceConfig;
}

export interface AIServiceConfig {
    apiKey: string;
    endpoint: string;
    model: string;
}

// 小说文件类型
export interface NovelFile {
    id: string;
    name: string;
    path: string;
    uri: vscode.Uri;
    content: string;
    chapters: Chapter[];
    characters: Character[];
    lastModified: Date;
}

export interface Chapter {
    id: string;
    title: string;
    content: string;
    startLine: number;
    endLine: number;
    characters: string[];
    scenes: Scene[];
}

export interface Scene {
    id: string;
    description: string;
    characters: string[];
    location: string;
    timeOfDay: string;
    mood: string;
}

// 角色类型
export interface Character {
    id: string;
    name: string;
    description: string;
    traits: string[];
    appearance: CharacterAppearance;
    relationships: Relationship[];
    dialogueStyle: DialogueStyle;
}

export interface CharacterAppearance {
    age: string;
    gender: string;
    height: string;
    build: string;
    hairColor: string;
    eyeColor: string;
    clothing: string;
    distinctiveFeatures: string[];
}

export interface Relationship {
    characterId: string;
    type: RelationshipType;
    description: string;
}

export enum RelationshipType {
    Family = 'family',
    Friend = 'friend',
    Enemy = 'enemy',
    Romantic = 'romantic',
    Professional = 'professional',
    Other = 'other'
}

export interface DialogueStyle {
    formality: 'formal' | 'casual' | 'mixed';
    vocabulary: 'simple' | 'complex' | 'technical';
    tone: 'serious' | 'humorous' | 'sarcastic' | 'gentle';
    speechPatterns: string[];
}

// 素材文件类型
export interface AssetFile {
    id: string;
    name: string;
    type: AssetType;
    path: string;
    uri: vscode.Uri;
    metadata: AssetMetadata;
    tags: string[];
    createdAt: Date;
}

export enum AssetType {
    Image = 'image',
    Audio = 'audio',
    Video = 'video',
    Model = 'model',
    Texture = 'texture',
    Animation = 'animation'
}

export interface AssetMetadata {
    size: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    format: string;
    quality: string;
}

// 语言服务类型
export interface CharacterInfo {
    name: string;
    firstAppearance: { uri: vscode.Uri; line: number };
    dialogues: { text: string; location: { uri: vscode.Uri; line: number } }[];
    traits: Set<string>;
    relationships: Set<string>;
}

export interface SceneInfo {
    id: string;
    description: string;
    location: { uri: vscode.Uri; line: number };
    characters: Set<string>;
    timeOfDay?: string;
    setting?: string;
}



// 工作流类型
export interface WorkflowConfig {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    settings: WorkflowSettings;
    createdAt: Date;
    lastModified: Date;
}

export interface WorkflowNode {
    id: string;
    type: NodeType;
    name: string;
    position: { x: number; y: number };
    config: NodeConfig;
    inputs: NodePort[];
    outputs: NodePort[];
}

export enum NodeType {
    NovelParser = 'novel-parser',
    CharacterAnalyzer = 'character-analyzer',
    SceneGenerator = 'scene-generator',
    ScriptConverter = 'script-converter',
    StoryboardCreator = 'storyboard-creator',
    VideoGenerator = 'video-generator',
    AssetManager = 'asset-manager'
}

export interface NodeConfig {
    [key: string]: any;
}

export interface NodePort {
    id: string;
    name: string;
    type: PortType;
    dataType: string;
}

export enum PortType {
    Input = 'input',
    Output = 'output'
}

export interface WorkflowConnection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
}

export interface WorkflowSettings {
    autoSave: boolean;
    parallelExecution: boolean;
    maxConcurrency: number;
    timeout: number;
}

// 消息通信类型
export interface WebviewMessage {
    command: string;
    data: any;
    requestId?: string;
    timestamp: number;
}

export interface ExtensionToWebviewMessage extends WebviewMessage {
    type: 'file-changed' | 'project-loaded' | 'config-updated' | 'workflow-status' | 'error';
}

export interface WebviewToExtensionMessage extends WebviewMessage {
    type: 'save-file' | 'create-project' | 'run-workflow' | 'get-config' | 'update-character';
}

// 语言服务类型
export interface CompletionContext {
    document: vscode.TextDocument;
    position: vscode.Position;
    triggerCharacter?: string;
    triggerKind: vscode.CompletionTriggerKind;
}

export interface DiagnosticInfo {
    range: vscode.Range;
    message: string;
    severity: vscode.DiagnosticSeverity;
    code?: string;
    source: string;
}

// 配置类型
export interface ExtensionConfig {
    aiService: AIServiceConfig;
    outputSettings: OutputSettings;
    workflowTemplates: WorkflowTemplate[];
    shortcuts: KeyboardShortcut[];
    workspace: WorkspaceSettings;
}

export interface OutputSettings {
    videoFormat: string;
    resolution: string;
    frameRate: number;
    quality: string;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    isBuiltIn: boolean;
}

export interface KeyboardShortcut {
    command: string;
    key: string;
    when?: string;
}

export interface WorkspaceSettings {
    autoSave: boolean;
    backupEnabled: boolean;
    backupInterval: number;
    maxBackups: number;
}

// 错误类型
export class NovelAnimeError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'NovelAnimeError';
    }
}

export class WebviewCommunicationError extends NovelAnimeError {
    constructor(message: string, public readonly requestId?: string) {
        super(message, 'WEBVIEW_COMMUNICATION_ERROR');
        this.name = 'WebviewCommunicationError';
    }
}

export class FileSystemAccessError extends NovelAnimeError {
    constructor(message: string, public readonly uri: vscode.Uri) {
        super(message, 'FILESYSTEM_ACCESS_ERROR');
        this.name = 'FileSystemAccessError';
    }
}

export class ProjectLoadError extends NovelAnimeError {
    constructor(message: string, public readonly projectPath: string) {
        super(message, 'PROJECT_LOAD_ERROR');
        this.name = 'ProjectLoadError';
    }
}