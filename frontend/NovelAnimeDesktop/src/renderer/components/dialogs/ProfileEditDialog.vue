<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="profile-edit-dialog">
          <!-- Header -->
          <div class="dialog-header">
            <h2 class="dialog-title">编辑个人资料</h2>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- Content -->
          <div class="dialog-content">
            <!-- Avatar Section - 点击上传 -->
            <div class="avatar-section">
              <div 
                class="avatar-upload-area" 
                @click="triggerFileInput"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop"
                :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
              >
                <div class="avatar-preview">
                  <img v-if="previewUrl" :src="previewUrl" alt="avatar" class="avatar-img" />
                  <span v-else class="avatar-initials">{{ userStore.initials }}</span>
                </div>
                <div class="upload-overlay">
                  <span v-if="isUploading" class="upload-text">上传中...</span>
                  <span v-else class="upload-text">点击或拖拽上传</span>
                </div>
              </div>
              <input 
                ref="fileInput"
                type="file" 
                accept="image/png,image/jpeg,image/gif,image/webp"
                @change="onFileSelected"
                class="file-input-hidden"
              />
              <div class="avatar-hint">支持 PNG、JPG、GIF、WebP，最大 2MB</div>
              <button 
                v-if="previewUrl && previewUrl !== userStore.avatarUrl" 
                class="avatar-reset-btn" 
                @click="resetAvatar"
              >
                重置
              </button>
            </div>

            <!-- Form Fields -->
            <div class="form-section">
              <div class="form-group">
                <label class="form-label">显示名称</label>
                <input 
                  type="text" 
                  v-model="fullName" 
                  placeholder="输入您的显示名称"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">用户名</label>
                <input 
                  type="text" 
                  :value="userStore.username" 
                  disabled
                  class="form-input form-input--disabled"
                />
                <span class="form-hint">用户名不可修改</span>
              </div>

              <div class="form-group">
                <label class="form-label">邮箱</label>
                <input 
                  type="email" 
                  :value="userStore.email" 
                  disabled
                  class="form-input form-input--disabled"
                />
                <span class="form-hint">邮箱不可修改</span>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </div>

          <!-- Footer -->
          <div class="dialog-footer">
            <button class="btn btn--secondary" @click="close" :disabled="isLoading || isUploading">
              取消
            </button>
            <button class="btn btn--primary" @click="save" :disabled="isLoading || isUploading || !hasChanges">
              {{ isLoading ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Profile Edit Dialog
 * Allows users to edit their display name and upload avatar
 * Requirements: 8.1, 8.2, 8.3
 */
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../../stores/user'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  saved: []
}>()

const userStore = useUserStore()

// Form state
const fullName = ref('')
const previewUrl = ref<string | null>(null)
const pendingFile = ref<File | null>(null)
const isLoading = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Check if there are changes
const hasChanges = computed(() => {
  const nameChanged = fullName.value !== (userStore.fullName || '')
  const avatarChanged = pendingFile.value !== null
  return nameChanged || avatarChanged
})

// Reset form when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    fullName.value = userStore.fullName || ''
    previewUrl.value = userStore.avatarUrl || null
    pendingFile.value = null
    error.value = ''
    isDragOver.value = false
  }
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    handleFile(input.files[0])
  }
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFile(event.dataTransfer.files[0])
  }
}

function handleFile(file: File) {
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = '请选择 PNG、JPG、GIF 或 WebP 格式的图片'
    return
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    error.value = '图片大小不能超过 2MB'
    return
  }

  error.value = ''
  pendingFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function resetAvatar() {
  previewUrl.value = userStore.avatarUrl || null
  pendingFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function save() {
  if (!hasChanges.value) return
  
  isLoading.value = true
  error.value = ''

  try {
    // Upload avatar first if there's a pending file
    let newAvatarUrl: string | undefined
    if (pendingFile.value) {
      isUploading.value = true
      const uploadResult = await userStore.uploadAvatar(pendingFile.value)
      isUploading.value = false
      
      if (!uploadResult.success) {
        error.value = uploadResult.error || '头像上传失败'
        isLoading.value = false
        return
      }
      newAvatarUrl = uploadResult.avatarUrl
    }

    // Update profile if name changed
    const nameChanged = fullName.value !== userStore.fullName
    if (nameChanged) {
      const updateData: { fullName?: string } = {}
      if (nameChanged) {
        updateData.fullName = fullName.value
      }

      const result = await userStore.updateProfile(updateData)
      
      if (!result.success) {
        error.value = result.error || '保存失败，请重试'
        isLoading.value = false
        return
      }
    }

    emit('saved')
    close()
  } catch (e: any) {
    error.value = e.message || '保存失败，请重试'
  } finally {
    isLoading.value = false
    isUploading.value = false
  }
}
</script>

<style scoped lang="scss">
/* Profile Edit Dialog - 灰色调风格 */
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

.profile-edit-dialog {
  width: 420px;
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

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  .avatar-upload-area {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    &:hover .upload-overlay,
    &.drag-over .upload-overlay {
      opacity: 1;
    }

    &.drag-over {
      transform: scale(1.05);
    }

    &.uploading {
      pointer-events: none;
      opacity: 0.7;
    }
  }

  .avatar-preview {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #8a8a8a, #a0b0aa);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-size: 36px;
      font-weight: 600;
      color: #ffffff;
    }
  }

  .upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;

    .upload-text {
      color: #fff;
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      padding: 0 8px;
    }
  }

  .file-input-hidden {
    display: none;
  }

  .avatar-hint {
    font-size: 11px;
    color: #7a7a7c;
    text-align: center;
  }

  .avatar-reset-btn {
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.06);
    border: none;
    border-radius: 6px;
    font-size: 12px;
    color: #5a5a5c;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
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

  .form-input {
    padding: 12px 14px;
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

    &--disabled {
      background: rgba(0, 0, 0, 0.04);
      color: #8a8a8c;
      cursor: not-allowed;
    }
  }

  .form-hint {
    font-size: 11px;
    color: #8a8a8c;
  }
}

.error-message {
  margin-top: 16px;
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

  .profile-edit-dialog {
    transform: scale(0.95) translateY(16px);
  }
}
</style>
