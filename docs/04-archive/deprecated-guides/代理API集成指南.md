# 🔄 代理OpenAI API集成指南

## 概述
使用代理OpenAI API是一个很好的选择，特别是对于需要：
- 避免地理限制
- 提高访问稳定性
- 使用自定义端点
- 降低成本

## 🛠️ 配置方法

### 方案1: 通用代理API配置
```xml
<!-- 在 runtime/conf/MoquiDevConf.xml 中配置 -->
<default-property name="marketplace.ai.provider" value="OPENAI"/>
<default-property name="marketplace.ai.model" value="gpt-4o-mini"/>
<default-property name="marketplace.ai.api.base" value="YOUR_PROXY_BASE_URL"/>
<default-property name="marketplace.ai.api.key" value="YOUR_PROXY_API_KEY"/>
<default-property name="marketplace.ai.timeout.seconds" value="60"/>
```

### 方案2: 常见代理服务配置

#### OpenAI 兼容代理 (如 OneAPI、ChatGPT-Next-Web等)
```bash
# 配置示例
./openai_setup.sh "your-proxy-api-key"
# 然后手动修改 base_url
sed -i 's|https://api.openai.com|https://your-proxy-domain.com|g' runtime/conf/MoquiDevConf.xml
```

#### Azure OpenAI
```xml
<default-property name="marketplace.ai.api.base" value="https://your-resource.openai.azure.com"/>
<default-property name="marketplace.ai.api.key" value="your-azure-api-key"/>
```

#### 国内代理服务
```xml
<!-- 示例配置 -->
<default-property name="marketplace.ai.api.base" value="https://api.openai-proxy.com"/>
<default-property name="marketplace.ai.api.key" value="your-proxy-key"/>
```

## 🔍 代理API调试方法

### 1. 手动测试代理端点
```bash
# 测试代理API是否可用
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"测试"}],"max_tokens":10}' \
     YOUR_PROXY_URL/v1/chat/completions
```

### 2. 检查响应格式
确保代理API返回标准OpenAI格式：
```json
{
  "choices": [
    {
      "message": {
        "content": "响应内容"
      }
    }
  ]
}
```

### 3. 调试配置
```bash
# 查看当前配置
grep "marketplace.ai" runtime/conf/MoquiDevConf.xml

# 查看实时日志
tail -f runtime/log/moqui.log | grep -i "ai api"
```

## 🚀 针对您的TabCode代理的解决方案

基于您的配置，我创建了一个专用的配置脚本：

### 1. 创建TabCode专用配置
```bash
# 创建配置脚本
cat > tabcode_setup.sh << 'EOF'
#!/bin/bash

# TabCode代理API配置
API_KEY="sk-user-b068399a6e6d4bd97d6af72e"
BASE_URL="https://api.tabcode.cc/openai"

# 更新配置文件
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="'$BASE_URL'"/>|' runtime/conf/MoquiDevConf.xml
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$API_KEY'"/>|' runtime/conf/MoquiDevConf.xml

echo "✅ TabCode代理API已配置"
echo "🔄 请重启Moqui服务器"
EOF

chmod +x tabcode_setup.sh
```

### 2. 测试不同路径格式
```bash
# 测试可能的API路径
for path in "v1/chat/completions" "openai/v1/chat/completions" "api/v1/chat/completions"; do
    echo "Testing: https://api.tabcode.cc/$path"
    curl -s -H "Authorization: Bearer sk-user-b068399a6e6d4bd97d6af72e" \
         -H "Content-Type: application/json" \
         -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}],"max_tokens":5}' \
         https://api.tabcode.cc/$path | head -c 100
    echo -e "\n---"
done
```

## 🔧 系统适配

我们的系统已经完全支持代理API，因为：

1. **灵活的Base URL配置** - 可以指向任何OpenAI兼容的端点
2. **标准API格式** - 遵循OpenAI标准，兼容所有代理
3. **错误处理** - 自动降级到本地响应
4. **调试支持** - 完整的日志记录

## 💡 建议

1. **确认代理API格式**：联系TabCode确认正确的API路径
2. **测试连通性**：使用curl先测试代理是否可达
3. **备选方案**：如果TabCode不可用，推荐使用智谱AI等国产模型

## 🎯 即时可用方案

即使代理API暂时不可用，您的系统现在已经具备：
- ✅ 增强的本地智能对话
- ✅ 专业的供需匹配建议
- ✅ 完整的大模型集成架构

只要获得一个可用的API端点，系统立即升级为真正的AI助手！