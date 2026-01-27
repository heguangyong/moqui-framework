# 关键问题诊断报告

**日期**: 2026-01-26  
**状态**: 🚨 发现3个关键问题  
**优先级**: P0 - 立即修复

---

## 🔍 问题 1: 项目状态未同步到后端

### 症状

用户反馈：流程已走完，状态偏偏还是"角色已确认"

### 根本原因

**WorkflowEditor.vue 第1803行**:
```javascript
// 更新项目状态为已完成
if (projectStore.currentProject) {
  projectStore.currentProject.status = 'completed';  // ❌ 只更新前端
}
```

**问题**:
- ✅ 更新了前端 `projectStore.currentProject.status`
- ❌ **没有调用后端API更新数据库**
- ❌ 浏览器刷新后状态丢失
- ❌ 其他组件看到的还是旧状态

### 修复方案

```javascript
// 更新项目状态为已完成
if (projectStore.currentProject) {
  const projectId = projectStore.currentProject.id || projectStore.currentProject.projectId;
  
  try {
    // ✅ 调用后端API更新状态
    const response = await apiService.axiosInstance.patch(`/project/${projectId}`, {
      status: 'completed'
    });
    
    if (response.data && response.data.success) {
      // ✅ 更新前端状态
      projectStore.currentProject.status = 'completed';
      console.log('✅ Project status updated to completed');
    }
  } catch (error) {
    console.error('❌ Failed to update project status:', error);
  }
}
```

---

## 🔍 问题 2: 图片生成使用相同的 Prompt

### 症状

用户反馈：生成的图片都是同一幅，且非常丑陋

### 根本原因分析

**PipelineOrchestrator.js `buildImagePrompt()` 方法**:

```javascript
buildImagePrompt(scene, characters) {
  const parts = [];
  
  // 1. 场景设定
  if (scene.setting && scene.setting !== '未知场景') {
    parts.push(scene.setting);  // ⚠️ 可能所有场景都是相同的 setting
  }
  
  // 2. 角色信息
  if (scene.characters && scene.characters.length > 0) {
    const characterNames = scene.characters.slice(0, 3).join(', ');
    parts.push(`characters: ${characterNames}`);  // ⚠️ 可能所有场景都是相同的角色
  }
  
  // 3. 场景描述
  const visualElements = this.extractVisualElements(scene.content || scene.description || '');
  if (visualElements) {
    parts.push(visualElements);  // ⚠️ 只提取前100个字符，可能不够独特
  }
  
  // 4. 如果没有足够的信息，使用场景标题
  if (parts.length === 0 && scene.title) {
    parts.push(scene.title);
  }
  
  // 5. 添加默认描述
  if (parts.length === 0) {
    parts.push('anime scene');  // ❌ 最糟糕的情况：所有场景都是 'anime scene'
  }
  
  return parts.join(', ');
}
```

**问题**:
1. **场景区分度不够**:
   - 如果所有场景的 `setting` 相同 → prompt 相同
   - 如果所有场景的 `characters` 相同 → prompt 相同
   - `visualElements` 只提取前100字符 → 可能不够独特

2. **缺少场景唯一标识**:
   - 没有使用场景ID
   - 没有使用场景索引
   - 没有使用章节信息

3. **Seed 生成策略**:
   - `seed = Math.floor(Math.random() * 1000000)` ✅ 这个是随机的
   - 但如果 prompt 相同，即使 seed 不同，图片也可能相似

### 修复方案

#### 方案 A: 增强 Prompt 唯一性（推荐）

