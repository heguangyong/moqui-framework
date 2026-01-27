# 小说动漫生成器系统 - 设计文档

## 文档元数据
```yaml
---
spec_number: "06-01"
spec_name: "novel-processing-pipeline"
full_name: "小说动漫生成器系统设计"
category: "06"
category_name: "开发工具 / Development Tools"
priority: "P3"
status: "设计中"
created_date: "2025-01-15"
last_updated: "2025-01-15"
version: "v0.1"
---
```

## 核心场景概述

小说动漫生成器是一个AI驱动的内容创作工具，帮助创作者将文字小说转换为动漫形式的视觉内容。系统通过可视化工作流设计，让用户自定义处理流程，从小说解析、角色识别、场景分析，到最终的视频生成。

### 主要用户场景

1. **内容创作者场景**: 独立作者或小型工作室，希望将自己的小说作品转换为动漫形式
2. **快速原型场景**: 动漫制作公司，需要快速生成故事板和概念验证
3. **教育培训场景**: 教育机构，用于教学演示和学生作品展示

### 关键业务流程

```
小说导入 → 内容解析 → 角色识别 → 场景分析 → 工作流设计 → 
管道执行 → 内容生成 → 预览调整 → 导出发布
```

### 预期用户体验目标

- **简单直观**: 无需专业技能即可完成基本操作
- **灵活可控**: 通过工作流自定义处理流程
- **实时反馈**: 处理过程可视化，进度实时显示
- **高质量输出**: AI驱动的内容生成保证质量


## 场景分析

### 场景1: 项目创建和小说导入

**触发条件**: 用户首次使用应用或开始新的创作项目

**参与角色**: 内容创作者

**操作流程**:
1. 用户启动桌面应用，进入欢迎界面
2. 点击"新建项目"按钮，填写项目名称和描述
3. 系统创建项目目录结构，生成唯一项目ID
4. 用户选择"添加小说文件"，浏览本地文件系统
5. 选择.txt或.md格式的小说文件
6. 系统验证文件格式和大小（< 1MB）
7. 系统调用后端API解析小说内容
8. 后端识别章节结构，统计字数
9. 解析结果返回前端，显示章节列表
10. 用户可以预览章节内容，编辑章节标题

**预期结果**:
- 项目成功创建，包含基本元数据
- 小说文件已解析，章节结构清晰
- 项目数据持久化到本地文件系统
- 用户可以继续添加更多文件或进入下一步

**异常处理**:
- 文件格式不支持 → 提示用户转换为.txt格式
- 文件过大 → 提示分章节上传
- 解析失败 → 提供手动章节划分工具
- 网络错误 → 缓存数据，支持离线编辑

**技术要点**:
- 前端使用Electron的文件对话框API
- 后端使用正则表达式识别章节模式
- 支持中英文混合内容的字数统计
- 项目数据使用JSON格式存储


### 场景2: 角色管理和识别

**触发条件**: 小说导入完成后，用户需要定义角色信息

**参与角色**: 内容创作者

**操作流程**:
1. 用户进入"角色管理"页面
2. 系统显示已识别的角色列表（如果有AI识别功能）
3. 用户点击"添加角色"按钮
4. 填写角色信息：
   - 名称（必填）
   - 类型：主角/配角/反派/群众
   - 外貌描述
   - 性格特征
   - 参考图片（可选）
5. 系统验证输入，保存角色信息
6. 角色卡片显示在列表中
7. 用户可以编辑、删除角色
8. 系统自动关联角色到相关场景

**预期结果**:
- 角色信息完整记录
- 角色参考图片已上传并关联
- 角色数据持久化
- 后续工作流可以使用角色信息

**异常处理**:
- 角色名称重复 → 提示用户修改或确认
- 图片格式不支持 → 提示支持的格式
- 图片过大 → 自动压缩或提示用户
- 删除被引用的角色 → 警告并显示引用位置

**技术要点**:
- 使用Pinia store管理角色状态
- 图片存储在项目assets目录
- 支持拖拽上传图片
- 角色数据包含在项目JSON中


### 场景3: 工作流设计

**触发条件**: 用户准备好项目内容，需要设计处理流程

**参与角色**: 内容创作者

**操作流程**:
1. 用户进入"工作流编辑器"页面
2. 系统显示可视化画布和节点库
3. 用户从节点库拖拽节点到画布：
   - 输入节点：小说文本、角色信息
   - 处理节点：场景分析、对话提取、情感分析
   - AI节点：角色生成、场景渲染、配音合成
   - 输出节点：视频导出、图片序列
4. 用户连接节点，定义数据流
5. 系统实时验证工作流：
   - 检查节点连接的兼容性
   - 检测循环依赖
   - 验证必需参数
6. 用户配置节点参数
7. 保存工作流配置
8. 系统估算执行时间和资源消耗

**预期结果**:
- 工作流逻辑正确，无错误
- 节点参数配置完整
- 工作流已保存，可以执行
- 用户了解预期的执行时间

**异常处理**:
- 节点连接不兼容 → 高亮显示错误，提供修复建议
- 缺少必需参数 → 标记节点，提示补充
- 循环依赖 → 显示依赖路径，建议断开
- 保存失败 → 本地缓存，提示重试

**技术要点**:
- 使用Vue3 + Canvas实现可视化编辑器
- 节点定义包含输入/输出端口类型
- 工作流数据结构：nodes数组 + connections数组
- 实时验证使用拓扑排序算法


### 场景4: 管道执行和监控

**触发条件**: 工作流设计完成，用户启动执行

**参与角色**: 内容创作者、系统管道引擎

