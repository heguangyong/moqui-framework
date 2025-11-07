# Codex执行任务指导 - Telegram Bot 4分类菜单系统

## 🎯 任务概述

**任务名称**: Task T-BOT-1 - 实现Telegram Bot 4分类主菜单系统
**优先级**: 最高优先级
**执行时间**: 立即开始，1-2天完成
**审核人**: Claude AI
**依据文档**: `/docs/03-tasks/next-phase-development-plan.md`

---

## 📋 具体执行步骤

### **Step 1: 更新TelegramServices.groovy基础结构**

**文件位置**: `/runtime/component/moqui-mcp/src/main/groovy/TelegramServices.groovy`

**需要添加的方法**:

```groovy
// 在文件末尾添加以下方法（在现有helper functions之后）

// ================== 新增：4分类菜单系统 ==================

/**
 * 创建4分类主菜单键盘
 */
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

/**
 * 创建智能供需匹配子菜单（详细展开）
 */
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

/**
 * 创建其他模块菜单（简化版）
 */
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

/**
 * 处理菜单回调查询
 */
def handleCallbackQuery(callbackQuery, telegramHttpClient, executionContext) {
    def data = callbackQuery.data
    def chatId = callbackQuery.message.chat.id
    def messageId = callbackQuery.message.message_id

    executionContext.logger.info("处理回调查询: ${data} for chat: ${chatId}")

    switch(data) {
        case "category_supply_demand":
            editMessageText(chatId, messageId,
                "📊 智能供需匹配\\n\\n选择您需要的功能：",
                createSupplyDemandSubMenu(), telegramHttpClient, executionContext)
            break

        case "category_hivemind":
            editMessageText(chatId, messageId,
                "🏗️ 蜂巢项目管理\\n\\n项目管理相关功能：",
                createHiveMindSubMenu(), telegramHttpClient, executionContext)
            break

        case "category_ecommerce":
            sendTelegramMessage(chatId,
                "🛒 流行电商功能开发中...\\n\\n即将为您提供完整的电商管理功能！\\n\\n🔗 临时跳转：https://popcommerce.example.com",
                telegramHttpClient, executionContext)
            break

        case "category_erp":
            sendTelegramMessage(chatId,
                "💼 大理石ERP功能开发中...\\n\\n即将为您提供企业资源管理功能！\\n\\n🔗 临时跳转：https://marbleerp.example.com",
                telegramHttpClient, executionContext)
            break

        case "smart_classify":
            sendTelegramMessage(chatId,
                "🤖 智能识别模式已启用！\\n\\n请直接发送您的需求，我将智能识别业务类型并为您导航到合适的功能。\\n\\n支持：\\n🎤 语音消息\\n📷 图片识别\\n📝 文字描述",
                telegramHttpClient, executionContext)
            // TODO: 设置用户状态为智能识别模式（Step 3实现）
            break

        case "help_info":
            sendTelegramMessage(chatId,
                "ℹ️ 智能推荐平台帮助\\n\\n🎯 **平台功能**：\\n📊 智能供需匹配 - 商品供需撮合\\n🏗️ 蜂巢项目管理 - 项目协作工具\\n🛒 流行电商 - 电商平台管理\\n💼 大理石ERP - 企业资源规划\\n\\n💡 **使用提示**：\\n• 点击菜单按钮快速导航\\n• 开启智能识别模式自动分类\\n• 支持语音和图片多模态输入",
                telegramHttpClient, executionContext)
            break

        // 智能供需匹配具体功能
        case "sd_discover":
            sendTelegramMessage(chatId, "🔍 请描述您要寻找的商品或服务：", telegramHttpClient, executionContext)
            // TODO: 设置用户状态为供需搜索模式
            break

        case "sd_publish":
            editMessageText(chatId, messageId,
                "📢 发布信息\\n\\n请选择发布类型：",
                [inline_keyboard: [
                    [[text: "⬆️ 我要供应", callback_data: "publish_supply"]],
                    [[text: "⬇️ 我要采购", callback_data: "publish_demand"]],
                    [[text: "⬅️ 返回", callback_data: "category_supply_demand"]]
                ]], telegramHttpClient, executionContext)
            break

        case "main_menu":
            editMessageText(chatId, messageId,
                "🏠 智能推荐平台\\n\\n请选择您需要的业务类型：",
                createMainMenuKeyboard(), telegramHttpClient, executionContext)
            break

        default:
            executionContext.logger.warn("未处理的回调查询: ${data}")
            sendTelegramMessage(chatId, "⚠️ 功能开发中，请稍后再试", telegramHttpClient, executionContext)
    }
}

/**
 * 编辑消息文本（支持inline keyboard）
 */
void editMessageText(String chatId, String messageId, String messageText, Map replyMarkup, HttpClient httpClient, def executionContext) {
    try {
        String botToken = System.getProperty("telegram.bot.token") ?:
                         System.getenv("TELEGRAM_BOT_TOKEN") ?:
                         executionContext.ecfi.getConfValue("telegram.bot.token")

        if (!botToken || botToken.isEmpty()) {
            executionContext.logger.warn("Telegram Bot Token未配置，无法编辑消息")
            return
        }

        String telegramApiUrl = "https://api.telegram.org/bot${botToken}/editMessageText"

        Map<String, Object> requestData = [
            chat_id: chatId,
            message_id: messageId,
            text: messageText,
            parse_mode: "Markdown"
        ]

        if (replyMarkup) {
            requestData.reply_markup = replyMarkup
        }

        String requestBody = groovy.json.JsonOutput.toJson(requestData)

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(telegramApiUrl))
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build()

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

        if (response.statusCode() == 200) {
            executionContext.logger.info("Telegram消息编辑成功: chat ${chatId}, message ${messageId}")
        } else {
            executionContext.logger.warn("Telegram消息编辑失败: HTTP ${response.statusCode()}, 响应: ${response.body()}")
        }

    } catch (Exception e) {
        executionContext.logger.error("编辑Telegram消息时出错: ${e.message}", e)
    }
}
```

