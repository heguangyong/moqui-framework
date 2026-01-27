# Hotfix: 重复内容显示和预览按钮问题

**日期**: 2026-01-26  
**Spec**: 10-03-fix-project-sync  
**问题**: 
1. 生成内容页面显示重复的章节/场景
2. 点击"预览"按钮仍然没有反应

---

## 问题分析

### 问题 1: 重复内容显示

**用户报告**: "两个重复"

**根本原因**:
1. `onMounted()` 中有多个数据加载路径（工作流结果、localStorage、后端 API）
2. 可能多次进入页面导致数据累积
3. 数据源本身可能包含重复的章节 ID

### 问题 2: 预览按钮无响应

**用户报告**: "点击预览没反应"

**根本原因**:
1. `previewScene()` 函数的条件判断不够严格
2. `executionResult` 可能存在但为空对象（`{}`），导致条件判断通过但实际没有数据
3. 原代码只检查 `executionResult` 是否存在，没有验证是否有有效数据

---

## 修复方案

### 修复 1: 防止重复加载和数据去重

**修改位置**: `GeneratedContentView.vue` - `onMounted()` 函数

**修改内容**:
1. 在 `onMounted()` 开始时检查是否已有数据，避免重复加载
2. 添加 `deduplicateChapters()` 辅助函数，基于章节 ID 去重
3. 在所有三个数据加载路径中应用去重逻辑

```javascript
// 数据去重辅助函数
function deduplicateChapters(chapters) {
  const seen = new Set();
  return chapters.filter(chapter => {
    const id = chapter.id || chapter.chapterId;
    if (seen.has(id)) {
      console.warn('⚠️ 发现重复章节:', id, chapter.title);
      return false;
    }
    seen.add(id);
    return true;
  });
}

onMounted(async () => {
  // 防止重复加载
  if (generatedChapters.value.length > 0) {
    console.log('⚠️ 数据已加载，跳过重复加载');
    return;
  }
  
  // ... 数据加载逻辑 ...
  
  // 应用去重
  generatedChapters.value = deduplicateChapters(chaptersData);
  console.log('✅ 去重后章节数:', generatedChapters.value.length);
});
```

### 修复 2: 增强预览按钮数据验证

**修改位置**: `GeneratedContentView.vue` - `previewScene()` 函数

**修改内容**:
1. 不仅检查 `executionResult` 是否存在，还验证是否有有效数据
2. 检查 `nodeResultsData` 是否存在且不为空
3. 添加详细的日志输出，便于诊断问题

```javascript
function previewScene(scene) {
  console.log('🎬 预览场景:', scene);
  
  // 检查执行结果
  const executionResult = navigationStore.workflowState.executionResult;
  console.log('📊 executionResult:', executionResult);
  
  // 验证是否有有效的数据
  const hasValidData = executionResult && 
    executionResult.nodeResultsData && 
    Object.keys(executionResult.nodeResultsData).length > 0;
  
  console.log('📊 是否有有效数据:', hasValidData);
  console.log('📊 nodeResultsData keys:', executionResult?.nodeResultsData ? Object.keys(executionResult.nodeResultsData) : 'null');
  
  if (hasValidData) {
    console.log('✅ 跳转到预览页面');
    router.push('/preview');
  } else {
    console.warn('❌ 没有有效的执行结果数据');
    console.warn('❌ executionResult:', executionResult);
    uiStore.addNotification({
      type: 'warning',
      title: '无法预览',
      message: '没有找到可预览的内容数据，请重新执行工作流',
      timeout: 3000
    });
  }
}
```

---

## 修改的文件

- `frontend/NovelAnimeDesktop/src/renderer/views/GeneratedContentView.vue`
  * 添加 `deduplicateChapters()` 辅助函数
  * 在 `onMounted()` 开始时添加重复加载检查
  * 在所有数据加载路径中应用去重逻辑
  * 增强 `previewScene()` 函数的数据验证逻辑

---

## 预期效果

### 修复后的行为

1. **重复内容问题**:
   - 页面不会显示重复的章节
   - 如果数据源包含重复 ID，会自动过滤
   - 控制台会显示警告信息："⚠️ 发现重复章节: ..."

2. **预览按钮问题**:
   - 只有在有有效数据时才会跳转到预览页面
   - 如果没有有效数据，会显示友好的提示信息
   - 控制台会输出详细的诊断日志

---

## 测试步骤

1. 刷新页面，进入"生成结果预览"页面
2. 检查是否还有重复的章节显示
3. 展开章节，点击"预览"按钮
4. 观察是否能正常跳转到预览页面
5. 查看控制台日志，确认数据加载和验证过程

---

**状态**: ✅ 已修复，等待用户测试
