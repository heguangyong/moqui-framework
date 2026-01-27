import { defineStore } from 'pinia';
import SessionManager from '../utils/SessionManager';

// ============================================================================
// Type Definitions
// ============================================================================

export type ProjectStatus =
  | 'draft'
  | 'active'
  | 'importing'
  | 'imported'
  | 'analyzing'
  | 'analyzed'
  | 'parsing'
  | 'parsed'
  | 'characters_confirmed'
  | 'characters_continue'
  | 'generating'
  | 'completed';

export interface Project {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress?: number;
  shared?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
  // Optional fields
  novels?: any[];
  characters?: any[];
  assets?: any[];
  workflows?: any[];
  files?: {
    novels: any[];
    characters: any[];
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  recentProjects: Project[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize project data to ensure consistent id and projectId fields
 */
function normalizeProject(project: any): Project {
  if (!project) {
    throw new Error('Cannot normalize null project');
  }

  // Get project ID (prefer projectId, fallback to id)
  const projectId = project.projectId || project.id;

  if (!projectId) {
    console.error('❌ Project missing both id and projectId:', project);
    throw new Error('Invalid project data: missing identifier');
  }

  // Return normalized project data
  return {
    ...project,
    id: projectId,
    projectId: projectId,
    name: project.name || project.projectName || '未命名项目',
    status: project.status || 'draft',
    shared: project.shared || false,
  };
}

// ============================================================================
// Store Definition
// ============================================================================

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    currentProject: null,
    projects: [],
    recentProjects: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    hasCurrentProject: (state): boolean => state.currentProject !== null,

    currentProjectFiles: (state) => {
      if (!state.currentProject) return { novels: [], characters: [] };
      return state.currentProject.files || { novels: [], characters: [] };
    },

    currentProjectStatistics: (state) => {
      if (!state.currentProject) return null;
      const project = state.currentProject;
      return {
        totalFiles: project.novels?.length || 0,
        totalCharacters: project.characters?.length || 0,
        totalWords:
          project.novels?.reduce((sum, novel) => sum + (novel.wordCount || 0), 0) || 0,
        totalChapters: 0, // TODO: Calculate from novels
        totalAssets: project.assets?.length || 0,
        totalWorkflows: project.workflows?.length || 0,
        createdDate: project.createdAt,
        lastModified: project.lastUpdated || project.updatedAt,
      };
    },

    // Project categorization
    myProjects: (state): Project[] => state.projects.filter((p) => !p.shared),
    sharedProjects: (state): Project[] => state.projects.filter((p) => p.shared),

    // Project counts
    projectCounts: (state) => ({
      total: state.projects.length,
      my: state.projects.filter((p) => !p.shared).length,
      shared: state.projects.filter((p) => p.shared).length,
    }),

    // Project status statistics
    projectsByStatus: (state) => ({
      draft: state.projects.filter((p) => p.status === 'draft').length,
      processing: state.projects.filter((p) => p.status === 'processing').length,
      completed: state.projects.filter((p) => p.status === 'completed').length,
    }),
  },

  actions: {
    /**
     * Create a new project
     * @param projectData - Project creation data
     * @returns Created project or null on failure
     */
    async createProject(projectData: CreateProjectData): Promise<Project | null> {
      this.isLoading = true;
      this.error = null;

      try {
        console.log('📝 Creating project:', projectData);

        // 1. Call backend API to create project
        const { apiService } = await import('../services/index');
        const result = await apiService.createProject(projectData);

        if (!result.success) {
          throw new Error(result.message || '项目创建失败');
        }

        console.log('✅ Backend project created:', result.project);

        // 2. Normalize returned project data
        const normalizedProject = normalizeProject(result.project);

        // 3. Set as current project
        this.currentProject = normalizedProject;

        // 4. Add to store's projects array (if not exists)
        const existingIndex = this.projects.findIndex(
          (p) => (p.id || p.projectId) === normalizedProject.projectId
        );
        if (existingIndex === -1) {
          this.projects.push(normalizedProject);
        } else {
          this.projects[existingIndex] = normalizedProject;
        }

        // 5. Auto-refresh project list (ensure sync with backend)
        console.log('🔄 Auto-refreshing project list...');
        await this.fetchProjects();

        // 6. Update recent projects
        this.updateRecentProjects();

        console.log('✅ Project created and list refreshed');
        return normalizedProject;
      } catch (error: any) {
        console.error('❌ Create project error:', error);
        this.error = error.message || '项目创建失败';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Set current project
     * @param projectOrId - Project object or project ID
     * @returns Success status
     */
    setCurrentProject(projectOrId: Project | string): boolean {
      // Support passing project object or project ID
      if (typeof projectOrId === 'object' && projectOrId !== null) {
        // Passed a project object
        const project = projectOrId;
        const projectId = project.id || project.projectId;
        this.currentProject = { ...project, id: projectId, projectId };

        // If project not in list, add it
        if (!this.projects.find((p) => (p.id || p.projectId) === projectId)) {
          this.projects.push(this.currentProject);
        }

        // Use SessionManager for session persistence
        SessionManager.setCurrentProject(projectId);
        return true;
      } else {
        // Passed a project ID
        const projectId = projectOrId;
        const project = this.projects.find((p) => (p.id || p.projectId) === projectId);
        if (project) {
          this.currentProject = project;
          // Use SessionManager for session persistence
          SessionManager.setCurrentProject(projectId);
          return true;
        }
        return false;
      }
    },

    /**
     * Delete a project
     * @param projectId - Project ID to delete
     * @returns Success status
     */
    async deleteProject(projectId: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        console.log('🗑️ Store: Deleting project:', projectId);

        // First call backend API to delete
        const { apiService } = await import('../services/index');
        const result = await apiService.deleteProject(projectId);

        if (!result.success) {
          console.error('❌ Backend delete failed:', result.message);
          this.error = result.message || '删除失败';
          return false;
        }

        console.log('✅ Backend delete successful');

        // Use SessionManager for comprehensive cleanup
        SessionManager.cleanupProjectData(projectId);

        // Remove from store's project list
        this.projects = this.projects.filter((p) => (p.id || p.projectId) !== projectId);

        // If it's the current project, clear current project
        if (
          this.currentProject &&
          (this.currentProject.id || this.currentProject.projectId) === projectId
        ) {
          this.currentProject = null;
        }

        this.updateRecentProjects();
        console.log('✅ Local delete successful');

        return true;
      } catch (error: any) {
        console.error('❌ Delete project error:', error);
        this.error = error.message || '删除失败';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch projects from backend API
     * @returns API result
     */
    async fetchProjects(): Promise<{ success: boolean; projects: Project[] }> {
      this.isLoading = true;
      this.error = null;

      try {
        console.log('🔄 Fetching projects from backend...');

        // Dynamic import to avoid circular dependencies
        const { apiService } = await import('../services/index');
        const result = await apiService.getProjects();

        if (result.success && result.projects) {
          // Normalize all project data
          this.projects = result.projects.map(normalizeProject);

          console.log('📊 fetchProjects from API:', this.projects.length, 'projects');
        } else {
          console.warn('⚠️ API returned no projects');
          // If backend returns empty, there are truly no projects
          this.projects = [];
          console.log('📊 No projects from API, clearing local list');
        }

        this.updateRecentProjects();
        this.isLoading = false;
        return { success: true, projects: this.projects };
      } catch (error: any) {
        this.error = error.message || '加载项目列表失败';
        console.error('❌ Failed to fetch projects:', error);

        // On error, keep current project list unchanged
        console.log('📊 fetchProjects error, keeping current list:', this.projects.length, 'projects');

        this.isLoading = false;
        return { success: false, projects: [] };
      }
    },

    /**
     * Update recent projects list
     */
    updateRecentProjects(): void {
      // Get recent projects from the projects list (sorted by lastUpdated)
      this.recentProjects = [...this.projects]
        .sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.updatedAt || 0);
          const dateB = new Date(b.lastUpdated || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
    },

    /**
     * Clear current project
     */
    clearCurrentProject(): void {
      this.currentProject = null;
    },

    /**
     * Clear error message
     */
    clearError(): void {
      this.error = null;
    },

    /**
     * @deprecated Use fetchProjects() instead
     */
    loadAllProjects(): Promise<{ success: boolean; projects: Project[] }> {
      console.warn('loadAllProjects() is deprecated, use fetchProjects() instead');
      return this.fetchProjects();
    },
  },
});
