# 智能推荐 - Moqui Framework

基于Moqui Framework构建的企业级智能推荐平台，集成多模态AI能力。

## 🚀 快速开始

### 系统要求
- **Java**: 21 LTS
- **内存**: 最低8GB

### 启动系统
```bash
./gradlew run
```

### 访问地址
- **主界面**: http://localhost:8080/qapps
- **用户名/密码**: john.doe / moqui

## 🎯 核心功能

- **🤖 多模态AI**: 语音识别、图像分析、智能对话
- **🏪 供需撮合**: AI驱动的智能匹配和价格分析
- **🔗 平台集成**: HiveMind、电商、ERP系统

## 📱 主要应用

- **智能推荐** (`/qapps/marketplace`): 供需发布、智能匹配
- **项目管理** (`/qapps/tools`): 任务管理、协作工具
- **系统管理** (`/qapps/system`): 用户权限、系统监控

## 🛠️ 技术架构

- **后端**: Moqui Framework 3.1.0 + Java 21 + JWT认证
- **前端**: Vue.js 3.5.22 + Quasar 2.18.5 + FreeMarker
- **AI**: 智谱AI GLM-4/GLM-4V + 多厂商备选
- **数据**: H2(开发) / MySQL(生产)

## 📚 文档

- **[技术报告](docs/)**: 实施总结和架构分析
- **[开发指南](CLAUDE.md)**: AI开发助手核心参考
- **[调试工具](testing-tools/)**: Chrome MCP认证、JWT测试等

## 🚀 开发状态

### ✅ 已完成
- 多模态AI平台集成 (智谱AI GLM-4/GLM-4V)
- JWT认证系统实施
- Vue3+Quasar2技术栈升级

### 🔄 进行中
- Telegram Bot集成
- 多模态消息处理

## 🤖 AI开发指南

- **核心参考**: [CLAUDE.md](CLAUDE.md)
- **认证模式**: Service用`authenticate="false"`，Screen用`require-authentication="false"`
- **强制验证**: 前端修改必须Chrome MCP验证

---

## 📚 更多资源

详细信息请参见Moqui Framework官方文档：

<https://www.moqui.org/docs/framework>

[![license](https://img.shields.io/badge/license-CC0%201.0%20Universal-blue.svg)](https://github.com/moqui/moqui-framework/blob/master/LICENSE.md)

---

**快速访问**: [系统首页](http://localhost:8080/qapps) | [技术文档](docs/) | [调试工具](testing-tools/)


