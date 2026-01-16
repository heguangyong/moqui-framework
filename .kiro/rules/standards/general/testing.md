# 测试规范

> **用途**: 测试开发的统一技术规范  
> **适用**: 所有测试代码编写

## 🎯 核心原则

### 测试金字塔

1. **单元测试 (70%)**: 测试单个函数或类
2. **集成测试 (20%)**: 测试模块间交互
3. **端到端测试 (10%)**: 测试完整用户流程

### FIRST原则

- **Fast**: 测试应该快速运行
- **Independent**: 测试之间相互独立
- **Repeatable**: 测试结果可重复
- **Self-Validating**: 测试自动验证结果
- **Timely**: 测试应及时编写

## 📝 单元测试

### 基本结构

```typescript
import { describe, it, expect } from 'vitest'

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      // Arrange
      const calculator = new Calculator()
      
      // Act
      const result = calculator.add(2, 3)
      
      // Assert
      expect(result).toBe(5)
    })
    
    it('should add negative numbers', () => {
      const calculator = new Calculator()
      const result = calculator.add(-2, -3)
      expect(result).toBe(-5)
    })
    
    it('should handle zero', () => {
      const calculator = new Calculator()
      const result = calculator.add(0, 5)
      expect(result).toBe(5)
    })
  })
})
```

### 测试命名

```typescript
// ❌ 不好的命名
it('test1', () => {})
it('works', () => {})

// ✅ 好的命名
it('should return empty array when no items exist', () => {})
it('should throw error when input is invalid', () => {})
it('should calculate discount correctly for premium users', () => {})
```

### 测试覆盖

```typescript
describe('UserValidator', () => {
  // 正常情况
  it('should validate correct email format', () => {
    expect(validator.isValidEmail('test@example.com')).toBe(true)
  })
  
  // 边界情况
  it('should reject empty email', () => {
    expect(validator.isValidEmail('')).toBe(false)
  })
  
  // 异常情况
  it('should reject email without @', () => {
    expect(validator.isValidEmail('testexample.com')).toBe(false)
  })
  
  // 特殊情况
  it('should handle email with multiple dots', () => {
    expect(validator.isValidEmail('test.user@example.co.uk')).toBe(true)
  })
})
```

## 📝 Mock和Stub

### 使用Mock

```typescript
import { vi } from 'vitest'

describe('UserService', () => {
  it('should fetch user from API', async () => {
    // Mock API调用
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: 1, name: 'John' })
    })
    
    global.fetch = mockFetch
    
    const service = new UserService()
    const user = await service.getUser(1)
    
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1')
    expect(user.name).toBe('John')
  })
})
```

### 使用Stub

```typescript
describe('OrderService', () => {
  it('should calculate total with discount', () => {
    // Stub价格计算器
    const priceCalculator = {
      calculate: () => 100
    }
    
    const service = new OrderService(priceCalculator)
    const total = service.calculateTotal(order, 0.1)
    
    expect(total).toBe(90)
  })
})
```

### 依赖注入

```typescript
// ❌ 难以测试
class UserService {
  async getUser(id: number) {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  }
}

// ✅ 易于测试
class UserService {
  constructor(private api: ApiClient) {}
  
  async getUser(id: number) {
    return this.api.get(`/users/${id}`)
  }
}

// 测试时注入Mock
const mockApi = {
  get: vi.fn().mockResolvedValue({ id: 1, name: 'John' })
}
const service = new UserService(mockApi)
```

## 📝 Property-Based测试

### 基本概念

```typescript
import { fc, test } from '@fast-check/vitest'

// 传统测试：测试特定输入
it('should reverse string correctly', () => {
  expect(reverse('hello')).toBe('olleh')
})

// Property-Based测试：测试属性
test.prop([fc.string()])('reversing twice returns original', (str) => {
  expect(reverse(reverse(str))).toBe(str)
})
```

### 常用属性

