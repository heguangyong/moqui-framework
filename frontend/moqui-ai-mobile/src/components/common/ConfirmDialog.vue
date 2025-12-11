<template>
  <q-dialog
    :model-value="visible"
    persistent
    @update:model-value="handleVisibilityChange"
  >
    <q-card class="confirm-dialog" :class="`confirm-dialog--${type}`">
      <!-- Header -->
      <q-card-section class="confirm-dialog__header">
        <div class="confirm-dialog__icon">
          <q-icon :name="typeIcon" :color="typeColor" size="32px" />
        </div>
        <div class="confirm-dialog__title">{{ title }}</div>
      </q-card-section>

      <!-- Message -->
      <q-card-section class="confirm-dialog__body">
        <p class="confirm-dialog__message">{{ message }}</p>
        
        <!-- Order Details -->
        <div v-if="details && details.length > 0" class="confirm-dialog__details">
          <div
            v-for="(detail, index) in details"
            :key="index"
            class="confirm-dialog__detail-item"
          >
            <span class="confirm-dialog__detail-label">{{ detail.label }}</span>
            <span class="confirm-dialog__detail-value">{{ detail.value }}</span>
          </div>
        </div>
        
        <!-- Consequences Warning -->
        <div v-if="consequences && consequences.length > 0" class="confirm-dialog__consequences">
          <div class="confirm-dialog__consequences-title">
            <q-icon name="warning" color="orange" size="16px" />
            <span>注意事项</span>
          </div>
          <ul class="confirm-dialog__consequences-list">
            <li v-for="(item, index) in consequences" :key="index">
              {{ item }}
            </li>
          </ul>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="confirm-dialog__actions">
        <q-btn
          v-if="showCancel"
          flat
          :label="cancelText"
          color="grey"
          @click="handleCancel"
        />
        <q-btn
          :label="confirmText"
          :color="confirmButtonColor"
          :loading="loading"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  visible: boolean
  title: string
  message: string
  type?: 'info' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  details?: Array<{ label: string; value: string }>
  consequences?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: '确认',
  cancelText: '取消',
  showCancel: true,
  details: () => [],
  consequences: () => []
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

// State
const loading = ref(false)

// Computed
const typeIcon = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'warning'
    case 'danger':
      return 'error'
    default:
      return 'info'
  }
})

const typeColor = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'orange'
    case 'danger':
      return 'negative'
    default:
      return 'primary'
  }
})

const confirmButtonColor = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'orange'
    case 'danger':
      return 'negative'
    default:
      return 'primary'
  }
})

// Methods
const handleVisibilityChange = (value: boolean) => {
  emit('update:visible', value)
}

const handleConfirm = async () => {
  loading.value = true
  try {
    emit('confirm')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.confirm-dialog {
  min-width: 300px;
  max-width: 400px;
  border-radius: 12px;
  
  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 24px;
    padding-bottom: 8px;
  }
  
  &__icon {
    margin-bottom: 12px;
  }
  
  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $gray-800;
  }
  
  &__body {
    padding: 8px 24px 16px;
  }
  
  &__message {
    text-align: center;
    color: $gray-600;
    margin: 0 0 16px;
    line-height: 1.5;
  }
  
  &__details {
    background-color: $gray-50;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  &__detail-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    
    &:not(:last-child) {
      border-bottom: 1px solid $gray-200;
    }
  }
  
  &__detail-label {
    color: $gray-500;
    font-size: 14px;
  }
  
  &__detail-value {
    color: $gray-800;
    font-size: 14px;
    font-weight: 500;
  }
  
  &__consequences {
    background-color: rgba(255, 152, 0, 0.1);
    border-radius: 8px;
    padding: 12px;
    border-left: 3px solid #ff9800;
  }
  
  &__consequences-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #e65100;
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  &__consequences-list {
    margin: 0;
    padding-left: 20px;
    color: $gray-700;
    font-size: 13px;
    
    li {
      margin-bottom: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  &__actions {
    padding: 8px 16px 16px;
  }
  
  // Type variants
  &--danger {
    .confirm-dialog__header {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.05), rgba(244, 67, 54, 0.1));
    }
  }
  
  &--warning {
    .confirm-dialog__header {
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.1));
    }
  }
}
</style>
