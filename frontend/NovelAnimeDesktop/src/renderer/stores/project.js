import { defineStore } from 'pinia';
import { ProjectManager } from '../services/ProjectManager.js';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectManager: new ProjectManager(),
    currentProject: null,
    projects: [],
    recentProjects: [],
    isLoading: false,
    error: null
  }),

  getters: {
    hasCurrentProject: (state) => state.currentProject !== null,
    
    currentProjectFiles: (state) => {
      if (!state.currentProject) return { novels: [], characters: [] };
      return state.currentProject.files;
    },

    currentProjectStatistics: (state) => {
      if (!state.currentProject) return null;
      return state.projectManager.getProjectStatistics(state.currentProject.id);
    }
  },

  actions: {
    async createProject(projectData) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const project = await this.projectManager.createProject(projectData);
        this.currentProject = project;
        this.projects.push(project);
        this.updateRecentProjects();
        return project;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadProject(projectPath) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const project = await this.projectManager.loadProject(projectPath);
        if (project) {
          this.currentProject = project;
          this.projectManager.setCurrentProject(project.id);
          this.updateRecentProjects();
        }
        return project;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async saveCurrentProject() {
      if (!this.currentProject) return false;
      
      this.isLoading = true;
      this.error = null;
      
      try {
        const success = await this.projectManager.saveProject(this.currentProject.id);
        if (success) {
          this.updateRecentProjects();
        }
        return success;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    setCurrentProject(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      if (project) {
        this.currentProject = project;
        this.projectManager.setCurrentProject(projectId);
        return true;
      }
      return false;
    },

    async deleteProject(projectId) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const success = await this.projectManager.deleteProject(projectId);
        if (success) {
          this.projects = this.projects.filter(p => p.id !== projectId);
          if (this.currentProject && this.currentProject.id === projectId) {
            this.currentProject = null;
          }
          this.updateRecentProjects();
        }
        return success;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Novel file management
    addNovelFile(fileData) {
      if (!this.currentProject) return null;
      
      const file = this.projectManager.addNovelFile(this.currentProject.id, fileData);
      if (file) {
        this.currentProject.files.novels.push(file);
      }
      return file;
    },

    updateNovelFile(fileId, updates) {
      if (!this.currentProject) return false;
      
      const success = this.projectManager.updateNovelFile(this.currentProject.id, fileId, updates);
      if (success) {
        const file = this.currentProject.files.novels.find(f => f.id === fileId);
        if (file) {
          Object.assign(file, updates);
        }
      }
      return success;
    },

    removeNovelFile(fileId) {
      if (!this.currentProject) return false;
      
      const success = this.projectManager.removeNovelFile(this.currentProject.id, fileId);
      if (success) {
        this.currentProject.files.novels = this.currentProject.files.novels.filter(f => f.id !== fileId);
      }
      return success;
    },

    // Character management
    addCharacter(characterData) {
      if (!this.currentProject) return null;
      
      const character = this.projectManager.addCharacter(this.currentProject.id, characterData);
      if (character) {
        this.currentProject.files.characters.push(character);
      }
      return character;
    },

    updateCharacter(characterId, updates) {
      if (!this.currentProject) return false;
      
      const success = this.projectManager.updateCharacter(this.currentProject.id, characterId, updates);
      if (success) {
        const character = this.currentProject.files.characters.find(c => c.id === characterId);
        if (character) {
          Object.assign(character, updates);
        }
      }
      return success;
    },

    removeCharacter(characterId) {
      if (!this.currentProject) return false;
      
      const success = this.projectManager.removeCharacter(this.currentProject.id, characterId);
      if (success) {
        this.currentProject.files.characters = this.currentProject.files.characters.filter(c => c.id !== characterId);
      }
      return success;
    },

    // Utility methods
    updateRecentProjects() {
      this.recentProjects = this.projectManager.getRecentProjects();
    },

    loadAllProjects() {
      this.projects = this.projectManager.getAllProjects();
      this.updateRecentProjects();
    },

    clearError() {
      this.error = null;
    }
  }
});