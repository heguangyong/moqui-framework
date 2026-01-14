# Specs编号管理系统

本文档定义了基于纯数字编号的specs目录管理方案，采用扁平化结构，通过编号实现分类和排序。

## 核心理念

### 设计原则
- **扁平化结构**: 所有specs在同一层级，避免深层嵌套
- **数字分类**: 通过数字分类码实现功能域分类
- **顺序编号**: 同类功能按创建顺序或重要性编号
- **跨平台兼容**: 纯数字编号确保所有系统和工具完全兼容

### 优势
- **简洁高效**: 无需创建多层目录结构
- **快速定位**: 通过分类码快速找到相关功能
- **易于维护**: 添加、移动、重命名更加简单
- **排序清晰**: 文件系统自动按编号排序
- **完全兼容**: 避免中文路径的跨平台兼容性问题
- **命令行友好**: 易于输入和自动补全
- **代码安全**: 可以在代码中安全引用路径

## 编号系统演进历史

### 演进过程

**第一代：无编号系统**
- 问题：目录无序，难以管理和查找
- 示例：`ai-integration/`, `smart-hive-platform/`

**第二代：英文语义化编号**
- 改进：引入分类前缀和序号
- 示例：`core-01-ai-integration/`, `biz-01-smart-hive-platform/`

**第三代：中文语义化编号**
- 改进：使用中文分类提升可读性
- 示例：`核心-01-ai-integration/`, `业务-01-smart-hive-platform/`
- 问题：中文路径在某些系统和工具中存在兼容性问题

**第四代：纯数字编号（当前）**
- 改进：使用数字分类码，完全避免兼容性问题
- 示例：`01-01-ai-integration/`, `02-01-smart-hive-platform/`
- 优势：跨平台兼容、命令行友好、代码安全

### 为什么选择纯数字编号？

**跨平台兼容性**:
- ✅ 完全兼容所有操作系统（Windows/Linux/macOS）
- ✅ 无中文编码问题
- ✅ Git友好，无字符集冲突
- ✅ 所有工具链完全支持

**命令行友好**:
- ✅ 数字易于输入，支持Tab自动补全
- ✅ 避免输入法切换的麻烦
- ✅ 脚本处理更加简单
- ✅ 正则表达式匹配简单

**代码引用安全**:
- ✅ 可以在代码中安全引用specs路径
- ✅ 无需担心编码转换问题
- ✅ 工具链完全兼容
- ✅ CI/CD流水线友好

**保持可读性**:
- ✅ 在README.md中使用中文描述
- ✅ 分类码映射清晰
- ✅ 文档中保持中文友好性
- ✅ 元数据中使用中文标注

## 编号规范

### 编号格式

**纯数字编号（当前使用）**:
```
[分类码]-[序号]-[功能名称]

示例:
01-01-ai-integration          # 核心平台 - AI集成
01-02-jwt-authentication      # 核心平台 - JWT认证
02-01-smart-hive-platform     # 业务应用 - 智慧蜂巢
03-01-mobile-system           # 前端系统 - 移动端
```

### 分类定义

#### 01 - 核心平台 (Core Platform)
**范围**: 系统基础设施和核心能力  
**特征**: 被其他功能依赖，技术性强，稳定性要求高  
**编号示例**: `01-01`, `01-02`, `01-03`...

#### 02 - 业务应用 (Business Applications)
**范围**: 面向最终用户的业务功能应用  
**特征**: 业务导向，用户可见，价值直接  
**编号示例**: `02-01`, `02-02`, `02-03`...

#### 03 - 前端系统 (Frontend Systems)
**范围**: 前端技术架构和用户界面系统  
**特征**: UI/UX相关，跨平台支持，交互设计  
**编号示例**: `03-01`, `03-02`, `03-03`...

#### 04 - 平台组件 (Platform Components)
**范围**: 可复用的平台级技术组件  
**特征**: 技术组件，可独立部署，服务化  
**编号示例**: `04-01`, `04-02`, `04-03`...

#### 05 - 系统管理 (System Management)
**范围**: 系统运维和管理相关功能  
**特征**: 运维导向，管理工具，支撑性质  
**编号示例**: `05-01`, `05-02`, `05-03`...

#### 06 - 开发工具 (Development Tools)
**范围**: 开发过程中使用的工具和脚本  
**特征**: 开发辅助，自动化工具，效率提升  
**编号示例**: `06-01`, `06-02`, `06-03`...

#### 07 - 归档 (Archived)
**范围**: 不再活跃但保留参考价值的功能  
**特征**: 只读状态，历史参考  
**编号示例**: `07-01`, `07-02`...

