# 下一阶段开发规划 - 基于Telegram驱动的4分类智能平台

## 🎯 当前状态总结

### ✅ 已完成基础工作
1. **平台品牌统一**: 全面更名为"智能推荐"，所有UI菜单统一
2. **纯JWT认证系统**: 完全符合"只能用JWT"要求
3. **多模态AI集成**: 智谱AI GLM-4/GLM-4V语音图像识别完整实现
4. **Telegram Bot基础**: 多模态消息处理框架已建立
5. **Chrome MCP验证**: 前端修改验证协议已建立并验证通过
6. **TelegramServices.groovy**: ✅ **已完成4分类菜单系统实现**

### 🔄 架构定位明确
- **核心理念**: Telegram驱动的智能沟通分类平台
- **主要功能**: 消息匹配和业务路由，而非简单供需撮合
- **技术架构**: moqui-marketplace + moqui-mcp 双组件协作
- **4大业务分类**: 📊智能供需匹配、🏗️蜂巢项目管理、🛒流行电商、💼大理石ERP  
  （蜂巢项目管理作为独立的项目协作域，既可承接匹配后的项目，也支持用户单独创建、跟踪自身项目，彼此互不依赖）

---

## 🎨 Phase 0: 智能推荐组件UI重新设计 🚨 **最高优先级**

### ⚠️ **当前问题分析**

**UI设计混乱现状**:
- ❌ **8个分散页面**: Dashboard、InfoManagement、Supply、Demand、Matching、Chat、TelegramAdmin、TestDataInit
- ❌ **功能重复**: Supply/Demand与InfoManagement功能重叠
- ❌ **菜单混乱**: 所有页面都显示"智能推荐"，用户无法区分
- ❌ **架构不清**: Tab导航与Telegram驱动理念不符
- ❌ **用户困惑**: 6个Tab页面但核心功能只有1-2个

### 🎯 **重新设计目标**

**核心理念转变**:
- **从**: 传统Web界面 → **到**: Telegram驱动的轻量化Web控制台
- **从**: 多页面复杂导航 → **到**: 单一控制台 + API服务
- **从**: 功能分散 → **到**: 集中管理和监控

### 📋 **Task T-UI-1: 组件结构精简重组** 🎯 **最高优先级**

**目标**: 将8个页面精简为2个核心页面
**执行时间**: 立即开始，2天完成

#### **新架构设计**:

```
智能推荐组件 (marketplace)
├── 📊 控制台 (Dashboard) - 统一监控中心
│   ├── Telegram Bot状态监控
│   ├── 4分类业务数据统计
│   ├── 智能匹配实时监控
│   └── 系统健康状况
└── ⚙️ 系统配置 (SystemConfig) - 开发管理中心
    ├── Telegram Bot配置
    ├── AI模型参数调整
    ├── 测试数据管理
    └── 服务状态管理
```

#### **删除/合并策略**:

| 当前页面 | 处理方式 | 原因 |
|---------|----------|------|
| **Dashboard** | ✅ **保留并增强** | 核心监控中心 |
| **InfoManagement** | ❌ **删除** | 功能重复，Telegram已替代 |
| **Supply** | ❌ **删除** | Telegram Bot已替代 |
| **Demand** | ❌ **删除** | Telegram Bot已替代 |
| **Matching** | 🔄 **合并到Dashboard** | 作为监控组件 |
| **Chat** | 🔄 **合并到Dashboard** | 作为测试工具 |
| **TelegramAdmin** | 🔄 **合并到SystemConfig** | 管理功能集中 |
| **TestDataInit** | 🔄 **合并到SystemConfig** | 开发工具集中 |

### **具体实现方案**:

