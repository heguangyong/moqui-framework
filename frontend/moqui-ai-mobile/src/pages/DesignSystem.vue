<template>
  <q-page class="design-system-page">
    <div class="mobile-container">
      <div class="design-system-header">
        <h1>🎨 Moqui AI Mobile 设计系统</h1>
        <p class="design-system-subtitle">
          基于 Vue 3 + Quasar 2 的移动端设计系统组件库展示
        </p>
      </div>

      <!-- 颜色系统 -->
      <section class="design-section">
        <h2>🌈 颜色系统</h2>
        <div class="color-palette">
          <div class="color-group">
            <h3>主要颜色</h3>
            <div class="color-swatches">
              <div class="color-swatch primary">
                <div class="color-preview"></div>
                <span class="color-name">Primary</span>
                <span class="color-code">#667eea</span>
              </div>
              <div class="color-swatch secondary">
                <div class="color-preview"></div>
                <span class="color-name">Secondary</span>
                <span class="color-code">#764ba2</span>
              </div>
            </div>
          </div>

          <div class="color-group">
            <h3>功能颜色</h3>
            <div class="color-swatches">
              <div class="color-swatch success">
                <div class="color-preview"></div>
                <span class="color-name">Success</span>
                <span class="color-code">#27ae60</span>
              </div>
              <div class="color-swatch warning">
                <div class="color-preview"></div>
                <span class="color-name">Warning</span>
                <span class="color-code">#f39c12</span>
              </div>
              <div class="color-swatch danger">
                <div class="color-preview"></div>
                <span class="color-name">Danger</span>
                <span class="color-code">#e74c3c</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 按钮组件 -->
      <section class="design-section">
        <h2>🔘 按钮组件</h2>

        <div class="component-showcase">
          <h3>按钮类型</h3>
          <div class="button-grid">
            <MobileButton label="主要按钮" type="primary" />
            <MobileButton label="次要按钮" type="secondary" />
            <MobileButton label="成功按钮" type="success" />
            <MobileButton label="警告按钮" type="warning" />
            <MobileButton label="危险按钮" type="danger" />
          </div>
        </div>

        <div class="component-showcase">
          <h3>按钮变体</h3>
          <div class="button-grid">
            <MobileButton label="实心按钮" variant="filled" />
            <MobileButton label="描边按钮" variant="outlined" />
            <MobileButton label="文字按钮" variant="text" />
          </div>
        </div>

        <div class="component-showcase">
          <h3>按钮尺寸</h3>
          <div class="button-grid">
            <MobileButton label="小按钮" size="sm" />
            <MobileButton label="中按钮" size="md" />
            <MobileButton label="大按钮" size="lg" />
          </div>
        </div>

        <div class="component-showcase">
          <h3>特殊状态</h3>
          <div class="button-grid">
            <MobileButton label="加载中" :loading="true" />
            <MobileButton label="禁用状态" disabled />
            <MobileButton icon="heart" icon-only />
            <MobileButton label="圆角按钮" rounded />
            <MobileButton label="块级按钮" block />
          </div>
        </div>
      </section>

      <!-- 输入框组件 -->
      <section class="design-section">
        <h2>📝 输入框组件</h2>

        <div class="component-showcase">
          <h3>输入框变体</h3>
          <div class="input-grid">
            <MobileInput
              v-model="inputValues.filled"
              label="实心输入框"
              placeholder="请输入内容"
              variant="filled"
            />
            <MobileInput
              v-model="inputValues.outlined"
              label="描边输入框"
              placeholder="请输入内容"
              variant="outlined"
            />
            <MobileInput
              v-model="inputValues.borderless"
              label="无边框输入框"
              placeholder="请输入内容"
              variant="borderless"
            />
          </div>
        </div>

        <div class="component-showcase">
          <h3>输入框类型</h3>
          <div class="input-grid">
            <MobileInput
              v-model="inputValues.email"
              label="邮箱"
              type="email"
              placeholder="请输入邮箱"
              prefix-icon="email"
            />
            <MobileInput
              v-model="inputValues.password"
              label="密码"
              type="password"
              placeholder="请输入密码"
              :show-password-toggle="true"
            />
            <MobileInput
              v-model="inputValues.search"
              label="搜索"
              type="search"
              placeholder="搜索内容"
              prefix-icon="search"
            />
          </div>
        </div>

        <div class="component-showcase">
          <h3>输入框状态</h3>
          <div class="input-grid">
            <MobileInput
              v-model="inputValues.error"
              label="错误状态"
              placeholder="请输入内容"
              error="输入内容不符合要求"
            />
            <MobileInput
              v-model="inputValues.hint"
              label="提示信息"
              placeholder="请输入内容"
              hint="这是一个提示信息"
            />
            <MobileInput
              v-model="inputValues.disabled"
              label="禁用状态"
              placeholder="禁用的输入框"
              disabled
            />
            <MobileInput
              v-model="inputValues.loading"
              label="加载状态"
              placeholder="加载中"
              :loading="true"
            />
          </div>
        </div>
      </section>

      <!-- 卡片组件 -->
      <section class="design-section">
        <h2>🃏 卡片组件</h2>

        <div class="component-showcase">
          <h3>卡片变体</h3>
          <div class="card-grid">
            <MobileCard
              title="悬浮卡片"
              subtitle="这是一个悬浮样式的卡片"
              content="卡片内容区域，支持自定义内容和插槽。"
              variant="elevated"
            />
            <MobileCard
              title="描边卡片"
              subtitle="这是一个描边样式的卡片"
              content="适合用于信息展示和内容分组。"
              variant="outlined"
            />
            <MobileCard
              title="填充卡片"
              subtitle="这是一个渐变背景的卡片"
              content="适合用于重要信息的突出显示。"
              variant="filled"
            />
          </div>
        </div>

        <div class="component-showcase">
          <h3>交互式卡片</h3>
          <div class="card-grid">
            <MobileCard
              title="可点击卡片"
              content="点击卡片可以触发事件"
              :clickable="true"
              :primary-action="{ label: '主要操作', handler: () => handleCardAction('primary') }"
              :secondary-action="{ label: '次要操作', handler: () => handleCardAction('secondary') }"
              :show-actions="true"
              @click="handleCardClick"
            />
            <MobileCard
              title="加载状态卡片"
              content="展示加载状态的卡片"
              :loading="true"
            />
          </div>
        </div>
      </section>

      <!-- 响应式测试 -->
      <section class="design-section">
        <h2>📱 响应式测试</h2>
        <div class="responsive-test">
          <div class="test-description">
            <p>当前视口尺寸: <span class="viewport-size">{{ viewportSize.width }}x{{ viewportSize.height }}</span></p>
            <p>设备类型: <span class="device-type">{{ deviceType }}</span></p>
            <p>触摸支持: <span class="touch-support">{{ touchSupport ? '是' : '否' }}</span></p>
          </div>

          <div class="responsive-demo">
            <MobileButton label="响应式按钮" size="md" block />
            <MobileCard
              title="响应式卡片"
              content="这个卡片会根据设备尺寸自动调整布局和间距"
            />
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MobileButton, MobileCard, MobileInput } from '@/components/base'

