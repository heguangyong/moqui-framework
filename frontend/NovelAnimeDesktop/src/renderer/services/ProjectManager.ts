/**
 * Project Manager Service for Desktop App
 * Handles project creation, loading, and management with real file system persistence
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3
 */

import { fileSystemService } from './FileSystemService';
import type { Project, ProjectMetadata, ProjectStatistics } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ProjectManager {
  private projects: Map<string, Project>;
  private currentProject: Project | null;
  private recentProjects: ProjectMetadata[];

  constructor() {
    this.projects = new Map();
    this.currentProject = null;
    this.recentProjects = [];
    this.loadRecentProjects();
  }

  /**
   * Create a new project
   * Requirements: 1.1
   */
  async createProject(projectData: {
    name: string;
    description?: string;
    type?: 'novel-to-anime';
    settings?: any;
  }): Promise<Project> {
    const projectId = uuidv4();
    
    const project: Project = {
      projectId,
      name: projectData.name,
      description: projectData.description || '',
      type: projectData.type || 'novel-to-anime',
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      settings: {
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        outputFormat: 'mp4',
        resolution: '1080p',
        frameRate: 30,
        ...projectData.settings
      },
      novels: [],
      characters: [],
      workflows: [],
      assets: []
    };

    // Create project directory structure
    await fileSystemService.createProjectStructure(projectId);
    
    // Write project.json
    await fileSystemService.writeProjectFile(projectId, project);
    
    // Add to cache and recent projects
    this.projects.set(projectId, project);
    this.addToRecentProjects(project);
    
    return project;
  }

  /**
   * Load an existing project
   * Requirements: 1.2
   */
  async loadProject(projectId: string): Promise<Project | null> {
    try {
      // Check if already in cache
      if (this.projects.has(projectId)) {
        const project = this.projects.get(projectId)!;
        this.addToRecentProjects(project);
        return project;
      }

      // Load from file system
      const project = await fileSystemService.readProjectFile(projectId);
      
      if (project) {
        this.projects.set(projectId, project);
        this.addToRecentProjects(project);
        return project;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Save current project
   * Requirements: 1.3, 10.1
   */
  async saveProject(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      // Create backup before saving
      await fileSystemService.createBackup(projectId);
      
      // Update last modified timestamp
      project.lastUpdated = new Date().toISOString();
      
      // Write to file system
      await fileSystemService.writeProjectFile(projectId, project);
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * Set current active project
   */
  setCurrentProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (project) {
      this.currentProject = project;
      return true;
    }
    return false;
  }

  /**
   * Get current project
   */
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Get all projects
   * Requirements: 1.4
   */
  async getAllProjects(): Promise<ProjectMetadata[]> {
    try {
      return await fileSystemService.listProjects();
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  /**
   * Get recent projects
   * Requirements: 1.4
   */
  getRecentProjects(): ProjectMetadata[] {
    return this.recentProjects.slice(0, 10);
  }

  /**
   * Delete project
   * Requirements: 1.5
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      // Remove from current project if it's the active one
      if (this.currentProject && this.currentProject.projectId === projectId) {
        this.currentProject = null;
      }

      // Remove from recent projects
      this.recentProjects = this.recentProjects.filter(p => p.projectId !== projectId);
      this.saveRecentProjects();

      // Delete from cache
      this.projects.delete(projectId);
      
      // Delete from file system
      await fileSystemService.deleteProject(projectId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  /**
   * Add novel file to project
   * Requirements: 2.1
   */
  async addNovelFile(projectId: string, fileData: {
    name: string;
    content: string;
    metadata?: any;
  }): Promise<any> {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const novelId = uuidv4();
    
    const novelMetadata = {
      novelId,
      title: fileData.name,
      filename: `${novelId}.txt`,
      wordCount: this.countWords(fileData.content)
    };

    // Write novel content to file
    await fileSystemService.writeNovelFile(projectId, novelId, fileData.content);
    
    // Add to project metadata
    project.novels.push(novelMetadata);
    project.lastUpdated = new Date().toISOString();
    
    // Save project
    await this.saveProject(projectId);
    
    return novelMetadata;
  }

  /**
   * Update novel file
   * Requirements: 2.2
   */
  async updateNovelFile(projectId: string, novelId: string, content: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const novel = project.novels.find(n => n.novelId === novelId);
    if (!novel) return false;

    try {
      // Update word count
      novel.wordCount = this.countWords(content);
      
      // Write to file system
      await fileSystemService.writeNovelFile(projectId, novelId, content);
      
      // Save project metadata
      project.lastUpdated = new Date().toISOString();
      await this.saveProject(projectId);
      
      return true;
    } catch (error) {
      console.error('Failed to update novel file:', error);
      return false;
    }
  }

  /**
   * Remove novel file
   * Requirements: 2.4
   */
  async removeNovelFile(projectId: string, novelId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const novelIndex = project.novels.findIndex(n => n.novelId === novelId);
    if (novelIndex === -1) return false;

    try {
      // Remove from project metadata
      project.novels.splice(novelIndex, 1);
      project.lastUpdated = new Date().toISOString();
      
      // Save project
      await this.saveProject(projectId);
      
      // Note: We don't delete the actual file to prevent data loss
      // User can manually clean up if needed
      
      return true;
    } catch (error) {
      console.error('Failed to remove novel file:', error);
      return false;
    }
  }

  /**
   * Add character to project
   * Requirements: 3.1
   */
  async addCharacter(projectId: string, characterData: any): Promise<any> {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const characterId = uuidv4();
    
    const character = {
      characterId,
      name: characterData.name,
      role: characterData.role || 'supporting',
      description: characterData.description || '',
      appearance: characterData.appearance || '',
      personality: characterData.personality || ''
    };

    // Add to project
    project.characters.push(character);
    project.lastUpdated = new Date().toISOString();
    
    // Save project
    await this.saveProject(projectId);
    
    return character;
  }

  /**
   * Update character
   * Requirements: 3.2
   */
  async updateCharacter(projectId: string, characterId: string, updates: any): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const character = project.characters.find(c => c.characterId === characterId);
    if (!character) return false;

    Object.assign(character, updates);
    project.lastUpdated = new Date().toISOString();
    
    await this.saveProject(projectId);
    
    return true;
  }

  /**
   * Remove character
   * Requirements: 3.4
   */
  async removeCharacter(projectId: string, characterId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const characterIndex = project.characters.findIndex(c => c.characterId === characterId);
    if (characterIndex === -1) return false;

    project.characters.splice(characterIndex, 1);
    project.lastUpdated = new Date().toISOString();
    
    await this.saveProject(projectId);
    
    return true;
  }

  /**
   * Get project statistics
   */
  getProjectStatistics(projectId: string): ProjectStatistics | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const totalWords = project.novels.reduce((sum, novel) => 
      sum + (novel.wordCount || 0), 0
    );

    return {
      totalFiles: project.novels.length,
      totalCharacters: project.characters.length,
      totalWords,
      totalChapters: 0, // TODO: Calculate from novels
      totalAssets: project.assets.length,
      totalWorkflows: project.workflows.length,
      createdDate: project.createdDate,
      lastModified: project.lastUpdated
    };
  }

  /**
   * Export project
   */
  async exportProject(projectId: string): Promise<string | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import project
   */
  async importProject(jsonData: string): Promise<Project | null> {
    try {
      const projectData = JSON.parse(jsonData);
      
      if (!projectData.name) {
        throw new Error('Invalid project structure');
      }

      // Generate new ID to avoid conflicts
      const newProjectId = uuidv4();
      projectData.projectId = newProjectId;
      projectData.createdDate = new Date().toISOString();
      projectData.lastUpdated = new Date().toISOString();
      
      // Create project structure
      await fileSystemService.createProjectStructure(newProjectId);
      
      // Write project file
      await fileSystemService.writeProjectFile(newProjectId, projectData);
      
      // Add to cache
      this.projects.set(newProjectId, projectData);
      this.addToRecentProjects(projectData);
      
      return projectData;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }

  /**
   * Restore from backup
   * Requirements: 10.2
   */
  async restoreFromBackup(projectId: string, backupFileName: string): Promise<boolean> {
    try {
      const project = await fileSystemService.restoreFromBackup(projectId, backupFileName);
      
      if (project) {
        // Update cache
        this.projects.set(projectId, project);
        
        // Save as current version
        await fileSystemService.writeProjectFile(projectId, project);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * List available backups
   * Requirements: 10.2
   */
  async listBackups(projectId: string): Promise<string[]> {
    return await fileSystemService.listBackups(projectId);
  }

  // Private helper methods

  private addToRecentProjects(project: Project): void {
    const metadata: ProjectMetadata = {
      projectId: project.projectId,
      name: project.name,
      description: project.description,
      type: project.type,
      createdDate: project.createdDate,
      lastUpdated: project.lastUpdated
    };

    // Remove if already exists
    this.recentProjects = this.recentProjects.filter(p => p.projectId !== project.projectId);
    
    // Add to beginning
    this.recentProjects.unshift(metadata);

    // Keep only last 10
    this.recentProjects = this.recentProjects.slice(0, 10);
    
    // Save to local storage
    this.saveRecentProjects();
  }

  private saveRecentProjects(): void {
    try {
      localStorage.setItem('recentProjects', JSON.stringify(this.recentProjects));
    } catch (error) {
      console.error('Failed to save recent projects:', error);
    }
  }

  private loadRecentProjects(): void {
    try {
      const stored = localStorage.getItem('recentProjects');
      if (stored) {
        this.recentProjects = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error);
      this.recentProjects = [];
    }
  }

  private countWords(text: string): number {
    // Count Chinese characters
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // Count English words
    const englishWords = (text.match(/\b\w+\b/g) || []).length;
    
    return chineseChars + englishWords;
  }
}

// Export singleton instance
export const projectManager = new ProjectManager();
