# EconoWatch经济资讯聚合系统设计文档

## 概述

EconoWatch是基于Telegram Bot的智能经济资讯聚合系统，采用多模态AI技术，为用户提供高质量的经济新闻资讯收集、分析和推送服务。

## 系统架构

### 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                    EconoWatch系统架构                        │
├─────────────────────────────────────────────────────────────┤
│  Telegram Bot API  │  多模态AI处理  │  资讯聚合引擎  │  MCP管理  │
├─────────────────────────────────────────────────────────────┤
│           Moqui Framework 业务逻辑层                         │
├─────────────────────────────────────────────────────────────┤
│              数据存储层 (资讯数据 + 用户数据)                 │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈
- **后端框架**: Moqui Framework 3.1.0
- **AI集成**: 智谱AI GLM-4/GLM-4V
- **消息平台**: Telegram Bot API
- **数据存储**: H2/MySQL数据库
- **资讯源**: 6park.com、参考消息、主要财经媒体

## 核心组件设计

### 1. Telegram Bot集成组件

#### Bot消息处理器
```groovy
class TelegramMessageProcessor {
    def processMessage(chatId, messageType, content) {
        switch(messageType) {
            case 'text':
                return processTextMessage(chatId, content)
            case 'voice':
                return processVoiceMessage(chatId, content)
            case 'photo':
                return processPhotoMessage(chatId, content)
            default:
                return sendHelpMessage(chatId)
        }
    }
}
```

#### 智能菜单系统
```xml
<!-- Telegram Bot菜单配置 -->
<service verb="get" noun="TelegramMenu" authenticate="false" allow-remote="true">
    <description>获取Telegram Bot菜单结构</description>
    <out-parameters>
        <parameter name="menuData" type="List"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            menuData = [
                [text: "📰 今日头条", callback_data: "news_today"],
                [text: "📊 市场趋势", callback_data: "market_trends"],
                [text: "🏢 行业分析", callback_data: "industry_analysis"],
                [text: "⚙️ 个人设置", callback_data: "user_settings"]
            ]
        ]]></script>
    </actions>
</service>
```

### 2. 多模态AI处理组件

#### 语音识别处理
```groovy
def processVoiceMessage(chatId, voiceFileId) {
    // 1. 下载语音文件
    def voiceFile = telegramService.downloadFile(voiceFileId)
    
    // 2. 调用智谱AI语音识别
    def transcription = zhipuAIService.speechToText(voiceFile)
    
    // 3. 分析经济相关内容
    def analysis = analyzeEconomicContent(transcription)
    
    // 4. 返回相关资讯
    return getRelatedNews(analysis.keywords)
}
```

#### 图像识别处理
```groovy
def processPhotoMessage(chatId, photoFileId) {
    // 1. 下载图片文件
    def photoFile = telegramService.downloadFile(photoFileId)
    
    // 2. 调用智谱AI图像识别
    def imageAnalysis = zhipuAIService.analyzeImage(photoFile)
    
    // 3. 提取经济相关信息
    def economicInfo = extractEconomicInfo(imageAnalysis)
    
    // 4. 生成分析报告
    return generateAnalysisReport(economicInfo)
}
```

### 3. 资讯聚合引擎

#### 数据源管理
```xml
<!-- 资讯源配置 -->
<entity entity-name="NewsSource" package="econowatch">
    <field name="sourceId" type="id" is-pk="true"/>
    <field name="sourceName" type="text-medium"/>
    <field name="sourceUrl" type="text-long"/>
    <field name="sourceType" type="text-short"/>
    <field name="isActive" type="text-indicator"/>
    <field name="lastCrawlTime" type="date-time"/>
</entity>

<entity entity-name="NewsArticle" package="econowatch">
    <field name="articleId" type="id" is-pk="true"/>
    <field name="sourceId" type="id"/>
    <field name="title" type="text-long"/>
    <field name="content" type="text-very-long"/>
    <field name="publishTime" type="date-time"/>
    <field name="category" type="text-short"/>
    <field name="importance" type="number-integer"/>
    <field name="aiSummary" type="text-long"/>
</entity>
```

#### 资讯收集服务
```groovy
def collectDailyNews() {
    def sources = ec.entity.find("NewsSource")
        .condition("isActive", "Y")
        .disableAuthz()
        .list()
    
    sources.each { source ->
        try {
            def articles = crawlNewsFromSource(source)
            articles.each { article ->
                // AI质量评估
                def qualityScore = evaluateArticleQuality(article)
                if (qualityScore > 7.0) {
                    // 生成AI摘要
                    article.aiSummary = generateAISummary(article.content)
                    saveArticle(article)
                }
            }
        } catch (Exception e) {
            ec.logger.error("Failed to crawl from ${source.sourceName}: ${e.message}")
        }
    }
}
```

### 4. MCP管理控制台

