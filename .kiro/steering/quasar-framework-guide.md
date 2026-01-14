# Quasar Framework 开发指南

本文档提供 Quasar Vue.js 框架的完整开发指导，用于构建响应式Web、移动端和桌面应用程序。

## 概述

Quasar Framework 是基于 Vue.js 的跨平台开发框架，允许开发者使用单一代码库创建多平台应用程序。

### 支持平台
- **SPA** (Single Page Application) - 标准Web应用
- **SSR** (Server-Side Rendering) - SEO友好的Web应用
- **PWA** (Progressive Web App) - 类应用的Web体验
- **Mobile** - 通过Cordova/Capacitor的原生移动应用
- **Desktop** - 通过Electron的跨平台桌面应用

### 技术特性
- **Vue 3 Composition API** - 现代Vue.js开发模式
- **Material Design** - 遵循Material Design设计原则
- **Tree Shaking** - 只打包使用的组件
- **TypeScript支持** - 完整的TypeScript集成
- **响应式设计** - 内置响应式网格系统

## 项目设置

### 创建新项目
```bash
# 使用Yarn创建项目
yarn create quasar

# 使用NPM创建项目
npm create quasar

# 安装全局CLI（可选但推荐）
yarn global add @quasar/cli
# 或
npm install -g @quasar/cli
```

### 启动开发服务器
```bash
# 进入项目目录
cd my-quasar-project

# 启动开发服务器
quasar dev
# 或
yarn quasar dev
# 或
npm run dev
```

### 项目结构
```
my-quasar-project/
├── public/          # 静态资源
├── src/
│   ├── components/  # Vue组件
│   ├── layouts/     # 布局组件
│   ├── pages/       # 页面组件
│   ├── router/      # 路由配置
│   ├── stores/      # Pinia状态管理
│   ├── css/         # 样式文件
│   └── App.vue      # 根组件
├── quasar.config.js # Quasar配置文件
└── package.json
```

## 核心组件使用

### 布局系统
```vue
<template>
  <q-layout view="lHh Lpr lFf">
    <!-- 头部 -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>应用标题</q-toolbar-title>
        <q-btn flat round icon="account_circle" />
      </q-toolbar>
    </q-header>

    <!-- 侧边栏 -->
    <q-drawer v-model="drawer" bordered>
      <q-list>
        <q-item clickable v-ripple @click="navigateTo('/')">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>首页</q-item-section>
        </q-item>
        
        <q-item clickable v-ripple @click="navigateTo('/about')">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>关于</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 主内容区 -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(false)
const router = useRouter()

const navigateTo = (path) => {
  router.push(path)
  drawer.value = false
}
</script>
```

### 按钮组件
```vue
<template>
  <!-- 基础按钮 -->
  <q-btn 
    color="primary" 
    label="点击我" 
    @click="handleClick" 
  />

  <!-- 图标按钮 -->
  <q-btn 
    color="secondary" 
    icon="add" 
    round 
    @click="addItem" 
  />

  <!-- 带图标的按钮 -->
  <q-btn 
    color="positive" 
    icon="save" 
    label="保存" 
    @click="saveData" 
  />

  <!-- 加载状态按钮 -->
  <q-btn 
    color="primary" 
    label="提交" 
    :loading="isLoading" 
    @click="submitForm" 
  />

  <!-- 禁用按钮 -->
  <q-btn 
    color="negative" 
    label="删除" 
    :disable="!canDelete" 
    @click="deleteItem" 
  />
</template>

<script setup>
import { ref } from 'vue'

const isLoading = ref(false)
const canDelete = ref(true)

const handleClick = () => {
  console.log('按钮被点击')
}

const addItem = () => {
  console.log('添加项目')
}

const saveData = async () => {
  isLoading.value = true
  try {
    // 保存逻辑
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('数据已保存')
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 表单组件
```vue
<template>
  <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
    <!-- 文本输入 -->
    <q-input
      v-model="form.name"
      label="姓名 *"
      hint="请输入您的全名"
      lazy-rules
      :rules="[val => !!val || '姓名是必填项']"
    />

    <!-- 邮箱输入 -->
    <q-input
      v-model="form.email"
      type="email"
      label="邮箱 *"
      lazy-rules
      :rules="[
        val => !!val || '邮箱是必填项',
        val => /.+@.+\..+/.test(val) || '请输入有效的邮箱地址'
      ]"
    />

    <!-- 密码输入 -->
    <q-input
      v-model="form.password"
      :type="showPassword ? 'text' : 'password'"
      label="密码 *"
      lazy-rules
      :rules="[
        val => !!val || '密码是必填项',
        val => val.length >= 6 || '密码至少6位'
      ]"
    >
      <template v-slot:append>
        <q-icon
          :name="showPassword ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>

    <!-- 选择器 -->
    <q-select
      v-model="form.category"
      :options="categoryOptions"
      label="分类"
      emit-value
      map-options
    />

    <!-- 多选 -->
    <q-select
      v-model="form.tags"
      :options="tagOptions"
      label="标签"
      multiple
      emit-value
      map-options
      use-chips
    />

    <!-- 日期选择 -->
    <q-input
      v-model="form.birthDate"
      label="出生日期"
      mask="date"
      :rules="['date']"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="form.birthDate">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="关闭" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <!-- 开关 -->
    <q-toggle
      v-model="form.newsletter"
      label="订阅新闻通讯"
    />

    <!-- 单选按钮 -->
    <q-option-group
      v-model="form.gender"
      :options="genderOptions"
      color="primary"
      inline
    />

    <!-- 提交按钮 -->
    <div class="q-mt-md">
      <q-btn label="提交" type="submit" color="primary" />
      <q-btn label="重置" type="reset" color="primary" flat class="q-ml-sm" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const showPassword = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  category: null,
  tags: [],
  birthDate: '',
  newsletter: false,
  gender: null
})

