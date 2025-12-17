import { defineStore } from 'pinia';
import { WorkflowEditor } from '../services/WorkflowEditor.js';
import { PipelineOrchestrator } from '../services/PipelineOrchestrator.js';

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    workflowEditor: new WorkflowEditor(),
    pipelineOrchestrator: new PipelineOrchestrator(),
    currentWorkflow: null,
    workflows: [],
    executions: new Map(),
    isExecuting: false,
    executionProgress: 0,
    executionStatus: 'idle',
    executionMessage: '',
    error: null
  }),

  getters: {
    hasCurrentWorkflow: (state) => state.currentWorkflow !== null,
    
    currentWorkflowNodes: (state) => {
      if (!state.currentWorkflow) return [];
      return state.currentWorkflow.nodes;
    },

    currentWorkflowConnections: (state) => {
      if (!state.currentWorkflow) return [];
      return state.currentWorkflow.connections;
    },

    activeExecutions: (state) => {
      return Array.from(state.executions.values()).filter(exec => 
        exec.status === 'running' || exec.status === 'paused'
      );
    }
  },

  actions: {
    // Workflow management
    createWorkflow(name, description) {
      const workflow = this.workflowEditor.createWorkflow(name, description);
      this.workflows.push(workflow);
      return workflow;
    },

    setCurrentWorkflow(workflowId) {
      const success = this.workflowEditor.setActiveWorkflow(workflowId);
      if (success) {
        this.currentWorkflow = this.workflowEditor.getActiveWorkflow();
      }
      return success;
    },

    createDefaultWorkflow() {
      const workflow = this.workflowEditor.createDefaultWorkflow();
      this.workflows.push(workflow);
      this.setCurrentWorkflow(workflow.id);
      return workflow;
    },

    deleteWorkflow(workflowId) {
      const success = this.workflowEditor.deleteWorkflow(workflowId);
      if (success) {
        this.workflows = this.workflows.filter(w => w.id !== workflowId);
        if (this.currentWorkflow && this.currentWorkflow.id === workflowId) {
          this.currentWorkflow = null;
        }
      }
      return success;
    },

    // Node management
    addNode(type, name, position, configuration = {}) {
      const node = this.workflowEditor.addNode(type, name, position, configuration);
      if (node && this.currentWorkflow) {
        this.currentWorkflow.nodes.push(node);
      }
      return node;
    },

    removeNode(nodeId) {
      const success = this.workflowEditor.removeNode(nodeId);
      if (success && this.currentWorkflow) {
        this.currentWorkflow.nodes = this.currentWorkflow.nodes.filter(n => n.id !== nodeId);
        this.currentWorkflow.connections = this.currentWorkflow.connections.filter(
          conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
        );
      }
      return success;
    },

    updateNodePosition(nodeId, position) {
      const success = this.workflowEditor.updateNodePosition(nodeId, position);
      if (success && this.currentWorkflow) {
        const node = this.currentWorkflow.nodes.find(n => n.id === nodeId);
        if (node) {
          node.position = position;
        }
      }
      return success;
    },

    // Connection management
    addConnection(fromNodeId, toNodeId) {
      const connection = this.workflowEditor.addConnection(fromNodeId, toNodeId);
      if (connection && this.currentWorkflow) {
        this.currentWorkflow.connections.push(connection);
      }
      return connection;
    },

    removeConnection(connectionId) {
      const success = this.workflowEditor.removeConnection(connectionId);
      if (success && this.currentWorkflow) {
        this.currentWorkflow.connections = this.currentWorkflow.connections.filter(
          conn => conn.id !== connectionId
        );
      }
      return success;
    },

    // Workflow execution
    async executeWorkflow(workflowId, initialData = {}) {
      if (this.isExecuting) {
        throw new Error('Another workflow is already executing');
      }

      const workflow = this.workflows.find(w => w.id === workflowId) || this.currentWorkflow;
      if (!workflow) {
        throw new Error('No workflow to execute');
      }

      this.isExecuting = true;
      this.executionStatus = 'running';
      this.executionProgress = 0;
      this.executionMessage = 'Starting workflow execution...';
      this.error = null;

      try {
        const executionId = await this.pipelineOrchestrator.executeWorkflow(workflow, initialData);
        
        // Monitor progress
        this.pipelineOrchestrator.monitorProgress(executionId, (status) => {
          this.executionProgress = status.progress;
          this.executionStatus = status.status;
          this.executionMessage = status.message || '';
          
          if (status.error) {
            this.error = status.error;
          }

          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            this.isExecuting = false;
          }
        });

        // Store execution
        const execution = {
          id: executionId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          startTime: new Date(),
          status: 'running'
        };
        this.executions.set(executionId, execution);

        return executionId;
      } catch (error) {
        this.isExecuting = false;
        this.executionStatus = 'failed';
        this.error = error.message;
        throw error;
      }
    },

    cancelExecution(executionId) {
      const success = this.pipelineOrchestrator.cancelExecution(executionId);
      if (success) {
        this.isExecuting = false;
        this.executionStatus = 'cancelled';
        this.executionMessage = 'Execution cancelled';
        
        const execution = this.executions.get(executionId);
        if (execution) {
          execution.status = 'cancelled';
          execution.endTime = new Date();
        }
      }
      return success;
    },

    getExecutionStatus(executionId) {
      return this.pipelineOrchestrator.getExecutionStatus(executionId);
    },

    // Workflow validation
    validateCurrentWorkflow() {
      if (!this.currentWorkflow) {
        return {
          isValid: false,
          errors: [{ message: 'No workflow selected' }],
          warnings: []
        };
      }

      return this.workflowEditor.validateWorkflow(this.currentWorkflow.id);
    },

    // Import/Export
    exportWorkflow(workflowId) {
      return this.workflowEditor.exportWorkflow(workflowId);
    },

    importWorkflow(jsonData) {
      const workflow = this.workflowEditor.importWorkflow(jsonData);
      if (workflow) {
        this.workflows.push(workflow);
      }
      return workflow;
    },

    // Utility methods
    loadAllWorkflows() {
      this.workflows = this.workflowEditor.getAllWorkflows();
    },

    clearError() {
      this.error = null;
    },

    resetExecution() {
      this.isExecuting = false;
      this.executionProgress = 0;
      this.executionStatus = 'idle';
      this.executionMessage = '';
      this.error = null;
    }
  }
});