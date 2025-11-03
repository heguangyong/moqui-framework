# 智能供需平台 - Telegram MVP 闭环任务板

依据《AI_PLATFORM_INTEGRATION_PLAN》中的 Phase 1，本表列出 Telegram MVP 需要落实的业务指令、后端服务与待解决问题，便于 Sprint 执行与跟踪。

---

## 1. 指令与服务映射清单

| 目标 | 入口示例 | 应调用的 Moqui 服务 | 当前问题 / 待办 |
| --- | --- | --- | --- |
| 发布供应 | `/supply`、`我要供应30吨钢材` | `marketplace.SupplyDemandServices.create#SupplyListing`（或 `marketplace.MarketplaceServices.create#Listing`） | `MarketplaceMcpService` 未传 `publisherType`、`category`；语义解析仅支持少量中文关键词，需要命令化入口。 |
| 发布需求 | `/demand`、`我要采购200件灯具` | `marketplace.SupplyDemandServices.create#DemandListing` | 同上。补充必填字段、校验逻辑。 |
| 查找匹配 | `/match SUPPLY_001`、`帮我匹配买家` | `marketplace.MarketplaceServices.find#Matches` + `marketplace.MatchingServices.find#MatchesForListing` | 当前使用旧的 `marketplace.process#AllMatching`，未创建 Match 记录，应改用新服务并持久化。 |
| 确认撮合 | `/confirm MATCH_123`、`联系买家` | `marketplace.MarketplaceServices.confirm#Match` → `MatchingServices.confirm#MatchAndNotify` | 需确保确认前有匹配记录，通知服务应返回联系人信息。 |
| 查看统计 | `/stats`、`查看数据统计` | `marketplace.MarketplaceServices.get#MatchingStats` & `get#MerchantStatistics` | 现有方法仍返回硬编码数据，需要统一回真实实体。 |
| 项目化落地 | 匹配成功后自动 | HiveMind 相关 API（待定义） | 衔接 HiveMind：创建项目、记录里程碑、挂载对话/附件。 |

---

## 2. 待解决技术点

### 2.1 参数与数据建模
- **publisherType / category**：在 Telegram 命令模式下显式收集（命令参数或引导式对话）。
- **Match 持久化**：在 `MatchingServices.find#MatchesForListing` 中写入 `marketplace.match.Match`，返回 `matchId`。
- **订单流程**：确认撮合后，生成 `MatchOrder` 草稿并告知下一步（HiveMind 项目 or POP 订单）。

### 2.2 多模态处理
- **语音**：`processVoiceMessage` 目前仅提示文字输入 → 集成语音转写服务，返回文本再进入意图解析。
- **图片**：下载后调用图像识别，抽取品类 / 规格标签 → 调用 `marketplace.TagServices.extract#TagsUsingAI` 进行补充。
- **文档**：同样走附件下载 → 识别服务 → 提取关键信息写入 HiveMind/Listing。

### 2.3 HiveMind 同步
- 确定“装修施工”“软件定制”等项目模板：阶段（需求确认→方案→执行→验收）、字段（预算、联系人）。
- Telegram 确认撮合后：新建项目 / 追加任务，附带聊天记录、图片、语音文本、合同文件。
- 设计状态映射：匹配成功 → HiveMind 项目状态更新 → 反向同步到 Telegram 提醒。

---

## 3. 实施优先级（Sprint 建议）

1. **P0**（本周期必须完成）
   - [ ] `/supply` 指令：解析 `/supply 产品 数量 价格`，调用 `SupplyDemandServices.create#SupplyListing`，补齐 `publisherType="MERCHANT"`、`category` 映射，失败时给出缺少字段提示。
   - [ ] `/demand` 指令：同上，调用 `DemandListing` 服务，支持中文自然语句 fallback。
   - [ ] `/match {listingId}`：校验 ID → 调用 `MatchingServices.find#MatchesForListing`，若 `matchId` 不存在则创建并持久化。
   - [ ] `/confirm {matchId}`：调用 `MatchingServices.confirm#MatchAndNotify`，返回对方联系方式，写入 HiveMind 待跟进任务（占位）。
   - [ ] `/stats`：聚合 `get#MerchantStatistics` + `get#MatchingStats` 返回真实数据，补齐实体查询字段的 bug。
   - [ ] 修复 `MarketplaceMcpService` 中 `handlePublishSupply/handlePublishDemand` 传参缺失，未匹配时返回结构化补充提示。

2. **P1**
   - [ ] 语音链路试点：`语音输入 → Telegram 下载 → 语音转写服务 → 意图解析 → `/supply` 流程`，输出示例日志与用户提示。
   - [ ] 图片链路试点：`图片输入 → 下载 → 图像识别标签 → 自动补全 listing 字段`，可落地为 `/supply` 前置步骤。
   - [ ] 匹配确认 → HiveMind：设计“装修/软件定制”项目模板并在确认后创建项目、写入里程碑（允许先写入占位字段）。

3. **P2**
   - [ ] POP/Ecommerce 对接：匹配成功后生成订单草稿，通知库存/供应链并返回给 Telegram。
   - [ ] Marble ERP 对接：订单确认后生成生产工单/物料计划，回推状态给 HiveMind & Telegram。

---

## 4. 后续文档与跟踪

- 任务状态更新请同步到 `docs/progress-log.md`。
- 详细实现笔记（接口返回、调试日志）继续记录在 `docs/intelligent-supply-demand/README.md`。
- 复杂项目模板、HiveMind 集成细节将新增到 `docs/hivemind/`（待建目录）。

---

*最后更新：2025-11-03*  
*维护者：AI Assistant*
