# 🛒 Codex立即执行指令 - 电商模块 (已更新)

## 当前任务: 🛒流行电商模块实现

### ✅ **重要进展更新 (2025-11-06)**

#### **gradlew load 错误修复** ✅ **已完成**
- ✅ 修复了`MarketplaceSecurityData.xml`中的ArtifactAuthz配置错误
- ✅ 修复了`McpDemoData.xml`中的Party实体字段问题
- ✅ 修复了`McpSecurityData.xml`中的UserGroup属性错误
- ✅ **`./gradlew load`现在完全成功运行，无警告无错误**

#### **Task E-2: Telegram电商菜单** ✅ **已完成**
- **文件**: `/Users/demo/Workspace/moqui/runtime/component/moqui-mcp/src/main/groovy/TelegramServices.groovy`
- **已实现功能**:
- ✅ `createEcommerceSubMenu()` 函数完整实现
- ✅ 6个电商功能按钮：🛍️商品搜索、📦库存管理、🛒订单查询、👥客户管理、📊销售统计、🎯智能推荐
- ✅ 在`handleCallbackQuery()`中集成`category_ecommerce`处理
- ✅ 所有电商回调处理：`ec_search`, `ec_inventory`, `ec_orders`, `ec_customers`, `ec_analytics`, `ec_recommend`

#### **Task E-1: 电商实体设计** ✅ **已完成**
- ✅ `EcommerceProduct` / `EcommerceOrder` / `EcommerceCustomer` 等核心实体建模完成
- ✅ `McpDialogSession` 关系加上 `title` 避免重复约束，`./gradlew load` 0 错误
- ✅ 电商实体现支持库存字段、审核时间戳和多租户扩展位

#### **Task E-3: 电商基础服务** ✅ **已完成**
- ✅ 商品查询/搜索/库存/推荐等服务整理为 `marketplace.ecommerce.*`
- ✅ 订单创建、状态更新服务完成并与订单明细写入联动
- ✅ `/rest/s1/marketplace/ecommerce/*` 资源已注册（需携带JWT调用）
- ✅ Telegram 回调 `ec_search`/`ec_inventory`/`ec_recommend` 直接读取服务返回并格式化消息
- ✅ 若服务注册暂未生效，Telegram端已回退为直接查询 `EcommerceProduct` 实体，避免缺失服务导致的报错

### 🎯 **立即执行任务**

#### **Task E-4: 商品管理端到端体验** ⭐ **进行中**

**目标**: 让Telegram与Web端都能完成商品建档、查询、更新。
- [ ] 为Telegram新增 `/product add|update|list` 指令，复用 `create#Product`/`update#Product` 服务
- [ ] 在Web控制台 `Dashboard` 增加商品列表卡片，展示最新5条商品信息
- [ ] 设计`EcommerceDemoData.xml`种子数据（至少3个分类、5个商品），便于演示与测试
- [ ] 完成后通过 `/rest/s1/marketplace/ecommerce/products` + JWT 验证接口输出

#### **Task E-5: 订单处理系统** ⭐ **待启动**

**目标**: 支撑 Telegram 下单、状态跟踪及库存扣减。
- [ ] 实现 `/order create|status|list` 指令，结合 `create#Order` 与 `get#OrderStatus`
- [ ] 订单创建成功后自动调用 `update#ProductInventory` 扣减库存
- [ ] 建立订单状态映射（CREATED→PAID→FULFILLED→CLOSED），同步到HiveMind项目卡片
- [ ] 准备 REST 调用示例，记录到 `testing-tools` 下的脚本中

#### **Task E-6: 智能推荐集成** ⭐ **规划**

**目标**: 融合供需推荐与电商商品数据。
- [ ] 接入 `mcp.routing.classify#UserIntent` 的商品专属标签，区分B端采购与项目拓展
- [ ] 引入商品评价 `EcommerceProductReview` 评分作为权重
- [ ] 在 Telegram 回复中突出“智能推荐来源”，并给出关联项目信息

---