#### **Step 1: 更新marketplace.xml导航结构**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-3.xsd"
        default-menu-title="智能推荐" default-menu-index="1"
        include-child-content="true" require-authentication="false"
        menu-image="fa fa-chart-line" menu-image-type="icon">

    <subscreens default-item="Dashboard">
        <!-- 核心功能：控制台 -->
        <subscreens-item name="Dashboard" menu-title="控制台"
                         location="component://moqui-marketplace/screen/marketplace/Dashboard.xml"/>

        <!-- 管理功能：系统配置 (仅开发/管理员可见) -->
        <subscreens-item name="SystemConfig" menu-title="系统配置" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/SystemConfig.xml"/>

        <!-- 隐藏的遗留页面 (保留但不显示) -->
        <subscreens-item name="InfoManagement" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/InfoManagement.xml"/>
        <subscreens-item name="Supply" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/Supply.xml"/>
        <subscreens-item name="Demand" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/Demand.xml"/>
        <subscreens-item name="Matching" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/Matching.xml"/>
        <subscreens-item name="Chat" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/Chat.xml"/>
        <subscreens-item name="TelegramAdmin" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/TelegramAdmin.xml"/>
        <subscreens-item name="TestDataInit" menu-include="false"
                         location="component://moqui-marketplace/screen/marketplace/TestDataInit.xml"/>
    </subscreens>

    <widgets>
        <subscreens-panel id="marketplace-panel" type="tab"/>
    </widgets>
</screen>
```

#### **Step 2: 重新设计Dashboard.xml - 统一控制台**

重新设计为轻量化监控中心，移除复杂的HTML结构，使用简洁的Moqui容器组件。

#### **Step 3: 创建SystemConfig.xml - 系统配置中心**

新增配置管理页面，集中所有开发和管理工具。

---

## 🚀 Phase 1: Telegram Bot 4分类菜单系统 ✅ **已完成**

### **Task T-BOT-1: 4分类主菜单系统** ✅ **完成**

**现有实现状态**:
- ✅ 4分类主菜单已实现 (`createMainMenuKeyboard()`)
- ✅ 智能供需匹配子菜单已实现 (`createSupplyDemandSubMenu()`)
- ✅ callback_query事件处理已实现 (`handleCallbackQuery()`)
- ✅ 消息编辑功能已实现 (`editTelegramMessage()`)
- ✅ 智能识别模式已集成 (`handleSmartClassification()`)
- ✅ 会话状态管理已实现 (`ensureDialogSession()`, `loadSessionContext()`)

**验证结果**:
根据代码审核，所有核心功能都已正确实现，包括菜单导航、回调处理、智能分类等。

### **Task T-BOT-2: 智能识别模式实现** ✅ **完成**

**现有实现状态**:
- ✅ 智能分类逻辑已实现，调用`mcp.routing.classify#UserIntent`服务
- ✅ 置信度计算和显示已实现
- ✅ 4大业务类型自动路由已实现
- ✅ 会话状态smartMode管理已实现

---

## ⚙️ Phase 2: moqui-mcp智能路由引擎 (立即启动)

### **Task T-MCP-1: 创建业务意图识别服务** 🎯 **立即执行**

**目标**: 创建完整的业务意图分类服务
**状态**: 代码中已调用`mcp.routing.classify#UserIntent`，但服务定义可能不存在
**执行时间**: 立即开始，1天完成

#### **具体实现要求**:

