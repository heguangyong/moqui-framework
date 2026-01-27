# 系统集成规范 - 前后端功能同步与验证

## 概述

本规范旨在系统性梳理小说动漫生成器（Novel Anime Generator）的前后端功能，确保所有功能模块完整、同步、可用。通过闭环验证流程，移除遗留代码和 mock 数据，实现真正的前后端联调。

## 术语表

- **Novel_Anime_System**: 小说动漫生成系统
- **Frontend**: Vue.js 3 + Quasar 前端应用
- **Backend**: Moqui Framework 后端服务
- **Workflow**: 工作流，定义小说到动漫的转换流程
- **Pipeline**: 处理管道，执行工作流的具体步骤
- **Asset**: 资源，包括图片、音频、视频等

---

## 需求

### 需求 1: 用户认证与会话管理

**用户故事:** 作为用户，我希望能够安全登录系统并保持会话状态，以便访问我的项目和数据。

#### 验收标准

1. WHEN 用户提交有效的用户名和密码 THEN Novel_Anime_System SHALL 返回 JWT token 并存储到 localStorage
2. WHEN 用户访问需要认证的页面且未登录 THEN Novel_Anime_System SHALL 重定向到登录页面
3. WHEN 用户已登录并访问登录页面 THEN Novel_Anime_System SHALL 重定向到仪表盘
4. WHEN 用户点击登出 THEN Novel_Anime_System SHALL 清除 token 并重定向到登录页面
5. WHEN JWT token 过期 THEN Novel_Anime_System SHALL 自动刷新 token 或提示重新登录
6. IF 后端服务不可用 THEN Novel_Anime_System SHALL 显示连接错误提示

### 需求 2: 仪表盘与项目概览

**用户故事:** 作为用户，我希望在仪表盘看到项目状态和快速操作入口，以便高效管理我的工作。

#### 验收标准

1. WHEN 用户访问仪表盘 THEN Novel_Anime_System SHALL 显示系统状态（后端连接、AI服务状态）
2. WHEN 用户访问仪表盘 THEN Novel_Anime_System SHALL 显示当前进行中的项目及其进度
3. WHEN 用户访问仪表盘 THEN Novel_Anime_System SHALL 显示最近项目列表（最多5个）
4. WHEN 用户点击"导入小说"步骤 THEN Novel_Anime_System SHALL 打开文件选择对话框
5. WHEN 用户成功导入小说 THEN Novel_Anime_System SHALL 创建项目并更新步骤状态
6. WHEN 用户点击"开始解析" THEN Novel_Anime_System SHALL 调用后端 AI 分析服务
7. WHEN 用户点击"查看角色" THEN Novel_Anime_System SHALL 导航到角色管理页面
8. WHEN 用户点击"开始生成" THEN Novel_Anime_System SHALL 导航到工作流编辑器
9. WHEN 项目状态为"已完成" THEN Novel_Anime_System SHALL 显示"查看结果"和"新建项目"按钮

### 需求 3: 项目管理

**用户故事:** 作为用户，我希望能够创建、查看、编辑和删除项目，以便组织我的小说转换工作。

#### 验收标准

1. WHEN 用户请求项目列表 THEN Novel_Anime_System SHALL 从后端获取并显示用户的所有项目
2. WHEN 用户创建新项目 THEN Novel_Anime_System SHALL 调用后端 API 创建项目并返回项目ID
3. WHEN 用户查看项目详情 THEN Novel_Anime_System SHALL 显示项目的小说、章节、角色信息
4. WHEN 用户更新项目信息 THEN Novel_Anime_System SHALL 调用后端 API 更新并刷新显示
5. WHEN 用户删除项目 THEN Novel_Anime_System SHALL 确认后调用后端 API 删除项目

### 需求 4: 小说导入与解析

**用户故事:** 作为用户，我希望能够导入小说文件并自动解析章节结构，以便进行后续处理。

#### 验收标准

1. WHEN 用户选择 TXT/DOCX/PDF 文件 THEN Novel_Anime_System SHALL 读取文件内容
2. WHEN 文件内容读取成功 THEN Novel_Anime_System SHALL 调用后端 import-text API 创建小说
3. WHEN 小说创建成功 THEN Novel_Anime_System SHALL 存储 novelId 到 localStorage
4. WHEN 用户点击"开始解析" THEN Novel_Anime_System SHALL 调用后端 analyze-structure API
5. WHEN 结构分析完成 THEN Novel_Anime_System SHALL 调用后端 extract-characters API 提取角色
6. WHEN 解析完成 THEN Novel_Anime_System SHALL 更新项目状态为 "parsed" 并显示进度
7. IF 解析失败 THEN Novel_Anime_System SHALL 显示错误信息并允许重试

