# 测试脚本管理原则

## 核心原则

### 功能归属原则
**所有测试脚本必须归属到对应的功能specs下，不允许独立存在的测试脚本目录。**

**适用范围**: 所有测试脚本、验证工具、调试脚本

**实施标准**:
- 每个功能的测试脚本放在 `.kiro/specs/[feature-name]/testing/` 目录下
- 测试脚本按类型进一步分类组织
- 删除根目录下的独立testing-tools目录
- 建立测试脚本的索引和导航机制

## 测试脚本分类

### 按功能域分类

#### 1. AI集成测试
**目录**: `.kiro/specs/01-01-ai-integration/testing/`
**包含脚本**:
- AI提供商设置脚本 (baidu_setup.sh, openai_setup.sh等)
- AI服务测试脚本
- 多模态AI测试工具

#### 2. 认证系统测试
**目录**: `.kiro/specs/01-02-jwt-authentication/testing/`
**包含脚本**:
- JWT认证测试脚本
- Chrome认证验证工具
- 认证流程测试

#### 3. Telegram Bot测试
**目录**: `.kiro/specs/04-01-telegram-bot/testing/`
**包含脚本**:
- Telegram Bot功能测试
- Webhook配置测试
- 菜单系统测试

#### 4. 前端系统测试
**目录**: `.kiro/specs/03-02-web-system/testing/`
**包含脚本**:
- 前端验证脚本
- Vue组件测试
- UI集成测试

#### 5. 多模态功能测试
**目录**: `.kiro/specs/01-04-multimodal-ai/testing/`
**包含脚本**:
- 语音识别测试
- 图像识别测试
- 多模态集成测试

#### 6. 市场平台测试
**目录**: `.kiro/specs/02-04-marketplace-platform/testing/`
**包含脚本**:
- 市场功能测试
- 订单系统测试
- API接口测试

### 按测试类型分类

#### 单元测试 (unit/)
- 组件级别的测试脚本
- 函数和方法的验证工具
- 模块独立性测试

#### 集成测试 (integration/)
- 系统间集成测试
- API接口测试
- 数据流验证

#### 端到端测试 (e2e/)
- 完整业务流程测试
- 用户场景验证
- 系统整体功能测试

#### 性能测试 (performance/)
- 负载测试脚本
- 性能基准测试
- 资源使用监控

#### 验证工具 (validation/)
- 配置验证脚本
- 环境检查工具
- 数据完整性验证

## 目录结构标准

### 标准目录结构
```
.kiro/specs/[feature-name]/testing/
├── README.md              # 测试说明和索引
├── unit/                  # 单元测试
│   ├── component-tests/
│   └── function-tests/
├── integration/           # 集成测试
│   ├── api-tests/
│   └── service-tests/
├── e2e/                   # 端到端测试
│   ├── user-scenarios/
│   └── workflow-tests/
├── performance/           # 性能测试
│   ├── load-tests/
│   └── benchmark/
├── validation/            # 验证工具
│   ├── config-check/
│   └── data-validation/
└── tools/                 # 测试工具和辅助脚本
    ├── setup/
    └── utilities/
```

### 脚本命名规范
- 使用描述性名称: `test-jwt-authentication.sh`
- 包含功能前缀: `setup-ai-provider.sh`
- 使用kebab-case格式: `validate-telegram-webhook.sh`
- 包含测试类型: `integration-test-marketplace.sh`

## 迁移映射表

### 当前testing-tools脚本迁移

