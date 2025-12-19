<template>
  <div class="custom-select" :class="{ 'custom-select--open': isOpen }">
    <div class="custom-select__trigger" @click="toggleDropdown">
      <span class="custom-select__value">{{ displayValue }}</span>
      <component :is="icons.chevronDown" :size="16" class="custom-select__arrow" />
    </div>
    <div v-if="isOpen" class="custom-select__options">
      <div 
        v-for="option in options" 
        :key="option.value"
        class="custom-select__option"
        :class="{ 'custom-select__option--selected': modelValue === option.value }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    // 格式: [{ value: 'xxx', label: '显示文本' }]
  },
  placeholder: {
    type: String,
    default: '请选择'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

// 显示值
const displayValue = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue);
  return option ? option.label : props.placeholder;
});

// 切换下拉框
function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

// 选择选项
function selectOption(option) {
  emit('update:modelValue', option.value);
  emit('change', option.value);
  isOpen.value = false;
}

// 点击外部关闭
function handleClickOutside(event) {
  if (!event.target.closest('.custom-select')) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.custom-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.custom-select__trigger:hover {
  background: rgba(255, 255, 255, 0.6);
}

.custom-select--open .custom-select__trigger {
  border-color: rgba(138, 138, 138, 0.5);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(138, 138, 138, 0.1);
}

.custom-select__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select__arrow {
  color: #6c6c6e;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.custom-select--open .custom-select__arrow {
  transform: rotate(180deg);
}

.custom-select__options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(240, 240, 240, 0.98);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}

.custom-select__option {
  padding: 10px 12px;
  font-size: 13px;
  color: #2c2c2e;
  cursor: pointer;
  transition: background 0.15s;
}

.custom-select__option:hover {
  background: rgba(180, 180, 180, 0.3);
}

.custom-select__option--selected {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.5), rgba(200, 218, 212, 0.4));
  font-weight: 500;
}
</style>