### 需求 5: 角色管理

**用户故事:** 作为用户，我希望能够查看和编辑 AI 识别的角色信息，以便确保角色数据准确。

#### 验收标准

1. WHEN 用户访问角色管理页面 THEN Novel_Anime_System SHALL 从后端获取角色列表
2. WHEN 用户查看角色详情 THEN Novel_Anime_System SHALL 显示角色的名称、描述、外貌、性格等信息
3. WHEN 用户编辑角色信息 THEN Novel_Anime_System SHALL 调用后端 API 更新角色
4. WHEN 用户锁定角色 THEN Novel_Anime_System SHALL 调用后端 API 设置 isLocked 标志
5. WHEN 用户合并角色 THEN Novel_Anime_System SHALL 调用后端 merge API 合并重复角色
6. WHEN 用户确认角色 THEN Novel_Anime_System SHALL 更新项目状态为 "characters_confirmed"

### 需求 6: 工作流管理

**用户故事:** 作为用户，我希望能够创建和管理工作流，以便定义小说到动漫的转换流程。

#### 验收标准

1. WHEN 用户访问工作流页面 THEN Novel_Anime_System SHALL 从后端获取工作流列表
2. WHEN 用户创建新工作流 THEN Novel_Anime_System SHALL 调用后端 API 创建并返回 workflowId
3. WHEN 用户添加节点 THEN Novel_Anime_System SHALL 更新工作流的 nodesJson
4. WHEN 用户连接节点 THEN Novel_Anime_System SHALL 更新工作流的 connectionsJson
5. WHEN 用户保存工作流 THEN Novel_Anime_System SHALL 调用后端 API 保存工作流配置
6. WHEN 用户删除工作流 THEN Novel_Anime_System SHALL 确认后调用后端 API 删除
7. WHEN 用户选择模板 THEN Novel_Anime_System SHALL 基于模板创建工作流并添加预设节点

### 需求 7: 工作流执行

**用户故事:** 作为用户，我希望能够执行工作流并查看执行进度，以便生成动漫内容。

#### 验收标准

1. WHEN 用户点击"运行"按钮 THEN Novel_Anime_System SHALL 验证工作流配置
2. WHEN 工作流验证通过 THEN Novel_Anime_System SHALL 创建执行记录并开始执行
3. WHILE 工作流执行中 THEN Novel_Anime_System SHALL 显示执行进度和当前节点状态
4. WHEN 节点执行完成 THEN Novel_Anime_System SHALL 更新节点状态并传递数据到下一节点
5. WHEN 工作流执行完成 THEN Novel_Anime_System SHALL 更新执行记录状态并显示结果
6. IF 执行失败 THEN Novel_Anime_System SHALL 记录错误信息并允许重试
7. WHEN 用户取消执行 THEN Novel_Anime_System SHALL 停止执行并更新状态为 "cancelled"

### 需求 8: 生成结果查看

**用户故事:** 作为用户，我希望能够查看工作流生成的内容，以便预览和导出结果。

#### 验收标准

1. WHEN 用户访问生成结果页面 THEN Novel_Anime_System SHALL 加载最近执行的结果数据
2. WHEN 结果数据加载成功 THEN Novel_Anime_System SHALL 显示章节列表和场景内容
3. WHEN 用户选择章节 THEN Novel_Anime_System SHALL 显示该章节的所有场景
4. WHEN 用户选择场景 THEN Novel_Anime_System SHALL 显示场景的详细信息（标题、设定、角色、内容）
5. WHEN 用户点击"导出" THEN Novel_Anime_System SHALL 生成并下载结果文件

### 需求 9: 资源管理

**用户故事:** 作为用户，我希望能够管理项目中的各类资源，以便在生成过程中使用。

#### 验收标准

1. WHEN 用户访问资源库页面 THEN Novel_Anime_System SHALL 从后端获取资源列表
2. WHEN 用户上传资源 THEN Novel_Anime_System SHALL 调用后端 API 创建资源记录
3. WHEN 用户按类型筛选 THEN Novel_Anime_System SHALL 显示对应类型的资源
4. WHEN 用户删除资源 THEN Novel_Anime_System SHALL 确认后调用后端 API 删除
5. WHEN 用户查看资源详情 THEN Novel_Anime_System SHALL 显示资源的元数据和预览

### 需求 10: 用户设置

**用户故事:** 作为用户，我希望能够配置个人偏好设置，以便个性化使用体验。

#### 验收标准

1. WHEN 用户访问设置页面 THEN Novel_Anime_System SHALL 从后端获取用户设置
2. WHEN 用户修改主题设置 THEN Novel_Anime_System SHALL 调用后端 API 更新并应用主题
3. WHEN 用户修改语言设置 THEN Novel_Anime_System SHALL 调用后端 API 更新并切换语言
4. WHEN 用户修改通知设置 THEN Novel_Anime_System SHALL 调用后端 API 更新通知偏好
5. IF 设置保存失败 THEN Novel_Anime_System SHALL 显示错误信息并保留原设置

