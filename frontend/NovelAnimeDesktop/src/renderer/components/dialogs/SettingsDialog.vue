<template>
  <q-dialog v-model="isVisible" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">设置</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="general" label="常规" />
          <q-tab name="ai" label="AI设置" />
          <q-tab name="video" label="视频设置" />
          <q-tab name="advanced" label="高级" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- General Settings -->
          <q-tab-panel name="general">
            <div class="text-h6 q-mb-md">常规设置</div>
            
            <q-item>
              <q-item-section>
                <q-item-label>语言</q-item-label>
                <q-item-label caption>选择界面语言</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.language"
                  :options="languageOptions"
                  emit-value
                  map-options
                  style="min-width: 120px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>主题</q-item-label>
                <q-item-label caption>选择界面主题</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.theme"
                  :options="themeOptions"
                  emit-value
                  map-options
                  style="min-width: 120px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>自动保存</q-item-label>
                <q-item-label caption>自动保存项目更改</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="settings.autoSave" />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>保存间隔</q-item-label>
                <q-item-label caption>自动保存间隔（秒）</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model.number="settings.saveInterval"
                  type="number"
                  min="10"
                  max="300"
                  style="width: 80px"
                />
              </q-item-section>
            </q-item>
          </q-tab-panel>

          <!-- AI Settings -->
          <q-tab-panel name="ai">
            <div class="text-h6 q-mb-md">AI设置</div>
            
            <q-item>
              <q-item-section>
                <q-item-label>默认AI服务</q-item-label>
                <q-item-label caption>选择默认的AI视频生成服务</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.defaultAIService"
                  :options="aiServiceOptions"
                  emit-value
                  map-options
                  style="min-width: 150px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>API密钥管理</q-item-label>
                <q-item-label caption>配置AI服务的API密钥</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  label="管理密钥"
                  color="primary"
                  outline
                  @click="showApiKeyDialog = true"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>最大重试次数</q-item-label>
                <q-item-label caption>AI服务失败时的重试次数</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model.number="settings.maxRetries"
                  type="number"
                  min="1"
                  max="10"
                  style="width: 80px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>请求超时</q-item-label>
                <q-item-label caption>AI服务请求超时时间（秒）</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model.number="settings.requestTimeout"
                  type="number"
                  min="30"
                  max="300"
                  style="width: 80px"
                />
              </q-item-section>
            </q-item>
          </q-tab-panel>

          <!-- Video Settings -->
          <q-tab-panel name="video">
            <div class="text-h6 q-mb-md">视频设置</div>
            
            <q-item>
              <q-item-section>
                <q-item-label>默认分辨率</q-item-label>
                <q-item-label caption>生成视频的默认分辨率</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.defaultResolution"
                  :options="resolutionOptions"
                  emit-value
                  map-options
                  style="min-width: 120px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>视频质量</q-item-label>
                <q-item-label caption>生成视频的质量设置</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.videoQuality"
                  :options="qualityOptions"
                  emit-value
                  map-options
                  style="min-width: 120px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>帧率</q-item-label>
                <q-item-label caption>视频帧率（FPS）</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.frameRate"
                  :options="frameRateOptions"
                  emit-value
                  map-options
                  style="min-width: 100px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>输出格式</q-item-label>
                <q-item-label caption>视频输出格式</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="settings.outputFormat"
                  :options="formatOptions"
                  emit-value
                  map-options
                  style="min-width: 100px"
                />
              </q-item-section>
            </q-item>
          </q-tab-panel>

          <!-- Advanced Settings -->
          <q-tab-panel name="advanced">
            <div class="text-h6 q-mb-md">高级设置</div>
            
            <q-item>
              <q-item-section>
                <q-item-label>开发者模式</q-item-label>
                <q-item-label caption>启用开发者工具和调试功能</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="settings.developerMode" />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>详细日志</q-item-label>
                <q-item-label caption>记录详细的操作日志</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="settings.verboseLogging" />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>缓存大小</q-item-label>
                <q-item-label caption>本地缓存大小限制（MB）</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model.number="settings.cacheSize"
                  type="number"
                  min="100"
                  max="5000"
                  style="width: 100px"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label>并行处理数</q-item-label>
                <q-item-label caption>同时处理的任务数量</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model.number="settings.parallelTasks"
                  type="number"
                  min="1"
                  max="8"
                  style="width: 80px"
                />
              </q-item-section>
            </q-item>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="重置" @click="resetSettings" />
        <q-btn flat label="取消" v-close-popup />
        <q-btn color="primary" label="保存" @click="saveSettings" />
      </q-card-actions>
    </q-card>

    <!-- API Key Management Dialog -->
    <q-dialog v-model="showApiKeyDialog">
      <q-card style="min-width: 500px;">
        <q-card-section>
          <div class="text-h6">API密钥管理</div>
        </q-card-section>

        <q-card-section>
          <div v-for="service in aiServices" :key="service.id" class="q-mb-md">
            <q-input
              :label="service.name + ' API密钥'"
              v-model="apiKeys[service.id]"
              type="password"
              filled
              :hint="service.description"
            >
              <template v-slot:append>
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  @click="togglePasswordVisibility(service.id)"
                />
              </template>
            </q-input>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="primary" label="保存" @click="saveApiKeys" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';

