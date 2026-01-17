/**
 * Auto Save Manager
 * Handles automatic saving of project data at regular intervals
 * 
 * Requirements: 10.1
 */

import { projectManager } from './ProjectManager';

export interface AutoSaveOptions {
  interval?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean; // default true
}

export class AutoSaveManager {
  private saveInterval: number;
  private isDirty: boolean;
  private isSaving: boolean;
  private timer: NodeJS.Timeout | null;
  private currentProjectId: string | null;
  private enabled: boolean;
  private lastSaveTime: Date | null;
  private saveQueue: Set<string>;

  constructor(options: AutoSaveOptions = {}) {
    this.saveInterval = options.interval || 30000; // 30 seconds
    this.enabled = options.enabled !== false;
    this.isDirty = false;
    this.isSaving = false;
    this.timer = null;
    this.currentProjectId = null;
    this.lastSaveTime = null;
    this.saveQueue = new Set();
  }

  /**
   * Start auto-save for a project
   */
  start(projectId: string): void {
    if (!this.enabled) {
      console.log('Auto-save is disabled');
      return;
    }

    this.currentProjectId = projectId;
    this.isDirty = false;
    
    // Clear existing timer
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Start new timer
    this.timer = setInterval(() => {
      this.checkAndSave();
    }, this.saveInterval);

    console.log(`Auto-save started for project ${projectId} (interval: ${this.saveInterval}ms)`);
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Perform final save if dirty
    if (this.isDirty && this.currentProjectId) {
      this.save(this.currentProjectId);
    }

    console.log('Auto-save stopped');
  }

  /**
   * Mark data as modified (dirty)
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Check if data is dirty and save if needed
   */
  private async checkAndSave(): Promise<void> {
    if (this.isDirty && !this.isSaving && this.currentProjectId) {
      await this.save(this.currentProjectId);
    }
  }

  /**
   * Perform save operation
   */
  private async save(projectId: string): Promise<void> {
    if (this.isSaving) {
      // Add to queue if already saving
      this.saveQueue.add(projectId);
      return;
    }

    this.isSaving = true;
    
    try {
      console.log(`Auto-saving project ${projectId}...`);
      
      const success = await projectManager.saveProject(projectId);
      
      if (success) {
        this.isDirty = false;
        this.lastSaveTime = new Date();
        this.notifySaveSuccess();
        console.log(`Auto-save completed at ${this.lastSaveTime.toLocaleTimeString()}`);
      } else {
        this.notifySaveError(new Error('Save operation failed'));
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.notifySaveError(error as Error);
    } finally {
      this.isSaving = false;
      
      // Process queued saves
      if (this.saveQueue.size > 0) {
        const nextProjectId = Array.from(this.saveQueue)[0];
        this.saveQueue.delete(nextProjectId);
        await this.save(nextProjectId);
      }
    }
  }

  /**
   * Force immediate save
   */
  async forceSave(): Promise<boolean> {
    if (!this.currentProjectId) {
      console.warn('No current project to save');
      return false;
    }

    this.isDirty = true;
    await this.save(this.currentProjectId);
    return !this.isDirty; // Returns true if save was successful
  }

  /**
   * Get auto-save status
   */
  getStatus(): {
    enabled: boolean;
    isDirty: boolean;
    isSaving: boolean;
    lastSaveTime: Date | null;
    currentProjectId: string | null;
  } {
    return {
      enabled: this.enabled,
      isDirty: this.isDirty,
      isSaving: this.isSaving,
      lastSaveTime: this.lastSaveTime,
      currentProjectId: this.currentProjectId
    };
  }

  /**
   * Update auto-save interval
   */
  setInterval(interval: number): void {
    this.saveInterval = interval;
    
    // Restart timer if active
    if (this.timer && this.currentProjectId) {
      this.stop();
      this.start(this.currentProjectId);
    }
  }

  /**
   * Enable/disable auto-save
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled && this.timer) {
      this.stop();
    } else if (enabled && this.currentProjectId && !this.timer) {
      this.start(this.currentProjectId);
    }
  }

  /**
   * Notify save success
   */
  private notifySaveSuccess(): void {
    // Dispatch custom event for UI to listen
    window.dispatchEvent(new CustomEvent('auto-save-success', {
      detail: {
        projectId: this.currentProjectId,
        timestamp: this.lastSaveTime
      }
    }));
  }

  /**
   * Notify save error
   */
  private notifySaveError(error: Error): void {
    // Dispatch custom event for UI to listen
    window.dispatchEvent(new CustomEvent('auto-save-error', {
      detail: {
        projectId: this.currentProjectId,
        error: error.message,
        timestamp: new Date()
      }
    }));
  }
}

// Export singleton instance
export const autoSaveManager = new AutoSaveManager();
