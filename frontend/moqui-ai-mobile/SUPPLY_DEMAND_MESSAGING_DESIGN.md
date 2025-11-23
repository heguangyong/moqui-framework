# 供需消息系统 - 设计文档

## 🎯 产品定位
一个专注于**消息发布与匹配**的轻量级供需平台，让用户能够：
- 📢 快速发布供应/需求消息
- 🔍 浏览相关供需信息
- 🤖 获得AI智能匹配推荐
- 💬 简单联系沟通

## 🏗️ 功能架构

### 核心流程
```
用户发布消息 → AI分析标签 → 智能匹配推荐 → 用户联系沟通
```

### 页面结构
```
src/pages/marketplace/
├── MessageSquare.vue          # 消息广场（主页面）
├── PublishMessage.vue         # 发布消息
├── MessageDetail.vue          # 消息详情
├── SmartMatching.vue         # 智能匹配
└── MessageContact.vue        # 联系沟通
```

## 📱 界面设计

### 1. 消息广场 (MessageSquare.vue)
- **布局**: 卡片式瀑布流
- **筛选**: 供应/需求标签切换
- **搜索**: 关键词搜索
- **操作**: 查看详情、一键联系

### 2. 发布消息 (PublishMessage.vue)
- **表单字段**:
  - 消息类型：供应/需求选择
  - 标题：简短标题（必填）
  - 描述：详细描述（必填）
  - 分类：下拉选择（可选）
  - 地区：地区选择（可选）
  - 联系方式：手机/微信（必填）

### 3. 智能匹配 (SmartMatching.vue)
- **匹配卡片**: 显示匹配的消息
- **匹配度**: 百分比评分
- **匹配原因**: AI分析说明
- **操作按钮**: 查看详情、联系对方

### 4. 消息详情 (MessageDetail.vue)
- **完整信息**: 标题、描述、分类、地区
- **标签显示**: AI提取的关键标签
- **联系按钮**: 电话、微信等联系方式
- **相关推荐**: 类似的供需消息

## 🤖 AI功能集成

### 1. 智能标签提取
- **API**: `POST /marketplace/tag/extract`
- **功能**: 从消息描述中提取关键词标签
- **用途**: 用于智能匹配算法

### 2. 智能匹配算法
- **API**: `GET /marketplace/match/find`
- **算法**: 基于标签相似度、地区匹配、类型互补
- **输出**: 匹配度评分 + 推荐理由

## 🔗 API端点使用

### 消息相关
- `POST /marketplace/listing` - 发布消息
- `GET /marketplace/listing` - 获取消息列表
- `GET /marketplace/listing/{id}` - 获取消息详情

### AI功能
- `POST /marketplace/tag/extract` - 标签提取
- `GET /marketplace/match/find` - 智能匹配

### 统计数据
- `GET /marketplace/stats` - 平台统计

## 📊 数据模型

```typescript
interface Message {
  id: string
  type: 'supply' | 'demand'
  title: string
  description: string
  category?: string
  location?: string
  tags: string[]
  contactInfo: {
    phone?: string
    wechat?: string
    email?: string
  }
  publishTime: Date
  status: 'active' | 'inactive' | 'completed'
  publisherInfo: {
    userId: string
    nickname?: string
  }
}

interface MatchResult {
  messageId: string
  message: Message
  matchScore: number
  matchReason: string[]
}
```

## 🎨 UI/UX设计原则

1. **简洁优先**: 界面简单，操作直观
2. **移动友好**: 针对手机屏幕优化
3. **快速发布**: 最少步骤发布消息
4. **智能推荐**: AI帮助发现相关信息
5. **便捷联系**: 一键联系，降低沟通门槛

## 📱 移动端特性

- **拍照功能**: 支持拍照添加图片（未来扩展）
- **地理位置**: 自动获取用户位置
- **推送通知**: 匹配消息通知（未来扩展）
- **离线缓存**: 重要消息本地缓存

## 🚀 实施计划

### Phase 2A: 基础消息系统 (1-2周)
1. 创建消息广场界面
2. 实现发布消息功能
3. 基础的消息列表和详情

### Phase 2B: AI智能匹配 (1周)
1. 集成标签提取API
2. 实现智能匹配算法
3. 匹配结果展示

### Phase 2C: 联系沟通 (1周)
1. 联系方式展示
2. 简单留言功能
3. 消息状态管理

这种设计专注于消息的发布、匹配和联系，避免了复杂的业务流程，符合您提出的"消息面内容"的边界要求。