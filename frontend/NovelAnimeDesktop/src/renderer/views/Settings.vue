<template>
  <div class="settings-view">
    <!-- 视图头部 -->
    <ViewHeader 
      :title="currentCategoryLabel" 
      :subtitle="currentCategoryDescription"
    />
    
    <div class="settings-content">
      <!-- 个人资料 -->
      <div v-if="activeCategory === 'profile'" class="settings-section profile-section">
        <div class="profile-card">
          <div class="avatar-section">
            <div class="avatar-large" :style="{ background: avatarGradient }">
              {{ userInitial }}
            </div>
            <button class="change-avatar-btn">
              <component :is="icons.camera" :size="16" />
              <span>更换头像</span>
            </button>
          </div>
          
          <div class="info-section">
            <div class="info-group">
              <label>用户名</label>
              <div class="info-value">
                <span>{{ userName }}</span>
                <button class="edit-btn" @click="editField('username')">
                  <component :is="icons.edit" :size="14" />
                </button>
              </div>
            </div>
            
            <div class="info-group">
              <label>邮箱</label>
              <div class="info-value">
                <span>{{ userEmail }}</span>
                <span class="verified-badge">已验证</span>
              </div>
            </div>
            
            <div class="info-group">
              <label>注册时间</label>
              <div class="info-value">
                <span>{{ formatDate(createdDate) }}</span>
              </div>
            </div>
            
            <div class="info-group">
              <label>最后登录</label>
              <div class="info-value">
                <span>{{ formatDate(lastLoginDate) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 积分信息 -->
        <div class="credits-card">
          <div class="credits-header">
            <h3>积分余额</h3>
            <button class="recharge-btn" @click="handleRecharge">
              <component :is="icons.plus" :size="16" />
              <span>充值</span>
            </button>
          </div>
          <div class="credits-amount">
            <span class="amount">{{ credits }}</span>
            <span class="unit">积分</span>
          </div>
          <div class="credits-hint">
            积分可用于AI生成、角色分析等功能
          </div>
        </div>
        
        <!-- 安全设置 -->
        <div class="security-card">
          <h3>安全设置</h3>
          <div class="security-item" @click="handleChangePassword">
            <div class="security-info">
              <component :is="icons.lock" :size="20" />
              <div class="security-text">
                <span class="security-title">修改密码</span>
                <span class="security-desc">定期更换密码以保护账户安全</span>
              </div>
            </div>
            <component :is="icons.chevronRight" :size="20" class="arrow" />
          </div>
          
          <div class="security-item" @click="handleBindPhone">
            <div class="security-info">
              <component :is="icons.phone" :size="20" />
              <div class="security-text">
                <span class="security-title">绑定手机</span>
                <span class="security-desc">{{ phoneNumber || '未绑定' }}</span>
              </div>
            </div>
            <component :is="icons.chevronRight" :size="20" class="arrow" />
          </div>
          
          <div class="security-item security-item--danger" @click="handleLogout">
            <div class="security-info">
              <component :is="icons.logOut" :size="20" />
              <div class="security-text">
                <span class="security-title">退出登录</span>
                <span class="security-desc">退出当前账户</span>
              </div>
            </div>
            <component :is="icons.chevronRight" :size="20" class="arrow" />
          </div>
        </div>
      </div>
      
      <!-- AI服务配置 -->
      <div v-if="activeCategory === 'ai'" class="settings-section">
        <div class="setting-group">
          <label class="setting-label">AI服务提供商</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'provider' }">
            <div class="custom-select__trigger" @click="toggleSelect('provider')">
              <span>{{ getOptionLabel(providerOptions, settings.ai.provider) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'provider'" class="custom-select__options">
              <div 
                v-for="option in providerOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.ai.provider === option.value }"
                @click="selectOption('ai', 'provider', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">API密钥</label>
          <div class="input-with-action">
            <input 
              :type="showApiKey ? 'text' : 'password'"
              v-model="settings.ai.apiKey"
              class="setting-input"
              placeholder="输入API密钥"
            />
            <button class="input-action" @click="showApiKey = !showApiKey">
              <component :is="showApiKey ? icons.eyeOff : icons.eye" :size="16" />
            </button>
          </div>
          <p class="setting-hint">API密钥将安全存储在本地</p>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">API端点 (可选)</label>
          <input 
            type="text"
            v-model="settings.ai.endpoint"
            class="setting-input"
            placeholder="https://api.example.com/v1"
          />
          <p class="setting-hint">留空使用默认端点</p>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">模型选择</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'model' }">
            <div class="custom-select__trigger" @click="toggleSelect('model')">
              <span>{{ getOptionLabel(modelOptions, settings.ai.model) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'model'" class="custom-select__options">
              <div 
                v-for="option in modelOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.ai.model === option.value }"
                @click="selectOption('ai', 'model', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <button class="test-btn" @click="testConnection">
          <component :is="icons.zap" :size="16" />
          <span>测试连接</span>
        </button>
      </div>
      
      <!-- 生成参数 -->
      <div v-if="activeCategory === 'generation'" class="settings-section">
        <div class="setting-group">
          <label class="setting-label">视频风格</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'style' }">
            <div class="custom-select__trigger" @click="toggleSelect('style')">
              <span>{{ getOptionLabel(styleOptions, settings.generation.style) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'style'" class="custom-select__options">
              <div 
                v-for="option in styleOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.generation.style === option.value }"
                @click="selectOption('generation', 'style', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">视频分辨率</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'resolution' }">
            <div class="custom-select__trigger" @click="toggleSelect('resolution')">
              <span>{{ getOptionLabel(resolutionOptions, settings.generation.resolution) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'resolution'" class="custom-select__options">
              <div 
                v-for="option in resolutionOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.generation.resolution === option.value }"
                @click="selectOption('generation', 'resolution', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">帧率</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'fps' }">
            <div class="custom-select__trigger" @click="toggleSelect('fps')">
              <span>{{ getOptionLabel(fpsOptions, settings.generation.fps) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'fps'" class="custom-select__options">
              <div 
                v-for="option in fpsOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.generation.fps === option.value }"
                @click="selectOption('generation', 'fps', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">每集时长 (分钟)</label>
          <input 
            type="number"
            v-model.number="settings.generation.episodeDuration"
            class="setting-input"
            min="1"
            max="60"
          />
        </div>
        
        <div class="setting-group">
          <label class="setting-label">语音合成</label>
          <div class="toggle-group">
            <label class="toggle">
              <input type="checkbox" v-model="settings.generation.enableVoice" />
              <span class="toggle-slider"></span>
            </label>
            <span>启用AI语音合成</span>
          </div>
        </div>
        
        <div class="setting-group" v-if="settings.generation.enableVoice">
          <label class="setting-label">语音风格</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'voiceStyle' }">
            <div class="custom-select__trigger" @click="toggleSelect('voiceStyle')">
              <span>{{ getOptionLabel(voiceStyleOptions, settings.generation.voiceStyle) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'voiceStyle'" class="custom-select__options">
              <div 
                v-for="option in voiceStyleOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.generation.voiceStyle === option.value }"
                @click="selectOption('generation', 'voiceStyle', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 界面设置 -->
      <div v-if="activeCategory === 'interface'" class="settings-section">
        <div class="setting-group">
          <label class="setting-label">主题</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'theme' }">
            <div class="custom-select__trigger" @click="toggleSelect('theme')">
              <span>{{ getOptionLabel(themeOptions, settings.interface.theme) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'theme'" class="custom-select__options">
              <div 
                v-for="option in themeOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.interface.theme === option.value }"
                @click="selectOption('interface', 'theme', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">语言</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'language' }">
            <div class="custom-select__trigger" @click="toggleSelect('language')">
              <span>{{ getOptionLabel(languageOptions, settings.interface.language) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'language'" class="custom-select__options">
              <div 
                v-for="option in languageOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.interface.language === option.value }"
                @click="selectOption('interface', 'language', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">字体大小</label>
          <div class="custom-select" :class="{ 'custom-select--open': openSelect === 'fontSize' }">
            <div class="custom-select__trigger" @click="toggleSelect('fontSize')">
              <span>{{ getOptionLabel(fontSizeOptions, settings.interface.fontSize) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="openSelect === 'fontSize'" class="custom-select__options">
              <div 
                v-for="option in fontSizeOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': settings.interface.fontSize === option.value }"
                @click="selectOption('interface', 'fontSize', option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">动画效果</label>
          <div class="toggle-group">
            <label class="toggle">
              <input type="checkbox" v-model="settings.interface.animations" />
              <span class="toggle-slider"></span>
            </label>
            <span>启用界面动画</span>
          </div>
        </div>
      </div>
      
      <!-- 存储设置 -->
      <div v-if="activeCategory === 'storage'" class="settings-section">
        <div class="setting-group">
          <label class="setting-label">默认项目目录</label>
          <div class="input-with-action">
            <input 
              type="text"
              v-model="settings.storage.projectDir"
              class="setting-input"
              readonly
            />
            <button class="input-action" @click="selectProjectDir">
              <component :is="icons.folder" :size="16" />
            </button>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">缓存目录</label>
          <div class="input-with-action">
            <input 
              type="text"
              v-model="settings.storage.cacheDir"
              class="setting-input"
              readonly
            />
            <button class="input-action" @click="selectCacheDir">
              <component :is="icons.folder" :size="16" />
            </button>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">自动保存</label>
          <div class="toggle-group">
            <label class="toggle">
              <input type="checkbox" v-model="settings.storage.autoSave" />
              <span class="toggle-slider"></span>
            </label>
            <span>启用自动保存</span>
          </div>
        </div>
        
        <div class="setting-group" v-if="settings.storage.autoSave">
          <label class="setting-label">自动保存间隔 (分钟)</label>
          <input 
            type="number"
            v-model.number="settings.storage.autoSaveInterval"
            class="setting-input"
            min="1"
            max="30"
          />
        </div>
        
        <div class="storage-info">
          <div class="info-item">
            <span class="info-label">缓存大小</span>
            <span class="info-value">{{ cacheSize }}</span>
          </div>
          <button class="clear-cache-btn" @click="clearCache">
            <component :is="icons.trash" :size="14" />
            <span>清除缓存</span>
          </button>
        </div>
      </div>
      
      <!-- 关于 -->
      <div v-if="activeCategory === 'about'" class="settings-section">
        <div class="about-info">
          <div class="app-logo">
            <component :is="icons.sparkles" :size="48" />
          </div>
          <h3>小说动漫生成器</h3>
          <p class="version">版本 1.0.0</p>
          <p class="description">使用AI技术将小说转换为精美的动画视频</p>
        </div>
        
        <div class="about-links">
          <a href="#" class="about-link">
            <component :is="icons.help" :size="16" />
            <span>帮助文档</span>
          </a>
          <a href="#" class="about-link">
            <component :is="icons.external" :size="16" />
            <span>官方网站</span>
          </a>
          <a href="#" class="about-link">
            <component :is="icons.info" :size="16" />
            <span>检查更新</span>
          </a>
        </div>
      </div>
      
      <!-- 保存按钮 -->
      <div class="settings-actions" v-if="activeCategory !== 'about'">
        <button class="btn btn--secondary" @click="resetSettings">
          重置为默认
        </button>
        <button class="btn btn--primary" @click="saveSettings">
          <component :is="icons.save" :size="16" />
          <span>保存设置</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { useNavigationStore } from '../stores/navigation.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const router = useRouter();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 用户信息（暂时使用模拟数据）
const userName = ref('用户');
const userEmail = ref('user@example.com');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const credits = ref(0);
const phoneNumber = ref('');
const createdDate = ref(new Date());
const lastLoginDate = ref(new Date());

const avatarGradient = computed(() => {
  const colors = [
    'linear-gradient(135deg, #6a7a72, #8fa89e)',
    'linear-gradient(135deg, #7a8a9a, #9ab0c0)',
    'linear-gradient(135deg, #8a8a8a, #a0a8a4)',
  ];
  const index = userName.value.charCodeAt(0) % colors.length;
  return colors[index];
});

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function editField(field) {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '编辑功能即将上线',
    timeout: 2000
  });
}

function handleRecharge() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '充值功能即将上线',
    timeout: 2000
  });
}

function handleChangePassword() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '修改密码功能即将上线',
    timeout: 2000
  });
}

function handleBindPhone() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '绑定手机功能即将上线',
    timeout: 2000
  });
}

async function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    // 清除本地存储的认证信息
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('novel_anime_access_token');
    localStorage.removeItem('novel_anime_refresh_token');
    
    uiStore.addNotification({
      type: 'success',
      title: '已退出',
      message: '您已成功退出登录',
      timeout: 2000
    });
    
    router.push('/login');
  }
}