const categoryOptions = [
  { label: '技术', value: 'tech' },
  { label: '设计', value: 'design' },
  { label: '市场', value: 'marketing' }
]

const tagOptions = [
  { label: 'Vue.js', value: 'vue' },
  { label: 'JavaScript', value: 'js' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' }
]

const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '其他', value: 'other' }
]

const onSubmit = () => {
  console.log('表单提交:', form)
  // 提交逻辑
}

const onReset = () => {
  Object.assign(form, {
    name: '',
    email: '',
    password: '',
    category: null,
    tags: [],
    birthDate: '',
    newsletter: false,
    gender: null
  })
}
</script>
```

### 数据表格
```vue
<template>
  <q-table
    title="用户列表"
    :rows="rows"
    :columns="columns"
    row-key="id"
    :loading="loading"
    :filter="filter"
    :pagination="pagination"
    @request="onRequest"
  >
    <!-- 顶部插槽 -->
    <template v-slot:top-right>
      <q-input
        borderless
        dense
        debounce="300"
        v-model="filter"
        placeholder="搜索"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>

    <!-- 操作列 -->
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          flat
          round
          color="primary"
          icon="edit"
          @click="editUser(props.row)"
        />
        <q-btn
          flat
          round
          color="negative"
          icon="delete"
          @click="deleteUser(props.row)"
        />
      </q-td>
    </template>

    <!-- 状态列 -->
    <template v-slot:body-cell-status="props">
      <q-td :props="props">
        <q-chip
          :color="props.value === 'active' ? 'positive' : 'negative'"
          text-color="white"
          :label="props.value === 'active' ? '活跃' : '非活跃'"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(false)
const filter = ref('')
const rows = ref([])

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    sortable: true
  },
  {
    name: 'name',
    label: '姓名',
    field: 'name',
    sortable: true,
    align: 'left'
  },
  {
    name: 'email',
    label: '邮箱',
    field: 'email',
    sortable: true
  },
  {
    name: 'status',
    label: '状态',
    field: 'status',
    sortable: true
  },
  {
    name: 'actions',
    label: '操作',
    field: 'actions',
    align: 'center'
  }
]

const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const onRequest = async (props) => {
  loading.value = true
  
  try {
    // 模拟API调用
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    const filter = props.filter
    
    // 这里应该是实际的API调用
    const response = await fetchUsers({
      page,
      limit: rowsPerPage,
      sortBy,
      descending,
      filter
    })
    
    rows.value = response.data
    pagination.value.rowsNumber = response.total
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  console.log('编辑用户:', user)
  // 编辑逻辑
}

const deleteUser = (user) => {
  console.log('删除用户:', user)
  // 删除逻辑
}

// 模拟API函数
const fetchUsers = async (params) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data: [
          { id: 1, name: '张三', email: 'zhang@example.com', status: 'active' },
          { id: 2, name: '李四', email: 'li@example.com', status: 'inactive' }
        ],
        total: 2
      })
    }, 1000)
  })
}

