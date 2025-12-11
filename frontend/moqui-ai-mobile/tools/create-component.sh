#!/bin/bash
# Moqui AI Mobile - Vue组件生成器
# 🚀 快速生成标准化Vue 3 + Quasar组件

echo "🎨 Moqui AI Mobile 组件生成器"
echo "================================"

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 使用方法: ./create-component.sh <ComponentName> [type] [path]"
    echo ""
    echo "示例："
    echo "  ./create-component.sh UserCard"
    echo "  ./create-component.sh ProductList business"
    echo "  ./create-component.sh VoiceButton ai components/ai"
    echo ""
    echo "类型选项："
    echo "  • base      - 基础组件 (默认)"
    echo "  • business  - 业务组件"
    echo "  • ai        - AI功能组件"
    echo "  • layout    - 布局组件"
    exit 1
fi

COMPONENT_NAME=$1
COMPONENT_TYPE=${2:-"base"}
CUSTOM_PATH=$3

# 设置输出路径
case $COMPONENT_TYPE in
    "base")
        COMPONENT_DIR="src/components/base"
        ;;
    "business")
        COMPONENT_DIR="src/components/business"
        ;;
    "ai")
        COMPONENT_DIR="src/components/ai"
        ;;
    "layout")
        COMPONENT_DIR="src/components/layout"
        ;;
    *)
        COMPONENT_DIR="src/components/$COMPONENT_TYPE"
        ;;
esac

# 使用自定义路径
if [ ! -z "$CUSTOM_PATH" ]; then
    COMPONENT_DIR="src/$CUSTOM_PATH"
fi

echo "📁 创建组件: $COMPONENT_NAME"
echo "🏷️  类型: $COMPONENT_TYPE"
echo "📂 路径: $COMPONENT_DIR"
echo ""

# 创建目录
mkdir -p "$COMPONENT_DIR"

# 组件名转换 (PascalCase -> kebab-case)
KEBAB_NAME=$(echo "$COMPONENT_NAME" | sed -r 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')

# 生成Vue组件文件
cat > "$COMPONENT_DIR/${COMPONENT_NAME}.vue" << EOF
<template>
  <div class="$KEBAB_NAME">
    <!-- $COMPONENT_NAME content -->
    <slot name="header">
      <div class="$KEBAB_NAME__header">
        <h3 class="text-h6">{{ title || '$COMPONENT_NAME' }}</h3>
      </div>
    </slot>

    <div class="$KEBAB_NAME__content">
      <slot>
        <!-- Default content -->
        <p class="text-body1">{{ content || '$COMPONENT_NAME component content' }}</p>
      </slot>
    </div>

    <slot name="footer">
      <div class="$KEBAB_NAME__footer" v-if="showFooter">
        <!-- Footer content -->
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// 🎯 组件属性定义
interface Props {
  title?: string
  content?: string
  showFooter?: boolean
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFooter: false,
  loading: false,
  disabled: false
})

// 🔔 事件定义
interface Emits {
  click: [event: MouseEvent]
  change: [value: any]
}

const emit = defineEmits<Emits>()

// 📊 响应式状态
const isActive = ref(false)
const internalValue = ref('')

// 💻 计算属性
const componentClasses = computed(() => ({
  '$KEBAB_NAME--active': isActive.value,
  '$KEBAB_NAME--loading': props.loading,
  '$KEBAB_NAME--disabled': props.disabled
}))

// 🎬 方法定义
const handleClick = (event: MouseEvent) => {
  if (props.disabled) return

  isActive.value = !isActive.value
  emit('click', event)
}

const handleChange = (value: any) => {
  internalValue.value = value
  emit('change', value)
}

