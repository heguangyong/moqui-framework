<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="change-password-dialog">
          <!-- Header -->
          <div class="dialog-header">
            <h2 class="dialog-title">修改密码</h2>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- Content -->
          <div class="dialog-content">
            <!-- Success State -->
            <div v-if="success" class="success-state">
              <span class="success-icon">✓</span>
              <p class="success-message">密码修改成功！</p>
              <p class="success-hint">请使用新密码重新登录</p>
            </div>

            <!-- Form -->
            <div v-else class="form-section">
              <div class="form-group">
                <label class="form-label">当前密码</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showCurrentPassword ? 'text' : 'password'"
                    v-model="currentPassword" 
                    placeholder="输入当前密码"
                    class="form-input"
                    @keyup.enter="focusNewPassword"
                  />
                  <button 
                    type="button"
                    class="toggle-password-btn"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    {{ showCurrentPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">新密码</label>
                <div class="password-input-wrapper">
                  <input 
                    ref="newPasswordInput"
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="newPassword" 
                    placeholder="输入新密码（至少8位）"
                    class="form-input"
                    @keyup.enter="focusConfirmPassword"
                  />
                  <button 
                    type="button"
                    class="toggle-password-btn"
                    @click="showNewPassword = !showNewPassword"
                  >
                    {{ showNewPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
                <div class="password-strength" v-if="newPassword">
                  <div class="strength-bar">
                    <div 
                      class="strength-fill" 
                      :class="passwordStrengthClass"
                      :style="{ width: passwordStrengthPercent + '%' }"
                    ></div>
                  </div>
                  <span class="strength-text" :class="passwordStrengthClass">
                    {{ passwordStrengthText }}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">确认新密码</label>
                <div class="password-input-wrapper">
                  <input 
                    ref="confirmPasswordInput"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="confirmPassword" 
                    placeholder="再次输入新密码"
                    class="form-input"
                    :class="{ 'form-input--error': confirmPassword && !passwordsMatch }"
                    @keyup.enter="save"
                  />
                  <button 
                    type="button"
                    class="toggle-password-btn"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    {{ showConfirmPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
                <span v-if="confirmPassword && !passwordsMatch" class="form-error">
                  两次输入的密码不一致
                </span>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="error-message">
                {{ error }}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="dialog-footer">
            <button v-if="success" class="btn btn--primary" @click="close">
              完成
            </button>
            <template v-else>
              <button class="btn btn--secondary" @click="close" :disabled="isLoading">
                取消
              </button>
              <button 
                class="btn btn--primary" 
                @click="save" 
                :disabled="isLoading || !canSubmit"
              >
                {{ isLoading ? '修改中...' : '修改密码' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Change Password Dialog
 * Allows users to change their password securely
 * Requirements: 8.4
 */
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../../stores/user'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  changed: []
}>()

const userStore = useUserStore()

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const success = ref(false)

// Refs for focus management
const newPasswordInput = ref<HTMLInputElement | null>(null)
const confirmPasswordInput = ref<HTMLInputElement | null>(null)

// Computed
const passwordsMatch = computed(() => {
  return newPassword.value === confirmPassword.value
})

const passwordStrength = computed(() => {
  const pwd = newPassword.value
  if (!pwd) return 0
  
  let strength = 0
  if (pwd.length >= 8) strength += 25
  if (pwd.length >= 12) strength += 15
  if (/[a-z]/.test(pwd)) strength += 15
  if (/[A-Z]/.test(pwd)) strength += 15
  if (/[0-9]/.test(pwd)) strength += 15
  if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15
  
  return Math.min(100, strength)
})

const passwordStrengthPercent = computed(() => passwordStrength.value)

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'weak'
  if (strength < 70) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return '弱'
  if (strength < 70) return '中等'
  return '强'
})

const canSubmit = computed(() => {
  return currentPassword.value.length > 0 &&
         newPassword.value.length >= 8 &&
         passwordsMatch.value
})

// Reset form when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
    error.value = ''
    success.value = false
  }
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function focusNewPassword() {
  newPasswordInput.value?.focus()
}

function focusConfirmPassword() {
  confirmPasswordInput.value?.focus()
}

async function save() {
  if (!canSubmit.value) return
  
  isLoading.value = true
  error.value = ''

  try {
    // Requirement 8.4: Call change password API
    const result = await userStore.changePassword(currentPassword.value, newPassword.value)
    
    if (result.success) {
      success.value = true
      emit('changed')
    } else {
      error.value = result.error || '修改失败，请重试'
    }
  } catch (e: any) {
    error.value = e.message || '修改失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
/* Change Password Dialog - 灰色调风格 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.change-password-dialog {
  width: 400px;
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  .dialog-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #2c2c2e;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.06);
    border: none;
    border-radius: 6px;
    font-size: 16px;
    color: #5a5a5c;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #2c2c2e;
    }
  }
}

.dialog-content {
  padding: 24px;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;

  .success-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(39, 174, 96, 0.15);
    border-radius: 50%;
    font-size: 28px;
    color: #27ae60;
    margin-bottom: 16px;
  }

  .success-message {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c2c2e;
  }

  .success-hint {
    margin: 8px 0 0;
    font-size: 13px;
    color: #6a6a6c;
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: #5a5a5c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-input {
    flex: 1;
    padding: 12px 44px 12px 14px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 14px;
    color: #2c2c2e;
    transition: all 0.2s;

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.7);
      border-color: rgba(0, 0, 0, 0.2);
    }

    &::placeholder {
      color: #8a8a8c;
    }

    &--error {
      border-color: #c0392b;
    }
  }

  .toggle-password-btn {
    position: absolute;
    right: 8px;
    padding: 6px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  .form-error {
    font-size: 11px;
    color: #c0392b;
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;

  .strength-bar {
    flex: 1;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: all 0.3s;

    &.weak { background: #c0392b; }
    &.medium { background: #f39c12; }
    &.strong { background: #27ae60; }
  }

  .strength-text {
    font-size: 11px;
    font-weight: 500;

    &.weak { color: #c0392b; }
    &.medium { color: #f39c12; }
    &.strong { color: #27ae60; }
  }
}

.error-message {
  margin-top: 8px;
  padding: 12px;
  background: rgba(192, 57, 43, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #c0392b;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.03);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--secondary {
    background: rgba(0, 0, 0, 0.08);
    color: #5a5a5c;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.12);
    }
  }

  &--primary {
    background: linear-gradient(180deg, #4a4a4a, #3a3a3a);
    color: #e8e8e8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

    &:hover:not(:disabled) {
      background: linear-gradient(180deg, #5a5a5a, #4a4a4a);
    }
  }
}

/* Dialog animation */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .change-password-dialog {
    transform: scale(0.95) translateY(16px);
  }
}
</style>
