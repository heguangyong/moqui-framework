/**
 * Workflow Components Property Tests
 * Property 4: Component Props Isolation
 * 
 * Validates: Requirements 4.3, 4.4
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import * as fc from 'fast-check';
import WorkflowNode from './WorkflowNode.vue';
import type { WorkflowNode as WorkflowNodeType, NodePosition } from '../../types/workflow';

// Arbitraries for generating test data
const positionArb = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
});

const nodeTypeArb = fc.constantFrom(
  'novel-parser',
  'character-analyzer', 
  'scene-generator',
  'script-converter',
  'video-generator'
);

const nodeStatusArb = fc.constantFrom('idle', 'running', 'completed', 'error');

const workflowNodeArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `node_${s}`),
  type: nodeTypeArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  position: positionArb,
  status: nodeStatusArb,
  configuration: fc.dictionary(fc.string(), fc.string()),
});

describe('WorkflowNode - Property 4: Component Props Isolation', () => {
  describe('Props Rendering', () => {
    it('should render node name from props', () => {
      fc.assert(
        fc.property(workflowNodeArb, (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          expect(wrapper.text()).toContain(node.name);
          wrapper.unmount();
        }),
        { numRuns: 20 }
      );
    });

    it('should position node based on props', () => {
      fc.assert(
        fc.property(workflowNodeArb, (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          const style = wrapper.attributes('style');
          expect(style).toContain(`left: ${node.position.x}px`);
          expect(style).toContain(`top: ${node.position.y}px`);
          wrapper.unmount();
        }),
        { numRuns: 20 }
      );
    });

    it('should apply selected class when selected prop is true', () => {
      fc.assert(
        fc.property(workflowNodeArb, fc.boolean(), (node, selected) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType, selected },
          });
          
          if (selected) {
            expect(wrapper.classes()).toContain('node-selected');
          } else {
            expect(wrapper.classes()).not.toContain('node-selected');
          }
          wrapper.unmount();
        }),
        { numRuns: 20 }
      );
    });

    it('should apply status class based on node status', () => {
      fc.assert(
        fc.property(workflowNodeArb, (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          const classes = wrapper.classes();
          if (node.status === 'running') {
            expect(classes).toContain('node-running');
          } else if (node.status === 'completed') {
            expect(classes).toContain('node-completed');
          }
          wrapper.unmount();
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Event Emission', () => {
    it('should emit select event on click', async () => {
      fc.assert(
        fc.asyncProperty(workflowNodeArb, async (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          await wrapper.trigger('click');
          
          const emitted = wrapper.emitted('select');
          expect(emitted).toBeTruthy();
          expect(emitted![0][0]).toEqual(node);
          wrapper.unmount();
        }),
        { numRuns: 10 }
      );
    });

    it('should emit edit event on double click', async () => {
      fc.assert(
        fc.asyncProperty(workflowNodeArb, async (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          await wrapper.trigger('dblclick');
          
          const emitted = wrapper.emitted('edit');
          expect(emitted).toBeTruthy();
          expect(emitted![0][0]).toEqual(node);
          wrapper.unmount();
        }),
        { numRuns: 10 }
      );
    });

    it('should emit remove event when remove button clicked', async () => {
      fc.assert(
        fc.asyncProperty(workflowNodeArb, async (node) => {
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          const removeBtn = wrapper.find('.node-remove');
          await removeBtn.trigger('click');
          
          const emitted = wrapper.emitted('remove');
          expect(emitted).toBeTruthy();
          expect(emitted![0][0]).toBe(node.id);
          wrapper.unmount();
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Props Immutability', () => {
    it('should not mutate props when rendering', () => {
      fc.assert(
        fc.property(workflowNodeArb, (node) => {
          const originalNode = JSON.parse(JSON.stringify(node));
          
          const wrapper = mount(WorkflowNode, {
            props: { node: node as WorkflowNodeType },
          });
          
          // Props should remain unchanged after mount
          expect(node).toEqual(originalNode);
          wrapper.unmount();
        }),
        { numRuns: 20 }
      );
    });
  });
});

describe('WorkflowComponents - Integration', () => {
  it('should render correct icon for each node type', () => {
    const nodeTypes = [
      { type: 'novel-parser', icon: '📖' },
      { type: 'character-analyzer', icon: '👤' },
      { type: 'scene-generator', icon: '🎬' },
      { type: 'script-converter', icon: '📝' },
      { type: 'video-generator', icon: '🎥' },
    ];

    nodeTypes.forEach(({ type, icon }) => {
      const node: WorkflowNodeType = {
        id: 'test-node',
        type: type as any,
        name: 'Test Node',
        position: { x: 0, y: 0 },
        status: 'idle',
        configuration: {},
      };

      const wrapper = mount(WorkflowNode, {
        props: { node },
      });

      expect(wrapper.find('.node-icon').text()).toBe(icon);
      wrapper.unmount();
    });
  });
});
