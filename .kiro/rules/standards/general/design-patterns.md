# 设计模式规范

> **用途**: 设计模式应用的统一技术规范  
> **适用**: 所有需要应用设计模式的场景

## 🎯 设计模式分类

### 创建型模式 (Creational)
控制对象的创建过程

### 结构型模式 (Structural)
组织类和对象以形成更大的结构

### 行为型模式 (Behavioral)
关注对象之间的通信

## 📝 创建型模式

### 1. 单例模式 (Singleton)

**用途**: 确保一个类只有一个实例

```typescript
class Database {
  private static instance: Database
  
  private constructor() {
    // 私有构造函数
  }
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
  
  query(sql: string): any {
    // 查询实现
  }
}

// 使用
const db = Database.getInstance()
```

### 2. 工厂模式 (Factory)

**用途**: 创建对象而不暴露创建逻辑

```typescript
interface Animal {
  speak(): string
}

class Dog implements Animal {
  speak(): string {
    return 'Woof!'
  }
}

class Cat implements Animal {
  speak(): string {
    return 'Meow!'
  }
}

class AnimalFactory {
  static create(type: string): Animal {
    switch (type) {
      case 'dog':
        return new Dog()
      case 'cat':
        return new Cat()
      default:
        throw new Error('Unknown animal type')
    }
  }
}

// 使用
const dog = AnimalFactory.create('dog')
console.log(dog.speak())  // Woof!
```

### 3. 建造者模式 (Builder)

**用途**: 分步骤构建复杂对象

```typescript
class User {
  constructor(
    public name: string,
    public email: string,
    public age?: number,
    public address?: string
  ) {}
}

class UserBuilder {
  private name: string = ''
  private email: string = ''
  private age?: number
  private address?: string
  
  setName(name: string): this {
    this.name = name
    return this
  }
  
  setEmail(email: string): this {
    this.email = email
    return this
  }
  
  setAge(age: number): this {
    this.age = age
    return this
  }
  
  setAddress(address: string): this {
    this.address = address
    return this
  }
  
  build(): User {
    return new User(this.name, this.email, this.age, this.address)
  }
}

// 使用
const user = new UserBuilder()
  .setName('John')
  .setEmail('john@example.com')
  .setAge(30)
  .build()
```

## 📝 结构型模式

### 1. 适配器模式 (Adapter)

**用途**: 使不兼容的接口能够一起工作

```typescript
// 旧接口
class OldLogger {
  logMessage(message: string): void {
    console.log(`[OLD] ${message}`)
  }
}

// 新接口
interface Logger {
  log(level: string, message: string): void
}

// 适配器
class LoggerAdapter implements Logger {
  constructor(private oldLogger: OldLogger) {}
  
  log(level: string, message: string): void {
    this.oldLogger.logMessage(`[${level}] ${message}`)
  }
}

// 使用
const oldLogger = new OldLogger()
const logger: Logger = new LoggerAdapter(oldLogger)
logger.log('INFO', 'Hello')
```

### 2. 装饰器模式 (Decorator)

**用途**: 动态地给对象添加新功能

```typescript
interface Coffee {
  cost(): number
  description(): string
}

class SimpleCoffee implements Coffee {
  cost(): number {
    return 10
  }
  
  description(): string {
    return 'Simple coffee'
  }
}

class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  
  cost(): number {
    return this.coffee.cost() + 2
  }
  
  description(): string {
    return `${this.coffee.description()}, milk`
  }
}

class SugarDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  
  cost(): number {
    return this.coffee.cost() + 1
  }
  
  description(): string {
    return `${this.coffee.description()}, sugar`
  }
}

// 使用
let coffee: Coffee = new SimpleCoffee()
coffee = new MilkDecorator(coffee)
coffee = new SugarDecorator(coffee)
console.log(coffee.description())  // Simple coffee, milk, sugar
console.log(coffee.cost())  // 13
```

### 3. 代理模式 (Proxy)

**用途**: 为对象提供代理以控制访问

```typescript
interface Image {
  display(): void
}

class RealImage implements Image {
  constructor(private filename: string) {
    this.loadFromDisk()
  }
  
  private loadFromDisk(): void {
    console.log(`Loading ${this.filename}`)
  }
  
  display(): void {
    console.log(`Displaying ${this.filename}`)
  }
}

class ProxyImage implements Image {
  private realImage?: RealImage
  
  constructor(private filename: string) {}
  
  display(): void {
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename)
    }
    this.realImage.display()
  }
}

// 使用
const image = new ProxyImage('photo.jpg')
image.display()  // 第一次调用时加载
image.display()  // 第二次调用不再加载
```

## 📝 行为型模式

### 1. 观察者模式 (Observer)

**用途**: 对象间的一对多依赖关系

