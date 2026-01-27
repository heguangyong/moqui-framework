# 前端场景化集成测试 - 设计文档

## Overview

本设计文档定义了前端系统场景化集成测试的完整架构和实施方案。测试系统将覆盖两个主要前端应用：

1. **moqui-ai-mobile** - Vue3 + Quasar移动端应用
2. **NovelAnimeDesktop** - Electron桌面应用

### 设计目标

- **场景驱动**: 基于真实用户使用场景设计测试用例
- **端到端验收**: 真实的前后端功能闭环验证，不使用Mock
- **人机配合**: 结合自动化测试和人工验收
- **可维护性**: 测试代码结构清晰，易于维护和扩展
- **资源集中**: 所有测试脚本、数据和报告都在spec目录下管理

### 技术选型

**测试框架**:
- **Playwright**: E2E测试框架（用于浏览器自动化和真实用户场景模拟）
- **Vitest**: 测试运行器（用于组织和执行测试脚本）

**测试工具**:
- **@faker-js/faker**: 测试数据生成（生成真实的测试数据）
- **@testing-library/user-event**: 用户交互模拟
- **Playwright Test Reporter**: 测试报告生成

**重要说明**:
- ❌ **不使用Mock服务**: 所有API调用都是真实的后端调用
- ❌ **不使用Stub**: 所有外部服务都是真实的服务调用
- ✅ **真实环境**: 测试在真实的开发/测试环境中执行
- ✅ **真实数据**: 使用真实的数据库和数据

## Architecture

### 测试架构层次

```
┌─────────────────────────────────────────────────────────┐
│                 场景化验收测试层                          │
│  (Playwright - 真实用户旅程 + 真实后端)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  人工验收检查点                           │
│  (关键步骤的人工确认和验证)                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  测试基础设施                            │
│  (Test Data Generators, Utilities, Reports)             │
└─────────────────────────────────────────────────────────┘
```

### 测试执行模式

**人机配合模式**:
1. **自动化执行**: Playwright自动执行用户操作和基本断言
2. **人工检查点**: 在关键步骤暂停，等待人工确认
3. **结果记录**: 自动记录测试过程和结果
4. **报告生成**: 生成详细的测试报告供人工审查

### 测试目录结构

```
.kiro/specs/07-01-frontend-scenario-integration-testing/
├── requirements.md                 # 需求文档
├── design.md                       # 设计文档
├── tasks.md                        # 任务列表
├── testing/                        # 测试资源目录
│   ├── scenarios/                  # 场景测试脚本
│   │   ├── moqui-ai-mobile/       # 移动端场景测试
│   │   │   ├── auth-flow.spec.ts
│   │   │   ├── marketplace-flow.spec.ts
│   │   │   └── ai-integration.spec.ts
│   │   └── NovelAnimeDesktop/     # 桌面端场景测试
│   │       ├── project-management.spec.ts
│   │       ├── workflow-execution.spec.ts
│   │       └── cross-module-flow.spec.ts
│   ├── fixtures/                   # 测试数据生成器
│   │   ├── user.fixture.ts
│   │   ├── order.fixture.ts
│   │   └── project.fixture.ts
│   ├── utils/                      # 测试工具函数
│   │   ├── test-helpers.ts
│   │   └── assertions.ts
│   ├── config/                     # 测试配置
│   │   ├── playwright.config.ts
│   │   └── test-env.ts
│   └── reports/                    # 测试报告（自动生成）
│       ├── html/                   # HTML报告
│       ├── screenshots/            # 截图
│       └── videos/                 # 录屏
```

### 测试执行流程

```
测试工程师启动测试
    ↓
Playwright执行场景脚本
    ↓
真实浏览器 → 真实前端应用 → 真实后端API → 真实数据库
    ↓
关键步骤暂停，等待人工确认
    ↓
继续执行或记录问题
    ↓
生成测试报告（保存在testing/reports/）
    ↓
测试工程师审查报告
```

## Components and Interfaces

### 核心测试组件

**1. 测试夹具系统**
```typescript
export interface TestFixtures {
  createTestUser: () => { username: string, password: string, email: string }
  createTestProject: () => { name: string, description: string }
  loadTestNovel: () => string
}
```

**2. 测试工具函数**
```typescript
export interface TestHelpers {
  waitForElement: (selector: string) => Promise<void>
  fillForm: (formData: Record<string, string>) => Promise<void>
  takeScreenshot: (name: string) => Promise<void>
  manualCheckpoint: (message: string) => Promise<boolean>
}
```

