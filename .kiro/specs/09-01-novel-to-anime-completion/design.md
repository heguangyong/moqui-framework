# 小说转动漫功能完成 - 设计文档

**Spec**: 09-01-novel-to-anime-completion  
**状态**: 设计中  
**创建时间**: 2026-01-24  
**最后更新**: 2026-01-24

---

## 设计概述

### 核心发现

通过系统诊断,发现了**关键缺失功能**:

1. **GLM-4 图像生成服务未实现** ⚠️ 
   - 工作流节点 `AI_SCENE_RENDER` 标记为 `coming_soon`
   - 工作流节点 `AI_VOICE_SYNTHESIS` 标记为 `coming_soon`
   - moqui-mcp 组件只实现了文本生成,没有图像生成
   - **这是阻塞整个小说转动漫流程的核心问题**

2. **端到端流程未验证**
   - 虽然各个模块都存在,但完整流程未经测试
   - 数据流转和状态管理需要验证

3. **前后端集成状态未知**
   - 前端工作流执行引擎与后端服务的集成程度不明

### 设计目标

1. **实现 GLM-4 图像生成服务** (P0 - 最高优先级)
2. **验证并修复端到端流程** (P0)
3. **完善工作流执行引擎** (P1)
4. **优化用户体验** (P2)

---

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Electron + Vue 3)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Project Mgmt │  │ Novel Editor │  │ Character    │     │
│  │              │  │              │  │ Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Workflow Editor & Execution Engine           │  │
│  │  - Visual Node Editor                                │  │
│  │  - Pipeline Orchestrator                             │  │
│  │  - Real-time Status Monitor                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Moqui Framework)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │         novel-anime-generator Component              │  │
│  │  - Project Services                                  │  │
│  │  - Novel Services                                    │  │
│  │  - Character Services                                │  │
│  │  - Workflow Services                                 │  │
│  │  - Asset Services                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            moqui-mcp Component (AI Services)         │  │
│  │  ✅ Text Generation (GLM-4)                          │  │
│  │  ❌ Image Generation (CogView) - TO BE IMPLEMENTED   │  │
│  │  ❌ Voice Synthesis - TO BE IMPLEMENTED              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External AI Services                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   GLM-4      │  │   CogView    │  │  GLM-4 Voice │     │
│  │ (Text Gen)   │  │ (Image Gen)  │  │  (TTS)       │     │
│  │   ✅ 已集成  │  │  ❌ 未集成   │  │  ❌ 未集成   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 详细设计

### Component 1: GLM-4 图像生成服务

**目标**: 实现基于智谱 AI CogView 的图像生成功能

#### 1.1 后端服务设计

**文件**: `runtime/component/moqui-mcp/service/mcp/McpImageGenerationServices.xml`

```xml
<service verb="generate" noun="Image" authenticate="false" allow-remote="true">
    <description>使用智谱 CogView 生成图像</description>
    <in-parameters>
        <parameter name="prompt" required="true"/>
        <parameter name="model" default="cogview-3"/>
        <parameter name="size" default="1024x1024"/>
        <parameter name="style" default="anime"/>
        <parameter name="quality" default="standard"/>
    </in-parameters>
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="imageUrl"/>
        <parameter name="imageData"/>
        <parameter name="error"/>
    </out-parameters>
</service>
```

**实现要点**:
- 使用智谱 AI API: `https://open.bigmodel.cn/api/paas/v4/images/generations`
- 支持 CogView-3 模型
- 支持多种尺寸: 512x512, 1024x1024, 1920x1080
- 支持风格参数: anime, realistic, cartoon
- 实现错误处理和重试机制
- 实现图像下载和本地存储

#### 1.2 角色图像生成服务

**文件**: `runtime/component/novel-anime-generator/service/NovelAnimeCharacterImageServices.xml`

