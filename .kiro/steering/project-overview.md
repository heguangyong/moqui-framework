# 项目概览

智能推荐 (Smart Recommendation) - 基于 Moqui Framework 构建的企业级智能推荐平台，具备多模态AI能力。

## 产品特性

- **多模态AI**: 语音识别、图像分析、智能对话（基于智谱AI GLM-4/GLM-4V）
- **供需匹配**: AI驱动的智能匹配和价格分析市场
- **平台集成**: HiveMind项目管理、电商、ERP系统集成

## 主要应用

| 路径 | 应用名称 | 描述 |
|------|----------|------|
| `/qapps/marketplace` | 智能推荐 | 供需发布、智能匹配 |
| `/qapps/tools` | 项目管理 | 任务管理、协作工具 |
| `/qapps/system` | 系统管理 | 用户权限、系统监控 |

## 技术栈

### 后端技术
- **框架**: Moqui Framework 3.1.0
- **语言**: Java 21 LTS, Groovy
- **认证**: JWT + Apache Shiro
- **数据库**: H2 (开发) / MySQL (生产)
- **搜索**: OpenSearch 2.4.0 / ElasticSearch 7.10.2

### 前端技术
- **框架**: Vue.js 3.5.x + Quasar 2.18.x
- **构建工具**: Vite 7.x
- **状态管理**: Pinia 3.x
- **路由**: Vue Router 4.x
- **移动端**: Capacitor 7.x
- **语言**: TypeScript 5.9.x

### AI集成
- **主要提供商**: 智谱AI (GLM-4, GLM-4V-Plus)
- **能力**: 文本生成、语音转文字、图像识别

### 构建系统
- **后端**: Gradle (Groovy DSL)
- **前端**: npm/Vite

## 项目结构

### 根目录布局
```
moqui/
├── framework/          # Moqui Framework 核心
├── runtime/            # 运行时配置和组件
├── frontend/           # Vue.js/Quasar 移动前端
├── docker/             # Docker 部署配置
├── docs/               # 项目文档
└── testing-tools/      # 调试和测试脚本
```

### Framework 目录 (`framework/`)
Moqui Framework 核心 - 通常不修改。

```
framework/
├── src/main/           # Java/Groovy 源代码
├── entity/             # 核心实体定义 (XML)
├── service/            # 核心服务定义 (XML)
├── screen/             # 框架屏幕 (XML)
├── data/               # 种子数据 (XML)
└── xsd/                # XML Schema 定义
```

### Runtime 目录 (`runtime/`)
应用运行时 - 主要开发区域。

```
runtime/
├── component/          # 应用组件（主要开发区域）
│   ├── moqui-marketplace/   # 供需市场
│   ├── moqui-mcp/           # MCP AI集成
│   ├── HiveMind/            # 项目管理
│   ├── SimpleScreens/       # 通用UI屏幕
│   ├── mantle-udm/          # 通用数据模型
│   └── mantle-usl/          # 通用服务库
├── conf/               # 配置文件
│   ├── MoquiDevConf.xml     # 开发配置
│   └── MoquiProductionConf.xml
├── db/                 # 数据库文件 (H2)
└── log/                # 应用日志
```

### 组件结构
每个组件遵循以下模式：

```
component-name/
├── entity/             # 实体定义 (*.xml)
├── service/            # 服务定义 (*.xml)
├── screen/             # 屏幕定义 (*.xml)
├── data/               # 种子/演示数据 (*.xml)
└── MoquiConf.xml       # 组件配置
```

### Frontend 目录 (`frontend/moqui-ai-mobile/`)
Vue 3 + Quasar 移动应用。

```
frontend/moqui-ai-mobile/
├── src/
│   ├── components/     # 可复用Vue组件
│   ├── pages/          # 页面组件（路由）
│   ├── views/          # 视图组件
│   ├── router/         # Vue Router配置
│   ├── stores/         # Pinia状态存储
│   ├── services/       # API服务层
│   ├── styles/         # SCSS样式
│   └── utils/          # 工具函数
├── public/             # 静态资源
└── vite.config.ts      # Vite配置
```

## 关键配置文件

| 文件 | 用途 |
|------|------|
| `runtime/conf/MoquiDevConf.xml` | 开发配置、AI API密钥 |
| `build.gradle` | 根Gradle构建脚本 |
| `myaddons.xml` | 自定义组件依赖 |
| `frontend/*/vite.config.ts` | 前端构建配置 |

## 常用命令

### 后端命令
```bash
# 启动Moqui服务器
./gradlew run

# 构建WAR文件
./gradlew build

# 清理构建产物
./gradlew clean

# 清理数据库
./gradlew cleanDb

# 启动/停止OpenSearch
./gradlew startElasticSearch
./gradlew stopElasticSearch

# 运行测试
./gradlew test
```

### 前端命令 (在 `frontend/moqui-ai-mobile/` 目录下)
```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 类型检查
npm run type-check

# 代码检查和修复
npm run lint
```

## 系统要求

- Java 21 LTS
- Node.js 20.19+ 或 22.12+
- 最少 8GB RAM

## 默认访问

- **URL**: http://localhost:8080/qapps
- **凭据**: john.doe / moqui

## 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd moqui
   ```

2. **启动后端**
   ```bash
   ./gradlew run
   ```

3. **启动前端** (新终端)
   ```bash
   cd frontend/moqui-ai-mobile
   npm install
   npm run dev
   ```

4. **访问应用**
   - 后端: http://localhost:8080
   - 前端: http://localhost:3000 (如果单独运行)

## 部署架构

### 开发环境
- 本地H2数据库
- 内置Jetty服务器
- 热重载支持

### 生产环境
- MySQL/PostgreSQL数据库
- Docker容器部署
- 负载均衡和集群支持
- OpenSearch/ElasticSearch集群

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**适用范围**: 整个智能推荐平台项目  
**审批状态**: 待审批