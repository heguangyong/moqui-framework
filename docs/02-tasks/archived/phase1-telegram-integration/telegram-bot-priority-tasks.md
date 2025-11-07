# 任务优先级调整 - 立即执行指导

## 🔄 重要架构调整通知

基于对智能沟通分类平台本质的重新理解，**立即调整任务优先级**：

### ❌ **暂停执行的任务**
- Tab页面深度整合（InfoManagement已创建，暂停后续开发）
- Vue界面复杂功能升级
- HiveMind深度集成开发

### ✅ **新的核心任务**
- **Telegram Bot 4分类菜单**（最高优先级）
- **moqui-mcp智能路由引擎**（核心技术）
- **智能供需匹配完善**（保持现有优势）

---

## 🚀 立即执行：Telegram Bot菜单升级

### **Task T-BOT-1: 实现4分类主菜单**

**目标**: 将Telegram Bot升级为4大业务分类的统一入口
**文件**: `runtime/component/moqui-mcp/src/main/groovy/TelegramBotService.groovy`

#### **具体实现要求**:

```groovy
// 1. 主菜单升级
def createMainMenuKeyboard() {
    return [
        inline_keyboard: [
            [
                [text: "📊 智能供需匹配", callback_data: "category_supply_demand"],
                [text: "🏗️ 蜂巢项目管理", callback_data: "category_hivemind"]
            ],
            [
                [text: "🛒 流行电商", callback_data: "category_ecommerce"],
                [text: "💼 大理石ERP", callback_data: "category_erp"]
            ],
            [
                [text: "🤖 智能识别模式", callback_data: "smart_classify"],
                [text: "ℹ️ 帮助说明", callback_data: "help_info"]
            ]
        ]
    ]
}

// 2. 智能供需匹配子菜单（详细展开）
def createSupplyDemandSubMenu() {
    return [
        inline_keyboard: [
            [
                [text: "🔍 发现匹配", callback_data: "sd_discover"],
                [text: "📢 发布信息", callback_data: "sd_publish"]
            ],
            [
                [text: "🎯 精准推荐", callback_data: "sd_recommend"],
                [text: "📈 交易跟踪", callback_data: "sd_track"]
            ],
            [
                [text: "🎤 语音输入", callback_data: "sd_voice"],
                [text: "📷 图像识别", callback_data: "sd_image"]
            ],
            [
                [text: "⬅️ 返回主菜单", callback_data: "main_menu"]
            ]
        ]
    ]
}

// 3. 其他模块路由菜单（简化版）
def createHiveMindSubMenu() {
    return [
        inline_keyboard: [
            [
                [text: "🏗️ 项目需求识别", callback_data: "hm_project_detect"],
                [text: "📋 创建新项目", callback_data: "hm_project_create"]
            ],
            [
                [text: "📊 项目进度查询", callback_data: "hm_project_status"],
                [text: "👥 团队协作", callback_data: "hm_team_collab"]
            ],
            [
                [text: "🔗 跳转HiveMind", url: "https://hivemind.example.com"],
                [text: "⬅️ 返回主菜单", callback_data: "main_menu"]
            ]
        ]
    ]
}

// 4. 菜单处理逻辑
def handleCallbackQuery(callbackQuery) {
    def data = callbackQuery.data
    def chatId = callbackQuery.message.chat.id
    def messageId = callbackQuery.message.message_id

    switch(data) {
        case "category_supply_demand":
            editMessageText(chatId, messageId,
                "📊 智能供需匹配\n\n选择您需要的功能：",
                createSupplyDemandSubMenu())
            break

        case "category_hivemind":
            editMessageText(chatId, messageId,
                "🏗️ 蜂巢项目管理\n\n项目管理相关功能：",
                createHiveMindSubMenu())
            break

        case "category_ecommerce":
            sendMessage(chatId,
                "🛒 流行电商功能开发中...\n\n即将为您提供完整的电商管理功能！\n\n🔗 临时跳转：https://popcommerce.example.com")
            break

        case "category_erp":
            sendMessage(chatId,
                "💼 大理石ERP功能开发中...\n\n即将为您提供企业资源管理功能！\n\n🔗 临时跳转：https://marbleerp.example.com")
            break

        case "smart_classify":
            sendMessage(chatId,
                "🤖 智能识别模式已启用！\n\n请直接发送您的需求，我将智能识别业务类型并为您导航到合适的功能。\n\n支持：\n🎤 语音消息\n📷 图片识别\n📝 文字描述")
            // 设置用户状态为智能识别模式
            setUserState(chatId, "smart_classify_mode")
            break

        // 智能供需匹配具体功能
        case "sd_discover":
            sendMessage(chatId, "🔍 请描述您要寻找的商品或服务：")
            setUserState(chatId, "supply_demand_search")
            break

        case "sd_publish":
            editMessageText(chatId, messageId,
                "📢 发布信息\n\n请选择发布类型：",
                [inline_keyboard: [
                    [[text: "⬆️ 我要供应", callback_data: "publish_supply"]],
                    [[text: "⬇️ 我要采购", callback_data: "publish_demand"]],
                    [[text: "⬅️ 返回", callback_data: "category_supply_demand"]]
                ]])
            break

        case "main_menu":
            editMessageText(chatId, messageId,
                "🏠 智能业务助手\n\n请选择您需要的业务类型：",
                createMainMenuKeyboard())
            break
    }
}
```