```xml
<service verb="generate" noun="CharacterImage" authenticate="anonymous-all">
    <description>为角色生成图像</description>
    <in-parameters>
        <parameter name="characterId" required="true"/>
        <parameter name="projectId" required="true"/>
        <parameter name="style" default="anime"/>
        <parameter name="pose" default="standing"/>
    </in-parameters>
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="imageUrl"/>
        <parameter name="assetId"/>
        <parameter name="error"/>
    </out-parameters>
</service>
```

**实现流程**:
1. 从数据库读取角色信息(名称、描述、特征)
2. 构建图像生成 prompt
3. 调用 `mcp.McpImageGenerationServices.generate#Image`
4. 下载生成的图像到本地
5. 创建 Asset 记录并关联到角色
6. 返回图像 URL 和 Asset ID

#### 1.3 场景图像生成服务

**文件**: `runtime/component/novel-anime-generator/service/NovelAnimeSceneImageServices.xml`

```xml
<service verb="generate" noun="SceneImage" authenticate="anonymous-all">
    <description>为场景生成图像</description>
    <in-parameters>
        <parameter name="sceneId" required="true"/>
        <parameter name="projectId" required="true"/>
        <parameter name="includeCharacters" type="Boolean" default="true"/>
    </in-parameters>
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="imageUrl"/>
        <parameter name="assetId"/>
        <parameter name="error"/>
    </out-parameters>
</service>
```

#### 1.4 REST API 端点

**文件**: `runtime/component/novel-anime-generator/service/novel-anime.rest.xml`

```xml
<!-- 角色图像生成 -->
<resource name="character-image" require-authentication="anonymous-all">
    <method type="post">
        <service name="NovelAnimeCharacterImageServices.generate#CharacterImage"/>
    </method>
</resource>

<!-- 场景图像生成 -->
<resource name="scene-image" require-authentication="anonymous-all">
    <method type="post">
        <service name="NovelAnimeSceneImageServices.generate#SceneImage"/>
    </method>
</resource>
```

---

### Component 2: 工作流节点实现

**目标**: 实现 AI_SCENE_RENDER 和 AI_VOICE_SYNTHESIS 节点的实际功能

#### 2.1 AI_SCENE_RENDER 节点执行器

**文件**: `runtime/component/novel-anime-generator/service/NovelAnimeWorkflowExecutionServices.xml`

```xml
<service verb="execute" noun="AiSceneRenderNode" authenticate="anonymous-all">
    <description>执行 AI 场景渲染节点</description>
    <in-parameters>
        <parameter name="nodeId" required="true"/>
        <parameter name="executionId" required="true"/>
        <parameter name="inputData" type="Map" required="true"/>
        <parameter name="config" type="Map" required="true"/>
    </in-parameters>
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="outputData" type="Map"/>
        <parameter name="error"/>
    </out-parameters>
</service>
```

**执行逻辑**:
1. 从 inputData 获取场景描述
2. 读取 config 中的风格和分辨率设置
3. 调用场景图像生成服务
4. 将生成的图像 URL 放入 outputData
5. 更新节点执行状态

#### 2.2 节点状态更新

修改 `AI_SCENE_RENDER` 和 `AI_VOICE_SYNTHESIS` 节点定义:
- 移除 `status: 'coming_soon'` 标记
- 添加实际的执行器服务引用

---

### Component 3: 端到端流程验证

**目标**: 确保从小说导入到动漫生成的完整流程可用

#### 3.1 测试场景设计

**场景 1: 简单角色生成流程**
```
INPUT_NOVEL → PROCESS_SCENE_ANALYSIS → AI_CHARACTER_GENERATE → OUTPUT_JSON
```

**场景 2: 完整动漫生成流程**
```
INPUT_NOVEL → PROCESS_SCENE_ANALYSIS → 
INPUT_CHARACTER → AI_SCENE_RENDER → 
OUTPUT_JSON
```

#### 3.2 集成测试脚本

**文件**: `.kiro/specs/09-01-novel-to-anime-completion/scripts/integration-test.sh`

