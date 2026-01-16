# 代码质量规范

> **用途**: 代码质量和重构的统一技术规范  
> **适用**: 所有代码开发和维护

## 🎯 核心原则

### SOLID原则

1. **单一职责原则 (SRP)**: 一个类只负责一个功能
2. **开闭原则 (OCP)**: 对扩展开放，对修改关闭
3. **里氏替换原则 (LSP)**: 子类可以替换父类
4. **接口隔离原则 (ISP)**: 接口应该小而专注
5. **依赖倒置原则 (DIP)**: 依赖抽象而非具体实现

## 📝 代码异味识别

### 1. 重复代码

```typescript
// ❌ 代码异味
function calculatePriceA(quantity: number): number {
  const basePrice = quantity * 10
  const discount = basePrice * 0.1
  return basePrice - discount
}

function calculatePriceB(quantity: number): number {
  const basePrice = quantity * 10
  const discount = basePrice * 0.1
  return basePrice - discount
}

// ✅ 重构后
function calculatePrice(quantity: number, unitPrice: number): number {
  const basePrice = quantity * unitPrice
  const discount = basePrice * 0.1
  return basePrice - discount
}
```

### 2. 过长函数

```typescript
// ❌ 代码异味：函数过长
function processOrder(order: Order): void {
  // 验证订单（20行）
  // 计算价格（30行）
  // 更新库存（25行）
  // 发送通知（15行）
}

// ✅ 重构后：拆分函数
function processOrder(order: Order): void {
  validateOrder(order)
  const price = calculateOrderPrice(order)
  updateInventory(order)
  sendNotification(order, price)
}
```

### 3. 过大的类

```typescript
// ❌ 代码异味：类职责过多
class OrderManager {
  validateOrder() {}
  calculatePrice() {}
  updateInventory() {}
  sendEmail() {}
  generateReport() {}
  processPayment() {}
}

// ✅ 重构后：拆分职责
class OrderValidator {
  validate(order: Order): boolean {}
}

class PriceCalculator {
  calculate(order: Order): number {}
}

class InventoryManager {
  update(order: Order): void {}
}
```

### 4. 过长参数列表

```typescript
// ❌ 代码异味
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string
): User {}

// ✅ 重构后：使用对象参数
interface CreateUserParams {
  name: string
  email: string
  age: number
  address: string
  phone: string
  role: string
}

function createUser(params: CreateUserParams): User {}
```

### 5. 神奇数字

```typescript
// ❌ 代码异味
if (user.age > 18) {
  // 允许访问
}

// ✅ 重构后：使用常量
const LEGAL_AGE = 18

if (user.age > LEGAL_AGE) {
  // 允许访问
}
```

## 📝 重构模式

### 1. 提取函数

```typescript
// 重构前
function printOwing(invoice: Invoice): void {
  let outstanding = 0
  
  console.log('***********************')
  console.log('**** Customer Owes ****')
  console.log('***********************')
  
  for (const order of invoice.orders) {
    outstanding += order.amount
  }
  
  console.log(`name: ${invoice.customer}`)
  console.log(`amount: ${outstanding}`)
}

// 重构后
function printOwing(invoice: Invoice): void {
  printBanner()
  const outstanding = calculateOutstanding(invoice)
  printDetails(invoice, outstanding)
}

function printBanner(): void {
  console.log('***********************')
  console.log('**** Customer Owes ****')
  console.log('***********************')
}

function calculateOutstanding(invoice: Invoice): number {
  return invoice.orders.reduce((sum, order) => sum + order.amount, 0)
}

function printDetails(invoice: Invoice, outstanding: number): void {
  console.log(`name: ${invoice.customer}`)
  console.log(`amount: ${outstanding}`)
}
```

### 2. 以对象取代参数