```typescript
describe('Array operations', () => {
  // 幂等性
  test.prop([fc.array(fc.integer())])('sorting twice is same as sorting once', (arr) => {
    const sorted1 = sort(arr)
    const sorted2 = sort(sorted1)
    expect(sorted1).toEqual(sorted2)
  })
  
  // 可逆性
  test.prop([fc.string()])('encode then decode returns original', (str) => {
    expect(decode(encode(str))).toBe(str)
  })
  
  // 不变性
  test.prop([fc.array(fc.integer())])('filter does not change array length property', (arr) => {
    const filtered = arr.filter(x => x > 0)
    expect(filtered.length).toBeLessThanOrEqual(arr.length)
  })
})
```

## 📝 集成测试

### API测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'

describe('User API', () => {
  let app: Express
  let server: Server
  
  beforeAll(async () => {
    app = createApp()
    server = app.listen(3000)
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John',
        email: 'john@example.com'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.name).toBe('John')
  })
  
  it('should get user by id', async () => {
    const response = await request(app)
      .get('/api/users/1')
    
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
  })
})
```

### 数据库测试

```typescript
describe('UserRepository', () => {
  let db: Database
  
  beforeEach(async () => {
    db = await createTestDatabase()
    await db.migrate()
  })
  
  afterEach(async () => {
    await db.close()
  })
  
  it('should save user to database', async () => {
    const repo = new UserRepository(db)
    const user = await repo.create({
      name: 'John',
      email: 'john@example.com'
    })
    
    expect(user.id).toBeDefined()
    
    const saved = await repo.findById(user.id)
    expect(saved.name).toBe('John')
  })
})
```

## 📝 端到端测试

### Playwright示例

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Login', () => {
  test('should login successfully', async ({ page }) => {
    // 访问登录页
    await page.goto('/login')
    
    // 填写表单
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // 点击登录
    await page.click('button[type="submit"]')
    
    // 验证跳转
    await expect(page).toHaveURL('/dashboard')
    
    // 验证用户名显示
    await expect(page.locator('.user-name')).toHaveText('Test User')
  })
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // 验证错误消息
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toHaveText('Invalid credentials')
  })
})
```

## ⚠️ 常见错误

### 错误1: 测试实现细节

```typescript
// ❌ 测试实现细节
it('should call internal method', () => {
  const spy = vi.spyOn(service, 'internalMethod')
  service.publicMethod()
  expect(spy).toHaveBeenCalled()
})

// ✅ 测试行为
it('should return correct result', () => {
  const result = service.publicMethod()
  expect(result).toBe(expectedValue)
})
```

### 错误2: 测试之间有依赖

```typescript
// ❌ 测试有依赖
let userId: number

it('should create user', () => {
  userId = createUser()
})

it('should get user', () => {
  const user = getUser(userId)  // 依赖上一个测试
})

// ✅ 测试独立
it('should get user', () => {
  const userId = createUser()
  const user = getUser(userId)
  expect(user).toBeDefined()
})
```

### 错误3: 过度Mock

```typescript
// ❌ 过度Mock
it('should process order', () => {
  const mockValidator = vi.fn()
  const mockCalculator = vi.fn()
  const mockInventory = vi.fn()
  const mockNotifier = vi.fn()
  // 测试变成了验证Mock调用
})

// ✅ 适度Mock
it('should process order', () => {
  // 只Mock外部依赖
  const mockApi = createMockApi()
  const result = processOrder(order, mockApi)
  expect(result.success).toBe(true)
})
```

## 🎓 最佳实践

1. **AAA模式**: Arrange-Act-Assert
2. **一个测试一个断言**: 保持测试简单
3. **使用有意义的测试数据**: 避免魔法数字
4. **测试边界条件**: 空值、零、负数等
5. **保持测试独立**: 不依赖其他测试
6. **快速反馈**: 测试应该快速运行
7. **测试行为而非实现**: 关注输入输出

## 📚 相关规范

- **代码质量**: `.kiro/rules/standards/general/code-quality.md`
- **设计模式**: `.kiro/rules/standards/general/design-patterns.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