**3. 场景测试套件**
```typescript
export interface ScenarioTests {
  testAuthFlow: () => Promise<void>
  testMarketplaceFlow: () => Promise<void>
  testWorkflowExecution: () => Promise<void>
}
```

## Data Models

### 核心测试数据模型

```typescript
// 测试环境配置
interface TestConfig {
  apiBaseUrl: string
  timeout: number
  retries: number
}

// 测试用户数据
interface TestUser {
  username: string
  password: string
  email: string
  token?: string
}

// 测试项目数据
interface TestProject {
  name: string
  description: string
  characters: TestCharacter[]
  createdAt: Date
}

// 测试结果
interface TestResult {
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: Error
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 首页路由和数据加载一致性
*For any* 应用启动状态，访问首页应该正确路由到订单大厅页面并成功加载订单列表数据
**Validates: Requirements 1.1**

### Property 2: 未认证访问保护
*For any* 需要认证的路由或API端点，未认证用户的访问应该被重定向到登录页面并保存原始目标路径
**Validates: Requirements 1.2, 3.5**

### Property 3: 登录流程完整性
*For any* 有效的用户凭证和目标路由，成功登录后应该跳转到目标路由（或默认首页）并正确设置认证状态
**Validates: Requirements 1.3, 3.2**

### Property 4: 订单详情渲染完整性
*For any* 订单数据，订单详情页面应该显示所有必需字段（标题、描述、联系方式、相关推荐）
**Validates: Requirements 1.4**

### Property 5: 搜索结果准确性
*For any* 订单列表和搜索关键词，搜索结果应该只包含标题或描述中包含关键词的订单
**Validates: Requirements 1.5**

### Property 6: 订单创建和AI集成流程
*For any* 完整的订单数据，提交订单应该触发AI标签提取、成功创建订单、并自动触发智能匹配
**Validates: Requirements 2.2, 2.3, 4.1**

### Property 7: 匹配结果显示完整性
*For any* 匹配结果数据，系统应该显示匹配度评分（0-100范围内）和匹配原因说明
**Validates: Requirements 2.4, 4.4**

### Property 8: 联系信息显示
*For any* 包含联系方式的订单，点击联系按钮应该显示所有可用的联系方式（电话、微信等）
**Validates: Requirements 2.5**

### Property 9: 登录错误处理
*For any* 无效的用户凭证，登录尝试应该显示错误提示并保持在登录页面
**Validates: Requirements 3.1**

### Property 10: 登出流程完整性
*For any* 已认证的用户状态，执行登出操作应该清除token、清除认证状态、并重定向到登录页面
**Validates: Requirements 3.4**

### Property 11: AI服务降级处理
*For any* AI服务调用失败的情况，系统应该使用降级方案或显示友好的错误提示
**Validates: Requirements 4.2, 9.4**

### Property 12: 智能匹配集成
*For any* 订单详情页面访问，系统应该调用智能匹配API并显示推荐的相关订单
**Validates: Requirements 4.3**

### Property 13: 项目创建和持久化
*For any* 项目名称，创建项目应该成功保存到本地数据库并在项目列表中可见
**Validates: Requirements 5.2**

### Property 14: 编辑器实时更新
*For any* 文本输入，小说编辑器应该实时更新字数统计并触发自动保存机制
**Validates: Requirements 5.3**

### Property 15: 角色数据持久化
*For any* 角色信息，创建角色应该成功保存并在角色列表中显示
**Validates: Requirements 5.4**

### Property 16: 工作流连接验证
*For any* 节点连接操作，系统应该验证连接的有效性（类型匹配、无循环依赖）并保存有效的配置
**Validates: Requirements 5.5**

### Property 17: 工作流执行前验证
*For any* 工作流配置，执行前应该验证配置的完整性（所有必需节点已配置、连接有效）
**Validates: Requirements 6.1**

### Property 18: 工作流执行状态同步
*For any* 工作流执行过程，系统应该实时更新每个节点的执行状态和进度
**Validates: Requirements 6.2**

### Property 19: AI节点参数传递
*For any* 工作流中的AI节点，执行时应该正确传递参数到AI服务并处理返回结果
**Validates: Requirements 6.3**

### Property 20: 工作流错误处理
*For any* 工作流执行失败，系统应该显示详细的错误信息并提供重试或修改配置的选项
**Validates: Requirements 6.4**

### Property 21: 工作流结果保存
*For any* 成功完成的工作流，系统应该保存执行结果并允许用户预览和导出
**Validates: Requirements 6.5**

### Property 22: 跨模块数据可见性
*For any* 在一个模块中创建的数据（项目、角色、内容），该数据应该在所有相关模块中可见和可访问
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 23: 工作流内容生成和保存
*For any* 工作流生成的内容，内容应该正确保存到素材库并可在预览中查看
**Validates: Requirements 7.4**

### Property 24: 项目导出完整性
*For any* 项目数据，导出应该包含所有相关的项目数据、角色信息和生成的素材
**Validates: Requirements 7.5**

### Property 25: 响应式布局适配
*For any* 屏幕尺寸，应用应该正确适配布局并保持所有功能可用
**Validates: Requirements 8.2**

### Property 26: API错误处理
*For any* API调用返回的错误（500、404等），系统应该显示友好的错误提示并提供重试选项
**Validates: Requirements 9.1**

### Property 27: 输入验证
*For any* 用户输入的数据，系统应该在提交前进行验证，对于无效数据显示具体的错误信息
**Validates: Requirements 9.5**

## Error Handling

### 核心错误处理策略

**测试中的错误处理**:
- **网络错误**: 显示离线提示、自动重试
- **API错误**: 显示友好提示、提供重试选项
- **AI服务错误**: 降级方案、提示用户稍后重试
- **验证错误**: 显示具体错误信息、阻止提交

**错误恢复**:
```typescript
// 简化的错误处理
interface ErrorHandler {
  handleAPIError(error: APIError): void
  handleAIServiceError(error: AIServiceError): void
  handleValidationError(error: ValidationError): void
}
```

## Testing Strategy

### 测试层次和覆盖范围

**场景化验收测试 (Scenario Acceptance Tests)**
- **覆盖范围**: 完整用户旅程，真实前后端交互
- **测试工具**: Playwright
- **执行模式**: 人机配合
- **覆盖目标**: 核心用户场景100%覆盖
- **示例**:
  - 新用户注册到发布第一个订单（真实API调用）
  - 项目创建到工作流执行到导出（真实数据库操作）
  - 搜索订单到查看详情到联系对方（真实AI服务调用）

### 人机配合测试模式

**自动化部分**:
- Playwright自动执行用户操作（点击、输入、导航）
- 自动验证基本断言（元素存在、文本内容、路由跳转）
- 自动记录测试过程（截图、视频、日志）

**人工检查点**:
- 关键业务逻辑的验证（如AI生成的内容质量）
- 复杂UI状态的确认（如工作流执行状态）
- 数据一致性的检查（如跨模块数据同步）
- 用户体验的评估（如响应速度、交互流畅度）

**检查点实现**:
```typescript
// 在测试脚本中设置人工检查点
await test.step('人工检查：验证AI生成的标签是否合理', async () => {
  // 显示生成的标签
  const tags = await page.locator('.tag-list').allTextContents()
  console.log('生成的标签:', tags)
  
  // 暂停等待人工确认
  await page.pause() // Playwright会暂停并打开Inspector
  
  // 或者使用自定义确认对话框
  const confirmed = await manualCheckpoint(
    '请确认AI生成的标签是否合理？'
  )
  expect(confirmed).toBe(true)
})
```

### Property-Based Testing (PBT)

**测试框架**: fast-check (JavaScript/TypeScript的PBT库)

**配置要求**:
- 每个property测试运行至少100次迭代
- 使用随机种子确保可重现性
- 失败时保存反例用于调试
- **重要**: PBT测试也使用真实的后端API，不使用Mock

**Property测试标注格式**:
```typescript
// **Feature: frontend-scenario-integration-testing, Property 1: 首页路由和数据加载一致性**
test('首页应该正确路由并加载数据', async ({ page }) => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        initialRoute: fc.constantFrom('/', '/marketplace', '/login'),
        isAuthenticated: fc.boolean()
      }),
      async ({ initialRoute, isAuthenticated }) => {
        // 设置认证状态（真实的localStorage操作）
        if (isAuthenticated) {
          await page.evaluate(() => {
            localStorage.setItem('auth_token', 'real-test-token')
          })
        }
        
        // 访问页面（真实的页面加载）
        await page.goto(`http://localhost:5173${initialRoute}`)
        
        // 验证路由和数据加载（真实的DOM检查）
        await expect(page).toHaveURL(/\/marketplace/)
        await expect(page.locator('.order-list')).toBeVisible()
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property测试覆盖**:
- Property 1-27: 每个property对应一个PBT测试
- 使用生成器创建随机测试数据
- 验证属性在所有输入下都成立
- 所有测试都使用真实的后端服务

### 测试数据生成策略

**使用@faker-js/faker生成真实的测试数据**:

```typescript
import { faker } from '@faker-js/faker'

// 用户数据生成器
export const generateTestUser = () => ({
  username: faker.internet.userName(),
  password: faker.internet.password({ length: 12 }),
  email: faker.internet.email()
})

// 订单数据生成器
export const generateTestOrder = (type?: 'supply' | 'demand') => ({
  type: type || faker.helpers.arrayElement(['supply', 'demand']),
  title: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  category: faker.commerce.department(),
  location: faker.location.city(),
  contactInfo: {
    phone: faker.phone.number(),
    wechat: faker.internet.userName()
  }
})

// 项目数据生成器
export const generateTestProject = () => ({
  name: faker.company.name(),
  description: faker.lorem.paragraph()
})
```

**使用测试小说文件进行真实内容测试**:

```typescript
// 测试小说内容加载器
export const loadTestNovel = () => {
  const novelPath = '.kiro/specs/07-01-frontend-scenario-integration-testing/test-novel.txt'
  return fs.readFileSync(novelPath, 'utf-8')
}

// 基于测试小说的角色数据生成器
export const generateCharactersFromNovel = () => [
  {
    name: '艾莉娅·陈',
    role: '舰长',
    description: '年轻的舰长，企业号NCC-1701-F的指挥官',
    traits: ['勇敢', '智慧', '仁慈']
  },
  {
    name: '马克·雷诺兹',
    role: '副舰长',
    description: '经验丰富的副舰长，艾莉娅的得力助手',
    traits: ['忠诚', '专业', '谨慎']
  },
  {
    name: '苏菲亚·瓦西里耶夫',
    role: '科学官',
    description: '才华横溢的科学官，负责分析和研究',
    traits: ['聪明', '好奇', '分析能力强']
  }
]

// 基于测试小说的场景数据生成器
export const generateScenesFromNovel = () => [
  {
    title: '启程',
    location: '企业号舰桥',
    characters: ['艾莉娅·陈', '马克·雷诺兹'],
    description: '企业号准备进行跃迁，开始探索任务'
  },
  {
    title: '异象',
    location: '塞拉星系',
    characters: ['艾莉娅·陈', '苏菲亚·瓦西里耶夫'],
    description: '发现奇异的能量读数和巨大结构体'
  }
]
```

**数据清理策略**:
- 每个测试场景开始前，清理相关的测试数据
- 使用唯一标识符（如特定前缀）标记测试数据
- 测试完成后，清理创建的测试数据
- 保留失败测试的数据用于调试

```typescript
// 测试数据清理示例
test.beforeEach(async () => {
  // 清理之前的测试数据
  await cleanupTestData('test_user_*')
  await cleanupTestData('test_order_*')
})

test.afterEach(async ({ }, testInfo) => {
  // 如果测试失败，保留数据用于调试
  if (testInfo.status !== 'passed') {
    console.log('测试失败，保留测试数据用于调试')
    return
  }
  
  // 测试通过，清理数据
  await cleanupTestData('test_user_*')
  await cleanupTestData('test_order_*')
})
```

### 测试执行命令

在spec目录下创建测试执行脚本：

**`testing/run-tests.sh`**:
```bash
#!/bin/bash

# 设置测试环境
export NODE_ENV=test
export TEST_DATA_PREFIX=test_

# 清理旧的测试报告
rm -rf testing/reports/*

# 运行Playwright测试
cd testing
npx playwright test

# 生成测试报告
npx playwright show-report reports/html
```

**`package.json`** (在spec目录下):
```json
{
  "name": "frontend-scenario-integration-testing",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:mobile": "playwright test --project=moqui-ai-mobile",
    "test:desktop": "playwright test --project=NovelAnimeDesktop",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report testing/reports/html"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@faker-js/faker": "^8.3.1",
    "fast-check": "^3.15.0"
  }
}
```

### 测试报告

**生成的报告类型**:
1. **HTML报告**: 可视化的测试结果，保存在`testing/reports/html/`
2. **JSON报告**: 机器可读的测试结果，保存在`testing/reports/results.json`
3. **截图**: 失败测试的截图，保存在`testing/reports/screenshots/`
4. **视频**: 失败测试的录屏，保存在`testing/reports/videos/`

**报告内容**:
- 测试执行时间
- 通过/失败/跳过的测试数量
- 每个测试的详细步骤
- 失败测试的详细错误信息和堆栈跟踪
- 截图和视频（如果有）
- 人工检查点的记录

**报告示例结构**:
```
testing/reports/
├── html/
│   ├── index.html              # 主报告页面
│   ├── data/                   # 测试数据
│   └── assets/                 # 静态资源
├── screenshots/
│   ├── test1-failure.png
│   └── test2-checkpoint.png
├── videos/
│   ├── test1-failure.webm
│   └── test2-execution.webm
└── results.json                # JSON格式的测试结果
```

