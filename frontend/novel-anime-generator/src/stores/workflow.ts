import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort?: string;
  targetPort?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export const useWorkflowStore = defineStore('workflow', () => {
  // State
  const activeWorkflow = ref<Workflow | null>(null);
  const workflows = ref<Workflow[]>([]);
  const isExecuting = ref(false);

  // Getters
  const hasActiveWorkflow = computed(() => !!activeWorkflow.value);
  const workflowCount = computed(() => workflows.value.length);
  const runningWorkflows = computed(() => 
    workflows.value.filter(w => w.status === 'running')
  );

  // Actions
  const createWorkflow = (name: string, description: string = ''): Workflow => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name,
      description,
      nodes: [],
      connections: [],
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    workflows.value.push(newWorkflow);
    return newWorkflow;
  };

  const setActiveWorkflow = (workflow: Workflow) => {
    activeWorkflow.value = workflow;
  };

  const updateWorkflow = (workflowId: string, updates: Partial<Workflow>) => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (workflow) {
      Object.assign(workflow, updates, { updatedAt: new Date() });
      
      if (activeWorkflow.value?.id === workflowId) {
        activeWorkflow.value = workflow;
      }
    }
  };

  const deleteWorkflow = (workflowId: string) => {
    const index = workflows.value.findIndex(w => w.id === workflowId);
    if (index !== -1) {
      workflows.value.splice(index, 1);
      
      if (activeWorkflow.value?.id === workflowId) {
        activeWorkflow.value = null;
      }
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('工作流不存在');
    }

    isExecuting.value = true;
    workflow.status = 'running';

    try {
      // 模拟工作流执行
      console.log('开始执行工作流:', workflow.name);
      
      // 模拟节点执行
      for (const node of workflow.nodes) {
        node.status = 'running';
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟处理时间
        node.status = 'completed';
      }

      workflow.status = 'completed';
      console.log('工作流执行完成:', workflow.name);
    } catch (error) {
      workflow.status = 'error';
      console.error('工作流执行失败:', error);
      throw error;
    } finally {
      isExecuting.value = false;
      workflow.updatedAt = new Date();
    }
  };

  const stopWorkflow = (workflowId: string) => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'idle';
      workflow.nodes.forEach(node => {
        if (node.status === 'running') {
          node.status = 'idle';
        }
      });
      workflow.updatedAt = new Date();
    }
  };

  const addNode = (workflowId: string, nodeType: string, position: { x: number; y: number }): WorkflowNode => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('工作流不存在');
    }

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      name: getNodeTypeName(nodeType),
      position,
      configuration: {},
      status: 'idle'
    };

    workflow.nodes.push(newNode);
    workflow.updatedAt = new Date();
    
    return newNode;
  };

  const removeNode = (workflowId: string, nodeId: string) => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (!workflow) return;

    // 移除节点
    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      workflow.nodes.splice(nodeIndex, 1);
    }

    // 移除相关连接
    workflow.connections = workflow.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );

    workflow.updatedAt = new Date();
  };

  const addConnection = (
    workflowId: string, 
    sourceNodeId: string, 
    targetNodeId: string
  ): WorkflowConnection => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('工作流不存在');
    }

    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      sourceNodeId,
      targetNodeId
    };

    workflow.connections.push(newConnection);
    workflow.updatedAt = new Date();
    
    return newConnection;
  };

  const removeConnection = (workflowId: string, connectionId: string) => {
    const workflow = workflows.value.find(w => w.id === workflowId);
    if (!workflow) return;

    const index = workflow.connections.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      workflow.connections.splice(index, 1);
      workflow.updatedAt = new Date();
    }
  };

  const getNodeTypeName = (nodeType: string): string => {
    const typeNames: Record<string, string> = {
      'novel_parser': '小说解析器',
      'character_system': '角色系统',
      'plot_analyzer': '情节分析器',
      'episode_generator': '分集生成器',
      'script_converter': '脚本转换器',
      'storyboard_creator': '分镜创建器',
      'ai_video_generator': 'AI视频生成器'
    };
    return typeNames[nodeType] || nodeType;
  };

  const loadDefaultWorkflows = () => {
    // 创建默认工作流
    const defaultWorkflow = createWorkflow(
      '小说转视频标准流程',
      '完整的小说到动画视频转换工作流'
    );

    // 添加节点
    const nodes = [
      { type: 'novel_parser', position: { x: 100, y: 100 } },
      { type: 'character_system', position: { x: 300, y: 100 } },
      { type: 'plot_analyzer', position: { x: 500, y: 100 } },
      { type: 'episode_generator', position: { x: 100, y: 250 } },
      { type: 'script_converter', position: { x: 300, y: 250 } },
      { type: 'storyboard_creator', position: { x: 500, y: 250 } },
      { type: 'ai_video_generator', position: { x: 300, y: 400 } }
    ];

    nodes.forEach(nodeConfig => {
      addNode(defaultWorkflow.id, nodeConfig.type, nodeConfig.position);
    });

    // 添加连接
    const nodeIds = defaultWorkflow.nodes.map(n => n.id);
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]
    ];

    connections.forEach(([sourceIndex, targetIndex]) => {
      addConnection(defaultWorkflow.id, nodeIds[sourceIndex], nodeIds[targetIndex]);
    });

    setActiveWorkflow(defaultWorkflow);
  };

  // Initialize with default workflows
  loadDefaultWorkflows();

  return {
    // State
    activeWorkflow,
    workflows,
    isExecuting,
    
    // Getters
    hasActiveWorkflow,
    workflowCount,
    runningWorkflows,
    
    // Actions
    createWorkflow,
    setActiveWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    stopWorkflow,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    getNodeTypeName
  };
});