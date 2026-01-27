# Design Document: Frontend Architecture Refactor

## Overview

本设计文档描述了前端架构重构的技术方案，旨在建立符合 Vue 3 最佳实践的高内聚低耦合架构。重构将解决当前存在的状态管理混乱、初始化时序问题、数据流不清晰等问题。

## Architecture

### 当前架构问题分析

```
当前问题架构:
┌─────────────────────────────────────────────────────────────┐
│                         View                                 │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Direct Store    │  │ Direct Service  │  ← 混乱的数据访问  │
│  │ Access          │  │ Access          │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            ▼                     ▼
┌───────────────────┐   ┌───────────────────┐
│      Store        │   │     Service       │
│ ┌───────────────┐ │   │ ┌───────────────┐ │
│ │ service: new  │◄┼───┼─┤ internal      │ │  ← 状态分散
│ │ Service()     │ │   │ │ state (Map)   │ │
│ └───────────────┘ │   │ └───────────────┘ │
│ ┌───────────────┐ │   │ ┌───────────────┐ │
│ │ workflows[]   │ │   │ │ workflows Map │ │  ← 数据重复
│ └───────────────┘ │   │ └───────────────┘ │
└───────────────────┘   └───────────────────┘
```

### 目标架构

```
目标架构 (单向数据流):
┌─────────────────────────────────────────────────────────────┐
│                         View                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Only reads from Store                   │    │
│  │              Calls Store actions for mutations       │    │
│  └─────────────────────────┬───────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Store                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ state: { workflows: [], currentWorkflow: null, ... } │    │
│  │ actions: { loadWorkflows(), selectWorkflow(), ... }  │    │
│  │ getters: { workflowCount, hasCurrentWorkflow, ... }  │    │
│  └─────────────────────────┬───────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────┘
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service (Stateless)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ async getWorkflows(): Promise<Workflow[]>            │    │
│  │ async createWorkflow(data): Promise<Workflow>        │    │
│  │ async updateWorkflow(id, data): Promise<Workflow>    │    │
│  └─────────────────────────┬───────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Store 层设计

```typescript
// stores/workflow.ts - 重构后的 Store
import { defineStore } from 'pinia';
import { workflowService } from '@/services/workflowService';
import type { Workflow, WorkflowNode, WorkflowConnection } from '@/types/workflow';

interface WorkflowState {
  // 纯数据状态，无类实例
  workflows: Workflow[];
  currentWorkflowId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    workflows: [],
    currentWorkflowId: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  }),

  getters: {
    currentWorkflow: (state): Workflow | null => {
      if (!state.currentWorkflowId) return null;
      return state.workflows.find(w => w.id === state.currentWorkflowId) || null;
    },
    workflowCount: (state): number => state.workflows.length,
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return;
      await this.loadWorkflows();
      this.isInitialized = true;
    },

    async loadWorkflows() {
      this.isLoading = true;
      this.error = null;
      try {
        const result = await workflowService.getWorkflows();
        this.workflows = result.workflows;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.isLoading = false;
      }
    },

    selectWorkflow(workflowId: string) {
      const exists = this.workflows.some(w => w.id === workflowId);
      if (exists) {
        this.currentWorkflowId = workflowId;
      }
    },
  },
});
```

### 2. Service 层设计

```typescript
// services/workflowService.ts - 无状态服务
import { apiService } from './api';
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow';
import type { ApiResponse, ApiError } from '@/types/api';

// 纯函数，无内部状态
export const workflowService = {
  async getWorkflows(): Promise<ApiResponse<{ workflows: Workflow[] }>> {
    const response = await apiService.get('/workflows');
    return {
      success: true,
      workflows: response.workflows.map(convertFromBackend),
    };
  },

  async getWorkflow(id: string): Promise<ApiResponse<{ workflow: Workflow }>> {
    const response = await apiService.get(`/workflow/${id}`);
    return {
      success: true,
      workflow: convertFromBackend(response.workflow),
    };
  },

  async createWorkflow(data: CreateWorkflowRequest): Promise<ApiResponse<{ workflow: Workflow }>> {
    const response = await apiService.post('/workflow', convertToBackend(data));
    return {
      success: true,
      workflow: convertFromBackend(response.workflow),
    };
  },

  async updateWorkflow(id: string, data: UpdateWorkflowRequest): Promise<ApiResponse<{ workflow: Workflow }>> {
    const response = await apiService.put(`/workflow/${id}`, convertToBackend(data));
    return {
      success: true,
      workflow: convertFromBackend(response.workflow),
    };
  },

  async deleteWorkflow(id: string): Promise<ApiResponse<void>> {
    await apiService.delete(`/workflow/${id}`);
    return { success: true };
  },
};

