# ERP 项目初始化指南

> **目标**: 在新电脑上使用 Kiro + KSE 创建新的 ERP 项目
> **基于**: 当前 Moqui Framework 项目结构
> **适用于**: 另一个 Kiro 实例通过 KSE 构建初始代码

---

## 📋 项目概述

### 技术栈
- **后端框架**: Moqui Framework 3.1.0 (heguangyong fork)
- **前端框架**: Vue.js 3 + Electron (独立桌面应用)
- **构建工具**: Gradle 8.x
- **Java 版本**: Java 21
- **数据库**: H2 (开发), PostgreSQL/MySQL (生产)
- **搜索引擎**: OpenSearch 2.4.0 / ElasticSearch 7.10.2

### 重要说明
**当前项目使用的是 `heguangyong` 的 Moqui Framework fork 版本，而非官方 `moqui` 仓库。**

所有组件都应该从 `https://github.com/heguangyong/` 获取，以确保版本兼容性。

### 项目结构
```
erp-project/
├── .kiro/                      # Kiro 核心目录
│   ├── specs/                  # Spec 驱动开发
│   ├── steering/               # AI 行为规则
│   └── tools/                  # 开发工具
├── framework/                  # Moqui Framework (git submodule)
├── runtime/                    # Moqui Runtime (git submodule)
│   ├── base-component/         # 基础组件
│   ├── component/              # 业务组件
│   │   ├── mantle-udm/         # 数据模型
│   │   ├── mantle-usl/         # 服务层
│   │   ├── SimpleScreens/      # 基础界面
│   │   ├── HiveMind/           # 项目管理
│   │   ├── MarbleERP/          # ERP 核心
│   │   └── [your-erp-component]/ # 自定义 ERP 组件
│   ├── conf/                   # 配置文件
│   ├── db/                     # 数据库文件
│   └── log/                    # 日志文件
├── frontend/                   # 前端应用目录
│   └── [your-erp-frontend]/    # 自定义前端应用
├── build.gradle                # Gradle 构建配置
├── settings.gradle             # Gradle 设置
├── addons.xml                  # Moqui 组件配置
├── myaddons.xml                # 自定义组件配置
└── MoquiInit.properties        # Moqui 初始化配置
```

---

## 🚀 第一步: 克隆 Moqui Framework

### 1.1 克隆主仓库

**重要**: 当前项目使用的是 `heguangyong` 的 fork 版本，而非官方 `moqui` 仓库。

```bash
# 创建项目目录
mkdir erp-project
cd erp-project

# 克隆 heguangyong 的 Moqui Framework fork
git clone git@github.com:heguangyong/moqui-framework.git .

# 或使用 HTTPS
git clone https://github.com/heguangyong/moqui-framework.git .

# 添加官方 upstream (可选，用于同步官方更新)
git remote add upstream https://github.com/moqui/moqui-framework.git
```

### 1.2 获取 Runtime 组件

Moqui 使用 `addons.xml` 和 `myaddons.xml` 管理组件。

**方式 1: 使用 Gradle 任务获取 Runtime**
```bash
# 获取 runtime 目录和默认组件
gradle getRuntime

# 或指定 location type
gradle getRuntime -PlocationType=git
```

**方式 2: 手动克隆 Runtime**
```bash
# 克隆 heguangyong 的 moqui-runtime fork 到 runtime 目录
git clone git@github.com:heguangyong/moqui-runtime.git runtime

# 或使用 HTTPS
git clone https://github.com/heguangyong/moqui-runtime.git runtime

# 添加官方 upstream (可选)
cd runtime
git remote add upstream https://github.com/moqui/moqui-runtime.git
cd ..
```

### 1.3 获取必需的 ERP 组件

**重要**: 使用 `heguangyong` 组的组件，这些是当前项目实际使用的版本。

