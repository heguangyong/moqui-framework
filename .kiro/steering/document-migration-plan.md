# 文档迁移计划

## 概述

基于当前docs目录的文档分析，制定系统化的文档迁移和整理计划，将分散的文档整理成以specs为中心的管理体系。

## 当前文档分析

### docs目录现状
```
docs/
├── 00-文档索引.md                    # 保留，作为过渡期索引
├── 01-开发指南-Moqui新应用开发最佳实践.md  # → steering
├── 02-架构设计-MCP统一架构与AI平台整合.md  # → specs (拆分)
├── 03-前端方案-移动端完整实施方案.md      # → specs (拆分)
├── 04-应用案例-智慧蜂巢供需撮合平台.md     # → specs
├── 05-应用案例-EconoWatch经济资讯聚合系统.md # → specs
├── 06-故障排查-Telegram机器人问题诊断与修复.md # → steering (合并)
├── 07-应用案例-上海港集装箱运输供需系统.md   # → specs
├── 08-桌面端UI架构参考文档.md           # → steering
├── A4海报.md                        # → 归档
├── CLAUDE.md                        # → steering (已存在)
└── tmp/                             # → 清理
```

### testing-tools目录现状
```
testing-tools/
├── README.md                        # → 保留，更新为索引
├── ai_providers_guide.sh            # → specs/ai-integration/testing/
├── chrome_jwt_*.sh                  # → specs/jwt-authentication/testing/
├── telegram_*.sh                    # → specs/telegram-bot/testing/
├── frontend_*.sh                    # → specs/frontend-system/testing/
├── jwt_*.sh                         # → specs/jwt-authentication/testing/
├── moqui_*.html                     # → specs/moqui-platform/testing/
├── *_setup.sh                       # → 对应功能specs/testing/
└── [其他测试脚本]                    # → 按功能归类到specs
```

## 迁移计划

### 阶段1: Steering文档整理

#### 1.1 开发指南迁移
**源文件**: `01-开发指南-Moqui新应用开发最佳实践.md`  
**目标**: 整合到现有steering文档中  
**操作**:
- 提取开发流程 → `development-principles.md`
- 提取技术标准 → `moqui-standards.md`
- 提取最佳实践 → `moqui-framework-guide.md`

#### 1.2 故障排查指南整合
**源文件**: `06-故障排查-Telegram机器人问题诊断与修复.md`  
**目标**: 创建统一的故障排查指南  
**操作**:
- 创建 `troubleshooting-guide.md`
- 整合Telegram Bot问题诊断
- 建立通用故障排查流程

#### 1.3 桌面端架构文档
**源文件**: `08-桌面端UI架构参考文档.md`  
**目标**: 整合到前端架构指南  
**操作**:
- 整合到 `quasar-framework-guide.md`
- 补充桌面端开发指导

### 阶段2: Specs文档创建

#### 2.1 MCP统一架构系统
**源文件**: `02-架构设计-MCP统一架构与AI平台整合.md`  
**目标**: `.kiro/specs/mcp-unified-architecture/`  
**拆分方案**:
```
mcp-unified-architecture/
├── requirements.md    # 从架构需求提取
├── design.md         # 核心架构设计
└── tasks.md          # 实施任务计划
```

#### 2.2 移动端前端系统
**源文件**: `03-前端方案-移动端完整实施方案.md`  
**目标**: `.kiro/specs/mobile-frontend-system/`  
**拆分方案**:
```
mobile-frontend-system/
├── requirements.md    # 移动端需求
├── design.md         # 技术架构设计
└── tasks.md          # 12周实施计划
```

#### 2.3 智慧蜂巢供需平台
**源文件**: `04-应用案例-智慧蜂巢供需撮合平台.md`  
**目标**: `.kiro/specs/smart-hive-platform/`  
**转换方案**:
```
smart-hive-platform/
├── requirements.md    # 业务需求和功能规格
├── design.md         # 技术架构和算法设计
└── tasks.md          # 开发实施任务
```

#### 2.4 EconoWatch资讯系统
**源文件**: `05-应用案例-EconoWatch经济资讯聚合系统.md`  
**目标**: `.kiro/specs/econowatch-system/`  
**转换方案**:
```
econowatch-system/
├── requirements.md    # 资讯聚合需求
├── design.md         # Bot架构和多模态处理
└── tasks.md          # 系统实施任务
```

#### 2.5 上海港物流系统
**源文件**: `07-应用案例-上海港集装箱运输供需系统.md`  
**目标**: `.kiro/specs/shanghai-port-logistics/`  
**转换方案**:
```
shanghai-port-logistics/
├── requirements.md    # 物流业务需求
├── design.md         # 移动端设计和地图集成
└── tasks.md          # 功能开发任务
```

