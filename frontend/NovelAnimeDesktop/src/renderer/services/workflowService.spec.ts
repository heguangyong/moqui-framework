/**
 * Workflow Service Property Tests
 * 
 * **Property 2: Service Statelessness**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Tests that the workflowService is stateless - functions return the same
 * result for the same input, regardless of previous calls.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  convertFromBackend,
  convertToBackend,
  validateWorkflow,
  generateUniqueName,
  generateNodeId,
  generateConnectionId,
  exportWorkflow,
  importWorkflow,
} from './workflowService';
import type { Workflow, WorkflowNode, WorkflowConnection } from '../types/workflow';

// ============================================================================
// Arbitrary Generators
// ============================================================================

const nodeTypeArb = fc.constantFrom(
  'novel-parser',
  'character-analyzer',
  'scene-generator',
  'script-converter',
  'video-generator'
) as fc.Arbitrary<WorkflowNode['type']>;

const nodeStatusArb = fc.constantFrom(
  'idle',
  'running',
  'completed',
  'error',
  'skipped'
) as fc.Arbitrary<WorkflowNode['status']>;

const workflowStatusArb = fc.constantFrom(
  'idle',
  'running',
  'completed',
  'failed',
  'paused',
  'cancelled'
) as fc.Arbitrary<Workflow['status']>;

const positionArb = fc.record({
  x: fc.integer({ min: 0, max: 2000 }),
  y: fc.integer({ min: 0, max: 2000 }),
});

// Use a simpler configuration generator to avoid -0 and other edge cases
const configValueArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null)
);

const nodeArb: fc.Arbitrary<WorkflowNode> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  type: nodeTypeArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  position: positionArb,
  configuration: fc.dictionary(fc.string({ minLength: 1 }), configValueArb),
  status: nodeStatusArb,
});

const connectionArb = (nodeIds: string[]): fc.Arbitrary<WorkflowConnection> => {
  if (nodeIds.length < 2) {
    return fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      fromNodeId: fc.constant('node1'),
      toNodeId: fc.constant('node2'),
    });
  }
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    fromNodeId: fc.constantFrom(...nodeIds),
    toNodeId: fc.constantFrom(...nodeIds),
  }).filter(conn => conn.fromNodeId !== conn.toNodeId);
};

const workflowArb: fc.Arbitrary<Workflow> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  nodes: fc.array(nodeArb, { minLength: 0, maxLength: 10 }),
  connections: fc.constant([]) as fc.Arbitrary<WorkflowConnection[]>,
  configuration: fc.record({
    autoStart: fc.boolean(),
    parallelExecution: fc.boolean(),
    errorHandling: fc.constantFrom('stop', 'continue', 'retry') as fc.Arbitrary<'stop' | 'continue' | 'retry'>,
    maxRetries: fc.integer({ min: 0, max: 10 }),
  }),
  status: workflowStatusArb,
  projectId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('workflowService - Property 2: Service Statelessness', () => {
  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * For any backend workflow data, convertFromBackend should always produce
   * the same result for the same input.
   */
  describe('convertFromBackend - Deterministic Output', () => {
    it('should produce identical output for identical input', () => {
      fc.assert(
        fc.property(
          fc.record({
            workflowId: fc.string({ minLength: 1 }),
            name: fc.string(),
            description: fc.string(),
            nodes: fc.oneof(
              fc.constant('[]'),
              fc.array(nodeArb).map(nodes => JSON.stringify(nodes))
            ),
            connections: fc.constant('[]'),
            status: workflowStatusArb,
            projectId: fc.option(fc.string(), { nil: undefined }),
            createdDate: fc.date().map(d => d.toISOString()),
            lastUpdatedDate: fc.date().map(d => d.toISOString()),
          }),
          (backendData) => {
            const result1 = convertFromBackend(backendData);
            const result2 = convertFromBackend(backendData);
            
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * For any workflow, convertToBackend should always produce
   * the same result for the same input.
   */
  describe('convertToBackend - Deterministic Output', () => {
    it('should produce identical output for identical input', () => {
      fc.assert(
        fc.property(workflowArb, (workflow) => {
          const result1 = convertToBackend(workflow);
          const result2 = convertToBackend(workflow);
          
          expect(result1).toEqual(result2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * Round-trip property: converting to backend and back should preserve
   * essential workflow data.
   */
  describe('Conversion Round-Trip', () => {
    it('should preserve essential data through round-trip conversion', () => {
      fc.assert(
        fc.property(workflowArb, (workflow) => {
          const backendData = convertToBackend(workflow);
          const restored = convertFromBackend(backendData);
          
          // Essential fields should be preserved
          expect(restored.id).toBe(workflow.id);
          expect(restored.name).toBe(workflow.name);
          expect(restored.description).toBe(workflow.description);
          expect(restored.status).toBe(workflow.status);
          expect(restored.nodes).toEqual(workflow.nodes);
          expect(restored.connections).toEqual(workflow.connections);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * validateWorkflow should be a pure function - same input, same output.
   */
  describe('validateWorkflow - Deterministic Output', () => {
    it('should produce identical validation results for identical input', () => {
      fc.assert(
        fc.property(workflowArb, (workflow) => {
          const result1 = validateWorkflow(workflow);
          const result2 = validateWorkflow(workflow);
          
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.errors).toEqual(result2.errors);
          expect(result1.warnings).toEqual(result2.warnings);
        }),
        { numRuns: 100 }
      );
    });

    it('should return isValid=false for empty workflow', () => {
      const emptyWorkflow: Workflow = {
        id: 'test',
        name: 'Test',
        description: '',
        nodes: [],
        connections: [],
        configuration: {
          autoStart: false,
          parallelExecution: true,
          errorHandling: 'stop',
          maxRetries: 3,
        },
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const result = validateWorkflow(emptyWorkflow);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * generateUniqueName should be deterministic for the same inputs.
   */
  describe('generateUniqueName - Deterministic Output', () => {
    it('should produce identical output for identical inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ maxLength: 50 }), { maxLength: 20 }),
          (baseName, existingNames) => {
            const result1 = generateUniqueName(baseName, existingNames);
            const result2 = generateUniqueName(baseName, existingNames);
            
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return unique name not in existing names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ maxLength: 50 }), { maxLength: 20 }),
          (baseName, existingNames) => {
            const result = generateUniqueName(baseName, existingNames);
            
            // Result should either be the base name (if not in existing)
            // or a unique variant
            if (existingNames.includes(baseName.substring(0, 20))) {
              expect(existingNames).not.toContain(result);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * Export/Import round-trip should preserve workflow data.
   */
  describe('Export/Import Round-Trip', () => {
    it('should preserve workflow data through export/import', () => {
      fc.assert(
        fc.property(workflowArb, (workflow) => {
          const exported = exportWorkflow(workflow);
          const imported = importWorkflow(exported);
          
          expect(imported).not.toBeNull();
          if (imported) {
            // Name and structure should be preserved
            expect(imported.name).toBe(workflow.name);
            expect(imported.description).toBe(workflow.description);
            expect(imported.nodes).toEqual(workflow.nodes);
            expect(imported.connections).toEqual(workflow.connections);
            // ID will be regenerated, so we don't check it
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frontend-architecture-refactor, Property 2: Service Statelessness
   * 
   * ID generators should produce unique IDs.
   */
  describe('ID Generators - Uniqueness', () => {
    it('generateNodeId should produce unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateNodeId());
      }
      expect(ids.size).toBe(100);
    });

    it('generateConnectionId should produce unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateConnectionId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