**新文件**: `runtime/component/moqui-mcp/service/McpRoutingServices.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/service-definition-3.xsd">

    <!-- 用户意图分类服务 -->
    <service verb="classify" noun="UserIntent" authenticate="false">
        <description>基于用户消息内容进行业务意图分类</description>
        <in-parameters>
            <parameter name="userMessage" required="true"/>
            <parameter name="messageType" default="text"/>
            <parameter name="chatId"/>
        </in-parameters>
        <out-parameters>
            <parameter name="businessCategory"/>
            <parameter name="specificFunction"/>
            <parameter name="confidence" type="BigDecimal"/>
            <parameter name="extractedParameters" type="Map"/>
        </out-parameters>
        <actions><script><![CDATA[
            import java.math.BigDecimal

            // 1. 关键词匹配分析
            String message = (userMessage ?: "").toLowerCase()

            // 供需匹配关键词
            List<String> supplyKeywords = ["供应", "需求", "采购", "销售", "批发", "零售", "商品", "产品", "库存", "价格", "买", "卖"]
            List<String> projectKeywords = ["项目", "任务", "团队", "计划", "进度", "里程碑", "协作", "管理", "搭建", "装修", "工程", "施工"]
            List<String> ecommerceKeywords = ["店铺", "商城", "订单", "物流", "支付", "客服", "营销", "促销", "电商", "网店"]
            List<String> erpKeywords = ["财务", "人事", "工资", "报表", "审批", "流程", "资源", "成本", "ERP", "企业管理"]

            // 计算匹配度
            int supplyCount = supplyKeywords.count { message.contains(it) }
            int projectCount = projectKeywords.count { message.contains(it) }
            int ecommerceCount = ecommerceKeywords.count { message.contains(it) }
            int erpCount = erpKeywords.count { message.contains(it) }

            // 2. 分类决策
            String category = "SUPPLY_DEMAND_MATCHING" // 默认
            BigDecimal confidence = new BigDecimal("0.5")

            if (supplyCount > 0) {
                category = "SUPPLY_DEMAND_MATCHING"
                confidence = new BigDecimal(Math.min(supplyCount * 0.3 + 0.4, 0.95))
            } else if (projectCount > 0) {
                category = "HIVEMIND_PROJECT"
                confidence = new BigDecimal(Math.min(projectCount * 0.3 + 0.4, 0.95))
            } else if (ecommerceCount > 0) {
                category = "ECOMMERCE"
                confidence = new BigDecimal(Math.min(ecommerceCount * 0.3 + 0.4, 0.95))
            } else if (erpCount > 0) {
                category = "ERP"
                confidence = new BigDecimal(Math.min(erpCount * 0.3 + 0.4, 0.95))
            }

            // 3. 具体功能识别
            String specificFunction = ""
            if (category == "SUPPLY_DEMAND_MATCHING") {
                if (message.contains("发布") || message.contains("供应")) {
                    specificFunction = "PUBLISH_SUPPLY"
                } else if (message.contains("采购") || message.contains("需求")) {
                    specificFunction = "PUBLISH_DEMAND"
                } else if (message.contains("匹配") || message.contains("寻找")) {
                    specificFunction = "FIND_MATCHES"
                } else {
                    specificFunction = "GENERAL_INQUIRY"
                }
            }

            // 4. 参数提取
            Map<String, Object> parameters = [
                originalMessage: userMessage,
                detectedKeywords: message.findAll(/\\p{IsHan}+/),
                messageLength: userMessage.length(),
                hasNumbers: message.matches(/.*\\d+.*/),
                hasPrice: message.matches(/.*(价格|元|钱|费用).*/),
                hasLocation: message.matches(/.*(地区|城市|省|市|区).*/),
                timestamp: ec.user.nowTimestamp
            ]

            businessCategory = category
            specificFunction = specificFunction
            confidence = confidence
            extractedParameters = parameters

            // 记录分类日志
            ec.logger.info("MCP路由分类: ${category} (置信度: ${confidence}) - 消息: ${userMessage}")
        ]]></script></actions>
    </service>

    <!-- 路由处理服务 -->
    <service verb="route" noun="ToBusinessModule" authenticate="false">
        <description>根据分类结果路由到具体业务模块</description>
        <in-parameters>
            <parameter name="businessCategory" required="true"/>
            <parameter name="specificFunction"/>
            <parameter name="userMessage"/>
            <parameter name="chatId"/>
            <parameter name="extractedParameters" type="Map"/>
        </in-parameters>
        <out-parameters>
            <parameter name="routingResult" type="Map"/>
            <parameter name="nextAction"/>
            <parameter name="responseMessage"/>
        </out-parameters>
        <actions><script><![CDATA[
            Map<String, Object> result = [:]

            switch(businessCategory) {
                case "SUPPLY_DEMAND_MATCHING":
                    // 调用marketplace服务
                    if (specificFunction == "PUBLISH_SUPPLY") {
                        result = ec.service.sync()
                            .name("marketplace.MarketplaceServices.create#Listing")
                            .parameters([type: "SUPPLY", description: userMessage])
                            .call()
                        nextAction = "SHOW_SUPPLY_FORM"
                        responseMessage = "📢 为您创建供应信息，请补充详细信息..."
                    } else if (specificFunction == "FIND_MATCHES") {
                        result = ec.service.sync()
                            .name("marketplace.MarketplaceServices.search#Listings")
                            .parameters([searchTerm: userMessage])
                            .call()
                        nextAction = "SHOW_MATCH_RESULTS"
                        responseMessage = "🔍 为您找到 ${result.resultCount ?: 0} 个匹配结果..."
                    } else {
                        // 通用查询
                        nextAction = "SHOW_MAIN_MENU"
                        responseMessage = "📊 智能供需匹配已准备就绪，请选择具体操作..."
                    }
                    break

                case "HIVEMIND_PROJECT":
                    nextAction = "REDIRECT_TO_HIVEMIND"
                    responseMessage = "🏗️ 正在为您跳转到蜂巢项目管理..."
                    result = [
                        redirectUrl: "https://hivemind.example.com",
                        projectContext: extractedParameters
                    ]
                    break

                case "ECOMMERCE":
                    nextAction = "REDIRECT_TO_ECOMMERCE"
                    responseMessage = "🛒 流行电商功能开发中，即将为您提供服务..."
                    result = [
                        redirectUrl: "https://popcommerce.example.com",
                        ecommerceContext: extractedParameters
                    ]
                    break

                case "ERP":
                    nextAction = "REDIRECT_TO_ERP"
                    responseMessage = "💼 大理石ERP功能开发中，即将为您提供服务..."
                    result = [
                        redirectUrl: "https://marbleerp.example.com",
                        erpContext: extractedParameters
                    ]
                    break
            }

            routingResult = result
        ]]></script></actions>
    </service>
</services>
```

