# Hotfix 8: 预览图片显示问题

**日期**: 2026-01-26  
**状态**: ✅ 已解决  
**优先级**: 高

---

## 问题描述

用户在"分镜头预览"(PreviewView)页面看不到图片，显示"未加载 characters 渲染错误"。

**用户反馈**:
> "你说怎么看不到图呢"

**问题场景**:
1. 用户删除项目后新建项目
2. 执行工作流生成内容
3. 进入"生成内容"页面，点击"预览"
4. 在"分镜头预览"页面看不到图片

---

## 根本原因分析

### 1. 数据流分析

**GeneratedContentView → PreviewView 数据流**:
```
GeneratedContentView (加载数据)
  ↓
navigationStore.setExecutionResult({
  nodeResultsData: {
    'scene-generator': {
      scenes: [...],
      storyboards: [
        {
          id, description,
          imageUrl: scene.imageUrl || scene.image,  // ← 关键字段
          thumbnailUrl, dialogue, speaker, duration
        }
      ]
    }
  }
})
  ↓
PreviewView (读取数据)
  ↓
从 executionResult.nodeResultsData 提取 storyboards
  ↓
显示图片: <img :src="storyboard.imageUrl" />
```

### 2. 问题定位

**可能的原因**:

1. **localStorage 中的数据没有 imageUrl**
   - 工作流执行时生成的图片 URL 没有保存到 localStorage
   - 场景数据结构中缺少 `imageUrl` 或 `image` 字段

2. **图片 URL 格式不正确**
   - URL 可能是相对路径而非绝对路径
   - URL 可能已过期或无效

3. **工作流执行结果未正确保存**
   - 工作流执行完成后，图片 URL 没有写入到场景数据
   - 数据保存到 localStorage 时丢失了图片信息

4. **PreviewView 读取数据的逻辑问题**
   - 可能从错误的数据源读取
   - 数据映射逻辑有误

---

## 诊断步骤

### Step 1: 检查 localStorage 中的数据结构

在 GeneratedContentView 的 `onMounted()` 中添加详细日志:

```javascript
const novelData = JSON.parse(localStorage.getItem(`novel_${novelId}`));
console.log('📊 [DEBUG] localStorage 数据结构:', {
  chapters: novelData.chapters.length,
  firstChapter: novelData.chapters[0],
  firstScene: novelData.chapters[0]?.scenes?.[0],
  hasImageUrl: !!novelData.chapters[0]?.scenes?.[0]?.imageUrl,
  hasImage: !!novelData.chapters[0]?.scenes?.[0]?.image
});
```

### Step 2: 检查 executionResult 的数据

在 PreviewView 的 `loadPreviewData()` 中添加日志:

```javascript
console.log('📊 [DEBUG] executionResult:', {
  hasResult: !!result,
  hasNodeResultsData: !!result?.nodeResultsData,
  nodeKeys: Object.keys(result?.nodeResultsData || {}),
  firstStoryboard: result?.nodeResultsData?.['scene-generator']?.storyboards?.[0]
});
```

### Step 3: 检查工作流执行结果

需要查看工作流执行时是否生成了图片 URL。

---

## 修复方案

### 方案 A: 确保工作流执行时保存图片 URL

**目标**: 在工作流执行完成后，确保图片 URL 被正确保存到 localStorage

**修改位置**: 
- `WorkflowEditor.vue` - 工作流执行完成处理
- `DashboardView.vue` - 保存小说数据到 localStorage

**实现**:
1. 在工作流执行完成后，检查节点结果中的图片 URL
2. 将图片 URL 合并到场景数据中
3. 更新 localStorage 中的小说数据

### 方案 B: 在 PreviewView 中添加图片加载失败的友好提示

**目标**: 即使没有图片，也要显示清晰的提示信息

**修改位置**: `PreviewView.vue`

**实现**:
1. 检测 imageUrl 是否存在
2. 如果不存在，显示占位符和提示信息
3. 添加"重新生成图片"的按钮（可选）

### 方案 C: 在 GeneratedContentView 中添加数据验证

**目标**: 在设置 executionResult 前验证数据完整性

**修改位置**: `GeneratedContentView.vue`

**实现**:
1. 检查场景数据是否包含图片 URL
2. 如果缺少，尝试从其他来源获取
3. 记录警告日志，提示用户数据不完整

---

## 实施计划

### Phase 1: 诊断 (当前)
- [x] 添加详细日志到 GeneratedContentView
- [x] 添加详细日志到 PreviewView
- [ ] 请用户测试并提供日志输出

### Phase 2: 修复
- [ ] 根据诊断结果选择修复方案
- [ ] 实施修复
- [ ] 测试验证

---

## 已实施的诊断日志

### GeneratedContentView.vue

**位置 1**: 在从 localStorage 加载数据后 (line ~368)
```javascript
// 诊断: 检查 localStorage 数据结构
console.log('📊 [DEBUG] localStorage 数据结构:', {
  chapters: novelData.chapters.length,
  firstChapter: novelData.chapters[0],
  firstScene: novelData.chapters[0]?.scenes?.[0],
  hasImageUrl: !!novelData.chapters[0]?.scenes?.[0]?.imageUrl,
  hasImage: !!novelData.chapters[0]?.scenes?.[0]?.image,
  imageUrlValue: novelData.chapters[0]?.scenes?.[0]?.imageUrl,
  imageValue: novelData.chapters[0]?.scenes?.[0]?.image
});
```