// 响应式数据
const inputValues = ref({
  filled: '',
  outlined: '',
  borderless: '',
  email: '',
  password: '',
  search: '',
  error: '',
  hint: '',
  disabled: '禁用内容',
  loading: ''
})

const viewportSize = ref({
  width: 0,
  height: 0
})

// 计算属性
const deviceType = computed(() => {
  const width = viewportSize.value.width
  if (width < 480) return '手机'
  if (width < 768) return '大屏手机'
  if (width < 1024) return '平板'
  return '桌面'
})

const touchSupport = computed(() => {
  return 'ontouchstart' in window
})

// 方法
const handleCardClick = () => {
  console.log('卡片被点击')
}

const handleCardAction = (type: string) => {
  console.log(`${type} 操作被触发`)
}

const updateViewportSize = () => {
  viewportSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

// 生命周期
onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportSize)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.design-system-page {
  padding: 0;
}

.design-system-header {
  background: $primary-gradient;
  color: $white;
  padding: $spacing-xl $spacing-md;
  text-align: center;
  margin-bottom: $spacing-xl;

  h1 {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
  }

  .design-system-subtitle {
    margin: 0;
    font-size: $font-size-lg;
    opacity: 0.9;
  }
}

.design-section {
  margin-bottom: $spacing-3xl;

  h2 {
    font-size: $font-size-2xl;
    color: $gray-800;
    margin-bottom: $spacing-lg;
    border-bottom: 2px solid $primary-color;
    padding-bottom: $spacing-sm;
  }

  h3 {
    font-size: $font-size-lg;
    color: $gray-700;
    margin-bottom: $spacing-md;
    font-weight: $font-weight-semibold;
  }
}

// 颜色系统
.color-palette {
  display: grid;
  gap: $spacing-xl;

  @include mobile-only {
    gap: $spacing-lg;
  }
}

.color-group {
  h3 {
    margin-bottom: $spacing-sm;
  }
}

.color-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-md;

  @include mobile-only {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: $spacing-sm;
  }
}

.color-swatch {
  text-align: center;

  .color-preview {
    width: 100%;
    height: 60px;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-xs;
    border: 1px solid $gray-200;

    @include mobile-only {
      height: 50px;
    }
  }

  .color-name {
    display: block;
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;
    color: $gray-800;
    margin-bottom: 2px;
  }

  .color-code {
    display: block;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $gray-600;
  }

  &.primary .color-preview { background: $primary-color; }
  &.secondary .color-preview { background: $secondary-color; }
  &.success .color-preview { background: $success-color; }
  &.warning .color-preview { background: $warning-color; }
  &.danger .color-preview { background: $danger-color; }
}

// 组件展示
.component-showcase {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid $gray-200;

  @include mobile-only {
    padding: $spacing-md;
    margin-bottom: $spacing-lg;
  }
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-md;
  align-items: center;

  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;

  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;

  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

// 响应式测试
.responsive-test {
  .test-description {
    background: $gray-50;
    padding: $spacing-md;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-lg;

    p {
      margin: $spacing-xs 0;
      font-size: $font-size-sm;
    }

    .viewport-size,
    .device-type,
    .touch-support {
      font-weight: $font-weight-semibold;
      color: $primary-color;
    }
  }

  .responsive-demo {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .design-section h2,
  .design-section h3 {
    color: $gray-100;
  }

  .component-showcase {
    background: $gray-800;
    border-color: $gray-600;
  }

  .color-swatch .color-name {
    color: $gray-200;
  }

  .color-swatch .color-code {
    color: $gray-400;
  }

  .responsive-test .test-description {
    background: $gray-700;
  }
}
</style>