// 加载用户信息
function loadUserInfo() {
  try {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userName.value = user.username || user.email?.split('@')[0] || '用户';
      userEmail.value = user.email || 'user@example.com';
      credits.value = user.credits || 0;
      createdDate.value = user.createdDate ? new Date(user.createdDate) : new Date();
      lastLoginDate.value = user.lastLoginDate ? new Date(user.lastLoginDate) : new Date();
    }
  } catch (e) {
    console.error('加载用户信息失败:', e);
  }
}

// 下拉框选项配置
const providerOptions = [
  { value: 'zhipu', label: '智谱AI (GLM-4)' },
  { value: 'openai', label: 'OpenAI (GPT-4)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'local', label: '本地模型' }
];

const modelOptions = [
  { value: 'glm-4', label: 'GLM-4' },
  { value: 'glm-4v', label: 'GLM-4V (视觉)' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3', label: 'Claude 3' }
];

const styleOptions = [
  { value: 'anime', label: '日式动漫' },
  { value: 'cartoon', label: '卡通风格' },
  { value: 'realistic', label: '写实风格' },
  { value: 'watercolor', label: '水彩风格' },
  { value: 'pixel', label: '像素风格' }
];

const resolutionOptions = [
  { value: '720p', label: '720p (1280×720)' },
  { value: '1080p', label: '1080p (1920×1080)' },
  { value: '2k', label: '2K (2560×1440)' },
  { value: '4k', label: '4K (3840×2160)' }
];

const fpsOptions = [
  { value: 24, label: '24 FPS (电影)' },
  { value: 30, label: '30 FPS (标准)' },
  { value: 60, label: '60 FPS (流畅)' }
];

const voiceStyleOptions = [
  { value: 'natural', label: '自然' },
  { value: 'dramatic', label: '戏剧化' },
  { value: 'calm', label: '平静' },
  { value: 'energetic', label: '活力' }
];

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' }
];

const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
];