**位置 2**: 在构建 storyboards 后 (line ~385)
```javascript
// 诊断: 检查构建的 storyboards
console.log('📊 [DEBUG] 构建的 storyboards:', {
  count: storyboards.length,
  firstStoryboard: storyboards[0],
  hasImageUrl: !!storyboards[0]?.imageUrl,
  imageUrls: storyboards.slice(0, 3).map(s => s.imageUrl)
});
```

### PreviewView.vue

**位置 1**: 在读取 executionResult 后 (line ~498)
```javascript
// 诊断: 检查 executionResult 数据结构
console.log('📊 [DEBUG] executionResult 数据结构:', {
  hasResult: !!result,
  hasNodeResultsData: !!nodeResultsData,
  nodeKeys: Object.keys(nodeResultsData),
  sceneGeneratorData: nodeResultsData['scene-generator'],
  firstStoryboard: nodeResultsData['scene-generator']?.storyboards?.[0],
  storyboardCount: nodeResultsData['scene-generator']?.storyboards?.length
});
```

**位置 2**: 在加载 storyboards 后 (line ~525)
```javascript
// 诊断: 检查加载的 storyboards 图片信息
console.log('📊 [DEBUG] 加载的 storyboards 图片信息:', {
  total: storyboards.value.length,
  withImageUrl: storyboards.value.filter(s => s.imageUrl).length,
  firstThreeImageUrls: storyboards.value.slice(0, 3).map(s => ({
    id: s.id,
    hasImageUrl: !!s.imageUrl,
    imageUrl: s.imageUrl
  }))
});
```

---

## 用户测试指南

请用户执行以下步骤并提供控制台日志:

1. **打开开发者工具**: 按 F12 或 Ctrl+Shift+I
2. **切换到 Console 标签页**
3. **清空控制台**: 点击 🚫 图标
4. **执行测试流程**:
   - 进入"生成内容"页面
   - 点击"预览"按钮
   - 进入"分镜头预览"页面
5. **复制所有以 `[DEBUG]` 开头的日志**
6. **提供给开发者**

**关键日志标识**:
- `📊 [DEBUG] localStorage 数据结构:` - localStorage 中的原始数据
- `📊 [DEBUG] 构建的 storyboards:` - 构建后的分镜数据
- `📊 [DEBUG] executionResult 数据结构:` - 传递给 PreviewView 的数据
- `📊 [DEBUG] 加载的 storyboards 图片信息:` - PreviewView 加载的图片信息

---

## 相关文件

- `frontend/NovelAnimeDesktop/src/renderer/views/PreviewView.vue` - 预览页面
- `frontend/NovelAnimeDesktop/src/renderer/views/GeneratedContentView.vue` - 生成内容页面
- `frontend/NovelAnimeDesktop/src/renderer/stores/navigation.js` - 导航状态管理
- `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue` - 项目概览（保存数据）
- `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue` - 工作流编辑器（执行工作流）

---

## 测试计划

1. **测试场景 1**: 新建项目 → 导入小说 → 执行工作流 → 查看预览
2. **测试场景 2**: 已有项目 → 重新执行工作流 → 查看预览
3. **测试场景 3**: 检查 localStorage 数据结构
4. **测试场景 4**: 检查 executionResult 数据结构

---

## ✅ 问题解决

**测试结果**: 2026-01-26

用户测试确认：
- ✅ 图片成功显示在预览页面
- ✅ 分镜列表正常显示（2 个分镜）
- ✅ 图片 URL 正确加载
- ✅ 数据流完整：工作流执行 → executionResult → PreviewView

**根本原因**: 
实际上不是图片显示的问题，而是之前的 Hotfix 3-7 已经修复了整个数据流：
1. Hotfix 3: 修复了 GeneratedContentView 到 PreviewView 的导航
2. Hotfix 5: 修复了数据去重和 executionResult 设置
3. Hotfix 7: 修复了项目数据缓存问题

这些修复共同确保了：
- 工作流执行时正确生成图片 URL
- executionResult 正确设置到 navigationStore
- PreviewView 正确读取和显示图片

**诊断日志验证**:
```
✅ [PreviewView] 从工作流结果加载数据: {scenes: 4, storyboards: 2}
📊 [DEBUG] 加载的 storyboards 图片信息: {total: 2, withImageUrl: 2}
```

所有 2 个分镜都有有效的 imageUrl，图片成功显示。

---

## 📸 测试截图

用户提供的截图显示：
- 左侧主预览区域显示绿色图片（分镜头 2）
- 右侧分镜列表显示 2 个分镜项
- 图片正常加载，无占位符或错误提示

---

## 🎯 结论

**问题状态**: ✅ 已解决

之前的一系列 Hotfix（特别是 Hotfix 3、5、7）已经完整修复了数据流，确保：
1. 工作流执行时生成图片 URL
2. 数据正确保存到 executionResult
3. PreviewView 正确读取和显示图片

无需额外修复，功能正常工作。

---

**版本**: v2.0  
**更新**: 2026-01-26  
**状态**: 已解决