**操作流程**:
1. 用户点击"执行工作流"按钮
2. 系统检查资源可用性（Credits余额、API配额）
3. 创建执行记录，生成执行ID
4. 管道引擎按拓扑顺序执行节点：
   - 初始化节点状态为"pending"
   - 执行节点，状态变为"running"
   - 节点完成，状态变为"completed"
   - 节点失败，状态变为"error"
5. 前端实时显示执行进度：
   - 当前执行的节点高亮
   - 进度条显示整体完成度
   - 日志面板显示执行日志
6. 用户可以暂停或取消执行
7. 执行完成后，显示结果摘要
8. 用户可以查看生成的内容

**预期结果**:
- 工作流成功执行完成
- 所有节点状态为"completed"
- 生成的内容已保存
- 执行日志完整记录

**异常处理**:
- 节点执行超时 → 标记超时，提供重试选项
- API调用失败 → 记录错误，支持断点续传
- 资源不足 → 暂停执行，提示充值或优化
- 用户取消 → 保存当前状态，支持恢复

**技术要点**:
- 使用WebSocket实时推送执行状态
- 前端使用EventSource或轮询获取进度
- 执行状态持久化到数据库
- 支持分布式执行（未来扩展）


## 技术实现方案

### 系统架构设计

#### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Desktop App                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Main Process│  │   Renderer   │  │   Preload    │      │
│  │              │  │   Process    │  │   Script     │      │
│  │  - Window    │  │  - Vue 3 App │  │  - IPC Bridge│      │
│  │  - IPC       │  │  - Pinia     │  │  - Security  │      │
│  │  - File I/O  │  │  - Router    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                  Moqui Backend Services                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ REST API     │  │  Services    │  │  Entities    │      │
│  │              │  │              │  │              │      │
│  │ - Novel      │  │ - Parser     │  │ - Novel      │      │
│  │ - Character  │  │ - Workflow   │  │ - Character  │      │
│  │ - Workflow   │  │ - Pipeline   │  │ - Workflow   │      │
│  │ - Asset      │  │ - AI         │  │ - Asset      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                   External AI Services                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 智谱AI GLM-4 │  │  Image Gen   │  │  Voice Gen   │      │
│  │              │  │              │  │              │      │
│  │ - Text       │  │ - Stable     │  │ - TTS        │      │
│  │ - Analysis   │  │   Diffusion  │  │ - Voice      │      │
│  │ - Generation │  │ - Midjourney │  │   Clone      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 前端架构（Electron + Vue 3）

**Main Process (主进程)**:
- 窗口管理：创建、关闭、最小化、最大化
- 文件系统访问：读写项目文件
- IPC通信：与渲染进程通信
- 原生菜单：应用菜单和上下文菜单
- 系统托盘：后台运行支持

**Renderer Process (渲染进程)**:
- Vue 3应用：使用Composition API
- Pinia状态管理：全局状态
- Vue Router：页面路由
- 组件库：自定义UI组件
- 样式系统：SCSS + 设计系统

**Preload Script (预加载脚本)**:
- IPC桥接：安全的进程间通信
- API暴露：暴露有限的Node.js API
- 安全隔离：防止直接访问Node.js


#### 后端架构（Moqui Framework）

**服务层 (Services)**:
- NovelAnimeServices.xml：小说解析、验证
- NovelAnimeCharacterServices.xml：角色识别、管理
- NovelAnimeWorkflowServices.xml：工作流CRUD、执行
- NovelAnimePipelineServices.xml：管道编排、监控
- NovelAnimeAIServices.xml：AI服务集成
- NovelAnimeAssetServices.xml：素材管理

**实体层 (Entities)**:
- Project：项目信息
- Novel：小说元数据
- Chapter：章节内容
- Scene：场景信息
- Character：角色信息
- Workflow：工作流定义
- WorkflowExecution：执行记录
- Asset：素材资源

**REST API层**:
- `/rest/s1/novel-anime/novels`：小说管理
- `/rest/s1/novel-anime/characters`：角色管理
- `/rest/s1/novel-anime/workflows`：工作流管理
- `/rest/s1/novel-anime/executions`：执行管理
- `/rest/s1/novel-anime/assets`：素材管理

### 关键组件设计

#### 1. 项目管理器 (ProjectManager)

**职责**:
- 项目CRUD操作
- 项目文件结构管理
- 项目数据持久化
- 最近项目列表

**接口**:
```javascript
class ProjectManager {
  // 创建项目
  async createProject(projectData)
  
  // 加载项目
  async loadProject(projectId)
  
  // 保存项目
  async saveProject(projectId, projectData)
  
  // 删除项目
  async deleteProject(projectId)
  
  // 获取最近项目
  async getRecentProjects(limit)
  
  // 导出项目
  async exportProject(projectId, format)
}
```

**数据结构**:
```json
{
  "projectId": "uuid",
  "name": "项目名称",
  "description": "项目描述",
  "type": "novel-to-anime",
  "createdDate": "2025-01-15T10:00:00Z",
  "lastUpdated": "2025-01-15T12:00:00Z",
  "novels": [],
  "characters": [],
  "workflows": [],
  "assets": [],
  "settings": {}
}
```


#### 2. 小说解析器 (NovelParser)

**职责**:
- 文本文件读取和验证
- 章节结构识别
- 字数统计（中英文）
- 元数据提取