### **Task T-MCP-2: 更新组件配置** 🎯 **立即执行**

**目标**: 确保新服务被正确加载
**文件**: `runtime/component/moqui-mcp/component.xml`

**检查并添加服务包含**:
```xml
<service-include location="component://moqui-mcp/service/McpRoutingServices.xml"/>
```

---

## 🎯 Phase 3: 智能供需匹配完善 (优化现有优势)

### **Task T-MATCH-1: 供需匹配算法优化**

**目标**: 完善现有匹配算法，支持项目需求匹配
**执行时间**: Phase 2完成后，2-3天

**最新进展（2025-11-05）**
- ✅ `SmartMatchingEngine` 增加 ProjectAffinity 评分维度，综合面积、预算、工期、地点、风格、材质等特征，匹配权重重新校准为 0.30/0.20/0.15/0.10/0.10/0.15。
- ✅ 新增 `marketplace.listing.ListingInsight` 实体与 `store#ListingInsight` 服务，供多模态识别和项目提取结果长期沉淀，并在匹配时自动加载。
- ✅ `MatchingServices.calculate#MatchScoreDetailed` 输出 `projectAffinity` 并复用引擎生成的项目说明文案，前端可直接展示。
- 🔄 待补充：结合真实展搭/装修/工程案例扩充样本数据，进一步校准各特征阈值与推荐话术。

### **Task T-MATCH-2: 多模态内容处理增强**

**目标**: 增强语音图像处理的项目识别能力
**执行时间**: 与T-MATCH-1并行，2-3天

**最新进展（2025-11-05）**
- ✅ `marketplace.MarketplaceServices.create#Listing` 支持 `speechTranscript`、`imageInsights`、`mediaInsights`、`projectMetadata` 等输入，统一落库并自动回填项目需求。
- ✅ `detect#ProjectType` / `extract#ProjectRequirements` 接入语音文本与图像标签，扩展工程关键词、预算/面积/工期解析、地理定位与风格材质抽取。
- ✅ Telegram 多模态回调会将识别内容写入 ListingInsight，匹配页面的"项目模式"可直接利用。
- 🔄 待处理：对接真实语音/图像 API 的高置信度标签映射，补充回传至 HiveMind 的字段映射校验。

---

## 📋 Phase 4: HiveMind集成准备 (外部模块路由)

### **Task T-HIVE-1: HiveMind API调研**

**目标**: 调研和设计HiveMind集成方案
**执行时间**: Phase 3完成后，3-5天

**最新进展（2025-11-05）**
- ✅ 完成 `docs/03-tasks/phase-2-hivemind-integration/hivemind-api-research.md`，梳理项目/任务/沟通三大类接口、数据映射及配置项。
- ✅ 归纳现有实现与缺口（call#HiveMindApi、create#HiveMindProject 等），明确需新增的配置化、重试、Webhook 支持。
- 🔄 待办：落实配置管理（Base URL、Token、重试策略）与 `HiveMindProject` 扩展字段，作为 T-HIVE-2 的前置工作。