interface Settings {
  language: string;
  theme: string;
  autoSave: boolean;
  saveInterval: number;
  defaultAIService: string;
  maxRetries: number;
  requestTimeout: number;
  defaultResolution: string;
  videoQuality: string;
  frameRate: number;
  outputFormat: string;
  developerMode: boolean;
  verboseLogging: boolean;
  cacheSize: number;
  parallelTasks: number;
}

interface Props {
  modelValue: boolean;
  settings: Settings;
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({
    language: 'zh-CN',
    theme: 'auto',
    autoSave: true,
    saveInterval: 60,
    defaultAIService: 'runwayml',
    maxRetries: 3,
    requestTimeout: 120,
    defaultResolution: '1920x1080',
    videoQuality: 'high',
    frameRate: 30,
    outputFormat: 'mp4',
    developerMode: false,
    verboseLogging: false,
    cacheSize: 1000,
    parallelTasks: 2
  })
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'settings-changed': [settings: Settings];
}>();

const $q = useQuasar();

// State
const activeTab = ref('general');
const showApiKeyDialog = ref(false);
const apiKeys = ref<Record<string, string>>({});
const settings = ref<Settings>({ ...props.settings });

// Computed
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Options
const languageOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
];

const themeOptions = [
  { label: '自动', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
];

const aiServiceOptions = [
  { label: 'RunwayML', value: 'runwayml' },
  { label: 'Pika Labs', value: 'pikalabs' },
  { label: 'Stable Video', value: 'stablevideo' }
];

const resolutionOptions = [
  { label: '720p (1280x720)', value: '1280x720' },
  { label: '1080p (1920x1080)', value: '1920x1080' },
  { label: '4K (3840x2160)', value: '3840x2160' }
];

const qualityOptions = [
  { label: '标准', value: 'standard' },
  { label: '高质量', value: 'high' },
  { label: '超高质量', value: 'ultra' }
];

const frameRateOptions = [
  { label: '24 FPS', value: 24 },
  { label: '30 FPS', value: 30 },
  { label: '60 FPS', value: 60 }
];

const formatOptions = [
  { label: 'MP4', value: 'mp4' },
  { label: 'AVI', value: 'avi' },
  { label: 'MOV', value: 'mov' }
];

const aiServices = [
  {
    id: 'runwayml',
    name: 'RunwayML',
    description: '用于生成高质量AI视频'
  },
  {
    id: 'pikalabs',
    name: 'Pika Labs',
    description: '专注于动画风格的AI视频生成'
  },
  {
    id: 'stablevideo',
    name: 'Stable Video',
    description: '开源的视频生成模型'
  }
];

// Methods
const saveSettings = () => {
  emit('settings-changed', { ...settings.value });
  $q.notify({
    type: 'positive',
    message: '设置已保存',
    position: 'top'
  });
  isVisible.value = false;
};

const resetSettings = () => {
  $q.dialog({
    title: '重置设置',
    message: '确定要重置所有设置为默认值吗？',
    cancel: true,
    persistent: true
  }).onOk(() => {
    settings.value = {
      language: 'zh-CN',
      theme: 'auto',
      autoSave: true,
      saveInterval: 60,
      defaultAIService: 'runwayml',
      maxRetries: 3,
      requestTimeout: 120,
      defaultResolution: '1920x1080',
      videoQuality: 'high',
      frameRate: 30,
      outputFormat: 'mp4',
      developerMode: false,
      verboseLogging: false,
      cacheSize: 1000,
      parallelTasks: 2
    };
    $q.notify({
      type: 'info',
      message: '设置已重置为默认值',
      position: 'top'
    });
  });
};

const saveApiKeys = () => {
  // 保存API密钥到安全存储
  console.log('Saving API keys:', apiKeys.value);
  $q.notify({
    type: 'positive',
    message: 'API密钥已保存',
    position: 'top'
  });
  showApiKeyDialog.value = false;
};

const togglePasswordVisibility = (serviceId: string) => {
  // 切换密码可见性
  console.log('Toggle password visibility for:', serviceId);
};

// Watchers
watch(() => props.settings, (newSettings) => {
  settings.value = { ...newSettings };
}, { deep: true });
</script>

<style scoped lang="scss">
.q-item {
  padding: 12px 0;
}

.q-tab-panel {
  padding: 16px 0;
}
</style>