**算法**:
```javascript
class NovelParser {
  // 解析小说文本
  async parseNovel(textContent) {
    // 1. 清理和规范化文本
    const cleanText = this.normalizeText(textContent)
    
    // 2. 识别章节
    const chapters = this.detectChapters(cleanText)
    
    // 3. 提取元数据
    const metadata = this.extractMetadata(cleanText, chapters)
    
    // 4. 统计字数
    const wordCount = this.countWords(cleanText)
    
    return {
      chapters,
      metadata,
      wordCount
    }
  }
  
  // 章节检测模式
  detectChapters(text) {
    const patterns = [
      /^第[一二三四五六七八九十\d]+章/,
      /^Chapter\s+(\d+|[IVXLCDM]+)/i,
      /^第\s*(\d+)\s*章/,
      /^\d+\.\s/
    ]
    // 使用模式匹配识别章节边界
  }
  
  // 字数统计（支持中英文）
  countWords(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/\b\w+\b/g) || []).length
    return chineseChars + englishWords
  }
}
```

**章节数据结构**:
```json
{
  "chapterId": "chapter_1",
  "chapterNumber": 1,
  "title": "第一章 开始",
  "content": "章节内容...",
  "wordCount": 3500,
  "scenes": []
}
```


#### 3. 工作流编辑器 (WorkflowEditor)

**职责**:
- 可视化工作流设计
- 节点库管理
- 连接验证
- 工作流序列化

**节点定义**:
```typescript
interface WorkflowNode {
  id: string
  type: string  // 'input' | 'process' | 'ai' | 'output'
  name: string
  position: { x: number, y: number }
  inputs: Port[]
  outputs: Port[]
  config: Record<string, any>
  status: 'idle' | 'running' | 'completed' | 'error'
}

interface Port {
  id: string
  name: string
  type: string  // 'text' | 'image' | 'audio' | 'video' | 'data'
  required: boolean
}

interface Connection {
  id: string
  from: { nodeId: string, portId: string }
  to: { nodeId: string, portId: string }
}
```

**预定义节点类型**:
```javascript
const NODE_TYPES = {
  // 输入节点
  INPUT_NOVEL: {
    type: 'input',
    name: '小说输入',
    outputs: [{ type: 'text', name: '文本内容' }]
  },
  INPUT_CHARACTER: {
    type: 'input',
    name: '角色输入',
    outputs: [{ type: 'data', name: '角色数据' }]
  },
  
  // 处理节点
  PROCESS_SCENE_ANALYSIS: {
    type: 'process',
    name: '场景分析',
    inputs: [{ type: 'text', name: '文本' }],
    outputs: [{ type: 'data', name: '场景列表' }]
  },
  PROCESS_DIALOGUE_EXTRACT: {
    type: 'process',
    name: '对话提取',
    inputs: [{ type: 'text', name: '文本' }],
    outputs: [{ type: 'data', name: '对话列表' }]
  },
  
  // AI节点
  AI_CHARACTER_GENERATE: {
    type: 'ai',
    name: 'AI角色生成',
    inputs: [{ type: 'data', name: '角色描述' }],
    outputs: [{ type: 'image', name: '角色图片' }]
  },
  AI_SCENE_RENDER: {
    type: 'ai',
    name: 'AI场景渲染',
    inputs: [{ type: 'data', name: '场景描述' }],
    outputs: [{ type: 'image', name: '场景图片' }]
  },
  
  // 输出节点
  OUTPUT_VIDEO: {
    type: 'output',
    name: '视频导出',
    inputs: [
      { type: 'image', name: '图片序列' },
      { type: 'audio', name: '音频' }
    ]
  }
}
```

**工作流验证**:
```javascript
class WorkflowValidator {
  validate(workflow) {
    const errors = []
    
    // 1. 检查必需节点
    if (!this.hasInputNode(workflow)) {
      errors.push('缺少输入节点')
    }
    
    // 2. 检查连接兼容性
    workflow.connections.forEach(conn => {
      if (!this.isCompatible(conn)) {
        errors.push(`连接不兼容: ${conn.id}`)
      }
    })
    
    // 3. 检测循环依赖
    if (this.hasCycle(workflow)) {
      errors.push('存在循环依赖')
    }
    
    // 4. 检查孤立节点
    const orphans = this.findOrphanNodes(workflow)
    if (orphans.length > 0) {
      errors.push(`存在孤立节点: ${orphans.join(', ')}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  // 拓扑排序检测循环
  hasCycle(workflow) {
    // 使用DFS检测环
  }
}
```


#### 4. 管道编排器 (PipelineOrchestrator)

**职责**:
- 工作流执行调度
- 节点状态管理
- 进度监控
- 错误处理和重试

**执行引擎**:
```javascript
class PipelineOrchestrator {
  async executeWorkflow(workflowId) {
    // 1. 加载工作流定义
    const workflow = await this.loadWorkflow(workflowId)
    
    // 2. 验证工作流
    const validation = this.validator.validate(workflow)
    if (!validation.valid) {
      throw new Error(`工作流验证失败: ${validation.errors}`)
    }
    
    // 3. 创建执行上下文
    const execution = await this.createExecution(workflowId)
    
    // 4. 拓扑排序获取执行顺序
    const executionOrder = this.topologicalSort(workflow)
    
    // 5. 按顺序执行节点
    for (const nodeId of executionOrder) {
      try {
        await this.executeNode(execution, nodeId)
      } catch (error) {
        await this.handleNodeError(execution, nodeId, error)
      }
    }
    
    // 6. 完成执行
    await this.completeExecution(execution)
    
    return execution
  }
  
