/**
 * File System Service
 * Handles all file system operations for project persistence
 * 
 * This service provides a bridge between the renderer process and
 * the main process for secure file system access.
 */

import type { Project, ProjectMetadata } from '../types';

export interface FileSystemAPI {
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  readDir: (dirPath: string) => Promise<string[]>;
  createDir: (dirPath: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  getProjectsDirectory: () => Promise<string>;
}

export class FileSystemService {
  private fs: FileSystemAPI;

  constructor() {
    // Access the Electron API exposed through preload script
    this.fs = (window as any).electronAPI?.fs;
    
    if (!this.fs) {
      console.warn('File system API not available. Running in mock mode.');
      this.fs = this.createMockFS();
    }
  }

  /**
   * Get the standard projects directory path
   * Default: ~/NovelAnimeProjects/
   */
  async getProjectsDirectory(): Promise<string> {
    return await this.fs.getProjectsDirectory();
  }

  /**
   * Get project directory path
   */
  getProjectPath(projectId: string): string {
    return `${projectId}`;
  }

  /**
   * Create project directory structure
   */
  async createProjectStructure(projectId: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    
    // Create main project directory
    await this.fs.createDir(projectPath);
    
    // Create subdirectories
    const subdirs = [
      'novels',
      'characters',
      'workflows',
      'workflows/executions',
      'assets',
      'assets/images',
      'assets/audio',
      'assets/videos',
      'exports',
      '.backups'
    ];

    for (const subdir of subdirs) {
      await this.fs.createDir(`${projectPath}/${subdir}`);
    }
  }

  /**
   * Write project.json file
   */
  async writeProjectFile(projectId: string, project: Project): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const filePath = `${projectPath}/project.json`;
    
    const projectData = {
      version: '1.0',
      ...project,
      lastUpdated: new Date().toISOString()
    };

    const content = JSON.stringify(projectData, null, 2);
    await this.fs.writeFile(filePath, content);
  }

  /**
   * Read project.json file
   */
  async readProjectFile(projectId: string): Promise<Project | null> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = `${projectPath}/project.json`;
      
      const content = await this.fs.readFile(filePath);
      const project = JSON.parse(content);
      
