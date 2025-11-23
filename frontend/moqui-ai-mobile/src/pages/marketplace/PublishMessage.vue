<template>
  <q-page class="publish-message-page q-pa-md">
    <!-- 页面标题 -->
    <div class="page-header q-mb-lg">
      <div class="row items-center">
        <q-btn
          @click="$router.back()"
          icon="arrow_back"
          flat
          round
          class="q-mr-md"/>
        <div class="col">
          <div class="text-h5 text-weight-bold">发布消息</div>
          <div class="text-subtitle2 text-grey-6">发布您的供应或需求信息</div>
        </div>
      </div>
    </div>

    <!-- 发布表单 -->
    <q-form @submit="publishMessage" class="publish-form">
      <q-card class="form-card">
        <q-card-section>
          <!-- 消息类型选择 -->
          <div class="form-section q-mb-lg">
            <div class="section-title q-mb-md">消息类型</div>
            <q-option-group
              v-model="messageForm.type"
              :options="messageTypeOptions"
              color="primary"
              inline
              class="type-selection">
            </q-option-group>
          </div>

          <!-- 消息标题 -->
          <div class="form-section q-mb-lg">
            <div class="section-title q-mb-md">消息标题 *</div>
            <q-input
              v-model="messageForm.title"
              placeholder="请输入简洁明了的标题"
              outlined
              dense
              maxlength="50"
              counter
              :rules="[val => !!val || '请输入消息标题']">
              <template v-slot:prepend>
                <q-icon name="title"/>
              </template>
            </q-input>
          </div>

          <!-- 详细描述 -->
          <div class="form-section q-mb-lg">
            <div class="section-title q-mb-md">详细描述 *</div>
            <q-input
              v-model="messageForm.description"
              type="textarea"
              placeholder="请详细描述您的供应或需求信息..."
              outlined
              rows="4"
              maxlength="500"
              counter
              :rules="[val => !!val || '请输入详细描述']">
            </q-input>
            <div class="text-caption text-grey-6 q-mt-sm">
              💡 详细的描述有助于提高匹配精度
            </div>
          </div>

          <!-- 分类选择 -->
          <div class="form-section q-mb-lg">
            <div class="section-title q-mb-md">分类</div>
            <q-select
              v-model="messageForm.category"
              :options="categoryOptions"
              placeholder="请选择分类"
              outlined
              dense
              clearable
              emit-value
              map-options>
              <template v-slot:prepend>
                <q-icon name="category"/>
              </template>
            </q-select>
          </div>

          <!-- 地区选择 -->
          <div class="form-section q-mb-lg">
            <div class="section-title q-mb-md">所在地区</div>
            <q-input
              v-model="messageForm.location"
              placeholder="请输入所在地区"
              outlined
              dense
              clearable>
              <template v-slot:prepend>
                <q-icon name="location_on"/>
              </template>
              <template v-slot:append>
                <q-btn
                  @click="getCurrentLocation"
                  icon="my_location"
                  flat
                  round
                  dense
                  :loading="gettingLocation">
                  <q-tooltip>获取当前位置</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <!-- 联系方式 -->
          <div class="form-section">
            <div class="section-title q-mb-md">联系方式 *</div>

            <!-- 手机号码 -->
            <q-input
              v-model="messageForm.contactInfo.phone"
              placeholder="请输入手机号码"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || '请输入联系手机号']">
              <template v-slot:prepend>
                <q-icon name="phone"/>
              </template>
            </q-input>

            <!-- 微信号 -->
            <q-input
              v-model="messageForm.contactInfo.wechat"
              placeholder="微信号（可选）"
              outlined
              dense
              class="q-mb-md">
              <template v-slot:prepend>
                <q-icon name="chat"/>
              </template>
            </q-input>

            <!-- 邮箱 -->
            <q-input
              v-model="messageForm.contactInfo.email"
              placeholder="邮箱地址（可选）"
              outlined
              dense
              type="email">
              <template v-slot:prepend>
                <q-icon name="email"/>
              </template>
            </q-input>
          </div>
        </q-card-section>
      </q-card>

      <!-- 智能标签预览 -->
      <q-card v-if="extractedTags.length > 0" class="tags-preview-card q-mt-md">
        <q-card-section>
          <div class="section-title q-mb-md">
            <q-icon name="local_offer" class="q-mr-sm"/>
            AI提取的关键标签
          </div>
          <div class="tags-container">
            <q-chip
              v-for="tag in extractedTags"
              :key="tag"
              color="primary"
              text-color="white"
              icon="smart_toy"
              removable
              @remove="removeTag(tag)">
              {{ tag }}
            </q-chip>
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            这些标签将用于智能匹配，您可以删除不相关的标签
          </div>
        </q-card-section>
      </q-card>

      <!-- 发布按钮 -->
      <div class="publish-actions q-mt-lg">
        <q-btn
          type="submit"
          :color="messageForm.type === 'supply' ? 'positive' : 'info'"
          :label="messageForm.type === 'supply' ? '发布供应信息' : '发布需求信息'"
          :icon="messageForm.type === 'supply' ? 'trending_up' : 'trending_down'"
          size="lg"
          class="full-width"
          style="height: 56px;"
          :loading="publishing"
          :disable="!canPublish"/>

        <div class="text-center q-mt-md">
          <span class="text-caption text-grey-6">
            发布即表示同意平台使用条款
          </span>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { moquiApi } from '@/services/api/base'

