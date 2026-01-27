# 智慧蜂巢供需撮合平台设计文档

## 架构概述

智慧蜂巢采用分层架构设计，基于Moqui Framework构建后端服务，Vue 3.x + Quasar 2.x构建前端界面，集成智谱AI GLM-4提供智能匹配能力，通过Telegram Bot提供多模态交互体验。

## 核心组件

### 组件1: AI引擎层
**功能**: 提供多模态AI处理和智能匹配能力
**技术栈**: 智谱AI GLM-4/GLM-4V
**核心能力**:
- 多模态识别（语音/图像/文本）
- 智能匹配算法
- 自然语言处理
- 语义相似度计算

### 组件2: 业务逻辑层
**功能**: 核心业务逻辑处理
**技术栈**: Moqui Framework 3.1.0
**核心服务**:
- SupplyDemandServices.xml - 供需管理服务
- marketplace.process#AllMatching - 匹配引擎服务
- marketplace.get#Statistics - 统计分析服务
- JWT纯认证系统

### 组件3: 前端交互层
**功能**: 用户界面和交互体验
**技术栈**: Vue 3.x + Quasar 2.x
**核心模块**:
- 供需匹配控制台
- 供应管理界面
- 需求管理界面
- 智能匹配界面

### 组件4: 验证交互层
**功能**: Telegram Bot多模态交互
**技术栈**: Telegram Bot API
**核心功能**:
- 多模态消息处理
- 供需信息发布
- 匹配结果推送
- 交易验证确认

### 组件5: 监控分析层
**功能**: 系统监控和数据分析
**技术栈**: MCP控制台
**核心功能**:
- 系统运行状态监控
- AI服务配置管理
- 业务统计仪表板
- 性能指标监控

## 数据模型

### 供应信息实体 (SupplyListing)
```xml
<entity entity-name="SupplyListing" package="marketplace">
    <field name="supplyId" type="id" is-pk="true"/>
    <field name="userId" type="id"/>
    <field name="productName" type="text-long"/>
    <field name="category" type="text-medium"/>
    <field name="price" type="currency-amount"/>
    <field name="quantity" type="number-decimal"/>
    <field name="description" type="text-very-long"/>
    <field name="status" type="text-short"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdated" type="date-time"/>
</entity>
```

### 需求信息实体 (DemandListing)
```xml
<entity entity-name="DemandListing" package="marketplace">
    <field name="demandId" type="id" is-pk="true"/>
    <field name="userId" type="id"/>
    <field name="productName" type="text-long"/>
    <field name="category" type="text-medium"/>
    <field name="budgetMin" type="currency-amount"/>
    <field name="budgetMax" type="currency-amount"/>
    <field name="quantityNeeded" type="number-decimal"/>
    <field name="urgency" type="text-short"/>
    <field name="requirements" type="text-very-long"/>
    <field name="status" type="text-short"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdated" type="date-time"/>
</entity>
```

### 匹配结果实体 (MatchingResult)
```xml
<entity entity-name="MatchingResult" package="marketplace">
    <field name="matchId" type="id" is-pk="true"/>
    <field name="supplyId" type="id"/>
    <field name="demandId" type="id"/>
    <field name="matchScore" type="number-decimal"/>
    <field name="matchReason" type="text-very-long"/>
    <field name="status" type="text-short"/>
    <field name="createdDate" type="date-time"/>
</entity>
```

## 智能匹配算法设计

### 四维匹配评分系统
**算法核心**: 基于产品名称、类别、价格、数量四个维度进行综合评分

**权重分配**:
- 产品名称匹配: 40%
- 类别匹配: 30%
- 价格匹配: 20%
- 数量匹配: 10%

**评分逻辑**:
```groovy
def calculateMatchScore(supply, demand) {
    def score = 0.0
    
    // 产品名称匹配 (40%)
    if (supply.productName && demand.productName) {
        def supplyName = supply.productName.toLowerCase()
        def demandName = demand.productName.toLowerCase()
        
        if (supplyName == demandName) {
            score += 0.4  // 完全匹配
        } else if (supplyName.contains(demandName) || demandName.contains(supplyName)) {
            score += 0.3  // 部分匹配
        } else {
            // 使用GLM-4语义理解
            def semanticScore = calculateSemanticSimilarity(supplyName, demandName)
            score += 0.4 * semanticScore
        }
    }
    
    // 类别匹配 (30%)
    if (supply.category && demand.category) {
        if (supply.category.toLowerCase() == demand.category.toLowerCase()) {
            score += 0.3
        } else if (supply.category.toLowerCase().contains(demand.category.toLowerCase()) ||
                   demand.category.toLowerCase().contains(supply.category.toLowerCase())) {
            score += 0.2
        }
    }
    
    // 价格匹配 (20%)
    if (supply.price && demand.budgetMax && demand.budgetMin) {
        def supplyPrice = supply.price
        def demandMax = demand.budgetMax
        def demandMin = demand.budgetMin
        
        if (supplyPrice >= demandMin && supplyPrice <= demandMax) {
            def optimalRatio = (demandMax - supplyPrice) / (demandMax - demandMin)
            score += 0.2 * optimalRatio
        } else if (supplyPrice < demandMin) {
            score += 0.1
        }
    }
    
    // 数量匹配 (10%)
    if (supply.quantity && demand.quantityNeeded) {
        def ratio = Math.min(supply.quantity / demand.quantityNeeded, 1.0)
        score += 0.1 * ratio
    }
    
    return Math.max(0.0, Math.min(1.0, score))
}
```

