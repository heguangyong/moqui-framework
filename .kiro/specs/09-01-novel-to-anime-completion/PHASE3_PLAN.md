# Phase 3 执行计划 - 端到端验证和测试

**Spec**: 09-01-novel-to-anime-completion  
**阶段**: Phase 3 - 端到端验证和测试  
**状态**: 🔥 执行中  
**开始时间**: 2026-01-24  
**Ultrawork承诺**: 💪 不成功不停止!

---

## 🎯 Phase 3 目标

验证 GLM-4 图像生成功能的完整实现,确保从 API 调用到图像存储的整个流程正常工作。

---

## 📋 执行策略

### 策略 1: 无 API Key 的验证 (当前可执行)

即使没有真实的 GLM-4 API Key,我们仍然可以验证:

1. ✅ **服务定义正确性**
   - 检查 XML 服务定义语法
   - 验证服务接口定义
   - 确认参数和返回值定义

2. ✅ **REST API 端点可用性**
   - 测试端点是否注册
   - 验证路由配置
   - 检查认证机制

3. ✅ **数据库实体更新**
   - 验证新字段是否创建
   - 检查索引是否正确
   - 确认关联关系

4. ✅ **基础流程测试**
   - 登录认证
   - 项目创建
   - 角色创建
   - API 调用(会因无 API Key 失败,但可验证流程)

### 策略 2: 配置 API Key 后的完整验证

一旦配置了 API Key:

1. ⏳ **图像生成测试**
   - 角色图像生成
   - 场景图像生成
   - 批量生成测试

2. ⏳ **工作流集成测试**
   - AI_SCENE_RENDER 节点执行
   - 工作流完整流程
   - 节点状态更新

3. ⏳ **前端集成测试**
   - 前端调用 API
   - 图像预览显示
   - 工作流编辑器

---

## 🔧 Phase 3.1: 服务验证 (无需 API Key)

### 任务 3.1.1: 验证服务文件语法 ✅

**目标**: 确保所有新创建的服务文件 XML 语法正确

**执行**:
```bash
# 检查 XML 语法
xmllint --noout runtime/component/moqui-mcp/service/mcp/McpImageGenerationServices.xml
xmllint --noout runtime/component/novel-anime-generator/service/NovelAnimeCharacterImageServices.xml
xmllint --noout runtime/component/novel-anime-generator/service/NovelAnimeSceneImageServices.xml
xmllint --noout runtime/component/novel-anime-generator/service/NovelAnimeWorkflowExecutionServices.xml
```

**验收标准**:
- [ ] 所有 XML 文件语法正确
- [ ] 没有语法错误或警告

---

### 任务 3.1.2: 验证 Moqui 服务加载 ✅

**目标**: 确认 Moqui 已加载新服务

**执行**:
```bash
# 检查 Moqui 日志
grep -i "service.*loaded\|service.*registered" runtime/log/moqui.log | tail -50

# 或者通过 API 测试服务是否可调用
curl -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"moqui"}'
```

**验收标准**:
- [ ] Moqui 启动无错误
- [ ] 服务定义被加载
- [ ] 认证服务可用

---

### 任务 3.1.3: 验证 REST API 端点 ✅

**目标**: 确认新的 REST API 端点已注册

**执行**:
```bash
# 测试角色图像生成端点(会因无 API Key 失败,但可验证端点存在)
TOKEN="<从登录获取>"

curl -X POST http://localhost:8080/rest/s1/novel-anime/character/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "characterId": "test",
    "projectId": "test",
    "style": "anime"
  }'
```

**预期结果**:
- 端点存在(不是 404)
- 返回错误信息(因为无 API Key 或无效 ID)
- 错误信息清晰明确

**验收标准**:
- [ ] 角色图像生成端点可访问
- [ ] 场景图像生成端点可访问
- [ ] 状态查询端点可访问
- [ ] 错误信息清晰

---

### 任务 3.1.4: 验证数据库实体更新 ✅

**目标**: 确认新字段已添加到数据库