// 数据转换函数（纯函数）
function convertFromBackend(backendWorkflow: any): Workflow {
  return {
    id: backendWorkflow.workflowId,
    name: backendWorkflow.name,
    description: backendWorkflow.description || '',
    nodes: parseJson(backendWorkflow.nodes, []),
    connections: parseJson(backendWorkflow.connections, []),
    status: backendWorkflow.status || 'idle',
    projectId: backendWorkflow.projectId,
    createdAt: backendWorkflow.createdDate,
    updatedAt: backendWorkflow.lastUpdatedDate,
  };
}

function convertToBackend(workflow: Partial<Workflow>): any {
  return {
    workflowId: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    nodes: JSON.stringify(workflow.nodes || []),
    connections: JSON.stringify(workflow.connections || []),
    projectId: workflow.projectId,
  };
}

function parseJson<T>(value: string | T, defaultValue: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  return value ?? defaultValue;
}
```

### 3. 初始化 Composable 设计

```typescript
// composables/useAppInit.ts
import { ref, readonly } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useProjectStore } from '@/stores/project';
import { useAuthStore } from '@/stores/auth';

const isAppInitialized = ref(false);
const initError = ref<string | null>(null);
const initPromise = ref<Promise<void> | null>(null);

export function useAppInit() {
  async function initialize() {
    if (isAppInitialized.value) return;
    if (initPromise.value) return initPromise.value;

    initPromise.value = doInitialize();
    return initPromise.value;
  }

  async function doInitialize() {
    try {
      // 按依赖顺序初始化
      const authStore = useAuthStore();
      await authStore.initialize();

      const projectStore = useProjectStore();
      await projectStore.initialize();

      const workflowStore = useWorkflowStore();
      await workflowStore.initialize();

      isAppInitialized.value = true;
    } catch (e) {
      initError.value = e.message;
      throw e;
    }
  }

  async function waitForInit() {
    if (isAppInitialized.value) return;
    if (initPromise.value) {
      await initPromise.value;
    }
  }

  return {
    isAppInitialized: readonly(isAppInitialized),
    initError: readonly(initError),
    initialize,
    waitForInit,
  };
}
```

### 4. View 层设计模式

```vue
<!-- views/WorkflowEditor.vue - 重构后的 View -->
<template>
  <div class="workflow-editor">
    <LoadingSpinner v-if="!isReady" />
    <template v-else>
      <WorkflowHeader
        :workflow="currentWorkflow"
        :workflows="workflows"
        @select="handleSelectWorkflow"
        @create="handleCreateWorkflow"
        @save="handleSaveWorkflow"
      />
      <WorkflowCanvas
        v-if="currentWorkflow"
        :nodes="currentWorkflow.nodes"
        :connections="currentWorkflow.connections"
        @node-add="handleAddNode"
        @node-remove="handleRemoveNode"
        @connection-add="handleAddConnection"
      />
      <EmptyState v-else message="请选择或创建一个工作流" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useAppInit } from '@/composables/useAppInit';

const workflowStore = useWorkflowStore();
const { waitForInit } = useAppInit();

const isReady = ref(false);

// 从 Store 读取数据
const workflows = computed(() => workflowStore.workflows);
const currentWorkflow = computed(() => workflowStore.currentWorkflow);

// 生命周期
onMounted(async () => {
  await waitForInit();
  isReady.value = true;
});

// 事件处理 - 调用 Store actions
function handleSelectWorkflow(workflowId: string) {
  workflowStore.selectWorkflow(workflowId);
}

async function handleCreateWorkflow(name: string) {
  await workflowStore.createWorkflow({ name });
}

async function handleSaveWorkflow() {
  if (currentWorkflow.value) {
    await workflowStore.saveWorkflow(currentWorkflow.value.id);
  }
}

function handleAddNode(nodeData: NodeData) {
  if (currentWorkflow.value) {
    workflowStore.addNode(currentWorkflow.value.id, nodeData);
  }
}

function handleRemoveNode(nodeId: string) {
  if (currentWorkflow.value) {
    workflowStore.removeNode(currentWorkflow.value.id, nodeId);
  }
}

function handleAddConnection(connection: ConnectionData) {
  if (currentWorkflow.value) {
    workflowStore.addConnection(currentWorkflow.value.id, connection);
  }
}
</script>
```

### 5. Component 层设计模式

```vue
<!-- components/workflow/WorkflowCanvas.vue - 纯展示组件 -->
<template>
  <div class="workflow-canvas" @drop="handleDrop" @dragover.prevent>
    <WorkflowNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected="selectedNodeId === node.id"
      @select="emit('node-select', node.id)"
      @remove="emit('node-remove', node.id)"
      @position-change="handleNodePositionChange"
    />
    <ConnectionLines :connections="connections" :nodes="nodes" />
  </div>