  async executeNode(execution, nodeId) {
    const node = execution.workflow.nodes.find(n => n.id === nodeId)
    
    // 更新节点状态
    await this.updateNodeStatus(execution.id, nodeId, 'running')
    
    // 获取节点输入数据
    const inputs = await this.getNodeInputs(execution, nodeId)
    
    // 执行节点处理器
    const processor = this.getNodeProcessor(node.type)
    const outputs = await processor.execute(node, inputs)
    
    // 保存节点输出
    await this.saveNodeOutputs(execution.id, nodeId, outputs)
    
    // 更新节点状态
    await this.updateNodeStatus(execution.id, nodeId, 'completed')
    
    // 发送进度更新
    this.emitProgress(execution)
  }
  
  // 拓扑排序
  topologicalSort(workflow) {
    const graph = this.buildGraph(workflow)
    const sorted = []
    const visited = new Set()
    
    const visit = (nodeId) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      const dependencies = graph.get(nodeId) || []
      dependencies.forEach(visit)
      
      sorted.push(nodeId)
    }
    
    workflow.nodes.forEach(node => visit(node.id))
    return sorted
  }
}
```

**执行状态管理**:
```typescript
interface ExecutionContext {
  executionId: string
  workflowId: string
  workflow: Workflow
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  nodeStates: Map<string, NodeState>
  nodeOutputs: Map<string, any>
  logs: ExecutionLog[]
  progress: number  // 0-100
}

interface NodeState {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
  error?: string
  retryCount: number
}
```


### 数据模型设计

#### 核心实体关系图

```
┌─────────────┐
│   Project   │
└──────┬──────┘
       │ 1:N
       ↓
┌─────────────┐      ┌──────────────┐
│    Novel    │──────│   Chapter    │
└──────┬──────┘ 1:N  └──────┬───────┘
       │                     │ 1:N
       │ 1:N                 ↓
       │              ┌──────────────┐
       │              │    Scene     │
       │              └──────────────┘
       │
       ├─────────────────────┐
       │ 1:N                 │ 1:N
       ↓                     ↓
┌─────────────┐      ┌──────────────┐
│  Character  │      │   Workflow   │
└──────┬──────┘      └──────┬───────┘
       │ 1:N                │ 1:N
       ↓                    ↓
┌─────────────┐      ┌──────────────┐
│CharacterApp │      │WorkflowExec  │
└─────────────┘      └──────────────┘
```

#### 数据字典

**Project (项目)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| projectId | UUID | 项目唯一标识 |
| name | String | 项目名称 |
| description | Text | 项目描述 |
| userId | UUID | 创建用户ID |
| status | Enum | active/archived/deleted |
| createdDate | DateTime | 创建时间 |
| lastUpdated | DateTime | 最后更新时间 |

**Novel (小说)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| novelId | UUID | 小说唯一标识 |
| projectId | UUID | 所属项目 |
| title | String | 小说标题 |
| author | String | 作者 |
| originalText | LongText | 原始文本 |
| wordCount | Integer | 字数统计 |
| status | Enum | parsed/analyzing/ready |
| sourceType | Enum | text/file |
| filename | String | 源文件名 |
| createdDate | DateTime | 创建时间 |
| lastUpdated | DateTime | 最后更新时间 |

**Chapter (章节)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| chapterId | UUID | 章节唯一标识 |
| novelId | UUID | 所属小说 |
| chapterNumber | Integer | 章节序号 |
| title | String | 章节标题 |
| content | LongText | 章节内容 |
| wordCount | Integer | 字数统计 |
| createdDate | DateTime | 创建时间 |

**Character (角色)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| characterId | UUID | 角色唯一标识 |
| novelId | UUID | 所属小说 |
| name | String | 角色名称 |
| role | Enum | protagonist/antagonist/supporting/minor |
| description | Text | 角色描述 |
| appearance | Text | 外貌描述 |
| personality | Text | 性格特征 |
| firstMention | String | 首次出现位置 |
| mentionCount | Integer | 出现次数 |
| isLocked | Boolean | 是否锁定属性 |
| createdDate | DateTime | 创建时间 |

**Workflow (工作流)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| workflowId | UUID | 工作流唯一标识 |
| projectId | UUID | 所属项目 |
| userId | UUID | 创建用户 |
| name | String | 工作流名称 |
| description | Text | 工作流描述 |
| status | Enum | idle/running/completed/error |
| nodesJson | JSON | 节点定义 |
| connectionsJson | JSON | 连接定义 |
| createdDate | DateTime | 创建时间 |
| lastUpdatedDate | DateTime | 最后更新时间 |

**WorkflowExecution (执行记录)**:
| 字段 | 类型 | 说明 |
|------|------|------|
| executionId | UUID | 执行唯一标识 |
| workflowId | UUID | 工作流ID |
| workflowName | String | 工作流名称 |
| status | Enum | running/success/failed/cancelled |
| startTime | DateTime | 开始时间 |
| endTime | DateTime | 结束时间 |
| duration | Integer | 执行时长（秒） |
| nodeCount | Integer | 节点数量 |
| logsJson | JSON | 执行日志 |
| createdDate | DateTime | 创建时间 |


### API接口设计

#### REST API规范

**基础URL**: `http://localhost:8080/rest/s1/novel-anime`

**认证**: JWT Token (可选，桌面应用可以使用本地认证)

**响应格式**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

#### 小说管理API

**POST /novels/parse** - 解析小说
```json
// Request
{
  "textContent": "小说文本内容...",
  "title": "小说标题",
  "author": "作者"
}

// Response
{
  "success": true,
  "data": {
    "novelId": "uuid",
    "novelStructure": {
      "title": "小说标题",
      "author": "作者",
      "chapters": [...],
      "metadata": {...}
    }
  }
}
```