onMounted(() => {
  onRequest({
    pagination: pagination.value,
    filter: filter.value
  })
})
</script>
```

### 对话框和通知
```vue
<template>
  <div class="q-pa-md q-gutter-sm">
    <!-- 基础对话框 -->
    <q-btn label="显示对话框" @click="showDialog = true" />
    
    <!-- 确认对话框 -->
    <q-btn label="确认对话框" @click="showConfirmDialog" />
    
    <!-- 通知按钮 -->
    <q-btn label="成功通知" @click="showSuccessNotify" />
    <q-btn label="错误通知" @click="showErrorNotify" />
    <q-btn label="警告通知" @click="showWarningNotify" />
  </div>

  <!-- 基础对话框 -->
  <q-dialog v-model="showDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">对话框标题</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        这是对话框的内容。您可以在这里放置任何内容。
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="取消" color="primary" v-close-popup />
        <q-btn flat label="确定" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const showDialog = ref(false)

const showConfirmDialog = () => {
  $q.dialog({
    title: '确认',
    message: '您确定要执行此操作吗？',
    cancel: true,
    persistent: true
  }).onOk(() => {
    console.log('用户确认')
  }).onCancel(() => {
    console.log('用户取消')
  })
}

const showSuccessNotify = () => {
  $q.notify({
    type: 'positive',
    message: '操作成功！',
    position: 'top'
  })
}

const showErrorNotify = () => {
  $q.notify({
    type: 'negative',
    message: '操作失败，请重试。',
    position: 'top'
  })
}

const showWarningNotify = () => {
  $q.notify({
    type: 'warning',
    message: '请注意：这是一个警告消息。',
    position: 'top',
    timeout: 5000
  })
}
</script>
```

## 响应式设计

### Flex 布局基础

Quasar 基于 Flexbox 构建响应式布局系统。以下是核心 Flex 布局概念：

#### 容器属性（父元素）
```css
.container {
  display: flex;
  
  /* 主轴方向 */
  flex-direction: row | row-reverse | column | column-reverse;
  
  /* 换行 */
  flex-wrap: nowrap | wrap | wrap-reverse;
  
  /* 主轴对齐 */
  justify-content: flex-start | flex-end | center | space-between | space-around;
  
  /* 交叉轴对齐 */
  align-items: flex-start | flex-end | center | baseline | stretch;
  
  /* 多行对齐 */
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
}
```

#### 项目属性（子元素）
```css
.item {
  /* 排列顺序，数值越小越靠前 */
  order: 0;
  
  /* 放大比例，0不放大 */
  flex-grow: 0;
  
  /* 缩小比例，1可缩小 */
  flex-shrink: 1;
  
  /* 初始大小 */
  flex-basis: auto;
  
  /* 简写: flex-grow flex-shrink flex-basis */
  flex: 0 1 auto;
  
  /* 单独对齐，覆盖容器的align-items */
  align-self: auto | flex-start | flex-end | center | baseline | stretch;
}
```

#### 常用布局模式
```css
/* 水平垂直居中 */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 两端对齐 */
.space-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 等分布局 */
.equal {
  display: flex;
}
.equal > * {
  flex: 1;
}

/* 固定+自适应 */
.fixed-flex {
  display: flex;
}
.fixed-flex .fixed {
  flex: 0 0 100px; /* 固定宽度 */
}
.fixed-flex .flexible {
  flex: 1; /* 自适应剩余空间 */
}
```

#### Flex 简写对照表
| 简写 | 等价于 | 说明 |
|------|--------|------|
| `flex: 1` | `flex: 1 1 0%` | 等分剩余空间 |
| `flex: auto` | `flex: 1 1 auto` | 基于内容自适应 |
| `flex: none` | `flex: 0 0 auto` | 不伸缩 |
| `flex: 0 0 100px` | - | 固定宽度 |

### 网格系统
```vue
<template>
  <div class="q-pa-md">
    <!-- 基础网格 -->
    <div class="row q-gutter-md">
      <div class="col-12 col-md-6 col-lg-4">
        <q-card class="q-pa-md">
          <div class="text-h6">卡片 1</div>
          <div>响应式内容</div>
        </q-card>
      </div>
      
      <div class="col-12 col-md-6 col-lg-4">
        <q-card class="q-pa-md">
          <div class="text-h6">卡片 2</div>
          <div>响应式内容</div>
        </q-card>
      </div>
      
      <div class="col-12 col-md-12 col-lg-4">
        <q-card class="q-pa-md">
          <div class="text-h6">卡片 3</div>
          <div>响应式内容</div>
        </q-card>
      </div>
    </div>

    <!-- 断点显示/隐藏 -->
    <div class="q-mt-md">
      <div class="gt-xs">在XS断点以上显示</div>
      <div class="lt-md">在MD断点以下显示</div>
      <div class="gt-sm lt-lg">只在SM和MD断点显示</div>
    </div>
  </div>