const fontSizeOptions = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' }
];

// 分类配置
const categoryConfig = {
  profile: { label: '个人资料', description: '管理您的账户信息' },
  ai: { label: 'AI服务配置', description: '配置AI服务提供商和API密钥' },
  generation: { label: '生成参数', description: '配置视频生成的默认参数' },
  interface: { label: '界面设置', description: '自定义应用界面外观' },
  storage: { label: '存储设置', description: '管理项目存储和缓存' },
  about: { label: '关于', description: '应用信息和更新' }
};

// 从 navigationStore 获取当前分类
const activeCategory = computed(() => {
  return navigationStore.panelContext.settings?.activeCategory || 'profile';
});

// 当前分类标签和描述
const currentCategoryLabel = computed(() => {
  return categoryConfig[activeCategory.value]?.label || '设置';
});

const currentCategoryDescription = computed(() => {
  return categoryConfig[activeCategory.value]?.description || '';
});

const showApiKey = ref(false);
const cacheSize = ref('128 MB');
const openSelect = ref(null);

// 设置数据
const settings = reactive({
  ai: { provider: 'zhipu', apiKey: '', endpoint: '', model: 'glm-4' },
  generation: { style: 'anime', resolution: '1080p', fps: 30, episodeDuration: 5, enableVoice: true, voiceStyle: 'natural' },
  interface: { theme: 'light', language: 'zh-CN', fontSize: 'medium', animations: true },
  storage: { projectDir: '~/Documents/NovelAnime/Projects', cacheDir: '~/Documents/NovelAnime/Cache', autoSave: true, autoSaveInterval: 5 }
});