**GET /novels/{novelId}** - 获取小说详情
```json
// Response
{
  "success": true,
  "data": {
    "novelId": "uuid",
    "title": "小说标题",
    "author": "作者",
    "wordCount": 50000,
    "chapters": [...]
  }
}
```

#### 角色管理API

**GET /characters?novelId={novelId}** - 获取角色列表
```json
// Response
{
  "success": true,
  "data": {
    "characters": [
      {
        "characterId": "uuid",
        "name": "角色名",
        "role": "protagonist",
        "description": "角色描述"
      }
    ]
  }
}
```

**POST /characters** - 创建角色
```json
// Request
{
  "novelId": "uuid",
  "name": "角色名",
  "role": "protagonist",
  "description": "角色描述",
  "appearance": "外貌描述",
  "personality": "性格特征"
}

// Response
{
  "success": true,
  "data": {
    "characterId": "uuid"
  }
}
```

#### 工作流管理API

**GET /workflows?projectId={projectId}** - 获取工作流列表
```json
// Response
{
  "success": true,
  "data": {
    "workflows": [
      {
        "workflowId": "uuid",
        "name": "工作流名称",
        "status": "idle",
        "nodeCount": 5
      }
    ]
  }
}
```

**POST /workflows** - 创建工作流
```json
// Request
{
  "projectId": "uuid",
  "name": "工作流名称",
  "description": "工作流描述",
  "nodes": [...],
  "connections": [...]
}

// Response
{
  "success": true,
  "data": {
    "workflowId": "uuid"
  }
}
```

**PUT /workflows/{workflowId}** - 更新工作流
```json
// Request
{
  "name": "新名称",
  "nodes": [...],
  "connections": [...]
}
```

**POST /workflows/{workflowId}/execute** - 执行工作流
```json
// Response
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "running"
  }
}
```

**GET /executions/{executionId}** - 获取执行状态
```json
// Response
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "running",
    "progress": 45,
    "currentNode": "node_3",
    "logs": [...]
  }
}
```


### AI服务集成方案

#### 智谱AI GLM-4集成

**用途**: 文本分析、内容生成、角色识别

**API配置**:
```javascript
const ZHIPU_CONFIG = {
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.ZHIPU_API_KEY,
  model: 'glm-4',
  timeout: 60000
}
```

**场景分析服务**:
```javascript
async function analyzeScene(sceneText) {
  const prompt = `
    分析以下小说场景，提取关键信息：
    
    场景文本：
    ${sceneText}
    
    请提取：
    1. 场景地点
    2. 时间（白天/夜晚/黄昏等）
    3. 天气
    4. 氛围/情绪
    5. 出现的角色
    6. 主要动作
    
    以JSON格式返回。
  `
  
  const response = await callGLM4(prompt)
  return JSON.parse(response)
}
```

**角色识别服务**:
```javascript
async function identifyCharacters(novelText) {
  const prompt = `
    从以下小说文本中识别所有角色：
    
    ${novelText.substring(0, 5000)}
    
    对每个角色提取：
    1. 姓名
    2. 角色类型（主角/配角/反派）
    3. 首次出现位置
    4. 简短描述
    
    以JSON数组格式返回。
  `
  
  const response = await callGLM4(prompt)
  return JSON.parse(response)
}
```

#### 图像生成集成（未来扩展）

**Stable Diffusion API**:
- 角色形象生成
- 场景背景生成
- 分镜头图片生成

**配置示例**:
```javascript
const SD_CONFIG = {
  baseURL: 'https://api.stability.ai/v1',
  apiKey: process.env.STABILITY_API_KEY,
  model: 'stable-diffusion-xl-1024-v1-0'
}

async function generateCharacterImage(characterDescription) {
  const prompt = `
    anime style, high quality, detailed,
    ${characterDescription},
    studio lighting, clean background
  `
  
  const response = await callStableDiffusion({
    prompt,
    negativePrompt: 'blurry, low quality, distorted',
    width: 1024,
    height: 1024,
    steps: 30
  })
  
  return response.imageUrl
}
```

#### 语音合成集成（未来扩展）

**TTS服务**:
- 对话配音
- 旁白生成
- 角色声音克隆


### 数据持久化方案

#### 本地文件系统存储

**项目目录结构**:
```
~/NovelAnimeProjects/
├── project-uuid-1/
│   ├── project.json          # 项目元数据
│   ├── novels/
│   │   ├── novel-1.json      # 小说数据
│   │   └── novel-1.txt       # 原始文本
│   ├── characters/
│   │   └── characters.json   # 角色数据
│   ├── workflows/
│   │   ├── workflow-1.json   # 工作流定义
│   │   └── executions/       # 执行记录
│   ├── assets/
│   │   ├── images/           # 图片素材
│   │   ├── audio/            # 音频素材
│   │   └── videos/           # 视频素材
│   └── exports/              # 导出文件
└── project-uuid-2/
    └── ...
```

**project.json格式**:
```json
{
  "version": "1.0",
  "projectId": "uuid",
  "name": "项目名称",
  "description": "项目描述",
  "type": "novel-to-anime",
  "createdDate": "2025-01-15T10:00:00Z",
  "lastUpdated": "2025-01-15T12:00:00Z",
  "novels": [
    {
      "novelId": "uuid",
      "title": "小说标题",
      "filename": "novel-1.txt",
      "wordCount": 50000
    }
  ],
  "characters": [
    {
      "characterId": "uuid",
      "name": "角色名",
      "role": "protagonist"
    }
  ],
  "workflows": [
    {
      "workflowId": "uuid",
      "name": "工作流名称",
      "filename": "workflow-1.json"
    }
  ],
  "settings": {
    "autoSave": true,
    "autoSaveInterval": 30000
  }
}
```

