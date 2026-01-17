/**
 * Project Type Definitions
 * 项目相关的类型定义
 */

export interface Project {
  projectId: string;
  name: string;
  description: string;
  type: 'novel-to-anime';
  createdDate: string;
  lastUpdated: string;
  settings: ProjectSettings;
  novels: NovelMetadata[];
  characters: CharacterMetadata[];
  workflows: WorkflowMetadata[];
  assets: AssetMetadata[];
}

export interface ProjectSettings {
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  outputFormat?: string;
  resolution?: string;
  frameRate?: number;
}

export interface ProjectMetadata {
  projectId: string;
  name: string;
  description: string;
  type: 'novel-to-anime';
  createdDate: string;
  lastUpdated: string;
}

export interface NovelMetadata {
  novelId: string;
  title: string;
  filename: string;
  wordCount: number;
}

export interface CharacterMetadata {
  characterId: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
}

export interface WorkflowMetadata {
  workflowId: string;
  name: string;
  filename: string;
}

export interface AssetMetadata {
  assetId: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  filename: string;
}

export interface ProjectStatistics {
  totalFiles: number;
  totalCharacters: number;
  totalWords: number;
  totalChapters: number;
  totalAssets: number;
  totalWorkflows: number;
  createdDate: string;
  lastModified: string;
}
