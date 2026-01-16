# Quasar2 开发规范

> **用途**: Quasar2框架使用的统一技术规范  
> **适用**: 所有Quasar2组件和布局开发

## 🎯 核心规则

### 规则1: 使用Quasar组件
**优先使用Quasar提供的组件，避免重复造轮子**

### 规则2: 使用Quasar样式类
**使用Quasar的Flex、Spacing等工具类**

### 规则3: 响应式设计
**使用Quasar的响应式断点系统**

## 📝 常用组件

### 按钮

```vue
<template>
  <!-- 基本按钮 -->
  <q-btn label="按钮" color="primary" />
  
  <!-- 图标按钮 -->
  <q-btn icon="add" color="primary" />
  
  <!-- 扁平按钮 -->
  <q-btn flat label="扁平" />
  
  <!-- 轮廓按钮 -->
  <q-btn outline label="轮廓" color="primary" />
  
  <!-- 加载状态 -->
  <q-btn label="提交" :loading="loading" />
</template>
```

### 表单

```vue
<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <!-- 输入框 -->
    <q-input
      v-model="form.name"
      label="名称"
      :rules="[val => !!val || '请输入名称']"
    />
    
    <!-- 选择框 -->
    <q-select
      v-model="form.type"
      :options="typeOptions"
      label="类型"
    />
    
    <!-- 日期选择 -->
    <q-input
      v-model="form.date"
      label="日期"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy>
            <q-date v-model="form.date" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
    
    <!-- 提交按钮 -->
    <q-btn type="submit" label="提交" color="primary" />
  </q-form>
</template>
```

### 表格

```vue
<template>
  <q-table
    :rows="rows"
    :columns="columns"
    row-key="id"
    :pagination="pagination"
    @request="onRequest"
  >
    <!-- 自定义列 -->
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn flat icon="edit" @click="onEdit(props.row)" />
        <q-btn flat icon="delete" @click="onDelete(props.row)" />
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
const columns = [
  { name: 'name', label: '名称', field: 'name', align: 'left' },
  { name: 'status', label: '状态', field: 'status' },
  { name: 'actions', label: '操作', field: 'actions' }
]

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})
</script>
```

### 对话框

```vue
<template>
  <q-dialog v-model="isVisible">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">标题</div>
      </q-card-section>
      
      <q-card-section>
        内容
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="取消" v-close-popup />
        <q-btn label="确认" color="primary" @click="onConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
```

## 📝 布局系统

### Flex布局

```vue
<template>
  <!-- 水平布局 -->
  <div class="row q-gutter-md">
    <div class="col">列1</div>
    <div class="col">列2</div>
  </div>
  
  <!-- 响应式网格 -->
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-6 col-md-4">
      响应式列
    </div>
  </div>
  
  <!-- Flex对齐 -->
  <div class="row justify-between items-center">
    <div>左侧</div>
    <div>右侧</div>
  </div>
</template>
```

### 间距类

```vue
<template>
  <!-- Padding -->
  <div class="q-pa-md">全部padding</div>
  <div class="q-pt-md">顶部padding</div>
  <div class="q-px-md">水平padding</div>
  
  <!-- Margin -->
  <div class="q-ma-md">全部margin</div>
  <div class="q-mt-md">顶部margin</div>
  <div class="q-mx-md">水平margin</div>
  
  <!-- 间距大小: xs, sm, md, lg, xl -->
</template>
```

## 📝 响应式设计

### 使用Screen插件

```typescript
import { useQuasar } from 'quasar'

const $q = useQuasar()

// 断点检测
const isMobile = computed(() => $q.screen.lt.sm)
const isTablet = computed(() => $q.screen.sm || $q.screen.md)
const isDesktop = computed(() => $q.screen.gt.md)

// 屏幕尺寸
const screenWidth = computed(() => $q.screen.width)
const screenHeight = computed(() => $q.screen.height)
```

### 响应式类

```vue
<template>
  <!-- 显示/隐藏 -->
  <div class="gt-sm">桌面端显示</div>
  <div class="lt-md">移动端显示</div>
  
  <!-- 响应式间距 -->
  <div class="q-pa-sm q-pa-md-md q-pa-lg-lg">
    响应式padding
  </div>
</template>
```

## 📝 通知和加载

### 通知

```typescript
import { useQuasar } from 'quasar'

const $q = useQuasar()

// 成功通知
$q.notify({
  type: 'positive',
  message: '操作成功'
})

// 错误通知
$q.notify({
  type: 'negative',
  message: '操作失败'
})

// 警告通知
$q.notify({
  type: 'warning',
  message: '警告信息'
})
```

### 加载

```typescript
import { useQuasar } from 'quasar'

const $q = useQuasar()

// 显示加载
$q.loading.show({
  message: '加载中...'
})

// 隐藏加载
$q.loading.hide()
```

## ⚠️ 常见错误

### 错误1: 未导入Quasar插件

```typescript
// ❌ 错误：直接使用$q
$q.notify({ message: 'Hello' })

// ✅ 正确：先导入
import { useQuasar } from 'quasar'
const $q = useQuasar()
$q.notify({ message: 'Hello' })
```

### 错误2: 响应式类使用错误

```vue
<!-- ❌ 错误 -->
<div class="hide-on-mobile">内容</div>

<!-- ✅ 正确 -->
<div class="gt-sm">内容</div>
```

## 🎓 最佳实践

1. 优先使用Quasar组件
2. 使用Quasar样式类而非自定义CSS
3. 使用响应式断点系统
4. 合理使用通知和加载提示
5. 保持UI一致性

## 📚 相关规范

- **Vue规范**: `.kiro/rules/standards/frontend/vue.md`
- **TypeScript规范**: `.kiro/rules/standards/frontend/typescript.md`

---

**版本**: v1.0  
**创建日期**: 2025-01-16