创建 `myaddons.xml` 文件来管理自定义组件:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<addons default-repository="github">
    <!-- 定义 GitHub 仓库 -->
    <repository name="github">
        <location type="git" url="https://github.com/${component.'@group'}/${component.'@name'}.git"/>
    </repository>
    <repository name="github-ssh">
        <location type="git" url="git@github.com:${component.'@group'}/${component.'@name'}.git"/>
    </repository>
    
    <!-- Runtime (如果使用 gradle getRuntime) -->
    <runtime name="moqui-runtime" group="heguangyong" version="3.0.0" branch="master"/>
    
    <!-- ERP 核心组件 (heguangyong fork) -->
    <component name="mantle-udm" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="mantle-usl" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="SimpleScreens" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="MarbleERP" group="heguangyong" version="1.0.0" branch="master"/>
    <component name="HiveMind" group="heguangyong" version="1.5.0" branch="master"/>
    
    <!-- 工具组件 -->
    <component name="moqui-fop" group="heguangyong" version="1.1.3" branch="master"/>
    <component name="moqui-mcp" group="heguangyong" version="" branch="master"/>
    <component name="moqui-minio" group="heguangyong" version="" branch="master"/>
    
    <!-- 自定义 ERP 组件 (稍后创建) -->
    <!-- <component name="your-erp-component" group="your-group" branch="master"/> -->
</addons>
```

获取组件:
```bash
# 方式 1: 使用 Gradle 任务获取组件 (推荐)
gradle getComponent -Pcomponent=mantle-udm
gradle getComponent -Pcomponent=mantle-usl
gradle getComponent -Pcomponent=SimpleScreens
gradle getComponent -Pcomponent=MarbleERP
gradle getComponent -Pcomponent=HiveMind
gradle getComponent -Pcomponent=moqui-fop

# 方式 2: 手动克隆组件到 runtime/component/ 目录
git clone https://github.com/heguangyong/mantle-udm.git runtime/component/mantle-udm
git clone https://github.com/heguangyong/mantle-usl.git runtime/component/mantle-usl
git clone https://github.com/heguangyong/SimpleScreens.git runtime/component/SimpleScreens
git clone https://github.com/heguangyong/MarbleERP.git runtime/component/MarbleERP
git clone https://github.com/heguangyong/HiveMind.git runtime/component/HiveMind
git clone https://github.com/heguangyong/moqui-fop.git runtime/component/moqui-fop
```

---

## 🏗️ 第二步: 创建自定义 ERP 组件

### 2.1 使用 Gradle 创建组件

```bash
# 创建新组件 (基于 moqui/start 模板)
gradle createComponent -Pcomponent=your-erp-component

# 交互式选择:
# 1. Select rest api (r), screens (s), or both (B): B
# 2. Are you going to code or test in groovy or java [y/N]: y
# 3. Setup a git repository [Y/n]: Y
# 4. Enter the git remote url: git@github.com:your-group/your-erp-component.git
# 5. Add to myaddons.xml [Y/n]: Y
# 6. Enter the component git repository group: your-group
# 7. Enter the component git repository name: your-erp-component
```

### 2.2 组件目录结构

```
runtime/component/your-erp-component/
├── data/                       # 种子数据
│   ├── AppSeedData.xml         # 应用种子数据
│   └── ApiSeedData.xml         # API 种子数据
├── entity/                     # 实体定义
│   └── YourEntities.xml
├── screen/                     # 界面定义
│   └── YourScreens.xml
├── service/                    # 服务定义
│   ├── your-erp-component.rest.xml  # REST API
│   └── YourServices.xml
├── src/                        # Java/Groovy 源码
│   ├── main/
│   └── test/
├── template/                   # 模板文件
├── build.gradle                # 组件构建配置
├── component.xml               # 组件元数据
└── MoquiConf.xml               # 组件配置
```

### 2.3 配置组件元数据

编辑 `runtime/component/your-erp-component/component.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<component xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-3.xsd"
           name="your-erp-component" version="1.0.0">
    <depends-on name="mantle-udm"/>
    <depends-on name="mantle-usl"/>
    <depends-on name="SimpleScreens"/>
</component>
```

---

## 💻 第三步: 创建前端应用

### 3.1 创建前端目录结构

```bash
# 在项目根目录创建 frontend 目录
mkdir -p frontend/YourERPDesktop
cd frontend/YourERPDesktop
```

### 3.2 初始化 Vue.js + Electron 项目

```bash
# 初始化 npm 项目
npm init -y

# 安装核心依赖
npm install vue@^3.3.0 vue-router@^4.2.0 pinia@^2.1.0 axios@^1.6.0

# 安装 Electron
npm install --save-dev electron@^28.0.0