      return project;
    } catch (error) {
      console.error('Failed to read project file:', error);
      return null;
    }
  }

  /**
   * Check if project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    const projectPath = this.getProjectPath(projectId);
    const filePath = `${projectPath}/project.json`;
    return await this.fs.exists(filePath);
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const projectsDir = await this.getProjectsDirectory();
      const entries = await this.fs.readDir(projectsDir);
      
      const projects: ProjectMetadata[] = [];
      
      for (const entry of entries) {
        try {
          const project = await this.readProjectFile(entry);
          if (project) {
            projects.push({
              projectId: project.projectId,
              name: project.name,
              description: project.description,
              type: project.type,
              createdDate: project.createdDate,
              lastUpdated: project.lastUpdated
            });
          }
        } catch (error) {
          console.warn(`Failed to read project ${entry}:`, error);
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Failed to list projects:', error);
      return [];
    }
  }

  /**
   * Delete project directory and all contents
   */
  async deleteProject(projectId: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    
    // Recursively delete all files and subdirectories
    await this.deleteDirectory(projectPath);
  }

  /**
   * Write novel file
   */
  async writeNovelFile(projectId: string, novelId: string, content: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const filePath = `${projectPath}/novels/${novelId}.txt`;
    await this.fs.writeFile(filePath, content);
  }

  /**
   * Read novel file
   */
  async readNovelFile(projectId: string, novelId: string): Promise<string | null> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = `${projectPath}/novels/${novelId}.txt`;
      return await this.fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to read novel file:', error);
      return null;
    }
  }

  /**
   * Write characters data
   */
  async writeCharactersFile(projectId: string, characters: any[]): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const filePath = `${projectPath}/characters/characters.json`;
    const content = JSON.stringify(characters, null, 2);
    await this.fs.writeFile(filePath, content);
  }

  /**
   * Read characters data
   */
  async readCharactersFile(projectId: string): Promise<any[] | null> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = `${projectPath}/characters/characters.json`;
      const content = await this.fs.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read characters file:', error);
      return null;
    }
  }

  /**
   * Write workflow file
   */
  async writeWorkflowFile(projectId: string, workflowId: string, workflow: any): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    const filePath = `${projectPath}/workflows/${workflowId}.json`;
    const content = JSON.stringify(workflow, null, 2);
    await this.fs.writeFile(filePath, content);
  }

  /**
   * Read workflow file
   */
  async readWorkflowFile(projectId: string, workflowId: string): Promise<any | null> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = `${projectPath}/workflows/${workflowId}.json`;
      const content = await this.fs.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read workflow file:', error);
      return null;
    }
  }

  /**
   * Create backup of project.json
   */
  async createBackup(projectId: string): Promise<void> {
    try {
      const project = await this.readProjectFile(projectId);
      if (!project) return;

      const projectPath = this.getProjectPath(projectId);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${projectPath}/.backups/project.json.backup.${timestamp}`;
      
      const content = JSON.stringify(project, null, 2);
      await this.fs.writeFile(backupPath, content);

      // Clean old backups (keep only last 10)
      await this.cleanOldBackups(projectId);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * List available backups
   */
  async listBackups(projectId: string): Promise<string[]> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const backupDir = `${projectPath}/.backups`;
      const files = await this.fs.readDir(backupDir);
      
      return files
        .filter(f => f.startsWith('project.json.backup.'))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(projectId: string, backupFileName: string): Promise<Project | null> {
    try {
      const projectPath = this.getProjectPath(projectId);
      const backupPath = `${projectPath}/.backups/${backupFileName}`;
      
      const content = await this.fs.readFile(backupPath);
      const project = JSON.parse(content);
      
      // Validate project structure
      if (!project.projectId || !project.name) {
        throw new Error('Invalid project structure in backup');
      }
      
      return project;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }

  /**
   * Clean old backups (keep only last 10)
   */
  private async cleanOldBackups(projectId: string): Promise<void> {
    try {
      const backups = await this.listBackups(projectId);
      
      if (backups.length > 10) {
        const projectPath = this.getProjectPath(projectId);
        const toDelete = backups.slice(10); // Keep first 10, delete rest
        
        for (const backup of toDelete) {
          const backupPath = `${projectPath}/.backups/${backup}`;
          await this.fs.deleteFile(backupPath);
        }
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.fs.deleteFile(filePath);
  }

  /**
   * Recursively delete directory
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await this.fs.readDir(dirPath);
      
      for (const entry of entries) {
        const entryPath = `${dirPath}/${entry}`;
        
        // Try to read as directory
        try {
          await this.fs.readDir(entryPath);
          // It's a directory, recurse
          await this.deleteDirectory(entryPath);
        } catch {
          // It's a file, delete it
          await this.fs.deleteFile(entryPath);
        }
      }
      
      // Delete the directory itself
      await this.fs.deleteFile(dirPath);
    } catch (error) {
      console.error(`Failed to delete directory ${dirPath}:`, error);
    }
  }

  /**
   * Create mock file system for development/testing
   */
  private createMockFS(): FileSystemAPI {
    const storage = new Map<string, string>();
    const dirs = new Set<string>(['']);

    return {
      async readFile(filePath: string): Promise<string> {
        const content = storage.get(filePath);
        if (content === undefined) {
          throw new Error(`File not found: ${filePath}`);
        }
        return content;
      },

      async writeFile(filePath: string, content: string): Promise<void> {
        storage.set(filePath, content);
      },

      async deleteFile(filePath: string): Promise<void> {
        storage.delete(filePath);
      },

      async readDir(dirPath: string): Promise<string[]> {
        const entries: string[] = [];
        const prefix = dirPath === '' ? '' : dirPath + '/';
        
        for (const path of storage.keys()) {
          if (path.startsWith(prefix)) {
            const relative = path.substring(prefix.length);
            const firstPart = relative.split('/')[0];
            if (firstPart && !entries.includes(firstPart)) {
              entries.push(firstPart);
            }
          }
        }
        
        for (const dir of dirs) {
          if (dir.startsWith(prefix) && dir !== dirPath) {
            const relative = dir.substring(prefix.length);
            const firstPart = relative.split('/')[0];
            if (firstPart && !entries.includes(firstPart)) {
              entries.push(firstPart);
            }
          }
        }
        
        return entries;
      },

      async createDir(dirPath: string): Promise<void> {
        dirs.add(dirPath);
      },

      async exists(path: string): Promise<boolean> {
        return storage.has(path) || dirs.has(path);
      },

      async selectDirectory(): Promise<string | null> {
        return '/mock/selected/directory';
      },

      async getProjectsDirectory(): Promise<string> {
        return '/mock/projects';
      }
    };
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();
