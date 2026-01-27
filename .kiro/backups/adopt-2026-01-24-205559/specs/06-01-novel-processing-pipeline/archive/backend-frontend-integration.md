# 后端API与前端桌面应用集成计划

## 🎯 集成目标

将刚完成的小说处理流水线后端API（30+ REST端点）与现有的NovelAnimeDesktop桌面应用（78%完成度）进行深度集成，实现完整的端到端功能。

## 📊 当前状态分析

### 后端API状态 ✅
- **完成度**: 100%
- **端点数量**: 30+ REST API
- **核心功能**: 
  - 用户认证和积分管理
  - 项目和小说管理
  - AI结构分析（章节、场景）
  - 角色提取和管理
  - 场景增强和审批
  - 集数生成和剧本创建
  - 流水线状态管理

### 前端桌面应用状态 🔄
- **完成度**: 78%
- **技术栈**: Electron + Vue 3 + Pinia
- **已有功能**:
  - 项目管理（本地）
  - 文件编辑器
  - 角色管理（本地）
  - 工作流编辑器
  - 基础API服务框架

### 集成缺口分析
1. **API端点不匹配**: 前端API服务使用旧的端点结构
2. **数据模型差异**: 前端本地数据模型与后端实体不一致
3. **状态管理**: 需要同步本地状态与云端状态
4. **认证集成**: 需要实现JWT认证流程
5. **积分系统**: 前端需要集成积分显示和管理

## 🔧 集成方案

### Phase 1: API服务层重构 (优先级: 高)

#### 1.1 更新API基础配置
**文件**: `src/renderer/services/api.ts`

**更新内容**:
```typescript
// 更新baseURL和端点结构
baseURL: 'http://localhost:8080/rest/s1/novel-anime'

// 添加完整的错误处理
// 添加请求重试机制
// 添加请求缓存策略
```

#### 1.2 创建新的API服务模块
**新建文件**:
- `src/renderer/services/novelApi.ts` - 小说管理API
- `src/renderer/services/pipelineApi.ts` - 流水线管理API
- `src/renderer/services/characterApi.ts` - 角色管理API
- `src/renderer/services/sceneApi.ts` - 场景管理API
- `src/renderer/services/episodeApi.ts` - 集数管理API

**API方法映射**:
```typescript
// novelApi.ts
- importText(projectId, title, author, content)
- importFile(projectId, file)
- analyzeStructure(novelId)
- getNovel(novelId)
- listNovels(projectId)
- updateNovel(novelId, data)
- deleteNovel(novelId)

// pipelineApi.ts
- createPipeline(novelId)
- getPipelineStatus(novelId)
- updateProgress(pipelineId, data)
- completePipeline(pipelineId)
- failPipeline(pipelineId, error)

// characterApi.ts
- extractCharacters(novelId)
- getCharacters(novelId)
- updateCharacter(characterId, data)
- lockCharacter(characterId)
- mergeCharacters(fromId, toId)
- deleteCharacter(characterId)

// sceneApi.ts
- enhanceScenes(novelId)
- getScenes(novelId, filters)
- updateScene(sceneId, data)
- approveScene(sceneId, isApproved)
- reanalyzeScene(sceneId)

// episodeApi.ts
- generateEpisodes(novelId, targetDuration)
- getEpisodes(novelId)
- updateEpisode(episodeId, data)
- deleteEpisode(episodeId)
- generateScreenplay(episodeId)
```

### Phase 2: 状态管理集成 (优先级: 高)

#### 2.1 更新Pinia Stores
**更新文件**:
- `src/renderer/stores/auth.ts` - 集成JWT认证
- `src/renderer/stores/credits.ts` - 集成积分API
- `src/renderer/stores/project.ts` - 集成项目API
- `src/renderer/stores/novel.js` - 重构为TypeScript，集成小说API
- `src/renderer/stores/workflow.ts` - 集成流水线API

**新建Store**:
- `src/renderer/stores/pipeline.ts` - 流水线状态管理
- `src/renderer/stores/character.ts` - 角色状态管理
- `src/renderer/stores/scene.ts` - 场景状态管理
- `src/renderer/stores/episode.ts` - 集数状态管理

#### 2.2 状态同步策略
```typescript
// 实现本地缓存 + 云端同步
interface SyncStrategy {
  // 本地优先：快速响应
  localFirst: boolean
  
  // 自动同步：定期同步到云端
  autoSync: boolean
  syncInterval: number
  
  // 冲突解决：云端优先
  conflictResolution: 'local' | 'remote' | 'manual'
}
```

### Phase 3: UI组件更新 (优先级: 中)

#### 3.1 更新现有视图
**文件更新**:
- `views/DashboardView.vue` - 显示云端项目和积分
- `views/Project.vue` - 集成小说导入和流水线
- `views/CharactersView.vue` - 使用云端角色数据
- `views/WorkflowEditor.vue` - 集成流水线可视化

