# 大模型集成配置文档

## 🚀 智能供需平台大模型集成完成

系统现已支持6种主流大模型，显著提升语义理解能力！

### ✅ 新增功能特性

1. **多模型支持**
   - OpenAI GPT (gpt-4o-mini, gpt-4o)
   - Claude-3.5-Sonnet (claude-3-5-sonnet-20241022)
   - 智谱AI GLM-4 (glm-4-plus) 🇨🇳
   - 通义千问 (qwen-plus) ☁️
   - 百度文心一言 (ERNIE-4.0-8K) 🔥
   - 讯飞星火 (4.0Ultra) ⚡

2. **智能配置系统**
   - 自动API密钥解析
   - 多种配置方式支持
   - 一键配置脚本

3. **语义理解增强**
   - 真正的AI对话能力
   - 上下文理解
   - 意图识别优化
   - 自然语言处理

### 🎯 推荐配置方案

#### 方案1: 智谱AI GLM-4 (推荐)
```bash
# 获取API Key: https://open.bigmodel.cn/
./zhipu_setup.sh YOUR_ZHIPU_API_KEY
```
**优势**: 中文理解优秀 + 成本最低 + 响应快速

#### 方案2: OpenAI GPT-4o-mini
```bash
# 获取API Key: https://platform.openai.com/api-keys
./openai_setup.sh YOUR_OPENAI_API_KEY
```
**优势**: 国际领先 + 多语言支持 + 生态完善

#### 方案3: Claude-3.5-Sonnet
```bash
# 获取API Key: https://console.anthropic.com/
./claude_api_setup.sh YOUR_CLAUDE_API_KEY
```
**优势**: 对话质量最高 + 推理能力强

### 🔧 快速配置步骤

1. **选择模型** - 根据需求选择合适的大模型
2. **获取API Key** - 在对应平台注册并获取密钥
3. **运行配置脚本** - 执行对应的setup脚本
4. **重启服务器** - 重启Moqui使配置生效
5. **测试对话** - 向Telegram机器人发送消息测试

### 💡 配置验证

配置完成后，可以通过以下方式验证：

```bash
# 检查配置
grep "marketplace.ai" runtime/conf/MoquiDevConf.xml

# 查看日志
tail -f runtime/log/moqui.log | grep -i "ai api"

# 测试机器人
curl -X POST "http://localhost:8080/rest/s1/mcp/telegram" \
  -H "Content-Type: application/json" \
  -d '{"update":{"message":{"chat":{"id":123},"from":{"id":456},"text":"你好，请为我详细分析当前钢材市场行情"}}}'
```

### 🌟 升级效果对比

| 功能 | 升级前 | 升级后 |
|------|--------|--------|
| 语义理解 | 关键词匹配 | 深度语义分析 |
| 对话质量 | 模板响应 | 智能生成 |
| 上下文 | 单��对话 | 多轮记忆 |
| 意图识别 | 简单规则 | AI智能识别 |
| 响应个性化 | 固定回复 | 动态生成 |

### 🛠️ 故障排除

1. **API调用失败**
   - 检查API Key是否正确
   - 验证网络连接
   - 确认余额充足

2. **编译错误**
   - 确认Java版本 (需要21+)
   - 重新编译: `./gradlew clean compileJava`

3. **配置不生效**
   - 重启Moqui服务器
   - 检查XML配置格式
   - 查看错误日志

现在您的智能供需平台具备了真正的AI语义理解能力！