# 安装构建工具
npm install --save-dev vite@^5.0.0 @vitejs/plugin-vue@^4.0.0
npm install --save-dev concurrently@^8.0.0 electron-builder@^24.0.0

# 安装 UI 库 (可选)
npm install lucide-vue-next@^0.561.0 sass@^1.97.0
```

### 3.3 创建基础文件结构

```
frontend/YourERPDesktop/
├── src/
│   ├── main/                   # Electron 主进程
│   │   └── main.js
│   └── renderer/               # Vue.js 渲染进程
│       ├── assets/
│       ├── components/
│       ├── views/
│       ├── stores/             # Pinia stores
│       ├── services/           # API services
│       ├── router/
│       ├── App.vue
│       ├── main.js
│       └── index.html
├── dist-renderer/              # 构建输出
├── dist-electron/              # 打包输出
├── package.json
├── vite.config.js
└── README.md
```

### 3.4 配置 package.json

```json
{
  "name": "your-erp-desktop",
  "version": "1.0.0",
  "description": "Your ERP Desktop Application",
  "main": "src/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "electron src/main/main.js",
    "dev:renderer": "vite",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build",
    "build:main": "echo 'Main process ready'",
    "dist": "npm run build && electron-builder"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^4.0.0",
    "concurrently": "^8.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

### 3.5 配置 vite.config.js

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist-renderer',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 5174,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer')
    }
  }
});
```

### 3.6 创建 Electron 主进程

`src/main/main.js`:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 开发模式加载 Vite 服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式加载构建文件
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

---

## ⚙️ 第四步: 配置 Moqui

### 4.1 配置 MoquiInit.properties

```properties
# Moqui 初始化配置
moqui_conf=conf/MoquiDevConf.xml
default_locale=zh_CN
default_time_zone=Asia/Shanghai
```

### 4.2 配置 MoquiDevConf.xml

创建 `runtime/conf/MoquiDevConf.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<moqui-conf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-conf-3.xsd">
    
    <!-- 数据库配置 -->
    <entity-facade>
        <datasource group-name="transactional" database-conf-name="h2" 
                    schema-name="" startup-add-missing="true">
            <inline-jdbc jdbc-uri="jdbc:h2:./runtime/db/h2/moqui"
                         jdbc-username="sa" jdbc-password="sa" 
                         pool-minsize="2" pool-maxsize="50"/>
        </datasource>
    </entity-facade>
    
    <!-- Web 服务器配置 -->
    <webapp-list>
        <webapp name="webroot">
            <root-screen host=".*" location="component://webroot/screen/webroot.xml"/>
            <first-hit-in-visit>
                <request-parameter name="moquiSessionToken" from="session-token"/>
            </first-hit-in-visit>
        </webapp>
    </webapp-list>
    
    <!-- CORS 配置 (允许前端访问) -->
    <default-property name="webapp_allow_origins" value="http://localhost:5174,http://localhost:8080"/>
</moqui-conf>
```

### 4.3 配置 build.gradle

确保 `build.gradle` 包含必要的配置 (通常已包含在 Moqui Framework 中)。

---

## 🎯 第五步: 设置 Kiro 开发环境

### 5.1 创建 .kiro 目录结构

```bash
mkdir -p .kiro/specs
mkdir -p .kiro/steering
mkdir -p .kiro/tools
```

### 5.2 创建核心 Steering 文件

**`.kiro/steering/CORE_PRINCIPLES.md`** - 从当前项目复制:

```markdown
# 核心开发原则（基准规则）

> 适用于所有 Spec 的稳定核心原则

## 📋 Spec 驱动开发工作流程

### Spec 命名规范
- 格式: `{序号}-{序号}-{简短描述}`
- 使用 kebab-case
- 示例: `01-01-user-authentication`

### 标准工作流程
1. 创建 Spec → 2. requirements.md → 3. design.md → 4. tasks.md → 5. 执行任务 → 6. 产物归档

## ⚠️ 核心原则

1. **Spec 驱动开发原则**: 任何需求都必须先建立 Spec
2. **文件管理原则**: 禁止在根目录下随意生成临时文件
3. **代码质量原则**: 代码必须能够编译通过
4. **Ultrawork 原则**: 像西西弗斯一样不懈努力，追求专业级质量
5. **问题解决态度**: 但凡有问题没有解决，一定是我搞错了
6. **上下文管控原则**: 必须主动管控上下文，避免 token 耗尽

