<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>
        <div class="dialog-body">
          <p v-if="message" class="dialog-message">{{ message }}</p>
          <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            class="dialog-input"
            :placeholder="placeholder"
            @keyup.enter="handleConfirm"
            @keyup.escape="handleCancel"
          />
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCancel">取消</button>
          <button class="btn btn-primary" @click="handleConfirm" :disabled="!inputValue.trim()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '输入' },
  message: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  defaultValue: { type: String, default: '' },
  confirmText: { type: String, default: '确定' }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const inputRef = ref(null);
const inputValue = ref('');

watch(() => props.visible, (newVal) => {
  if (newVal) {
    inputValue.value = props.defaultValue;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
});

function handleConfirm() {
  if (inputValue.value.trim()) {
    emit('confirm', inputValue.value.trim());
    emit('update:visible', false);
  }
}

function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog-container {
  background: #2c2c2e;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dialog-body {
  padding: 20px;
}

.dialog-message {
  margin: 0 0 12px 0;
  color: #aaa;
  font-size: 14px;
}

.dialog-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.dialog-input:focus {
  border-color: #4a9eff;
}

.dialog-input::placeholder {
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  background: #4a9eff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #3a8eef;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