#### 自动保存机制

**实现策略**:
```javascript
class AutoSaveManager {
  constructor() {
    this.saveQueue = []
    this.saveInterval = 30000  // 30秒
    this.isDirty = false
    this.isSaving = false
  }
  
  // 标记数据已修改
  markDirty() {
    this.isDirty = true
  }
  
  // 启动自动保存
  start() {
    this.timer = setInterval(() => {
      if (this.isDirty && !this.isSaving) {
        this.save()
      }
    }, this.saveInterval)
  }
  
  // 执行保存
  async save() {
    if (this.isSaving) return
    
    this.isSaving = true
    try {
      const projectData = this.collectProjectData()
      await this.writeToFile(projectData)
      this.isDirty = false
      this.notifySaveSuccess()
    } catch (error) {
      this.notifySaveError(error)
    } finally {
      this.isSaving = false
    }
  }
  
  // 停止自动保存
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
```

#### 数据备份策略

**备份规则**:
1. 每次保存前创建备份
2. 保留最近10个备份
3. 备份文件命名：`project.json.backup.{timestamp}`
4. 定期清理旧备份

**恢复机制**:
```javascript
async function recoverFromBackup(projectId) {
  const backupDir = path.join(projectsDir, projectId, '.backups')
  const backups = await fs.readdir(backupDir)
  
  // 按时间排序
  backups.sort().reverse()
  
  // 尝试恢复最新的有效备份
  for (const backup of backups) {
    try {
      const data = await fs.readFile(path.join(backupDir, backup))
      const project = JSON.parse(data)
      
      // 验证数据完整性
      if (this.validateProject(project)) {
        return project
      }
    } catch (error) {
      continue
    }
  }
  
  throw new Error('无法恢复项目数据')
}
```


### 性能优化设计

#### 前端性能优化

**1. 虚拟滚动**:
```javascript
// 大列表使用虚拟滚动
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  largeDataSet,
  {
    itemHeight: 50,
    overscan: 10
  }
)
```

**2. 懒加载**:
```javascript
// 路由懒加载
const WorkflowEditor = () => import('./views/WorkflowEditor.vue')

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)
```

**3. 状态管理优化**:
```javascript
// 使用computed缓存计算结果
const filteredCharacters = computed(() => {
  return characters.value.filter(c => c.role === selectedRole.value)
})

// 使用shallowRef减少响应式开销
const largeDataSet = shallowRef([])
```

**4. 渲染优化**:
```vue
<!-- 使用v-show而非v-if避免频繁DOM操作 -->
<div v-show="isVisible">...</div>

<!-- 使用key优化列表渲染 -->
<div v-for="item in items" :key="item.id">...</div>

<!-- 使用v-memo缓存渲染结果 -->
<div v-memo="[item.id, item.status]">...</div>
```

#### 后端性能优化

**1. 数据库查询优化**:
```groovy
// 使用索引
<index name="WORKFLOW_PROJECT_IDX">
    <index-field name="projectId"/>
</index>

// 避免N+1查询
def workflows = ec.entity.find("Workflow")
    .condition("projectId", projectId)
    .disableAuthz()
    .list()
```

**2. 缓存策略**:
```groovy
// 使用Entity缓存
def novel = ec.entity.find("Novel")
    .condition("novelId", novelId)
    .useCache(true)
    .one()

// 自定义缓存
def cacheKey = "workflow:${workflowId}"
def cached = ec.cache.get(cacheKey)
if (!cached) {
    cached = loadWorkflow(workflowId)
    ec.cache.put(cacheKey, cached, 3600)
}
```

**3. 异步处理**:
```groovy
// 异步执行长时间任务
ec.service.async()
    .name("novel.anime.PipelineServices.execute#Workflow")
    .parameters([workflowId: workflowId])
    .call()
```

#### 内存管理

**1. 大文件处理**:
```javascript
// 流式读取大文件
async function processLargeFile(filePath) {
  const stream = fs.createReadStream(filePath, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024  // 64KB chunks
  })
  
  for await (const chunk of stream) {
    await processChunk(chunk)
  }
}
```

**2. 内存监控**:
```javascript
// 监控内存使用
setInterval(() => {
  const usage = process.memoryUsage()
  if (usage.heapUsed > MEMORY_THRESHOLD) {
    // 触发垃圾回收或清理缓存
    global.gc && global.gc()
    clearCache()
  }
}, 60000)
```


### 错误处理和日志

#### 错误处理策略

**前端错误处理**:
```javascript
// 全局错误处理器
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err, info)
  
  // 记录错误
  errorLogger.log({
    type: 'vue-error',
    error: err.message,
    stack: err.stack,
    component: instance?.$options.name,
    info
  })
  
  // 显示用户友好的错误提示
  notification.error({
    title: '操作失败',
    message: getUserFriendlyMessage(err)
  })
}

// API调用错误处理
async function callAPI(endpoint, options) {
  try {
    const response = await fetch(endpoint, options)
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text())
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      handleAPIError(error)
    } else if (error instanceof NetworkError) {
      handleNetworkError(error)
    } else {
      handleUnknownError(error)
    }
    throw error
  }
}
```