**执行**:
```bash
# 通过 Moqui 控制台或 H2 控制台检查
# 或者通过创建角色并查询来验证

# 创建角色
curl -X POST http://localhost:8080/rest/s1/novel-anime/characters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "<project_id>",
    "name": "测试角色",
    "description": "测试描述"
  }'

# 查询角色(应该包含新字段)
curl -X GET "http://localhost:8080/rest/s1/novel-anime/characters?projectId=<project_id>" \
  -H "Authorization: Bearer $TOKEN"
```

**验收标准**:
- [ ] Character 实体包含 generatedImageAssetId 字段
- [ ] Character 实体包含 imageGenerationStatus 字段
- [ ] Scene 实体包含相应字段
- [ ] 字段默认值正确

---

### 任务 3.1.5: 基础流程测试 ✅

**目标**: 测试从登录到 API 调用的完整流程

**执行**:
```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
./test-image-generation.sh
```

**预期结果**:
- ✅ 登录成功
- ✅ 项目创建成功
- ✅ 角色创建成功
- ❌ 图像生成失败(因为无 API Key)
- ✅ 错误信息清晰: "AI API Key not configured"

**验收标准**:
- [ ] 基础流程正常
- [ ] 错误处理正确
- [ ] 错误信息有帮助

---

## 🔑 Phase 3.2: API Key 配置

### 任务 3.2.1: 准备 API Key 配置脚本

**目标**: 创建便捷的 API Key 配置脚本

**执行**: 创建 `configure-api-key.sh`

**验收标准**:
- [ ] 脚本可以插入 API Key 到数据库
- [ ] 脚本可以验证配置
- [ ] 脚本有清晰的使用说明

---

### 任务 3.2.2: 配置 API Key

**目标**: 将真实的 GLM-4 API Key 配置到系统

**前置条件**:
- 用户提供 GLM-4 API Key
- 或者使用测试 API Key

**执行**:
```bash
# 方法 1: 通过脚本配置
./configure-api-key.sh "your-api-key-here"

# 方法 2: 手动 SQL 插入
# 见 API_KEY_SETUP.md
```

**验收标准**:
- [ ] API Key 已插入数据库
- [ ] 配置可以被服务读取
- [ ] 健康检查通过

---

### 任务 3.2.3: 验证 API 连接

**目标**: 确认可以连接到 GLM-4 API

**执行**:
```bash
# 调用健康检查服务
curl -X GET http://localhost:8080/rest/s1/mcp/image-generation/health \
  -H "Authorization: Bearer $TOKEN"
```

**预期结果**:
```json
{
  "status": "healthy",
  "model": "cogview-3",
  "apiAvailable": true
}
```

**验收标准**:
- [ ] 健康检查返回 healthy
- [ ] API 可访问
- [ ] 模型配置正确

---

## 🖼️ Phase 3.3: 图像生成测试

### 任务 3.3.1: 角色图像生成测试

**目标**: 测试单个角色的图像生成

**执行**:
```bash
# 运行测试脚本
./test-image-generation.sh
```

**预期结果**:
- ✅ 图像生成成功
- ✅ 返回 Asset ID
- ✅ 返回图像 URL
- ✅ 图像文件已下载到本地
- ✅ 角色记录已更新

**验收标准**:
- [ ] 图像生成成功率 > 90%
- [ ] 生成时间 < 60 秒
- [ ] 图像质量符合预期
- [ ] 文件正确存储

---

### 任务 3.3.2: 场景图像生成测试

**目标**: 测试场景图像生成

**执行**: 创建并运行场景图像生成测试

**验收标准**:
- [ ] 场景图像生成成功
- [ ] 可以包含角色
- [ ] Prompt 构建正确
- [ ] 图像符合场景描述

---

### 任务 3.3.3: 批量生成测试

**目标**: 测试批量生成功能

**执行**: 创建多个角色/场景并批量生成

**验收标准**:
- [ ] 批量生成成功
- [ ] 失败处理正确
- [ ] 返回统计信息准确

---

### 任务 3.3.4: 错误场景测试

**目标**: 测试各种错误场景