</template>
```

### 断点工具类
```css
/* Quasar断点 */
/* xs: 0-599px */
/* sm: 600-1023px */
/* md: 1024-1439px */
/* lg: 1440-1919px */
/* xl: 1920px+ */

/* 显示/隐藏类 */
.xs { /* 只在xs显示 */ }
.sm { /* 只在sm显示 */ }
.md { /* 只在md显示 */ }
.lg { /* 只在lg显示 */ }
.xl { /* 只在xl显示 */ }

.gt-xs { /* 在xs以上显示 */ }
.gt-sm { /* 在sm以上显示 */ }
.gt-md { /* 在md以上显示 */ }
.gt-lg { /* 在lg以上显示 */ }

.lt-sm { /* 在sm以下显示 */ }
.lt-md { /* 在md以下显示 */ }
.lt-lg { /* 在lg以下显示 */ }
.lt-xl { /* 在xl以下显示 */ }
```

## 构建和部署

### 开发和生产构建
```bash
# 开发模式
quasar dev

# 生产构建（SPA）
quasar build

# SSR构建
quasar build -m ssr

# PWA构建
quasar build -m pwa
```

### 移动应用开发
```bash
# 添加Cordova模式
quasar mode add cordova

# 添加Capacitor模式
quasar mode add capacitor

# 移动端开发
quasar dev -m cordova -T android
quasar dev -m capacitor -T ios

# 构建移动应用
quasar build -m cordova -T android
quasar build -m capacitor -T ios
```

### 桌面应用开发
```bash
# 添加Electron模式
quasar mode add electron

# 桌面端开发
quasar dev -m electron

# 构建桌面应用
quasar build -m electron
```

## 配置文件

### 基础Quasar配置
```javascript
// quasar.config.js
const { configure } = require('quasar/wrappers')

module.exports = configure(function (ctx) {
  return {
    // 支持TypeScript
    supportTS: {
      tsCheckerConfig: {
        eslint: {
          enabled: true,
          files: './src/**/*.{ts,tsx,js,jsx,vue}'
        }
      }
    },

    // 预取功能
    preFetch: true,

    // 应用启动文件
    boot: [
      'axios',
      'i18n'
    ],

    // CSS文件
    css: [
      'app.scss'
    ],

    // 额外配置
    extras: [
      'roboto-font',
      'material-icons'
    ],

    // 构建配置
    build: {
      vueRouterMode: 'history',
      
      // 环境变量
      env: {
        API_URL: ctx.dev 
          ? 'http://localhost:3000' 
          : 'https://api.production.com'
      },

      // 扩展webpack配置
      extendWebpack(cfg) {
        cfg.resolve.alias = {
          ...cfg.resolve.alias,
          '@': path.resolve(__dirname, 'src')
        }
      }
    },

    // 开发服务器
    devServer: {
      server: {
        type: 'http'
      },
      port: 8080,
      open: true
    },

    // 框架配置
    framework: {
      config: {
        notify: {
          position: 'top-right',
          timeout: 2500,
          textColor: 'white',
          actions: [{ icon: 'close', color: 'white' }]
        }
      },

      iconSet: 'material-icons',
      lang: 'zh-hans',

      // 自动导入的插件
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage'
      ]
    },

    // 动画
    animations: [
      'slideInLeft',
      'slideOutRight',
      'fadeIn',
      'fadeOut'
    ],

    // SSR配置
    ssr: {
      pwa: false,
      prodPort: 3000,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      middlewares: [
        ctx.prod ? 'compression' : '',
        'render'
      ]
    },

    // PWA配置
    pwa: {
      workboxPluginMode: 'GenerateSW',
      workboxOptions: {},
      chainWebpackCustomSW (chain) {
        // 自定义Service Worker
      },
      manifest: {
        name: '我的Quasar应用',
        short_name: 'Quasar App',
        description: '基于Quasar的Vue.js应用',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#027be3',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          }
        ]
      }
    },

    // Cordova配置
    cordova: {
      id: 'com.example.myapp'
    },

    // Capacitor配置
    capacitor: {
      hideSplashscreen: true
    },

    // Electron配置
    electron: {
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'com.example.myapp'
      }
    }
  }
})
```

## 状态管理（Pinia）

### Store定义
```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const isLoggedIn = ref(false)
  const preferences = ref({
    theme: 'light',
    language: 'zh-CN'
  })

  // 计算属性
  const userName = computed(() => {
    return user.value ? user.value.name : '游客'
  })

  const isAdmin = computed(() => {
    return user.value && user.value.role === 'admin'
  })

  // 方法
  const login = async (credentials) => {
    try {
      const response = await api.login(credentials)
      user.value = response.user
      isLoggedIn.value = true
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
  }

  const updatePreferences = (newPreferences) => {
    preferences.value = { ...preferences.value, ...newPreferences }
  }

  return {
    // 状态
    user,
    isLoggedIn,
    preferences,
    // 计算属性
    userName,
    isAdmin,
    // 方法
    login,
    logout,
    updatePreferences
  }
})
```

### 在组件中使用Store
```vue
<template>
  <div class="q-pa-md">
    <div v-if="userStore.isLoggedIn">
      <h5>欢迎，{{ userStore.userName }}！</h5>
      <q-btn 
        label="退出登录" 
        color="negative" 
        @click="userStore.logout" 
      />
    </div>
    
    <div v-else>
      <q-form @submit="handleLogin">
        <q-input 
          v-model="loginForm.username" 
          label="用户名" 
        />
        <q-input 
          v-model="loginForm.password" 
          type="password" 
          label="密码" 
        />
        <q-btn 
          type="submit" 
          label="登录" 
          color="primary" 
        />
      </q-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'

