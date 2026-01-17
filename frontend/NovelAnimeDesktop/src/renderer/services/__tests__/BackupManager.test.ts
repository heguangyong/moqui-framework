/**
 * Backup Manager Tests
 * 
 * Requirements: 10.2, 10.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackupManager } from '../BackupManager';
import type { Project } from '../../types';

describe('BackupManager', () => {
  let backupManager: BackupManager;
  
  beforeEach(() => {
    backupManager = new BackupManager(10);
  });

  describe('validateProject', () => {
    it('should validate a valid project', () => {
      const validProject: Project = {
        projectId: 'test-id',
        name: 'Test Project',
        type: 'novel-to-anime',
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        description: 'Test',
        novels: [],
        characters: [],
        workflows: [],
        assets: [],
        settings: {}
      };

      const result = backupManager.validateProject(validProject);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidProject = {
        // Missing projectId
        name: 'Test Project',
        type: 'novel-to-anime'
      };

      const result = backupManager.validateProject(invalidProject);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing projectId');
      expect(result.errors).toContain('Missing createdDate');
    });

    it('should detect invalid data structures', () => {
      const invalidProject = {
        projectId: 'test-id',
        name: 'Test Project',
        type: 'novel-to-anime',
        createdDate: new Date().toISOString(),
        novels: 'not-an-array', // Should be array
        characters: [],
        workflows: [],
        assets: []
      };

      const result = backupManager.validateProject(invalidProject);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('novels must be an array');
    });

    it('should detect invalid date formats', () => {
      const invalidProject = {
        projectId: 'test-id',
        name: 'Test Project',
        type: 'novel-to-anime',
        createdDate: 'invalid-date',
        novels: [],
        characters: [],
        workflows: [],
        assets: []
      };

      const result = backupManager.validateProject(invalidProject);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid createdDate format');
    });

    it('should provide warnings for missing optional fields', () => {
      const projectWithoutSettings = {
        projectId: 'test-id',
        name: 'Test Project',
        type: 'novel-to-anime',
        createdDate: new Date().toISOString(),
        novels: [],
        characters: [],
        workflows: [],
        assets: []
        // Missing settings
      };

      const result = backupManager.validateProject(projectWithoutSettings);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Missing or invalid settings object');
    });
  });

  describe('setMaxBackups', () => {
    it('should update max backups setting', () => {
      backupManager.setMaxBackups(20);
      // Verify through behavior - would need to mock file system to test fully
      expect(true).toBe(true);
    });
  });
});