#### 08 - 废弃 (Deprecated)
**范围**: 已被替代或不再使用的功能  
**特征**: 标记废弃，计划删除  
**编号示例**: `08-01`, `08-02`...

### 序号分配原则

#### 优先级排序
- **01-09**: P0级核心功能，最高优先级
- **10-29**: P1级重要功能，高优先级
- **30-49**: P2级常规功能，中等优先级
- **50-69**: P3级辅助功能，低优先级
- **70-89**: 实验性功能或临时功能
- **90-99**: 预留或特殊用途

#### 编号分配策略
1. **按重要性**: 核心功能使用较小的序号
2. **按创建顺序**: 同等重要性按创建时间排序
3. **预留空间**: 相关功能之间预留编号空间，便于插入
4. **避免重编号**: 尽量避免频繁调整已有编号

## 目录结构

### 标准结构（纯数字编号）
```
.kiro/specs/
├── README.md                                    # 总索引
├── MIGRATION_COMPLETE.md                       # 迁移完成报告
│
├── 01-01-ai-integration/                       # 核心平台
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   └── testing/
│
├── 01-02-jwt-authentication/
├── 01-03-mcp-unified-architecture/
├── 01-04-multimodal-ai/
│
├── 02-01-smart-hive-platform/                  # 业务应用
├── 02-02-econowatch-system/
├── 02-03-shanghai-port-logistics/
├── 02-04-marketplace-platform/
│
├── 03-01-mobile-system/                        # 前端系统
├── 03-02-web-system/
│
├── 04-01-telegram-bot/                         # 平台组件
├── 04-02-moqui-platform/
│
├── 05-01-document-management/                  # 系统管理
├── 05-02-user-management/
├── 05-03-system-integration/
│
├── 06-01-novel-processing-pipeline/            # 开发工具
├── 06-02-data-migration/
│
├── 07-01-[feature-name]/                       # 归档
└── 08-01-[feature-name]/                       # 废弃
```

## 迁移映射表

### 原始目录 → 纯数字编号目录

| 原始名称 | 最终名称 | 分类 | 优先级 |
|---------|--------|------|--------|
| `ai-integration/` | `01-01-ai-integration/` | 核心平台 | P0 |
| `jwt-authentication/` | `01-02-jwt-authentication/` | 核心平台 | P0 |
| `mcp-unified-architecture/` | `01-03-mcp-unified-architecture/` | 核心平台 | P0 |
| `multimodal-ai/` | `01-04-multimodal-ai/` | 核心平台 | P0 |
| `smart-hive-platform/` | `02-01-smart-hive-platform/` | 业务应用 | P1 |
| `econowatch-system/` | `02-02-econowatch-system/` | 业务应用 | P1 |
| `shanghai-port-logistics/` | `02-03-shanghai-port-logistics/` | 业务应用 | P1 |
| `marketplace-platform/` | `02-04-marketplace-platform/` | 业务应用 | P1 |
| `mobile-frontend-system/` | `03-01-mobile-system/` | 前端系统 | P2 |
| `frontend-system/` + `frontend-architecture-refactor/` | `03-02-web-system/` | 前端系统 | P2 |
| `telegram-bot/` | `04-01-telegram-bot/` | 平台组件 | P2 |
| `moqui-platform/` | `04-02-moqui-platform/` | 平台组件 | P2 |
| `document-management-system/` | `05-01-document-management/` | 系统管理 | P3 |
| `user-system-refactor/` | `05-02-user-management/` | 系统管理 | P3 |
| `system-integration/` | `05-03-system-integration/` | 系统管理 | P3 |
| `novel-processing-pipeline/` | `06-01-novel-processing-pipeline/` | 开发工具 | P3 |
| `remove-mock-data/` | `06-02-data-migration/` | 开发工具 | P3 |

## 编号分配详情

### 01 - 核心平台
```
01-01  ai-integration              AI服务集成
01-02  jwt-authentication          JWT认证系统
01-03  mcp-unified-architecture    MCP统一架构
01-04  multimodal-ai               多模态AI处理
01-05  [预留]                      
01-06  [预留]
...
```

### 02 - 业务应用
```
02-01  smart-hive-platform         智慧蜂巢供需平台
02-02  econowatch-system           经济资讯聚合系统
02-03  shanghai-port-logistics     上海港物流系统
02-04  marketplace-platform        市场交易平台
02-05  [预留]
...
```

### 03 - 前端系统
```
03-01  mobile-system               移动端系统
03-02  web-system                  Web端系统
03-03  [预留] desktop-system       桌面端系统
03-04  [预留] component-library    组件库
03-05  [预留]
```