### **Task T-HIVE-2: 项目模式路由实现**

**目标**: 实现Telegram到HiveMind的完整路由
**执行时间**: T-HIVE-1完成后，2-3天

**最新进展（2025-11-05）**
- ✅ `marketplace.MarketplaceServices.call#HiveMindApi` 已支持 baseUrl/token 配置、重试、全HTTP方法与请求/响应日志。
- ✅ `create#HiveMindProject`/`generate#ProjectTasks` 支持 EXHIBITION/RENOVATION/ENGINEERING 多类型任务模板，自动沉淀请求响应并回写 `HiveMindProject.projectType`。
- ✅ Telegram `/project status` 与 `/project tasks` 指令可直接同步 HiveMind 状态/任务列表。
- ✅ `monitor#HiveMindProjects` + `notify#TelegramProjectUpdate` 已实现自动轮询提醒，任务模板可通过 `hivemind.task.templates.location` 覆盖。
- ✅ `handle#HiveMindWebhook` 支持 HiveMind 主动推送事件，轮询失败时仍可依赖 Webhook 触发同步。
- 🔄 下一步：对接Webhook/消息队列触发提醒，并补充模板管理UI。

---

## 🕐 更新后的执行时间安排

### **立即启动顺序** (2025-11-04)

#### **Week 1: UI重新设计 (最高优先级)**
- **Day 1**: Task T-UI-1 (组件结构精简重组)
- **Day 2**: Task T-UI-2 (遗留页面清理)
- **Day 3**: Task T-UI-3 (用户体验优化)
- **Day 4-5**: Chrome MCP验证和调优

#### **Week 2: moqui-mcp路由引擎**
- **Day 1-2**: Task T-MCP-1 (意图分类服务实现)
- **Day 3**: Task T-MCP-2 (组件配置更新)
- **Day 4-5**: 端到端测试和调优

#### **Week 3: 智能供需匹配优化**
- **Day 1-3**: Task T-MATCH-1 (匹配算法优化)
- **Day 4-5**: Task T-MATCH-2 (多模态增强)

#### **Week 4: HiveMind集成准备**
- **Day 1-3**: Task T-HIVE-1 (API调研)
- **Day 4-5**: Task T-HIVE-2 (基础路由实现)

---

## 📊 验收标准

### **Phase 0验收标准 (UI重新设计)**
- ✅ 只有2个主要Tab：控制台 + 系统配置
- ✅ Dashboard作为统一监控中心，信息清晰易读
- ✅ 所有8个原页面功能不丢失（隐藏但保留）
- ✅ Telegram Bot使用指南清晰显示
- ✅ Chrome MCP验证UI无错误，加载速度<2秒

### **Phase 2验收标准 (moqui-mcp路由引擎)**
- ✅ `mcp.routing.classify#UserIntent`服务正常工作
- ✅ 4大业务类型识别准确率>85%
- ✅ 置信度计算合理（0-1范围，精度到小数点后2位）
- ✅ Telegram智能识别模式流畅工作
- ✅ 服务调用日志完整，便于调试

### **用户体验验收**
- ✅ 新用户能在30秒内理解平台架构
- ✅ 开发者能快速找到配置和管理功能
- ✅ 用户通过Telegram能快速定位业务需求
- ✅ 智能识别响应时间<3秒
- ✅ Chrome MCP验证无前端错误

---

## 🎯 更新后的立即行动

**现在开始**: Task T-UI-1 (组件结构精简重组)
**核心目标**: 1周内完成UI重新设计，实现精简高效的智能推荐平台
**验证标准**: Chrome MCP无错误 + 用户体验流畅

### **立即执行任务清单**:
1. **更新** `marketplace.xml` - 精简为2个主要Tab
2. **重新设计** `Dashboard.xml` - 统一控制台
3. **创建** `SystemConfig.xml` - 系统配置中心
4. **隐藏** 6个遗留页面 (menu-include="false")
5. **Chrome MCP验证** - 确保UI无错误

---

*更新版本: v1.2*
*制定时间: 2025-11-04*
*更新时间: 2025-11-04*
*新增内容: Phase 0 UI重新设计 (最高优先级)*
*核心理念: Telegram驱动 + 轻量化Web控制台*