### **Step 2: 修改/start命令处理逻辑**

**找到现有的/start处理部分**（约第147行），替换为：

```groovy
// 将现有的/start处理逻辑替换为以下代码
if (incomingText.equalsIgnoreCase("/start")) {
    // 发送4分类主菜单
    String welcomeMessage = "🏠 欢迎使用智能推荐平台！\\n\\n请选择您需要的业务类型："

    sendTelegramMessageWithKeyboard(chatId, welcomeMessage, createMainMenuKeyboard(), telegramHttpClient, ec)

    context.success = true
    context.aiResponse = welcomeMessage
    context.chatId = chatId
    context.intent = "main_menu"
    context.response = [ok: true]

    ec.logger.info("Telegram主菜单发送成功到聊天: ${chatId}")
    return
}
```

### **Step 3: 添加带键盘的消息发送方法**

**在现有sendTelegramMessage方法之后添加**：

```groovy
/**
 * 发送带inline keyboard的Telegram消息
 */
void sendTelegramMessageWithKeyboard(String chatId, String messageText, Map replyMarkup, HttpClient httpClient, def executionContext) {
    try {
        String botToken = System.getProperty("telegram.bot.token") ?:
                         System.getenv("TELEGRAM_BOT_TOKEN") ?:
                         executionContext.ecfi.getConfValue("telegram.bot.token")

        if (!botToken || botToken.isEmpty()) {
            executionContext.logger.warn("Telegram Bot Token未配置，仅记录日志: ${messageText}")
            executionContext.logger.info("Telegram message to chat ${chatId}: ${messageText}")
            return
        }

        String telegramApiUrl = "https://api.telegram.org/bot${botToken}/sendMessage"

        Map<String, Object> requestData = [
            chat_id: chatId,
            text: messageText,
            parse_mode: "Markdown"
        ]

        if (replyMarkup) {
            requestData.reply_markup = replyMarkup
        }

        String requestBody = groovy.json.JsonOutput.toJson(requestData)

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(telegramApiUrl))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build()

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

        if (response.statusCode() == 200) {
            executionContext.logger.info("Telegram带键盘消息发送成功到聊天 ${chatId}")
        } else {
            executionContext.logger.warn("Telegram带键盘消息发送失败: HTTP ${response.statusCode()}, 响应: ${response.body()}")
        }

    } catch (Exception e) {
        executionContext.logger.error("发送Telegram带键盘消息时出错: ${e.message}", e)
        // 降级到普通消息
        sendTelegramMessage(chatId, messageText, httpClient, executionContext)
    }
}
```

### **Step 4: 添加callback_query事件处理**

**在主要try块的开始处（约第24行之后）添加**：