const userStore = useUserStore()
const $q = useQuasar()

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  const result = await userStore.login(loginForm)
  
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: '登录成功！'
    })
  } else {
    $q.notify({
      type: 'negative',
      message: `登录失败：${result.error}`
    })
  }
}
</script>
```

## 国际化（i18n）

### 语言文件配置
```javascript
// src/i18n/zh-CN/index.js
export default {
  common: {
    ok: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    loading: '加载中...'
  },
  pages: {
    home: {
      title: '首页',
      welcome: '欢迎使用我们的应用'
    },
    user: {
      profile: '个人资料',
      settings: '设置'
    }
  },
  validation: {
    required: '此字段为必填项',
    email: '请输入有效的邮箱地址',
    minLength: '至少需要 {min} 个字符'
  }
}
```

```javascript
// src/i18n/en-US/index.js
export default {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...'
  },
  pages: {
    home: {
      title: 'Home',
      welcome: 'Welcome to our application'
    },
    user: {
      profile: 'Profile',
      settings: 'Settings'
    }
  },
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: 'Minimum {min} characters required'
  }
}
```

### 在组件中使用i18n
```vue
<template>
  <div class="q-pa-md">
    <h5>{{ $t('pages.home.title') }}</h5>
    <p>{{ $t('pages.home.welcome') }}</p>
    
    <q-btn 
      :label="$t('common.save')" 
      color="primary" 
    />
    
    <!-- 带参数的翻译 -->
    <p>{{ $t('validation.minLength', { min: 6 }) }}</p>
    
    <!-- 语言切换 -->
    <q-select
      v-model="currentLocale"
      :options="localeOptions"
      @update:model-value="changeLocale"
      label="语言"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const changeLocale = (newLocale) => {
  locale.value = newLocale
}
</script>
```

## 性能优化

### 代码分割和懒加载
```javascript
// router/routes.js
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/IndexPage.vue') 
      },
      { 
        path: '/about', 
        component: () => import('pages/AboutPage.vue') 
      },
      // 懒加载大型页面
      { 
        path: '/dashboard', 
        component: () => import(/* webpackChunkName: "dashboard" */ 'pages/DashboardPage.vue') 
      }
    ]
  }
]
```

### 组件懒加载
```vue
<template>
  <div>
    <!-- 条件渲染大型组件 -->
    <heavy-component v-if="showHeavyComponent" />
    
    <!-- 异步组件 -->
    <Suspense>
      <template #default>
        <async-component />
      </template>
      <template #fallback>
        <q-spinner size="50px" />
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

const showHeavyComponent = ref(false)

