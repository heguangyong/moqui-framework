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
    },
    
    // 项目分类统计
    myProjects: (state) => state.projects.filter(p => !p.shared),
    sharedProjects: (state) => state.projects.filter(p => p.shared),
    
    // 项目计数
    projectCounts: (state) => ({
      total: state.projects.length,
      my: state.projects.filter(p => !p.shared).length,
      shared: state.projects.filter(p => p.shared).length
    }),
    
    // 项目状态统计
    projectsByStatus: (state) => ({
      draft: state.projects.filter(p => p.status === 'draft').length,
      processing: state.projects.filter(p => p.status === 'processing').length,
      completed: state.projects.filter(p => p.status === 'completed').length
    })
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

    setCurrentProject(projectOrId) {
      // 支持传入项目对象或项目ID
      if (typeof projectOrId === 'object' && projectOrId !== null) {
        // 传入的是项目对象
        const project = projectOrId;
        const projectId = project.id || project.projectId;
        this.currentProject = { ...project, id: projectId };
        
        // 如果项目不在列表中，添加它
        if (!this.projects.find(p => (p.id || p.projectId) === projectId)) {
          this.projects.push(this.currentProject);
        }
        
        this.projectManager.setCurrentProject(projectId);
        return true;
      } else {
        // 传入的是项目ID
        const projectId = projectOrId;
        const project = this.projects.find(p => (p.id || p.projectId) === projectId);
        if (project) {
          this.currentProject = project;
          this.projectManager.setCurrentProject(projectId);
          return true;
        }
        return false;
      }
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

    clearCurrentProject() {
      this.currentProject = null;
    },

    clearError() {
      this.error = null;
    }
  }
});