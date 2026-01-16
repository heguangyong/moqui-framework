# TypeScript 开发规范

> **用途**: TypeScript开发的统一技术规范  
> **适用**: 所有TypeScript代码

## 🎯 核心规则

### 规则1: 明确类型定义
**避免使用any，明确定义所有类型**

### 规则2: 使用接口定义对象
**使用interface定义对象结构**

### 规则3: 使用泛型提高复用性
**合理使用泛型增强代码复用**

## 📝 基本类型

```typescript
// 基本类型
const name: string = 'John'
const age: number = 30
const isActive: boolean = true
const items: string[] = ['a', 'b', 'c']
const tuple: [string, number] = ['John', 30]

// 联合类型
type Status = 'active' | 'inactive' | 'pending'
const status: Status = 'active'

// 可选类型
const optionalValue: string | undefined = undefined

// null和undefined
const nullValue: null = null
const undefinedValue: undefined = undefined
```

## 📝 接口定义

```typescript
// 基本接口
interface User {
  id: string
  name: string
  email: string
  age?: number  // 可选属性
  readonly createdAt: Date  // 只读属性
}

// 接口继承
interface Admin extends User {
  role: 'admin'
  permissions: string[]
}

// 索引签名
interface Dictionary {
  [key: string]: any
}

// 函数接口
interface SearchFunc {
  (source: string, subString: string): boolean
}
```

## 📝 类型别名

```typescript
// 基本类型别名
type ID = string | number

// 对象类型
type Point = {
  x: number
  y: number
}

// 函数类型
type Callback = (data: string) => void

// 联合类型
type Result = Success | Error

interface Success {
  type: 'success'
  data: any
}

interface Error {
  type: 'error'
  message: string
}
```

## 📝 泛型

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg
}

const result = identity<string>('hello')

// 泛型接口
interface Response<T> {
  success: boolean
  data: T
  message: string
}

type UserResponse = Response<User>

// 泛型类
class DataStore<T> {
  private data: T[] = []
  
  add(item: T): void {
    this.data.push(item)
  }
  
  get(index: number): T | undefined {
    return this.data[index]
  }
}

// 泛型约束
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): void {
  console.log(arg.length)
}
```

## 📝 实用类型

```typescript
// Partial - 所有属性可选
interface User {
  name: string
  age: number
}

type PartialUser = Partial<User>
// { name?: string; age?: number }

// Required - 所有属性必填
type RequiredUser = Required<PartialUser>

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>

// Pick - 选择部分属性
type UserName = Pick<User, 'name'>
// { name: string }

// Omit - 排除部分属性
type UserWithoutAge = Omit<User, 'age'>
// { name: string }

// Record - 创建对象类型
type UserMap = Record<string, User>
// { [key: string]: User }
```

## 📝 函数类型

```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b
}

// 函数表达式
const subtract = (a: number, b: number): number => {
  return a - b
}

// 可选参数
function greet(name: string, greeting?: string): string {
  return `${greeting || 'Hello'}, ${name}`
}

// 默认参数
function multiply(a: number, b: number = 1): number {
  return a * b
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

// 函数重载
function process(value: string): string
function process(value: number): number
function process(value: string | number): string | number {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value * 2
}
```

## 📝 类

```typescript
// 基本类
class Person {
  // 属性
  private name: string
  protected age: number
  public email: string
  
  // 构造函数
  constructor(name: string, age: number, email: string) {
    this.name = name
    this.age = age
    this.email = email
  }
  
  // 方法
  greet(): string {
    return `Hello, I'm ${this.name}`
  }
  
  // Getter
  get displayName(): string {
    return this.name.toUpperCase()
  }
  
  // Setter
  set displayName(value: string) {
    this.name = value.toLowerCase()
  }
  
  // 静态方法
  static create(name: string): Person {
    return new Person(name, 0, '')
  }
}

// 抽象类
abstract class Animal {
  abstract makeSound(): void
  
  move(): void {
    console.log('Moving...')
  }
}

class Dog extends Animal {
  makeSound(): void {
    console.log('Woof!')
  }
}
```

## 📝 枚举

```typescript
// 数字枚举
enum Direction {
  Up,
  Down,
  Left,
  Right
}

const dir: Direction = Direction.Up

// 字符串枚举
enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

// 常量枚举
const enum Color {
  Red,
  Green,
  Blue
}
```

## ⚠️ 常见错误

### 错误1: 使用any

```typescript
// ❌ 错误：使用any
function process(data: any): any {
  return data
}

// ✅ 正确：使用泛型
function process<T>(data: T): T {
  return data
}
```

### 错误2: 类型断言滥用

```typescript
// ❌ 错误：不安全的断言
const value = data as string

// ✅ 正确：类型守卫
if (typeof data === 'string') {
  const value = data
}
```

### 错误3: 忽略null检查

```typescript
// ❌ 错误：可能为null
function getName(user: User | null): string {
  return user.name  // 错误
}

// ✅ 正确：检查null
function getName(user: User | null): string {
  return user?.name || 'Unknown'
}
```

## 🎓 最佳实践

1. 避免使用any，使用unknown或泛型
2. 使用接口定义对象结构
3. 合理使用类型守卫
4. 使用可选链和空值合并
5. 启用strict模式

## 📚 相关规范

- **Vue规范**: `.kiro/rules/standards/frontend/vue.md`
- **Quasar规范**: `.kiro/rules/standards/frontend/quasar.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
