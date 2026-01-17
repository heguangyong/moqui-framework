/**
 * Backup Manager
 * Handles project backup and recovery operations
 * 
 * Requirements: 10.2, 10.5
 */

import { fileSystemService } from './FileSystemService';
import { projectManager } from './ProjectManager';
import type { Project } from '../types';

export interface BackupInfo {
  fileName: string;
  timestamp: Date;
  size?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class BackupManager {
  private maxBackups: number;

  constructor(maxBackups: number = 10) {
    this.maxBackups = maxBackups;
  }

  /**
   * Create backup before saving
   * Requirements: 10.2
   */
  async createBackup(projectId: string): Promise<boolean> {
    try {
      await fileSystemService.createBackup(projectId);
      console.log(`Backup created for project ${projectId}`);
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * List all available backups
   * Requirements: 10.2
   */
  async listBackups(projectId: string): Promise<BackupInfo[]> {
    try {
      const backupFiles = await fileSystemService.listBackups(projectId);
      
      return backupFiles.map(fileName => {
        // Extract timestamp from filename: project.json.backup.2025-01-15T10-00-00-000Z
        const timestampMatch = fileName.match(/backup\.(.+)$/);
        const timestampStr = timestampMatch ? timestampMatch[1].replace(/-/g, ':').replace(/T/g, 'T') : '';
        
        let timestamp: Date;
        try {
          // Convert back to ISO format
          const isoStr = timestampStr.replace(/(\d{4}):(\d{2}):(\d{2})T(\d{2}):(\d{2}):(\d{2}):(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z');
          timestamp = new Date(isoStr);
        } catch {
          timestamp = new Date();
        }

        return {
          fileName,
          timestamp
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore project from backup
   * Requirements: 10.2
   */
  async restoreFromBackup(projectId: string, backupFileName: string): Promise<boolean> {
    try {
      console.log(`Restoring project ${projectId} from backup ${backupFileName}...`);
      
      // Load backup data
      const project = await fileSystemService.restoreFromBackup(projectId, backupFileName);
      
      if (!project) {
        throw new Error('Failed to load backup data');
      }

      // Validate backup data
      const validation = this.validateProject(project);
      if (!validation.valid) {
        throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
      }

      // Create a backup of current state before restoring
      await this.createBackup(projectId);
      
      // Write restored data
      await fileSystemService.writeProjectFile(projectId, project);
      
      console.log(`Project ${projectId} restored successfully`);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Restore from most recent backup
   * Requirements: 10.2
   */
  async restoreFromLatestBackup(projectId: string): Promise<boolean> {
    try {
      const backups = await this.listBackups(projectId);
      
      if (backups.length === 0) {
        throw new Error('No backups available');
      }

      const latestBackup = backups[0];
      return await this.restoreFromBackup(projectId, latestBackup.fileName);
    } catch (error) {
      console.error('Failed to restore from latest backup:', error);
      return false;
    }
  }

  /**
   * Validate project data structure
   * Requirements: 10.5
   */
  validateProject(project: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!project.projectId) {
      errors.push('Missing projectId');
    }

    if (!project.name) {
      errors.push('Missing project name');
    }

    if (!project.type) {
      errors.push('Missing project type');
    }

    if (!project.createdDate) {
      errors.push('Missing createdDate');
    }

    // Check data structure
    if (!Array.isArray(project.novels)) {
      errors.push('novels must be an array');
    }

    if (!Array.isArray(project.characters)) {
      errors.push('characters must be an array');
    }

    if (!Array.isArray(project.workflows)) {
      errors.push('workflows must be an array');
    }

    if (!Array.isArray(project.assets)) {
      errors.push('assets must be an array');
    }

    // Check settings
    if (!project.settings || typeof project.settings !== 'object') {
      warnings.push('Missing or invalid settings object');
    }

    // Validate dates
    try {
      const date = new Date(project.createdDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid createdDate format');
      }
    } catch {
      errors.push('Invalid createdDate format');
    }

    if (project.lastUpdated) {
      try {
        const date = new Date(project.lastUpdated);
        if (isNaN(date.getTime())) {
          warnings.push('Invalid lastUpdated format');
        }
      } catch {
        warnings.push('Invalid lastUpdated format');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Attempt to recover corrupted project data
   * Requirements: 10.5
   */
  async recoverProject(projectId: string): Promise<Project | null> {
    try {
      console.log(`Attempting to recover project ${projectId}...`);
      
      // Try to load current project
      let project = await fileSystemService.readProjectFile(projectId);
      
      if (project) {
        const validation = this.validateProject(project);
        
        if (validation.valid) {
          console.log('Project data is valid, no recovery needed');
          return project;
        }
        
        console.warn('Project data has issues:', validation.errors);
      }

      // Try to restore from backups
      const backups = await this.listBackups(projectId);
      
      for (const backup of backups) {
        console.log(`Trying backup: ${backup.fileName}`);
        
        const backupProject = await fileSystemService.restoreFromBackup(projectId, backup.fileName);
        
        if (backupProject) {
          const validation = this.validateProject(backupProject);
          
          if (validation.valid) {
            console.log(`Successfully recovered from backup: ${backup.fileName}`);
            return backupProject;
          }
        }
      }

      console.error('Failed to recover project from any backup');
      return null;
    } catch (error) {
      console.error('Recovery failed:', error);
      return null;
    }
  }

  /**
   * Clean old backups (keep only maxBackups)
   * Requirements: 10.2
   */
  async cleanOldBackups(projectId: string): Promise<number> {
    try {
      const backups = await this.listBackups(projectId);
      
      if (backups.length <= this.maxBackups) {
        return 0; // No cleanup needed
      }

      const toDelete = backups.slice(this.maxBackups);
      let deletedCount = 0;

      for (const backup of toDelete) {
        try {
          const projectPath = fileSystemService.getProjectPath(projectId);
          const backupPath = `${projectPath}/.backups/${backup.fileName}`;
          await fileSystemService.deleteFile(backupPath);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete backup ${backup.fileName}:`, error);
        }
      }

      console.log(`Cleaned ${deletedCount} old backups for project ${projectId}`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to clean old backups:', error);
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(projectId: string): Promise<{
    totalBackups: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
    totalSize?: number;
  }> {
    try {
      const backups = await this.listBackups(projectId);
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          oldestBackup: null,
          newestBackup: null
        };
      }

      return {
        totalBackups: backups.length,
        oldestBackup: backups[backups.length - 1].timestamp,
        newestBackup: backups[0].timestamp
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        oldestBackup: null,
        newestBackup: null
      };
    }
  }

  /**
   * Set maximum number of backups to keep
   */
  setMaxBackups(max: number): void {
    this.maxBackups = max;
  }
}

// Export singleton instance
export const backupManager = new BackupManager();
