# T-HIVE-1：HiveMind API 调研与集成方案（2025-11-05）

本文件落实《next-phase-development-plan.md》中的 **Task T-HIVE-1**，梳理 HiveMind 平台需要开放的 API、数据映射、调用架构与风险点，供后续 T-HIVE-2 实现 Telegram→HiveMind 路由时直接参考。

---

## 1. 现状盘点

| 能力 | 当前实现 | 存在问题 |
|------|----------|----------|
| 通用 HTTP 封装 | `marketplace.MarketplaceServices.call#HiveMindApi` 已封装 `HttpClient` 直连 `https://hivemind.example.com` | Base URL、认证信息硬编码，缺少重试/鉴权头管理 |
| 项目落库 | `create#HiveMindProject` 创建 WorkEffort + HiveMind Project（模拟端点） | 仅支持会展项目，缺乏项目编号/状态同步、异常回滚机制 |
| 任务生成 | `generate#ExhibitionTasks` 创建 5 个模板任务并按需推送 HiveMind | 无法根据真实里程碑调整；未保存 HiveMind taskId |
| 数据模型 | `HiveMindProject`/`ExhibitionProject` 储存同步状态 | 未记录 API payload、错误码、Webhook 令牌等信息 |

结论：已有“最小可用骨架”，但要实现实际场景，必须补齐 **API 配置化、认证与查询接口、状态回传** 等能力。

---

## 2. 推荐 API 设计

统一通过 `hivemind.api.baseUrl`（如 `https://api.hivemind.cn/v1`）+ `hivemind.api.token`（Bearer Token）访问，所有请求/响应 JSON 格式，UTF-8。

### 2.1 项目生命周期

| 请求 | 方法 & 路径 | 关键字段 | 说明 |
|------|-------------|----------|------|
| 创建项目 | `POST /projects` | `name`, `client`, `source`, `budget`, `metadata` | 返回 `projectId`, `status`, `links` |
| 更新项目 | `PATCH /projects/{projectId}` | 任意字段（预算、阶段等） | 支持并发控制 `If-Match` |
| 查询项目 | `GET /projects/{projectId}` | — | 返回最新状态、成员、任务摘要 |
| 搜索项目 | `GET /projects?externalId=LISTING123` | `externalId` | 供撮合记录跳转 |

### 2.2 任务与进度

| 请求 | 方法 & 路径 | 关键字段 |
|------|-------------|----------|
| 新建任务 | `POST /projects/{projectId}/tasks` | `name`, `sequence`, `assignedTo`, `moquiWorkEffortId` |
| 更新任务状态 | `PATCH /tasks/{taskId}` | `status`, `progress`, `actualCost` |
| 批量同步 | `POST /tasks/sync` | `tasks: [ {externalId, status} ]` |

### 2.3 沟通/文档

| 请求 | 方法 & 路径 | 用途 |
|------|-------------|------|
| `POST /projects/{projectId}/notes` | 写入 Telegram/AI 对话摘要 |
| `POST /projects/{projectId}/attachments` | 上传会话图片、语音转写结果 |
| `GET /projects/{projectId}/activity` | 拉取状态变化，用于回写 Marketplace |

### 2.4 鉴权与节流

- 统一 Bearer Token，保存在 `runtime/conf/MoquiDevConf.xml` 或 `HIVEMIND_API_TOKEN`。
- 请求需附带 `User-Agent: Moqui-Marketplace/1.0` 方便审计。
- 建议 429/5xx 触发指数退避（初始 2s，最多 5 次）。

---

## 3. 数据映射

| Moqui 实体/上下文 | HiveMind 字段 | 备注 |
|-------------------|---------------|------|
| `marketplace.listing.Listing.listingId` | `externalId` | 用于反向查询 |
| `match.matchId` | `sourceMatchId` | 在 notes/attachments 中引用 |
| `WorkEffort.workEffortId` | `moquiWorkEffortId` | Task 创建后写回 |
| `HiveMindProject.hiveMindProjectId` | `projectId` | 双向绑定主键 |
| `ListingInsight.metadataJson` | `metadata` | 传面积、预算、风格、图像标签 |
| Telegram `chatId` | `communication.channelId` | 方便会话回溯 |

需要新增字段：
- `HiveMindProject.lastPayload` / `lastResponse`（JSON）便于排错。
- `HiveMindProject.apiTokenAlias`（可选）支持多租户。
- `WorkEffortAttribute` → `HIVEMIND_TASK_ID` 保存任务映射。

---

## 4. 集成架构（建议）

1. **触发点**  
   - 匹配成功或 `matchMode=project` 手动触发 → 调用 `create#HiveMindProject`，并把 `ListingInsight`/`projectMetadata` 作为 `metadata`。
2. **任务同步**  
   - WorkEffort 子任务创建时调用 `POST /tasks`，记录 `taskId`。  
   - 任务状态变化（确认、完成）→ `PATCH /tasks/{taskId}`。
3. **沟通归档**  
   - Telegram/AI 对话通过 `notes` 接口写入 HiveMind，`source=TELEGRAM_BOT`，包含消息摘要、附件 URL、AI 意图。
4. **状态回写**  
   - 轮询或 Webhook `activity` → 更新 `HiveMindProject.syncStatus`、`match.status`，并发送 Telegram 提醒。
