# MobileCard

## 📋 组件描述

MobileCard 是一个基于 Vue 3 + Quasar 的business组件，提供了标准化的界面和交互功能。

## 🎯 使用方式

```vue
<template>
  <MobileCard
    :title="componentTitle"
    :content="componentContent"
    :loading="isLoading"
    @click="handleClick"
    @change="handleChange">

    <!-- 自定义头部 -->
    <template #header>
      <div>自定义头部内容</div>
    </template>

    <!-- 自定义内容 -->
    <template #default>
      <div>自定义主要内容</div>
    </template>

    <!-- 自定义底部 -->
    <template #footer>
      <div>自定义底部内容</div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import MobileCard from '@/components/business/MobileCard.vue'

const componentTitle = ref('示例标题')
const componentContent = ref('示例内容')
const isLoading = ref(false)

const handleClick = (event: MouseEvent) => {
  console.log('组件被点击', event)
}

const handleChange = (value: any) => {
  console.log('组件值变化', value)
}
</script>
```

## 🔧 属性 (Props)

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| title | string | undefined | 组件标题 |
| content | string | undefined | 组件内容 |
| showFooter | boolean | false | 是否显示底部 |
| loading | boolean | false | 是否显示加载状态 |
| disabled | boolean | false | 是否禁用组件 |

## 📡 事件 (Events)

| 事件名 | 参数 | 描述 |
|--------|------|------|
| click | MouseEvent | 组件点击事件 |
| change | any | 组件值变化事件 |

## 🎨 样式定制

组件使用 SCSS 变量，可通过修改 `src/styles/variables.scss` 来定制外观：

```scss
// 修改主要颜色
$primary-color: #your-color;

// 修改圆角大小
$border-radius-lg: 20px;

// 修改间距
$spacing-md: 20px;
```

## 📱 移动端适配

组件已针对移动端进行优化：
- 响应式设计
- 触摸友好的交互
- 适配不同屏幕尺寸

## 🌓 暗色模式

组件支持系统暗色模式，会根据用户的系统设置自动切换。

## 🧪 测试

运行测试：
```bash
npm run test:unit MobileCard.test.ts
```

## 📝 更新日志

- v1.0.0: 初始版本，基础功能实现