// 异步组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 懒加载组件
const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: () => import('./LoadingComponent.vue'),
  errorComponent: () => import('./ErrorComponent.vue'),
  delay: 200,
  timeout: 3000
})
</script>
```

## 测试

### 单元测试配置
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.js']
  },
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.sass'
    })
  ]
})
```

### 组件测试示例
```javascript
// src/components/__tests__/MyButton.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import MyButton from '../MyButton.vue'

describe('MyButton', () => {
  it('renders properly', () => {
    const wrapper = mount(MyButton, {
      props: { label: 'Test Button' },
      global: {
        plugins: [Quasar]
      }
    })
    
    expect(wrapper.text()).toContain('Test Button')
  })

  it('emits click event', async () => {
    const wrapper = mount(MyButton, {
      global: {
        plugins: [Quasar]
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })
})
```

## 故障排除

### 常见问题和解决方案

#### 1. 构建错误
```bash
# 清理缓存
rm -rf node_modules
rm package-lock.json
npm install

# 或使用yarn
rm -rf node_modules
rm yarn.lock
yarn install
```

#### 2. 组件样式问题
```scss
// 确保正确导入Quasar样式
@import '~quasar/src/css/index.sass';

// 或在quasar.config.js中配置
css: [
  'app.scss'
]
```

#### 3. 移动端调试
```bash
# Android调试
adb devices
quasar dev -m cordova -T android

# iOS调试（需要Xcode）
quasar dev -m capacitor -T ios
```

#### 4. 性能问题
```javascript
// 使用Vue DevTools分析性能
// 启用生产环境性能追踪
app.config.performance = true

// 检查包大小
quasar build --analyze
```

## 最佳实践

### 1. 项目结构
```
src/
├── components/     # 可复用组件
│   ├── common/    # 通用组件
│   └── forms/     # 表单组件
├── layouts/       # 布局组件
├── pages/         # 页面组件
├── stores/        # Pinia状态管理
├── composables/   # 组合式函数
├── utils/         # 工具函数
├── services/      # API服务
└── types/         # TypeScript类型定义
```

### 2. 组件命名
```javascript
// 使用PascalCase命名组件
export default {
  name: 'UserProfile'
}

// 文件名使用PascalCase
UserProfile.vue
UserProfileCard.vue
```

### 3. 样式组织
```scss
// 使用BEM命名规范
.user-profile {
  &__header {
    // 样式
  }
  
  &__content {
    // 样式
  }
  
  &--compact {
    // 修饰符样式
  }
}
```

### 4. 状态管理
```javascript
// 保持store简单和专注
// 一个store负责一个业务域
export const useUserStore = defineStore('user', () => {
  // 只包含用户相关的状态和方法
})

export const useProductStore = defineStore('product', () => {
  // 只包含产品相关的状态和方法
})
```

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**基于**: Quasar Framework 官方文档  
**适用范围**: 所有基于Quasar Framework的Vue.js开发活动  
**审批状态**: 待审批

## 桌面端应用开发

### 桌面端架构设计

Quasar支持通过Electron构建跨平台桌面应用。以下是一个典型的桌面端UI架构设计参考。

#### 整体布局结构

桌面端应用通常采用经典的三栏布局设计：

```
┌──────────────────────────────────────────────────────────────────┐
│                         App Container                             │
├────────┬─────────────────────────────────────────────────────────┤
│        │                    Middle Panel                          │
│ Narrow │  ┌──────────────┬────────────────────────────────────┐  │
│ Sidebar│  │ Menu Column  │         Main Area                   │  │
│ (56px) │  │   (280px)    │      (Router View)                  │  │
│        │  │              │                                      │  │
│  导航   │  │  Context     │    各功能视图组件                    │  │
│  图标   │  │  Panel       │    (Dashboard/Workflow/             │  │
│        │  │              │     Characters/Assets/Settings)      │  │
│        │  │              │                                      │  │
│        │  └──────────────┴────────────────────────────────────┘  │
└────────┴─────────────────────────────────────────────────────────┘
```

#### 左侧极窄侧边栏设计