**后端错误处理**:
```groovy
// Service错误处理
try {
    // 业务逻辑
    def result = processNovel(novelId)
    return [success: true, data: result]
} catch (ValidationException e) {
    ec.logger.warn("Validation failed: ${e.message}")
    return [success: false, error: 'VALIDATION_ERROR', message: e.message]
} catch (AIServiceException e) {
    ec.logger.error("AI service failed: ${e.message}", e)
    return [success: false, error: 'AI_SERVICE_ERROR', message: 'AI服务暂时不可用']
} catch (Exception e) {
    ec.logger.error("Unexpected error: ${e.message}", e)
    return [success: false, error: 'INTERNAL_ERROR', message: '系统错误，请稍后重试']
}
```

#### 日志系统

**日志级别**:
- ERROR: 错误信息，需要立即处理
- WARN: 警告信息，可能影响功能
- INFO: 一般信息，记录关键操作
- DEBUG: 调试信息，开发环境使用

**日志格式**:
```javascript
{
  "timestamp": "2025-01-15T10:00:00.000Z",
  "level": "INFO",
  "category": "workflow",
  "message": "Workflow execution started",
  "context": {
    "workflowId": "uuid",
    "userId": "uuid",
    "executionId": "uuid"
  },
  "metadata": {
    "nodeCount": 5,
    "estimatedDuration": 300
  }
}
```

**日志记录**:
```javascript
class Logger {
  log(level, category, message, context = {}, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      metadata
    }
    
    // 写入日志文件
    this.writeToFile(logEntry)
    
    // 发送到监控系统（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry)
    }
    
    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatForConsole(logEntry))
    }
  }
  
  error(category, message, error, context = {}) {
    this.log('ERROR', category, message, context, {
      error: error.message,
      stack: error.stack
    })
  }
  
  info(category, message, context = {}) {
    this.log('INFO', category, message, context)
  }
}
```


### 安全性设计

#### 数据安全

**1. API密钥保护**:
```javascript
// 使用操作系统的安全存储
const keytar = require('keytar')

// 存储API密钥
await keytar.setPassword('novel-anime-app', 'zhipu-api-key', apiKey)

// 读取API密钥
const apiKey = await keytar.getPassword('novel-anime-app', 'zhipu-api-key')
```

**2. 文件系统访问控制**:
```javascript
// 限制文件访问范围
const ALLOWED_PATHS = [
  app.getPath('userData'),
  app.getPath('documents')
]

function validatePath(filePath) {
  const normalized = path.normalize(filePath)
  return ALLOWED_PATHS.some(allowed => 
    normalized.startsWith(allowed)
  )
}

// 安全的文件操作
async function safeReadFile(filePath) {
  if (!validatePath(filePath)) {
    throw new Error('Access denied: Invalid file path')
  }
  return await fs.readFile(filePath)
}
```

**3. 输入验证**:
```javascript
// 验证用户输入
function validateNovelInput(input) {
  const errors = []
  
  // 检查文件大小
  if (input.size > MAX_FILE_SIZE) {
    errors.push('文件大小超过限制')
  }
  
  // 检查文件类型
  if (!ALLOWED_EXTENSIONS.includes(input.extension)) {
    errors.push('不支持的文件类型')
  }
  
  // 检查内容
  if (containsMaliciousContent(input.content)) {
    errors.push('文件内容包含不安全字符')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

#### 进程隔离

**Electron安全配置**:
```javascript
// main.js
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,        // 禁用Node集成
    contextIsolation: true,        // 启用上下文隔离
    sandbox: true,                 // 启用沙箱
    preload: path.join(__dirname, 'preload.js')
  }
})

