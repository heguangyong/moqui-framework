/**
 * Workflow Service - Stateless Module
 * 无状态工作流服务，负责 API 调用和数据转换
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import { apiService } from './api';
import type {
  Workflow,
  WorkflowNode,
  WorkflowConnection,
  WorkflowConfiguration,
  WorkflowStatus,
  NodeStatus,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ValidationResult,
} from '../types/workflow';
import type { ApiResponse } from '../types/api';

// ============================================================================
// Data Conversion Functions (Pure Functions)
// ============================================================================

/**
 * 解析 JSON 字符串，如果失败返回默认值
 */
function parseJson<T>(value: string | T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value;
}

/**
 * 从后端格式转换为前端格式
 */
export function convertFromBackend(backendWorkflow: Record<string, unknown>): Workflow {
  const nodes = parseJson<WorkflowNode[]>(
    backendWorkflow.nodes as string | WorkflowNode[],
    []
  );
  const connections = parseJson<WorkflowConnection[]>(
    backendWorkflow.connections as string | WorkflowConnection[],
    []
  );

  return {
    id: backendWorkflow.workflowId as string,
    name: (backendWorkflow.name as string) || '',
    description: (backendWorkflow.description as string) || '',
    nodes,
    connections,
    configuration: {
      autoStart: false,
      parallelExecution: true,
      errorHandling: 'stop',
      maxRetries: 3,
    },
    status: (backendWorkflow.status as WorkflowStatus) || 'idle',
    projectId: backendWorkflow.projectId as string | undefined,
    createdAt: (backendWorkflow.createdDate as string) || new Date().toISOString(),
    updatedAt: (backendWorkflow.lastUpdatedDate as string) || new Date().toISOString(),
  };
}

/**
 * 从前端格式转换为后端格式
 */
export function convertToBackend(workflow: Partial<Workflow>): Record<string, unknown> {
  return {
    workflowId: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status || 'idle',
    nodes: JSON.stringify(workflow.nodes || []),
    connections: JSON.stringify(workflow.connections || []),
    projectId: workflow.projectId,
  };
}


// ============================================================================
// Workflow Service API Functions (Stateless)
// ============================================================================

/**
 * 获取所有工作流
 */
export async function getWorkflows(params?: {
  projectId?: string;
  userId?: string;
  status?: string;
}): Promise<ApiResponse<{ workflows: Workflow[] }>> {
  try {
    const result = await apiService.getWorkflows(params);
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to get workflows',
        data: { workflows: [] },
      };
    }

    const workflows = (result.workflows || []).map(convertFromBackend);
    
    return {
      success: true,
      data: { workflows },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflowService] getWorkflows failed:', message);
    return {
      success: false,
      message,
      data: { workflows: [] },
    };
  }
}

/**
 * 获取单个工作流
 */
export async function getWorkflow(workflowId: string): Promise<ApiResponse<{ workflow: Workflow | null }>> {
  try {
    const result = await apiService.getWorkflow(workflowId);
    
    if (!result.success || !result.workflow) {
      return {
        success: false,
        message: result.message || 'Workflow not found',
        data: { workflow: null },
      };
    }

    const workflow = convertFromBackend(result.workflow);
    
    return {
      success: true,
      data: { workflow },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflowService] getWorkflow failed:', message);
    return {
      success: false,
      message,
      data: { workflow: null },
    };
  }
}

/**
 * 创建工作流
 */
export async function createWorkflow(
  data: CreateWorkflowRequest
): Promise<ApiResponse<{ workflow: Workflow | null; workflowId: string | null }>> {
  try {
    // 不再前端生成 workflowId，让后端生成
    const backendData = {
      name: data.name,
      description: data.description || '',
      status: 'idle',
      nodes: [] as unknown[],
      connections: [] as unknown[],
      projectId: data.projectId,
    };

    const result = await apiService.createWorkflow(backendData);
    
    if (!result.success || !result.workflowId) {
      return {
        success: false,
        message: result.message || 'Failed to create workflow',
        data: { workflow: null, workflowId: null },
      };
    }

    // 构建返回的工作流对象
    const workflow: Workflow = {
      id: result.workflowId,
      name: data.name,
      description: data.description || '',
      nodes: [],
      connections: [],
      configuration: {
        autoStart: false,
        parallelExecution: true,
        errorHandling: 'stop',
        maxRetries: 3,
      },
      status: 'idle',
      projectId: data.projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: { workflow, workflowId: workflow.id },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflowService] createWorkflow failed:', message);
    return {
      success: false,
      message,
      data: { workflow: null, workflowId: null },
    };
  }
}