```vue
<template>
  <q-drawer
    v-model="leftDrawerOpen"
    show-if-above
    :width="56"
    :breakpoint="500"
    bordered
    class="narrow-sidebar"
  >
    <q-list>
      <q-item
        v-for="nav in navigationItems"
        :key="nav.id"
        clickable
        v-ripple
        :active="currentRoute === nav.route"
        @click="navigateTo(nav.route)"
        class="nav-item"
      >
        <q-item-section avatar>
          <q-icon :name="nav.icon" size="24px" />
        </q-item-section>
        <q-tooltip anchor="center right" self="center left">
          {{ nav.label }}
        </q-tooltip>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const leftDrawerOpen = ref(true)
const currentRoute = computed(() => route.path)

const navigationItems = [
  { id: 'dashboard', icon: 'home', label: '项目概览', route: '/dashboard' },
  { id: 'workflow', icon: 'account_tree', label: '工作流', route: '/workflow' },
  { id: 'assets', icon: 'folder_open', label: '资源库', route: '/assets' },
  { id: 'characters', icon: 'people', label: '角色管理', route: '/characters' },
  { id: 'settings', icon: 'settings', label: '设置', route: '/settings' }
]

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.narrow-sidebar {
  .nav-item {
    min-height: 56px;
    justify-content: center;
    
    &.q-item--active {
      background-color: rgba(25, 118, 210, 0.12);
      
      .q-icon {
        color: #1976d2;
      }
    }
  }
}
</style>
```

#### 中间面板设计

```vue
<template>
  <q-page-container>
    <div class="middle-panel">
      <!-- Menu Column -->
      <div class="menu-column">
        <component 
          :is="currentContextPanel" 
          :context-data="contextData"
        />
      </div>
      
      <!-- Main Area -->
      <div class="main-area">
        <router-view />
      </div>
    </div>
  </q-page-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from 'stores/app'

// Context Panels
import DashboardPanel from 'components/panels/DashboardPanel.vue'
import WorkflowPanel from 'components/panels/WorkflowPanel.vue'
import AssetsPanel from 'components/panels/AssetsPanel.vue'
import CharactersPanel from 'components/panels/CharactersPanel.vue'
import SettingsPanel from 'components/panels/SettingsPanel.vue'

const route = useRoute()
const appStore = useAppStore()

const contextPanelMap = {
  '/dashboard': DashboardPanel,
  '/workflow': WorkflowPanel,
  '/assets': AssetsPanel,
  '/characters': CharactersPanel,
  '/settings': SettingsPanel
}

const currentContextPanel = computed(() => {
  const basePath = '/' + route.path.split('/')[1]
  return contextPanelMap[basePath] || DashboardPanel
})

const contextData = computed(() => appStore.getContextData(route.path))
</script>

<style lang="scss" scoped>
.middle-panel {
  display: flex;
  height: 100vh;
  
  .menu-column {
    width: 280px;
    border-right: 1px solid #e0e0e0;
    background-color: #fafafa;
    overflow-y: auto;
  }
  
  .main-area {
    flex: 1;
    overflow-y: auto;
    background-color: #ffffff;
  }
}
</style>
```

#### 状态管理设计

```typescript
// stores/app.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const currentProject = ref(null)
  const sidebarCollapsed = ref(false)
  const contextPanelData = ref({})
  
  // 计算属性
  const isProjectLoaded = computed(() => !!currentProject.value)
  
  // 方法
  const setCurrentProject = (project) => {
    currentProject.value = project
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const setContextData = (route, data) => {
    contextPanelData.value[route] = data
  }
  
  const getContextData = (route) => {
    return contextPanelData.value[route] || {}
  }
  
  return {
    // 状态
    currentProject,
    sidebarCollapsed,
    contextPanelData,
    // 计算属性
    isProjectLoaded,
    // 方法
    setCurrentProject,
    toggleSidebar,
    setContextData,
    getContextData
  }
})
```

#### 上下文面板组件示例

```vue
<!-- components/panels/DashboardPanel.vue -->
<template>
  <div class="dashboard-panel">
    <div class="panel-header">
      <h6>项目概览</h6>
      <q-btn flat round icon="refresh" @click="refreshData" />
    </div>
    
    <div class="panel-content">
      <!-- 项目统计 -->
      <div class="stats-section">
        <q-card flat class="stat-card">
          <q-card-section>
            <div class="stat-number">{{ projectStats.totalScenes }}</div>
            <div class="stat-label">场景总数</div>
          </q-card-section>
        </q-card>
        
        <q-card flat class="stat-card">
          <q-card-section>
            <div class="stat-number">{{ projectStats.totalCharacters }}</div>
            <div class="stat-label">角色数量</div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 最近活动 -->
      <div class="recent-section">
        <h6>最近活动</h6>
        <q-list>
          <q-item
            v-for="activity in recentActivities"
            :key="activity.id"
            clickable
          >
            <q-item-section avatar>
              <q-icon :name="activity.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ activity.title }}</q-item-label>
              <q-item-label caption>{{ activity.time }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjectStore } from 'stores/project'

const projectStore = useProjectStore()

const projectStats = ref({
  totalScenes: 0,
  totalCharacters: 0
})

const recentActivities = ref([])

const refreshData = async () => {
  // 刷新数据逻辑
  await projectStore.loadProjectStats()
  projectStats.value = projectStore.stats
  recentActivities.value = projectStore.recentActivities
}

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.dashboard-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h6 {
      margin: 0;
      font-weight: 500;
    }
  }
  
  .panel-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }
  
  .stats-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
    
    .stat-card {
      text-align: center;
      
      .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: #1976d2;
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }
    }
  }
  
  .recent-section {
    h6 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
```

