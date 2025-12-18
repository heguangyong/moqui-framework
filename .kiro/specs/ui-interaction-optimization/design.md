# UI 交互优化 - 设计文档

## Overview

本设计文档描述 NovelAnimeDesktop 项目的 UI 交互优化方案。核心目标是：
1. 简化侧边栏导航，保留核心功能入口
2. 实现中间控制面板的动态内容切换
3. 统一主内容区的视图结构和交互模式
4. 优化用户操作流程，提升使用体验

## Architecture

### 当前架构分析

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.vue (主容器)                          │
├──────┬─────────────────────────────┬────────────────────────────┤
│      │                             │                            │
│ 侧边栏 │       中间控制面板           │        主内容区             │
│ 56px │         ~300px              │         flex: 1            │
│      │                             │                            │
│ ┌──┐ │  ┌─────────────────────┐   │  ┌────────────────────────┐│
│ │🏠│ │  │ User Info           │   │  │ Header (Title/Actions) ││
│ │📊│ │  │ Projects            │   │  ├────────────────────────┤│
│ │⭐│ │  │ Status              │   │  │                        ││
│ │🔑│ │  │ History             │   │  │   <router-view />      ││
│ │📁│ │  │ Documents           │   │  │                        ││
│ │👥│ │  └─────────────────────┘   │  │                        ││
│ └──┘ │                             │  └────────────────────────┘│
│ ┌──┐ │                             │                            │
│ │⚙️│ │                             │                            │
│ └──┘ │                             │                            │
└──────┴─────────────────────────────┴────────────────────────────┘
```

### 问题分析

1. **侧边栏问题**：
   - 6个导航项中，"收藏(Star)"和"API配置(Key)"不是核心功能
   - 图标语义不够清晰（如 Grid 代表资源库不够直观）

2. **中间面板问题**：
   - 内容固定不变，无论选择哪个导航项
   - Projects/Status/History/Documents 分组与所有功能都相关，但不够聚焦

3. **主内容区问题**：
   - 各视图结构不统一
   - 缺少统一的空状态和加载状态处理

### 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.vue (主容器)                          │
├──────┬─────────────────────────────┬────────────────────────────┤
│      │                             │                            │
│ 侧边栏 │    动态控制面板              │        主内容区             │
│ 56px │    (ContextPanel)           │         flex: 1            │
│      │                             │                            │
│ ┌──┐ │  ┌─────────────────────┐   │  ┌────────────────────────┐│
│ │🏠│ │  │ [根据导航动态显示]    │   │  │ ViewHeader             ││
│ │📊│ │  │                     │   │  ├────────────────────────┤│
│ │📁│ │  │ Dashboard: 项目/状态 │   │  │                        ││
│ │👥│ │  │ Workflow: 流程/模板  │   │  │   <router-view />      ││
│ └──┘ │  │ Assets: 分类/筛选    │   │  │                        ││
│      │  │ Characters: 列表/搜索│   │  │                        ││
│ ┌──┐ │  └─────────────────────┘   │  └────────────────────────┘│
│ │⚙️│ │                             │                            │
│ └──┘ │                             │                            │
└──────┴─────────────────────────────┴────────────────────────────┘
```

## Components and Interfaces

### 1. 侧边栏导航配置

精简为 4+1 个核心导航项：

```javascript
// 核心导航项（4个）
const coreNavItems = [
  {
    id: 'dashboard',
    route: '/dashboard',
    label: '项目概览',
    icon: 'Home',           // Lucide Home 图标
    description: '查看项目统计和快速操作'
  },
  {
    id: 'workflow',
    route: '/workflow',
    label: '工作流',
    icon: 'GitBranch',      // 更直观的工作流图标
    description: '编辑和执行转换流程'
  },
  {
    id: 'assets',
    route: '/assets',
    label: '资源库',
    icon: 'FolderOpen',     // 文件夹图标更直观
    description: '管理项目资源文件'
  },
  {
    id: 'characters',
    route: '/characters',
    label: '角色管理',
    icon: 'Users',          // 保持不变
    description: '管理角色档案和一致性'
  }
];

// 设置导航（底部，1个）
const settingsNav = {
  id: 'settings',
  route: '/settings',
  label: '设置',
  icon: 'Settings',
  description: 'AI配置和应用设置'
};
```

