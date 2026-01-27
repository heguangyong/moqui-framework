/**
 * Checkpoint Test: WorkflowStore Methods
 * 
 * This test verifies that all store methods work correctly before proceeding
 * with component integration.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkflowStore } from '../workflowStore';
import type { Workflow } from '../../types/workflow';

describe('WorkflowStore - Checkpoint Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Project-Workflow Mapping', () => {
    it('should set and get project-workflow mapping', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Set mapping
      store.setProjectWorkflowMapping(projectId, workflowId);

      // Verify mapping is set
      expect(store.projectWorkflowMap.get(projectId)).toBe(workflowId);
    });

    it('should persist mapping to localStorage', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Set mapping
      store.setProjectWorkflowMapping(projectId, workflowId);

      // Verify localStorage
      const stored = localStorage.getItem('novel_anime_project_workflow_map');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed[projectId]).toBe(workflowId);
    });

    it('should load mapping from localStorage', () => {
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Set localStorage directly
      localStorage.setItem('novel_anime_project_workflow_map', JSON.stringify({
        [projectId]: workflowId
      }));

      // Create new store and load
      const store = useWorkflowStore();
      store.loadProjectWorkflowMap();

      // Verify mapping is loaded
      expect(store.projectWorkflowMap.get(projectId)).toBe(workflowId);
    });

    it('should clear project-workflow mapping', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Set mapping
      store.setProjectWorkflowMapping(projectId, workflowId);
      expect(store.projectWorkflowMap.get(projectId)).toBe(workflowId);

      // Clear mapping
      store.clearProjectWorkflowMapping(projectId);
      expect(store.projectWorkflowMap.get(projectId)).toBeUndefined();
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Set invalid JSON
      localStorage.setItem('novel_anime_project_workflow_map', 'invalid json');

      const store = useWorkflowStore();
      
      // Should not throw
      expect(() => store.loadProjectWorkflowMap()).not.toThrow();
      
      // Should initialize with empty map
      expect(store.projectWorkflowMap.size).toBe(0);
    });
  });

  describe('Workflow Lookup by Project', () => {
    it('should find workflow by projectId from cache', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Create a workflow
      const workflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        nodes: [],
        connections: [],
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: projectId
      };

      store.workflows.push(workflow);
      store.setProjectWorkflowMapping(projectId, workflowId);

      // Find workflow
      const found = store.getWorkflowByProjectId(projectId);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(workflowId);
    });

    it('should find workflow by projectId through search', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Create a workflow without setting mapping
      const workflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        nodes: [],
        connections: [],
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: projectId
      };

      store.workflows.push(workflow);

      // Find workflow (should search and update cache)
      const found = store.getWorkflowByProjectId(projectId);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(workflowId);

      // Verify cache was updated
      expect(store.projectWorkflowMap.get(projectId)).toBe(workflowId);
    });

    it('should return null if workflow not found', () => {
      const store = useWorkflowStore();
      const projectId = 'nonexistent-project';

      const found = store.getWorkflowByProjectId(projectId);
      expect(found).toBeNull();
    });

    it('should clean up stale mapping', () => {
      const store = useWorkflowStore();
      const projectId = 'project-123';
      const workflowId = 'workflow-456';

      // Set mapping without workflow
      store.setProjectWorkflowMapping(projectId, workflowId);
      expect(store.projectWorkflowMap.get(projectId)).toBe(workflowId);

      // Try to find workflow (should clean up stale mapping)
      const found = store.getWorkflowByProjectId(projectId);
      expect(found).toBeNull();
      expect(store.projectWorkflowMap.get(projectId)).toBeUndefined();
    });
  });

  describe('Node Title Helper', () => {
    it('should return correct titles for known node types', () => {
      const store = useWorkflowStore();

      expect(store.getNodeTitle('novel-parser')).toBe('小说解析器');
      expect(store.getNodeTitle('character-analyzer')).toBe('角色分析器');
      expect(store.getNodeTitle('scene-generator')).toBe('场景生成器');
      expect(store.getNodeTitle('script-converter')).toBe('脚本转换器');
      expect(store.getNodeTitle('video-generator')).toBe('视频生成器');
    });

    it('should return type as-is for unknown node types', () => {
      const store = useWorkflowStore();

      expect(store.getNodeTitle('unknown-type')).toBe('unknown-type');
    });
  });

  describe('State Initialization', () => {
    it('should initialize with correct default state', () => {
      const store = useWorkflowStore();

      expect(store.workflows).toEqual([]);
      expect(store.currentWorkflowId).toBeNull();
      expect(store.projectWorkflowMap).toBeInstanceOf(Map);
      expect(store.projectWorkflowMap.size).toBe(0);
      expect(store.isCreatingWorkflowForProject).toBeNull();
    });
  });
});