### 桌面端特有功能

#### 窗口管理

```javascript
// src-electron/main-process/electron-main.js
import { app, BrowserWindow, Menu } from 'electron'
import path from 'path'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
```

#### 原生菜单

```javascript
// src-electron/main-process/electron-main.js
import { Menu } from 'electron'

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建项目',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project')
          }
        },
        {
          label: '打开项目',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-project')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
})
```

#### 进程间通信

```javascript
// src-electron/electron-preload.js
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 菜单事件监听
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-project', callback)
    ipcRenderer.on('menu-open-project', callback)
  },
  
  // 文件操作
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),
  
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close')
})
```

```vue
<!-- 在Vue组件中使用 -->
<script setup>
import { onMounted, onUnmounted } from 'vue'

let menuActionHandler

onMounted(() => {
  if (window.electronAPI) {
    menuActionHandler = (event, action) => {
      switch (action) {
        case 'menu-new-project':
          createNewProject()
          break
        case 'menu-open-project':
          openProject()
          break
      }
    }
    
    window.electronAPI.onMenuAction(menuActionHandler)
  }
})

onUnmounted(() => {
  // 清理事件监听器
})

const createNewProject = () => {
  // 新建项目逻辑
}

const openProject = async () => {
  if (window.electronAPI) {
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      // 处理打开的文件
    }
  }
}
</script>
```

### 桌面端性能优化

#### 内存管理

```javascript
// 在大型数据处理时使用虚拟化
import { QVirtualScroll } from 'quasar'

export default {
  components: {
    QVirtualScroll
  },
  setup() {
    const largeDataSet = ref([])
    
    // 虚拟滚动配置
    const virtualScrollProps = {
      itemSize: 50,
      overscan: 10
    }
    
    return {
      largeDataSet,
      virtualScrollProps
    }
  }
}
```

#### 渲染优化

```vue
<template>
  <!-- 使用v-show而不是v-if来避免频繁的DOM操作 -->
  <div v-show="isVisible" class="heavy-component">
    <!-- 复杂内容 -->
  </div>
  
  <!-- 对于大列表使用虚拟滚动 -->
  <q-virtual-scroll
    :items="items"
    :item-size="itemSize"
    v-slot="{ item, index }"
  >
    <q-item :key="index">
      {{ item.name }}
    </q-item>
  </q-virtual-scroll>
</template>
```

### 桌面端部署

#### 构建配置

```javascript
// quasar.config.js
module.exports = configure(function (ctx) {
  return {
    electron: {
      bundler: 'packager', // 或 'builder'
      
      packager: {
        // Electron Packager 选项
        platform: 'all',
        arch: 'x64',
        out: 'dist/electron',
        ignore: /node_modules/,
        overwrite: true
      },
      
      builder: {
        // Electron Builder 选项
        appId: 'com.example.myapp',
        productName: 'My Desktop App',
        directories: {
          output: 'dist/electron'
        },
        files: [
          'dist/spa/**/*',
          'node_modules/**/*',
          'src-electron/**/*'
        ],
        mac: {
          icon: 'icons/icon.icns'
        },
        win: {
          icon: 'icons/icon.ico'
        },
        linux: {
          icon: 'icons/icon.png'
        }
      }
    }
  }
})
```

#### 构建命令

```bash
# 开发模式
quasar dev -m electron

# 构建生产版本
quasar build -m electron

# 构建特定平台
quasar build -m electron -T win32
quasar build -m electron -T darwin
quasar build -m electron -T linux
```

这个桌面端架构设计提供了一个完整的参考框架，适用于构建复杂的桌面应用程序。通过合理的布局设计、状态管理和组件架构，可以创建出用户体验良好且性能优秀的桌面应用。