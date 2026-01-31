# ERP 项目设置指南 - 快速摘要

> **目标**: 在新电脑上快速设置 Moqui ERP 项目
> **时间**: 约 30-60 分钟
> **前置条件**: Java 21, Node.js 18+, Git

---

## 🚀 快速开始 (6 步)

### 0️⃣ 安装 KSE
```bash
# 全局安装 Kiro Spec Engine
npm install -g kiro-spec-engine

# 验证安装
kse --version
# 应该显示: 1.18.1 或更高版本
```

### 1️⃣ 克隆 Moqui Framework
```bash
# 使用 heguangyong 的 fork 版本
git clone git@github.com:heguangyong/moqui-framework.git erp-project
cd erp-project
gradle getRuntime

# 或手动克隆 runtime
git clone git@github.com:heguangyong/moqui-runtime.git runtime
```

### 2️⃣ 获取 ERP 组件
创建 `myaddons.xml` (使用 heguangyong 组):
```xml
<addons default-repository="github">
    <runtime name="moqui-runtime" group="heguangyong" version="3.0.0" branch="master"/>
    <component name="mantle-udm" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="mantle-usl" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="SimpleScreens" group="heguangyong" version="2.2.0" branch="master"/>
    <component name="MarbleERP" group="heguangyong" version="1.0.0" branch="master"/>
    <component name="HiveMind" group="heguangyong" version="1.5.0" branch="master"/>
    <component name="moqui-fop" group="heguangyong" version="1.1.3" branch="master"/>
</addons>
```

```bash
# 使用 Gradle 获取
gradle getComponent -Pcomponent=mantle-udm
gradle getComponent -Pcomponent=mantle-usl
gradle getComponent -Pcomponent=SimpleScreens
gradle getComponent -Pcomponent=MarbleERP

# 或手动克隆
git clone https://github.com/heguangyong/mantle-udm.git runtime/component/mantle-udm
git clone https://github.com/heguangyong/SimpleScreens.git runtime/component/SimpleScreens
```

### 3️⃣ 创建前端应用
```bash
mkdir -p frontend/YourERPDesktop
cd frontend/YourERPDesktop
npm init -y
npm install vue@^3.3.0 vue-router@^4.2.0 pinia@^2.1.0 axios@^1.6.0
npm install --save-dev electron@^28.0.0 vite@^5.0.0 @vitejs/plugin-vue@^4.0.0
```

### 4️⃣ 设置 Kiro + KSE 环境
```bash
cd ../..

# 初始化 KSE
kse init

# 或采用现有项目
kse adopt --dry-run  # 预览更改
kse adopt            # 执行采用

# 下载 Spec 模板
kse templates update

# 检查项目状态
kse status
kse doctor --docs
```

### 5️⃣ 构建和运行
```bash
# 后端
gradle clean build
gradle load
gradle run

# 前端 (新终端)
cd frontend/YourERPDesktop
npm run dev
```

### 6️⃣ 创建第一个 Spec
```bash
# 使用模板创建 Spec
kse create-spec 01-01-user-authentication -t backend-api

# 或使用 Kiro
# "我想创建一个用户认证功能的 Spec"
```

---

## 📁 项目结构

```
erp-project/
├── .kiro/                      # Kiro 开发体系
│   ├── specs/                  # Spec 文档
│   ├── steering/               # AI 规则
│   └── tools/                  # 开发工具
├── framework/                  # Moqui Framework
├── runtime/                    # Moqui Runtime
│   ├── component/              # 业务组件
│   │   ├── mantle-udm/         # 数据模型
│   │   ├── mantle-usl/         # 服务层
│   │   ├── SimpleScreens/      # 基础界面
│   │   └── MarbleERP/          # ERP 核心
│   └── conf/                   # 配置文件
├── frontend/                   # 前端应用
│   └── YourERPDesktop/         # Vue.js + Electron
├── build.gradle                # Gradle 构建
├── myaddons.xml                # 组件配置
└── MoquiInit.properties        # Moqui 配置
```

---

## 🔑 关键配置文件

### MoquiInit.properties
```properties
moqui_conf=conf/MoquiDevConf.xml
default_locale=zh_CN
default_time_zone=Asia/Shanghai
```

### runtime/conf/MoquiDevConf.xml
```xml
<moqui-conf>
    <entity-facade>
        <datasource group-name="transactional" database-conf-name="h2">
            <inline-jdbc jdbc-uri="jdbc:h2:./runtime/db/h2/moqui"/>
        </datasource>
    </entity-facade>
    <default-property name="webapp_allow_origins" 
                      value="http://localhost:5174,http://localhost:8080"/>
</moqui-conf>
```