**文件参考**:
- `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/screen/marketplace/Dashboard.xml`
- `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/service/marketplace/EcommerceServices.xml`
- `/Users/demo/Workspace/moqui/runtime/component/moqui-marketplace/entity/EcommerceEntities.xml`
- `/Users/demo/Workspace/moqui/runtime/component/moqui-mcp/src/main/groovy/TelegramServices.groovy`

### 🔧 技术要求

#### **实体设计标准**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<entities xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/entity-definition-3.xsd">

    <!-- 商品分类 -->
    <entity entity-name="ProductCategory" package="moqui.marketplace.ecommerce">
        <field name="categoryId" type="id" is-pk="true"/>
        <field name="categoryName" type="text-medium"/>
        <field name="description" type="text-long"/>
        <field name="parentCategoryId" type="id"/>
        <field name="sortOrder" type="number-integer"/>
        <field name="status" type="text-short" default="ACTIVE"/>
        <field name="createdDate" type="date-time"/>
        <field name="lastUpdated" type="date-time"/>
        <field name="tenantId" type="id"/>
        <relationship type="one" title="Parent" related="moqui.marketplace.ecommerce.ProductCategory">
            <key-map field-name="parentCategoryId" related="categoryId"/>
        </relationship>
    </entity>

    <!-- 商品 -->
    <entity entity-name="Product" package="moqui.marketplace.ecommerce">
        <field name="productId" type="id" is-pk="true"/>
        <field name="productName" type="text-medium"/>
        <field name="description" type="text-long"/>
        <field name="price" type="currency-precise"/>
        <field name="categoryId" type="id"/>
        <field name="imageUrl" type="text-medium"/>
        <field name="stockQuantity" type="number-integer" default="0"/>
        <field name="status" type="text-short" default="ACTIVE"/>
        <field name="createdDate" type="date-time"/>
        <field name="lastUpdated" type="date-time"/>
        <field name="tenantId" type="id"/>
        <relationship type="one" related="moqui.marketplace.ecommerce.ProductCategory"/>
    </entity>

    <!-- 订单 -->
    <entity entity-name="Order" package="moqui.marketplace.ecommerce">
        <field name="orderId" type="id" is-pk="true"/>
        <field name="customerId" type="id"/>
        <field name="orderDate" type="date-time"/>
        <field name="totalAmount" type="currency-precise"/>
        <field name="status" type="text-short" default="PENDING"/>
        <field name="shippingAddress" type="text-long"/>
        <field name="paymentMethod" type="text-short"/>
        <field name="createdDate" type="date-time"/>
        <field name="lastUpdated" type="date-time"/>
        <field name="tenantId" type="id"/>
    </entity>

    <!-- 订单项 -->
    <entity entity-name="OrderItem" package="moqui.marketplace.ecommerce">
        <field name="orderId" type="id" is-pk="true"/>
        <field name="orderItemSeqId" type="id" is-pk="true"/>
        <field name="productId" type="id"/>
        <field name="quantity" type="number-decimal"/>
        <field name="unitPrice" type="currency-precise"/>
        <field name="totalPrice" type="currency-precise"/>
        <field name="createdDate" type="date-time"/>
        <field name="tenantId" type="id"/>
        <relationship type="one" related="moqui.marketplace.ecommerce.Order"/>
        <relationship type="one" related="moqui.marketplace.ecommerce.Product"/>
    </entity>

    <!-- 购物车 -->
    <entity entity-name="ShoppingCart" package="moqui.marketplace.ecommerce">
        <field name="cartId" type="id" is-pk="true"/>
        <field name="customerId" type="id"/>
        <field name="productId" type="id"/>
        <field name="quantity" type="number-decimal"/>
        <field name="addedDate" type="date-time"/>
        <field name="tenantId" type="id"/>
        <relationship type="one" related="moqui.marketplace.ecommerce.Product"/>
    </entity>

    <!-- 商品评价 -->
    <entity entity-name="ProductReview" package="moqui.marketplace.ecommerce">
        <field name="reviewId" type="id" is-pk="true"/>
        <field name="productId" type="id"/>
        <field name="customerId" type="id"/>
        <field name="rating" type="number-integer"/>
        <field name="reviewText" type="text-long"/>
        <field name="reviewDate" type="date-time"/>
        <field name="status" type="text-short" default="ACTIVE"/>
        <field name="tenantId" type="id"/>
        <relationship type="one" related="moqui.marketplace.ecommerce.Product"/>
    </entity>