### 2. 动态控制面板组件

```vue
<!-- ContextPanel.vue -->
<template>
  <div class="context-panel">
    <!-- 用户信息（始终显示） -->
    <UserInfo />
    
    <!-- 动态内容区 -->
    <component :is="currentPanelComponent" />
  </div>
</template>
```

各导航对应的面板内容：

| 导航 | 面板组件 | 显示内容 |
|------|----------|----------|
| Dashboard | DashboardPanel | 项目列表、状态筛选、历史记录 |
| Workflow | WorkflowPanel | 工作流列表、模板、执行历史 |
| Assets | AssetsPanel | 资源分类、筛选器、搜索 |
| Characters | CharactersPanel | 角色列表、筛选、搜索 |
| Settings | SettingsPanel | 设置分类导航 |

### 3. 统一视图头部组件

```vue
<!-- ViewHeader.vue -->
<template>
  <div class="view-header">
    <div class="header-info">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>
```

### 4. 状态管理扩展

```javascript
// stores/navigation.js
export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    activeNavId: 'dashboard',
    panelContext: {}  // 各面板的上下文状态
  }),
  
  getters: {
    currentPanelComponent: (state) => {
      const componentMap = {
        dashboard: 'DashboardPanel',
        workflow: 'WorkflowPanel',
        assets: 'AssetsPanel',
        characters: 'CharactersPanel',
        settings: 'SettingsPanel'
      };
      return componentMap[state.activeNavId];
    }
  },
  
  actions: {
    setActiveNav(navId) {
      this.activeNavId = navId;
    },
    
    updatePanelContext(navId, context) {
      this.panelContext[navId] = { ...this.panelContext[navId], ...context };
    }
  }
});
```

## Data Models

### 导航项数据结构

```typescript
interface NavItem {
  id: string;           // 唯一标识
  route: string;        // 路由路径
  label: string;        // 显示名称
  icon: string;         // Lucide 图标名称
  description: string;  // 功能描述
  badge?: number;       // 可选的徽章数字
}
```

### 面板上下文数据结构

```typescript
interface PanelContext {
  dashboard: {
    selectedProject?: string;
    statusFilter?: string;
  };
  workflow: {
    selectedWorkflow?: string;
    executionFilter?: string;
  };
  assets: {
    category?: string;
    searchQuery?: string;
  };
  characters: {
    searchQuery?: string;
    filterLocked?: boolean;
  };
  settings: {
    activeCategory?: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Selection Updates UI Consistently

*For any* navigation item click, the sidebar active state, control panel content, and main area view SHALL all update to reflect the selected navigation.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 2: Control Panel Content Matches Navigation

*For any* active navigation ID, the control panel SHALL render the corresponding panel component with appropriate content sections.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: View Header Consistency

*For any* view rendered in the main area, the view SHALL include a header component with title and action buttons.

**Validates: Requirements 3.1**

### Property 4: Novel Import Workflow State Machine

*For any* novel file import, the application state SHALL progress through: import → parsing → character review → workflow ready, with appropriate UI updates at each stage.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 5: Operation Feedback Consistency

*For any* async operation (loading, success, or failure), the application SHALL display the appropriate feedback indicator or notification.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

### 导航错误处理

1. **路由不存在**: 重定向到 Dashboard 并显示提示
2. **组件加载失败**: 显示错误边界组件，提供重试选项

### 面板内容错误处理

1. **数据加载失败**: 显示错误状态，提供重试按钮
2. **空状态**: 显示友好的空状态提示和引导操作

### 操作错误处理

1. **网络错误**: 显示离线提示，缓存操作待恢复
2. **验证错误**: 高亮错误字段，显示具体错误信息

## Testing Strategy

### 单元测试

使用 Vitest 进行组件和 store 的单元测试：

- 导航 store 的状态管理测试
- 各面板组件的渲染测试
- 视图头部组件的 props 测试

### 属性测试

使用 fast-check 进行属性测试：

- 导航选择的 UI 一致性测试
- 面板内容与导航的映射测试
- 操作反馈的一致性测试

### 集成测试

- 完整的导航流程测试
- 小说导入到工作流的端到端测试
- 各视图的交互测试

### 测试框架配置

```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js']
  }
};
```
