import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowConnection,
  WorkflowConfiguration,
  VisualPipeline,
  PipelineLayout,
  NodeLayout,
  ConnectionLayout,
  NodeConfig,
  NodeStatus,
  ProgressStatus,
  ValidationResult
} from '../types/core';

/**
 * Workflow Editor Service
 * 
 * Provides visual interface for pipeline management and customization.
 * Supports drag-and-drop workflow editing, real-time status updates,
 * and configuration management.
 */
export class WorkflowEditor {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeWorkflow: string | null = null;
  private progressCallbacks: Map<string, (status: ProgressStatus) => void> = new Map();
  private validationRules: Map<string, (config: NodeConfig) => ValidationResult> = new Map();

  constructor() {
    this.initializeDefaultValidationRules();
  }

  /**
   * Create a new workflow definition
   */
  createWorkflow(
    name: string,
    description: string,
    configuration?: Partial<WorkflowConfiguration>
  ): WorkflowDefinition {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const workflow: WorkflowDefinition = {
      id: workflowId,
      name,
      description,
      nodes: [],
      connections: [],
      configuration: {
        autoStart: false,
        parallelExecution: true,
        errorHandling: 'stop',
        maxRetries: 3,
        ...configuration
      }
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Load an existing workflow definition
   */
  loadWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Set the active workflow for editing
   */
  setActiveWorkflow(workflowId: string): boolean {
    if (this.workflows.has(workflowId)) {
      this.activeWorkflow = workflowId;
      return true;
    }
    return false;
  }

  /**
   * Get the currently active workflow
   */
  getActiveWorkflow(): WorkflowDefinition | null {
    if (!this.activeWorkflow) return null;
    return this.workflows.get(this.activeWorkflow) || null;
  }

  /**
   * Add a node to the active workflow
   */
  addNode(
    type: string,
    name: string,
    position: { x: number; y: number },
    configuration?: NodeConfig
  ): WorkflowNode | null {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return null;

    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const node: WorkflowNode = {
      id: nodeId,
      type,
      name,
      position,
      configuration: configuration || {},
      status: 'idle'
    };

    workflow.nodes.push(node);
    return node;
  }

  /**
   * Remove a node from the active workflow
   */
  removeNode(nodeId: string): boolean {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    // Remove the node
    const nodeIndex = workflow.nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex === -1) return false;

    workflow.nodes.splice(nodeIndex, 1);

    // Remove all connections involving this node
    workflow.connections = workflow.connections.filter(
      conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );

    return true;
  }

  /**
   * Update node position (for drag-and-drop)
   */
  updateNodePosition(nodeId: string, position: { x: number; y: number }): boolean {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.position = position;
    return true;
  }

  /**
   * Update node configuration
   */
  updateNodeConfiguration(nodeId: string, config: NodeConfig): ValidationResult {
    const workflow = this.getActiveWorkflow();
    if (!workflow) {
      return {
        isValid: false,
        errors: [{ code: 'NO_ACTIVE_WORKFLOW', message: 'No active workflow selected', severity: 'error' }],
        warnings: []
      };
    }

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      return {
        isValid: false,
        errors: [{ code: 'NODE_NOT_FOUND', message: `Node ${nodeId} not found`, severity: 'error' }],
        warnings: []
      };
    }

    // Validate configuration
    const validationResult = this.validateNodeConfiguration(node.type, config);
    if (validationResult.isValid) {
      node.configuration = { ...node.configuration, ...config };
    }

    return validationResult;
  }

  /**
   * Add a connection between two nodes
   */
  addConnection(
    fromNodeId: string,
    toNodeId: string,
    condition?: string
  ): WorkflowConnection | null {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return null;

    // Validate that both nodes exist
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

    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const connection: WorkflowConnection = {
      id: connectionId,
      fromNodeId,
      toNodeId,
      ...(condition && { condition })
    };

    workflow.connections.push(connection);
    return connection;
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): boolean {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const connectionIndex = workflow.connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex === -1) return false;