const router = useRouter()
const $q = useQuasar()

// 表单数据
const messageForm = ref({
  type: 'supply' as 'supply' | 'demand',
  title: '',
  description: '',
  category: '',
  location: '',
  contactInfo: {
    phone: '',
    wechat: '',
    email: ''
  }
})

// 状态管理
const publishing = ref(false)
const gettingLocation = ref(false)
const extractedTags = ref<string[]>([])

// 选项数据
const messageTypeOptions = [
  {
    label: '供应信息',
    value: 'supply',
    icon: 'trending_up',
    color: 'positive'
  },
  {
    label: '需求信息',
    value: 'demand',
    icon: 'trending_down',
    color: 'info'
  }
]

const categoryOptions = [
  { label: '建筑材料', value: '建筑材料' },
  { label: '机械设备', value: '机械设备' },
  { label: '电子产品', value: '电子产品' },
  { label: '原材料', value: '原材料' },
  { label: '技术服务', value: '技术服务' },
  { label: '物流运输', value: '物流运输' },
  { label: '其他', value: '其他' }
]

// 计算属性
const canPublish = computed(() => {
  return messageForm.value.title.trim() &&
         messageForm.value.description.trim() &&
         messageForm.value.contactInfo.phone.trim()
})

// 监听描述变化，自动提取标签
watch(() => messageForm.value.description, async (newDescription) => {
  if (newDescription.length > 20) {
    await extractTags()
  }
}, { debounce: 1000 })

// 获取当前位置
const getCurrentLocation = async () => {
  gettingLocation.value = true
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // 这里可以调用逆地理编码API获取地址
          messageForm.value.location = '自动定位中...'
          $q.notify({
            type: 'positive',
            message: '位置获取成功',
            position: 'center'
          })
        },
        (error) => {
          $q.notify({
            type: 'negative',
            message: '位置获取失败，请手动输入',
            position: 'center'
          })
        }
      )
    }
  } finally {
    gettingLocation.value = false
  }
}

// 提取智能标签
const extractTags = async () => {
  if (!messageForm.value.description.trim()) return

  try {
    const response = await moquiApi.post('/rest/s1/marketplace/tag/extract', {
      text: messageForm.value.description
    })

    if (response.success && response.data.tags) {
      extractedTags.value = response.data.tags.slice(0, 5) // 最多显示5个标签
    }
  } catch (error) {
    console.error('标签提取失败:', error)
    // 静默失败，不影响用户体验
  }
}

// 删除标签
const removeTag = (tag: string) => {
  const index = extractedTags.value.indexOf(tag)
  if (index > -1) {
    extractedTags.value.splice(index, 1)
  }
}

// 发布消息
const publishMessage = async () => {
  publishing.value = true

  try {
    const publishData = {
      ...messageForm.value,
      tags: extractedTags.value,
      publishTime: new Date().toISOString(),
      status: 'active'
    }

    const response = await moquiApi.post('/rest/s1/marketplace/listing', publishData)

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: '消息发布成功！',
        position: 'center',
        timeout: 3000
      })

      // 返回消息广场
      router.push('/marketplace')
    } else {
      throw new Error(response.message || '发布失败')
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || '发布失败，请稍后重试',
      position: 'center'
    })
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
.publish-message-page {
  max-width: 600px;
  margin: 0 auto;
  background: #fafafa;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-section {
  .section-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
}

.type-selection {
  .q-radio {
    margin-right: 24px;
  }
}

.tags-preview-card {
  border-radius: 12px;
  border-left: 4px solid #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.publish-actions {
  margin-bottom: 40px;
}

@media (max-width: 600px) {
  .publish-message-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .type-selection {
    .q-radio {
      margin-right: 16px;
    }
  }
}
</style>