```groovy
// 在现有的update解析之后添加callback_query处理
Map update = context.update instanceof Map ? (Map) context.update : [:]

// 处理callback_query事件（inline keyboard按钮点击）
if (update.callback_query) {
    ec.logger.info("收到callback_query事件")
    handleCallbackQuery(update.callback_query, telegramHttpClient, ec)

    // 应答callback_query（告诉Telegram服务器已处理）
    answerCallbackQuery(update.callback_query.id, telegramHttpClient, ec)

    context.success = true
    context.response = [ok: true]
    return
}
```

### **Step 5: 添加answerCallbackQuery方法**

```groovy
/**
 * 应答callback query（移除loading状态）
 */
void answerCallbackQuery(String callbackQueryId, HttpClient httpClient, def executionContext) {
    try {
        String botToken = System.getProperty("telegram.bot.token") ?:
                         System.getenv("TELEGRAM_BOT_TOKEN") ?:
                         executionContext.ecfi.getConfValue("telegram.bot.token")

        if (!botToken || botToken.isEmpty()) {
            return
        }

        String telegramApiUrl = "https://api.telegram.org/bot${botToken}/answerCallbackQuery"

        Map<String, Object> requestData = [
            callback_query_id: callbackQueryId
        ]

        String requestBody = groovy.json.JsonOutput.toJson(requestData)

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(telegramApiUrl))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(10))
            .build()

        httpClient.send(request, HttpResponse.BodyHandlers.ofString())

    } catch (Exception e) {
        executionContext.logger.warn("应答callback query失败: ${e.message}")
    }
}
```

---

## 📋 测试验证要求

### **手动测试步骤**

1. **基础功能测试**:
   ```bash
   # 1. 确保Moqui服务器运行
   ./gradlew run

   # 2. 发送/start到Telegram Bot
   # 预期：收到4分类主菜单（6个按钮）
   ```

2. **菜单导航测试**:
   - 点击"📊 智能供需匹配" → 应显示6个子菜单按钮
   - 点击"🏗️ 蜂巢项目管理" → 应显示6个项目管理按钮
   - 点击"🛒 流行电商" → 应显示开发中消息
   - 点击"💼 大理石ERP" → 应显示开发中消息
   - 点击"🤖 智能识别模式" → 应显示智能识别说明
   - 点击"ℹ️ 帮助说明" → 应显示平台帮助信息

3. **返回导航测试**:
   - 在任何子菜单点击"⬅️ 返回主菜单" → 应回到4分类主菜单

### **日志验证**

执行后检查Moqui日志应包含：
```
INFO  收到callback_query事件
INFO  处理回调查询: category_supply_demand for chat: [chatId]
INFO  Telegram消息编辑成功: chat [chatId], message [messageId]
```

---

## ✅ 完成标准

1. **功能完整性**:
   - ✅ /start命令显示4分类主菜单
   - ✅ 所有6个主菜单按钮都有响应
   - ✅ 智能供需匹配子菜单完整（6个按钮）
   - ✅ 蜂巢项目管理子菜单完整（6个按钮）
   - ✅ 返回主菜单功能正常工作

2. **代码质量**:
   - ✅ 所有新增方法都有完整的文档注释
   - ✅ 错误处理机制完善（try-catch块）
   - ✅ 日志记录充分，便于调试
   - ✅ 代码风格与现有代码一致

3. **用户体验**:
   - ✅ 菜单按钮布局美观（2x2 + 2x1格局）
   - ✅ 按钮文字清晰有emoji图标
   - ✅ 导航逻辑直观易懂
   - ✅ 响应速度快（<2秒）

---

## 🚨 注意事项

1. **保持现有功能**: 不要影响现有的语音、图像处理功能
2. **错误处理**: 所有Telegram API调用都要有try-catch
3. **日志记录**: 每个关键操作都要记录日志
4. **Groovy语法**: 注意Groovy的map和list语法与Java的区别
5. **Token检查**: 确保Telegram Bot Token配置正确

---

## 📊 执行后提交

完成后请提供：
1. **代码修改确认**: 确认所有代码都已正确添加
2. **功能演示**: 提供Telegram Bot测试截图
3. **日志输出**: 提供关键操作的日志记录
4. **问题报告**: 如遇到任何问题的详细描述

**审核人审核重点**: 菜单功能完整性、代码质量、用户体验、错误处理机制

---

*任务指导版本: v1.0*
*制定时间: 2025-11-04*
*预期完成时间: 1-2天*