### 需求 11: 工作流模板

**用户故事:** 作为用户，我希望能够使用预设模板快速创建工作流，以便提高效率。

#### 验收标准

1. WHEN 用户访问模板列表 THEN Novel_Anime_System SHALL 从后端获取内置和用户模板
2. WHEN 用户选择模板 THEN Novel_Anime_System SHALL 显示模板的节点配置和描述
3. WHEN 用户应用模板 THEN Novel_Anime_System SHALL 创建工作流并添加模板定义的节点
4. WHEN 用户保存为模板 THEN Novel_Anime_System SHALL 调用后端 API 创建用户模板
5. WHEN 用户删除用户模板 THEN Novel_Anime_System SHALL 调用后端 API 删除（内置模板不可删除）

### 需求 12: 执行历史记录

**用户故事:** 作为用户，我希望能够查看工作流的执行历史，以便追踪和分析执行情况。

#### 验收标准

1. WHEN 用户访问执行历史 THEN Novel_Anime_System SHALL 从后端获取执行记录列表
2. WHEN 用户按工作流筛选 THEN Novel_Anime_System SHALL 显示该工作流的执行记录
3. WHEN 用户查看执行详情 THEN Novel_Anime_System SHALL 显示执行日志和节点结果
4. WHEN 执行记录创建 THEN Novel_Anime_System SHALL 记录开始时间、节点数量等信息
5. WHEN 执行完成 THEN Novel_Anime_System SHALL 记录结束时间、耗时、状态等信息

---

## 前后端接口映射

### 已实现的后端接口

| 前端功能 | 后端接口 | 状态 |
|---------|---------|------|
| 用户登录 | POST /auth/login | ✅ |
| 用户注册 | POST /auth/register | ✅ |
| 获取用户信息 | GET /auth/profile | ✅ |
| 项目列表 | GET /projects | ✅ |
| 创建项目 | POST /projects | ✅ |
| 项目详情 | GET /project/{id} | ✅ |
| 更新项目 | PUT /project/{id} | ✅ |
| 删除项目 | DELETE /project/{id} | ✅ |
| 小说列表 | GET /novels | ✅ |
| 导入小说 | POST /novels/import-text | ✅ |
| 小说详情 | GET /novel/{id} | ✅ |
| 结构分析 | POST /novels/analyze-structure | ✅ |
| 角色提取 | POST /novels/extract-characters | ✅ |
| 角色列表 | GET /characters | ✅ |
| 角色详情 | GET /character/{id} | ✅ |
| 更新角色 | PUT /character/{id} | ✅ |
| 工作流列表 | GET /workflows | ✅ |
| 创建工作流 | POST /workflow | ✅ |
| 工作流详情 | GET /workflow/{id} | ✅ |
| 更新工作流 | PUT /workflow/{id} | ✅ |
| 删除工作流 | DELETE /workflow/{id} | ✅ |
| 执行记录列表 | GET /workflow-executions | ✅ |
| 创建执行记录 | POST /workflow-execution | ✅ |
| 执行记录详情 | GET /workflow-execution/{id} | ✅ |
| 更新执行记录 | PUT /workflow-execution/{id} | ✅ |
| 模板列表 | GET /workflow-templates | ✅ |
| 创建模板 | POST /workflow-template | ✅ |
| 模板详情 | GET /workflow-template/{id} | ✅ |
| 资源列表 | GET /assets | ✅ |
| 创建资源 | POST /asset | ✅ |
| 资源详情 | GET /asset/{id} | ✅ |
| 用户设置 | GET /user-settings | ✅ |
| 更新设置 | PUT /user-settings | ✅ |

---

## 需要清理的问题

### Mock 数据使用

1. 工作流模板 - 前端硬编码模板数据，需改为从后端获取
2. 部分视图使用本地 mock 数据作为 fallback

### 遗留代码

1. 旧的认证 key (auth_token, auth_user) 需统一为 novel_anime_* 前缀
2. 部分未使用的视图组件需要清理

### 功能缺失

1. 场景管理页面未完全实现
2. 视频生成节点为占位实现
3. 导出功能未完全实现

---

## 实现优先级

1. **P0 - 核心流程**: 需求 1-4, 7-8 (认证、仪表盘、项目、小说导入、工作流执行、结果查看)
2. **P1 - 重要功能**: 需求 5-6, 11-12 (角色管理、工作流管理、模板、执行历史)
3. **P2 - 辅助功能**: 需求 9-10 (资源管理、用户设置)
