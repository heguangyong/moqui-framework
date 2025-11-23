<template>
  <q-dialog v-model="dialogVisible" position="bottom">
    <q-card class="contact-card full-width" style="max-width: 450px; margin: 0 auto;">
      <!-- 卡片头部 -->
      <q-card-section class="q-pb-sm">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">联系对方</div>
            <div class="text-subtitle2 text-grey-6">选择您的联系方式</div>
          </div>
          <div class="col-auto">
            <q-btn @click="closeDialog" icon="close" flat round dense/>
          </div>
        </div>
      </q-card-section>

      <!-- 消息信息预览 -->
      <q-card-section v-if="message" class="q-py-sm">
        <div class="message-preview">
          <div class="row items-center q-mb-sm">
            <q-chip
              :color="message.type === 'supply' ? 'positive' : 'info'"
              text-color="white"
              size="sm"
              class="q-mr-sm">
              {{ message.type === 'supply' ? '供应' : '需求' }}
            </q-chip>
            <span class="text-body2 text-grey-8">{{ message.title }}</span>
          </div>
          <div class="text-caption text-grey-6">
            发布者: {{ message.publisherInfo?.nickname || '匿名用户' }}
          </div>
        </div>
      </q-card-section>

      <q-separator/>

      <!-- 联系方式选项 -->
      <q-card-section>
        <div class="contact-options">
          <!-- 电话联系 -->
          <div v-if="message?.contactInfo?.phone" class="contact-option">
            <q-item clickable @click="callPhone(message.contactInfo.phone)" class="contact-item">
              <q-item-section avatar>
                <q-avatar color="positive" text-color="white" size="48px">
                  <q-icon name="phone" size="24px"/>
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body1">电话联系</q-item-label>
                <q-item-label caption>{{ message.contactInfo.phone }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-4"/>
              </q-item-section>
            </q-item>
          </div>

          <!-- 微信联系 -->
          <div v-if="message?.contactInfo?.wechat" class="contact-option">
            <q-item clickable @click="copyWechat(message.contactInfo.wechat)" class="contact-item">
              <q-item-section avatar>
                <q-avatar color="green-6" text-color="white" size="48px">
                  <q-icon name="chat" size="24px"/>
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body1">微信联系</q-item-label>
                <q-item-label caption>{{ message.contactInfo.wechat }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="content_copy" color="grey-4"/>
              </q-item-section>
            </q-item>
          </div>

          <!-- 邮件联系 -->
          <div v-if="message?.contactInfo?.email" class="contact-option">
            <q-item clickable @click="sendEmail(message.contactInfo.email)" class="contact-item">
              <q-item-section avatar>
                <q-avatar color="blue-6" text-color="white" size="48px">
                  <q-icon name="email" size="24px"/>
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body1">邮件联系</q-item-label>
                <q-item-label caption>{{ message.contactInfo.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-4"/>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>

      <!-- 留言功能 -->
      <q-card-section>
        <q-separator class="q-mb-md"/>

        <div class="leave-message-section">
          <div class="text-subtitle2 q-mb-sm">给对方留言</div>
          <q-input
            v-model="messageContent"
            type="textarea"
            placeholder="输入您要发送的消息..."
            outlined
            rows="3"
            maxlength="200"
            counter
            class="q-mb-md">
          </q-input>

          <q-btn
            @click="sendMessage"
            color="primary"
            label="发送留言"
            icon="send"
            :loading="sending"
            :disable="!messageContent.trim()"
            class="full-width"/>
        </div>
      </q-card-section>

      <!-- 友情提示 -->
      <q-card-section class="q-pt-none">
        <q-banner class="bg-amber-1 text-amber-9" rounded>
          <template v-slot:avatar>
            <q-icon name="info" color="amber"/>
          </template>
          请注意保护个人隐私，谨慎提供个人信息
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { copyToClipboard as qCopyToClipboard } from 'quasar'

interface Message {
  id: string
  type: 'supply' | 'demand'
  title: string
  description: string
  contactInfo: any
  publisherInfo: any
}

const props = defineProps<{
  modelValue: boolean
  message: Message | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const $q = useQuasar()

// 状态管理
const messageContent = ref('')
const sending = ref(false)

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  messageContent.value = ''
}

// 拨打电话
const callPhone = (phone: string) => {
  window.open(`tel:${phone}`)
  $q.notify({
    type: 'positive',
    message: '正在拨打电话...',
    position: 'center',
    timeout: 2000
  })
  closeDialog()
}

// 复制微信号
const copyWechat = (wechat: string) => {
  qCopyToClipboard(wechat)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: '微信号已复制到剪贴板',
        position: 'center',
        timeout: 2000
      })
      closeDialog()
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: '复制失败',
        position: 'center'
      })
    })
}

// 发送邮件
const sendEmail = (email: string) => {
  const subject = encodeURIComponent(`关于您发布的${props.message?.type === 'supply' ? '供应' : '需求'}消息`)
  const body = encodeURIComponent(`您好！我对您发布的"${props.message?.title}"感兴趣，希望能够联系洽谈。`)
  window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  closeDialog()
}

// 发送留言
const sendMessage = async () => {
  if (!messageContent.value.trim()) {
    return
  }

  sending.value = true
  try {
    // 这里应该调用API发送留言
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用

    $q.notify({
      type: 'positive',
      message: '留言发送成功',
      position: 'center',
      timeout: 2000
    })

    messageContent.value = ''
    closeDialog()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '留言发送失败，请稍后重试',
      position: 'center'
    })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
.contact-card {
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  overflow-y: auto;
}

.message-preview {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #e3f2fd;
}

.contact-options {
  .contact-option {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .contact-item {
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f5f5;
      border-color: #d0d0d0;
    }
  }
}

.leave-message-section {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed #90caf9;
}

@media (max-width: 600px) {
  .contact-card {
    margin: 0;
    border-radius: 16px 16px 0 0;
  }

  .contact-item {
    padding: 12px;
  }
}
</style>