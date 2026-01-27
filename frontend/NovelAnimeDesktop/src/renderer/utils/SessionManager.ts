/**
 * Session Manager - Centralized localStorage Management
 * 
 * Purpose: Manage session data in localStorage with proper lifecycle
 * Principle: Only store session identifiers, NOT business data
 * 
 * Created: 2026-01-26
 * Part of: Hotfix 11 - Project Data Resurrection Root Cause Fix
 */

interface SessionData {
  currentProjectId: string | null;
  lastAccessTime: string;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'novel_anime_session';
  private static readonly PROJECT_WORKFLOW_MAP_KEY = 'novel_anime_project_workflow_map';

  /**
   * Get current session data
   */
  static getSession(): SessionData {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse session data:', error);
    }
    
    return {
      currentProjectId: null,
      lastAccessTime: new Date().toISOString()
    };
  }

  /**
   * Set current project ID in session
   */
  static setCurrentProject(projectId: string | null): void {
    const session: SessionData = {
      currentProjectId: projectId,
      lastAccessTime: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      console.log('📝 Session updated:', projectId);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Get current project ID from session
   */
  static getCurrentProjectId(): string | null {
    const session = this.getSession();
    return session.currentProjectId;
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🧹 Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Clean up all project-related data for a specific project
   * This should be called when a project is deleted
   */
  static cleanupProjectData(projectId: string): void {
    console.log('🧹 Cleaning up all data for project:', projectId);
    
    // 1. Clear session if it's the current project
    const currentProjectId = this.getCurrentProjectId();
    if (currentProjectId === projectId) {
      this.clearSession();
    }

    // 2. Remove from workflow map
    try {
      const mapStr = localStorage.getItem(this.PROJECT_WORKFLOW_MAP_KEY);
      if (mapStr) {
        const map = JSON.parse(mapStr);
        if (map[projectId]) {
          delete map[projectId];
          localStorage.setItem(this.PROJECT_WORKFLOW_MAP_KEY, JSON.stringify(map));
          console.log('🧹 Removed project from workflow map');
        }
      }
    } catch (error) {
      console.warn('Failed to clean workflow map:', error);
    }

    // 3. Clean up legacy localStorage keys (for backward compatibility)
    // These should not be used anymore, but clean them up if they exist
    const legacyKeys = [
      'novel_anime_current_project_id',
      'novel_anime_current_novel_id',
      'novel_anime_current_novel_title'
    ];
    
    legacyKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value === projectId || key.includes('project_id')) {
        localStorage.removeItem(key);
        console.log('🧹 Removed legacy key:', key);
      }
    });

    console.log('✅ Project data cleanup complete');
  }

  /**
   * Validate that localStorage data belongs to current project
   * Returns true if data is valid, false if it should be cleared
   */
  static validateProjectData(expectedProjectId: string): boolean {
    const currentProjectId = this.getCurrentProjectId();
    
    if (currentProjectId !== expectedProjectId) {
      console.warn('⚠️ Project ID mismatch!');
      console.warn('   Expected:', expectedProjectId);
      console.warn('   Found:', currentProjectId);
      return false;
    }
    
    return true;
  }

  /**
   * Get workflow ID for a project
   */
  static getProjectWorkflowId(projectId: string): string | null {
    try {
      const mapStr = localStorage.getItem(this.PROJECT_WORKFLOW_MAP_KEY);
      if (mapStr) {
        const map = JSON.parse(mapStr);
        return map[projectId] || null;
      }
    } catch (error) {
      console.error('Failed to get workflow ID:', error);
    }
    return null;
  }

  /**
   * Set workflow ID for a project
   */
  static setProjectWorkflowId(projectId: string, workflowId: string): void {
    try {
      const mapStr = localStorage.getItem(this.PROJECT_WORKFLOW_MAP_KEY);
      const map = mapStr ? JSON.parse(mapStr) : {};
      map[projectId] = workflowId;
      localStorage.setItem(this.PROJECT_WORKFLOW_MAP_KEY, JSON.stringify(map));
      console.log('📝 Workflow ID set for project:', projectId, '→', workflowId);
    } catch (error) {
      console.error('Failed to set workflow ID:', error);
    }
  }
}

export default SessionManager;