### frontend/YourERPDesktop/package.json
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "electron src/main/main.js",
    "dev:renderer": "vite"
  }
}
```

---

## 🎯 Kiro Steering 文件

### 必需的 4 个文件

1. **CORE_PRINCIPLES.md** - 核心开发规范
   - Spec 驱动开发原则
   - 文件管理原则
   - Ultrawork 原则

2. **ENVIRONMENT.md** - 环境配置
   - 项目信息
   - 启动命令
   - 访问地址

3. **CURRENT_CONTEXT.md** - 当前场景
   - 当前状态
   - 当前 Spec
   - 下一步计划

4. **RULES_GUIDE.md** - 规则索引
   - 文件列表
   - 快速链接

---

## 🛠️ 常用命令

### KSE (Kiro Spec Engine)
```bash
kse --version               # 查看版本
kse status                  # 检查项目状态
kse status --verbose        # 详细状态
kse doctor --docs           # 文档合规性检查
kse templates list          # 列出可用模板
kse templates update        # 更新模板库
kse create-spec <name>      # 创建 Spec
kse create-spec <name> -t <template>  # 使用模板创建
kse workspace list          # 列出工作区
kse workspace create <name> # 创建工作区
kse workspace switch <name> # 切换工作区
```

### Gradle (后端)
```bash
gradle clean build          # 清理并构建
gradle load                 # 加载种子数据
gradle run                  # 启动开发服务器
gradle runProduction        # 启动生产服务器
gradle getComponent -Pcomponent=xxx  # 获取组件
gradle createComponent -Pcomponent=xxx  # 创建组件
```

### NPM (前端)
```bash
npm run dev                 # 启动开发模式
npm run build               # 构建生产版本
npm run dist                # 打包 Electron 应用
```

### Git
```bash
git init                    # 初始化仓库
git add .                   # 添加所有文件
git commit -m "Initial"     # 提交
git remote add origin xxx   # 添加远程仓库
git push -u origin master   # 推送
```

---

## 🌐 访问地址

- **后端 API**: http://localhost:8080
- **前端开发**: http://localhost:5174
- **默认账号**: admin / moqui

---

## ✅ 验证清单

### 环境检查
- [ ] Java 21 已安装 (`java -version`)
- [ ] Node.js 18+ 已安装 (`node -v`)
- [ ] Gradle 可用 (`gradle -v`)
- [ ] KSE 已安装 (`kse --version` >= 1.18.1)

### 项目设置
- [ ] Moqui 后端启动成功 (http://localhost:8080)
- [ ] 前端应用启动成功 (http://localhost:5174)
- [ ] 前后端可以通信
- [ ] .kiro 目录结构完整
- [ ] Git 仓库已初始化

### KSE 检查
- [ ] `kse status` 运行正常
- [ ] `kse doctor --docs` 无错误
- [ ] Spec 模板已下载 (`kse templates list`)
- [ ] 文档规范符合要求 (根目录只有 README.md)

### 开发准备
- [ ] 第一个 Spec 已创建
- [ ] Steering 文件配置完成
- [ ] 工作区设置完成 (如需要)

---

## 📖 详细文档

完整的设置指南请参考: **ERP_PROJECT_SETUP_GUIDE.md**

包含:
- 详细的步骤说明
- 完整的代码示例
- 配置文件模板
- 常见问题解答
- 参考资源链接

---

## 🎓 下一步

1. **检查项目状态**: `kse status` 和 `kse doctor --docs`
2. **查看可用模板**: `kse templates list`
3. **创建第一个 Spec**: `kse create-spec 01-01-user-authentication -t backend-api`
4. **使用 Kiro 开发**: 让 Kiro 引导你完成 Spec 的 requirements → design → tasks
5. **执行任务**: 使用 Kiro 实现功能
6. **监控进度**: 定期运行 `kse status` 检查项目健康状态
7. **迭代开发**: 继续创建新的 Spec 开发新功能

### 重要提示
- 保持文档规范: 根目录只保留 `README.md`
- 定期运行 `kse doctor --docs` 检查文档合规性
- 使用模板创建 Spec 以保持一致性
- 每个 Spec 必须包含 requirements.md, design.md, tasks.md

---

**文档版本**: v2.0  
**创建日期**: 2026-01-29  
**更新日期**: 2026-01-31  
**预计设置时间**: 30-60 分钟  
**KSE 版本**: 1.18.1+
