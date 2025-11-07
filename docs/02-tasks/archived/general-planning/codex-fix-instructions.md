# Codex修正任务指导书

## 🔧 需要立即修正的问题

基于Phase 1核验报告，发现以下关键问题需要Codex修正：

### 🔴 **修正任务1: REST API路由配置**

**问题描述**: 项目检测服务无法通过HTTP接口访问
**错误现象**: `curl -X POST "http://localhost:8080/rest/s1/marketplace/detect/ProjectType"` 返回404错误
**影响**: 外部系统和前端无法调用项目识别功能

#### 具体修正要求

**文件位置**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/service/marketplace.rest.xml`

**修正内容**: 在现有`<resource name="marketplace">`中添加以下配置：

```xml
<!-- 在现有resources的最后添加项目检测API -->
<resource name="project">
    <description>项目检测和管理API</description>

    <!-- 项目类型检测 -->
    <resource name="detect">
        <method type="post">
            <service name="marketplace.MarketplaceServices.detect#ProjectType"/>
        </method>
    </resource>

    <!-- 项目需求提取 -->
    <resource name="extract">
        <method type="post">
            <service name="marketplace.MarketplaceServices.extract#ProjectRequirements"/>
        </method>
    </resource>

    <!-- HiveMind项目创建 -->
    <resource name="hivemind">
        <method type="post">
            <service name="marketplace.MarketplaceServices.create#HiveMindProject"/>
        </method>
    </resource>
</resource>
```

**验证要求**: 修正后测试以下API调用：
```bash
# 测试项目类型检测
curl -X POST "http://localhost:8080/rest/s1/marketplace/project/detect" \
  -H "Content-Type: application/json" \
  -d '{"userDescription": "需要在会展中心搭建一个50平米的展台"}'

# 期望返回: {"isProject": true, "projectType": "EXHIBITION_SETUP", "confidence": 0.8}
```

---

### 🔴 **修正任务2: Dashboard内容显示问题**

**问题描述**: Dashboard页面中央区域显示空白
**Chrome MCP验证**: 页面框架正常但统计内容不显示
**可能原因**: 数据加载逻辑或服务调用问题

#### 具体排查和修正要求

**步骤1: 检查服务调用**
文件位置: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace/Dashboard.xml`

检查以下服务调用是否正确：
```xml
<!-- 检查这些服务调用是否存在错误 -->
<script><![CDATA[
// 确认以下服务调用格式正确
Map matchStatsResp = ec.service.sync().name("marketplace.MarketplaceServices.get#MatchingStats").call()
Map telegramStatsResp = ec.service.sync().name("marketplace.MarketplaceServices.get#TelegramStats").call()
]]></script>
```

**步骤2: 检查数据变量绑定**
确认统计数据变量是否正确设置：
```xml
<!-- 确认这些变量赋值正确 -->
stats = [
    totalSupplyListings: supplyCount ?: 0L,
    activeSupplyListings: activeSupplyCount ?: 0L,
    totalDemandListings: demandCount ?: 0L,
    activeDemandListings: activeDemandCount ?: 0L
]
```

**步骤3: 验证页面显示逻辑**
检查widgets部分的数据显示是否正确：
```xml
<!-- 确认label显示正确 -->
<label text="${stats.activeSupplyListings ?: 0}"
       style="font-size: 2rem; font-weight: bold; color: #1976d2;"/>
```

**修正要求**:
1. 确保所有服务调用使用正确的服务名称
2. 检查数据变量是否正确赋值
3. 验证页面显示逻辑无误
4. 添加必要的调试日志以便排查

---

### 🟡 **修正任务3: 服务依赖检查**

**问题描述**: Dashboard可能依赖尚未实现的统计服务
**排查要求**: 检查Dashboard调用的所有服务是否已实现

#### 需要确认的服务

检查以下服务是否存在于`MarketplaceServices.xml`中：

1. `marketplace.MarketplaceServices.get#MatchingStats`
2. `marketplace.MarketplaceServices.get#TelegramStats`
3. `marketplace.MarketplaceServices.get#SupplyStats`
4. `marketplace.MarketplaceServices.get#DemandStats`

**如果服务不存在，需要实现基础版本**:
```xml
<service verb="get" noun="MatchingStats" authenticate="false">
    <description>获取匹配统计信息</description>
    <out-parameters>
        <parameter name="totalMatches" type="Long"/>
        <parameter name="averageScore" type="BigDecimal"/>
        <parameter name="recentMatches" type="List"/>
    </out-parameters>
    <actions><script><![CDATA[
        // 基础实现 - 返回模拟数据
        totalMatches = 15L
        averageScore = new BigDecimal("0.75")
        recentMatches = []
    ]]></script></actions>
</service>
```

---

## 🔍 验证要求

### **修正完成后必须执行的验证**

#### 1. REST API验证
```bash
# 测试项目检测API
curl -X POST "http://localhost:8080/rest/s1/marketplace/project/detect" \
  -H "Content-Type: application/json" \
  -d '{"userDescription": "办公室装修改造项目"}'

# 预期返回成功JSON响应
```

#### 2. Dashboard页面验证
```bash
# 执行Chrome MCP验证
testing-tools/chrome_mcp_auth_proxy_v2.sh

# 检查截图是否显示完整内容
ls -la /tmp/moqui_verified.png
```

#### 3. 服务调用验证
```bash
# 测试统计服务
curl -s "http://localhost:8080/rest/s1/marketplace/stats" | head -10

# 确认返回正确的统计数据
```

---

## 📋 修正优先级

### 🔴 **P0 - 立即修正 (阻塞性问题)**
1. **REST API路由配置** - 影响所有API调用
2. **Dashboard服务依赖** - 影响主页面显示

### 🟡 **P1 - 尽快修正 (功能完整性)**
1. **统计服务实现** - 提升用户体验
2. **错误处理完善** - 提高系统稳定性

---

## 🎯 修正完成标准

### **验收标准**
- ✅ REST API调用返回正确JSON响应
- ✅ Dashboard页面显示完整统计数据
- ✅ Chrome MCP验证无空白区域
- ✅ 所有服务调用无404错误

### **提交要求**
1. 修正后提供Chrome MCP验证截图
2. 提供REST API测试结果
3. 说明具体修正了哪些问题
4. 确认所有验证标准通过

---

## 📞 技术支持

如果在修正过程中遇到问题，请提供：
1. 具体的错误信息和日志
2. 修正尝试的详细步骤
3. 当前的文件修改内容

我将提供进一步的技术指导和问题解决方案。

---

*修正指导版本: v1.0*
*创建时间: 2025-11-03*
*优先级: 立即执行*