### GLM-4语义理解集成
**功能**: 提供产品名称的语义相似度计算
**实现**: 调用智谱AI GLM-4 API进行语义分析
**输入**: 两个产品名称文本
**输出**: 0-1之间的相似度分数

## API设计

### 供需管理API
```
POST /rest/s1/marketplace/supply/create
GET /rest/s1/marketplace/supply/list
PUT /rest/s1/marketplace/supply/update/{supplyId}
DELETE /rest/s1/marketplace/supply/delete/{supplyId}

POST /rest/s1/marketplace/demand/create
GET /rest/s1/marketplace/demand/list
PUT /rest/s1/marketplace/demand/update/{demandId}
DELETE /rest/s1/marketplace/demand/delete/{demandId}
```

### 智能匹配API
```
POST /rest/s1/marketplace/matching/process
GET /rest/s1/marketplace/matching/results/{userId}
GET /rest/s1/marketplace/matching/score/{supplyId}/{demandId}
```

### 统计分析API
```
GET /rest/s1/marketplace/statistics/dashboard
GET /rest/s1/marketplace/statistics/trends
GET /rest/s1/marketplace/statistics/performance
```

## Telegram Bot设计

### 指令体系
**基础功能**:
- /start - 启动Bot并显示主菜单
- /menu - 显示功能菜单
- /help - 显示帮助信息
- /status - 显示系统状态

**供需匹配**:
- /supply - 发布供应信息
- /demand - 发布需求信息
- /match - 启动智能匹配
- /mylistings - 查看个人信息

**多模态处理**:
- /voice - 处理语音消息
- /image - 处理图片消息
- /video - 处理视频消息
- /document - 处理文档消息

### 消息处理流程
1. **接收消息**: Bot接收用户发送的多模态消息
2. **内容解析**: 使用GLM-4V解析图片、语音转文字等
3. **信息提取**: 从解析结果中提取结构化信息
4. **业务处理**: 调用后端API进行业务逻辑处理
5. **结果推送**: 将处理结果推送给用户

## 用户界面设计

### 主控制台界面
**布局**: 采用Quasar Layout组件，包含头部工具栏、侧边导航、主内容区
**功能模块**:
- 实时统计数据展示
- 快速操作入口
- 最新匹配结果
- 系统状态监控

### 供应管理界面
**功能**: 供应信息的CRUD操作
**组件**: 表单组件、数据表格、状态标签、操作按钮
**特性**: 支持批量操作、状态筛选、搜索排序

### 需求管理界面
**功能**: 需求信息的管理和跟踪
**组件**: 需求表单、紧急程度标识、预算范围选择器
**特性**: 支持紧急程度排序、预算区间筛选

### 智能匹配界面
**功能**: 匹配结果展示和操作
**组件**: 匹配卡片、评分显示、联系按钮、匹配详情
**特性**: 支持匹配度排序、一键联系、匹配原因展示

## 技术决策

### 决策1: 选择Moqui Framework作为后端框架
**理由**: 
- 企业级框架，稳定可靠
- 内置完整的用户管理和权限系统
- 支持复杂的业务逻辑处理
- 与现有技术栈兼容

### 决策2: 集成智谱AI GLM-4
**理由**:
- 强大的多模态处理能力
- 优秀的中文语义理解
- 稳定的API服务
- 合理的使用成本

### 决策3: 使用Vue 3.x + Quasar 2.x构建前端
**理由**:
- 现代化的前端技术栈
- 丰富的UI组件库
- 良好的响应式设计支持
- 优秀的开发体验

### 决策4: 采用JWT纯认证模式
**理由**:
- 无状态架构，易于扩展
- 安全性高
- 支持跨域访问
- 与移动端兼容性好

---

**文档版本**: v1.0  
**最后更新**: 2025年1月14日  
**来源文档**: docs/04-应用案例-智慧蜂巢供需撮合平台.md  
**审批状态**: 待审批