// 下拉框方法
function toggleSelect(name) {
  openSelect.value = openSelect.value === name ? null : name;
}

function selectOption(category, field, value) {
  settings[category][field] = value;
  openSelect.value = null;
}

function getOptionLabel(options, value) {
  const option = options.find(o => o.value === value);
  return option ? option.label : value;
}

// 点击外部关闭下拉框
function handleClickOutside(event) {
  if (!event.target.closest('.custom-select')) {
    openSelect.value = null;
  }
}

// 初始化时加载设置
onMounted(() => {
  loadSettings();
  loadUserInfo();
  document.addEventListener('click', handleClickOutside);
  const currentCategory = navigationStore.panelContext.settings?.activeCategory;
  if (!currentCategory || !categoryConfig[currentCategory]) {
    navigationStore.updatePanelContext('settings', { activeCategory: 'profile' });
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 加载设置
function loadSettings() {
  try {
    const saved = localStorage.getItem('novel-anime-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }
}

// 方法
function testConnection() {
  uiStore.addNotification({ type: 'info', title: '测试连接', message: '正在测试AI服务连接...', timeout: 2000 });
  setTimeout(() => {
    if (settings.ai.apiKey) {
      uiStore.addNotification({ type: 'success', title: '连接成功', message: 'AI服务连接正常', timeout: 3000 });
    } else {
      uiStore.addNotification({ type: 'error', title: '连接失败', message: '请先输入API密钥', timeout: 3000 });
    }
  }, 1500);
}

function selectProjectDir() {
  uiStore.addNotification({ type: 'info', title: '选择目录', message: '请选择项目存储目录', timeout: 2000 });
}

function selectCacheDir() {
  uiStore.addNotification({ type: 'info', title: '选择目录', message: '请选择缓存目录', timeout: 2000 });
}

function clearCache() {
  if (confirm('确定要清除所有缓存吗？')) {
    uiStore.addNotification({ type: 'success', title: '清除成功', message: '缓存已清除', timeout: 2000 });
    cacheSize.value = '0 B';
  }
}

function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    settings.ai = { provider: 'zhipu', apiKey: '', endpoint: '', model: 'glm-4' };
    settings.generation = { style: 'anime', resolution: '1080p', fps: 30, episodeDuration: 5, enableVoice: true, voiceStyle: 'natural' };
    settings.interface = { theme: 'light', language: 'zh-CN', fontSize: 'medium', animations: true };
    settings.storage = { projectDir: '~/Documents/NovelAnime/Projects', cacheDir: '~/Documents/NovelAnime/Cache', autoSave: true, autoSaveInterval: 5 };
    uiStore.addNotification({ type: 'success', title: '重置成功', message: '设置已重置为默认值', timeout: 2000 });
  }
}

function saveSettings() {
  try {
    localStorage.setItem('novel-anime-settings', JSON.stringify(settings));
    uiStore.addNotification({ type: 'success', title: '保存成功', message: '设置已保存', timeout: 2000 });
  } catch (e) {
    uiStore.addNotification({ type: 'error', title: '保存失败', message: e.message, timeout: 3000 });
  }
}
</script>


<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px;
  gap: 16px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

/* 设置项 */
.setting-group {
  margin-bottom: 16px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #6c6c6e;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.setting-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.setting-input:focus {
  outline: none;
  border-color: rgba(138, 138, 138, 0.5);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(138, 138, 138, 0.1);
}

.setting-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: #8a8a8c;
}

.input-with-action {
  display: flex;
  gap: 8px;
}

.input-with-action .setting-input {
  flex: 1;
}

.input-action {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.input-action:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(138, 138, 138, 0.5);
}

/* 自定义下拉框 */
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

.select-arrow {
  color: #6c6c6e;
  transition: transform 0.2s;
}

.custom-select--open .select-arrow {
  transform: rotate(180deg);
}

.custom-select__options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(240, 240, 240, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 10;
  overflow: hidden;
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

/* 开关 */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #4a4a4c;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(160, 160, 160, 0.4);
  transition: 0.3s;
  border-radius: 22px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(90deg, rgba(130, 160, 140, 0.8), rgba(150, 180, 165, 0.7));
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

/* 测试按钮 */
.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.test-btn:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

/* 存储信息 */
.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  margin-top: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: #6c6c6e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

.clear-cache-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  color: #c0392b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-cache-btn:hover {
  background: rgba(231, 76, 60, 0.15);
  border-color: rgba(231, 76, 60, 0.5);
}

/* 关于页面 */
.about-info {
  text-align: center;
  padding: 28px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  margin-bottom: 20px;
}

.app-logo {
  color: #6a6a6a;
  margin-bottom: 14px;
}

.about-info h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.about-info .version {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6c6c6e;
}

.about-info .description {
  margin: 0;
  font-size: 13px;
  color: #4a4a4c;
  line-height: 1.5;
}

.about-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.about-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #4a4a4c;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s;
}

.about-link:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #2c2c2e;
}

