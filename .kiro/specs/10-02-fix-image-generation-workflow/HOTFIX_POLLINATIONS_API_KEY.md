# Hotfix: Pollinations AI 不需要 API 密钥

## 🐛 问题描述

用户在设置页面清空 API 密钥后点击"保存设置"，系统报错提示"连接失败，要求输入密钥"。

**根本原因**：
- Pollinations AI 是免费服务，不需要 API 密钥
- 但 `saveSettings()` 和 `testConnection()` 函数没有区分不同的 AI 提供商
- 所有提供商都被要求必须有 API 密钥才能保存

## ✅ 修复内容

### 1. 修复 `saveSettings()` 函数

**文件**: `frontend/NovelAnimeDesktop/src/renderer/views/Settings.vue`

**修改逻辑**：
```javascript
// 修改前：只要有 API 密钥就同步到后端
if (settings.ai.apiKey) {
  // 同步到 MCP 后端
}

// 修改后：只有需要 API 密钥的提供商才同步
const providersNeedingApiKey = ['openai', 'anthropic', 'local'];
if (settings.ai.apiKey && providersNeedingApiKey.includes(settings.ai.provider)) {
  // 同步到 MCP 后端
}
```

**效果**：
- ✅ Pollinations AI 可以在没有 API 密钥的情况下保存设置
- ✅ OpenAI、Anthropic 等提供商仍然需要 API 密钥
- ✅ 设置始终保存到本地存储（localStorage）

### 2. 修复 `testConnection()` 函数

**修改逻辑**：
```javascript
// 添加 Pollinations AI 的特殊处理
if (settings.ai.provider === 'pollinations') {
  uiStore.addNotification({ 
    type: 'success', 
    title: '配置正确', 
    message: 'Pollinations AI 无需 API 密钥，可以直接使用', 
    timeout: 3000 
  });
  return;
}

// 其他提供商才检查 API 密钥
if (!settings.ai.apiKey) {
  // 报错：请先输入API密钥
}
```

**效果**：
- ✅ 点击"测试连接"时，Pollinations AI 直接显示成功
- ✅ 其他提供商仍然验证 API 密钥

## 🧪 测试步骤

### 测试场景 1：Pollinations AI 无 API 密钥保存

1. 打开设置 → AI服务配置
2. **AI服务提供商**：选择 "Pollinations AI (免费)"
3. **API密钥**：留空（或清空）
4. **模型选择**：选择 "Flux Anime (Pollinations)"
5. 点击"保存设置"
6. **预期结果**：✅ 显示"保存成功"

### 测试场景 2：Pollinations AI 测试连接

1. 保持上述配置
2. 点击"测试连接"按钮
3. **预期结果**：✅ 显示"配置正确，Pollinations AI 无需 API 密钥，可以直接使用"

### 测试场景 3：OpenAI 需要 API 密钥

1. **AI服务提供商**：选择 "OpenAI (GPT-4)"
2. **API密钥**：留空
3. 点击"保存设置"
4. **预期结果**：✅ 保存成功（本地保存，但不同步到后端）
5. 点击"测试连接"
6. **预期结果**：❌ 显示"连接失败，请先输入API密钥"

## 📋 修改文件清单

- ✅ `frontend/NovelAnimeDesktop/src/renderer/views/Settings.vue`
  - 修改 `saveSettings()` 函数（约 5 行）
  - 修改 `testConnection()` 函数（约 10 行）

## 🎯 用户指南

### 使用 Pollinations AI（推荐）

1. **AI服务提供商**：选择 "Pollinations AI (免费)"
2. **API密钥**：留空（不需要填写）
3. **模型选择**：选择 "Flux Anime (Pollinations)"
4. 点击"保存设置" ✅

### 使用其他 AI 服务

如果您想使用 OpenAI、Anthropic 等服务：

1. 选择对应的提供商
2. **必须**填写 API 密钥
3. 点击"测试连接"验证
4. 点击"保存设置"

## 🔗 相关文档

- **用户指南**: `.kiro/specs/10-02-fix-image-generation-workflow/USER_GUIDE_AI_CONFIG.md`
- **Spec 10-02**: 图片生成工作流修复
- **后端服务**: `McpMultiProviderImageServices.generate#ImageMultiProvider`

---

**修复时间**: 2026-01-25  
**修复类型**: Hotfix  
**影响范围**: 前端设置页面  
**向后兼容**: ✅ 是