```typescript
interface Observer {
  update(data: any): void
}

class Subject {
  private observers: Observer[] = []
  
  attach(observer: Observer): void {
    this.observers.push(observer)
  }
  
  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer)
    if (index > -1) {
      this.observers.splice(index, 1)
    }
  }
  
  notify(data: any): void {
    for (const observer of this.observers) {
      observer.update(data)
    }
  }
}

class ConcreteObserver implements Observer {
  constructor(private name: string) {}
  
  update(data: any): void {
    console.log(`${this.name} received: ${data}`)
  }
}

// 使用
const subject = new Subject()
const observer1 = new ConcreteObserver('Observer 1')
const observer2 = new ConcreteObserver('Observer 2')

subject.attach(observer1)
subject.attach(observer2)
subject.notify('Hello')
```

### 2. 策略模式 (Strategy)

**用途**: 定义一系列算法，使它们可以互换

```typescript
interface PaymentStrategy {
  pay(amount: number): void
}

class CreditCardPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} using credit card`)
  }
}

class PayPalPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} using PayPal`)
  }
}

class ShoppingCart {
  private paymentStrategy?: PaymentStrategy
  
  setPaymentStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy
  }
  
  checkout(amount: number): void {
    if (!this.paymentStrategy) {
      throw new Error('Payment strategy not set')
    }
    this.paymentStrategy.pay(amount)
  }
}

// 使用
const cart = new ShoppingCart()
cart.setPaymentStrategy(new CreditCardPayment())
cart.checkout(100)

cart.setPaymentStrategy(new PayPalPayment())
cart.checkout(200)
```

### 3. 命令模式 (Command)

**用途**: 将请求封装为对象

```typescript
interface Command {
  execute(): void
  undo(): void
}

class Light {
  turnOn(): void {
    console.log('Light is on')
  }
  
  turnOff(): void {
    console.log('Light is off')
  }
}

class LightOnCommand implements Command {
  constructor(private light: Light) {}
  
  execute(): void {
    this.light.turnOn()
  }
  
  undo(): void {
    this.light.turnOff()
  }
}

class LightOffCommand implements Command {
  constructor(private light: Light) {}
  
  execute(): void {
    this.light.turnOff()
  }
  
  undo(): void {
    this.light.turnOn()
  }
}

class RemoteControl {
  private history: Command[] = []
  
  execute(command: Command): void {
    command.execute()
    this.history.push(command)
  }
  
  undo(): void {
    const command = this.history.pop()
    if (command) {
      command.undo()
    }
  }
}

// 使用
const light = new Light()
const remote = new RemoteControl()

remote.execute(new LightOnCommand(light))
remote.execute(new LightOffCommand(light))
remote.undo()  // 撤销，灯打开
```

## 📝 实际应用场景

### 1. 状态管理 - 观察者模式

```typescript
// Pinia Store使用观察者模式
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  
  // 观察者会自动响应user的变化
  watch(user, (newUser) => {
    console.log('User changed:', newUser)
  })
  
  return { user }
})
```

### 2. API客户端 - 单例模式

```typescript
class ApiClient {
  private static instance: ApiClient
  private axios: AxiosInstance
  
  private constructor() {
    this.axios = axios.create({
      baseURL: '/api'
    })
  }
  
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }
  
  get(url: string): Promise<any> {
    return this.axios.get(url)
  }
}
```

### 3. 表单验证 - 策略模式

```typescript
interface ValidationStrategy {
  validate(value: string): boolean
}

class EmailValidation implements ValidationStrategy {
  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
}

class PhoneValidation implements ValidationStrategy {
  validate(value: string): boolean {
    return /^\d{10}$/.test(value)
  }
}

class FormField {
  constructor(
    private value: string,
    private strategy: ValidationStrategy
  ) {}
  
  isValid(): boolean {
    return this.strategy.validate(this.value)
  }
}
```

## ⚠️ 反模式

### 1. 过度设计

```typescript
// ❌ 过度使用设计模式
class SimpleCalculatorFactoryBuilderSingleton {
  // 简单的计算器不需要这么复杂
}

// ✅ 保持简单
class Calculator {
  add(a: number, b: number): number {
    return a + b
  }
}
```

### 2. 上帝对象

```typescript
// ❌ 一个类做所有事情
class Application {
  handleUser() {}
  handleOrder() {}
  handlePayment() {}
  handleShipping() {}
  // ...更多职责
}

// ✅ 职责分离
class UserService {}
class OrderService {}
class PaymentService {}
class ShippingService {}
```

## 🎓 最佳实践

1. **不要过度设计**: 只在需要时使用设计模式
2. **理解问题**: 先理解问题再选择模式
3. **保持简单**: KISS原则
4. **组合优于继承**: 优先使用组合
5. **开闭原则**: 对扩展开放，对修改关闭

## 📚 相关规范

- **代码质量**: `.kiro/rules/standards/general/code-quality.md`
- **测试规范**: `.kiro/rules/standards/general/testing.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