```javascript
buildImagePrompt(scene, characters, sceneIndex, chapterTitle) {
  const parts = [];
  
  // 1. 添加章节和场景标识（确保唯一性）
  if (chapterTitle) {
    parts.push(`Chapter: ${chapterTitle}`);
  }
  if (sceneIndex !== undefined) {
    parts.push(`Scene ${sceneIndex + 1}`);
  }
  
  // 2. 场景标题（最重要的区分因素）
  if (scene.title && scene.title !== '未命名场景') {
    parts.push(scene.title);
  }
  
  // 3. 场景内容（提取更多字符，增加独特性）
  const content = scene.content || scene.description || '';
  if (content) {
    // 提取前200个字符（而不是100）
    const visualElements = this.extractVisualElements(content, 200);
    if (visualElements) {
      parts.push(visualElements);
    }
  }
  
  // 4. 场景设定
  if (scene.setting && scene.setting !== '未知场景') {
    parts.push(`Setting: ${scene.setting}`);
  }
  
  // 5. 角色信息
  if (scene.characters && scene.characters.length > 0) {
    const characterNames = scene.characters.slice(0, 3).join(', ');
    parts.push(`Characters: ${characterNames}`);
  }
  
  // 6. 添加场景ID作为最后的保障
  if (scene.id || scene.sceneId) {
    parts.push(`ID: ${scene.id || scene.sceneId}`);
  }
  
  // 7. 如果还是没有内容，使用默认值 + 索引
  if (parts.length === 0) {
    parts.push(`anime scene ${sceneIndex + 1}`);
  }
  
  return parts.join(', ');
}

extractVisualElements(text, maxLength = 100) {
  if (!text) return '';
  
  // 提取指定长度的文本
  const shortText = text.substring(0, maxLength).trim();
  
  // 移除对话（引号内的内容）
  const withoutDialogue = shortText.replace(/"[^"]*"/g, '').trim();
  
  return withoutDialogue || shortText;
}
```

#### 方案 B: 使用场景ID作为 Seed（备选）

```javascript
// 在调用图片生成时
const seed = this.generateSeedFromSceneId(scene.id || scene.sceneId || sceneIndex);

generateSeedFromSceneId(sceneId) {
  // 将场景ID转换为数字seed
  if (typeof sceneId === 'number') {
    return sceneId;
  }
  
  // 如果是字符串，计算哈希值
  let hash = 0;
  for (let i = 0; i < sceneId.length; i++) {
    const char = sceneId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
```

---

## 🔍 问题 3: 工作流未正确关联项目

### 症状

用户反馈：工作流菜单对应的流程还是没有

### 可能原因

1. **创建工作流时未设置 projectId**
2. **查询工作流时未按 projectId 过滤**
3. **WorkflowEditor 未正确加载工作流列表**

### 诊断步骤

需要检查以下文件：

1. **创建工作流的代码**:
   - 搜索 `createWorkflowForProject`
   - 检查是否设置了 `projectId` 字段

2. **查询工作流的代码**:
   - 检查 `workflowStore.loadWorkflows()`
   - 检查是否按 `projectId` 过滤

3. **WorkflowEditor 的加载逻辑**:
   - 检查 `initializeEditor()`
   - 检查工作流列表的显示逻辑

### 待诊断

需要进一步检查代码才能确定具体原因。

---

## 🚀 修复优先级

### P0 - 立即修复（今天）

1. ✅ **问题1**: 项目状态未同步到后端
   - 影响: 用户看到错误的项目状态
   - 修复时间: 10分钟
   - 文件: `WorkflowEditor.vue`

2. ✅ **问题2**: 图片生成使用相同的 Prompt
   - 影响: 所有场景生成相同的图片
   - 修复时间: 20分钟
   - 文件: `PipelineOrchestrator.js`

### P1 - 今天完成

3. ⚠️ **问题3**: 工作流未正确关联项目
   - 影响: 工作流菜单为空
   - 修复时间: 需要先诊断
   - 文件: 待确定

---

## 📝 修复计划

### Step 1: 修复项目状态同步 (10分钟)

1. 打开 `WorkflowEditor.vue`
2. 找到 `handleExecutionComplete()` 方法
3. 添加后端API调用更新项目状态
4. 测试验证

### Step 2: 修复图片生成 Prompt (20分钟)

1. 打开 `PipelineOrchestrator.js`
2. 修改 `buildImagePrompt()` 方法
3. 增加场景唯一性标识
4. 增加提取的文本长度
5. 测试验证

### Step 3: 诊断工作流关联问题 (30分钟)

1. 搜索 `createWorkflowForProject` 代码
2. 检查 projectId 设置
3. 检查查询过滤逻辑
4. 找出问题并修复

---

## ✅ 验收标准

### 问题1验收

- [ ] 工作流执行完成后，调用后端API更新项目状态
- [ ] 浏览器刷新后，项目状态仍然是 'completed'
- [ ] DashboardView 正确显示 '已完成' 状态

### 问题2验收

- [ ] 每个场景生成不同的图片
- [ ] Prompt 包含场景唯一标识
- [ ] 图片质量可接受（不丑陋）

### 问题3验收

- [ ] 工作流菜单正确显示项目的工作流
- [ ] 可以选择和编辑工作流
- [ ] 工作流正确关联到项目

---

**版本**: v1.0  
**状态**: 🚨 诊断完成，准备修复  
**下一步**: 立即开始修复

