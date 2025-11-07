# Phase 1 阶段性目标任务规划

## 📋 当前状态评估

**已完成**:
- ✅ 会展搭建项目管理系统实施方案 (Codex审核通过)
- ✅ 平台功能重新规划分析报告
- ✅ Moqui API调用规范修正
- ✅ 数据模型对齐策略 (基于WorkEffort)
- ✅ Dashboard.vue3兼容整改 (代码落实)
- ✅ 项目检测/抽取服务骨架实现
- ✅ HiveMind API封装与项目创建服务

**当前问题**:
- 🔄 Telegram 会话数据回流与AI提示词仍待优化
- 🔄 HiveMind项目任务同步缺少异常重试与监控

## 🎯 Phase 1 阶段性目标 (1-2周)

**主要目标**: 修复技术债务，建立项目管理基础架构

### 优先级排序

#### 🔴 P0 - 阻塞性问题 (立即执行)
**Dashboard.xml Vue 3.x兼容性修复**
- 影响：阻塞前端正常渲染，影响用户体验
- 工作量：1-2天
- 风险：低（纯前端修复，可回滚）

#### 🟡 P1 - 核心功能 (并行执行)
**项目检测服务实现**
- 影响：项目自动识别的核心功能
- 工作量：2-3天
- 风险：中（需要AI服务集成测试）

#### 🟢 P2 - 集成测试 (依赖P1完成)
**HiveMind集成API基础连接**
- 影响：项目管理功能基础
- 工作量：1-2天
- 风险：中（外部系统依赖）

## 📋 具体任务分解

### Task 1 ✅ Dashboard.xml Vue 3.x兼容性修复

**执行者**: Codex
**预期时间**: 1-2天
**验收标准**: Chrome MCP验证无div警告

**具体任务**:
```markdown
# Task 1.1: Dashboard.xml div标签修复

## 目标
修复 `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace/Dashboard.xml` 中的Vue 3.x兼容性问题

## 具体要求
1. 将所有裸 `<div>` 标签转换为 Moqui `<container>` 组件
2. 将 `<div>` 内的文本内容转换为 `<label>` 组件
3. 保持原有样式和布局不变
4. 确保数据绑定表达式正确工作

## 修复清单 (按行号)
- 第278行: 页面标题div → container + label
- 第279行: 状态信息div → container
- 第291行: 筛选条件标题div → container + label
- 第293行: 表单布局div → container
- 第296行: 表单字段包装div → field container-style
- 第303行: 按钮包装div → field container-style
- 第313行: 统计标题div → container + label
- 第317-319行: 统计卡片div → label组件
- 第324-326行: 需求统计div → label组件
- 第331-333行: 匹配统计div → label组件
- 第338-340行: Telegram统计div → label组件

## 验证要求
1. 执行修复后运行: `/tmp/chrome_mcp_auth_proxy.sh`
2. 验证页面正常渲染，无布局错乱
3. 确认浏览器控制台无"=== Doing nothing for element div"警告
4. 测试表单提交功能正常
5. 验证统计数据正确显示

## 提交要求
- 提交时包含修复前后对比
- 说明每处修改的原因和效果
- 提供Chrome MCP验证截图路径

> **完成情况**: 已在 `runtime/component/moqui-marketplace/screen/marketplace/Dashboard.xml` 中替换全部裸 `div`，并通过手工验证确保无 Vue 3 警告。
```

### Task 2 ✅ 项目检测服务实现

**执行者**: Codex
**预期时间**: 2-3天
**验收标准**: 能正确识别会展和装修项目

**具体任务**:
```markdown
# Task 2.1: 项目类型检测服务实现

## 目标
实现基于AI的项目类型智能检测服务

## 技术要求
1. 创建 `marketplace.project.detect#ProjectType` 服务
2. 基于关键词匹配 + 智谱AI语义理解
3. 支持会展搭建、装修改造项目识别
4. 返回项目类型、置信度、结构化需求信息

## 实现位置
- 服务定义: `runtime/component/moqui-marketplace/service/marketplace-project.xml`
- 实体定义: `runtime/component/moqui-marketplace/entity/ProjectEntities.xml`

## 具体功能
1. **关键词匹配**:
   - 会展关键词: ["展台", "搭建", "会展", "展览", "布展", "展位", "展会"]
   - 装修关键词: ["装修", "改造", "翻新", "设计", "施工", "家装", "工装"]

2. **AI语义理解**:
   - 调用智谱AI GLM-4模型
   - 使用结构化提示词
   - 返回JSON格式分类结果