---

**版本**: v5.0  
**更新**: 2026-01-29
```

**`.kiro/steering/ENVIRONMENT.md`** - 根据新项目调整:

```markdown
# 项目环境配置

## 📋 项目基本信息

- **项目名称**: Your ERP Project
- **项目类型**: Moqui Framework + Vue.js ERP 系统
- **核心技术**: Moqui 3.1.0 + Vue.js 3 + Electron
- **开发语言**: Java 21, Groovy, JavaScript/TypeScript

## 🖥️ 开发环境

### 本地环境
- **操作系统**: macOS / Windows / Linux
- **Java**: JDK 21
- **Node.js**: 18.x+
- **Gradle**: 8.x

### 核心组件
- **Spec 系统**: `.kiro/specs/` - Spec 驱动开发
- **Steering 系统**: `.kiro/steering/` - AI 行为规则
- **工具系统**: `.kiro/tools/` - 开发工具

## 🚀 启动命令

**后端 (Moqui)**:
```bash
# 开发模式
gradle run

# 生产模式
gradle runProduction

# 加载数据
gradle load
```

**前端 (Vue.js + Electron)**:
```bash
cd frontend/YourERPDesktop

# 开发模式
npm run dev

# 构建
npm run build

# 打包
npm run dist
```

## 🌐 访问地址

- **后端 API**: http://localhost:8080
- **前端开发**: http://localhost:5174
- **Electron 应用**: 独立窗口

---

**版本**: v1.0  
**更新**: 2026-01-29
```

**`.kiro/steering/CURRENT_CONTEXT.md`** - 初始状态:

```markdown
# 当前场景规则（可变）

## 🎯 当前状态

**状态**: 🟢 项目初始化  
**当前任务**: 设置开发环境  
**最后更新**: 2026-01-29

## 📝 当前 Spec 信息

**Spec**: 无 - 项目初始化阶段

**下一步**: 
1. 完成 Moqui 后端配置
2. 完成前端应用初始化
3. 创建第一个 Spec (如: 01-01-user-authentication)

---

**版本**: v1.0  
**更新**: 2026-01-29
```

**`.kiro/steering/RULES_GUIDE.md`** - 规则索引:

```markdown
# Steering 规则索引

## 📚 文件列表

| 文件 | 职责 | 更新频率 |
|------|------|---------|
| **CORE_PRINCIPLES.md** | 核心开发规范 | 很少 |
| **ENVIRONMENT.md** | 环境配置 | 很少 |
| **CURRENT_CONTEXT.md** | 当前 Spec 场景 | 每个 Spec ⚠️ |

## 🔗 快速链接

- **当前场景**: `CURRENT_CONTEXT.md`
- **开发规范**: `CORE_PRINCIPLES.md`
- **环境配置**: `ENVIRONMENT.md`
- **Spec 工作流**: `../specs/SPEC_WORKFLOW_GUIDE.md`

---

**版本**: v2.0  
**更新**: 2026-01-29
```

### 5.3 创建 Spec 工作流指南

**`.kiro/specs/SPEC_WORKFLOW_GUIDE.md`** - 从当前项目复制完整内容。

### 5.4 创建 README.md

**`.kiro/README.md`**:

```markdown
# Kiro 开发体系

本目录包含 Kiro AI 驱动开发的核心文件和配置。

## 📁 目录结构

