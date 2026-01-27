/**
 * Workflow Store - TypeScript Version
 * 重构后的工作流状态管理，纯数据状态，无类实例
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.6
 */

import { defineStore } from 'pinia';
import * as workflowService from '../services/workflowService';
import { PipelineOrchestrator } from '../services/PipelineOrchestrator';
import type {
  Workflow,
  WorkflowNode,
  WorkflowConnection,
  WorkflowStatus,
  WorkflowNodeType,
  NodePosition,
  NodeConfiguration,
  WorkflowExecution,
  ValidationResult,
} from '../types/workflow';
import type { ApiError } from '../types/api';

// ============================================================================
// State Interface
// ============================================================================

/**
 * WorkflowStore 状态接口
 * 纯数据状态，无类实例
 */
export interface WorkflowState {
  // 工作流数据
  workflows: Workflow[];
  currentWorkflowId: string | null;
  
  // 执行状态
  executions: WorkflowExecution[];
  isExecuting: boolean;
  executionProgress: number;
  executionStatus: WorkflowStatus;
  executionMessage: string;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  
  // 错误状态
  error: ApiError | null;
  
  // 项目-工作流映射 (Requirements: 5.1, 5.2, 8.1, 8.2)
  projectWorkflowMap: Map<string, string>;  // projectId -> workflowId
  isCreatingWorkflowForProject: string | null;  // projectId currently being created
}