### 阶段3: 文档清理和归档

#### 3.1 testing-tools目录重组
**目标**: `testing-tools/`  
**操作**:
- 分析每个测试脚本的功能归属
- 按功能将脚本迁移到对应specs的testing子目录
- 更新README.md为测试脚本索引
- 删除过时和重复的测试脚本

**脚本分类迁移**:
```
AI相关测试 → .kiro/specs/ai-integration/testing/
├── ai_providers_guide.sh
├── baidu_setup.sh
├── claude_*.sh
├── openai_setup.sh
├── qwen_setup.sh
├── xunfei_setup.sh
└── zhipu_setup.sh

JWT认证测试 → .kiro/specs/jwt-authentication/testing/
├── chrome_jwt_*.sh
├── jwt_*.sh
└── pure_jwt_test.html

Telegram Bot测试 → .kiro/specs/telegram-bot/testing/
├── telegram_*.sh
├── reorganize_telegram_menu.sh
└── test_multimodal_telegram.sh

前端测试 → .kiro/specs/frontend-system/testing/
├── frontend_*.sh
├── debug_vue_mounting.*
└── vue3-comprehensive-test.sh

多模态测试 → .kiro/specs/multimodal-ai/testing/
├── image_recognition_setup.sh
├── speech_to_text_setup.sh
├── test_*_recognition.sh
└── test_multimodal_*.sh

市场平台测试 → .kiro/specs/marketplace-platform/testing/
├── telegram_marketplace_test.sh
├── test_marketplace_*.sh
└── ecommerce_order_rest_examples.sh
```

#### 3.2 临时文件清理
**目标**: `docs/tmp/`  
**操作**:
- 评估临时文件价值
- 保留有价值的内容到相应specs
- 删除过时和重复文件

#### 3.3 营销材料归档
**目标**: `docs/A4海报.md`  
**操作**:
- 移动到 `docs/archive/marketing/`
- 保留作为历史记录

#### 3.4 索引文档更新
**目标**: `docs/00-文档索引.md` 和 `testing-tools/README.md`  
**操作**:
- 更新为迁移后的文档结构索引
- 提供新旧文档位置对照表
- 添加迁移完成后的清理计划

## 实施时间表

### 第1周: Steering文档整理
- [ ] 整合开发指南到steering文档
- [ ] 创建故障排查指南
- [ ] 整合桌面端架构文档

### 第2周: 核心Specs创建
- [ ] 创建MCP统一架构specs
- [ ] 创建移动端前端系统specs

### 第3周: 应用案例Specs创建和测试脚本重组
- [ ] 创建智慧蜂巢平台specs
- [ ] 创建EconoWatch系统specs
- [ ] 创建上海港物流系统specs
- [ ] 重组testing-tools目录，按功能归类测试脚本

### 第4周: 清理和验证
- [ ] 清理临时文件和过时内容
- [ ] 验证文档链接和引用
- [ ] 更新索引和导航文档
- [ ] 完成testing-tools目录清理

## 质量保证

### 迁移检查清单
- [ ] 内容完整性：确保重要信息不丢失
- [ ] 结构一致性：遵循specs和steering的标准结构
- [ ] 链接有效性：更新所有内部链接和引用
- [ ] 元数据完整：添加必要的文档元数据
- [ ] 格式规范：统一Markdown格式和样式

### 验证标准
1. **内容验证**: 对比原文档，确保关键信息完整迁移
2. **结构验证**: 检查新文档是否符合标准模板
3. **链接验证**: 测试所有链接的有效性
4. **搜索验证**: 确保重要内容可以通过关键词找到

## 风险管控

### 潜在风险
1. **内容丢失**: 迁移过程中重要信息遗漏
2. **链接断裂**: 文档移动后内部链接失效
3. **格式问题**: 不同文档格式转换问题
4. **版本混乱**: 新旧文档版本管理问题

### 缓解措施
1. **备份策略**: 迁移前完整备份原文档
2. **分步验证**: 每个阶段完成后进行验证
3. **链接管理**: 建立链接重定向机制
4. **版本控制**: 使用Git跟踪所有变更

## 成功标准

### 完成标准
1. 所有有价值文档成功迁移到目标位置
2. 新文档结构符合specs和steering标准
3. 文档间链接和引用关系正确
4. 原docs目录只保留必要的索引和归档文件

### 质量标准
1. 文档内容完整性 > 95%
2. 链接有效性 = 100%
3. 格式一致性 = 100%
4. 用户满意度 > 90%

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**负责人**: 文档管理团队  
**审批状态**: 待审批