// preload.js - 安全的API暴露
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 只暴露必要的API
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  selectFile: () => ipcRenderer.invoke('select-file')
})
```

#### 数据加密

**敏感数据加密**:
```javascript
const crypto = require('crypto')

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm'
    this.key = this.deriveKey()
  }
  
  // 加密数据
  encrypt(data) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    }
  }
  
  // 解密数据
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  }
}
```


## 设计决策记录

### 决策1: 选择Electron作为桌面应用框架

**决策背景**: 需要构建跨平台桌面应用，支持Windows、macOS、Linux

**方案对比**:
| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| Electron | 跨平台、Web技术栈、生态丰富 | 包体积大、内存占用高 | ⭐⭐⭐⭐⭐ |
| Tauri | 包体积小、性能好 | 生态较新、学习曲线陡 | ⭐⭐⭐⭐ |
| Qt | 原生性能、成熟稳定 | C++开发、学习成本高 | ⭐⭐⭐ |
| Flutter Desktop | 跨平台、性能好 | 桌面支持不成熟 | ⭐⭐⭐ |

**选择理由**:
1. 团队熟悉Web技术栈（Vue.js）
2. Electron生态成熟，第三方库丰富
3. 开发效率高，可以复用Web组件
4. 社区活跃，问题容易解决
5. 包体积和内存占用在可接受范围内

**权衡考虑**:
- 接受较大的包体积（~200MB）换取开发效率
- 通过代码优化和懒加载控制内存使用
- 未来可以考虑迁移到Tauri以减小体积

---

### 决策2: 使用Moqui Framework作为后端

**决策背景**: 需要企业级后端框架支持复杂业务逻辑

**方案对比**:
| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| Moqui | 企业级、完整生态、快速开发 | 学习曲线、文档较少 | ⭐⭐⭐⭐⭐ |
| Spring Boot | 生态丰富、社区大 | 配置复杂、启动慢 | ⭐⭐⭐⭐ |
| Express.js | 轻量、灵活 | 需要自己搭建很多基础设施 | ⭐⭐⭐ |
| Django | 完整框架、快速开发 | Python性能、异步支持弱 | ⭐⭐⭐ |

**选择理由**:
1. 项目已有Moqui基础设施
2. Entity Engine简化数据库操作
3. Service定义清晰，易于维护
4. REST API自动生成
5. 与现有AI平台集成方便

---

### 决策3: 工作流采用可视化节点编辑器

**决策背景**: 用户需要灵活定制处理流程

**方案对比**:
| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| 可视化编辑器 | 直观、灵活、易用 | 开发复杂度高 | ⭐⭐⭐⭐⭐ |
| 配置文件 | 简单、易实现 | 用户体验差、不直观 | ⭐⭐⭐ |
| 预设模板 | 快速上手 | 灵活性差、扩展困难 | ⭐⭐⭐ |
| 代码脚本 | 最灵活 | 技术门槛高、不适合普通用户 | ⭐⭐ |

**选择理由**:
1. 降低用户使用门槛
2. 提供直观的流程可视化
3. 支持拖拽操作，用户体验好
4. 便于调试和错误定位
5. 可以保存和分享工作流模板

**实现考虑**:
- 使用Canvas或SVG实现节点渲染
- 提供丰富的预定义节点库
- 支持节点参数配置
- 实时验证工作流正确性

---

### 决策4: 数据持久化使用本地文件系统

**决策背景**: 桌面应用需要离线工作能力

**方案对比**:
| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| 本地文件系统 | 离线可用、简单直接 | 同步困难、备份复杂 | ⭐⭐⭐⭐⭐ |
| SQLite | 结构化、查询方便 | 迁移复杂、版本管理难 | ⭐⭐⭐⭐ |
| IndexedDB | 浏览器原生、异步 | API复杂、调试困难 | ⭐⭐⭐ |
| 云端存储 | 同步方便、备份自动 | 需要网络、隐私问题 | ⭐⭐⭐ |

**选择理由**:
1. 完全离线可用
2. 用户数据本地存储，保护隐私
3. 文件结构清晰，易于理解
4. 便于手动备份和迁移
5. JSON格式易于调试和修改

**实现策略**:
- 使用JSON格式存储项目数据
- 实现自动保存和备份机制
- 提供数据导入导出功能
- 未来可以添加云端同步（可选）

---

### 决策5: AI服务使用智谱AI GLM-4

**决策背景**: 需要中文友好的AI服务支持文本分析

**方案对比**:
| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| 智谱AI GLM-4 | 中文优秀、价格合理 | 国内服务、API限制 | ⭐⭐⭐⭐⭐ |
| OpenAI GPT-4 | 能力强大、生态好 | 价格高、中文一般 | ⭐⭐⭐⭐ |
| 文心一言 | 中文好、百度生态 | API稳定性、功能限制 | ⭐⭐⭐ |
| 本地模型 | 无API成本、隐私好 | 性能要求高、效果一般 | ⭐⭐ |

**选择理由**:
1. 中文处理能力优秀
2. 价格相对合理
3. API稳定可靠
4. 支持多模态（文本、图像）
5. 与现有平台已集成

**扩展性考虑**:
- 设计抽象的AI服务接口
- 支持切换不同的AI提供商
- 提供降级方案（本地处理）

---

## 技术风险和缓解措施

### 风险1: AI服务依赖

**风险描述**: 依赖第三方AI服务可能存在可用性和成本风险

**影响程度**: 高

**缓解措施**:
1. 实现AI服务抽象层，支持多个提供商
2. 提供降级方案（简化的本地处理）
3. 实现请求缓存，减少API调用
4. 设置API调用限额和成本监控
5. 提供离线模式（基础功能可用）

### 风险2: 大文件处理性能

**风险描述**: 处理大型小说文件可能导致性能问题

**影响程度**: 中

**缓解措施**:
1. 使用流式处理大文件
2. 实现分块加载和处理
3. 添加进度提示和取消功能
4. 限制单个文件大小（< 1MB）
5. 提供文件分割工具

### 风险3: 跨平台兼容性

**风险描述**: 不同操作系统的文件系统和权限差异

**影响程度**: 中

**缓解措施**:
1. 使用Node.js的path模块处理路径
2. 统一使用UTF-8编码
3. 在各平台进行充分测试
4. 提供平台特定的错误处理
5. 文档说明平台差异

### 风险4: 数据丢失

**风险描述**: 应用崩溃或错误操作可能导致数据丢失

**影响程度**: 高

**缓解措施**:
1. 实现自动保存机制（30秒间隔）
2. 保存前创建备份
3. 提供数据恢复功能
4. 实现撤销/重做功能
5. 定期提醒用户手动备份

---

## 未来扩展规划

### Phase 2: 高级功能

1. **素材库系统**
   - 图片、音频、视频素材管理
   - 素材预览和搜索
   - 素材版本控制

2. **预览系统**
   - 实时预览生成的内容
   - 分镜头预览
   - 视频预览播放器

3. **导出功能**
   - 多格式导出（MP4、图片序列、项目文件）
   - 批量导出
   - 导出设置和模板

### Phase 3: 协作功能

1. **云端同步**
   - 项目云端备份
   - 多设备同步
   - 版本历史

2. **团队协作**
   - 项目分享
   - 协作编辑
   - 评论和反馈

### Phase 4: AI增强

1. **高级AI功能**
   - 自动角色设计
   - 智能场景生成
   - 自动配音合成

2. **智能推荐**
   - 工作流推荐
   - 素材推荐
   - 风格推荐

---

**文档版本**: v0.1  
**最后更新**: 2025年1-15  
**状态**: 设计完成，待评审  
**下一步**: 创建任务文档 (tasks.md)
