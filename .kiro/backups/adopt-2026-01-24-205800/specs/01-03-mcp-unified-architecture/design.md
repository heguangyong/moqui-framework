# MCP统一架构与AI平台整合设计文档

## 架构概述

基于Model Context Protocol (MCP) 构建统一的AI服务架构，实现多模态AI能力的统一管理和调度，支持HiveMind、PopCommerce、MarbleERP三大平台的深度整合。

## 核心组件

### 组件1: MCP控制台
**功能**: 统一的AI服务管理和监控中心
**访问路径**: `/qapps/mcp`
**核心模块**:
- Dashboard - 系统状态监控和业务指标展示
- Config - AI服务配置和参数管理
- TelegramBot - Bot管理和多模态交互
- EconoWatch - 经济数据分析和趋势预测

### 组件2: AI服务网关
**功能**: 统一的AI服务调用和管理
**技术实现**: MarketplaceMcpService.java
**核心能力**:
- 智谱AI GLM-4/GLM-4V集成
- 多模态处理（语音、图像、文本）
- 服务降级和错误处理
- API调用监控和限流

### 组件3: 统一认证系统
**功能**: 纯JWT认证体系
**技术特性**:
- 无状态认证架构
- 跨组件统一验证
- 多源JWT检测（Header、Cookie）
- 自动刷新和过期管理

### 组件4: 统一API网关
**功能**: 标准化的REST API架构
**核心特性**:
- 统一响应格式
- 自动Swagger文档生成
- 标准化错误处理
- 跨组件兼容性保证

### 组件5: 现代化前端框架
**功能**: Vue3+Quasar2前端技术栈
**技术实现**: WebrootVue.qvt.js
**核心特性**:
- Vue3 Composition API
- Quasar2组件库集成
- FreeMarker模板兼容
- 响应式设计支持

## 技术架构设计

### MCP统一架构
```
┌─────────────────────────────────────┐
│    MCP控制台 (/qapps/mcp)           │
│ ┌─────────┐ ┌──────────┐ ┌─────────┐│
│ │Dashboard│ │ Config   │ │TeleBot  ││
│ └─────────┘ └──────────┘ └─────────┘│
│ ┌─────────────────────────────────── ││
│ │ EconoWatch (经济观察者系统)       ││
│ └─────────────────────────────────── ││
└─────────────┬───────────────────────┘
              │ AI Service Gateway
┌─────────────▼───────────────────────┐
│ Multi-Modal AI Processing           │
│ • 智谱AI GLM-4/GLM-4V              │
│ • 语音转文字 (zhipu speech)         │
│ • 图像识别 (glm-4v-plus)           │
│ • Telegram Bot集成                 │
└───┬─────────────┬───────────────────┘
    │             │
┌───▼───┐    ┌────▼────┐   ┌─────────▼─────────┐
│HiveMind│    │Marketplace│   │ Marble ERP        │
│项目管理 │    │智能撮合   │   │ 生产制造管理      │
└────────┘    └─────────┘   └───────────────────┘
```

### 数据模型设计

#### MCP配置实体
```xml
<entity entity-name="McpConfig" package="mcp">
    <field name="configId" type="id" is-pk="true"/>
    <field name="configCategory" type="text-short"/>
    <field name="configKey" type="text-medium"/>
    <field name="configValue" type="text-long"/>
    <field name="configType" type="text-short"/>
    <field name="isActive" type="text-indicator"/>
    <field name="lastUpdated" type="date-time"/>
</entity>
```

#### 统一身份实体
```xml
<entity entity-name="UnifiedParty" package="mcp.unified">
    <field name="unifiedPartyId" type="id" is-pk="true"/>
    <field name="partyType" type="text-short"/>
    <field name="primaryName" type="text-medium"/>
    <field name="contactInfo" type="text-long"/>
    <field name="preferences" type="text-long"/>
    <field name="crossReferences" type="text-long"/>
</entity>
```

#### AI处理记录实体
```xml
<entity entity-name="AiProcessingRecord" package="mcp.ai">
    <field name="recordId" type="id" is-pk="true"/>
    <field name="processingType" type="text-short"/>
    <field name="inputData" type="text-very-long"/>
    <field name="outputData" type="text-very-long"/>
    <field name="processingStatus" type="text-short"/>
    <field name="processingTime" type="number-decimal"/>
    <field name="createdDate" type="date-time"/>
</entity>
```

## AI服务集成设计

### 智谱AI GLM-4集成
**配置参数**:
```xml
<default-property name="marketplace.ai.provider" value="ZHIPU"/>
<default-property name="marketplace.ai.model" value="glm-4-plus"/>
<default-property name="marketplace.ai.api.base" value="https://open.bigmodel.cn/api/paas/v4"/>
<default-property name="zhipu.api.key" value="[API_KEY]"/>
```