| 原脚本 | 目标位置 | 分类 |
|--------|----------|------|
| `ai_providers_guide.sh` | `01-01-ai-integration/testing/tools/setup/` | 设置工具 |
| `baidu_setup.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `claude_*.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `openai_setup.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `qwen_setup.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `xunfei_setup.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `zhipu_setup.sh` | `01-01-ai-integration/testing/tools/setup/` | AI提供商设置 |
| `chrome_jwt_*.sh` | `01-02-jwt-authentication/testing/validation/` | 认证验证 |
| `jwt_*.sh` | `01-02-jwt-authentication/testing/integration/` | 认证测试 |
| `pure_jwt_test.html` | `01-02-jwt-authentication/testing/unit/` | 单元测试 |
| `telegram_*.sh` | `04-01-telegram-bot/testing/integration/` | Bot测试 |
| `reorganize_telegram_menu.sh` | `04-01-telegram-bot/testing/tools/` | 工具脚本 |
| `frontend_*.sh` | `03-02-web-system/testing/validation/` | 前端验证 |
| `debug_vue_mounting.*` | `03-02-web-system/testing/tools/` | 调试工具 |
| `image_recognition_setup.sh` | `01-04-multimodal-ai/testing/tools/setup/` | 多模态设置 |
| `speech_to_text_setup.sh` | `01-04-multimodal-ai/testing/tools/setup/` | 多模态设置 |
| `test_*_recognition.sh` | `01-04-multimodal-ai/testing/integration/` | 多模态测试 |
| `test_multimodal_*.sh` | `01-04-multimodal-ai/testing/e2e/` | 端到端测试 |
| `telegram_marketplace_test.sh` | `02-04-marketplace-platform/testing/integration/` | 市场测试 |
| `test_marketplace_*.sh` | `02-04-marketplace-platform/testing/integration/` | 市场测试 |
| `ecommerce_order_rest_examples.sh` | `02-04-marketplace-platform/testing/integration/api-tests/` | API测试 |

## 测试脚本文档标准

### README.md模板
每个testing目录必须包含README.md文件：

```markdown
# [功能名称] 测试脚本

## 概述
本目录包含[功能名称]的所有测试脚本和验证工具。

## 目录结构
- `unit/` - 单元测试脚本
- `integration/` - 集成测试脚本
- `e2e/` - 端到端测试脚本
- `performance/` - 性能测试脚本
- `validation/` - 验证工具
- `tools/` - 测试辅助工具

## 快速开始
1. 环境准备: `./tools/setup/prepare-environment.sh`
2. 运行单元测试: `./unit/run-all-tests.sh`
3. 运行集成测试: `./integration/run-integration-tests.sh`

## 测试脚本索引
### 单元测试
- `unit/test-component-a.sh` - 组件A的单元测试
- `unit/test-function-b.sh` - 函数B的单元测试

### 集成测试
- `integration/test-api-integration.sh` - API集成测试
- `integration/test-service-integration.sh` - 服务集成测试

### 验证工具
- `validation/validate-config.sh` - 配置验证
- `validation/check-environment.sh` - 环境检查

## 使用说明
[详细的使用说明和注意事项]

## 维护信息
- 负责人: [维护人员]
- 最后更新: [更新日期]
- 相关文档: [链接到相关specs文档]
```

### 脚本头部标准
每个测试脚本必须包含标准头部：

```bash
#!/bin/bash
# 脚本名称: test-example.sh
# 功能描述: 示例功能的测试脚本
# 所属功能: example-feature
# 测试类型: integration
# 创建日期: 2025-01-13
# 维护人员: [维护人员]
# 依赖: [依赖的其他脚本或工具]

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时报错

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# 导入公共函数
source "$SCRIPT_DIR/../tools/common-functions.sh"

# 主要功能实现
main() {
    echo "开始执行测试: $(basename "$0")"
    # 测试逻辑
    echo "测试完成"
}

# 执行主函数
main "$@"
```

## 清理和迁移流程

### 第一阶段: 分析和分类
1. 分析testing-tools目录下所有脚本
2. 按功能域进行分类
3. 识别重复和过时的脚本
4. 制定迁移计划

### 第二阶段: 创建目标结构
1. 在相应specs下创建testing目录结构
2. 创建README.md和索引文档
3. 设置公共工具和函数库

### 第三阶段: 脚本迁移
1. 按分类迁移脚本到目标位置
2. 更新脚本头部信息和路径引用
3. 测试脚本在新位置的功能性
4. 更新相关文档和引用

### 第四阶段: 清理和验证
1. 删除原testing-tools目录
2. 更新所有相关文档的链接
3. 验证迁移后的脚本功能
4. 建立新的测试脚本索引

## 维护原则

### 持续维护
1. **定期审查**: 每季度审查测试脚本的有效性
2. **及时更新**: 功能变更时同步更新测试脚本
3. **文档同步**: 保持测试文档与实际脚本的一致性
4. **版本管理**: 使用Git跟踪测试脚本的变更

### 质量保证
1. **脚本标准**: 所有脚本必须符合编码标准
2. **错误处理**: 包含适当的错误处理和日志记录
3. **可维护性**: 代码清晰，注释完整
4. **可重用性**: 提取公共功能到共享库

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**适用范围**: 所有测试脚本和验证工具  
**审批状态**: 待审批