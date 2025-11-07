# 🛒 流行电商模块 - Codex执行计划

## 📋 任务概述

**目标**: 实现Telegram驱动的电商管理模块，完善4分类业务矩阵
**执行者**: Codex
**审核者**: Claude
**预期完成时间**: 2-3周
**优先级**: 高 (Phase 3 核心任务)

---

## 🎯 核心目标

### **业务目标**
- 完成4分类菜单中"🛒流行电商"功能实现
- 提供完整的电商管理Telegram Bot交互
- 集成到现有Web控制台架构
- 复用智能推荐和多模态AI能力

### **技术目标**
- 扩展现有TelegramServices.groovy电商功能
- 创建电商相关实体和服务
- 集成到marketplace.xml控制台
- 保持与HiveMind项目管理一致的架构模式

---

## 📁 文件结构规划

### **需要创建/修改的文件**

#### **1. 实体定义**
```
/runtime/component/moqui-marketplace/entity/EcommerceEntities.xml
├── Product (商品)
├── ProductCategory (商品分类)
├── Order (订单)
├── OrderItem (订单项)
├── Customer (客户)
├── ShoppingCart (购物车)
└── ProductReview (商品评价)
```

#### **2. 服务实现**
```
/runtime/component/moqui-marketplace/service/EcommerceServices.xml
├── create#Product (创建商品)
├── update#Product (更新商品)
├── create#Order (创建订单)
├── process#Payment (处理支付)
├── manage#Inventory (库存管理)
├── get#ProductRecommendations (商品推荐)
└── analyze#SalesData (销售数据分析)
```

#### **3. Telegram Bot集成**
```
/runtime/component/moqui-mcp/src/main/groovy/TelegramServices.groovy
├── createEcommerceSubMenu() (电商子菜单)
├── handleEcommerceCallback() (电商回调处理)
├── processProductSearch() (商品搜索)
├── processOrderManagement() (订单管理)
└── handleProductRecommendation() (商品推荐)
```

#### **4. Web控制台集成**
```
/runtime/component/moqui-marketplace/screen/marketplace/Ecommerce.xml
├── 商品管理界面
├── 订单统计界面
├── 客户管理界面
└── 销售数据分析
```

#### **5. REST API扩展**
```
/runtime/component/moqui-marketplace/service/marketplace.rest.xml
├── /products (商品管理API)
├── /orders (订单管理API)
├── /customers (客户管理API)
└── /analytics (数据分析API)
```

---

## 🔧 详细实施步骤

### **Phase 3.1: 基础架构搭建** (Week 1)

#### **Task E-1: 电商实体设计**
**文件**: `EcommerceEntities.xml`
**内容**:
```xml
<!-- 示例实体结构 -->
<entity entity-name="Product" package="moqui.marketplace.ecommerce">
    <field name="productId" type="id" is-pk="true"/>
    <field name="productName" type="text-medium"/>
    <field name="description" type="text-long"/>
    <field name="price" type="currency-precise"/>
    <field name="categoryId" type="id"/>
    <field name="imageUrl" type="text-medium"/>
    <field name="stockQuantity" type="number-integer"/>
    <field name="status" type="text-short"/>
</entity>
```

#### **Task E-2: Telegram电商菜单**
**文件**: `TelegramServices.groovy`
**函数**: `createEcommerceSubMenu()`
**内容**:
```groovy
Map createEcommerceSubMenu() {
    return [
        inline_keyboard: [
            [[text: "🛍️ 商品搜索", callback_data: "ec_search"],
             [text: "📦 库存管理", callback_data: "ec_inventory"]],
            [[text: "🛒 订单查询", callback_data: "ec_orders"],
             [text: "👥 客户管理", callback_data: "ec_customers"]],
            [[text: "📊 销售统计", callback_data: "ec_analytics"],
             [text: "🎯 智能推荐", callback_data: "ec_recommend"]],
            [[text: "⬅️ 返回主菜单", callback_data: "main_menu"]]
        ]
    ]
}
```

#### **Task E-3: 基础服务框架**
**文件**: `EcommerceServices.xml`
**服务**: `create#Product`, `get#ProductList`, `create#Order`

### **Phase 3.2: 核心功能实现** (Week 2)

#### **Task E-4: 商品管理功能**
**Telegram命令**: `/product add`, `/product search`, `/product update`
**服务集成**: 商品CRUD + 图像识别商品信息提取