**测试场景**:
1. 无效的 prompt
2. 网络超时
3. API 限流
4. 无效的参数

**验收标准**:
- [ ] 错误处理正确
- [ ] 重试机制工作
- [ ] 错误信息清晰

---

## 🔄 Phase 3.4: 工作流集成测试

### 任务 3.4.1: 创建测试工作流

**目标**: 创建包含 AI_SCENE_RENDER 节点的工作流

**执行**:
```bash
# 通过 API 创建工作流
curl -X POST http://localhost:8080/rest/s1/novel-anime/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "<project_id>",
    "name": "图像生成测试工作流",
    "nodes": [
      {
        "type": "AI_SCENE_RENDER",
        "config": {
          "style": "anime",
          "resolution": "1024x1024"
        }
      }
    ]
  }'
```

**验收标准**:
- [ ] 工作流创建成功
- [ ] AI_SCENE_RENDER 节点可用
- [ ] 节点配置正确

---

### 任务 3.4.2: 执行工作流

**目标**: 执行包含图像生成节点的工作流

**执行**: 通过 API 触发工作流执行

**验收标准**:
- [ ] 工作流执行成功
- [ ] 节点按顺序执行
- [ ] 图像生成节点输出正确
- [ ] 状态更新正确

---

### 任务 3.4.3: 验证节点输出

**目标**: 确认节点输出数据正确

**检查项**:
- 输出包含 imageUrl
- 输出包含 localPath
- 输出包含 assetId
- 输出可以被下一个节点使用

**验收标准**:
- [ ] 输出格式正确
- [ ] 数据完整
- [ ] 可以传递给下游节点

---

## 🖥️ Phase 3.5: 前端集成测试

### 任务 3.5.1: 前端 API 调用测试

**目标**: 测试前端调用图像生成 API

**执行**: 在前端应用中测试 API 调用

**验收标准**:
- [ ] 前端可以调用 API
- [ ] 认证正常工作
- [ ] 响应数据正确解析

---

### 任务 3.5.2: 图像预览功能测试

**目标**: 测试前端显示生成的图像

**执行**: 在前端显示生成的角色/场景图像

**验收标准**:
- [ ] 图像可以正确显示
- [ ] 加载状态显示
- [ ] 错误处理正确

---

### 任务 3.5.3: 工作流编辑器测试

**目标**: 测试工作流编辑器中的图像生成节点

**执行**: 在工作流编辑器中添加和配置 AI_SCENE_RENDER 节点

**验收标准**:
- [ ] 节点可以添加
- [ ] 节点配置界面正常
- [ ] 节点可以执行
- [ ] 执行结果可以查看

---

## 📊 Phase 3 验收标准

### 功能完整性
- [ ] 所有服务文件语法正确
- [ ] Moqui 成功加载所有服务
- [ ] REST API 端点全部可用
- [ ] 数据库实体更新正确
- [ ] API Key 配置成功
- [ ] 图像生成功能正常
- [ ] 工作流集成正常
- [ ] 前端集成正常

### 性能指标
- [ ] 图像生成时间 < 60 秒
- [ ] API 响应时间 < 200ms (不含图像生成)
- [ ] 成功率 > 90%

### 质量指标
- [ ] 错误处理完善
- [ ] 日志记录清晰
- [ ] 用户体验流畅

---

## 🔥 当前执行状态

### 已完成 ✅
- 无

### 进行中 🔄
- 任务 3.1.1: 验证服务文件语法

### 待执行 ⏳
- 任务 3.1.2 - 3.1.5
- 任务 3.2.1 - 3.2.3
- 任务 3.3.1 - 3.3.4
- 任务 3.4.1 - 3.4.3
- 任务 3.5.1 - 3.5.3

---

## 📝 执行日志

### 2026-01-24 23:30
- 创建 Phase 3 执行计划
- 开始任务 3.1.1: 验证服务文件语法

---

**文档版本**: v1.0  
**创建时间**: 2026-01-24  
**状态**: 🔥 执行中  
**Ultrawork承诺**: 💪 不成功不停止!

