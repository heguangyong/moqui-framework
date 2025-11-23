#!/bin/bash

echo "🎉 供需消息系统演示指南"
echo "========================="

# 检查服务状态
echo "📡 检查服务状态..."
if curl -s "http://localhost:5174" > /dev/null; then
    echo "✅ 前端服务正常运行: http://localhost:5174/"
else
    echo "❌ 前端服务未运行，请先启动: npm run dev"
    exit 1
fi

if curl -s "http://localhost:8080/Login" > /dev/null; then
    echo "✅ 后端Moqui服务正常: http://localhost:8080"
else
    echo "❌ 后端Moqui服务未运行"
    exit 1
fi

echo ""
echo "🚀 供需消息系统功能演示"
echo "======================="

echo ""
echo "📱 **核心功能页面**"
echo "   🏠 应用主页: http://localhost:5174/"
echo "   📋 消息广场: http://localhost:5174/marketplace"
echo "   ➕ 发布消息: http://localhost:5174/marketplace/publish"
echo "   🤖 智能匹配: http://localhost:5174/marketplace/smart-matching"

echo ""
echo "🧪 **API测试页面**"
echo "   🔧 API测试: http://localhost:5174/api-test"

echo ""
echo "📚 **后端Swagger文档**"
echo "   📖 Marketplace API: http://localhost:8080/toolstatic/lib/swagger-ui/index.html?url=http://localhost:8080/rest/service.swagger/marketplace"
echo "   🔧 Moqui核心API: http://localhost:8080/toolstatic/lib/swagger-ui/index.html?url=http://localhost:8080/rest/service.swagger/moqui"

echo ""
echo "✨ **演示流程建议**"
echo "=================="
echo ""
echo "1️⃣ **查看消息广场**"
echo "   - 访问: http://localhost:5174/marketplace"
echo "   - 功能: 浏览供需消息，筛选分类，搜索关键词"
echo "   - 特色: 卡片式布局，供应/需求标识，发布时间显示"

echo ""
echo "2️⃣ **发布消息测试**"
echo "   - 访问: http://localhost:5174/marketplace/publish"
echo "   - 功能: 发布供应或需求信息"
echo "   - AI特色: 自动标签提取，智能分类建议"
echo "   - 测试内容建议:"
echo "     供应: '优质建筑钢材批发，规格齐全，质量保证'"
echo "     需求: '寻找可靠物流配送服务，覆盖华东地区'"

echo ""
echo "3️⃣ **智能匹配体验**"
echo "   - 访问: http://localhost:5174/marketplace/smart-matching"
echo "   - 功能: AI分析匹配度，推荐相关供需信息"
echo "   - 特色: 匹配度评分，匹配原因分析，高质量匹配标识"

echo ""
echo "4️⃣ **联系沟通功能**"
echo "   - 在任意消息卡片点击'联系对方'按钮"
echo "   - 功能: 多渠道联系（电话、微信、邮件），留言功能"
echo "   - 特色: 一键拨号，微信号复制，邮件模板"

echo ""
echo "🎯 **系统特色亮点**"
echo "=================="
echo "✅ **消息面边界清晰**: 专注于信息发布和匹配，不涉及复杂业务流程"
echo "✅ **AI智能增强**: 标签提取、智能匹配、相关度评分"
echo "✅ **移动端优化**: 响应式设计，手势操作，对话框交互"
echo "✅ **Swagger规范**: API端点与官方文档完全一致"

echo ""
echo "🔑 **测试账号信息**"
echo "=================="
echo "用户名: john.doe"
echo "密码: moqui"

echo ""
echo "🎊 系统已准备就绪，可以开始演示了！"