### **Task T-BOT-2: 智能识别模式实现**

**目标**: 实现用户输入的自动业务分类和路由

```groovy
// 智能识别处理逻辑
def handleSmartClassification(chatId, messageText, messageType = "text") {
    // 调用moqui-mcp路由服务
    def routingResult = ec.service.sync()
        .name("mcp.routing.classify#UserIntent")
        .parameters([
            userMessage: messageText,
            messageType: messageType,
            chatId: chatId
        ]).call()

    def category = routingResult.businessCategory
    def confidence = routingResult.confidence

    // 根据分类结果自动导航
    switch(category) {
        case "SUPPLY_DEMAND_MATCHING":
            sendMessage(chatId,
                "🎯 识别为：智能供需匹配 (置信度: ${confidence}%)\n\n" +
                "正在为您处理供需匹配相关需求...")
            // 自动调用供需匹配处理逻辑
            handleSupplyDemandRequest(chatId, messageText)
            break

        case "HIVEMIND_PROJECT":
            sendMessage(chatId,
                "🎯 识别为：项目管理需求 (置信度: ${confidence}%)\n\n" +
                "正在为您跳转到蜂巢项目管理...")
            // 路由到HiveMind相关处理
            routeToHiveMind(chatId, messageText)
            break

        case "ECOMMERCE":
            sendMessage(chatId,
                "🎯 识别为：电商相关需求 (置信度: ${confidence}%)\n\n" +
                "电商功能开发中，临时为您提供相关建议...")
            break

        case "ERP":
            sendMessage(chatId,
                "🎯 识别为：企业管理需求 (置信度: ${confidence}%)\n\n" +
                "ERP功能开发中，临时为您提供相关建议...")
            break

        default:
            sendMessage(chatId,
                "🤔 未能准确识别业务类型，为您显示主菜单：")
            sendMessage(chatId, "🏠 请选择业务类型：", createMainMenuKeyboard())
    }
}
```

---

## ⚙️ Task T-MCP-1: moqui-mcp智能路由服务

### **目标**: 创建业务意图识别和路由服务

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
            List<String> projectKeywords = ["项目", "任务", "团队", "计划", "进度", "里程碑", "协作", "管理", "搭建", "装修"]
            List<String> ecommerceKeywords = ["店铺", "商城", "订单", "物流", "支付", "客服", "营销", "促销"]
            List<String> erpKeywords = ["财务", "人事", "工资", "报表", "审批", "流程", "资源", "成本"]

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
                detectedKeywords: message.findAll(/\p{IsHan}+/),
                messageLength: userMessage.length(),
                hasNumbers: message.matches(/.*\d+.*/),
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
                    break

                case "ERP":
                    nextAction = "REDIRECT_TO_ERP"
                    responseMessage = "💼 大理石ERP功能开发中，即将为您提供服务..."
                    break
            }

            routingResult = result
        ]]></script></actions>
    </service>
</services>
```

---

## 📊 立即验证标准

### **Task T-BOT-1 验证**
1. Telegram Bot显示4分类主菜单
2. 智能供需匹配子菜单功能完整
3. 菜单导航和回调正确工作

### **Task T-MCP-1 验证**
1. 意图分类服务能正确识别4大业务类型
2. 路由服务能调用相应的业务模块
3. 分类置信度计算合理（>0.7为可信）

---

## 🎯 执行时间安排

### **Week 1: Telegram Bot核心功能**
- Day 1-2: 实现4分类菜单系统
- Day 3-4: 智能识别模式开发
- Day 5: Bot功能测试和调优

### **Week 2: moqui-mcp路由引擎**
- Day 1-2: 意图分类服务实现
- Day 3-4: 路由处理逻辑完善
- Day 5: 端到端测试验证

**立即开始**: Task T-BOT-1 (Telegram Bot菜单升级)
**预期完成**: 2周内实现Telegram驱动的4分类智能平台

---

*任务调整版本: v2.0*
*基于架构重新设计: 2025-11-03*
*核心理念转变: 从Vue界面 → Telegram Bot驱动*