# 测试API Key (仅用于演示，不是真实密钥)
DEMO_ZHIPU_API_KEY="zhipu-demo-key-12345.abcdefghijklmnop"

# 如果您有真实的智谱AI API Key，请替换上面的值
# 获取地址: https://open.bigmodel.cn/

echo "🧪 演示智谱AI配置过程..."
echo "=================================="
echo ""
echo "1. 首先获取您的智谱AI API Key"
echo "   访问: https://open.bigmodel.cn/"
echo "   注册/登录 -> 创建API密钥"
echo ""
echo "2. 运行配置命令:"
echo "   ./zhipu_setup.sh YOUR_REAL_API_KEY"
echo ""
echo "3. 预期配置内容:"
echo "   marketplace.ai.provider=ZHIPU"
echo "   marketplace.ai.model=glm-4-plus"
echo "   marketplace.ai.api.base=https://open.bigmodel.cn/api/paas/v4"
echo "   marketplace.ai.api.key=YOUR_REAL_API_KEY"
echo ""
echo "4. 重启服务器后测试对话:"
echo ""
echo "📝 测试消息示例:"
echo '   "我想采购100吨优质钢材，要求含碳量0.3-0.5%，用于建筑结构，预算450万，希望能找到江苏或浙江的可靠供应商"'
echo ""
echo "🤖 AI增强后的响应将包含:"
echo "   ✅ 深度需求分析 (钢材规格、质量要求、地域偏好)"
echo "   ✅ 智能供应商匹配 (基于地理位置和产品规格)"
echo "   ✅ 市场价格分析 (当前行情和预算合理性)"
echo "   ✅ 采购建议优化 (时机、渠道、风险提示)"
echo ""
echo "💡 语义理解升级对比:"
echo "   Before: '检测到采购关键词 -> 标准采购回复'"
echo "   After:  '理解具体需求 -> 个性化专业建议'"
echo ""

if [ "$1" = "real" ] && [ -n "$2" ]; then
    echo "🚀 执行真实配置..."
    ./zhipu_setup.sh "$2"
else
    echo "⚠️  这是演示模式"
    echo "   要执行真实配置，请运行: $0 real YOUR_REAL_API_KEY"
fi