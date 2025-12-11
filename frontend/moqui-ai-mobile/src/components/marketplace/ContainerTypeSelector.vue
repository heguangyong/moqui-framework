<template>
  <div class="container-type-selector">
    <div class="container-options">
      <div
        v-for="containerType in containerTypes"
        :key="containerType.value"
        class="container-option"
        :class="{
          'container-option--selected': modelValue === containerType.value,
          'container-option--highlighted': containerType.popular
        }"
        @click="selectContainer(containerType.value)"
      >
        <div class="container-icon">
          <q-icon :name="containerType.icon" size="32px" />
        </div>
        <div class="container-info">
          <div class="container-name">{{ containerType.label }}</div>
          <div class="container-specs">
            <div class="spec-item">
              <span class="spec-label">尺寸:</span>
              <span class="spec-value">{{ containerType.dimensions }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">载重:</span>
              <span class="spec-value">{{ containerType.maxWeight }}吨</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">容积:</span>
              <span class="spec-value">{{ containerType.volume }}m³</span>
            </div>
          </div>
        </div>
        <div v-if="containerType.popular" class="popular-badge">
          <q-icon name="star" size="16px" />
          <span>常用</span>
        </div>
        <div class="selection-indicator">
          <q-icon
            :name="modelValue === containerType.value ? 'radio_button_checked' : 'radio_button_unchecked'"
            size="20px"
            :color="modelValue === containerType.value ? 'secondary' : 'grey-5'"
          />
        </div>
      </div>
    </div>

    <!-- 选中容器详细信息 -->
    <div v-if="selectedContainer" class="selected-info">
      <div class="info-header">
        <q-icon name="info" size="20px" color="secondary" />
        <span>{{ selectedContainer.label }} 详细规格</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">外部尺寸</span>
          <span class="info-value">{{ selectedContainer.externalDimensions }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">内部尺寸</span>
          <span class="info-value">{{ selectedContainer.internalDimensions }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">最大载重</span>
          <span class="info-value">{{ selectedContainer.maxWeight }}吨</span>
        </div>
        <div class="info-item">
          <span class="info-label">自重</span>
          <span class="info-value">{{ selectedContainer.tareWeight }}吨</span>
        </div>
        <div class="info-item">
          <span class="info-label">容积</span>
          <span class="info-value">{{ selectedContainer.volume }}立方米</span>
        </div>
        <div class="info-item">
          <span class="info-label">适用货物</span>
          <span class="info-value">{{ selectedContainer.suitableFor }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface ContainerType {
  value: string
  label: string
  icon: string
  dimensions: string
  externalDimensions: string
  internalDimensions: string
  maxWeight: number
  tareWeight: number
  volume: number
  suitableFor: string
  popular?: boolean
}

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 集装箱类型数据
const containerTypes = ref<ContainerType[]>([
  {
    value: '20GP',
    label: '20尺普通箱',
    icon: 'inventory',
    dimensions: '20′ × 8′ × 8′6″',
    externalDimensions: '6.058 × 2.438 × 2.591 米',
    internalDimensions: '5.898 × 2.352 × 2.385 米',
    maxWeight: 28.08,
    tareWeight: 2.23,
    volume: 33.1,
    suitableFor: '一般货物、纸箱、袋装货',
    popular: true
  },
  {
    value: '40GP',
    label: '40尺普通箱',
    icon: 'inventory_2',
    dimensions: '40′ × 8′ × 8′6″',
    externalDimensions: '12.192 × 2.438 × 2.591 米',
    internalDimensions: '12.032 × 2.352 × 2.385 米',
    maxWeight: 28.68,
    tareWeight: 3.74,
    volume: 67.5,
    suitableFor: '大宗货物、机械设备',
    popular: true
  },
  {
    value: '40HQ',
    label: '40尺高箱',
    icon: 'view_in_ar',
    dimensions: '40′ × 8′ × 9′6″',
    externalDimensions: '12.192 × 2.438 × 2.896 米',
    internalDimensions: '12.032 × 2.352 × 2.690 米',
    maxWeight: 28.68,
    tareWeight: 3.96,
    volume: 76.2,
    suitableFor: '轻抛货、大体积商品',
    popular: true
  },
  {
    value: '45HQ',
    label: '45尺高箱',
    icon: 'all_inbox',
    dimensions: '45′ × 8′ × 9′6″',
    externalDimensions: '13.716 × 2.438 × 2.896 米',
    internalDimensions: '13.556 × 2.352 × 2.690 米',
    maxWeight: 29.48,
    tareWeight: 4.81,
    volume: 85.8,
    suitableFor: '超长货物、大体积货品',
    popular: false
  },
  {
    value: '20RF',
    label: '20尺冷藏箱',
    icon: 'ac_unit',
    dimensions: '20′ × 8′ × 8′6″',
    externalDimensions: '6.058 × 2.438 × 2.591 米',
    internalDimensions: '5.480 × 2.290 × 2.270 米',
    maxWeight: 27.40,
    tareWeight: 3.20,
    volume: 28.5,
    suitableFor: '冷冻食品、药品、化工品',
    popular: false
  },
  {
    value: '40RF',
    label: '40尺冷藏箱',
    icon: 'kitchen',
    dimensions: '40′ × 8′ × 8′6″',
    externalDimensions: '12.192 × 2.438 × 2.591 米',
    internalDimensions: '11.580 × 2.290 × 2.270 米',
    maxWeight: 28.20,
    tareWeight: 4.48,
    volume: 60.2,
    suitableFor: '大批量冷藏货物',
    popular: false
  }
])

// 计算当前选中的容器信息
const selectedContainer = computed(() => {
  return containerTypes.value.find(container => container.value === props.modelValue)
})

// 选择容器类型
const selectContainer = (containerValue: string) => {
  emit('update:modelValue', containerValue)
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (!newValue && containerTypes.value.length > 0) {
    // 如果没有选择，默认选择第一个常用类型
    const defaultContainer = containerTypes.value.find(c => c.popular) || containerTypes.value[0]
    emit('update:modelValue', defaultContainer.value)
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.container-type-selector {
  .container-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .container-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &--selected {
      background: rgba(255, 79, 30, 0.1);
      border-color: $secondary-color;

      .container-icon {
        color: $secondary-color;
      }
    }

    &--highlighted {
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, rgba(255, 143, 0, 0.1) 100%);
        border-radius: 12px;
        pointer-events: none;
      }
    }
  }

  .container-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 32px;
  }

  .container-info {
    flex: 1;

    .container-name {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .container-specs {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .spec-item {
        display: flex;
        gap: 4px;
        font-size: 13px;

        .spec-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .spec-value {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
      }
    }
  }

  .popular-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: $warning-color;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }

  .selection-indicator {
    margin-left: auto;
  }

  .selected-info {
    margin-top: 20px;
    padding: 16px;
    background: #3A3A3C;
    border-radius: 12px;
    border-left: 4px solid $secondary-color;

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin-bottom: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:nth-child(2n) {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: white;
        }
      }
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .container-type-selector {
    .container-option {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .container-icon {
        width: 50px;
        height: 50px;
        font-size: 28px;
      }

      .container-specs {
        width: 100%;
        justify-content: space-between;
      }

      .popular-badge {
        position: absolute;
        top: 8px;
        right: 8px;
      }

      .selection-indicator {
        position: absolute;
        bottom: 12px;
        right: 12px;
        margin-left: 0;
      }
    }

    .selected-info {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>