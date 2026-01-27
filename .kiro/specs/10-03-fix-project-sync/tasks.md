# Implementation Plan: 项目创建和列表同步修复

## Overview

本实现计划将修复项目创建和列表同步问题。核心策略是在 `projectStore.createProject()` 中添加自动刷新逻辑，修复 ProjectList 组件的响应式更新，统一项目数据字段规范化，并添加完善的加载状态和错误处理。

## Tasks

- [x] 1. 实现项目数据规范化和类型定义
  - 创建 `normalizeProject()` 函数，确保项目数据同时包含 `id` 和 `projectId` 字段
  - 更新 TypeScript 类型定义（Project, CreateProjectRequest, ApiResponse）
  - 添加字段规范化的单元测试
  - _Requirements: 1.5, 8.1, 8.4_

- [ ]* 1.1 编写项目数据规范化的属性测试
  - **Property 5: Project data normalization**
  - **Validates: Requirements 1.5, 5.3, 7.4, 8.1, 8.4**

- [x] 2. 增强 Project Store 的核心功能
  - [x] 2.1 修改 `createProject()` 方法添加自动刷新逻辑
    - 调用后端 API 创建项目
    - 规范化返回的项目数据
    - 添加到 store 的 projects 数组
    - 自动调用 `fetchProjects()` 刷新列表
    - 添加错误处理和状态管理
    - _Requirements: 1.1, 1.2, 7.1, 7.2_

  - [ ]* 2.2 编写 createProject 的属性测试
    - **Property 1: Project creation triggers automatic refresh**
    - **Property 2: Project creation updates store array**
    - **Property 10: Backend-first project creation**
    - **Validates: Requirements 1.1, 1.2, 2.3, 3.3, 4.4, 5.5, 7.1, 7.2**

  - [x] 2.3 修改 `fetchProjects()` 方法添加加载状态
    - 设置 `isLoading = true` 开始加载
    - 调用后端 API 获取项目列表
    - 规范化所有项目数据
    - 替换 store 的 projects 数组
    - 设置 `isLoading = false` 完成加载
    - 添加错误处理
    - _Requirements: 1.4, 10.1, 10.3_

  - [ ]* 2.4 编写 fetchProjects 的属性测试
    - **Property 4: Fetch projects updates store from backend**
    - **Property 17: Loading state management**
    - **Validates: Requirements 1.4, 7.3, 10.1, 10.3**

  - [x] 2.5 添加错误处理逻辑
    - 在 createProject 失败时不修改 projects 数组
    - 在 fetchProjects 失败时保留现有数据
    - 设置 error 状态并显示通知
    - _Requirements: 7.5, 10.4_

  - [ ]* 2.6 编写错误处理的属性测试
    - **Property 11: Error handling prevents store corruption**
    - **Property 18: Error state management**
    - **Validates: Requirements 7.5, 10.4**

- [ ] 3. Checkpoint - 确保 Store 核心功能正常
  - 运行所有 store 相关测试
  - 验证 createProject 和 fetchProjects 的行为
  - 确认错误处理和加载状态正确
  - 如有问题请询问用户

- [x] 4. 修复 ProjectList 组件的响应式更新
  - [x] 4.1 修复 onMounted 钩子
    - 在组件挂载时调用 `projectStore.fetchProjects()`
    - 添加错误处理
    - _Requirements: 6.1_

  - [x] 4.2 添加响应式计算属性
    - 使用 `computed()` 获取 `projectStore.projects`
    - 使用 `computed()` 获取 `projectStore.isLoading`
    - 使用 `computed()` 获取 `projectStore.error`
    - _Requirements: 6.2_

  - [x] 4.3 实现加载、错误和空状态 UI
    - 显示加载指示器（当 isLoading 为 true）
    - 显示错误消息和重试按钮（当 error 存在）
    - 显示空状态消息（当 projects 为空）
    - _Requirements: 10.2, 6.5, 10.5_

  - [ ]* 4.4 编写 ProjectList 响应式的属性测试
    - **Property 9: ProjectList reactivity to store changes**
    - **Validates: Requirements 6.2, 6.3, 6.4**

- [ ] 5. 修复 DashboardPanel 组件的项目创建
  - [x] 5.1 更新项目创建处理函数
    - 调用 `projectStore.createProject()` 创建项目
    - 显示成功通知（包含项目名称）
    - 显示错误通知（如果失败）
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.4_

  - [x] 5.2 更新项目计数徽章
    - 使用 `computed()` 从 `projectStore.projects.length` 获取计数
    - 确保徽章响应式更新
    - _Requirements: 2.4_

  - [ ]* 5.3 编写 DashboardPanel 的单元测试
    - 测试 "+" 按钮显示创建对话框
    - 测试项目创建成功流程
    - 测试项目计数徽章更新
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 5.4 编写项目计数徽章的属性测试
    - **Property 6: Project count badge updates after refresh**
    - **Validates: Requirements 2.4**