#### 3.2 新建视图组件
**新建文件**:
- `views/NovelImportView.vue` - 小说导入界面
- `views/PipelineView.vue` - 流水线监控界面
- `views/SceneEditorView.vue` - 场景编辑器
- `views/EpisodeManagerView.vue` - 集数管理界面
- `views/ScreenplayView.vue` - 剧本预览界面

#### 3.3 新建UI组件
**新建文件**:
- `components/novel/NovelImporter.vue` - 小说导入组件
- `components/novel/NovelList.vue` - 小说列表组件
- `components/pipeline/PipelineStatus.vue` - 流水线状态组件
- `components/pipeline/StageProgress.vue` - 阶段进度组件
- `components/character/CharacterGallery.vue` - 角色画廊组件
- `components/scene/SceneCard.vue` - 场景卡片组件
- `components/episode/EpisodeList.vue` - 集数列表组件

### Phase 4: 认证和积分集成 (优先级: 高)

#### 4.1 实现登录流程
**更新**: `views/LoginView.vue`
```vue
<template>
  <div class="login-view">
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="邮箱" />
      <input v-model="password" type="password" placeholder="密码" />
      <button type="submit">登录</button>
    </form>
    <div class="oauth-buttons">
      <button @click="loginWithGitHub">GitHub登录</button>
      <button @click="loginWithGoogle">Google登录</button>
    </div>
  </div>
</template>
```

#### 4.2 积分显示和管理
**新建**: `components/credits/CreditsDisplay.vue`
```vue
<template>
  <div class="credits-display">
    <div class="balance">
      <span class="label">积分余额</span>
      <span class="amount">{{ credits }}</span>
    </div>
    <button @click="showHistory">查看历史</button>
  </div>
</template>
```

### Phase 5: 工作流程集成 (优先级: 中)

#### 5.1 小说导入流程
```
用户操作 → 选择文件/输入文本 → 
API调用 → importText/importFile → 
显示结果 → 字数统计、成本预估 → 
确认导入 → 创建小说记录
```

#### 5.2 处理流水线流程
```
小说导入完成 → 创建流水线 → 
结构分析 → 显示章节和场景 → 
角色提取 → 显示角色列表 → 
场景增强 → 显示视觉描述 → 
场景审批 → 用户确认 → 
集数生成 → 显示集数列表 → 
剧本生成 → 预览和导出
```

#### 5.3 实时状态更新
```typescript
// 使用轮询或WebSocket实时更新流水线状态
const pollPipelineStatus = async (novelId: string) => {
  const interval = setInterval(async () => {
    const status = await pipelineApi.getPipelineStatus(novelId)
    pipelineStore.updateStatus(status)
    
    if (status.status === 'completed' || status.status === 'failed') {
      clearInterval(interval)
    }
  }, 2000) // 每2秒轮询一次
}
```

## 📋 实施计划

### Week 1: API服务层 (5天)
- [ ] Day 1: 更新api.ts基础配置
- [ ] Day 2: 创建novelApi.ts和pipelineApi.ts
- [ ] Day 3: 创建characterApi.ts和sceneApi.ts
- [ ] Day 4: 创建episodeApi.ts
- [ ] Day 5: API服务测试和调试

### Week 2: 状态管理 (5天)
- [ ] Day 1: 更新auth.ts和credits.ts
- [ ] Day 2: 更新project.ts和novel.ts
- [ ] Day 3: 创建pipeline.ts和character.ts
- [ ] Day 4: 创建scene.ts和episode.ts
- [ ] Day 5: 状态同步测试

### Week 3: UI组件 (5天)
- [ ] Day 1: 更新DashboardView和Project视图
- [ ] Day 2: 创建NovelImportView和PipelineView
- [ ] Day 3: 创建SceneEditorView和EpisodeManagerView
- [ ] Day 4: 创建UI组件（NovelImporter, PipelineStatus等）
- [ ] Day 5: UI集成测试

### Week 4: 集成测试和优化 (5天)
- [ ] Day 1-2: 端到端测试
- [ ] Day 3: 性能优化
- [ ] Day 4: 错误处理完善
- [ ] Day 5: 用户体验优化

## 🎯 成功标准

### 功能完整性
- [ ] 所有30+ API端点成功集成
- [ ] 完整的用户认证流程
- [ ] 积分系统正常工作
- [ ] 流水线状态实时更新
- [ ] 数据本地缓存和云端同步

### 用户体验
- [ ] 响应时间 < 2秒
- [ ] 流畅的操作体验
- [ ] 清晰的错误提示
- [ ] 实时的进度反馈

### 技术质量
- [ ] TypeScript类型安全
- [ ] 完善的错误处理
- [ ] 代码可维护性
- [ ] 测试覆盖率 > 70%

## 🚀 预期成果

完成集成后，NovelAnimeDesktop将成为：
1. **功能完整的桌面应用**: 100%功能可用
2. **云端同步**: 本地编辑 + 云端处理的混合模式
3. **生产就绪**: 可以发布给用户使用
4. **用户友好**: 直观的操作流程和实时反馈

这将使小说处理流水线从纯API服务升级为完整的桌面产品！