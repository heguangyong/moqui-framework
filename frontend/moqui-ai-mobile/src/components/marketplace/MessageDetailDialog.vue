<template>
  <q-dialog v-model="dialogVisible" position="bottom">
    <q-card class="message-detail-card full-width" style="max-width: 500px; margin: 0 auto;">
      <!-- 卡片头部 -->
      <q-card-section class="q-pb-sm">
        <div class="row items-center">
          <div class="col">
            <q-chip
              :color="message?.type === 'supply' ? 'positive' : 'info'"
              text-color="white"
              :icon="message?.type === 'supply' ? 'trending_up' : 'trending_down'"
              size="md">
              {{ message?.type === 'supply' ? '供应信息' : '需求信息' }}
            </q-chip>
          </div>
          <div class="col-auto">
            <q-btn @click="closeDialog" icon="close" flat round dense/>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- 消息标题 -->
        <div class="text-h6 q-mb-md text-weight-medium">
          {{ message?.title }}
        </div>

        <!-- 基本信息 -->
        <div class="info-section q-mb-lg">
          <div v-if="message?.category" class="info-item q-mb-sm">
            <q-icon name="category" color="primary" size="18px" class="q-mr-sm"/>
            <span class="text-body2">{{ message.category }}</span>
          </div>

          <div v-if="message?.location" class="info-item q-mb-sm">
            <q-icon name="location_on" color="primary" size="18px" class="q-mr-sm"/>
            <span class="text-body2">{{ message.location }}</span>
          </div>

          <div class="info-item q-mb-sm">
            <q-icon name="schedule" color="primary" size="18px" class="q-mr-sm"/>
            <span class="text-body2">发布时间: {{ formatFullTime(message?.publishTime) }}</span>
          </div>

          <div class="info-item">
            <q-icon name="person" color="primary" size="18px" class="q-mr-sm"/>
            <span class="text-body2">发布者: {{ message?.publisherInfo?.nickname || '匿名用户' }}</span>
          </div>
        </div>

        <!-- 详细描述 -->
        <div class="description-section q-mb-lg">
          <div class="text-subtitle2 q-mb-sm text-weight-medium">详细描述</div>
          <div class="text-body1 line-height-relaxed">
            {{ message?.description }}
          </div>
        </div>

        <!-- 标签 -->
        <div v-if="message?.tags && message.tags.length" class="tags-section q-mb-lg">
          <div class="text-subtitle2 q-mb-sm text-weight-medium">相关标签</div>
          <div class="tags-container">
            <q-chip
              v-for="tag in message.tags"
              :key="tag"
              size="md"
              color="grey-2"
              text-color="grey-8"
              icon="local_offer"
              class="q-mr-sm q-mb-sm">
              {{ tag }}
            </q-chip>
          </div>
        </div>

        <!-- 联系方式 -->
        <div v-if="message?.contactInfo" class="contact-section">
          <div class="text-subtitle2 q-mb-sm text-weight-medium">联系方式</div>
          <div class="contact-methods">
            <div v-if="message.contactInfo.phone" class="contact-item q-mb-sm">
              <q-icon name="phone" color="positive" size="20px" class="q-mr-sm"/>
              <span class="text-body1">{{ message.contactInfo.phone }}</span>
              <q-btn
                @click="callPhone(message.contactInfo.phone)"
                size="sm"
                color="positive"
                icon="call"
                flat
                dense
                class="q-ml-sm">
                <q-tooltip>拨打电话</q-tooltip>
              </q-btn>
            </div>

            <div v-if="message.contactInfo.wechat" class="contact-item q-mb-sm">
              <q-icon name="chat" color="green-6" size="20px" class="q-mr-sm"/>
              <span class="text-body1">{{ message.contactInfo.wechat }}</span>
              <q-btn
                @click="copyToClipboard(message.contactInfo.wechat)"
                size="sm"
                color="green-6"
                icon="content_copy"
                flat
                dense
                class="q-ml-sm">
                <q-tooltip>复制微信号</q-tooltip>
              </q-btn>
            </div>

            <div v-if="message.contactInfo.email" class="contact-item">
              <q-icon name="email" color="blue-6" size="20px" class="q-mr-sm"/>
              <span class="text-body1">{{ message.contactInfo.email }}</span>
              <q-btn
                @click="sendEmail(message.contactInfo.email)"
                size="sm"
                color="blue-6"
                icon="send"
                flat
                dense
                class="q-ml-sm">
                <q-tooltip>发送邮件</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- 操作按钮 -->
      <q-card-actions class="q-pa-md">
        <q-btn
          @click="$emit('contact', message)"
          :color="message?.type === 'supply' ? 'positive' : 'info'"
          :label="message?.type === 'supply' ? '联系供应商' : '联系需求方'"
          icon="message"
          class="full-width"
          size="md"
          style="height: 48px;"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { copyToClipboard as qCopyToClipboard } from 'quasar'

interface Message {
  id: string
  type: 'supply' | 'demand'
  title: string
  description: string
  category?: string
  location?: string
  tags: string[]
  contactInfo: any
  publishTime: Date
  status: string
  publisherInfo: any
}

const props = defineProps<{
  modelValue: boolean
  message: Message | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'contact': [message: Message]
}>()

const $q = useQuasar()

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
}

// 格式化完整时间
const formatFullTime = (date: Date | undefined) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 拨打电话
const callPhone = (phone: string) => {
  window.open(`tel:${phone}`)
}

// 发送邮件
const sendEmail = (email: string) => {
  window.open(`mailto:${email}`)
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  qCopyToClipboard(text)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: '已复制到剪贴板',
        position: 'center',
        timeout: 2000
      })
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: '复制失败',
        position: 'center'
      })
    })
}
</script>

<style scoped lang="scss">
.message-detail-card {
  border-radius: 20px 20px 0 0;
  max-height: 85vh;
  overflow-y: auto;
}

.info-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.description-section {
  .line-height-relaxed {
    line-height: 1.6;
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
}

.contact-section {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .message-detail-card {
    margin: 0;
    border-radius: 16px 16px 0 0;
  }
}
</style>