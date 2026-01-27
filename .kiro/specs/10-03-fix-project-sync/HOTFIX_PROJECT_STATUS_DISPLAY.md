# Hotfix: 修复项目状态显示问题

## 🐛 问题描述

用户在项目列表中看到项目状态显示为 `"characters_continue"`，这是一个内部状态标识，不应该直接显示给用户。

**截图显示**：
- 项目状态标签显示：`"characters_continue"`
- 应该显示：`"角色确认中"`

**根本原因**：
- `getStatusText()` 和 `getStatusLabel()` 函数缺少 `characters_continue` 状态的映射
- CSS 样式也缺少对应的状态样式定义
- 当状态映射表中没有对应的状态时，函数返回原始状态值

## ✅ 修复内容

### 1. 修复 `getStatusText()` 函数

**文件**: `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`

**添加状态映射**：
```javascript
function getStatusText(status) {
  const statusTexts = {
    // ... 其他状态
    characters_confirmed: '角色已确认',
    characters_continue: '角色确认中',  // ✅ 新增
    generating: '生成中',
    completed: '已完成'
  };
  return statusTexts[status] || status || '进行中';
}
```

### 2. 修复 `getStatusLabel()` 函数

**添加状态映射**：
```javascript
function getStatusLabel(status) {
  const labels = { 
    // ... 其他状态
    analyzing: '分析中',
    characters_confirmed: '角色已确认',  // ✅ 新增
    characters_continue: '角色确认中',   // ✅ 新增
    generating: '生成中'
  };
  return labels[status] || status || '草稿';
}
```

### 3. 添加 CSS 样式

**添加状态徽章样式**：
```css
:deep(.project-status-badge--characters_confirmed) { 
  background: rgba(16, 185, 129, 0.15); 
  color: #10b981; 
}
:deep(.project-status-badge--characters_continue) { 
  background: rgba(59, 130, 246, 0.15); 
  color: #3b82f6; 
}
```

## 📋 完整的状态映射表

### 所有支持的项目状态

| 状态值 | 显示文本 | 颜色 | 说明 |
|--------|---------|------|------|
| `draft` | 草稿 | 灰色 | 项目刚创建 |
| `active` | 进行中 | 蓝色 | 项目活跃 |
| `importing` | 导入中 | 橙色 | 正在导入小说 |
| `imported` | 已导入 | 紫色 | 小说已导入 |
| `analyzing` | 分析中 | 橙色 | 正在分析内容 |
| `analyzed` | 已分析 | - | 分析完成 |
| `parsing` | 解析中 | - | 正在解析 |
| `parsed` | 已解析 | 粉色 | 解析完成 |
| `characters_confirmed` | 角色已确认 | 绿色 | 角色确认完成 ✅ |
| `characters_continue` | 角色确认中 | 蓝色 | 正在确认角色 ✅ |
| `generating` | 生成中 | 橙红色 | 正在生成内容 |
| `processing` | 处理中 | 橙色 | 通用处理状态 |
| `completed` | 已完成 | 绿色 | 项目完成 |

## 🧪 测试步骤

### 测试场景 1：查看项目列表

1. 打开应用
2. 查看"全部项目"列表
3. **预期结果**：
   - 状态为 `characters_continue` 的项目显示为"角色确认中"
   - 状态徽章显示蓝色背景
   - 不再显示原始的 `characters_continue` 文本

### 测试场景 2：当前项目状态

1. 打开一个正在进行角色确认的项目
2. 查看项目详情页面
3. **预期结果**：
   - 状态显示为"角色确认中"
   - 进度条显示正确的百分比

### 测试场景 3：其他状态

验证其他所有状态都能正确显示：
- ✅ 草稿 → "草稿"
- ✅ 已导入 → "已导入"
- ✅ 已解析 → "已解析"
- ✅ 角色已确认 → "角色已确认"
- ✅ 生成中 → "生成中"
- ✅ 已完成 → "已完成"

## 🔍 相关代码位置

**修改文件**：
- `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`
  - `getStatusText()` 函数（约 1115 行）
  - `getStatusLabel()` 函数（约 1463 行）
  - CSS 样式（约 2258-2267 行）

**相关组件**：
- `ProjectList.vue` - 使用 `getStatusLabel()` 显示项目状态
- `DashboardView.vue` - 使用 `getStatusText()` 显示当前项目状态

## 💡 设计建议

### 未来改进

1. **统一状态管理**
   - 将所有状态定义集中到一个配置文件
   - 避免在多个地方重复定义状态映射

2. **状态枚举**
   - 使用 TypeScript 枚举定义所有可能的状态
   - 编译时检查状态值的有效性

3. **国际化支持**
   - 将状态文本移到 i18n 配置文件
   - 支持多语言显示

### 示例：统一状态配置

```javascript
// constants/projectStatus.js
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  IMPORTING: 'importing',
  IMPORTED: 'imported',
  // ... 其他状态
  CHARACTERS_CONTINUE: 'characters_continue',
  CHARACTERS_CONFIRMED: 'characters_confirmed',
  GENERATING: 'generating',
  COMPLETED: 'completed'
};

export const STATUS_LABELS = {
  [PROJECT_STATUS.DRAFT]: '草稿',
  [PROJECT_STATUS.ACTIVE]: '进行中',
  // ... 其他映射
  [PROJECT_STATUS.CHARACTERS_CONTINUE]: '角色确认中',
  [PROJECT_STATUS.CHARACTERS_CONFIRMED]: '角色已确认',
  [PROJECT_STATUS.GENERATING]: '生成中',
  [PROJECT_STATUS.COMPLETED]: '已完成'
};

export const STATUS_COLORS = {
  [PROJECT_STATUS.DRAFT]: { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' },
  // ... 其他颜色
};
```

## 🔗 相关文档

- **Spec 10-03**: 项目同步修复
- **用户反馈**: 项目状态显示异常

---

**修复时间**: 2026-01-25  
**修复类型**: Hotfix  
**影响范围**: 前端项目状态显示  
**向后兼容**: ✅ 是
