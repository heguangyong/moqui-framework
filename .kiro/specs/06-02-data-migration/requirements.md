# 移除 Mock 数据 - 后端接口补齐规范

## 概述

为了彻底移除前端的 mock 数据，需要在后端补齐相应的 REST API 接口。本规范列出所有需要新增或修改的接口。

## 用户故事

### US-1: 工作流管理

**作为** 用户  
**我希望** 能够在后端持久化存储工作流数据  
**以便** 工作流数据不会因为清除浏览器缓存而丢失

**验收标准:**
- [ ] 可以创建新工作流
- [ ] 可以获取工作流列表
- [ ] 可以获取单个工作流详情
- [ ] 可以更新工作流
- [ ] 可以删除工作流
- [ ] 工作流数据与项目关联

### US-2: 工作流执行记录

**作为** 用户  
**我希望** 能够查看工作流的执行历史记录  
**以便** 追踪和分析工作流执行情况

**验收标准:**
- [ ] 可以创建执行记录
- [ ] 可以获取执行记录列表（支持按工作流ID过滤）
- [ ] 可以获取单个执行记录详情（包含日志）
- [ ] 可以更新执行状态

### US-3: 工作流模板

**作为** 用户  
**我希望** 能够保存和管理自定义工作流模板  
**以便** 复用常用的工作流配置

**验收标准:**
- [ ] 可以创建自定义模板
- [ ] 可以获取模板列表（包含内置模板和用户模板）
- [ ] 可以获取单个模板详情
- [ ] 可以更新模板
- [ ] 可以删除用户模板（内置模板不可删除）

### US-4: 资源管理

**作为** 用户  
**我希望** 能够管理项目中的各类资源（图片、音频、视频等）  
**以便** 在视频生成过程中使用这些资源

**验收标准:**
- [ ] 可以上传资源文件
- [ ] 可以获取资源列表（支持按类型、项目过滤）
- [ ] 可以获取单个资源详情
- [ ] 可以删除资源
- [ ] 支持资源分类（character, scene, image, audio, video）

### US-5: 用户配置

**作为** 用户  
**我希望** 能够获取和更新我的个人配置  
**以便** 个性化使用体验

**验收标准:**
- [ ] 可以获取用户配置信息
- [ ] 可以更新用户配置
- [ ] 配置包含：主题、语言、通知设置等

---

## 需要新增的后端接口

### 1. 工作流管理接口

```
POST   /rest/s1/novel-anime/workflow              # 创建工作流
GET    /rest/s1/novel-anime/workflows             # 获取工作流列表
GET    /rest/s1/novel-anime/workflow/{id}         # 获取工作流详情
PUT    /rest/s1/novel-anime/workflow/{id}         # 更新工作流
DELETE /rest/s1/novel-anime/workflow/{id}         # 删除工作流
```

### 2. 工作流执行记录接口

```
POST   /rest/s1/novel-anime/workflow-execution              # 创建执行记录
GET    /rest/s1/novel-anime/workflow-executions             # 获取执行记录列表
GET    /rest/s1/novel-anime/workflow-execution/{id}         # 获取执行记录详情
PUT    /rest/s1/novel-anime/workflow-execution/{id}         # 更新执行状态
```

### 3. 工作流模板接口

```
POST   /rest/s1/novel-anime/workflow-template              # 创建模板
GET    /rest/s1/novel-anime/workflow-templates             # 获取模板列表
GET    /rest/s1/novel-anime/workflow-template/{id}         # 获取模板详情
PUT    /rest/s1/novel-anime/workflow-template/{id}         # 更新模板
DELETE /rest/s1/novel-anime/workflow-template/{id}         # 删除模板
```

### 4. 资源管理接口

```
POST   /rest/s1/novel-anime/asset                 # 上传资源
GET    /rest/s1/novel-anime/assets                # 获取资源列表
GET    /rest/s1/novel-anime/asset/{id}            # 获取资源详情
DELETE /rest/s1/novel-anime/asset/{id}            # 删除资源
```

### 5. 用户配置接口

```
GET    /rest/s1/novel-anime/user-settings         # 获取用户配置
PUT    /rest/s1/novel-anime/user-settings         # 更新用户配置
```

---

## 现有接口（已实现）

根据 `novel-anime.rest.xml` 分析，以下接口已存在：

- ✅ 项目管理 (projects, project/{id})
- ✅ 小说管理 (novels, novel/{id})
- ✅ 章节管理 (chapters, chapter/{id})
- ✅ 角色管理 (characters, character/{id})
- ✅ 场景管理 (scenes, scene/{id})
- ✅ 分镜管理 (storyboards, storyboard/{id})
- ✅ 视频管理 (videos, video/{id})
- ✅ 认证接口 (auth/login, auth/register, auth/profile)

---

## 实现优先级

1. **高优先级** - 工作流管理接口（US-1）
2. **高优先级** - 工作流执行记录接口（US-2）
3. **中优先级** - 资源管理接口（US-4）
4. **低优先级** - 工作流模板接口（US-3）
5. **低优先级** - 用户配置接口（US-5）
