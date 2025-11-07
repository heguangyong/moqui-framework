# Tab 页面收敛规划（更新版）

## 1. 当前结构概览

现有 `marketplace.xml` 仍挂载 7 个子页面（Dashboard、Supply、Demand、Matching、Chat、TelegramAdmin、TestDataInit）。Phase 1 已完成 Dashboard 重构与项目服务骨架，但页面布局尚未调整。后续目标是将页面压缩为“核心 4 + 管理 1”的项目化结构。

## 2. 已完成工作

- Dashboard 已替换为项目统计视图，移除裸 `div`。  
- 项目检测 / HiveMind 项目服务已落地，可供 Matching、Chat 复用。  
- 文档：Phase1 实施与核验报告已更新。

## 3. 待执行收敛任务

| 编号 | 新结构 | 当前页面 | 状态/说明 |
|------|--------|----------|-----------|
| T1 | 项目总览 (Dashboard) | Dashboard | ✅ 已完成基础改造，后续补充项目统计服务调用 |
| T2 | 信息管理 (Info Management) | Supply + Demand | ✅ 已上线 `InfoManagement.xml`，原 Supply/Demand 暂保留隐藏入口 |
| T3 | 智能匹配 (Project Matching) | Matching | 🔄 待集成项目检测/HiveMind服务 |
| T4 | AI 项目助手 (AI Assistant) | Chat | 🔄 待对接项目服务、多模态增强 |
| T5 | 系统管理 (System Admin) | TelegramAdmin + TestDataInit | 🔄 待合并，并限制为开发/管理员可见 |

## 4. 任务说明

### T2 信息管理 (`marketplace/InfoManagement.xml`)
目标：将供应、需求管理合并为同一界面，预留项目关联。

关键点：
- 采用 `<container style="q-tabs">` 实现 Supply / Demand / Project 三个选项卡。
- 引入列表复用现有 `Supply.xml` 与 `Demand.xml` 中的 form-list；去除重复表单。
- 项目信息 tab 后续与 WorkEffort 显示对接。

### T3 智能匹配 (`marketplace/Matching.xml`)
目标：引导用户从项目角度进行撮合。

需要完成：
1. 增加匹配模式（传统 vs 项目），默认项目模式。  
2. 调用 `marketplace.MarketplaceServices.detect#ProjectType`，自动识别描述并预填 `projectType`。  
3. 匹配成功后调用 `create#HiveMindProject` 与 `generate#ExhibitionTasks`。  
4. 兼容语音/图片输入（后续对接 MCP 多模态服务）。

### T4 AI 项目助手 (`marketplace/Chat.xml`)
目标：AI 聊天聚焦项目闭环。

需要完成：
1. 调整 UI，突出“项目咨询 / 需求收集 / 执行跟踪”三类对话入口。  
2. 对接 `detect#ProjectType` 把聊天内容转化为结构化需求。  
3. 支持一键创建/关联项目（调用 `create#HiveMindProject`）。  
4. 多模态扩展：语音转写、图片识别入口（复用 MCP 服务）。

### T5 系统管理 (`marketplace/SystemAdmin.xml`)
目标：合并后台工具。

内容：
- Telegram Bot 状态监控、Webhook 配置  
- 数据初始化、测试数据清理  
- 权限：仅管理员显示 (`menu-include="false"` + 角色判断)

## 5. 导航调整

待完成上述页面后，需要更新 `marketplace.xml` 的 `subscreens`：

```xml
<subscreens default-item="Dashboard">
    <subscreens-item name="Dashboard" menu-title="项目总览" location="component://moqui-marketplace/screen/marketplace/Dashboard.xml"/>
    <subscreens-item name="Chat" menu-title="AI 项目助手" location="component://moqui-marketplace/screen/marketplace/Chat.xml"/>
    <subscreens-item name="Matching" menu-title="智能匹配" location="component://moqui-marketplace/screen/marketplace/Matching.xml"/>
    <subscreens-item name="InfoManagement" menu-title="信息管理" location="component://moqui-marketplace/screen/marketplace/InfoManagement.xml"/>
    <subscreens-item name="SystemAdmin" menu-title="系统管理" location="component://moqui-marketplace/screen/marketplace/SystemAdmin.xml" menu-include="false"/>
</subscreens>
```

## 6. 建议执行顺序

1. **T2 信息管理**：整合 Supply/Demand 表单，快速减少导航分散。  
2. **T3 智能匹配**：利用现有项目服务完成闭环。  
3. **T4 AI 项目助手**：配合多模态需求，安排在 MCP 联调阶段。  
4. **T5 系统管理**：最后合并后台页面。  

执行过程中注意：
- 保持新增服务引用统一使用 `marketplace.MarketplaceServices.*`。  
- 新页面采用 Quasar 布局元素（`q-tabs`、`q-card` 等），保持与 Dashboard 风格一致。  
- 每个 Tab 改造完成后，更新进度日志与核验报告。
#### 4. 保留但隐藏
- `marketplace/Supply.xml` → 保留文件，从导航隐藏
- `marketplace/Demand.xml` → 保留文件，从导航隐藏
- `marketplace/TelegramAdmin.xml` → 保留文件，从导航隐藏
- `marketplace/TestDataInit.xml` → 设置menu-include="false"

---

## 🔄 执行时间安排

### **Week 1: 基础整理**
- Day 1-2: Task A1 (Dashboard升级)
- Day 3-4: Task A2 (信息管理合并)
- Day 5: Task A5 (系统管理合并)

### **Week 2: 功能增强**
- Day 1-3: Task A3 (智能匹配升级)
- Day 4-5: Task A4 (AI助手升级)

### **Week 3: 集成测试**
- Day 1-2: 各页面功能验证
- Day 3-4: 项目管理流程端到端测试
- Day 5: Chrome MCP完整验证

---

## 📊 验收标准

### **功能验收**
- ✅ 4个主要Tab功能完整，响应正常
- ✅ 项目管理工作流程端到端可用
- ✅ Chrome MCP验证无页面错误
- ✅ 所有API调用返回正确响应

### **用户体验验收**
- ✅ 导航逻辑清晰，符合项目管理直觉
- ✅ 页面加载速度 < 2秒
- ✅ 移动端响应式布局正常
- ✅ 无JavaScript错误和Vue警告

### **业务价值验收**
- ✅ 支持会展搭建项目完整生命周期
- ✅ AI助手能正确识别和创建项目
- ✅ 智能匹配能推荐合适的项目供应商
- ✅ 项目总览提供有效的管理视图

---

## 🎯 预期效果

### **用户体验提升**
- 从6个分散页面 → 4个核心功能区
- 从传统撮合界面 → 现代项目管理界面
- 从手动操作 → AI辅助的智能化操作

### **业务流程优化**
- 项目识别 → 项目创建 → 供应商匹配 → 项目执行 → 项目交付
- 统一的项目管理视图和操作界面
- 多模态AI助手贯穿整个项目生命周期

---

*整理规划版本: v1.0*
*创建时间: 2025-11-03*
*执行周期: 3周*
*优先级: Phase 2核心任务*