**服务调用接口**:
```java
public class McpAiServices {
    // 语音转文字
    public String transcribeWithZhipuSpeech(String audioUrl) {
        // 调用智谱AI语音识别API
    }
    
    // 图像识别
    public String analyzeWithZhipuVision(String imageUrl) {
        // 调用GLM-4V图像识别API
    }
    
    // 文本生成
    public String generateWithGLM4(String prompt) {
        // 调用GLM-4文本生成API
    }
}
```

### 多模态处理流程
1. **输入接收**: 通过Telegram Bot或Web界面接收多模态输入
2. **类型识别**: 自动识别输入类型（语音、图像、文本）
3. **AI处理**: 调用相应的AI服务进行处理
4. **结果整合**: 将处理结果整合为结构化数据
5. **业务分发**: 根据业务逻辑分发到相应的业务模块

## 认证系统设计

### JWT认证配置
```xml
<!-- 纯JWT认证模式配置 -->
<default-property name="moqui.session.auth.disabled" value="true"/>
<default-property name="moqui.webapp.auth.mode" value="jwt_only"/>
<default-property name="moqui.jwt.force.mode" value="true"/>
<default-property name="moqui.jwt.webapp.auth.enabled" value="true"/>
<default-property name="moqui.jwt.secret" value="[JWT_SECRET]"/>
<default-property name="moqui.jwt.expire.hours" value="24"/>
```

### 认证验证流程
```xml
<!-- JWT验证逻辑 -->
<if condition="jwtToken">
    <script><![CDATA[
        boolean isValid = org.moqui.jwt.JwtUtil.validateToken(ec, jwtToken)
        if (isValid) {
            Map<String, Object> claims = org.moqui.jwt.JwtUtil.parseClaims(ec, jwtToken)
            String userId = claims.get("sub")
            if (userId) {
                ec.user.loginUser(userId, false)
            }
        }
    ]]></script>
</if>
```

## API设计规范

### 统一响应格式
```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "message": "操作成功",
  "errorCode": null,
  "errors": []
}
```

### MCP核心API
```
GET /rest/s1/mcp/dashboard/status - 获取系统状态
POST /rest/s1/mcp/config/update - 更新配置参数
POST /rest/s1/mcp/ai/process - AI处理请求
GET /rest/s1/mcp/ai/history - AI处理历史
```

### 跨平台集成API
```
POST /rest/s1/mcp/integration/hivemind/project - 创建HiveMind项目
POST /rest/s1/mcp/integration/commerce/order - 创建电商订单
POST /rest/s1/mcp/integration/erp/workorder - 创建生产工单
```

## 前端架构设计

### Vue3+Quasar2集成
```javascript
// Vue 3 + Quasar runtime配置
if (typeof Quasar !== 'undefined') {
    window.vuePendingPlugins = window.vuePendingPlugins || [];
    window.vuePendingPlugins.push({ 
        plugin: Quasar, 
        options: { config: window.quasarConfig || {} } 
    });
}

const app = Vue.createApp(appConfig);
(window.vuePendingPlugins || []).forEach(entry => 
    app.use(entry.plugin, entry.options)
);
window.vuePendingPlugins = [];
moqui.webrootVue = app.mount('#apps-root');
```

### 组件化设计
- **MCP Dashboard**: 系统监控和状态展示组件
- **Config Manager**: 配置管理和参数设置组件
- **AI Console**: AI服务调用和结果展示组件
- **Integration Panel**: 跨平台集成管理组件

## 数据同步设计

### 跨平台数据同步机制
```xml
<service verb="queue" noun="DataSyncTask" authenticate="false" allow-remote="true">
    <description>创建跨系统数据同步任务</description>
    <in-parameters>
        <parameter name="sourceSystem" required="true"/>
        <parameter name="targetSystems" type="List" required="true"/>
        <parameter name="entityType" required="true"/>
        <parameter name="sourceEntityId" required="true"/>
        <parameter name="syncOperation" required="true"/>
    </in-parameters>
</service>
```

### 事件驱动同步
1. **数据变更检测**: 监控各平台的数据变更事件
2. **同步任务创建**: 自动创建跨平台同步任务
3. **异步处理**: 通过队列机制异步处理同步任务
4. **状态跟踪**: 完整的同步状态跟踪和错误处理

## 技术决策

### 决策1: 采用MCP统一架构
**理由**: 
- 利用现有MCP基础设施，降低开发风险
- 统一的AI服务管理和调度能力
- 支持跨平台的业务整合需求

### 决策2: 实施纯JWT认证
**理由**:
- 无状态架构，支持微服务扩展
- 跨组件统一认证，简化集成复杂度
- 符合现代Web应用安全标准

### 决策3: 集成智谱AI GLM-4
**理由**:
- 强大的多模态处理能力
- 优秀的中文语义理解
- 稳定的API服务和合理成本

### 决策4: 升级Vue3+Quasar2
**理由**:
- 现代化的前端技术栈
- 更好的性能和开发体验
- 丰富的UI组件和响应式支持

---

**文档版本**: v1.0  
**最后更新**: 2025年1月14日  
**来源文档**: docs/02-架构设计-MCP统一架构与AI平台整合.md  
**审批状态**: 待审批