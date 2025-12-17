/**
 * Project Manager Service for Desktop App
 * Handles project creation, loading, and management
 */
export class ProjectManager {
  constructor() {
    this.projects = new Map();
    this.currentProject = null;
    this.recentProjects = [];
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const project = {
      id: projectId,
      name: projectData.name,
      description: projectData.description || '',
      type: projectData.type || 'novel-to-anime',
      createdDate: new Date(),
      lastModified: new Date(),
      settings: {
        outputFormat: 'mp4',
        resolution: '1080p',
        frameRate: 30,
        ...projectData.settings
      },
      files: {
        novels: [],
        characters: [],
        assets: [],
        workflows: []
      },
      metadata: {
        totalChapters: 0,
        totalCharacters: 0,
        estimatedDuration: 0,
        ...projectData.metadata
      }
    };

    this.projects.set(projectId, project);
    this.addToRecentProjects(project);
    
    return project;
  }

  /**
   * Load an existing project
   */
  async loadProject(projectPath) {
    try {
      // In a real implementation, this would read from file system
      // For now, simulate loading
      const projectData = await this.readProjectFile(projectPath);
      
      if (projectData) {
        this.projects.set(projectData.id, projectData);
        this.addToRecentProjects(projectData);
        return projectData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Save current project
   */
  async saveProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      project.lastModified = new Date();
      
      // In a real implementation, this would write to file system
      await this.writeProjectFile(project);
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * Set current active project
   */
  setCurrentProject(projectId) {
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
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Get recent projects
   */
  getRecentProjects() {
    return this.recentProjects.slice(0, 10); // Return last 10 projects
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      // Remove from current project if it's the active one
      if (this.currentProject && this.currentProject.id === projectId) {
        this.currentProject = null;
      }

      // Remove from recent projects
      this.recentProjects = this.recentProjects.filter(p => p.id !== projectId);

      // Delete from storage
      this.projects.delete(projectId);
      
      // In a real implementation, delete project files
      await this.deleteProjectFiles(project);
      
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  /**
   * Add novel file to project
   */
  addNovelFile(projectId, fileData) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const novelFile = {
      id: fileId,
      name: fileData.name,
      path: fileData.path,
      content: fileData.content || '',
      type: 'novel',
      createdDate: new Date(),
      lastModified: new Date(),
      metadata: {
        wordCount: 0,
        chapterCount: 0,
        ...fileData.metadata
      }
    };

    project.files.novels.push(novelFile);
    project.lastModified = new Date();
    
    return novelFile;
  }

  /**
   * Update novel file
   */
  updateNovelFile(projectId, fileId, updates) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const file = project.files.novels.find(f => f.id === fileId);
    if (!file) return false;

    Object.assign(file, updates);
    file.lastModified = new Date();
    project.lastModified = new Date();
    
    return true;
  }

  /**
   * Remove novel file
   */
  removeNovelFile(projectId, fileId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const fileIndex = project.files.novels.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return false;

    project.files.novels.splice(fileIndex, 1);
    project.lastModified = new Date();
    
    return true;
  }

  /**
   * Add character to project
   */
  addCharacter(projectId, characterData) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const characterId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const character = {
      id: characterId,
      name: characterData.name,
      description: characterData.description || '',
      role: characterData.role || 'secondary',
      appearance: characterData.appearance || '',
      personality: characterData.personality || '',
      relationships: characterData.relationships || [],
      createdDate: new Date(),
      lastModified: new Date()
    };

    project.files.characters.push(character);
    project.lastModified = new Date();
    
    return character;
  }

  /**
   * Update character
   */
  updateCharacter(projectId, characterId, updates) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const character = project.files.characters.find(c => c.id === characterId);
    if (!character) return false;

    Object.assign(character, updates);
    character.lastModified = new Date();
    project.lastModified = new Date();
    
    return true;
  }

  /**
   * Remove character
   */
  removeCharacter(projectId, characterId) {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const characterIndex = project.files.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) return false;

    project.files.characters.splice(characterIndex, 1);
    project.lastModified = new Date();
    
    return true;
  }

  /**
   * Get project statistics
   */
  getProjectStatistics(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const totalWords = project.files.novels.reduce((sum, file) => 
      sum + (file.metadata.wordCount || 0), 0
    );

    const totalChapters = project.files.novels.reduce((sum, file) => 
      sum + (file.metadata.chapterCount || 0), 0
    );

    return {
      totalFiles: project.files.novels.length,
      totalCharacters: project.files.characters.length,
      totalWords,
      totalChapters,
      totalAssets: project.files.assets.length,
      totalWorkflows: project.files.workflows.length,
      createdDate: project.createdDate,
      lastModified: project.lastModified
    };
  }

  /**
   * Export project
   */
  async exportProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import project
   */
  async importProject(jsonData) {
    try {
      const projectData = JSON.parse(jsonData);
      
      if (!projectData.id || !projectData.name) {
        throw new Error('Invalid project structure');
      }

      // Generate new ID to avoid conflicts
      projectData.id = `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      this.projects.set(projectData.id, projectData);
      this.addToRecentProjects(projectData);
      
      return projectData;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }

  // Private helper methods
  addToRecentProjects(project) {
    // Remove if already exists
    this.recentProjects = this.recentProjects.filter(p => p.id !== project.id);
    
    // Add to beginning
    this.recentProjects.unshift({
      id: project.id,
      name: project.name,
      lastModified: project.lastModified,
      type: project.type
    });

    // Keep only last 10
    this.recentProjects = this.recentProjects.slice(0, 10);
  }

  async readProjectFile(projectPath) {
    // Simulate reading project file
    // In real implementation, use Electron's fs APIs
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `project_${Date.now()}`,
          name: 'Loaded Project',
          description: 'Project loaded from file',
          type: 'novel-to-anime',
          createdDate: new Date(),
          lastModified: new Date(),
          settings: {},
          files: { novels: [], characters: [], assets: [], workflows: [] },
          metadata: {}
        });
      }, 1000);
    });
  }

  async writeProjectFile(project) {
    // Simulate writing project file
    // In real implementation, use Electron's fs APIs
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Project saved:', project.name);
        resolve(true);
      }, 500);
    });
  }

  async deleteProjectFiles(project) {
    // Simulate deleting project files
    // In real implementation, use Electron's fs APIs
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Project files deleted:', project.name);
        resolve(true);
      }, 500);
    });
  }
}