// 🔄 暴露给父组件的方法和属性
defineExpose({
  isActive,
  handleClick,
  handleChange
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.$KEBAB_NAME {
  @include card-base;
  padding: \$spacing-md;

  // 🎨 组件状态
  &--active {
    border-color: \$primary-color;
    box-shadow: 0 0 0 2px rgba(\$primary-color, 0.1);
  }

  &--loading {
    opacity: 0.7;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid \$primary-color;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  // 📱 移动端优化
  @include mobile-only {
    padding: \$spacing-sm;

    &__header {
      margin-bottom: \$spacing-sm;
    }
  }

  // 🎯 子元素样式
  &__header {
    margin-bottom: \$spacing-md;
    padding-bottom: \$spacing-sm;
    border-bottom: 1px solid \$gray-200;

    h3 {
      margin: 0;
      color: \$gray-800;
      font-weight: \$font-weight-semibold;
    }
  }

  &__content {
    min-height: 60px;

    @include center-flex;
    flex-direction: column;
  }

  &__footer {
    margin-top: \$spacing-md;
    padding-top: \$spacing-sm;
    border-top: 1px solid \$gray-200;
    text-align: center;
  }
}

// 🎵 动画定义
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 🌓 暗色模式支持
@media (prefers-color-scheme: dark) {
  .$KEBAB_NAME {
    background: \$gray-800;
    border-color: \$gray-600;
    color: \$gray-100;

    &__header {
      border-bottom-color: \$gray-600;

      h3 {
        color: \$gray-100;
      }
    }

    &__footer {
      border-top-color: \$gray-600;
    }
  }
}
</style>
EOF

# 生成对应的类型声明文件
cat > "$COMPONENT_DIR/${COMPONENT_NAME}.types.ts" << EOF
// $COMPONENT_NAME 组件类型定义
// ==============================

export interface ${COMPONENT_NAME}Props {
  title?: string
  content?: string
  showFooter?: boolean
  loading?: boolean
  disabled?: boolean
}

export interface ${COMPONENT_NAME}Emits {
  click: (event: MouseEvent) => void
  change: (value: any) => void
}

export interface ${COMPONENT_NAME}Instance {
  isActive: Ref<boolean>
  handleClick: (event: MouseEvent) => void
  handleChange: (value: any) => void
}

// 组件状态枚举
export enum ${COMPONENT_NAME}State {
  IDLE = 'idle',
  LOADING = 'loading',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}
EOF

# 生成测试文件 (可选)
if [ "$COMPONENT_TYPE" = "business" ] || [ "$COMPONENT_TYPE" = "ai" ]; then
cat > "$COMPONENT_DIR/${COMPONENT_NAME}.test.ts" << EOF
// $COMPONENT_NAME 组件测试
// =======================

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import $COMPONENT_NAME from './$COMPONENT_NAME.vue'

describe('$COMPONENT_NAME', () => {
  it('渲染正确的内容', () => {
    const wrapper = mount($COMPONENT_NAME, {
      props: {
        title: '测试标题',
        content: '测试内容'
      }
    })

    expect(wrapper.find('.text-h6').text()).toBe('测试标题')
    expect(wrapper.find('.text-body1').text()).toBe('测试内容')
  })

  it('响应点击事件', async () => {
    const wrapper = mount($COMPONENT_NAME)

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('处理加载状态', () => {
    const wrapper = mount($COMPONENT_NAME, {
      props: { loading: true }
    })

    expect(wrapper.classes()).toContain('${KEBAB_NAME}--loading')
  })

  it('处理禁用状态', () => {
    const wrapper = mount($COMPONENT_NAME, {
      props: { disabled: true }
    })

    expect(wrapper.classes()).toContain('${KEBAB_NAME}--disabled')
  })
})
EOF
fi

# 创建README文档
cat > "$COMPONENT_DIR/${COMPONENT_NAME}.md" << EOF
# $COMPONENT_NAME

## 📋 组件描述

$COMPONENT_NAME 是一个基于 Vue 3 + Quasar 的${COMPONENT_TYPE}组件，提供了标准化的界面和交互功能。

## 🎯 使用方式

\`\`\`vue
<template>
  <$COMPONENT_NAME
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
  </$COMPONENT_NAME>
</template>

<script setup lang="ts">
import $COMPONENT_NAME from '@/components/$COMPONENT_TYPE/$COMPONENT_NAME.vue'

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
\`\`\`

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

组件使用 SCSS 变量，可通过修改 \`src/styles/variables.scss\` 来定制外观：

\`\`\`scss
// 修改主要颜色
\$primary-color: #your-color;

// 修改圆角大小
\$border-radius-lg: 20px;

// 修改间距
\$spacing-md: 20px;
\`\`\`

## 📱 移动端适配

组件已针对移动端进行优化：
- 响应式设计
- 触摸友好的交互
- 适配不同屏幕尺寸

## 🌓 暗色模式

组件支持系统暗色模式，会根据用户的系统设置自动切换。

## 🧪 测试

运行测试：
\`\`\`bash
npm run test:unit $COMPONENT_NAME.test.ts
\`\`\`

## 📝 更新日志

- v1.0.0: 初始版本，基础功能实现
EOF

echo "✅ 组件创建成功！"
echo ""
echo "📁 生成的文件:"
echo "   • $COMPONENT_DIR/${COMPONENT_NAME}.vue"
echo "   • $COMPONENT_DIR/${COMPONENT_NAME}.types.ts"
if [ "$COMPONENT_TYPE" = "business" ] || [ "$COMPONENT_TYPE" = "ai" ]; then
echo "   • $COMPONENT_DIR/${COMPONENT_NAME}.test.ts"
fi
echo "   • $COMPONENT_DIR/${COMPONENT_NAME}.md"
echo ""
echo "🚀 下一步:"
echo "   1. 根据需求定制组件功能"
echo "   2. 在页面中导入和使用组件"
echo "   3. 运行测试验证功能"
echo ""
echo "💡 快速导入:"
echo "   import $COMPONENT_NAME from '@/components/$COMPONENT_TYPE/$COMPONENT_NAME.vue'"
echo ""
echo "🎉 Happy coding!"