- [ ] 6. 修复 DashboardView 组件的项目创建
  - [x] 6.1 更新新建项目按钮处理函数
    - 触发导入工作流（会调用 store.createProject）
    - 添加错误处理
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.2 更新活动项目显示
    - 使用 `computed()` 从 `projectStore.currentProject` 获取活动项目
    - 确保显示响应式更新
    - _Requirements: 3.4_

  - [ ]* 6.3 编写 DashboardView 的单元测试
    - 测试新建项目按钮触发工作流
    - 测试活动项目显示更新
    - _Requirements: 3.1, 3.4_

  - [ ]* 6.4 编写活动项目显示的属性测试
    - **Property 7: Active project display updates after refresh**
    - **Validates: Requirements 3.4**

- [ ] 7. 修复 App 组件的菜单栏项目创建
  - [x] 7.1 更新 createProject 函数
    - 提示用户输入项目名称
    - 调用 `projectStore.createProject()` 创建项目
    - 显示成功通知
    - 导航到控制面板或项目详情页
    - 添加错误处理
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 编写 App 组件的单元测试
    - 测试菜单事件触发 createProject
    - 测试项目名称提示
    - 测试创建成功后导航
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 8. 修复 ImportDialog 组件的项目创建
  - [x] 8.1 更新导入处理函数
    - 检查是否存在当前项目
    - 如果不存在，调用 `apiService.createProject()` 创建项目
    - 规范化项目数据
    - 调用 `projectStore.setCurrentProject()` 设置当前项目
    - 调用 `projectStore.fetchProjects()` 刷新列表
    - 继续导入流程
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 编写 ImportDialog 的单元测试
    - 测试有现有项目时的导入流程
    - 测试无现有项目时创建新项目
    - 测试项目创建后刷新列表
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]* 8.3 编写导入项目检查的属性测试
    - **Property 8: Import checks for existing project**
    - **Validates: Requirements 5.1**

- [x] 9. Checkpoint - 确保所有组件正确集成
  - 运行所有组件测试
  - 手动测试所有 4 个项目创建入口
  - 验证项目列表在所有场景下正确同步
  - 如有问题请询问用户

- [ ] 10. 实现通知系统增强
  - [x] 10.1 添加成功通知功能
    - 显示项目名称
    - 可选：添加"查看项目"按钮
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.2 添加错误通知功能
    - 显示失败原因
    - 添加重试选项或解决方案建议
    - _Requirements: 9.4, 9.5_

  - [ ]* 10.3 编写通知系统的属性测试
    - **Property 15: Success notification with project name**
    - **Property 16: Error notification with failure reason**
    - **Validates: Requirements 9.1, 9.4**

- [ ] 11. 实现字段兼容性和比较逻辑
  - [x] 11.1 添加显示字段回退逻辑
    - 在所有组件中使用 `project.id || project.projectId`
    - 确保显示逻辑兼容两种字段名
    - _Requirements: 8.3_

  - [x] 11.2 添加项目比较逻辑
    - 实现 `compareProjects()` 函数，支持 id/projectId 回退
    - 在需要比较项目的地方使用该函数
    - _Requirements: 8.5_

  - [x] 11.3 确保后端请求使用 projectId
    - 检查所有 API 调用使用 `projectId` 作为主标识符
    - _Requirements: 8.2_

  - [ ]* 11.4 编写字段兼容性的属性测试
    - **Property 12: Backend identifier consistency**
    - **Property 13: Display field fallback logic**
    - **Property 14: Project comparison with fallback**
    - **Validates: Requirements 8.2, 8.3, 8.5**

- [ ] 12. 实现前端-后端数据一致性验证
  - [ ]* 12.1 编写数据一致性的属性测试
    - **Property 3: Frontend-backend data consistency**
    - **Validates: Requirements 1.3**

- [ ] 13. 集成测试和端到端验证
  - [ ]* 13.1 编写集成测试
    - 测试从 DashboardPanel 创建项目到 ProjectList 显示的完整流程
    - 测试从导入对话框创建项目的完整流程
    - 测试从菜单栏创建项目的完整流程
    - _Requirements: 2.5, 3.5_

- [ ] 14. Final Checkpoint - 完整功能验证
  - 运行所有测试（单元测试、属性测试、集成测试）
  - 手动测试所有 4 个项目创建入口
  - 验证项目列表同步、加载状态、错误处理
  - 验证通知系统正常工作
  - 确认所有需求都已满足
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选任务（主要是测试相关），可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 集成测试验证端到端流程
