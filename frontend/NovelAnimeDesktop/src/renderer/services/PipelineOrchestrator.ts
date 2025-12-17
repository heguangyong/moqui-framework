import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowConnection,
  PipelineExecution,
  ExecutionContext,
  NodeStatus,
  ProgressStatus,
  ValidationResult
} from '../types/core';

/**
 * Pipeline Orchestrator Service
 * 
 * Manages workflow execution, component coordination, and process control.
 * Provides parallel processing capabilities and comprehensive error handling.
 */
export class PipelineOrchestrator {
  private executions: Map<string, PipelineExecution> = new Map();
  private progressCallbacks: Map<string, (status: ProgressStatus) => void> = new Map();
  private nodeProcessors: Map<string, (context: ExecutionContext) => Promise<any>> = new Map();
  private executionQueue: string[] = [];
  private maxConcurrentExecutions = 3;
  private activeExecutions = 0;

  constructor() {
    this.initializeNodeProcessors();
  }

  /**
   * Start workflow execution
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    initialData?: any,
    options?: {
      parallelExecution?: boolean;
      maxRetries?: number;
      timeout?: number;
    }
  ): Promise<string> {
    const executionId = `execution_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Validate workflow before execution
    const validation = this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const execution: PipelineExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      context: {
        executionId,
        workflow,
        data: initialData || {},
        nodeResults: new Map(),
        errors: [],
        warnings: []
      },
      options: {
        parallelExecution: options?.parallelExecution ?? workflow.configuration.parallelExecution,
        maxRetries: options?.maxRetries ?? workflow.configuration.maxRetries,
        timeout: options?.timeout,
        errorHandling: workflow.configuration.errorHandling
      }
    };

    this.executions.set(executionId, execution);
    
    // Start execution
    this.startExecution(execution);
    
    return executionId;
  }

  /**
   * Pause workflow execution
   */
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'paused';
    execution.pausedTime = new Date();
    
    this.notifyProgress(executionId, {
      pipelineId: executionId,
      status: 'paused',
      progress: execution.progress,
      message: 'Execution paused by user'
    });

