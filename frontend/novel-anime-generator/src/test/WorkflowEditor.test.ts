import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEditor } from '../services/WorkflowEditor';
import { WorkflowDefinition, WorkflowNode, NodeConfig } from '../types/core';

describe('WorkflowEditor', () => {
  let editor: WorkflowEditor;
  let testWorkflow: WorkflowDefinition;

  beforeEach(() => {
    editor = new WorkflowEditor();
    
    // Create a test workflow
    testWorkflow = editor.createWorkflow(
      'Test Workflow',
      'A workflow for testing purposes'
    );
    editor.setActiveWorkflow(testWorkflow.id);
  });

  describe('Workflow Management', () => {
    it('should create a new workflow with default configuration', () => {
      const workflow = editor.createWorkflow('New Workflow', 'Test description');
      
      expect(workflow.name).toBe('New Workflow');
      expect(workflow.description).toBe('Test description');
      expect(workflow.nodes).toHaveLength(0);
      expect(workflow.connections).toHaveLength(0);
      expect(workflow.configuration.autoStart).toBe(false);
      expect(workflow.configuration.parallelExecution).toBe(true);
      expect(workflow.configuration.errorHandling).toBe('stop');
      expect(workflow.configuration.maxRetries).toBe(3);
    });

    it('should create workflow with custom configuration', () => {
      const customConfig = {
        autoStart: true,
        parallelExecution: false,
        errorHandling: 'continue' as const,
        maxRetries: 5
      };
      
      const workflow = editor.createWorkflow('Custom Workflow', 'Custom config', customConfig);
      
      expect(workflow.configuration.autoStart).toBe(true);
      expect(workflow.configuration.parallelExecution).toBe(false);
      expect(workflow.configuration.errorHandling).toBe('continue');
      expect(workflow.configuration.maxRetries).toBe(5);
    });

    it('should load and retrieve workflows', () => {
      const workflow = editor.createWorkflow('Load Test', 'Test loading');
      const retrieved = editor.getWorkflow(workflow.id);
      
      expect(retrieved).toEqual(workflow);
    });

    it('should set and get active workflow', () => {
      const workflow1 = editor.createWorkflow('Workflow 1', 'First workflow');
      const workflow2 = editor.createWorkflow('Workflow 2', 'Second workflow');
      
      expect(editor.setActiveWorkflow(workflow1.id)).toBe(true);
      expect(editor.getActiveWorkflow()?.id).toBe(workflow1.id);
      
      expect(editor.setActiveWorkflow(workflow2.id)).toBe(true);
      expect(editor.getActiveWorkflow()?.id).toBe(workflow2.id);
      
      expect(editor.setActiveWorkflow('nonexistent')).toBe(false);
    });

    it('should get all workflows', () => {
      const workflow1 = editor.createWorkflow('Workflow 1', 'First');
      const workflow2 = editor.createWorkflow('Workflow 2', 'Second');
      
      const allWorkflows = editor.getAllWorkflows();
      expect(allWorkflows).toHaveLength(3); // Including testWorkflow
      expect(allWorkflows.map(w => w.name)).toContain('Workflow 1');
      expect(allWorkflows.map(w => w.name)).toContain('Workflow 2');
    });

    it('should delete workflows', () => {
      const workflow = editor.createWorkflow('To Delete', 'Will be deleted');
      editor.setActiveWorkflow(workflow.id);
      
      expect(editor.deleteWorkflow(workflow.id)).toBe(true);
      expect(editor.getWorkflow(workflow.id)).toBeNull();
      expect(editor.getActiveWorkflow()).toBeNull();
      
      expect(editor.deleteWorkflow('nonexistent')).toBe(false);
    });

    it('should clone workflows', () => {
      // Add some nodes and connections to the test workflow
      const node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 });
      editor.addConnection(node1!.id, node2!.id);
      
      const cloned = editor.cloneWorkflow(testWorkflow.id, 'Cloned Workflow');
      
      expect(cloned).toBeDefined();
      expect(cloned!.name).toBe('Cloned Workflow');
      expect(cloned!.id).not.toBe(testWorkflow.id);
      expect(cloned!.nodes).toHaveLength(2);
      expect(cloned!.connections).toHaveLength(1);
      
      // Node IDs should be different
      expect(cloned!.nodes[0].id).not.toBe(testWorkflow.nodes[0].id);
      expect(cloned!.nodes[1].id).not.toBe(testWorkflow.nodes[1].id);
    });
  });

  describe('Node Management', () => {
    it('should add nodes to active workflow', () => {
      const node = editor.addNode('novel_parser', 'Test Parser', { x: 100, y: 200 });
      
      expect(node).toBeDefined();
      expect(node!.type).toBe('novel_parser');
      expect(node!.name).toBe('Test Parser');
      expect(node!.position).toEqual({ x: 100, y: 200 });
      expect(node!.status).toBe('idle');
      
      const workflow = editor.getActiveWorkflow();
      expect(workflow!.nodes).toHaveLength(1);
      expect(workflow!.nodes[0]).toEqual(node);
    });

    it('should not add node when no active workflow', () => {
      // Clear active workflow by setting to null
      const editor2 = new WorkflowEditor();
      const node = editor2.addNode('novel_parser', 'Test Parser', { x: 100, y: 200 });
      
      expect(node).toBeNull();
    });

    it('should remove nodes and their connections', () => {
      const node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 });
      const node3 = editor.addNode('plot_analyzer', 'Plot', { x: 500, y: 100 });
      
      editor.addConnection(node1!.id, node2!.id);
      editor.addConnection(node2!.id, node3!.id);
      
      const workflow = editor.getActiveWorkflow()!;
      expect(workflow.nodes).toHaveLength(3);
      expect(workflow.connections).toHaveLength(2);
      
      // Remove middle node
      expect(editor.removeNode(node2!.id)).toBe(true);
      
      expect(workflow.nodes).toHaveLength(2);
      expect(workflow.connections).toHaveLength(0); // Both connections removed
      
      expect(editor.removeNode('nonexistent')).toBe(false);
    });

    it('should update node positions', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      expect(editor.updateNodePosition(node!.id, { x: 200, y: 300 })).toBe(true);
      expect(node!.position).toEqual({ x: 200, y: 300 });
      
      expect(editor.updateNodePosition('nonexistent', { x: 0, y: 0 })).toBe(false);
    });

    it('should update node status', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      expect(editor.updateNodeStatus(node!.id, 'running')).toBe(true);
      expect(node!.status).toBe('running');
      
      expect(editor.updateNodeStatus('nonexistent', 'completed')).toBe(false);
    });

    it('should update node configuration with validation', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      const config: NodeConfig = {
        inputFormat: 'txt',
        maxFileSize: 1024 * 1024
      };
      
      const result = editor.updateNodeConfiguration(node!.id, config);
      
      expect(result.isValid).toBe(true);
      expect(node!.configuration).toEqual(expect.objectContaining(config));
    });

    it('should validate node configuration', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      // Invalid configuration (missing required field)
      const invalidConfig: NodeConfig = {
        maxFileSize: 1024 * 1024
        // Missing inputFormat
      };
      
      const result = editor.updateNodeConfiguration(node!.id, invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_INPUT_FORMAT');
    });
  });

  describe('Connection Management', () => {
    let node1: WorkflowNode;
    let node2: WorkflowNode;
    let node3: WorkflowNode;

    beforeEach(() => {
      node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 })!;
      node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 })!;
      node3 = editor.addNode('plot_analyzer', 'Plot', { x: 500, y: 100 })!;
    });

    it('should add connections between nodes', () => {
      const connection = editor.addConnection(node1.id, node2.id);
      
      expect(connection).toBeDefined();
      expect(connection!.fromNodeId).toBe(node1.id);
      expect(connection!.toNodeId).toBe(node2.id);
      
      const workflow = editor.getActiveWorkflow()!;
      expect(workflow.connections).toHaveLength(1);
      expect(workflow.connections[0]).toEqual(connection);
    });

    it('should add connections with conditions', () => {
      const connection = editor.addConnection(node1.id, node2.id, 'success');
      
      expect(connection!.condition).toBe('success');
    });

    it('should not add duplicate connections', () => {
      editor.addConnection(node1.id, node2.id);
      const duplicate = editor.addConnection(node1.id, node2.id);
      
      expect(duplicate).toBeNull();
      
      const workflow = editor.getActiveWorkflow()!;
      expect(workflow.connections).toHaveLength(1);
    });

    it('should not add self-connections', () => {
      const connection = editor.addConnection(node1.id, node1.id);
      
      expect(connection).toBeNull();
    });

    it('should not add connections to nonexistent nodes', () => {
      const connection1 = editor.addConnection('nonexistent', node2.id);
      const connection2 = editor.addConnection(node1.id, 'nonexistent');
      
      expect(connection1).toBeNull();
      expect(connection2).toBeNull();
    });

    it('should remove connections', () => {
      const connection = editor.addConnection(node1.id, node2.id)!;
      
      expect(editor.removeConnection(connection.id)).toBe(true);
      
      const workflow = editor.getActiveWorkflow()!;
      expect(workflow.connections).toHaveLength(0);
      
      expect(editor.removeConnection('nonexistent')).toBe(false);
    });
  });

  describe('Visual Pipeline Rendering', () => {
    it('should render pipeline for active workflow', () => {
      const node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 });
      editor.addConnection(node1!.id, node2!.id);
      
      const pipeline = editor.renderPipeline();
      
      expect(pipeline).toBeDefined();
      expect(pipeline!.workflowId).toBe(testWorkflow.id);
      expect(pipeline!.layout.nodes).toHaveLength(2);
      expect(pipeline!.layout.connections).toHaveLength(1);
      
      // Check node layout
      const nodeLayout = pipeline!.layout.nodes[0];
      expect(nodeLayout.nodeId).toBe(node1!.id);
      expect(nodeLayout.position).toEqual({ x: 100, y: 100 });
      expect(nodeLayout.size.width).toBeGreaterThan(0);
      expect(nodeLayout.size.height).toBeGreaterThan(0);
      expect(nodeLayout.style).toBeDefined();
    });

    it('should render pipeline for specific workflow', () => {
      const otherWorkflow = editor.createWorkflow('Other', 'Other workflow');
      editor.setActiveWorkflow(otherWorkflow.id);
      editor.addNode('novel_parser', 'Parser', { x: 50, y: 50 });
      
      const pipeline = editor.renderPipeline(testWorkflow.id);
      
      expect(pipeline!.workflowId).toBe(testWorkflow.id);
      expect(pipeline!.layout.nodes).toHaveLength(0); // testWorkflow has no nodes
    });

    it('should return null for nonexistent workflow', () => {
      const pipeline = editor.renderPipeline('nonexistent');
      
      expect(pipeline).toBeNull();
    });

    it('should calculate different node sizes based on type', () => {
      const parser = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const generator = editor.addNode('ai_video_generator', 'Generator', { x: 300, y: 100 });
      
      const pipeline = editor.renderPipeline()!;
      const parserLayout = pipeline.layout.nodes.find(n => n.nodeId === parser!.id)!;
      const generatorLayout = pipeline.layout.nodes.find(n => n.nodeId === generator!.id)!;
      
      expect(generatorLayout.size.width).toBeGreaterThan(parserLayout.size.width);
      expect(generatorLayout.size.height).toBeGreaterThan(parserLayout.size.height);
    });

    it('should apply different styles based on node status', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      // Test idle status
      let pipeline = editor.renderPipeline()!;
      let nodeLayout = pipeline.layout.nodes[0];
      expect(nodeLayout.style.backgroundColor).toBe('#f8f9fa');
      
      // Test running status
      editor.updateNodeStatus(node!.id, 'running');
      pipeline = editor.renderPipeline()!;
      nodeLayout = pipeline.layout.nodes[0];
      expect(nodeLayout.style.backgroundColor).toBe('#e3f2fd');
      
      // Test completed status
      editor.updateNodeStatus(node!.id, 'completed');
      pipeline = editor.renderPipeline()!;
      nodeLayout = pipeline.layout.nodes[0];
      expect(nodeLayout.style.backgroundColor).toBe('#e8f5e8');
      
      // Test failed status
      editor.updateNodeStatus(node!.id, 'failed');
      pipeline = editor.renderPipeline()!;
      nodeLayout = pipeline.layout.nodes[0];
      expect(nodeLayout.style.backgroundColor).toBe('#ffebee');
    });
  });

  describe('Workflow Validation', () => {
    it('should validate empty workflow', () => {
      const result = editor.validateWorkflow();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect isolated nodes', () => {
      const node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 });
      const node3 = editor.addNode('plot_analyzer', 'Plot', { x: 500, y: 100 });
      
      // Configure node1 to avoid validation errors
      editor.updateNodeConfiguration(node1!.id, { inputFormat: 'txt' });
      
      // Connect only node1 and node2, leaving node3 isolated
      editor.addConnection(node1!.id, node2!.id);
      
      const result = editor.validateWorkflow();
      
      // Check if there are warnings about isolated nodes
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'ISOLATED_NODE')).toBe(true);
      
      // The workflow should be valid (warnings don't make it invalid)
      expect(result.isValid).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const node1 = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      const node2 = editor.addNode('character_system', 'Characters', { x: 300, y: 100 });
      const node3 = editor.addNode('plot_analyzer', 'Plot', { x: 500, y: 100 });
      
      // Create circular dependency: node1 -> node2 -> node3 -> node1
      editor.addConnection(node1!.id, node2!.id);
      editor.addConnection(node2!.id, node3!.id);
      editor.addConnection(node3!.id, node1!.id);
      
      const result = editor.validateWorkflow();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });

    it('should validate node configurations', () => {
      const node = editor.addNode('character_system', 'Characters', { x: 100, y: 100 });
      
      // Set invalid configuration - this should fail validation during updateNodeConfiguration
      const updateResult = editor.updateNodeConfiguration(node!.id, { maxCharacters: -1 });
      expect(updateResult.isValid).toBe(false);
      expect(updateResult.errors.some(e => e.code === 'INVALID_MAX_CHARACTERS')).toBe(true);
      
      // Since the invalid config wasn't applied, workflow validation should pass
      const workflowResult = editor.validateWorkflow();
      expect(workflowResult.isValid).toBe(true);
    });
  });

  describe('Progress Monitoring', () => {
    it('should register and call progress callbacks', () => {
      let receivedStatus: any = null;
      
      editor.monitorProgress('test-pipeline', (status) => {
        receivedStatus = status;
      });
      
      const testStatus = {
        pipelineId: 'test-pipeline',
        overallProgress: 50,
        currentStage: 'processing',
        stageProgress: 25,
        message: 'Processing data'
      };
      
      editor.updateProgress(testStatus);
      
      expect(receivedStatus).toEqual(testStatus);
    });

    it('should stop monitoring progress', () => {
      let callCount = 0;
      
      editor.monitorProgress('test-pipeline', () => {
        callCount++;
      });
      
      editor.updateProgress({
        pipelineId: 'test-pipeline',
        overallProgress: 25,
        currentStage: 'start',
        stageProgress: 0
      });
      
      expect(callCount).toBe(1);
      
      editor.stopMonitoring('test-pipeline');
      
      editor.updateProgress({
        pipelineId: 'test-pipeline',
        overallProgress: 50,
        currentStage: 'middle',
        stageProgress: 50
      });
      
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Import/Export', () => {
    it('should export workflow to JSON', () => {
      const node = editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      const jsonString = editor.exportWorkflow(testWorkflow.id);
      
      expect(jsonString).toBeDefined();
      
      const parsed = JSON.parse(jsonString!);
      expect(parsed.id).toBe(testWorkflow.id);
      expect(parsed.name).toBe(testWorkflow.name);
      expect(parsed.nodes).toHaveLength(1);
    });

    it('should return null for nonexistent workflow export', () => {
      const result = editor.exportWorkflow('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should import workflow from JSON', () => {
      const originalWorkflow = editor.getActiveWorkflow()!;
      editor.addNode('novel_parser', 'Parser', { x: 100, y: 100 });
      
      const jsonString = editor.exportWorkflow(originalWorkflow.id)!;
      const imported = editor.importWorkflow(jsonString);
      
      expect(imported).toBeDefined();
      expect(imported!.id).not.toBe(originalWorkflow.id); // Should have new ID
      expect(imported!.name).toBe(originalWorkflow.name);
      expect(imported!.nodes).toHaveLength(1);
    });

    it('should handle invalid JSON import', () => {
      const result = editor.importWorkflow('invalid json');
      
      expect(result).toBeNull();
    });

    it('should handle invalid workflow structure import', () => {
      const invalidWorkflow = JSON.stringify({ name: 'Invalid' }); // Missing required fields
      const result = editor.importWorkflow(invalidWorkflow);
      
      expect(result).toBeNull();
    });
  });

  describe('Default Workflow Creation', () => {
    it('should create default novel-to-anime workflow', () => {
      const defaultWorkflow = editor.createDefaultWorkflow();
      
      expect(defaultWorkflow.name).toBe('Novel to Anime Pipeline');
      expect(defaultWorkflow.nodes).toHaveLength(7);
      expect(defaultWorkflow.connections).toHaveLength(6);
      
      // Check node types in order
      const expectedTypes = [
        'novel_parser',
        'character_system',
        'plot_analyzer',
        'episode_generator',
        'script_converter',
        'storyboard_creator',
        'ai_video_generator'
      ];
      
      defaultWorkflow.nodes.forEach((node, index) => {
        expect(node.type).toBe(expectedTypes[index]);
      });
      
      // Check that nodes are connected in sequence
      for (let i = 0; i < defaultWorkflow.connections.length; i++) {
        const connection = defaultWorkflow.connections[i];
        expect(connection.fromNodeId).toBe(defaultWorkflow.nodes[i].id);
        expect(connection.toNodeId).toBe(defaultWorkflow.nodes[i + 1].id);
      }
    });
  });

  describe('Custom Validation Rules', () => {
    it('should register and use custom validation rules', () => {
      editor.registerValidationRule('custom_node', (config) => {
        if (!config.customField) {
          return {
            isValid: false,
            errors: [{ code: 'MISSING_CUSTOM_FIELD', message: 'Custom field required', severity: 'error' }],
            warnings: []
          };
        }
        return { isValid: true, errors: [], warnings: [] };
      });
      
      const node = editor.addNode('custom_node', 'Custom', { x: 100, y: 100 });
      
      // Test without custom field
      let result = editor.updateNodeConfiguration(node!.id, {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('MISSING_CUSTOM_FIELD');
      
      // Test with custom field
      result = editor.updateNodeConfiguration(node!.id, { customField: 'value' });
      expect(result.isValid).toBe(true);
    });
  });
});