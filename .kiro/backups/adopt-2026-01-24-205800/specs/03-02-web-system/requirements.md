# Requirements Document

## Introduction

本文档定义了前端架构重构的需求，旨在解决当前架构中存在的高耦合、状态管理混乱、初始化时序问题等设计缺陷，建立符合 Vue 3 最佳实践的高内聚低耦合架构。

## Glossary

- **Store**: Pinia 状态管理仓库，负责管理应用状态
- **Service**: 业务逻辑服务类，负责 API 调用和数据处理
- **Composable**: Vue 3 组合式函数，封装可复用的状态逻辑
- **View**: 页面级组件，负责页面布局和业务流程编排
- **Component**: 可复用的 UI 组件，负责展示和用户交互
- **Single_Source_of_Truth**: 单一数据源原则，确保数据只有一个权威来源

## Requirements

### Requirement 1: 状态管理层重构

**User Story:** As a developer, I want a clear separation between state management and business logic, so that the codebase is maintainable and predictable.

#### Acceptance Criteria

1. THE Store SHALL only contain reactive state and simple getters, not business logic classes
2. THE Store SHALL NOT instantiate Service classes in state (e.g., `workflowEditor: new WorkflowEditor()`)
3. WHEN a Store needs to call a Service, THE Store SHALL import and call the Service as a module function
4. THE Store SHALL be the Single_Source_of_Truth for all UI-related state
5. WHEN data is loaded from backend, THE Store SHALL be updated through actions, not by Service internal state

### Requirement 2: 服务层重构

**User Story:** As a developer, I want services to be stateless and focused on API communication, so that they are easy to test and reuse.

#### Acceptance Criteria

1. THE Service SHALL be stateless, not maintaining internal data caches
2. THE Service SHALL return data directly to the caller, not update internal state
3. WHEN a Service needs to cache data, THE Service SHALL use the Store for caching
4. THE Service SHALL provide async functions that return Promises with typed responses
5. THE Service SHALL handle API errors and return standardized error objects

### Requirement 3: 初始化流程标准化

**User Story:** As a developer, I want a predictable initialization flow, so that components can safely access data after mounting.

#### Acceptance Criteria

1. THE Application SHALL have a centralized initialization composable (useAppInit)
2. WHEN the Application starts, THE useAppInit composable SHALL initialize all stores in correct order
3. THE Store SHALL expose an `isInitialized` state and `waitForInit()` method
4. WHEN a View mounts, THE View SHALL await store initialization before accessing data
5. THE Watch functions SHALL check initialization state before executing side effects

### Requirement 4: 组件职责分离

**User Story:** As a developer, I want clear separation between Views and Components, so that code is reusable and maintainable.

#### Acceptance Criteria

1. THE View SHALL be responsible for page layout, data fetching, and business flow orchestration
2. THE Component SHALL be responsible for UI rendering and user interaction
3. THE Component SHALL receive data through props and emit events for state changes
4. THE Component SHALL NOT directly access stores (except for global UI state like notifications)
5. WHEN a Component needs data, THE parent View SHALL pass it through props

### Requirement 5: 数据流单向化

**User Story:** As a developer, I want unidirectional data flow, so that state changes are predictable and debuggable.

#### Acceptance Criteria

1. THE data flow SHALL follow: API → Service → Store → View → Component
2. THE user actions SHALL follow: Component → emit → View → Store action → Service → API
3. THE Store SHALL NOT have circular dependencies with Services
4. WHEN multiple stores need to share data, THE stores SHALL use a shared composable or parent store

### Requirement 6: 工作流模块重构

**User Story:** As a developer, I want the workflow module to follow the new architecture patterns, so that the workflow editor issues are resolved.

#### Acceptance Criteria

1. THE WorkflowStore SHALL NOT contain WorkflowEditor class instance in state
2. THE WorkflowService SHALL be a stateless module with async functions
3. WHEN workflows are loaded from backend, THE WorkflowStore SHALL be the only source of workflow data
4. THE WorkflowEditor view SHALL only read from WorkflowStore, not from Service internal state
5. WHEN a workflow is selected, THE WorkflowStore SHALL update currentWorkflow through an action
6. THE WorkflowStore SHALL maintain a single workflows array as the source of truth

### Requirement 7: 错误处理标准化

**User Story:** As a developer, I want consistent error handling across the application, so that errors are properly displayed and logged.

#### Acceptance Criteria

1. THE Service SHALL return standardized error objects with code, message, and details
2. THE Store action SHALL catch errors and update error state
3. THE View SHALL display errors using a common error component or notification
4. WHEN an API call fails, THE Service SHALL log the error with context information
5. THE Application SHALL have a global error boundary for uncaught errors

### Requirement 8: TypeScript 类型安全

**User Story:** As a developer, I want full TypeScript coverage, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE Store SHALL have typed state, getters, and actions
2. THE Service SHALL have typed request and response interfaces
3. THE Component props and emits SHALL be typed using defineProps and defineEmits
4. THE API responses SHALL be validated against TypeScript interfaces
5. WHEN a .js file is refactored, THE file SHALL be converted to .ts with proper types