5. **配置管理**  
   - 在 `MoquiDevConf.xml` 增加：
     ```xml
     <hivemind>
         <api base-url="${HIVEMIND_API_URL}" token="${HIVEMIND_API_TOKEN}" timeout="15"/>
     </hivemind>
     ```
   - `call#HiveMindApi` 根据配置拼接 URL/Headers，支持 `GET/POST/PATCH`.

---

## 5. 风险 & TODO

| 风险 | 对策 |
|------|------|
| 第三方 API 不稳定 | 引入重试、熔断，失败时记录 `syncStatus=FAILED` 并展示在 InfoManagement |
| 多租户/多项目冲突 | 在 `HiveMindProject` 加 `tenantId`、`externalSource`；API 请求携带 `X-Tenant` |
| 数据泄露 | 所有日志脱敏（仅保留 projectId/matchId），Token 存入 Secrets |
| 同步延迟 | 轮询频率可配置，必要时接 Webhook；Webhook 事件需验证签名 |

---

## 6. 下一步（T-HIVE-2 提前规划）

1. **实现配置化 `call#HiveMindApi`**（base URL、token、method、retry）。  
2. **扩展 `create#HiveMindProject`** 支持多种 `projectType`（EXHIBITION/RENOVATION/ENGINEERING）。  
3. **新增 `sync#HiveMindProjectStatus` 服务**：按照 `projectId` 拉取最新状态，与 WorkEffort/Match 状态联动。  
4. **Telegram 工作流**：在 project 模式下允许 `/project status`、`/project tasks` 命令调用上述服务。  
5. **文档**：在 `docs/03-tasks/next-phase-development-plan.md` 保持进度追踪，并将 API 细节同步到 `platform-integration.md`。

---

## 7. 最新实装进度（2025-11-05）

- ✅ `marketplace.MarketplaceServices.call#HiveMindApi` 支持配置化 baseUrl/token、GET/POST/PATCH/DELETE、重试与日志，并返回原始请求/响应。  
- ✅ `create#HiveMindProject` + `generate#ProjectTasks` 已覆盖 EXHIBITION/RENOVATION/ENGINEERING 模板，且把请求/响应写入 `HiveMindProject` 扩展字段。  
- ✅ 新增 `sync#HiveMindProjectStatus` 与 `fetch#HiveMindProjectTasks` 服务，可按 `workEffortId` 或 `hiveMindProjectId` 获取状态及任务列表。  
- ✅ `runtime/conf/MoquiDevConf.xml` 增加 `hivemind.api.*` 默认配置，方便在不同环境覆盖。  
- ✅ Telegram `/project status` 与 `/project tasks` 命令串接上述服务，实现即时同步体验。  
- ✅ `monitor#HiveMindProjects` + `notify#TelegramProjectUpdate` 支持自动状态/任务提醒（默认4小时回访），任务模板可通过 `hivemind.task.templates.location` 配置自定义。  
- 🔄 待完成：引入Webhook/队列驱动的实时提醒，并开放模板管理UI。

---

## 8. 任务模板自定义指南

- **默认存放位置**: `runtime/component/moqui-marketplace/config/hivemind-task-templates.json`（已包含会展/装修/工程三个示例）。  
- **覆盖方式**: 设置 `hivemind.task.templates.location`（可放入 `MoquiDevConf.xml` 或环境变量），指向任何 JSON 文件或外部存储。  
- **格式要求**: 以项目类型为键（大写或小写皆可），每个值为任务数组，字段包括 `name`、`description`、`sequenceNum`，可额外附带 `assignedTo`、`phase` 等扩展字段。  
- **实时生效**: `generate#ProjectTasks` 调用时会读取该文件；若读取失败会退回内置默认模板并在日志中提醒。  
- **建议流程**: 在配置库创建 `config/hivemind-task-templates.json` -> 设定 property -> 通过 `/project tasks` 命令验证。

---

## 9. Webhook/消息触发方案

- **服务入口**: `marketplace.MarketplaceServices.handle#HiveMindWebhook`（`component://moqui-marketplace/service/HiveMindWebhookServices.xml`），REST路径 `/rest/s1/marketplace/webhook/hivemind`。  
- **用途**: HiveMind 项目或任务状态变更时，将 `notificationType` + `payload` 推送到 Moqui；服务会按 `hivemind.webhook.secret` 验证 SHA-256 签名（可选）。  
- **处理流程**: 定位 `HiveMindProject` → 调用 `sync#HiveMindProjectStatus`、`fetch#HiveMindProjectTasks` 刷新数据 → 若需要则触发 Telegram 提醒。  
- **Webhook 回传**: `monitor#HiveMindProjects` 支持向外部系统二次推送（配置 `hivemind.monitor.webhook.config` 或 `HIVEMIND_MONITOR_WEBHOOK`），默认样例位于 `config/hivemind-monitor-webhook.json`，可设置 URL、Token、超时时间及开关。  
- **建议做法**: 线上使用 Webhook 驱动实时提醒，定时轮询作为备用；同时保留 Telegram `/project status|tasks` 命令供人工随时查询。

---

如需更改计划，请更新 `docs/03-tasks/next-phase-development-plan.md` 并在完成每个阶段后再次复核。当前文档可作为 Phase 4 实装的基准说明。 
