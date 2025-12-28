/**
 * Workflow Editor Service for Desktop App
 * Simplified version of the main project's WorkflowEditor
 */
export class WorkflowEditor {
  constructor() {
    this.workflows = new Map();
    this.activeWorkflow = null;
    this.nodeIdCounter = 1;
    this.connectionIdCounter = 1;
  }

  /**
   * Create a new workflow
   */
  createWorkflow(name, description) {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const workflow = {
      id: workflowId,
      name,
      description,
      nodes: [],
      connections: [],
      configuration: {
        autoStart: false,
        parallelExecution: true,
        errorHandling: 'stop',
        maxRetries: 3
      }
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Set active workflow
   */
  setActiveWorkflow(workflowId) {
    if (this.workflows.has(workflowId)) {
      this.activeWorkflow = workflowId;
      return true;
    }
    return false;
  }

  /**
   * Get active workflow
   */
  getActiveWorkflow() {
    if (!this.activeWorkflow) return null;
    return this.workflows.get(this.activeWorkflow) || null;
  }

  /**
   * Add node to workflow
   */
  addNode(type, name, position, configuration = {}) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return null;

    const nodeId = `node_${this.nodeIdCounter++}`;
    
    const node = {
      id: nodeId,
      type,
      name,
      position,
      configuration,
      status: 'idle'
    };

    workflow.nodes.push(node);
    return node;
  }

  /**
   * Remove node from workflow
   */
  removeNode(nodeId) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const nodeIndex = workflow.nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex === -1) return false;

    workflow.nodes.splice(nodeIndex, 1);

    // Remove connections involving this node
    workflow.connections = workflow.connections.filter(
      conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );

    return true;
  }

  /**
   * Update node position
   */
  updateNodePosition(nodeId, position) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.position = position;
    return true;
  }

  /**
   * Update node name
   */
  updateNodeName(nodeId, newName) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.name = newName;
    return true;
  }

  /**
   * Update node configuration
   */
  updateNodeConfig(nodeId, config) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.configuration = { ...node.configuration, ...config };
    return true;
  }

  /**
   * Add connection between nodes
   */
  addConnection(fromNodeId, toNodeId) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return null;

    // Validate nodes exist
    const fromNode = workflow.nodes.find(n => n.id === fromNodeId);
    const toNode = workflow.nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return null;

    // Check for existing connection
    const existingConnection = workflow.connections.find(
      conn => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId
    );
    if (existingConnection) return null;

    // Prevent self-connections
    if (fromNodeId === toNodeId) return null;

    const connectionId = `conn_${this.connectionIdCounter++}`;
    
    const connection = {
      id: connectionId,
      fromNodeId,
      toNodeId
    };

    workflow.connections.push(connection);
    return connection;
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId) {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const connectionIndex = workflow.connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex === -1) return false;

    workflow.connections.splice(connectionIndex, 1);
    return true;
  }

  /**
   * Get all workflows
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId) {
    if (this.activeWorkflow === workflowId) {
      this.activeWorkflow = null;
    }
    return this.workflows.delete(workflowId);
  }

  /**
   * Rename workflow
   */
  renameWorkflow(workflowId, newName) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.name = newName;
      return true;
    }
    return false;
  }

  /**
   * Create default workflow
   */
  createDefaultWorkflow() {
    const workflow = this.createWorkflow(
      'Novel to Anime Pipeline',
      'Default workflow for converting novels to animated videos'
    );

    // Set as active to add nodes
    const previousActive = this.activeWorkflow;
    this.setActiveWorkflow(workflow.id);

    // Add nodes in sequence
    const nodes = [
      { type: 'novel-parser', name: '小说解析器', x: 50, y: 100 },
      { type: 'character-analyzer', name: '角色分析器', x: 250, y: 100 },
      { type: 'scene-generator', name: '场景生成器', x: 450, y: 100 },
      { type: 'script-converter', name: '脚本转换器', x: 650, y: 100 },
      { type: 'video-generator', name: '视频生成器', x: 850, y: 100 }
    ];

    const createdNodes = [];
    nodes.forEach(nodeData => {
      const node = this.addNode(nodeData.type, nodeData.name, { x: nodeData.x, y: nodeData.y });
      if (node) createdNodes.push(node);
    });

    // Connect nodes in sequence
    for (let i = 0; i < createdNodes.length - 1; i++) {
      this.addConnection(createdNodes[i].id, createdNodes[i + 1].id);
    }

    // Restore previous active workflow
    if (previousActive) {
      this.setActiveWorkflow(previousActive);
    } else {
      this.activeWorkflow = null;
    }

    return workflow;
  }

  /**
   * Export workflow to JSON
   */
  exportWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Import workflow from JSON
   */
  importWorkflow(jsonData) {
    try {
      const workflow = JSON.parse(jsonData);
      
      if (!workflow.id || !workflow.name || !Array.isArray(workflow.nodes)) {
        throw new Error('Invalid workflow structure');
      }

      // Generate new ID to avoid conflicts
      workflow.id = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      this.workflows.set(workflow.id, workflow);
      return workflow;
    } catch (error) {
      console.error('Failed to import workflow:', error);
      return null;
    }
  }

  /**
   * Validate workflow
   */
  validateWorkflow(workflowId) {
    const workflow = workflowId ? this.workflows.get(workflowId) : this.getActiveWorkflow();
    if (!workflow) {
      return {
        isValid: false,
        errors: [{ message: 'No workflow to validate' }],
        warnings: []
      };
    }

    const errors = [];
    const warnings = [];

    // Check for nodes
    if (workflow.nodes.length === 0) {
      errors.push({ message: 'Workflow must have at least one node' });
    }

    // Check for isolated nodes
    const connectedNodes = new Set();
    workflow.connections.forEach(conn => {
      connectedNodes.add(conn.fromNodeId);
      connectedNodes.add(conn.toNodeId);
    });

    workflow.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && workflow.nodes.length > 1) {
        warnings.push({ message: `Node ${node.name} is not connected to the workflow` });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}