// ============================================================================
// Store Definition
// ============================================================================

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    // 工作流数据
    workflows: [],
    currentWorkflowId: null,
    
    // 执行状态
    executions: [],
    isExecuting: false,
    executionProgress: 0,
    executionStatus: 'idle',
    executionMessage: '',
    
    // 加载状态
    isLoading: false,
    isInitialized: false,
    
    // 错误状态
    error: null,
    
    // 项目-工作流映射 (Requirements: 5.1, 5.2, 8.1, 8.2)
    projectWorkflowMap: new Map<string, string>(),
    isCreatingWorkflowForProject: null,
  }),

  getters: {
    /**
     * 获取当前工作流
     */
    currentWorkflow: (state): Workflow | null => {
      if (!state.currentWorkflowId) return null;
      return state.workflows.find(w => w.id === state.currentWorkflowId) || null;
    },

    /**
     * 工作流数量
     */
    workflowCount: (state): number => state.workflows.length,

    /**
     * 是否有当前工作流
     */
    hasCurrentWorkflow: (state): boolean => state.currentWorkflowId !== null,

    /**
     * 当前工作流的节点
     */
    currentWorkflowNodes(): WorkflowNode[] {
      const workflow = this.currentWorkflow;
      return workflow?.nodes || [];
    },

    /**
     * 当前工作流的连接
     */
    currentWorkflowConnections(): WorkflowConnection[] {
      const workflow = this.currentWorkflow;
      return workflow?.connections || [];
    },

    /**
     * 活跃的执行
     */
    activeExecutions: (state): WorkflowExecution[] => {
      return state.executions.filter(exec => 
        exec.status === 'running' || exec.status === 'paused'
      );
    },
  },

  actions: {
    // ========================================================================
    // 初始化
    // ========================================================================

    /**
     * 初始化 Store (Requirements: 5.5)
     */
    async initialize(): Promise<void> {
      if (this.isInitialized) return;
      
      // Load project-workflow mappings from localStorage
      this.loadProjectWorkflowMap();
      
      await this.loadWorkflows();
      this.isInitialized = true;
    },

    /**
     * 等待初始化完成
     */
    async waitForInit(): Promise<void> {
      if (this.isInitialized) return;
      await this.initialize();
    },

    // ========================================================================
    // 工作流管理
    // ========================================================================

    /**
     * 加载所有工作流
     * @param projectId - 可选的项目ID，用于过滤工作流
     */
    async loadWorkflows(projectId?: string): Promise<void> {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await workflowService.getWorkflows(projectId ? { projectId } : undefined);
        
        if (result.success && result.data) {
          this.workflows = result.data.workflows;
          console.log('📂 loadWorkflows: loaded', this.workflows.length, 'workflows', 
                      projectId ? `for project ${projectId}` : '(all projects)');
        } else {
          this.error = {
            code: 'API_ERROR' as any,
            message: result.message || 'Failed to load workflows',
          };
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        this.error = {
          code: 'UNKNOWN' as any,
          message,
        };
        console.error('[WorkflowStore] loadWorkflows failed:', message);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 选择工作流
     */
    selectWorkflow(workflowId: string): boolean {
      const exists = this.workflows.some(w => w.id === workflowId);
      if (exists) {
        this.currentWorkflowId = workflowId;
        console.log('📌 selectWorkflow:', workflowId);
        return true;
      }
      console.warn('⚠️ selectWorkflow: workflow not found:', workflowId);
      console.log('📋 Available workflows:', this.workflows.map(w => ({ id: w.id, name: w.name })));
      return false;
    },

    /**
     * 创建工作流 (Requirements: 8.1, 8.3)
     */
    async createWorkflow(data: { name: string; description?: string; projectId?: string }): Promise<Workflow | null> {
      this.isLoading = true;
      this.error = null;
      
      try {
        // 生成唯一名称
        const existingNames = this.workflows.map(w => w.name);
        const uniqueName = workflowService.generateUniqueName(data.name, existingNames);
        
        const result = await workflowService.createWorkflow({
          name: uniqueName,
          description: data.description,
          projectId: data.projectId,
        });
        
        if (result.success && result.data?.workflow) {
          const workflow = result.data.workflow;
          this.workflows.push(workflow);
          
          // If projectId is provided, set the mapping
          if (data.projectId) {
            this.setProjectWorkflowMapping(data.projectId, workflow.id);
          }
          
          console.log('✅ createWorkflow:', workflow.name, data.projectId ? `(projectId: ${data.projectId})` : '');
          return workflow;
        } else {
          this.error = {
            code: 'API_ERROR' as any,
            message: result.message || 'Failed to create workflow',
          };
          return null;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        this.error = {
          code: 'UNKNOWN' as any,
          message,
        };
        console.error('[WorkflowStore] createWorkflow failed:', message);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 删除工作流
     */
    async deleteWorkflow(workflowId: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await workflowService.deleteWorkflow(workflowId);
        
        if (result.success) {
          this.workflows = this.workflows.filter(w => w.id !== workflowId);
          
          if (this.currentWorkflowId === workflowId) {
            this.currentWorkflowId = null;
          }
          
          console.log('🗑️ deleteWorkflow:', workflowId);
          return true;
        } else {
          this.error = {
            code: 'API_ERROR' as any,
            message: result.message || 'Failed to delete workflow',
          };
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        this.error = {
          code: 'UNKNOWN' as any,
          message,
        };
        console.error('[WorkflowStore] deleteWorkflow failed:', message);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 重命名工作流
     */
    async renameWorkflow(workflowId: string, newName: string): Promise<{ success: boolean; name: string }> {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) {
        return { success: false, name: newName };
      }
      
      // 如果名称没变，直接返回
      if (workflow.name === newName) {
        return { success: true, name: newName };
      }
      
      // 生成唯一名称
      const existingNames = this.workflows
        .filter(w => w.id !== workflowId)
        .map(w => w.name);
      const uniqueName = workflowService.generateUniqueName(newName, existingNames);
      
      try {
        const result = await workflowService.updateWorkflow(workflowId, { name: uniqueName });
        
        if (result.success) {
          workflow.name = uniqueName;
          workflow.updatedAt = new Date().toISOString();
          return { success: true, name: uniqueName };
        }
        
        return { success: false, name: newName };
      } catch (e) {
        console.error('[WorkflowStore] renameWorkflow failed:', e);
        return { success: false, name: newName };
      }
    },

    /**
     * 保存工作流
     */
    async saveWorkflow(workflowId: string): Promise<boolean> {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      try {
        const result = await workflowService.updateWorkflow(workflowId, {
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          connections: workflow.connections,
          status: workflow.status,
        });
        
        if (result.success) {
          workflow.updatedAt = new Date().toISOString();
          console.log('💾 saveWorkflow:', workflowId);
          return true;
        }
        
        return false;
      } catch (e) {
        console.error('[WorkflowStore] saveWorkflow failed:', e);
        return false;
      }
    },


    // ========================================================================
    // 节点管理 (Task 3.2)
    // ========================================================================

    /**
     * 获取指定项目的工作流 (Requirements: 6.1, 6.2, 6.3, 6.5)
     * @param projectId - 项目ID
     * @returns 工作流或null
     */
    getWorkflowByProjectId(projectId: string): Workflow | null {
      // 1. 检查映射缓存
      const workflowId = this.projectWorkflowMap.get(projectId);
      if (workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
          console.log('✅ getWorkflowByProjectId: found in cache:', projectId, '->', workflowId);
          return workflow;
        }
        
        // 映射存在但工作流不存在 - 清理过期映射
        console.log('⚠️ getWorkflowByProjectId: stale mapping detected, cleaning up');
        this.projectWorkflowMap.delete(projectId);
        this.persistProjectWorkflowMap();
      }
      
      // 2. 搜索所有工作流
      const workflow = this.workflows.find(w => w.projectId === projectId);
      if (workflow) {
        // 更新缓存
        console.log('✅ getWorkflowByProjectId: found by search:', projectId, '->', workflow.id);
        this.projectWorkflowMap.set(projectId, workflow.id);
        this.persistProjectWorkflowMap();
        return workflow;
      }
      
      console.log('⚠️ getWorkflowByProjectId: not found for project:', projectId);
      return null;
    },

    /**
     * 设置项目-工作流映射 (Requirements: 5.2)
     * @param projectId - 项目ID
     * @param workflowId - 工作流ID
     */
    setProjectWorkflowMapping(projectId: string, workflowId: string): void {
      this.projectWorkflowMap.set(projectId, workflowId);
      this.persistProjectWorkflowMap();
      console.log('📌 setProjectWorkflowMapping:', projectId, '->', workflowId);
    },

    /**
     * 清除项目-工作流映射 (Requirements: 5.4)
     * @param projectId - 项目ID
     */
    clearProjectWorkflowMapping(projectId: string): void {
      this.projectWorkflowMap.delete(projectId);
      this.persistProjectWorkflowMap();
      console.log('🗑️ clearProjectWorkflowMapping:', projectId);
    },

    /**
     * 持久化项目-工作流映射到localStorage (Requirements: 5.5)
     */
    persistProjectWorkflowMap(): void {
      try {
        const mapObject = Object.fromEntries(this.projectWorkflowMap);
        localStorage.setItem('novel_anime_project_workflow_map', JSON.stringify(mapObject));
        console.log('💾 persistProjectWorkflowMap: saved', Object.keys(mapObject).length, 'mappings');
      } catch (e) {
        console.error('❌ persistProjectWorkflowMap failed:', e);
      }
    },

    /**
     * 从localStorage加载项目-工作流映射 (Requirements: 5.5)
     */
    loadProjectWorkflowMap(): void {
      try {
        const stored = localStorage.getItem('novel_anime_project_workflow_map');
        if (stored) {
          const mapObject = JSON.parse(stored);
          this.projectWorkflowMap = new Map(Object.entries(mapObject));
          console.log('📂 loadProjectWorkflowMap: loaded', this.projectWorkflowMap.size, 'mappings');
        } else {
          console.log('📂 loadProjectWorkflowMap: no stored mappings found');
        }
      } catch (e) {
        console.error('❌ loadProjectWorkflowMap failed:', e);
        this.projectWorkflowMap = new Map();
      }
    },

    /**
     * 获取节点类型的显示标题 (Requirements: 1.1)
     * @param type - 节点类型
     * @returns 显示标题
     */
    getNodeTitle(type: string): string {
      const titles: Record<string, string> = {
        'novel-parser': '小说解析器',
        'character-analyzer': '角色分析器',
        'scene-generator': '场景生成器',
        'script-converter': '脚本转换器',
        'video-generator': '视频生成器'
      };
      return titles[type] || type;
    },

    /**
     * 向工作流添加模板节点 (Requirements: 1.1)
     * @param workflowId - 工作流ID
     * @param template - 模板配置
     */
    async addTemplateNodesToWorkflow(
      workflowId: string,
      template: { nodes: string[] }
    ): Promise<void> {
      const nodeIds: string[] = [];
      
      // 添加节点
      template.nodes.forEach((nodeType: string, index: number) => {
        const node = this.addNode(
          workflowId,
          nodeType as WorkflowNodeType,
          this.getNodeTitle(nodeType),
          { x: 100 + index * 220, y: 100 }
        );
        if (node) {
          nodeIds.push(node.id);
        }
      });
      
      // 连接节点
      for (let i = 0; i < nodeIds.length - 1; i++) {
        this.addConnection(workflowId, nodeIds[i], nodeIds[i + 1]);
      }
      
      console.log('📋 addTemplateNodesToWorkflow: added', nodeIds.length, 'nodes to workflow:', workflowId);
    },

    /**
     * 清理空工作流 (Requirements: 4.1, 4.2, 4.3, 4.4)
     * @param projectId - 可选的项目ID，用于限制清理范围
     * @returns 删除的工作流数量
     */
    async cleanupEmptyWorkflows(projectId?: string): Promise<number> {
      const emptyWorkflows = this.workflows.filter(w => {
        const isEmpty = !w.nodes || w.nodes.length === 0;
        const matchesProject = !projectId || w.projectId === projectId;
        return isEmpty && matchesProject;
      });
      
      let deletedCount = 0;
      for (const workflow of emptyWorkflows) {
        const success = await this.deleteWorkflow(workflow.id);
        if (success) {
          deletedCount++;
          console.log('🗑️ cleanupEmptyWorkflows: deleted empty workflow:', workflow.name);
        }
      }
      
      if (deletedCount > 0) {
        console.log('✅ cleanupEmptyWorkflows: cleaned up', deletedCount, 'empty workflow(s)');
      }
      
      return deletedCount;
    },

    /**
     * 为项目创建工作流 (Requirements: 1.1, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5)
     * @param projectId - 项目ID
     * @param template - 模板配置
     * @param projectName - 项目名称
     * @returns 创建的或已存在的工作流
     */
    async createWorkflowForProject(
      projectId: string,
      template: { id: string; name: string; description: string; nodes: string[] },
      projectName: string
    ): Promise<Workflow | null> {
      // 1. 检查是否正在为此项目创建工作流
      if (this.isCreatingWorkflowForProject === projectId) {
        console.log('⏳ createWorkflowForProject: already creating for project:', projectId);
        return null;
      }
      
      // 2. 检查工作流是否已存在
      const existingWorkflow = this.getWorkflowByProjectId(projectId);
      if (existingWorkflow) {
        console.log('✅ createWorkflowForProject: workflow already exists for project:', projectId);
        
        // 如果是空的，添加节点
        if (!existingWorkflow.nodes || existingWorkflow.nodes.length === 0) {
          console.log('📋 createWorkflowForProject: adding template nodes to existing empty workflow');
          await this.addTemplateNodesToWorkflow(existingWorkflow.id, template);
          await this.saveWorkflow(existingWorkflow.id);
        }
        
        return existingWorkflow;
      }
      
      // 3. 设置创建标志
      this.isCreatingWorkflowForProject = projectId;
      
      try {
        // 4. 创建工作流
        const workflowName = `${projectName} - ${template.name}`;
        const workflow = await this.createWorkflow({
          name: workflowName,
          description: template.description,
        });
        
        if (!workflow) {
          throw new Error('Failed to create workflow');
        }
        
        // 设置projectId
        workflow.projectId = projectId;
        
        // 5. 添加模板节点
        await this.addTemplateNodesToWorkflow(workflow.id, template);
        
        // 6. 设置映射
        this.setProjectWorkflowMapping(projectId, workflow.id);
        
        // 7. 保存到后端
        await this.saveWorkflow(workflow.id);
        
        console.log('✅ createWorkflowForProject: created workflow for project:', projectId, workflow.name);
        return workflow;
        
      } catch (error) {
        console.error('❌ createWorkflowForProject failed:', error);
        throw error;
      } finally {
        // 8. 清除创建标志
        this.isCreatingWorkflowForProject = null;
      }
    },

    /**
     * 添加节点
     */
    addNode(
      workflowId: string,
      type: WorkflowNodeType,
      name: string,
      position: NodePosition,
      configuration: NodeConfiguration = {}
    ): WorkflowNode | null {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return null;
      
      const nodeId = workflowService.generateNodeId();
      
      const node: WorkflowNode = {
        id: nodeId,
        type,
        name,
        position,
        configuration,
        status: 'idle',
      };
      
      workflow.nodes.push(node);
      workflow.updatedAt = new Date().toISOString();
      
      console.log('➕ addNode:', node.name, 'to workflow:', workflowId);
      return node;
    },

    /**
     * 移除节点
     */
    removeNode(workflowId: string, nodeId: string): boolean {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return false;
      
      // 移除节点
      workflow.nodes.splice(nodeIndex, 1);
      
      // 移除相关连接
      workflow.connections = workflow.connections.filter(
        conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
      );
      
      workflow.updatedAt = new Date().toISOString();
      
      console.log('➖ removeNode:', nodeId, 'from workflow:', workflowId);
      return true;
    },

    /**
     * 更新节点位置
     */
    updateNodePosition(workflowId: string, nodeId: string, position: NodePosition): boolean {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return false;
      
      node.position = position;
      workflow.updatedAt = new Date().toISOString();
      
      return true;
    },

    /**
     * 更新节点名称
     */
    updateNodeName(workflowId: string, nodeId: string, newName: string): boolean {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return false;
      
      node.name = newName;
      workflow.updatedAt = new Date().toISOString();
      
      return true;
    },

    /**
     * 更新节点配置
     */
    updateNodeConfig(workflowId: string, nodeId: string, config: NodeConfiguration): boolean {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return false;
      
      node.configuration = { ...node.configuration, ...config };
      workflow.updatedAt = new Date().toISOString();
      
      return true;
    },

    // ========================================================================
    // 连接管理 (Task 3.2)
    // ========================================================================

    /**
     * 添加连接
     */
    addConnection(workflowId: string, fromNodeId: string, toNodeId: string): WorkflowConnection | null {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return null;
      
      // 验证节点存在
      const fromNode = workflow.nodes.find(n => n.id === fromNodeId);
      const toNode = workflow.nodes.find(n => n.id === toNodeId);
      if (!fromNode || !toNode) return null;
      
      // 防止自连接
      if (fromNodeId === toNodeId) return null;
      
      // 检查是否已存在
      const exists = workflow.connections.some(
        conn => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId
      );
      if (exists) return null;
      
      const connectionId = workflowService.generateConnectionId();
      
      const connection: WorkflowConnection = {
        id: connectionId,
        fromNodeId,
        toNodeId,
      };
      
      workflow.connections.push(connection);
      workflow.updatedAt = new Date().toISOString();
      
      console.log('🔗 addConnection:', fromNodeId, '->', toNodeId);
      return connection;
    },

    /**
     * 移除连接
     */
    removeConnection(workflowId: string, connectionId: string): boolean {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return false;
      
      const connectionIndex = workflow.connections.findIndex(c => c.id === connectionId);
      if (connectionIndex === -1) return false;
      
      workflow.connections.splice(connectionIndex, 1);
      workflow.updatedAt = new Date().toISOString();
      
      console.log('🔗 removeConnection:', connectionId);
      return true;
    },

    // ========================================================================
    // 验证
    // ========================================================================

    /**
     * 验证当前工作流
     */
    validateCurrentWorkflow(): ValidationResult {
      const workflow = this.currentWorkflow;
      if (!workflow) {
        return {
          isValid: false,
          errors: [{ message: 'No workflow selected' }],
          warnings: [],
        };
      }
      
      return workflowService.validateWorkflow(workflow);
    },

    // ========================================================================
    // 导入/导出
    // ========================================================================

    /**
     * 导出工作流
     */
    exportWorkflow(workflowId: string): string | null {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) return null;
      
      return workflowService.exportWorkflow(workflow);
    },

    /**
     * 导入工作流
     */
    importWorkflow(jsonData: string): Workflow | null {
      const workflow = workflowService.importWorkflow(jsonData);
      if (workflow) {
        this.workflows.push(workflow);
        console.log('📥 importWorkflow:', workflow.name);
      }
      return workflow;
    },

    // ========================================================================
    // 默认工作流
    // ========================================================================

    /**
     * 创建默认工作流
     */
    async createDefaultWorkflow(): Promise<Workflow | null> {
      const workflow = await this.createWorkflow({
        name: '小说转动漫流程',
        description: '将小说转换为动漫视频的标准工作流',
      });
      
      if (!workflow) return null;
      
      // 添加默认节点
      const nodes = [
        { type: 'novel-parser' as WorkflowNodeType, name: '小说解析器', x: 50, y: 100 },
        { type: 'character-analyzer' as WorkflowNodeType, name: '角色分析器', x: 250, y: 100 },
        { type: 'scene-generator' as WorkflowNodeType, name: '场景生成器', x: 450, y: 100 },
        { type: 'script-converter' as WorkflowNodeType, name: '脚本转换器', x: 650, y: 100 },
        { type: 'video-generator' as WorkflowNodeType, name: '视频生成器', x: 850, y: 100 },
      ];
      
      const createdNodes: WorkflowNode[] = [];
      for (const nodeData of nodes) {
        const node = this.addNode(
          workflow.id,
          nodeData.type,
          nodeData.name,
          { x: nodeData.x, y: nodeData.y }
        );
        if (node) createdNodes.push(node);
      }
      
      // 连接节点
      for (let i = 0; i < createdNodes.length - 1; i++) {
        this.addConnection(workflow.id, createdNodes[i].id, createdNodes[i + 1].id);
      }
      
      // 保存到后端
      await this.saveWorkflow(workflow.id);
      
      // 选择该工作流
      this.selectWorkflow(workflow.id);
      
      return workflow;
    },

    // ========================================================================
    // 错误处理
    // ========================================================================

    /**
     * 清除错误
     */
    clearError(): void {
      this.error = null;
    },

    /**
     * 重置执行状态
     */
    resetExecution(): void {
      this.isExecuting = false;
      this.executionProgress = 0;
      this.executionStatus = 'idle';
      this.executionMessage = '';
      this.error = null;
    },

    // ========================================================================
    // 工作流执行 (Task 3.3)
    // ========================================================================

    /**
     * 执行工作流 - 使用 PipelineOrchestrator 进行真实执行
     */
    async executeWorkflow(workflowId: string, initialData: Record<string, unknown> = {}): Promise<string> {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error('工作流不存在');
      }

      if (workflow.nodes.length === 0) {
        throw new Error('工作流没有节点');
      }

      // 创建执行记录
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
        context: {
          initialData,
          nodeResults: new Map(),
        },
      };

      this.executions.push(execution);
      this.isExecuting = true;
      this.executionProgress = 0;
      this.executionStatus = 'running';
      this.executionMessage = '正在初始化...';

      // 更新工作流状态
      workflow.status = 'running';

      try {
        // 使用 PipelineOrchestrator 进行真实执行
        const orchestrator = new PipelineOrchestrator();
        
        // 监听执行进度
        const pipelineExecutionId = await orchestrator.executeWorkflow(workflow, initialData, {
          parallelExecution: false,
          maxRetries: 3,
          errorHandling: 'stop'
        });
        
        // 监听进度更新
        orchestrator.monitorProgress(pipelineExecutionId, (status: any) => {
          console.log('📊 Pipeline progress:', status);
          
          // 更新节点状态
          if (status.currentNode) {
            const node = workflow.nodes.find(n => n.id === status.currentNode);
            if (node) {
              node.status = status.status === 'running' ? 'running' : 
                           status.status === 'completed' ? 'completed' : 'idle';
            }
          }
          
          // 更新进度
          this.executionProgress = status.progress || 0;
          execution.progress = this.executionProgress;
          this.executionMessage = status.message || '执行中...';
        });
        
        // 等待执行完成（轮询检查状态）
        let pipelineExecution = orchestrator.getExecutionStatus(pipelineExecutionId);
        while (pipelineExecution && pipelineExecution.status === 'running') {
          await new Promise(resolve => setTimeout(resolve, 500));
          pipelineExecution = orchestrator.getExecutionStatus(pipelineExecutionId);
        }
        
        // 检查执行结果
        if (!pipelineExecution || pipelineExecution.status === 'failed') {
          throw new Error(pipelineExecution?.context?.errors?.[0]?.error || '执行失败');
        }
        
        if (pipelineExecution.status === 'cancelled') {
          throw new Error('执行已取消');
        }
        
        // 复制节点结果到 execution
        if (pipelineExecution.context?.nodeResults) {
          execution.context = execution.context || { initialData, nodeResults: new Map() };
          execution.context.nodeResults = pipelineExecution.context.nodeResults;
          
          // 更新所有节点状态为完成
          workflow.nodes.forEach(node => {
            node.status = 'completed';
          });
        }

        // 执行完成
        execution.status = 'completed';
        execution.endTime = Date.now();
        workflow.status = 'completed';
        this.executionStatus = 'completed';
        this.executionProgress = 100;
        this.executionMessage = '执行完成';
        this.isExecuting = false;

        console.log('✅ Workflow execution completed, nodeResults:', execution.context?.nodeResults);

      } catch (error) {
        // 执行失败
        execution.status = 'failed';
        execution.endTime = Date.now();
        execution.error = error instanceof Error ? error.message : '未知错误';
        workflow.status = 'failed';
        this.executionStatus = 'failed';
        this.executionMessage = '执行失败';
        this.isExecuting = false;
        
        // 重置节点状态
        workflow.nodes.forEach(node => {
          if (node.status === 'running') {
            node.status = 'idle';
          }
        });
        
        throw error;
      }

      return executionId;
    },

    /**
     * 取消执行
     */
    cancelExecution(executionId: string): boolean {
      const execution = this.executions.find(e => e.id === executionId);
      if (!execution || execution.status !== 'running') {
        return false;
      }

      execution.status = 'cancelled';
      execution.endTime = Date.now();
      
      // 重置工作流节点状态
      const workflow = this.workflows.find(w => w.id === execution.workflowId);
      if (workflow) {
        workflow.status = 'idle';
        workflow.nodes.forEach(node => {
          if (node.status === 'running') {
            node.status = 'idle';
          }
        });
      }

      this.isExecuting = false;
      this.executionStatus = 'idle';
      this.executionMessage = '';
      
      return true;
    },

    /**
     * 获取执行状态
     */
    getExecutionStatus(executionId: string | null): WorkflowExecution | null {
      if (!executionId) return null;
      return this.executions.find(e => e.id === executionId) || null;
    },

    /**
     * 设置当前工作流 (兼容旧代码)
     */
    setCurrentWorkflow(workflowId: string): boolean {
      return this.selectWorkflow(workflowId);
    },
  },
});

// 导出类型
export type WorkflowStore = ReturnType<typeof useWorkflowStore>;
