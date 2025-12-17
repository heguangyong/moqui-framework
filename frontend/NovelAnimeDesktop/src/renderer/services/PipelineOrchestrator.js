/**
 * Pipeline Orchestrator Service for Desktop App
 * Simplified version of the main project's PipelineOrchestrator
 */
export class PipelineOrchestrator {
  constructor() {
    this.executions = new Map();
    this.progressCallbacks = new Map();
    this.nodeProcessors = new Map();
    this.activeExecutions = 0;
    this.maxConcurrentExecutions = 3;
    
    this.initializeNodeProcessors();
  }

  /**
   * Execute workflow with progress tracking
   */
  async executeWorkflow(workflow, initialData = {}, options = {}) {
    const executionId = `execution_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      context: {
        executionId,
        workflow,
        data: initialData,
        nodeResults: new Map(),
        errors: [],
        warnings: []
      },
      options: {
        parallelExecution: options.parallelExecution ?? true,
        maxRetries: options.maxRetries ?? 3,
        timeout: options.timeout,
        errorHandling: options.errorHandling ?? 'stop'
      }
    };

    this.executions.set(executionId, execution);
    
    // Start execution
    this.startExecution(execution);
    
    return executionId;
  }

  /**
   * Monitor execution progress
   */
  monitorProgress(executionId, callback) {
    this.progressCallbacks.set(executionId, callback);
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    return this.executions.get(executionId) || null;
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId) {
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

    return true;
  }

  // Private methods
  async startExecution(execution) {
    try {
      await this.executeNodes(execution);
    } catch (error) {
      this.handleExecutionError(execution, error);
    }
  }

  async executeNodes(execution) {
    const { workflow } = execution.context;
    const executedNodes = new Set();
    
    // Find starting nodes
    const startingNodes = this.findStartingNodes(workflow);
    
    if (startingNodes.length === 0) {
      throw new Error('No starting nodes found in workflow');
    }

    // Execute nodes in sequence for simplicity
    for (const startNode of startingNodes) {
      await this.executeNodeChain(execution, startNode, executedNodes);
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
  }

  async executeNodeChain(execution, node, executedNodes) {
    if (executedNodes.has(node.id) || execution.status !== 'running') {
      return;
    }

    try {
      this.notifyProgress(execution.id, {
        pipelineId: execution.id,
        status: 'running',
        progress: execution.progress,
        message: `Executing: ${node.name}`,
        currentNode: node.id
      });

      const result = await this.executeNode(execution.context, node);
      
      execution.context.nodeResults.set(node.id, result);
      executedNodes.add(node.id);
      
      // Update progress
      execution.progress = Math.round((executedNodes.size / execution.context.workflow.nodes.length) * 100);
      
      // Execute dependent nodes
      const dependentNodes = this.getNodeDependents(execution.context.workflow, node.id);
      
      for (const dependentNode of dependentNodes) {
        await this.executeNodeChain(execution, dependentNode, executedNodes);
      }
      
    } catch (error) {
      await this.handleNodeError(execution, node, error);
    }
  }

  async executeNode(context, node) {
    const processor = this.nodeProcessors.get(node.type);
    if (!processor) {
      throw new Error(`No processor found for node type: ${node.type}`);
    }

    return processor(context, node);
  }

  handleExecutionError(execution, error) {
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
  }

  async handleNodeError(execution, node, error) {
    const errorInfo = {
      nodeId: node.id,
      nodeName: node.name,
      error: error.message || error,
      timestamp: new Date()
    };

    execution.context.errors.push(errorInfo);

    if (execution.options.errorHandling === 'stop') {
      execution.status = 'failed';
      execution.endTime = new Date();
      
      this.notifyProgress(execution.id, {
        pipelineId: execution.id,
        status: 'failed',
        progress: execution.progress,
        message: `Execution failed at node: ${node.name}`,
        error: error.message
      });
    }
  }

  notifyProgress(executionId, status) {
    const callback = this.progressCallbacks.get(executionId);
    if (callback) {
      callback(status);
    }
  }

  findStartingNodes(workflow) {
    const nodesWithIncoming = new Set();
    
    workflow.connections.forEach(conn => {
      nodesWithIncoming.add(conn.toNodeId);
    });

    return workflow.nodes.filter(node => !nodesWithIncoming.has(node.id));
  }

  getNodeDependents(workflow, nodeId) {
    const dependentIds = workflow.connections
      .filter(conn => conn.fromNodeId === nodeId)
      .map(conn => conn.toNodeId);

    return workflow.nodes.filter(node => dependentIds.includes(node.id));
  }

  initializeNodeProcessors() {
    // Novel Parser
    this.nodeProcessors.set('novel-parser', async (context, node) => {
      await this.simulateProcessing(2000);
      return {
        chapters: ['第一章', '第二章', '第三章'],
        characters: ['主角', '配角1', '配角2'],
        metadata: { totalWords: 50000, estimatedReadTime: '3小时' }
      };
    });

    // Character Analyzer
    this.nodeProcessors.set('character-analyzer', async (context, node) => {
      await this.simulateProcessing(1500);
      return {
        characters: [
          { name: '主角', role: '主角', description: '勇敢的年轻人' },
          { name: '配角1', role: '朋友', description: '忠诚的伙伴' }
        ],
        relationships: ['主角-配角1: 朋友关系']
      };
    });

    // Scene Generator
    this.nodeProcessors.set('scene-generator', async (context, node) => {
      await this.simulateProcessing(2500);
      return {
        scenes: [
          { id: 1, title: '开场', description: '故事开始的场景' },
          { id: 2, title: '冲突', description: '主要冲突发生' },
          { id: 3, title: '解决', description: '问题得到解决' }
        ]
      };
    });

    // Script Converter
    this.nodeProcessors.set('script-converter', async (context, node) => {
      await this.simulateProcessing(2000);
      return {
        scripts: ['场景1脚本', '场景2脚本', '场景3脚本'],
        dialogues: ['对话1', '对话2', '对话3']
      };
    });

    // Video Generator
    this.nodeProcessors.set('video-generator', async (context, node) => {
      await this.simulateProcessing(5000);
      return {
        videos: ['video1.mp4', 'video2.mp4'],
        metadata: { duration: '5分钟', resolution: '1080p' }
      };
    });
  }

  async simulateProcessing(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
}