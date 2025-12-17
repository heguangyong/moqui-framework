# UI功能集成设计文档

## 概述

本设计文档描述如何将小说动漫生成器的核心功能集成到已完成的现代化三栏式UI框架中。设计目标是在保持UI一致性和用户体验的前提下，实现完整的小说到动漫视频转换工作流。

## 架构

### 功能模块映射

```
侧边栏图标 → 功能模块
├── Home (首页) → Dashboard概览
├── Workflow (工作流) → 工作流编辑器
├── Star (收藏) → 收藏项目/模板
├── Key (密钥) → API配置管理
├── Grid (网格) → 资源库
├── Users (用户) → 角色管理
└── Settings (设置) → 系统设置
```

### 中间面板功能映射

```
中间面板区域 → 功能
├── User Section → 用户信息/账户
├── Projects → 项目管理
│   ├── Dashboard → 项目概览
│   ├── Library → 我的项目
│   └── Shared → 共享项目
├── Status → 任务状态
│   ├── New → 新建任务
│   ├── Processing → 处理中
│   └── Review → 待审核
├── History → 历史记录
│   ├── Recent → 最近编辑
│   └── Archive → 归档项目
└── Documents → 项目文件树
    ├── 小说文件/
    ├── 剧本文件/
    ├── 分镜文件/
    └── 视频文件/
```

### 主区域视图映射

```
主区域视图
├── DashboardView → 项目统计、快速操作
├── WorkflowView → 可视化工作流编辑器
├── AssetsView → 资源库网格视图
├── CharactersView → 角色管理卡片
├── NovelView → 小说预览/编辑
├── ScriptView → 剧本预览/编辑
├── StoryboardView → 分镜预览
├── VideoView → 视频预览
└── SettingsView → 系统设置
```

## 组件和接口

### 1. 侧边栏导航增强

```typescript
interface SidebarNavItem {
  id: string;
  icon: Component;
  label: string;
  route: string;
  badge?: number;
  active?: boolean;
}

const navItems: SidebarNavItem[] = [
  { id: 'home', icon: HomeIcon, label: 'Dashboard', route: '/home' },
  { id: 'workflow', icon: WorkflowIcon, label: '工作流', route: '/workflow' },
  { id: 'star', icon: StarIcon, label: '收藏', route: '/favorites' },
  { id: 'key', icon: KeyIcon, label: 'API配置', route: '/api-config' },
  { id: 'grid', icon: GridIcon, label: '资源库', route: '/assets' },
  { id: 'users', icon: UsersIcon, label: '角色', route: '/characters' },
];
```

### 2. 项目管理接口

```typescript
interface Project {
  id: string;
  name: string;
  novelFile: string;
  status: 'draft' | 'processing' | 'completed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  episodes: Episode[];
  characters: Character[];
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  createProject(novelFile: File): Promise<Project>;
  loadProject(id: string): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;
}
```

### 3. 任务状态接口

```typescript
interface Task {
  id: string;
  projectId: string;
  type: 'parse' | 'analyze' | 'script' | 'storyboard' | 'video';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface TaskStore {
  tasks: Task[];
  newTasks: Task[];
  runningTasks: Task[];
  reviewTasks: Task[];
  createTask(projectId: string, type: Task['type']): Promise<Task>;
  updateTaskStatus(id: string, status: Task['status']): Promise<void>;
}
```

### 4. 文件树接口

```typescript
interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'novel' | 'script' | 'storyboard' | 'video';
  path: string;
  children?: FileNode[];
  size?: number;
  modifiedAt?: Date;
}

interface FileTreeProps {
  projectId: string;
  rootNodes: FileNode[];
  selectedNode?: string;
  onSelect: (node: FileNode) => void;
  onContextMenu: (node: FileNode, event: MouseEvent) => void;
}
```

## 数据模型

### 项目数据结构

```typescript
interface NovelProject {
  id: string;
  name: string;
  description?: string;
  
  // 源文件
  novel: {
    file: string;
    content: string;
    chapters: Chapter[];
    wordCount: number;
  };
  
  // 角色数据
  characters: Character[];
  
  // 剧情分析
  plot: {
    mainStory: string;
    keyPoints: PlotPoint[];
    timeline: TimelineEvent[];
  };
  
  // 剧集数据
  episodes: Episode[];
  
  // 生成状态
  status: ProjectStatus;
  progress: number;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}
```

## 正确性属性

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 侧边栏导航一致性
*For any* 侧边栏图标点击，系统应切换到对应的功能视图，且当前激活状态应正确反映
**验证需求: 1.1-1.6**

### Property 2: 项目状态同步
*For any* 项目状态变化，中间面板的Projects区域计数应实时更新
**验证需求: 2.5**

### Property 3: 任务状态分类正确性
*For any* 任务，其状态分类应与实际状态一致（新建/处理中/待审核）
**验证需求: 3.1-3.5**

### Property 4: 文件树结构完整性
*For any* 项目，文件树应完整显示所有相关文件，且层级结构正确
**验证需求: 4.1-4.6**

### Property 5: 主区域视图切换
*For any* 功能选择，主区域应显示对应的工作界面
**验证需求: 5.1-5.5**

### Property 6: 标签页状态管理
*For any* 标签页操作，系统应正确管理标签状态和内容切换
**验证需求: 6.1-6.5**

### Property 7: 文件拖放处理
*For any* 有效的TXT文件拖放，系统应创建新项目并开始解析
**验证需求: 7.1-7.5**

### Property 8: 设置持久化
*For any* 设置更改，系统应正确保存并在下次启动时恢复
**验证需求: 8.4**

## 错误处理

### 项目加载错误
- 项目文件损坏时显示恢复选项
- 网络错误时提供重试机制
- 权限不足时显示明确提示

### 任务执行错误
- AI服务不可用时显示配置引导
- 处理超时时提供取消和重试选项
- 生成失败时保存中间结果

### 文件操作错误
- 文件格式不支持时显示支持格式列表
- 文件过大时提供分块处理选项
- 存储空间不足时提示清理建议

## 测试策略

### 单元测试
- 测试各视图组件的渲染正确性
- 测试状态管理的数据流
- 测试文件操作的边界情况

### 集成测试
- 测试侧边栏与主区域的联动
- 测试项目创建到生成的完整流程
- 测试多标签页的状态管理

### 属性测试
- 使用fast-check验证状态一致性
- 测试文件树结构的正确性
- 验证任务状态转换的合法性

**测试框架**: Vitest + Vue Test Utils
**属性测试库**: fast-check
**最小测试迭代数**: 100次