    return true;
  }

  /**
   * Resume workflow execution
   */
  resumeExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') {
      return false;
    }

    execution.status = 'running';
    execution.resumedTime = new Date();
    
    // Continue execution from where it was paused
    this.continueExecution(execution);
    
    this.notifyProgress(executionId, {
      pipelineId: executionId,
      status: 'running',
      progress: execution.progress,
      message: 'Execution resumed'
    });

    return true;
  }

  /**
   * Cancel workflow execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || ['completed', 'failed', 'cancelled'].includes(execution.status)) {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    
    this.notifyProgress(executionId, {
      pipelineId: executionId,
      status: 'cancelled',
      progress: execution.progress,
      message: 'Execution cancelled by user'
    });

    this.activeExecutions--;
    this.processQueue();

    return true;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): PipelineExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all executions
   */
  getAllExecutions(): PipelineExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Monitor execution progress
   */
  monitorProgress(executionId: string, callback: (status: ProgressStatus) => void): void {
    this.progressCallbacks.set(executionId, callback);
  }

  /**
   * Stop monitoring progress
   */
  stopMonitoring(executionId: string): void {
    this.progressCallbacks.delete(executionId);
  }

  /**
   * Register custom node processor
   */
  registerNodeProcessor(
    nodeType: string,
    processor: (context: ExecutionContext) => Promise<any>
  ): void {
    this.nodeProcessors.set(nodeType, processor);
  }

  // Private methods

  private async startExecution(execution: PipelineExecution): Promise<void> {
    if (this.activeExecutions >= this.maxConcurrentExecutions) {
      this.executionQueue.push(execution.id);
      return;
    }

    this.activeExecutions++;
    
    try {
      await this.executeNodes(execution);
    } catch (error) {
      this.handleExecutionError(execution, error);
    }
  }

  private async executeNodes(execution: PipelineExecution): Promise<void> {
    const { workflow } = execution.context;
    const executedNodes = new Set<string>();
    const nodeStatuses = new Map<string, NodeStatus>();
    
    // Initialize all nodes as idle
    workflow.nodes.forEach(node => {
      nodeStatuses.set(node.id, 'idle');
    });

    // Find starting nodes (nodes with no incoming connections)
    const startingNodes = this.findStartingNodes(workflow);
    
    if (startingNodes.length === 0) {
      throw new Error('No starting nodes found in workflow');
    }

    // Execute nodes in dependency order
    const executionPromises: Promise<void>[] = [];
    
    for (const startNode of startingNodes) {
      if (execution.options.parallelExecution) {
        executionPromises.push(
          this.executeNodeChain(execution, startNode, executedNodes, nodeStatuses)
        );
      } else {
        await this.executeNodeChain(execution, startNode, executedNodes, nodeStatuses);
      }
    }

    if (execution.options.parallelExecution) {
      await Promise.all(executionPromises);
    }

    // Mark execution as completed
    execution.status = 'completed';
    execution.endTime = new Date();
    execution.progress = 100;
    
    this.notifyProgress(execution.id, {
      pipelineId: execution.id,
      status: 'completed',
      progress: 100,
      message: 'Workflow execution completed successfully'
    });

    this.activeExecutions--;
    this.processQueue();
  }

  private async executeNodeChain(
    execution: PipelineExecution,
    node: WorkflowNode,
    executedNodes: Set<string>,
    nodeStatuses: Map<string, NodeStatus>
  ): Promise<void> {
    if (executedNodes.has(node.id) || execution.status !== 'running') {
      return;
    }

    // Check if all dependencies are satisfied
    const dependencies = this.getNodeDependencies(execution.context.workflow, node.id);
    const dependenciesSatisfied = dependencies.every(depId => executedNodes.has(depId));
    
    if (!dependenciesSatisfied) {
      // Wait for dependencies
      await this.waitForDependencies(execution, node, executedNodes);
    }

    if (execution.status !== 'running') {
      return;
    }

    try {
      // Execute the node
      nodeStatuses.set(node.id, 'running');
      
      this.notifyProgress(execution.id, {
        pipelineId: execution.id,
        status: 'running',
        progress: execution.progress,
        message: `Executing: ${node.name}`,
        currentNode: node.id
      });

      const result = await this.executeNode(execution.context, node);
      
      // Store result
      execution.context.nodeResults.set(node.id, result);
      executedNodes.add(node.id);
      nodeStatuses.set(node.id, 'completed');
      
      // Update progress
      execution.progress = Math.round((executedNodes.size / execution.context.workflow.nodes.length) * 100);
      
      // Execute dependent nodes
      const dependentNodes = this.getNodeDependents(execution.context.workflow, node.id);
      
      for (const dependentNode of dependentNodes) {
        if (execution.options.parallelExecution) {
          // Execute in parallel (don't await)
          this.executeNodeChain(execution, dependentNode, executedNodes, nodeStatuses);
        } else {
          await this.executeNodeChain(execution, dependentNode, executedNodes, nodeStatuses);
        }
      }
      
    } catch (error) {
      nodeStatuses.set(node.id, 'failed');
      await this.handleNodeError(execution, node, error);
      
      // If execution failed, don't continue with dependent nodes
      if (execution.status === 'failed') {
        return;
      }
    }
  }

  private async executeNode(context: ExecutionContext, node: WorkflowNode): Promise<any> {
    const processor = this.nodeProcessors.get(node.type);
    if (!processor) {
      throw new Error(`No processor found for node type: ${node.type}`);
    }

    // Create node-specific context
    const nodeContext: ExecutionContext = {
      ...context,
      currentNode: node,
      nodeConfiguration: node.configuration
    };

    // Apply timeout if specified
    if (context.workflow.configuration.timeout) {
      return Promise.race([
        processor(nodeContext),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Node execution timeout')), context.workflow.configuration.timeout)
        )
      ]);
    }

    return processor(nodeContext);
  }

  private async handleNodeError(
    execution: PipelineExecution,
    node: WorkflowNode,
    error: any
  ): Promise<void> {
    const errorInfo = {
      nodeId: node.id,
      nodeName: node.name,
      error: error.message || error,
      timestamp: new Date()
    };

    execution.context.errors.push(errorInfo);

    // Handle based on error handling strategy
    switch (execution.options.errorHandling) {
      case 'stop':
        execution.status = 'failed';
        execution.endTime = new Date();
        
        this.notifyProgress(execution.id, {
          pipelineId: execution.id,
          status: 'failed',
          progress: execution.progress,
          message: `Execution failed at node: ${node.name}`,
          error: error.message
        });
        
        this.activeExecutions--;
        this.processQueue();
        return; // Important: return to stop further execution

      case 'continue':
        // Log error but continue execution
        execution.context.warnings.push({
          nodeId: node.id,
          message: `Node ${node.name} failed but execution continues`,
          timestamp: new Date()
        });
        break;

      case 'retry':
        // Implement retry logic
        await this.retryNode(execution, node, error);
        break;
    }
  }

  private async retryNode(
    execution: PipelineExecution,
    node: WorkflowNode,
    error: any
  ): Promise<void> {
    const retryCount = (node as any).retryCount || 0;
    
    if (retryCount < execution.options.maxRetries) {
      (node as any).retryCount = retryCount + 1;
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await this.executeNode(execution.context, node);
        execution.context.nodeResults.set(node.id, result);
      } catch (retryError) {
        await this.handleNodeError(execution, node, retryError);
      }
    } else {
      // Max retries exceeded
      await this.handleNodeError(execution, node, new Error(`Max retries exceeded: ${error.message}`));
    }
  }

  private handleExecutionError(execution: PipelineExecution, error: any): void {
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.context.errors.push({
      error: error.message || error,
      timestamp: new Date()
    });

    this.notifyProgress(execution.id, {
      pipelineId: execution.id,
      status: 'failed',
      progress: execution.progress,
      message: 'Execution failed',
      error: error.message
    });

    this.activeExecutions--;
    this.processQueue();
  }

  private continueExecution(execution: PipelineExecution): void {
    // Resume from paused state
    this.executeNodes(execution).catch(error => {
      this.handleExecutionError(execution, error);
    });
  }

  private processQueue(): void {
    if (this.executionQueue.length > 0 && this.activeExecutions < this.maxConcurrentExecutions) {
      const nextExecutionId = this.executionQueue.shift();
      if (nextExecutionId) {
        const execution = this.executions.get(nextExecutionId);
        if (execution) {
          this.startExecution(execution);
        }
      }
    }
  }

  private notifyProgress(executionId: string, status: ProgressStatus): void {
    const callback = this.progressCallbacks.get(executionId);
    if (callback) {
      callback(status);
    }
  }

  private findStartingNodes(workflow: WorkflowDefinition): WorkflowNode[] {
    const nodesWithIncoming = new Set<string>();
    
    workflow.connections.forEach(conn => {
      nodesWithIncoming.add(conn.toNodeId);
    });

    return workflow.nodes.filter(node => !nodesWithIncoming.has(node.id));
  }

  private getNodeDependencies(workflow: WorkflowDefinition, nodeId: string): string[] {
    return workflow.connections
      .filter(conn => conn.toNodeId === nodeId)
      .map(conn => conn.fromNodeId);
  }

  private getNodeDependents(workflow: WorkflowDefinition, nodeId: string): WorkflowNode[] {
    const dependentIds = workflow.connections
      .filter(conn => conn.fromNodeId === nodeId)
      .map(conn => conn.toNodeId);

    return workflow.nodes.filter(node => dependentIds.includes(node.id));
  }

  private async waitForDependencies(
    execution: PipelineExecution,
    node: WorkflowNode,
    executedNodes: Set<string>
  ): Promise<void> {
    const dependencies = this.getNodeDependencies(execution.context.workflow, node.id);
    
    return new Promise((resolve) => {
      const checkDependencies = () => {
        const satisfied = dependencies.every(depId => executedNodes.has(depId));
        if (satisfied || execution.status !== 'running') {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  private validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for nodes
    if (workflow.nodes.length === 0) {
      errors.push({
        code: 'NO_NODES',
        message: 'Workflow must have at least one node',
        severity: 'error'
      });
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      errors.push({
        code: 'CIRCULAR_DEPENDENCY',
        message: 'Workflow contains circular dependencies',
        severity: 'error'
      });
    }

    // Check for unreachable nodes
    const reachableNodes = this.findReachableNodes(workflow);
    const unreachableNodes = workflow.nodes.filter(node => !reachableNodes.has(node.id));
    
    unreachableNodes.forEach(node => {
      warnings.push({
        code: 'UNREACHABLE_NODE',
        message: `Node ${node.name} is not reachable from any starting node`,
        severity: 'warning'
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private hasCircularDependencies(workflow: WorkflowDefinition): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependents = this.getNodeDependents(workflow, nodeId);
      for (const dependent of dependents) {
        if (hasCycle(dependent.id)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (hasCycle(node.id)) return true;
    }

    return false;
  }

  private findReachableNodes(workflow: WorkflowDefinition): Set<string> {
    const reachable = new Set<string>();
    const startingNodes = this.findStartingNodes(workflow);
    
    const traverse = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      
      reachable.add(nodeId);
      const dependents = this.getNodeDependents(workflow, nodeId);
      dependents.forEach(dependent => traverse(dependent.id));
    };

    startingNodes.forEach(node => traverse(node.id));
    return reachable;
  }

  private initializeNodeProcessors(): void {
    // Register default node processors
    this.nodeProcessors.set('novel_parser', async (context) => {
      // Simulate novel parsing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { chapters: [], characters: [], metadata: {} };
    });

    this.nodeProcessors.set('character_system', async (context) => {
      // Simulate character analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { characters: [], relationships: [] };
    });

    this.nodeProcessors.set('plot_analyzer', async (context) => {
      // Simulate plot analysis
      await new Promise(resolve => setTimeout(resolve, 1800));
      return { plotPoints: [], themes: [], structure: {} };
    });

    this.nodeProcessors.set('episode_generator', async (context) => {
      // Simulate episode generation
      await new Promise(resolve => setTimeout(resolve, 2500));
      return { episodes: [], metadata: {} };
    });

    this.nodeProcessors.set('script_converter', async (context) => {
      // Simulate script conversion
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { scripts: [], dialogues: [] };
    });

    this.nodeProcessors.set('storyboard_creator', async (context) => {
      // Simulate storyboard creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { storyboards: [], shots: [] };
    });

    this.nodeProcessors.set('ai_video_generator', async (context) => {
      // Simulate video generation
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { videos: [], metadata: {} };
    });
  }
}