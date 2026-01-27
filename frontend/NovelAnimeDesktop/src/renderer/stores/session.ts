import { defineStore } from 'pinia';
import SessionManager from '../utils/SessionManager';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SessionState {
  currentProjectId: string | null;
  lastAccessTime: string | null;
  isInitialized: boolean;
}

// ============================================================================
// Store Definition
// ============================================================================

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    currentProjectId: null,
    lastAccessTime: null,
    isInitialized: false,
  }),

  getters: {
    /**
     * Check if there's an active session
     */
    hasActiveSession: (state): boolean => state.currentProjectId !== null,

    /**
     * Get current project ID
     */
    projectId: (state): string | null => state.currentProjectId,
  },

  actions: {
    /**
     * Initialize session from localStorage
     */
    initializeSession(): void {
      if (this.isInitialized) {
        console.log('⚠️ Session already initialized');
        return;
      }

      try {
        const session = SessionManager.getSession();
        this.currentProjectId = session.currentProjectId;
        this.lastAccessTime = session.lastAccessTime;
        this.isInitialized = true;

        console.log('✅ Session initialized:', {
          projectId: this.currentProjectId,
          lastAccess: this.lastAccessTime,
        });
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
        this.isInitialized = true; // Mark as initialized even on error
      }
    },

    /**
     * Set current project ID
     * @param projectId - Project ID to set as current
     */
    setCurrentProject(projectId: string | null): void {
      this.currentProjectId = projectId;
      this.lastAccessTime = new Date().toISOString();

      // Persist to localStorage via SessionManager
      SessionManager.setCurrentProject(projectId);

      console.log('📝 Session updated:', projectId);
    },

    /**
     * Get current project ID
     * @returns Current project ID or null
     */
    getCurrentProjectId(): string | null {
      return this.currentProjectId;
    },

    /**
     * Clear session
     */
    clearSession(): void {
      this.currentProjectId = null;
      this.lastAccessTime = null;

      // Clear from localStorage via SessionManager
      SessionManager.clearSession();

      console.log('🧹 Session cleared');
    },

    /**
     * Validate that session data belongs to expected project
     * @param expectedProjectId - Expected project ID
     * @returns True if valid, false otherwise
     */
    validateProjectSession(expectedProjectId: string): boolean {
      if (this.currentProjectId !== expectedProjectId) {
        console.warn('⚠️ Project session mismatch!');
        console.warn('   Expected:', expectedProjectId);
        console.warn('   Current:', this.currentProjectId);
        return false;
      }
      return true;
    },

    /**
     * Clean up all data for a specific project
     * @param projectId - Project ID to clean up
     */
    cleanupProjectData(projectId: string): void {
      console.log('🧹 Cleaning up session data for project:', projectId);

      // If it's the current project, clear session
      if (this.currentProjectId === projectId) {
        this.clearSession();
      }

      // Use SessionManager for comprehensive cleanup
      SessionManager.cleanupProjectData(projectId);

      console.log('✅ Session cleanup complete');
    },

    /**
     * Get workflow ID for current project
     * @returns Workflow ID or null
     */
    getCurrentWorkflowId(): string | null {
      if (!this.currentProjectId) {
        return null;
      }
      return SessionManager.getProjectWorkflowId(this.currentProjectId);
    },

    /**
     * Set workflow ID for current project
     * @param workflowId - Workflow ID to set
     */
    setCurrentWorkflowId(workflowId: string): void {
      if (!this.currentProjectId) {
        console.warn('⚠️ Cannot set workflow ID: no current project');
        return;
      }
      SessionManager.setProjectWorkflowId(this.currentProjectId, workflowId);
    },

    /**
     * Get workflow ID for a specific project
     * @param projectId - Project ID
     * @returns Workflow ID or null
     */
    getProjectWorkflowId(projectId: string): string | null {
      return SessionManager.getProjectWorkflowId(projectId);
    },

    /**
     * Set workflow ID for a specific project
     * @param projectId - Project ID
     * @param workflowId - Workflow ID to set
     */
    setProjectWorkflowId(projectId: string, workflowId: string): void {
      SessionManager.setProjectWorkflowId(projectId, workflowId);
    },
  },
});