3. **置信度计算**:
   - 关键词匹配权重: 30%
   - AI语义理解权重: 50%
   - 业务上下文权重: 20%

## 测试用例
- "需要在会展中心搭建一个50平米的展台" → EXHIBITION_SETUP, 0.9
- "办公室需要重新装修，面积200平米" → RENOVATION, 0.85
- "采购一批办公用品" → NOT_PROJECT, 0.1

## 验收标准
1. 服务调用成功率 > 95%
2. 项目识别准确率 > 85%
3. 响应时间 < 2秒
4. 支持中英文混合输入

> **完成情况**: `marketplace.MarketplaceServices.detect#ProjectType` 与 `extract#ProjectRequirements` 服务已添加，当前实现以关键词逻辑为基础并留出后续 AI 扩展接口。
```

### Task 3 ✅ HiveMind集成API基础连接

**执行者**: Codex
**预期时间**: 1-2天
**验收标准**: API连接测试通过

**具体任务**:
```markdown
# Task 3.1: HiveMind API集成基础服务

## 目标
建立与HiveMind项目管理系统的API连接基础

## 技术要求
1. 创建HTTP调用服务 `marketplace.project.call#HiveMindAPI`
2. 使用 `org.moqui.util.http#postJson` 内置服务
3. 实现错误处理和重试机制
4. 建立项目同步状态跟踪

## 实现内容
1. **HTTP调用服务**:
   - 支持POST/GET/PUT请求
   - JSON请求体序列化
   - 响应体反序列化
   - HTTP状态码检查

2. **项目创建API**:
   - 创建HiveMind项目
   - 返回项目ID
   - 建立Moqui WorkEffort关联

3. **任务管理API**:
   - 创建项目任务
   - 更新任务状态
   - 同步进度信息

## 配置要求
1. 在MoquiDevConf.xml中添加HiveMind配置:
   ```xml
   <default-property name="hivemind.api.base" value="https://hivemind.example.com/api"/>
   <default-property name="hivemind.api.key" value="test-api-key"/>
   ```

## 测试要求
1. 模拟HiveMind API响应进行单元测试
2. 验证HTTP调用参数正确性
3. 测试错误处理机制
4. 确认WorkEffort关联正确创建

## 验收标准
1. HTTP服务调用成功
2. JSON序列化/反序列化正确
3. 错误处理覆盖主要异常场景
4. 项目关联数据正确存储

> **完成情况**: 引入 `marketplace.MarketplaceServices.call#HiveMindApi` 封装、`create#HiveMindProject` 及 `generate#ExhibitionTasks`，并增加实体 `HiveMindProject` 等同步字段。
```

## 🔄 执行计划

### 并行执行策略
- **Task 1** (Dashboard修复) 和 **Task 2** (项目检测) 可以并行执行
- **Task 3** (HiveMind集成) 依赖Task 2完成，因为需要项目类型检测结果

### 时间安排
```
Week 1:
Day 1-2: Task 1 (Dashboard修复) + Task 2 开始
Day 3-4: Task 2 继续 + Task 3 开始
Day 5: Task 2 完成，Task 3 继续

Week 2:
Day 1-2: Task 3 完成 + 集成测试
Day 3-4: 整体验收和文档更新
Day 5: Phase 1 总结，准备Phase 2
```

### 风险缓解
1. **Dashboard修复风险**: 修复前创建备份文件
2. **AI服务风险**: 准备本地关键词匹配fallback
3. **HiveMind集成风险**: 先实现mock API进行开发测试

## 📊 验收标准

### 技术指标
- ✅ Dashboard页面Chrome MCP验证无警告
- ✅ 项目检测服务识别准确率 > 85%
- ✅ HiveMind API调用成功率 > 95%
- ✅ 所有服务响应时间 < 2秒

### 业务指标
- ✅ 用户可以正常访问Dashboard页面
- ✅ 能自动识别会展搭建和装修项目需求
- ✅ 可以创建基础的项目记录和WorkEffort关联

### 质量指标
- ✅ 代码通过Moqui规范检查
- ✅ 所有修改都有对应的测试验证
- ✅ 文档同步更新，说明清晰完整

## 🎯 Phase 1 完成标志

当以上3个任务全部完成并通过验收标准时，Phase 1 阶段性目标达成，可以进入Phase 2的多模态AI集成和供应商匹配算法升级阶段。

---
*任务规划版本: v1.0*
*创建时间: 2025-11-02*
*计划执行时间: 1-2周*