### 04 - 平台组件
```
04-01  telegram-bot                Telegram机器人
04-02  moqui-platform              Moqui平台集成
04-03  [预留] notification-service 通知服务
04-04  [预留] file-storage         文件存储
04-05  [预留] search-engine        搜索引擎
```

### 05 - 系统管理
```
05-01  document-management         文档管理系统
05-02  user-management             用户管理系统
05-03  system-integration          系统集成
05-04  [预留] monitoring           监控系统
05-05  [预留] logging              日志系统
```

### 06 - 开发工具
```
06-01  novel-processing-pipeline   小说处理流水线
06-02  data-migration              数据迁移工具
06-03  [预留] code-generator       代码生成器
06-04  [预留] testing-framework    测试框架
06-05  [预留] build-tools          构建工具
```

## 命名规范

### 完整命名格式
```
[分类码]-[序号]-[功能名称]

规则:
- 分类码: 两位数字 (01-08)
- 序号: 两位数字 (01-99)
- 功能名称: kebab-case格式，2-4个单词
- 分隔符: 使用连字符 (-)
```

### 命名示例
```
✅ 良好示例:
01-01-ai-integration
02-01-smart-hive-platform
03-01-mobile-system
05-01-document-management
04-01-telegram-bot
06-01-data-migration

❌ 不良示例:
1-1-ai-integration              # 编号不足两位
01-01-AI-Integration            # 功能名使用了大写
01-01-ai_integration            # 使用了下划线
01-01-artificial-intelligence-integration-system  # 名称过长
Core-01-ai-integration          # 使用了文字分类码
```

## 元数据管理

### 编号元数据
在每个spec的README.md或requirements.md中添加编号元数据：

```yaml
---
spec_number: "01-01"
spec_name: "ai-integration"
full_name: "AI服务集成"
category: "01"
category_name: "核心平台 / Core Platform"
priority: "P0"
status: "已完成"
created_date: "2024-01-01"
last_updated: "2025-01-14"
---
```

### 索引维护
在README.md中维护完整的编号索引：

```markdown
## Specs编号索引

### 01 - 核心平台 (Core Platform)
- **01-01** - [AI服务集成](01-01-ai-integration/) - ✅ 已完成
- **01-02** - [JWT认证系统](01-02-jwt-authentication/) - ✅ 已完成
- **01-03** - [MCP统一架构](01-03-mcp-unified-architecture/) - ✅ 已完成
- **01-04** - [多模态AI处理](01-04-multimodal-ai/) - ✅ 已完成

### 02 - 业务应用 (Business Applications)
- **02-01** - [智慧蜂巢平台](02-01-smart-hive-platform/) - 📝 设计完成
- **02-02** - [经济资讯系统](02-02-econowatch-system/) - 📝 设计完成
...
```

## 迁移实施

### 迁移步骤

#### 步骤1: 准备阶段
```bash
# 1. 备份当前目录
cp -r .kiro/specs .kiro/specs-backup-$(date +%Y%m%d)

# 2. 创建编号映射文件
cat > .kiro/specs/MIGRATION_MAP.txt << EOF
ai-integration -> 01-01-ai-integration
jwt-authentication -> 01-02-jwt-authentication
...
EOF
```

#### 步骤2: 批量重命名
```bash
# 使用脚本批量重命名
cd .kiro/specs

# 核心平台 (core)
mv ai-integration core-01-ai-integration
mv jwt-authentication core-02-jwt-authentication
mv mcp-unified-architecture core-03-mcp-unified-architecture
mv multimodal-ai core-04-multimodal-ai

# 业务应用 (biz)
mv smart-hive-platform biz-01-smart-hive-platform
mv econowatch-system biz-02-econowatch-system
mv shanghai-port-logistics biz-03-shanghai-port-logistics
mv marketplace-platform biz-04-marketplace-platform

# 前端系统 (fe)
mv mobile-frontend-system fe-01-mobile-system
# 合并frontend-system和frontend-architecture-refactor
mkdir -p fe-02-web-system
# ... 合并内容

# 平台组件 (platform)
mv telegram-bot platform-01-telegram-bot
mv moqui-platform platform-02-moqui-platform

# 系统管理 (sys)
mv document-management-system sys-01-document-management
mv user-system-refactor sys-02-user-management
mv system-integration sys-03-system-integration

# 开发工具 (dev)
mv novel-processing-pipeline dev-01-novel-processing-pipeline
mv remove-mock-data dev-02-data-migration
```