测试内容:
1. 创建测试项目
2. 导入示例小说
3. 创建测试角色
4. 设计简单工作流
5. 执行工作流
6. 验证输出结果
7. 清理测试数据

---

### Component 4: 前端工作流执行增强

**目标**: 完善前端工作流执行引擎,支持图像生成节点

#### 4.1 节点执行器扩展

**文件**: `frontend/NovelAnimeDesktop/src/renderer/services/workflow/NodeExecutor.ts`

```typescript
class AiSceneRenderExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeOutput> {
    // 1. 准备输入数据
    const sceneDescription = context.getInput(node.id, 'sceneDescription')
    
    // 2. 调用后端 API
    const response = await api.post('/scene-image', {
      sceneId: sceneDescription.id,
      projectId: context.projectId,
      style: node.config.style,
      resolution: node.config.resolution
    })
    
    // 3. 处理响应
    if (response.success) {
      return {
        image: {
          url: response.imageUrl,
          assetId: response.assetId
        }
      }
    } else {
      throw new Error(response.error)
    }
  }
}
```

#### 4.2 进度监控增强

- 添加图像生成进度显示
- 实现图像预览功能
- 添加生成失败重试机制

---

## 数据模型

### 新增实体

#### ImageGenerationLog (图像生成日志)

```xml
<entity entity-name="ImageGenerationLog" package="novel.anime">
    <field name="logId" type="id" is-pk="true"/>
    <field name="projectId" type="id"/>
    <field name="characterId" type="id"/>
    <field name="sceneId" type="id"/>
    <field name="prompt" type="text-long"/>
    <field name="model" type="text-short"/>
    <field name="style" type="text-short"/>
    <field name="size" type="text-short"/>
    <field name="imageUrl" type="text-medium"/>
    <field name="assetId" type="id"/>
    <field name="status" type="text-short"/>
    <field name="error" type="text-long"/>
    <field name="createdDate" type="date-time"/>
    <field name="completedDate" type="date-time"/>
</entity>
```

### 修改实体

#### Character (角色)

添加字段:
- `generatedImageAssetId` - 生成的角色图像 Asset ID
- `imageGenerationStatus` - 图像生成状态 (pending/generating/completed/failed)

#### Scene (场景)

添加字段:
- `generatedImageAssetId` - 生成的场景图像 Asset ID
- `imageGenerationStatus` - 图像生成状态

---

## API 设计

### 新增 REST API 端点

#### 1. 生成角色图像

```
POST /api/character/{characterId}/generate-image
```

**Request Body**:
```json
{
  "projectId": "string",
  "style": "anime|realistic|cartoon",
  "pose": "standing|sitting|action"
}
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "assetId": "asset-id",
  "logId": "log-id"
}
```

#### 2. 生成场景图像

```
POST /api/scene/{sceneId}/generate-image
```

**Request Body**:
```json
{
  "projectId": "string",
  "includeCharacters": true,
  "style": "anime"
}
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "assetId": "asset-id",
  "logId": "log-id"
}
```

#### 3. 查询图像生成状态

```
GET /api/image-generation/{logId}/status
```

**Response**:
```json
{
  "status": "generating|completed|failed",
  "progress": 75,
  "imageUrl": "https://...",
  "error": null
}
```

---

## 配置管理

### AI 服务配置

**文件**: `runtime/component/moqui-mcp/data/McpSystemConfigData.xml`

添加配置项:
```xml
<!-- CogView 图像生成配置 -->
<mcp.system.McpSystemConfig 
    configId="AI_IMAGE_MODEL" 
    configKey="ai.image.model" 
    configValue="cogview-3" 
    configType="STRING" 
    category="AI"
    description="图像生成模型"/>

<mcp.system.McpSystemConfig 
    configId="AI_IMAGE_API_BASE" 
    configKey="ai.image.api.base" 
    configValue="https://open.bigmodel.cn/api/paas/v4" 
    configType="STRING" 
    category="AI"
    description="图像生成 API 基础 URL"/>

<mcp.system.McpSystemConfig 
    configId="AI_IMAGE_DEFAULT_STYLE" 
    configKey="ai.image.default.style" 
    configValue="anime" 
    configType="STRING" 
    category="AI"
    description="默认图像风格"/>
```

