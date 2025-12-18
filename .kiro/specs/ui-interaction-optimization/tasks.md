# UI 交互优化 - 实现计划

## 实现概述

优化 NovelAnimeDesktop 的 UI 交互体验，包括精简侧边栏导航、实现动态控制面板、统一视图结构。

## 任务列表

- [x] 1. 重构侧边栏导航
  - [x] 1.1 精简导航项配置
    - 移除 Star(收藏) 和 Key(API配置) 导航项
    - 保留 Dashboard、Workflow、Assets、Characters 四个核心导航
    - 更新图标映射：Workflow 使用 GitBranch，Assets 使用 FolderOpen
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 1.2 优化导航交互
    - 确保点击导航项时高亮状态正确更新
    - 优化 tooltip 显示效果和时机
    - _需求: 1.2, 1.3_

- [ ]* 1.3 编写导航选择属性测试
  - **Property 1: Navigation Selection Updates UI Consistently**
  - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 2. 创建导航状态管理
  - [x] 2.1 创建 navigation store
    - 定义 activeNavId 状态
    - 定义 panelContext 状态用于各面板上下文
    - 实现 setActiveNav 和 updatePanelContext actions
    - _需求: 1.4, 2.1-2.5_
  - [x] 2.2 集成到 App.vue
    - 替换现有的 activeNavId ref 为 store
    - 连接导航点击事件到 store action
    - _需求: 1.3, 1.4_

- [x] 3. 实现动态控制面板
  - [x] 3.1 创建 ContextPanel 容器组件
    - 创建 components/panels/ContextPanel.vue
    - 实现根据 activeNavId 动态渲染对应面板
    - 保留 UserInfo 组件始终显示
    - _需求: 2.1-2.5_
  - [x] 3.2 创建 DashboardPanel 组件
    - 显示项目列表（Projects 分组）
    - 显示状态筛选（Status 分组）
    - 显示历史记录（History 分组）
    - 显示文档树（Documents 分组）
    - _需求: 2.1_
  - [x] 3.3 创建 WorkflowPanel 组件
    - 显示工作流列表
    - 显示工作流模板
    - 显示最近执行记录
    - _需求: 2.2_
  - [x] 3.4 创建 AssetsPanel 组件
    - 显示资源分类（角色、场景、音频、模板）
    - 显示筛选器
    - 显示搜索框
    - _需求: 2.3_
  - [x] 3.5 创建 CharactersPanel 组件
    - 显示角色列表
    - 显示筛选选项（锁定/未锁定）
    - 显示搜索框
    - _需求: 2.4_
  - [x] 3.6 创建 SettingsPanel 组件
    - 显示设置分类导航（AI配置、生成参数、界面、关于）
    - _需求: 2.5_

- [ ]* 3.7 编写面板内容属性测试
  - **Property 2: Control Panel Content Matches Navigation**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. 检查点 - 确保导航和面板功能正常
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 统一视图头部组件
  - [x] 5.1 创建 ViewHeader 组件
    - 创建 components/ui/ViewHeader.vue
    - 实现 title、subtitle props
    - 实现 actions slot
    - _需求: 3.1_
  - [x] 5.2 更新 DashboardView 使用 ViewHeader
    - 替换现有头部为 ViewHeader 组件
    - 配置标题和操作按钮
    - _需求: 3.2_
  - [x] 5.3 更新 WorkflowEditor 使用 ViewHeader
    - 替换现有头部为 ViewHeader 组件
    - 配置标题和操作按钮
    - _需求: 3.3_
  - [x] 5.4 更新 AssetsView 使用 ViewHeader
    - 替换现有头部为 ViewHeader 组件
    - 配置标题和操作按钮
    - _需求: 3.4_
  - [x] 5.5 更新 CharactersView 使用 ViewHeader
    - 替换现有头部为 ViewHeader 组件
    - 配置标题和操作按钮
    - _需求: 3.5_

- [ ]* 5.6 编写视图头部属性测试
  - **Property 3: View Header Consistency**
  - **Validates: Requirements 3.1**

- [x] 6. 重构 App.vue 布局
  - [x] 6.1 提取中间面板为 ContextPanel
    - 将现有中间面板内容移至 DashboardPanel
    - 在 App.vue 中使用 ContextPanel 组件
    - _需求: 2.1-2.5_
  - [x] 6.2 简化主内容区结构
    - 移除 App.vue 中的固定头部
    - 让各视图自行管理头部（使用 ViewHeader）
    - _需求: 3.1_

- [x] 7. 优化用户操作流程
  - [x] 7.1 创建欢迎引导组件
    - 创建 components/welcome/WelcomeGuide.vue
    - 显示快速开始步骤
    - 提供导入小说入口
    - _需求: 5.1_
  - [x] 7.2 优化小说导入流程
    - 导入完成后自动跳转到解析结果
    - 解析完成后提示审核角色
    - _需求: 5.2, 5.3_
  - [x] 7.3 优化工作流执行流程
    - 角色确认后启用工作流执行
    - 执行完成后显示结果预览
    - _需求: 5.4, 5.5_

- [ ]* 7.4 编写导入流程属性测试
  - **Property 4: Novel Import Workflow State Machine**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [x] 8. 检查点 - 确保视图和流程功能正常
  - 确保所有测试通过，如有问题请询问用户

- [x] 9. 统一状态反馈
  - [x] 9.1 创建统一的加载状态组件
    - 创建 components/ui/LoadingState.vue
    - 支持全屏和内联两种模式
    - _需求: 6.1_
  - [x] 9.2 创建统一的空状态组件
    - 创建 components/ui/EmptyState.vue
    - 支持自定义图标、标题、描述和操作
    - _需求: 6.1_
  - [x] 9.3 优化通知系统
    - 确保成功、错误、警告通知样式一致
    - 添加操作按钮支持
    - _需求: 6.2, 6.3_

- [ ]* 9.4 编写操作反馈属性测试
  - **Property 5: Operation Feedback Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 10. 视觉优化和动画
  - [x] 10.1 添加视图切换动画
    - 使用 Vue transition 实现平滑切换
    - 控制动画时长在 300ms 以内
    - _需求: 6.4_
  - [x] 10.2 优化交互反馈
    - 确保所有可点击元素有 hover 和 active 状态
    - 统一按钮和链接的交互样式
    - _需求: 6.5_

- [x] 11. 最终检查点 - 确保所有功能正常
  - 确保所有测试通过，如有问题请询问用户