#### 步骤3: 更新文档引用
```bash
# 使用脚本批量更新文档中的路径引用
find .kiro/specs -name "*.md" -type f -exec sed -i '' \
  -e 's|ai-integration/|core-01-ai-integration/|g' \
  -e 's|jwt-authentication/|core-02-jwt-authentication/|g' \
  -e 's|smart-hive-platform/|biz-01-smart-hive-platform/|g' \
  {} +

# 更新steering文档中的引用
find .kiro/steering -name "*.md" -type f -exec sed -i '' \
  -e 's|specs/ai-integration/|specs/core-01-ai-integration/|g' \
  -e 's|specs/smart-hive-platform/|specs/biz-01-smart-hive-platform/|g' \
  {} +
```

#### 步骤4: 验证和清理
```bash
# 验证所有specs目录存在
for prefix in core biz fe platform sys dev; do
  echo "Checking $prefix specs..."
  ls -d .kiro/specs/$prefix-* 2>/dev/null || echo "No $prefix specs found"
done

# 检查文档完整性
find .kiro/specs -maxdepth 1 -type d -name "*-[0-9][0-9]-*" | while read dir; do
  if [ ! -f "$dir/requirements.md" ] || [ ! -f "$dir/design.md" ] || [ ! -f "$dir/tasks.md" ]; then
    echo "Incomplete: $dir"
  fi
done
```

## 维护规范

### 新增功能
1. **确定分类**: 选择合适的分类码 (01-06)
2. **分配编号**: 在该分类下选择下一个可用序号
3. **创建目录**: 使用标准格式创建目录
4. **更新索引**: 在README.md中添加条目

### 编号调整
**原则**: 尽量避免调整已有编号

**允许调整的情况**:
- 功能分类错误，需要更换分类码
- 优先级大幅调整，需要重新排序
- 功能合并或拆分

**调整流程**:
1. 记录原编号和新编号
2. 更新目录名称
3. 更新所有文档引用
4. 更新索引文档
5. 通知团队成员

### 归档和废弃
```bash
# 归档功能 (移动到archived分类)
mv biz-05-old-feature archived-01-old-feature

# 废弃功能 (移动到deprecated分类)
mv fe-05-deprecated-feature deprecated-01-deprecated-feature
```

## 优势分析

### vs 分层目录结构

| 特性 | 编号系统 | 分层目录 |
|------|---------|---------|
| 结构复杂度 | ⭐⭐⭐⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 查找效率 | ⭐⭐⭐⭐⭐ 快速 | ⭐⭐⭐⭐ 较快 |
| 维护成本 | ⭐⭐⭐⭐⭐ 低 | ⭐⭐⭐ 中等 |
| 可扩展性 | ⭐⭐⭐⭐ 好 | ⭐⭐⭐⭐⭐ 很好 |
| 排序清晰度 | ⭐⭐⭐⭐⭐ 自动排序 | ⭐⭐⭐ 需手动组织 |
| 路径长度 | ⭐⭐⭐⭐⭐ 短 | ⭐⭐⭐ 较长 |

### 适用场景
- ✅ 中小型项目 (< 100个specs)
- ✅ 快速迭代的项目
- ✅ 团队规模较小
- ✅ 注重简洁性和效率
- ⚠️ 超大型项目可能需要分层结构

## 工具支持

### 自动化脚本
```bash
# 创建新spec
./scripts/create-numbered-spec.sh [category] [name]
# 示例: ./scripts/create-numbered-spec.sh 02 new-business-app

# 查找下一个可用编号
./scripts/next-spec-number.sh [category]
# 示例: ./scripts/next-spec-number.sh 01

# 验证编号完整性
./scripts/validate-spec-numbers.sh

# 生成编号索引
./scripts/generate-numbered-index.sh
```

### 编号查询
```bash
# 按分类查看
ls -d .kiro/specs/01-*     # 核心平台
ls -d .kiro/specs/02-*     # 业务应用
ls -d .kiro/specs/03-*     # 前端系统
ls -d .kiro/specs/04-*     # 平台组件
ls -d .kiro/specs/05-*     # 系统管理
ls -d .kiro/specs/06-*     # 开发工具

# 按编号查找
ls -d .kiro/specs/01-01-*  # 查找特定编号

# 查看所有编号（按数字排序，自动分类）
ls -d .kiro/specs/[0-9][0-9]-[0-9][0-9]-* | sort
```

---

**文档版本**: v3.0  
**最后更新**: 2025年1月14日  
**编号系统**: 纯数字编号  
**主要更新**: 从中文前缀迁移到纯数字编号，解决跨平台兼容性问题  
**适用范围**: .kiro/specs/目录管理  
**审批状态**: 待审批