```typescript
// 重构前
function amountInvoiced(startDate: Date, endDate: Date): number {}
function amountReceived(startDate: Date, endDate: Date): number {}
function amountOverdue(startDate: Date, endDate: Date): number {}

// 重构后
class DateRange {
  constructor(
    public startDate: Date,
    public endDate: Date
  ) {}
}

function amountInvoiced(dateRange: DateRange): number {}
function amountReceived(dateRange: DateRange): number {}
function amountOverdue(dateRange: DateRange): number {}
```

### 3. 以多态取代条件表达式

```typescript
// 重构前
function getSpeed(bird: Bird): number {
  switch (bird.type) {
    case 'European':
      return getBaseSpeed(bird)
    case 'African':
      return getBaseSpeed(bird) - getLoadFactor(bird)
    case 'Norwegian':
      return bird.isNailed ? 0 : getBaseSpeed(bird)
    default:
      throw new Error('Unknown bird')
  }
}

// 重构后
abstract class Bird {
  abstract getSpeed(): number
}

class European extends Bird {
  getSpeed(): number {
    return this.getBaseSpeed()
  }
}

class African extends Bird {
  getSpeed(): number {
    return this.getBaseSpeed() - this.getLoadFactor()
  }
}

class Norwegian extends Bird {
  getSpeed(): number {
    return this.isNailed ? 0 : this.getBaseSpeed()
  }
}
```

## 📝 命名规范

### 1. 有意义的命名

```typescript
// ❌ 不好的命名
const d = new Date()
const x = getUserData()
function proc(data: any): void {}

// ✅ 好的命名
const currentDate = new Date()
const userData = getUserData()
function processUserData(data: UserData): void {}
```

### 2. 使用领域术语

```typescript
// ❌ 技术术语
class DataManager {
  saveToDatabase() {}
}

// ✅ 领域术语
class OrderRepository {
  save(order: Order) {}
}
```

### 3. 避免缩写

```typescript
// ❌ 过度缩写
const usrMgr = new UserManager()
const prdCtlg = new ProductCatalog()

// ✅ 完整命名
const userManager = new UserManager()
const productCatalog = new ProductCatalog()
```

## 📝 注释规范

### 1. 代码即文档

```typescript
// ❌ 不必要的注释
// 增加计数器
counter++

// ✅ 自解释的代码
incrementCounter()
```

### 2. 解释为什么而非是什么

```typescript
// ❌ 解释是什么
// 检查用户年龄是否大于18
if (user.age > 18) {}

// ✅ 解释为什么
// 根据法律要求，只有成年人才能访问此内容
if (user.age > LEGAL_AGE) {}
```

### 3. 文档注释

```typescript
/**
 * 计算订单总价
 * 
 * @param order - 订单对象
 * @param discountCode - 可选的折扣码
 * @returns 计算后的总价
 * @throws {InvalidOrderError} 当订单无效时抛出
 */
function calculateTotal(order: Order, discountCode?: string): number {
  // 实现
}
```

## 📝 错误处理

### 1. 使用异常而非错误码

```typescript
// ❌ 使用错误码
function divide(a: number, b: number): [number, number] {
  if (b === 0) {
    return [0, -1]  // 错误码
  }
  return [a / b, 0]
}

// ✅ 使用异常
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero')
  }
  return a / b
}
```

### 2. 提供上下文信息

```typescript
// ❌ 缺少上下文
throw new Error('Invalid input')

// ✅ 提供上下文
throw new Error(`Invalid email format: ${email}`)
```

### 3. 定义异常类

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

throw new ValidationError(
  'Email format is invalid',
  'email',
  userInput.email
)
```

## 🎓 最佳实践

1. **保持函数简短**: 一个函数只做一件事
2. **减少嵌套**: 使用早返回减少嵌套层级
3. **避免副作用**: 函数应该是纯函数
4. **使用不可变数据**: 避免修改输入参数
5. **编写可测试的代码**: 依赖注入，避免全局状态

## 📚 相关规范

- **测试规范**: `.kiro/rules/standards/general/testing.md`
- **设计模式**: `.kiro/rules/standards/general/design-patterns.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