</template>

<script setup lang="ts">
import type { WorkflowNode, WorkflowConnection } from '@/types/workflow';

// 类型化的 Props
const props = defineProps<{
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNodeId?: string;
}>();

// 类型化的 Emits
const emit = defineEmits<{
  'node-add': [nodeData: { type: string; position: { x: number; y: number } }];
  'node-remove': [nodeId: string];
  'node-select': [nodeId: string];
  'node-position-change': [nodeId: string, position: { x: number; y: number }];
  'connection-add': [connection: { fromNodeId: string; toNodeId: string }];
}>();

// 组件内部状态（仅 UI 相关）
const draggedNodeType = ref<string | null>(null);

// 事件处理 - 只 emit，不直接修改数据
function handleDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('nodeType');
  if (nodeType) {
    emit('node-add', {
      type: nodeType,
      position: { x: event.offsetX, y: event.offsetY },
    });
  }
}

function handleNodePositionChange(nodeId: string, position: { x: number; y: number }) {
  emit('node-position-change', nodeId, position);
}
</script>
```

## Data Models

### TypeScript 类型定义

```typescript
// types/workflow.ts
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: WorkflowStatus;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  status: NodeStatus;
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: number;
  toPort?: number;
}

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed';
export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';
export type WorkflowNodeType = 
  | 'novel-parser'
  | 'character-analyzer'
  | 'scene-generator'
  | 'script-converter'
  | 'video-generator';

// types/api.ts
export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Store State Integrity

*For any* Store instance, the state SHALL only contain primitive values, arrays, and plain objects - never class instances or functions.

**Validates: Requirements 1.1, 1.2, 1.4, 1.5**

### Property 2: Service Statelessness

*For any* Service function call, the function SHALL return the same result for the same input, regardless of previous calls (no internal state mutation).

**Validates: Requirements 2.1, 2.2**

### Property 3: Initialization Flow Correctness

*For any* View that accesses Store data, the View SHALL only access data after `isInitialized` is true, ensuring data is loaded before use.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Component Props Isolation

*For any* Component (non-View), the Component SHALL NOT import or access Stores directly - all data SHALL come through props.

**Validates: Requirements 4.3, 4.4**

### Property 5: Workflow Data Single Source

*For any* workflow data access in the application, the data SHALL come from `WorkflowStore.workflows` array - not from any Service internal state.

**Validates: Requirements 6.2, 6.3, 6.5**

### Property 6: Error Handling Consistency

*For any* API error, the error SHALL be caught by Store action, stored in error state, and the Service SHALL return a standardized error object.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 7: Type Safety Coverage

*For any* Store, Service, or Component, the file SHALL be TypeScript (.ts or .vue with `<script lang="ts">`) with proper type annotations.

**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

### 错误处理策略

```typescript
// types/error.ts
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

// services/errorHandler.ts
export function createAppError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) return error;
  
  const message = error instanceof Error ? error.message : String(error);
  
  return {
    code: ErrorCode.UNKNOWN,
    message: context ? `${context}: ${message}` : message,
    originalError: error instanceof Error ? error : undefined,
  };
}

// 在 Store 中使用
async function loadWorkflows() {
  this.isLoading = true;
  this.error = null;
  try {
    const result = await workflowService.getWorkflows();
    this.workflows = result.workflows;
  } catch (e) {
    this.error = createAppError(e, 'Failed to load workflows');
    console.error('[WorkflowStore]', this.error);
  } finally {
    this.isLoading = false;
  }
}
```

## Testing Strategy

### 测试类型

1. **单元测试** - 测试 Service 函数和 Store actions
2. **属性测试** - 验证架构约束（如 Store 无类实例、Service 无状态）
3. **集成测试** - 测试 View 与 Store 的交互

### 测试框架

- **Vitest** - 单元测试和属性测试
- **@vue/test-utils** - 组件测试
- **fast-check** - 属性测试

### 示例测试

```typescript
// tests/stores/workflow.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkflowStore } from '@/stores/workflow';

describe('WorkflowStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // Property 1: Store State Integrity
  it('should not contain class instances in state', () => {
    const store = useWorkflowStore();
    const state = store.$state;
    
    function hasClassInstance(obj: any): boolean {
      if (obj === null || typeof obj !== 'object') return false;
      if (obj.constructor !== Object && obj.constructor !== Array) return true;
      return Object.values(obj).some(hasClassInstance);
    }
    
    expect(hasClassInstance(state)).toBe(false);
  });

  // Property 3: Initialization Flow
  it('should set isInitialized after loadWorkflows', async () => {
    const store = useWorkflowStore();
    expect(store.isInitialized).toBe(false);
    
    await store.initialize();
    
    expect(store.isInitialized).toBe(true);
  });
});
```