#### **Task E-5: 订单处理系统**
**Telegram命令**: `/order create`, `/order status`, `/order list`
**功能**: 订单生成、状态跟踪、支付处理

#### **Task E-6: 智能推荐集成**
**复用**: 现有智能匹配算法
**扩展**: 商品推荐、交叉销售、个性化推荐

### **Phase 3.3: Web控制台集成** (Week 3)

#### **Task E-7: 电商控制台页面**
**文件**: `Ecommerce.xml`
**集成**: 添加到`marketplace.xml`的`subscreens`

#### **Task E-8: 数据分析仪表板**
**功能**: 销售统计、商品排行、客户分析

#### **Task E-9: SystemConfig集成**
**更新**: `SystemConfig.xml`添加电商配置区域

---

## 📊 技术规范

### **架构一致性要求**
1. **复用现有模式**: 遵循HiveMind集成的服务设计模式
2. **MCP路由集成**: 电商消息通过`classify#UserIntent`自动路由
3. **多模态AI**: 商品图像识别使用现有GLM-4V集成
4. **JWT认证**: 所有API使用现有纯JWT认证
5. **错误处理**: 统一错误处理和用户友好提示

### **数据库设计原则**
- **实体关联**: Product ↔ Category ↔ Order ↔ Customer
- **审计字段**: `createdDate`, `lastUpdated`, `createdBy`
- **软删除**: 使用`status`字段而非物理删除
- **多租户准备**: 预留`tenantId`字段支持未来扩展

### **Telegram Bot交互规范**
- **菜单层次**: 主菜单 → 电商子菜单 → 具体功能
- **命令格式**: `/product`, `/order`, `/customer` + 子命令
- **回调处理**: `ec_*` 前缀标识电商回调
- **消息格式**: 保持与项目管理一致的消息模板

---

## 🧪 测试验证要求

### **功能测试清单**
- [ ] 电商子菜单正确显示
- [ ] 商品CRUD操作完整
- [ ] 订单流程端到端测试
- [ ] 智能推荐算法验证
- [ ] Web控制台界面完整
- [ ] REST API端点测试

### **集成测试清单**
- [ ] MCP意图分类正确路由电商消息
- [ ] 多模态AI商品图像识别
- [ ] JWT认证在所有电商端点正常
- [ ] Chrome MCP验证Web界面
- [ ] Telegram Bot完整交互流程

---

## 📝 Codex执行指南

### **执行方式**
1. **按阶段执行**: 严格按Phase 3.1 → 3.2 → 3.3顺序
2. **增量开发**: 每个Task完成后立即测试验证
3. **代码复用**: 最大化复用现有HiveMind集成模式
4. **文档同步**: 重要变更同步更新CLAUDE.md

### **质量标准**
- **代码规范**: 遵循现有Groovy/XML代码风格
- **注释完整**: 关键逻辑添加中文注释
- **错误处理**: 完整的异常捕获和用户提示
- **性能考虑**: 数据库查询优化和缓存策略

### **交付标准**
- **功能完整**: 所有电商核心功能可通过Telegram使用
- **界面集成**: Web控制台显示电商数据和配置
- **API完整**: REST API支持外部集成
- **文档更新**: 更新架构文档和使用说明

---

## 🎯 成功标准

### **用户体验目标**
✅ 用户可通过Telegram完成完整电商操作流程
✅ Web控制台提供电商业务数据总览
✅ 智能推荐提升商品发现效率
✅ 多模态AI简化商品信息录入

### **技术架构目标**
✅ 电商模块与现有架构无缝集成
✅ 所有电商API使用纯JWT认证
�� MCP智能路由正确分类电商消息
✅ 代码质量与现有模块保持一致

### **业务价值目标**
✅ 完成4分类业务矩阵的75% (供需+项目+电商)
✅ 形成完整的商业生态闭环
✅ 为后续💼大理石ERP模块奠定基础
✅ 提升平台商业化价值

---

## 📞 支持与协作

### **Claude审核要点**
- 架构设计合理性审核
- 代码质量和规范检查
- 集成测试结果验证
- 用户体验优化建议

### **Codex反馈渠道**
- 技术难点及时沟通
- 架构调整需求讨论
- 进度里程碑确认
- 质量问题快速解决

**执行开始时间**: 立即启动
**里程碑检查**: 每周五进度回顾
**最终交付**: 3周内完成完整电商模块

---

*本执行计划基于当前生产就绪的技术基础，确保Codex能够高效完成高质量的电商模块实现。*