- **specs/**: Spec 驱动开发的所有 Spec 文档
- **steering/**: AI 行为规则和上下文管理
- **tools/**: 开发工具和脚本

## 🚀 快速开始

1. 阅读 `steering/CORE_PRINCIPLES.md` 了解核心原则
2. 阅读 `steering/ENVIRONMENT.md` 了解环境配置
3. 阅读 `specs/SPEC_WORKFLOW_GUIDE.md` 了解 Spec 工作流
4. 创建第一个 Spec 开始开发

## 📖 文档

- [Spec 工作流指南](specs/SPEC_WORKFLOW_GUIDE.md)
- [核心开发原则](steering/CORE_PRINCIPLES.md)
- [环境配置](steering/ENVIRONMENT.md)

---

**版本**: v1.0  
**更新**: 2026-01-29
```

---

## 🔧 第六步: 构建和运行

### 6.1 构建 Moqui

```bash
# 清理并构建
gradle clean build

# 加载种子数据
gradle load

# 或加载特定类型的数据
gradle load -Ptypes=seed,seed-initial
```

### 6.2 启动 Moqui 后端

```bash
# 开发模式
gradle run

# 访问: http://localhost:8080
```

### 6.3 启动前端应用

```bash
cd frontend/YourERPDesktop

# 开发模式
npm run dev

# 前端会在 http://localhost:5174 启动
# Electron 窗口会自动打开
```

### 6.4 验证连接

1. 打开浏览器访问 `http://localhost:8080`
2. 使用默认账号登录: `admin` / `moqui`
3. 前端应用应该能够通过 API 连接到后端

---

## 📦 第七步: 版本控制

### 7.1 初始化 Git 仓库

```bash
# 在项目根目录
git init

# 添加 .gitignore
cat > .gitignore << 'EOF'
# Gradle
.gradle/
build/
execwartmp/
wartemp/

# Runtime
runtime/db/
runtime/log/
runtime/sessions/
runtime/tmp/
runtime/txlog/
runtime/node_modules/

# IDE
.idea/
*.iml
.vscode/
.DS_Store

# Node
node_modules/
dist-renderer/
dist-electron/

# Moqui
*.war
*.pid
EOF

# 提交初始代码
git add .
git commit -m "Initial commit: ERP project setup"
```

### 7.2 设置远程仓库

```bash
# 添加远程仓库 (替换为你的仓库地址)
git remote add origin git@github.com:your-group/your-erp-project.git

# 推送到远程
git push -u origin master

# 如果需要，添加 heguangyong 的仓库作为 upstream (用于同步更新)
git remote add upstream git@github.com:heguangyong/moqui-framework.git
```

### 7.3 管理子模块 (如果使用)

如果 runtime 是作为 git submodule:

```bash
# 添加 runtime 为 submodule (使用 heguangyong 的版本)
git submodule add git@github.com:heguangyong/moqui-runtime.git runtime

# 初始化和更新 submodules
git submodule init
git submodule update

# 递归克隆所有 submodules
git submodule update --init --recursive
```

**注意**: 当前项目的 runtime 和 component 目录都是独立的 git 仓库，而非 submodule。每个组件都有自己的 `.git` 目录。

---

## 🎓 第八步: 使用 KSE (Kiro Spec Engine)

### 8.1 安装 KSE

```bash
# 全局安装 KSE
npm install -g kiro-spec-engine

# 验证安装
kse --version
# 应该显示: 1.18.1 或更高版本
```

### 8.2 初始化 KSE 项目

**方式 1: 新项目初始化**
```bash
# 在项目根目录
kse init

# KSE 会创建:
# - .kiro/ 目录结构
# - steering/ 文件 (CORE_PRINCIPLES.md, ENVIRONMENT.md, etc.)
# - specs/ 目录
```

**方式 2: 采用现有项目**
```bash
# 如果已有 .kiro 目录，使用 adopt
kse adopt

# 预览更改 (推荐)
kse adopt --dry-run

# 详细日志
kse adopt --verbose
```

### 8.3 检查项目状态

```bash
# 检查项目健康状态
kse status

# 详细信息
kse status --verbose

# 文档合规性检查
kse doctor --docs

# 修复 .gitignore
kse doctor --fix-gitignore
```

### 8.4 使用模板创建 Spec

**下载官方模板**:
```bash
# 更新模板库
kse templates update

# 列出可用模板
kse templates list

# 搜索模板
kse templates search backend

# 查看模板详情
kse templates show backend-api
```

**使用模板创建 Spec**:
```bash
# 使用默认模板
kse create-spec 01-01-user-authentication

# 使用指定模板
kse create-spec 01-02-api-integration -t backend-api

# 使用 REST API 模板
kse create-spec 01-03-rest-service -t rest-api
```

**从现有 Spec 创建模板**:
```bash
# 将成功的 Spec 转换为团队模板
kse templates create-from-spec
```

### 8.5 管理多个工作区

如果你需要管理多个 ERP 项目或模块:

```bash
# 创建工作区
kse workspace create erp-main
kse workspace create erp-inventory
kse workspace create erp-finance

# 列出所有工作区
kse workspace list

# 切换工作区
kse workspace switch erp-inventory

# 查看当前工作区信息
kse workspace info

# 删除工作区
kse workspace remove erp-test
```

### 8.6 创建第一个 Spec

**使用 Kiro + KSE**:

```
我想创建一个用户认证功能的 Spec
```

Kiro 会引导你完成:
1. 创建 `.kiro/specs/01-01-user-authentication/` 目录
2. 生成 `requirements.md` (需求文档)
3. 生成 `design.md` (设计文档)
4. 生成 `tasks.md` (任务列表)

**或使用 KSE 命令**:
```bash
# 创建 Spec
kse create-spec 01-01-user-authentication

# 使用模板创建
kse create-spec 01-01-user-authentication -t backend-api
```

### 8.7 执行 Spec 任务

```
执行 Spec 01-01-user-authentication 的第一个任务
```

Kiro 会:
1. 读取任务详情
2. 实现代码
3. 运行测试
4. 更新任务状态

### 8.8 监控项目进度

```bash
# 查看所有 Specs 状态
kse status

# 查看详细进度
kse status --verbose

# 查看团队活动 (如果是团队项目)
kse status --team
```

### 8.9 文档治理

```bash
# 检查文档合规性
kse doctor --docs

# 归档 Spec 产物
kse docs archive --spec 01-01-user-authentication

# 验证所有文档
kse validate --all

# 清理临时文件
kse cleanup
```

### 8.10 迭代开发

按照 Spec 驱动开发流程:
1. 需求 → 设计 → 任务 → 实现 → 测试 → 归档
2. 每个功能都创建独立的 Spec
3. 使用 Kiro + KSE 辅助完成所有开发任务
4. 定期运行 `kse status` 检查项目健康状态
5. 使用 `kse templates` 提高 Spec 创建效率

---

## 📚 参考资源

### Moqui 文档
- [Moqui Framework 官方文档](https://www.moqui.org/framework/docs.html)
- [Moqui Framework 官方 GitHub](https://github.com/moqui/moqui-framework)
- [当前项目使用的 Fork (heguangyong)](https://github.com/heguangyong/moqui-framework)
- [heguangyong/moqui-runtime](https://github.com/heguangyong/moqui-runtime)
- [heguangyong/mantle-udm](https://github.com/heguangyong/mantle-udm)
- [heguangyong/SimpleScreens](https://github.com/heguangyong/SimpleScreens)
- [heguangyong/MarbleERP](https://github.com/heguangyong/MarbleERP)

### Vue.js + Electron 文档
- [Vue.js 3 官方文档](https://vuejs.org/)
- [Electron 官方文档](https://www.electronjs.org/)
- [Vite 官方文档](https://vitejs.dev/)

### Kiro + KSE 开发
- 参考当前项目的 `.kiro/` 目录结构
- 阅读 `SPEC_WORKFLOW_GUIDE.md` 了解完整工作流
- 使用 Kiro 的 Spec 驱动开发方法论
- [KSE 1.18.1 新特性文档](KSE_1.18.1_NEW_FEATURES.md)

### KSE 命令参考
```bash
kse --help                  # 查看所有命令
kse <command> --help        # 查看特定命令帮助
kse version-info            # 查看详细版本信息
kse status                  # 检查项目状态
kse doctor --docs           # 文档合规性检查
kse templates list          # 列出可用模板
kse workspace list          # 列出所有工作区
```

---

## 🔍 常见问题

### Q1: Gradle 构建失败
**A**: 检查 Java 版本是否为 21，运行 `java -version` 确认。

### Q2: Runtime 组件获取失败
**A**: 检查网络连接，或手动克隆 `moqui-runtime` 仓库到 `runtime/` 目录。

### Q3: 前端无法连接后端
**A**: 检查 CORS 配置，确保 `MoquiDevConf.xml` 中包含前端地址。

### Q4: 数据库初始化失败
**A**: 删除 `runtime/db/` 目录，重新运行 `gradle load`。

### Q5: Electron 窗口无法打开
**A**: 检查 Node.js 版本，确保 >= 18.x，重新安装依赖 `npm install`。

### Q6: KSE 报告文档违规
**A**: 运行 `kse doctor --docs` 查看详细诊断，将文档移到正确位置:
- 项目文档 → `docs/` 目录
- Spec 文档 → `.kiro/specs/{spec-name}/` 目录
- 根目录只保留 `README.md`

### Q7: KSE 模板列表为空
**A**: 运行 `kse templates update` 下载官方模板库。

### Q8: 如何管理多个 ERP 模块
**A**: 使用 `kse workspace` 命令创建和管理多个工作区:
```bash
kse workspace create erp-inventory
kse workspace switch erp-inventory
```

### Q9: Spec 缺少必需文件
**A**: 每个 Spec 必须包含三个文件:
- `requirements.md`
- `design.md`
- `tasks.md`

使用 `kse create-spec` 命令会自动创建这些文件。

### Q10: 如何检查项目健康状态
**A**: 定期运行以下命令:
```bash
kse status              # 项目状态和 Spec 进度
kse doctor --docs       # 文档合规性检查
kse status --verbose    # 详细信息
```

---

## ✅ 检查清单

完成以下步骤后，项目应该可以正常运行:

### 基础设置
- [ ] 安装 KSE (`npm install -g kiro-spec-engine`)
- [ ] 验证 KSE 版本 (`kse --version` >= 1.18.1)
- [ ] 克隆 Moqui Framework (heguangyong fork)
- [ ] 获取 Runtime 和必需组件
- [ ] 创建自定义 ERP 组件
- [ ] 创建前端应用

### Moqui 配置
- [ ] 配置 MoquiInit.properties
- [ ] 配置 MoquiDevConf.xml
- [ ] 配置 myaddons.xml

### Kiro + KSE 设置
- [ ] 初始化 KSE (`kse init` 或 `kse adopt`)
- [ ] 设置 .kiro 目录和 Steering 文件
- [ ] 运行 `kse doctor --docs` 检查文档合规性
- [ ] 修复文档违规 (如有)
- [ ] 下载 Spec 模板 (`kse templates update`)

### 构建和运行
- [ ] 构建 Moqui (`gradle build`)
- [ ] 加载种子数据 (`gradle load`)
- [ ] 启动后端 (`gradle run`)
- [ ] 启动前端 (`npm run dev`)
- [ ] 验证前后端连接

### 版本控制
- [ ] 初始化 Git 仓库
- [ ] 配置 .gitignore
- [ ] 提交初始代码
- [ ] 推送到远程仓库

### 开始开发
- [ ] 运行 `kse status` 检查项目状态
- [ ] 创建第一个 Spec (使用模板)
- [ ] 设置工作区 (如需要多项目管理)
- [ ] 开始第一个功能开发

### 文档规范检查
- [ ] 根目录只保留 `README.md`
- [ ] 项目文档在 `docs/` 目录
- [ ] 每个 Spec 包含三个必需文件 (requirements.md, design.md, tasks.md)
- [ ] 运行 `kse doctor --docs` 无错误

---

## 🎉 完成

恭喜！你已经成功设置了一个基于 Moqui Framework 的 ERP 项目，并集成了 Kiro + KSE 驱动开发体系。

现在你可以:
1. 使用 Kiro + KSE 创建 Spec 来驱动开发
2. 在 Moqui 后端实现业务逻辑
3. 在 Vue.js 前端构建用户界面
4. 使用 Electron 打包为桌面应用
5. 使用 `kse status` 监控项目进度
6. 使用 `kse templates` 提高开发效率
7. 使用 `kse workspace` 管理多个模块

**下一步**: 
1. 运行 `kse templates list` 查看可用模板
2. 创建你的第一个 Spec: `kse create-spec 01-01-your-feature -t backend-api`
3. 使用 Kiro 开始开发第一个功能
4. 定期运行 `kse status` 检查项目健康状态

**重要提示**:
- 保持文档规范: 根目录只保留 `README.md`
- 定期运行 `kse doctor --docs` 检查文档合规性
- 使用模板创建 Spec 以保持一致性
- 每个 Spec 必须包含 requirements.md, design.md, tasks.md

---

**文档版本**: v2.0  
**创建日期**: 2026-01-29  
**更新日期**: 2026-01-31  
**适用于**: Moqui Framework 3.1.0 + Vue.js 3 + Electron 28 + KSE 1.18.1  
**维护者**: Kiro AI Assistant