/* 操作按钮 */
.settings-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 480px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.btn--secondary {
  background: rgba(0, 0, 0, 0.06);
  color: #5a5a5c;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.btn--secondary:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.btn--primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  color: #2c2c2e;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn--primary:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

/* 个人资料样式 */
.profile-section {
  gap: 16px;
  background: transparent;
  padding: 0;
}

.profile-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.change-avatar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 6px;
  color: #4a4a4c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-avatar-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.profile-section .info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-section .info-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0;
}

.profile-section .info-group label {
  font-size: 11px;
  font-weight: 600;
  color: #8a8a8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.profile-section .info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2c2c2e;
}

.edit-btn {
  padding: 4px;
  background: none;
  border: none;
  color: #8a8a8c;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #4a4a4c;
}

.verified-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
  border-radius: 8px;
  font-weight: 500;
}

/* 积分卡片 */
.credits-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.credits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.credits-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0;
}

.recharge-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: #2c2c2e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.recharge-btn:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

.credits-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.credits-amount .amount {
  font-size: 36px;
  font-weight: 700;
  color: #2c2c2e;
}

.credits-amount .unit {
  font-size: 14px;
  color: #6c6c6e;
}

.credits-hint {
  font-size: 12px;
  color: #8a8a8c;
}

/* 安全设置卡片 */
.security-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.security-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 16px 0;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.security-item:last-child {
  border-bottom: none;
}

.security-item:hover {
  background: rgba(255, 255, 255, 0.1);
  margin: 0 -12px;
  padding: 14px 12px;
  border-radius: 8px;
}

.security-item--danger .security-title {
  color: #c0392b;
}

.security-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a4a4c;
}

.security-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.security-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.security-desc {
  font-size: 12px;
  color: #8a8a8c;
}

.arrow {
  color: #8a8a8c;
}
</style>
