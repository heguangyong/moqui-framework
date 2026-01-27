# 数据源架构重构计划

**日期**: 2026-01-26  
**态度**: 除恶务尽，立即整改  
**目标**: 彻底清除架构"怪味道"

---

## 重构原则

1. **单一数据源**: 后端数据库是唯一权威
2. **单一缓存层**: Pinia store 是唯一前端缓存
3. **最小化 localStorage**: 只存储会话ID，不存储业务数据
4. **明确职责**: 每个模块只做一件事

---

## 重构步骤

### 步骤 1: 清理 ProjectManager ⚠️ 立即执行

**问题**: ProjectManager 既缓存数据，又提供服务，职责不清

**行动**:
1. 移除 `projects: Map<string, Project>` 缓存
2. 移除 `currentProject: Project | null`
3. 移除 `recentProjects: ProjectMetadata[]`
4. 保留纯服务方法（作为工具类）
5. 或者直接废弃 ProjectManager，让 projectStore 直接调用 API

**决策**: 🔥 **直接废弃 ProjectManager**

理由：
- ProjectManager 的所有功能都可以由 projectStore + apiService 替代
- 减少一层抽象，代码更清晰
- 避免职责重叠

### 步骤 2: 重构 projectStore ⚠️ 立即执行

**问题**: projectStore 依赖 ProjectManager，导致双重缓存

**行动**:
1. 移除 `projectManager: new ProjectManager()`
2. 直接调用 apiService
3. 简化缓存逻辑

### 步骤 3: 清理 localStorage ⚠️ 立即执行

**问题**: localStorage 存储了大量业务数据，导致数据残留

**行动**:
1. 创建 SessionManager 统一管理
2. 只存储 `session: { currentProjectId, lastAccessTime }`
3. 移除所有业务数据存储
4. 业务数据从后端获取

### 步骤 4: 优化 workflowState 持久化 ⚠️ 立即执行

**问题**: workflowState 持久化没有关联 projectId

**行动**:
1. 不持久化 workflowState（推荐）
2. 或者关联 projectId 持久化
3. 项目切换时自动重置

---

## 执行顺序

```
1. 创建 SessionManager (新文件)
   ↓
2. 重构 projectStore (移除 ProjectManager)
   ↓
3. 更新所有使用 ProjectManager 的地方
   ↓
4. 清理 localStorage 使用
   ↓
5. 优化 workflowState 持久化
   ↓
6. 测试所有功能
```

---

## 开始执行

立即开始重构！