    workflow.connections.splice(connectionIndex, 1);
    return true;
  }

  /**
   * Render the workflow as a visual pipeline
   */
  renderPipeline(workflowId?: string): VisualPipeline | null {
    const workflow = workflowId ? this.getWorkflow(workflowId) : this.getActiveWorkflow();
    if (!workflow) return null;

    const layout = this.generatePipelineLayout(workflow);
    
    return {
      id: `visual_${workflow.id}`,
      workflowId: workflow.id,
      renderData: {
        workflow,
        timestamp: new Date().toISOString(),
        nodeCount: workflow.nodes.length,
        connectionCount: workflow.connections.length
      },
      layout
    };
  }

  /**
   * Generate layout information for visual rendering
   */
  private generatePipelineLayout(workflow: WorkflowDefinition): PipelineLayout {
    const nodeLayouts: NodeLayout[] = workflow.nodes.map(node => ({
      nodeId: node.id,
      position: node.position,
      size: this.calculateNodeSize(node),
      style: this.getNodeStyle(node)
    }));

    const connectionLayouts: ConnectionLayout[] = workflow.connections.map(connection => {
      const style = this.getConnectionStyle(connection);
      return {
        connectionId: connection.id,
        path: this.calculateConnectionPath(workflow, connection),
        style: {
          strokeColor: style.strokeColor,
          strokeWidth: style.strokeWidth,
          ...(style.strokeDasharray && { strokeDasharray: style.strokeDasharray })
        }
      };
    });

    return {
      nodes: nodeLayouts,
      connections: connectionLayouts
    };
  }

  /**
   * Calculate node size based on type and content
   */
  private calculateNodeSize(node: WorkflowNode): { width: number; height: number } {
    const baseWidth = 120;
    const baseHeight = 60;
    
    // Adjust size based on node type
    switch (node.type) {
      case 'novel_parser':
      case 'character_system':
      case 'plot_analyzer':
        return { width: baseWidth + 20, height: baseHeight + 10 };
      
      case 'episode_generator':
      case 'script_converter':
      case 'storyboard_creator':
        return { width: baseWidth + 30, height: baseHeight + 15 };
      
      case 'ai_video_generator':
        return { width: baseWidth + 40, height: baseHeight + 20 };
      
      default:
        return { width: baseWidth, height: baseHeight };
    }
  }

  /**
   * Get visual style for a node based on its status
   */
  private getNodeStyle(node: WorkflowNode) {
    const baseStyle = {
      borderWidth: 2,
      textColor: '#333333'
    };

    switch (node.status) {
      case 'idle':
        return {
          ...baseStyle,
          backgroundColor: '#f8f9fa',
          borderColor: '#dee2e6'
        };
      
      case 'running':
        return {
          ...baseStyle,
          backgroundColor: '#e3f2fd',
          borderColor: '#2196f3'
        };
      
      case 'completed':
        return {
          ...baseStyle,
          backgroundColor: '#e8f5e8',
          borderColor: '#4caf50'
        };
      
      case 'failed':
        return {
          ...baseStyle,
          backgroundColor: '#ffebee',
          borderColor: '#f44336'
        };
      
      case 'paused':
        return {
          ...baseStyle,
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800'
        };
      
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f5f5f5',
          borderColor: '#9e9e9e'
        };
    }
  }

  /**
   * Calculate connection path for visual rendering
   */
  private calculateConnectionPath(workflow: WorkflowDefinition, connection: WorkflowConnection): string {
    const fromNode = workflow.nodes.find(n => n.id === connection.fromNodeId);
    const toNode = workflow.nodes.find(n => n.id === connection.toNodeId);
    
    if (!fromNode || !toNode) return '';

    const fromSize = this.calculateNodeSize(fromNode);
    const toSize = this.calculateNodeSize(toNode);
    
    // Calculate connection points
    const fromX = fromNode.position.x + fromSize.width;
    const fromY = fromNode.position.y + fromSize.height / 2;
    const toX = toNode.position.x;
    const toY = toNode.position.y + toSize.height / 2;
    
    // Create a simple curved path
    const midX = (fromX + toX) / 2;
    
    return `M ${fromX} ${fromY} Q ${midX} ${fromY} ${midX} ${(fromY + toY) / 2} Q ${midX} ${toY} ${toX} ${toY}`;
  }

  /**
   * Get visual style for a connection
   */
  private getConnectionStyle(connection: WorkflowConnection) {
    return {
      strokeColor: '#666666',
      strokeWidth: 2,
      strokeDasharray: connection.condition ? '5,5' : undefined
    };
  }

  /**
   * Validate workflow configuration
   */
  validateWorkflow(workflowId?: string): ValidationResult {
    const workflow = workflowId ? this.getWorkflow(workflowId) : this.getActiveWorkflow();
    if (!workflow) {
      return {
        isValid: false,
        errors: [{ code: 'NO_WORKFLOW', message: 'No workflow to validate', severity: 'error' }],
        warnings: []
      };
    }

    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for nodes without connections (except start/end nodes)
    const connectedNodes = new Set<string>();
    workflow.connections.forEach(conn => {
      connectedNodes.add(conn.fromNodeId);
      connectedNodes.add(conn.toNodeId);
    });

    workflow.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && !this.isTerminalNode(node.type)) {
        warnings.push({
          code: 'ISOLATED_NODE',
          message: `Node ${node.name} is not connected to the workflow`,
          severity: 'warning'
        });
      }

      // Validate node configuration
      const nodeValidation = this.validateNodeConfiguration(node.type, node.configuration);
      errors.push(...nodeValidation.errors);
      warnings.push(...nodeValidation.warnings);
    });

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      errors.push({
        code: 'CIRCULAR_DEPENDENCY',
        message: 'Workflow contains circular dependencies',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a node type is a terminal node (start or end)
   */
  private isTerminalNode(nodeType: string): boolean {
    return ['start', 'end', 'input', 'output'].includes(nodeType);
  }

  /**
   * Check for circular dependencies in the workflow
   */
  private hasCircularDependencies(workflow: WorkflowDefinition): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = workflow.connections.filter(conn => conn.fromNodeId === nodeId);
      for (const connection of outgoingConnections) {
        if (hasCycle(connection.toNodeId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (hasCycle(node.id)) return true;
    }

    return false;
  }

  /**
   * Monitor progress of workflow execution
   */
  monitorProgress(pipelineId: string, callback: (status: ProgressStatus) => void): void {
    this.progressCallbacks.set(pipelineId, callback);
  }

  /**
   * Update progress status (called by pipeline orchestrator)
   */
  updateProgress(status: ProgressStatus): void {
    const callback = this.progressCallbacks.get(status.pipelineId);
    if (callback) {
      callback(status);
    }
  }

  /**
   * Stop monitoring progress
   */
  stopMonitoring(pipelineId: string): void {
    this.progressCallbacks.delete(pipelineId);
  }

  /**
   * Update node status
   */
  updateNodeStatus(nodeId: string, status: NodeStatus): boolean {
    const workflow = this.getActiveWorkflow();
    if (!workflow) return false;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    node.status = status;
    return true;
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Delete a workflow
   */
  deleteWorkflow(workflowId: string): boolean {
    if (this.activeWorkflow === workflowId) {
      this.activeWorkflow = null;
    }
    return this.workflows.delete(workflowId);
  }

  /**
   * Clone a workflow
   */
  cloneWorkflow(workflowId: string, newName: string): WorkflowDefinition | null {
    const originalWorkflow = this.getWorkflow(workflowId);
    if (!originalWorkflow) return null;

    const clonedWorkflow: WorkflowDefinition = {
      ...originalWorkflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: newName,
      nodes: originalWorkflow.nodes.map(node => ({
        ...node,
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        status: 'idle'
      })),
      connections: originalWorkflow.connections.map(conn => ({
        ...conn,
        id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      }))
    };

    // Update connection references to new node IDs
    const nodeIdMap = new Map<string, string>();
    originalWorkflow.nodes.forEach((originalNode, index) => {
      nodeIdMap.set(originalNode.id, clonedWorkflow.nodes[index].id);
    });

    clonedWorkflow.connections.forEach(conn => {
      conn.fromNodeId = nodeIdMap.get(conn.fromNodeId) || conn.fromNodeId;
      conn.toNodeId = nodeIdMap.get(conn.toNodeId) || conn.toNodeId;
    });

    this.workflows.set(clonedWorkflow.id, clonedWorkflow);
    return clonedWorkflow;
  }

  /**
   * Export workflow to JSON
   */
  exportWorkflow(workflowId: string): string | null {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) return null;

    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Import workflow from JSON
   */
  importWorkflow(jsonData: string): WorkflowDefinition | null {
    try {
      const workflow: WorkflowDefinition = JSON.parse(jsonData);
      
      // Validate basic structure
      if (!workflow.id || !workflow.name || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.connections)) {
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
   * Initialize default validation rules
   */
  private initializeDefaultValidationRules(): void {
    // Novel Parser validation
    this.validationRules.set('novel_parser', (config: NodeConfig) => {
      const errors: any[] = [];
      const warnings: any[] = [];

      if (!config.inputFormat) {
        errors.push({
          code: 'MISSING_INPUT_FORMAT',
          message: 'Input format is required',
          field: 'inputFormat',
          severity: 'error'
        });
      }

      if (config.maxFileSize && config.maxFileSize > 10 * 1024 * 1024) {
        warnings.push({
          code: 'LARGE_FILE_SIZE',
          message: 'Large file size may cause performance issues',
          field: 'maxFileSize',
          severity: 'warning'
        });
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Character System validation
    this.validationRules.set('character_system', (config: NodeConfig) => {
      const errors: any[] = [];
      const warnings: any[] = [];

      if (config.maxCharacters && config.maxCharacters < 1) {
        errors.push({
          code: 'INVALID_MAX_CHARACTERS',
          message: 'Maximum characters must be at least 1',
          field: 'maxCharacters',
          severity: 'error'
        });
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Add more validation rules for other node types as needed
  }

  /**
   * Validate node configuration
   */
  private validateNodeConfiguration(nodeType: string, config: NodeConfig): ValidationResult {
    const validator = this.validationRules.get(nodeType);
    if (!validator) {
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    }

    return validator(config);
  }

  /**
   * Register custom validation rule
   */
  registerValidationRule(nodeType: string, validator: (config: NodeConfig) => ValidationResult): void {
    this.validationRules.set(nodeType, validator);
  }

  /**
   * Create a default novel-to-anime workflow
   */
  createDefaultWorkflow(): WorkflowDefinition {
    const workflow = this.createWorkflow(
      'Novel to Anime Pipeline',
      'Default workflow for converting novels to animated videos'
    );

    // Set this workflow as active to add nodes
    const previousActive = this.activeWorkflow;
    this.setActiveWorkflow(workflow.id);

    // Add nodes in sequence
    const nodes = [
      { type: 'novel_parser', name: 'Parse Novel', x: 50, y: 100 },
      { type: 'character_system', name: 'Character Analysis', x: 250, y: 100 },
      { type: 'plot_analyzer', name: 'Plot Analysis', x: 450, y: 100 },
      { type: 'episode_generator', name: 'Generate Episodes', x: 650, y: 100 },
      { type: 'script_converter', name: 'Convert to Script', x: 850, y: 100 },
      { type: 'storyboard_creator', name: 'Create Storyboard', x: 1050, y: 100 },
      { type: 'ai_video_generator', name: 'Generate Video', x: 1250, y: 100 }
    ];

    const createdNodes: WorkflowNode[] = [];
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
}