# 智能供需平台 AI 整合总览

本文描绘“AI 驱动打通 HiveMind、POP/Ecommerce、Marble ERP 三大平台”的总体蓝图，作为后续路线图与任务拆解的统一参照。

---

## 1. 愿景目标

- **一体化体验**：用户（商户/项目方）在任一入口（Telegram、Rocket.Chat、WeChat、Web）提出需求后，AI 代理自动识别业务类型并调度对应平台能力。
- **全程可追踪**：长周期项目落地到 HiveMind，商品交易链路沉淀在 POP/Ecommerce，生产制造数据同步到 Marble ERP。
- **数据闭环**：统一身份、合同、库存、工单等数据模型，沉淀为可学习的企业知识库，持续优化匹配与决策。

---

## 2. 平台能力视图

| 平台 | 核心场景 | AI 接入点 | 推进重点 |
| --- | --- | --- | --- |
| **HiveMind 项目管理** | 装修施工、软件定制等长周期项目 | 意图识别 → 项目模板选择 → 阶段里程碑更新 | 需求澄清对话、多阶段待办同步、进度/成本追踪 |
| **POP/Ecommerce（含 POPC/ERP）** | 商品上下架、订单撮合、供应链管理 | AI 帮助生成/优化 Listing、库存同步、自动回复售后问答 | 商品知识库、库存状态实时读取、订单异常告警 |
| **Marble ERP** | 生产制造、工厂内部计划与物料 | 生产工单生成、物料需求分析、质量反馈整合 | 物料 BOM 数据接口、车间任务跟踪、产能预测 |

---

## 3. 顶层架构规划

```
┌──────────────────────────────┐
│ AI Orchestration Layer        │
│ • Telegram/RocketChat/WX Bot  │
│ • MCP Server & Tool Registry  │
│ • 意图识别 / 多模态处理        │
└───────────────┬──────────────┘
                │    AI Tool 调用
┌───────────────▼──────────────┐
│ Unified Service Gateway       │
│ • marketplace.* API           │
│ • hiveMind.* API              │
│ • popc/marble.* API           │
│ • 数据同步/事件总线            │
└───┬──────────────┬───────────┘
    │              │
┌───▼───┐    ┌─────▼─────┐   ┌─────────▼─────────┐
│ HiveMind│    │ POP/Ecommerce│   │ Marble ERP         │
│ 项目管理 │    │ 交易与供应链 │   │ 生产与物料管理     │
└────────┘    └───────────┘   └──────────────────┘
```

---

## 4. 三大集成主线

### 4.1 交互渠道统一
1. **MVP**：Telegram 闭环（文字 + 语音转写 + 图片识别），将供需撮合写入平台数据。
2. **扩展**：Rocket.Chat / WeChat / Twitter 复用同一意图层，通过适配器映射消息→意图。
3. **多模态处理**：语音、图片、文档统一走 AI 预处理 → 结构化意图 → 服务调用。

### 4.2 业务服务编排
1. **Marketplace/POP**：发布供应/需求 → 匹配 → 订单/合同 → ERP/项目同步。
2. **HiveMind**：复杂需求自动创建项目，附带里程碑、责任人、预算、附件。
3. **Marble ERP**：订单/项目确认后生成生产工单、物料需求、产能计划。

### 4.3 数据与知识融合
1. **身份与主体**：统一 Party、Contact、组织结构，跨平台识别同一客户/商户。
2. **文档与附件**：将合同、图纸、语音转写、图片识别结果归档到 HiveMind/POP。
3. **反馈闭环**：订单状态、生产进度、验收结果回流至 AI，持续优化推荐与提醒。

---

## 5. 分阶段路线图

### Phase 0 – 基线梳理（完成）
- Telegram Webhook / Marketplace MCP 基础可用。
- Marketplace 服务骨架与实体模型建立。

### Phase 1 – Telegram MVP（进行中）
- 打通 `create/find/confirm` 等核心服务与 Telegram 命令。
- 语音/图片转写结果回填，并在 HiveMind 中记录对话节点。
- Marketplace ↔ HiveMind 建立最小映射：一次撮合 = 一个项目。

### Phase 2 – HiveMind 项目模板化
- 为装修/软件定制构建标准项目模板（阶段、待办、文件清单）。
- 引入自动里程碑更新与提醒，成本/工时初步统计。
- 引导用户在 Telegram 中逐步补全项目信息，写入 HiveMind。

### Phase 3 – POP/Ecommerce 协同
- AI 协助建立商品资料、库存同步、订单状态变更通知。
- Marketplace 匹配成功自动生成订单草稿，关联库存/采购计划。
- 客户对话中的 FAQ/售后问题接入 POP 知识库。

### Phase 4 – Marble ERP 深度整合
- 订单/项目生成生产工单、BOM、物料需求。
- AI 根据生产进度提醒交付风险，调整计划。
- 生产反馈（质检、退料、产能变化）反向同步到项目/客户沟通。

### Phase 5 – 自主优化与生态扩展
- 基于历史数据训练匹配/预测模型，支持跨平台推荐。
- 引入第三方插件或行业工具，实现场景化生态。
- 策略与权限治理、审计合规、跨企业协作。

---

## 6. 当前优先任务（2025 Q4）

1. **Telegram 闭环**  
   - 修正 `MarketplaceMcpService` 参数缺失、记录持久化问题。  
   - 明确定义 `/supply` `/demand` `/match` 等指令与服务调用映射。  
   - 完成语音、图片的调用链（下载 → 识别 → 结构化意图）。

2. **HiveMind 项目落地**  
   - 设计“装修/软件定制”项目模板，明确字段/阶段。  
   - 实现 Marketplace → HiveMind 的项目创建/更新 API。  
   - 将对话日志、合同、附件统一挂载到项目节点。

3. **数据共享机制**  
   - 梳理 Party、Listing、Order、Project 的跨平台主键策略。  
   - 建立事件或任务队列，记录待同步事项。  

> 详细任务拆解见 `docs/intelligent-supply-demand/ROADMAP.md`（待补充）。

---

## 7. 文档与协作指引

- 顶层规划：本文件（持续更新，变更请记录到 `docs/progress-log.md`）。
- 频道适配 & 多模态：`docs/intelligent-supply-demand/README.md` + 专项调试笔记。
- HiveMind 项目模板：`docs/hivemind/`（待新增）。
- POP/Marble 接口与实体：参考各组件 `runtime/component/*` 下的 README 与 docs。
- 任何里程碑或重大决策请同步到 `docs/progress-log.md`，确保团队共识。

---

*最后更新：2025-11-03*  
*维护者：AI Assistant / 项目技术负责人*
