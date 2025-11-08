# �� Codex立即执行指令

## 当前任务: 🛒流行电商模块实现

### 📋 执行优先级
**Phase 3.1 - Week 1: 基础架构搭建**

### 🎯 立即开始任务

#### **Task E-1: 创建电商实体定义** ⭐ **最高优先级**

**文件路径**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/entity/EcommerceEntities.xml`

**任务内容**:
1. 创建电商核心实体：Product, ProductCategory, Order, OrderItem, Customer, ShoppingCart
2. 设计完整的实体关联关系
3. 包含审计字段和多租户预留字段

**参考模式**: 复用`MarketplaceEntities.xml`的设计模式

#### **Task E-2: 扩展Telegram电商菜单** ⭐ **高优先级**

**文件路径**: `/Users/demo/Workspace/moqui/runtime/component/moqui-mcp/src/main/groovy/TelegramServices.groovy`

**任务内容**:
1. 添加`createEcommerceSubMenu()`函数
2. 在`handleCallbackQuery()`中添加电商���调处理
3. 在4分类主菜单中连接电商功能

**参考模式**: 复用`createSupplyDemandSubMenu()`的实现模式

#### **Task E-3: 创建电商基础服务** ⭐ **高优先级**

**文件路径**: `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/service/marketplace/EcommerceServices.xml`

**任务内容**:
1. 实现商品CRUD服务：`create#Product`, `update#Product`, `get#ProductList`
2. 实现订单基础服务：`create#Order`, `get#OrderStatus`
3. 集成到组件配置中

**参考模式**: 复用`HiveMindWebhookServices.xml`的服务设计模式

### 🔧 技术要求

#### **架构一致性**
- 遵循现有HiveMind集成的架构模式
- 使用现有JWT认证系统
- 集成MCP智能路由分类
- 保持代码风格一致性

#### **实体设计标准**
```xml
<!-- 示例Product实体结构 -->
<entity entity-name="Product" package="moqui.marketplace.ecommerce">
    <field name="productId" type="id" is-pk="true"/>
    <field name="productName" type="text-medium"/>
    <field name="description" type="text-long"/>
    <field name="price" type="currency-precise"/>
    <field name="categoryId" type="id"/>
    <field name="imageUrl" type="text-medium"/>
    <field name="stockQuantity" type="number-integer"/>
    <field name="status" type="text-short"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdated" type="date-time"/>
    <!-- 多租户预留 -->
    <field name="tenantId" type="id"/>
</entity>
```

#### **Telegram菜单规范**
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

### 📊 验证要求

#### **立即验证步骤**
1. **实体验证**: 确认实体能正确创建数据库表
2. **服务验证**: REST API端点能正确响应
3. **Telegram验证**: 电商子菜单能正确显示
4. **集成验证**: MCP路由能正确分类电商消息

#### **Chrome MCP验证**
完成Task E-1到E-3后，使用Chrome MCP验证Web控制台集成：
```bash
./testing-tools/chrome_mcp_auth_proxy.sh
# 验证 /qapps/marketplace 显示电商相关内容
```

### 🎯 本周目标

**Week 1结束时的交付标准**:
- ✅ 电商实体完整定义并可创建数据库表
- ✅ Telegram Bot显示完整电商子菜单
- ✅ 电商基础服务通过REST API测试
- ✅ MCP智能路由正确识别电商相关消息

### 📞 协作方式

**执行模式**: Codex自主执行 + Claude定期审核
**反馈周期**: 每完成一个Task立即反馈
**质量控制**: 关键节点Claude代码审核
**进度跟踪**: 使用TodoWrite工具跟踪进度

---

## 🚀 开始执行

**Codex请立即开始Task E-1**: 创建`EcommerceEntities.xml`文件，实现电商核心实体定义。

**重要提醒**:
1. 严格遵循现有架构模式
2. 每个Task完成后立即验证
3. 遇到技术问题及时反馈
4. 保持代码质量和文档完整性

**目标**: 在3周内完成完整的🛒流行电商模块，形成"📊供需匹配 + 🏗️项目管理 + 🛒电商管理"的核心三角业务体系。

**执行状态**: 🎯 **立即启动Task E-1**