#### 系统监控界面
```xml
<screen require-authentication="true">
    <transition name="getSystemStats">
        <service-call name="econowatch.SystemServices.get#SystemStatistics"/>
        <default-response type="screen-last"/>
    </transition>
    
    <widgets>
        <container style="q-pa-md">
            <label text="📊 EconoWatch系统监控" type="h5"/>
            
            <!-- 系统状态卡片 -->
            <container style="row q-gutter-md q-mt-md">
                <container style="col">
                    <container style="q-card q-pa-md text-center">
                        <label text="${todayArticleCount}" type="h4" style="color: primary"/>
                        <label text="今日收集文章"/>
                    </container>
                </container>
                
                <container style="col">
                    <container style="q-card q-pa-md text-center">
                        <label text="${activeUserCount}" type="h4" style="color: positive"/>
                        <label text="活跃用户"/>
                    </container>
                </container>
                
                <container style="col">
                    <container style="q-card q-pa-md text-center">
                        <label text="${botResponseTime}ms" type="h4" style="color: info"/>
                        <label text="Bot响应时间"/>
                    </container>
                </container>
            </container>
        </container>
    </widgets>
</screen>
```

## 数据模型设计

### 用户管理
```xml
<entity entity-name="TelegramUser" package="econowatch">
    <field name="userId" type="id" is-pk="true"/>
    <field name="telegramId" type="text-long"/>
    <field name="username" type="text-medium"/>
    <field name="firstName" type="text-medium"/>
    <field name="lastName" type="text-medium"/>
    <field name="languageCode" type="text-short"/>
    <field name="isActive" type="text-indicator"/>
    <field name="joinDate" type="date-time"/>
    <field name="lastActiveTime" type="date-time"/>
</entity>

<entity entity-name="UserPreference" package="econowatch">
    <field name="preferenceId" type="id" is-pk="true"/>
    <field name="userId" type="id"/>
    <field name="preferenceType" type="text-short"/>
    <field name="preferenceValue" type="text-medium"/>
</entity>
```

### 消息记录
```xml
<entity entity-name="MessageLog" package="econowatch">
    <field name="messageId" type="id" is-pk="true"/>
    <field name="userId" type="id"/>
    <field name="messageType" type="text-short"/>
    <field name="messageContent" type="text-very-long"/>
    <field name="aiResponse" type="text-very-long"/>
    <field name="processingTime" type="number-decimal"/>
    <field name="timestamp" type="date-time"/>
</entity>
```

## API接口设计

### Telegram Webhook接口
```groovy
// POST /rest/s1/econowatch/telegram/webhook
def processTelegramWebhook() {
    def update = request.JSON
    def message = update.message
    
    if (message) {
        def chatId = message.chat.id
        def messageType = determineMessageType(message)
        def content = extractMessageContent(message)
        
        // 异步处理消息
        ec.service.async().name("econowatch.TelegramServices.process#Message")
            .parameters([
                chatId: chatId,
                messageType: messageType,
                content: content
            ])
            .call()
    }
    
    // 立即返回200状态
    ec.web.sendTextResponse("OK", "text/plain", 200)
}
```

### 资讯查询接口
```xml
<service verb="get" noun="DailyNews" authenticate="false" allow-remote="true">
    <description>获取每日经济新闻</description>
    <in-parameters>
        <parameter name="category"/>
        <parameter name="limit" type="Integer" default-value="50"/>
        <parameter name="date" type="Date"/>
    </in-parameters>
    <out-parameters>
        <parameter name="newsList" type="List"/>
        <parameter name="totalCount" type="Integer"/>
    </out-parameters>
    <actions>
        <entity-find entity-name="NewsArticle" list="newsList">
            <econdition field-name="category" value="${category}" ignore-if-empty="true"/>
            <econdition field-name="publishTime" operator="greater-equals" 
                       value="${date ?: ec.user.nowTimestamp.clearTime()}"/>
            <order-by field-name="-importance"/>
            <order-by field-name="-publishTime"/>
            <limit-range start="0" size="${limit}"/>
        </entity-find>
        <set field="totalCount" from="newsList.size()"/>
    </actions>
</service>
```

## 性能优化

### 缓存策略
- **资讯缓存**: 热门资讯缓存30分钟
- **AI响应缓存**: 相同问题缓存1小时
- **用户偏好缓存**: 用户设置缓存24小时

### 异步处理
- **消息处理**: 所有Telegram消息异步处理
- **资讯收集**: 定时任务异步收集资讯
- **AI分析**: AI处理任务放入队列异步执行

## 监控和告警

### 关键指标
- Bot响应时间 < 3秒
- 资讯收集成功率 > 95%
- AI处理成功率 > 90%
- 用户活跃度监控

### 告警机制
- Bot服务异常告警
- 资讯源失效告警
- AI服务异常告警
- 系统性能告警

---

**设计版本**: v1.0  
**最后更新**: 2025年1月13日  
**设计状态**: 完成