/**
 * 更新工作流
 */
export async function updateWorkflow(
  workflowId: string,
  data: UpdateWorkflowRequest
): Promise<ApiResponse<{ workflow: Workflow | null }>> {
  try {
    const backendData: Record<string, unknown> = {};
    
    if (data.name !== undefined) backendData.name = data.name;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.nodes !== undefined) backendData.nodes = JSON.stringify(data.nodes);
    if (data.connections !== undefined) backendData.connections = JSON.stringify(data.connections);

    const result = await apiService.updateWorkflow(workflowId, backendData);
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to update workflow',
        data: { workflow: null },
      };
    }

    // 获取更新后的工作流
    const getResult = await getWorkflow(workflowId);
    
    return {
      success: true,
      data: { workflow: getResult.data?.workflow || null },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflowService] updateWorkflow failed:', message);
    return {
      success: false,
      message,
      data: { workflow: null },
    };
  }
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(workflowId: string): Promise<ApiResponse<void>> {
  try {
    const result = await apiService.deleteWorkflow(workflowId);
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to delete workflow',
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflowService] deleteWorkflow failed:', message);
    return {
      success: false,
      message,
    };
  }
}

// ============================================================================
// Workflow Validation (Pure Function)
// ============================================================================

/**
 * 验证工作流
 */
export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  // 检查节点
  if (workflow.nodes.length === 0) {
    errors.push({ message: 'Workflow must have at least one node' });
  }

  // 检查孤立节点
  const connectedNodes = new Set<string>();
  workflow.connections.forEach((conn) => {
    connectedNodes.add(conn.fromNodeId);
    connectedNodes.add(conn.toNodeId);
  });

  workflow.nodes.forEach((node) => {
    if (!connectedNodes.has(node.id) && workflow.nodes.length > 1) {
      warnings.push({
        message: `Node "${node.name}" is not connected to the workflow`,
        nodeId: node.id,
      });
    }
  });

  // 检查无效连接
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  workflow.connections.forEach((conn) => {
    if (!nodeIds.has(conn.fromNodeId)) {
      errors.push({
        message: `Connection references non-existent source node: ${conn.fromNodeId}`,
      });
    }
    if (!nodeIds.has(conn.toNodeId)) {
      errors.push({
        message: `Connection references non-existent target node: ${conn.toNodeId}`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Utility Functions (Pure Functions)
// ============================================================================

/**
 * 生成唯一的工作流名称
 */
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  const maxLength = 20;
  let truncatedName = baseName;
  if (baseName.length > maxLength) {
    truncatedName = baseName.substring(0, maxLength);
  }

  if (!existingNames.includes(truncatedName)) {
    return truncatedName;
  }

  let counter = 2;
  let newName = `${truncatedName} (${counter})`;
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${truncatedName} (${counter})`;
  }
  return newName;
}

/**
 * 生成节点 ID
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成连接 ID
 */
export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 导出工作流为 JSON 字符串
 */
export function exportWorkflow(workflow: Workflow): string {
  return JSON.stringify(workflow, null, 2);
}

/**
 * 从 JSON 字符串导入工作流
 */
export function importWorkflow(jsonData: string): Workflow | null {
  try {
    const workflow = JSON.parse(jsonData) as Workflow;

    if (!workflow.id || !workflow.name || !Array.isArray(workflow.nodes)) {
      throw new Error('Invalid workflow structure');
    }

    // 生成新 ID 避免冲突
    workflow.id = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    return workflow;
  } catch (error) {
    console.error('[workflowService] Failed to import workflow:', error);
    return null;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export const workflowService = {
  // API functions
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  
  // Validation
  validateWorkflow,
  
  // Conversion functions
  convertFromBackend,
  convertToBackend,
  
  // Utility functions
  generateUniqueName,
  generateNodeId,
  generateConnectionId,
  exportWorkflow,
  importWorkflow,
};

export default workflowService;
