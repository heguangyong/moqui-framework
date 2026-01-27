# Pollinations AI 配置指南

## 🎉 好消息：无需配置！

**Pollinations AI 是完全免费的服务，不需要任何 API Key 或配置！**

## ✅ 当前状态

您的系统已经正确配置为使用 Pollinations AI：

1. **后端工作流** ✅ 已更新为调用 Pollinations AI 服务
2. **前端设置界面** ✅ 已显示 "Pollinations AI (免费)"
3. **默认配置** ✅ 已设置为 pollinations + flux-anime 模型

## 📋 如何使用

### 方法 1：直接使用（推荐）

**什么都不用做！** 直接导入小说并生成即可：

1. 点击"导入小说"
2. 选择您的小说文件
3. 点击"开始生成"
4. 系统会自动使用 Pollinations AI 生成图片

### 方法 2：查看设置（可选）

如果您想确认配置，可以打开设置页面：

1. 点击右上角的"设置"图标
2. 选择"AI服务配置"
3. 您会看到：
   - **AI服务提供商**: Pollinations AI (免费) ✅
   - **模型选择**: Flux Anime (Pollinations) ✅
   - **API密钥**: 留空即可（不需要）✅

## ❓ 常见问题

### Q1: 为什么有 API 密钥输入框？

**A**: 这个输入框是为其他 AI 服务（如 OpenAI）准备的。对于 Pollinations AI，您可以完全忽略它，留空即可。

### Q2: 需要填写 API 端点吗？

**A**: 不需要。Pollinations AI 使用默认端点，系统会自动处理。

### Q3: 如何知道是否在使用 Pollinations AI？

**A**: 查看设置页面，如果"AI服务提供商"显示"Pollinations AI (免费)"，就说明您正在使用它。

### Q4: 生成图片需要付费吗？

**A**: 完全免费！Pollinations AI 是开源免费服务，无需任何费用。

### Q5: 图片质量如何？

**A**: Pollinations AI 使用 Flux Anime 模型，专门针对动漫风格优化，质量很好。

## 🧪 测试图片生成

如果您想测试图片生成是否正常工作：

1. 打开"设置" → "AI服务配置"
2. 滚动到"图片生成配置"部分
3. 点击"测试图片生成"按钮
4. 系统会生成一张测试图片

**注意**: 这个测试功能可能使用的是占位符服务，不是 Pollinations AI。真正的 Pollinations AI 只在完整工作流中使用。

## 🚀 开始使用

现在您可以：

1. **导入小说**: 点击"导入小说"按钮
2. **开始生成**: 系统会自动使用 Pollinations AI 生成图片
3. **查看结果**: 在项目视图中查看生成的图片

**就这么简单！无需任何额外配置！**

## 📝 技术细节（供开发者参考）

- **服务端点**: `McpMultiProviderImageServices.generate#ImageMultiProvider`
- **提供商**: `pollinations`
- **模型**: `flux-anime`
- **API**: 无需 API Key
- **费用**: 完全免费

## 🔧 如果遇到问题

如果图片生成失败，请检查：

1. **网络连接**: 确保可以访问互联网
2. **后端服务**: 确保 Moqui 后端正在运行（端口 8080）
3. **前端应用**: 确保前端应用正常运行
4. **浏览器控制台**: 按 F12 查看是否有错误信息

如果问题持续，请提供：
- 浏览器控制台的错误信息
- 后端日志（`runtime/log/moqui.log`）
- 您执行的具体操作步骤

---

**版本**: 1.0  
**更新**: 2026-01-25  
**相关 Spec**: 10-02-fix-image-generation-workflow