</entities>
```

#### **服务实现规范**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/service-definition-3.xsd">

    <service verb="create" noun="Product" authenticate="false">
        <description>创建新商品</description>
        <in-parameters>
            <parameter name="productName" required="true"/>
            <parameter name="description"/>
            <parameter name="price" type="BigDecimal" required="true"/>
            <parameter name="categoryId"/>
            <parameter name="imageUrl"/>
            <parameter name="stockQuantity" type="Integer" default="0"/>
        </in-parameters>
        <out-parameters>
            <parameter name="productId"/>
        </out-parameters>
        <actions>
            <set field="productId" from="ec.entity.sequencedIdPrimary"/>
            <set field="createdDate" from="ec.user.nowTimestamp"/>
            <set field="lastUpdated" from="ec.user.nowTimestamp"/>
            <service-call name="create#moqui.marketplace.ecommerce.Product" in-map="context" out-map="context"/>
        </actions>
    </service>

    <service verb="get" noun="ProductList" authenticate="false">
        <description>获取商品列表</description>
        <in-parameters>
            <parameter name="categoryId"/>
            <parameter name="status" default="ACTIVE"/>
            <parameter name="offset" type="Integer" default="0"/>
            <parameter name="limit" type="Integer" default="20"/>
        </in-parameters>
        <out-parameters>
            <parameter name="productList" type="List"/>
            <parameter name="totalCount" type="Integer"/>
        </out-parameters>
        <actions>
            <entity-find entity-name="moqui.marketplace.ecommerce.Product" list="productList">
                <search-form-inputs default-order-by="productName"/>
                <econdition field-name="status" value="ACTIVE"/>
                <econdition field-name="categoryId" ignore-if-empty="true"/>
            </entity-find>
            <set field="totalCount" from="productList.size()"/>
        </actions>
    </service>

</services>
```

### 📊 验证要求

#### **立即验证步骤**
1. **实体验证**:
   ```bash
   ./gradlew load
   # 检查EcommerceEntities.xml加载无错误
   ```

2. **服务验证**:
   ```bash
   curl -X POST "http://localhost:8080/rest/s1/marketplace/ecommerce/create/Product" \
        -H "Content-Type: application/json" \
        -d '{"productName": "测试商品", "price": 99.99}' | jq
   ```

3. **Telegram验证**:
   ```bash
   curl -X POST "http://localhost:8080/rest/s1/mcp/telegram" \
        -H "Content-Type: application/json" \
        -d '{"message": {"text": "🛒", "chat": {"id": "123"}}}' | jq
   ```

4. **Chrome MCP验证**:
   ```bash
   ./testing-tools/chrome_mcp_auth_proxy.sh
   # 验证电商功能在Web控制台中显示
   ```

### 🎯 本周目标

**Week 1结束时的交付标准**:
- ✅ Telegram电商子菜单显示 (已完成)
- ✅ gradlew load完全成功 (已完成)
- ⚠️ **待完成**: 电商实体完整定义并可创建数据库表
- ⚠️ **待完成**: 基础服务REST API可用
- ⚠️ **待完成**: MCP路由正确分类电商消息

### 🚀 开始执行

**Codex立即开始**: Task E-1 - 创建`EcommerceEntities.xml`文件

**重要提醒**:
1. 系统基础已稳定，gradlew load工作正常
2. Telegram集成已完成，专注后端实现
3. 严格遵循现有架构模式
4. 每个Task完成后立即验证

**目标**: 2周内完成🛒流行电商模块，形成三角业务体系

**当前状态**: 🎯 **基础已就绪，立即启动Task E-1**
