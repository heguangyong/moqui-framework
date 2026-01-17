/**
 * Workflow Type Definitions
 * 工作流相关类型定义
 * 
 * Requirements: 8.1, 8.2
 */

// ============================================================================
// Status Types
// ============================================================================

/**
 * 工作流状态
 */
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

/**
 * 节点状态
 */
export type NodeStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped';

/**
 * 工作流节点类型
 */
export type WorkflowNodeType =
  | 'novel-parser'
  | 'character-analyzer'
  | 'scene-generator'
  | 'script-converter'
  | 'video-generator';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * 节点位置
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * 节点配置
 */
export interface NodeConfiguration {
  [key: string]: unknown;
}

/**
 * 工作流节点
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  position: NodePosition;
  configuration: NodeConfiguration;
  status: NodeStatus;
}

/**
 * 工作流连接
 */
export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: number;
  toPort?: number;
}

/**
 * 工作流配置
 */
export interface WorkflowConfiguration {
  autoStart: boolean;
  parallelExecution: boolean;
  errorHandling: 'stop' | 'continue' | 'retry';
  maxRetries: number;
}

/**
 * 工作流
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  configuration: WorkflowConfiguration;
  status: WorkflowStatus;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * 创建工作流请求
 */
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  projectId?: string;
}

/**
 * 更新工作流请求
 */
export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  configuration?: Partial<WorkflowConfiguration>;
  status?: WorkflowStatus;
}

/**
 * 添加节点请求
 */
export interface AddNodeRequest {
  type: WorkflowNodeType;
  name: string;
  position: NodePosition;
  configuration?: NodeConfiguration;
}

/**
 * 添加连接请求
 */
export interface AddConnectionRequest {
  fromNodeId: string;
  toNodeId: string;
  fromPort?: number;
  toPort?: number;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * 验证错误
 */
export interface ValidationError {
  message: string;
  nodeId?: string;
  field?: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  message: string;
  nodeId?: string;
  field?: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// Execution Types
// ============================================================================

/**
 * 执行状态
 */
export interface ExecutionStatus {
  executionId: string;
  workflowId: string;
  status: WorkflowStatus;
  progress: number;
  message: string;
  currentNodeId?: string;
  error?: string;
  startTime: string;
  endTime?: string;
}

/**
 * 节点执行结果
 */
export interface NodeExecutionResult {
  status: 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  initialData?: Record<string, unknown>;
  nodeResults?: Map<string, NodeExecutionResult>;
}

/**
 * 执行记录
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: WorkflowStatus;
  startTime: number;
  endTime?: number;
  progress: number;
  error?: string;
  context?: ExecutionContext;
}
