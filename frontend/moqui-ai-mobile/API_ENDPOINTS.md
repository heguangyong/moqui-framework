# Moqui AI Mobile - API端点文档 (Swagger规范验证版)

## 🔗 已验证的API端点

### 1. JWT认证端点 ✅ 验证通过
- **端点**: `POST /rest/s1/moqui/auth/login`
- **功能**: JWT令牌获取
- **Swagger**: `POST /moqui/auth/login` (统一认证登录)
- **请求格式**:
  ```json
  {
    "username": "john.doe",
    "password": "moqui"
  }
  ```
- **响应格式**:
  ```json
  {
    "expiresIn": 7200,
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Login successful",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. JWT Token验证端点 ✅ 验证通过 (已修正)
- **端点**: `GET /rest/s1/moqui/auth/verify`
- **功能**: 验证JWT令牌有效性
- **Swagger**: `GET /moqui/auth/verify` (统一认证验证)
- **认证**: 需要 `Authorization: Bearer <token>`
- **响应格式**:
  ```json
  {
    "authenticated": true,
    "authMethod": "JWT",
    "message": "JWT authentication successful",
    "userId": "EX_JOHN_DOE",
    "username": "john.doe"
  }
  ```

### 3. 市场统计端点 ✅ 验证通过
- **端点**: `GET /rest/s1/marketplace/stats`
- **功能**: 获取供需匹配平台统计数据
- **Swagger**: `GET /marketplace/stats` (获取商家统计数据)
- **认证**: 需要会话认证或JWT令牌
- **可选参数**: `merchantId`, `listingId`
- **响应数据**:
  ```json
  {
    "activeDemandListings": 0,
    "totalReviews": 28,
    "totalSupplyListings": 0,
    "activeSupplyListings": 0,
    "totalDemandListings": 0,
    "pendingMatches": 3,
    "completedTransactions": 12,
    "averageRating": 4.3,
    "totalRevenue": 45680.50,
    "totalMatches": 15
  }
  ```

### 4. 基础连接端点 ✅ 验证通过
- **端点**: `HEAD /Login`
- **功能**: 检查Moqui后端连接状态
- **认证**: 无需认证
- **响应**: HTTP 200 表示后端正常运行

## 🎯 Swagger UI访问地址

### Moqui官方Swagger界面
- **主入口**: http://localhost:8080/qapps/tools/dashboard → "REST API: Swagger UI"
- **Marketplace API**: http://localhost:8080/toolstatic/lib/swagger-ui/index.html?url=http://localhost:8080/rest/service.swagger/marketplace
- **Moqui核心API**: http://localhost:8080/toolstatic/lib/swagger-ui/index.html?url=http://localhost:8080/rest/service.swagger/moqui

## 🆕 可扩展API端点 (已在Swagger中发现)

### 认证功能扩展
- `POST /moqui/auth/logout` - 登出功能
- `POST /moqui/auth/refresh` - 刷新access token

### Marketplace AI功能
- `POST /marketplace/image` - AI图像分析
- `POST /marketplace/tag/extract` - 智能标签提取
- `GET /marketplace/match/find` - 智能供需匹配
- `POST /marketplace/match/confirm` - 确认匹配
- `POST /marketplace/listing` - 创建供需信息
- `POST /marketplace/order` - 创建订单

### 高级统计功能
- `GET /marketplace/stats-v2` - 增强版统计数据
- `GET /marketplace/stats/matching` - 匹配专项统计

## 🛠️ 前端开发服务器信息

- **开发地址**: http://localhost:5174/
- **API测试页面**: http://localhost:5174/api-test
- **Vue DevTools**: http://localhost:5174/__devtools__/

## 📱 测试账户信息

- **用户名**: john.doe
- **密码**: moqui
- **认证方式**: JWT Bearer Token

## ⚙️ API客户端配置

### 基础配置
- **Base URL**: http://localhost:8080
- **超时设置**: 10000ms
- **认证方式**: JWT Bearer Token
- **Content-Type**: application/json

### 统一认证机制
- **Authorization Header**: `Bearer <jwt_token>`
- **支持认证类型**: JWT, API Key, Session
- **安全定义**: jwtAuth (Header模式)

### CORS配置
前端开发服务器(5174)需要与后端Moqui服务器(8080)进行跨域通信，已在开发环境中配置代理。

## ✅ API一致性验证结果

### 与Swagger文档对比
✅ **高度一致**: 我们的前端API调用与Moqui官方Swagger规范完全匹配
✅ **端点修正**: 已将 `/auth/validate` 修正为 `/auth/verify`
✅ **参数规范**: 所有请求/响应格式与Swagger定义一致
✅ **认证机制**: JWT Bearer Token实现与官方规范完全对应

### API设计质量
- **标准化**: 遵循Swagger 2.0规范
- **完整性**: 提供完整的认证、业务和AI功能
- **扩展性**: 大量高级功能端点可供未来开发
- **可维护性**: 清晰的API分组和版本管理

Moqui Framework的API设计非常专业和完整，为AI+移动应用开发提供了强大的后端支撑！