---

## 错误处理

### 错误类型

1. **API 调用失败**
   - 网络错误
   - API 密钥无效
   - 配额不足
   - 服务不可用

2. **图像生成失败**
   - Prompt 不合法
   - 内容审核失败
   - 生成超时

3. **存储失败**
   - 磁盘空间不足
   - 文件写入失败

### 错误处理策略

1. **重试机制**: 网络错误自动重试 3 次
2. **降级方案**: API 失败时使用占位图
3. **用户通知**: 清晰的错误提示和解决建议
4. **日志记录**: 完整的错误日志用于调试

---

## 性能优化

### 1. 异步处理

- 图像生成使用异步任务
- 前端轮询查询生成状态
- 避免阻塞用户界面

### 2. 缓存策略

- 缓存已生成的图像
- 相同 prompt 复用结果
- 实现本地图像缓存

### 3. 批量处理

- 支持批量生成角色图像
- 支持批量生成场景图像
- 优化 API 调用次数

---

## 安全性

### 1. API 密钥保护

- 使用环境变量或配置文件存储
- 不在日志中输出密钥
- 定期轮换密钥

### 2. 内容审核

- 检查生成的图像内容
- 过滤不合适的 prompt
- 记录审核日志

### 3. 访问控制

- 验证用户权限
- 限制 API 调用频率
- 防止滥用

---

## 测试策略

### 单元测试

- 测试图像生成服务
- 测试 prompt 构建逻辑
- 测试错误处理

### 集成测试

- 测试完整的图像生成流程
- 测试工作流节点执行
- 测试前后端集成

### 端到端测试

- 测试从小说到动漫的完整流程
- 测试用户操作流程
- 测试异常场景

---

## 实施计划

### Phase 1: 核心图像生成服务 (2-3天)

1. 实现 `McpImageGenerationServices.xml`
2. 实现 `NovelAnimeCharacterImageServices.xml`
3. 实现 `NovelAnimeSceneImageServices.xml`
4. 添加 REST API 端点
5. 单元测试

### Phase 2: 工作流节点实现 (1-2天)

1. 实现 `AI_SCENE_RENDER` 节点执行器
2. 更新节点定义
3. 前端节点执行器扩展
4. 集成测试

### Phase 3: 端到端验证 (1-2天)

1. 创建集成测试脚本
2. 测试完整流程
3. 修复发现的问题
4. 性能优化

### Phase 4: 文档和交付 (1天)

1. 更新用户文档
2. 更新 API 文档
3. 准备示例和教程
4. 发布说明

---

## 风险和缓解

### 高风险

1. **智谱 AI API 可用性**
   - 缓解: 实现降级方案,使用占位图
   - 缓解: 提前测试 API,确认配额

2. **图像生成质量**
   - 缓解: 优化 prompt 构建逻辑
   - 缓解: 提供手动调整选项

### 中风险

1. **性能问题**
   - 缓解: 使用异步处理
   - 缓解: 实现缓存机制

2. **成本控制**
   - 缓解: 限制 API 调用频率
   - 缓解: 实现本地缓存复用

---

## 验收标准

### 功能验收

- [ ] 可以为角色生成图像
- [ ] 可以为场景生成图像
- [ ] 工作流可以执行图像生成节点
- [ ] 生成的图像可以预览和下载
- [ ] 错误处理正常工作

### 性能验收

- [ ] 图像生成时间 < 30秒
- [ ] 界面不阻塞
- [ ] 内存使用合理

### 质量验收

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 端到端测试通过
- [ ] 代码审查通过

---

**文档版本**: v1.0  
**最后更新**: 2026-01-24  
**状态**: 设计完成  
**下一步**: 创建任务列表并开始实施

