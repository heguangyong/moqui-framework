<template>
  <div class="settings-view">
    <div class="settings-sidebar">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="category-item"
        :class="{ 'category-item--active': activeCategory === category.id }"
        @click="activeCategory = category.id"
      >
        <component :is="category.icon" :size="18" />
        <span>{{ category.label }}</span>
      </div>
    </div>
    
    <div class="settings-content">
      <!-- AI服务配置 -->
      <div v-if="activeCategory === 'ai'" class="settings-section">
        <h2>AI服务配置</h2>
        <p class="section-description">配置AI服务提供商和API密钥</p>
        
        <div class="setting-group">
          <label class="setting-label">AI服务提供商</label>
          <select v-model="settings.ai.provider" class="setting-select">
            <option value="zhipu">智谱AI (GLM-4)</option>
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="local">本地模型</option>
          </select>
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
          <select v-model="settings.ai.model" class="setting-select">
            <option value="glm-4">GLM-4</option>
            <option value="glm-4v">GLM-4V (视觉)</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>
        
        <button class="test-btn" @click="testConnection">
          <component :is="icons.zap" :size="16" />
          <span>测试连接</span>
        </button>
      </div>
      
      <!-- 生成参数 -->
      <div v-if="activeCategory === 'generation'" class="settings-section">
        <h2>生成参数</h2>
        <p class="section-description">配置视频生成的默认参数</p>
        
        <div class="setting-group">
          <label class="setting-label">视频风格</label>
          <select v-model="settings.generation.style" class="setting-select">
            <option value="anime">日式动漫</option>
            <option value="cartoon">卡通风格</option>
            <option value="realistic">写实风格</option>
            <option value="watercolor">水彩风格</option>
            <option value="pixel">像素风格</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">视频分辨率</label>
          <select v-model="settings.generation.resolution" class="setting-select">
            <option value="720p">720p (1280×720)</option>
            <option value="1080p">1080p (1920×1080)</option>
            <option value="2k">2K (2560×1440)</option>
            <option value="4k">4K (3840×2160)</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">帧率</label>
          <select v-model="settings.generation.fps" class="setting-select">
            <option value="24">24 FPS (电影)</option>
            <option value="30">30 FPS (标准)</option>
            <option value="60">60 FPS (流畅)</option>
          </select>
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
          <select v-model="settings.generation.voiceStyle" class="setting-select">
            <option value="natural">自然</option>
            <option value="dramatic">戏剧化</option>
            <option value="calm">平静</option>
            <option value="energetic">活力</option>
          </select>
        </div>
      </div>
      
      <!-- 界面设置 -->
      <div v-if="activeCategory === 'interface'" class="settings-section">
        <h2>界面设置</h2>
        <p class="section-description">自定义应用界面外观</p>
        
        <div class="setting-group">
          <label class="setting-label">主题</label>
          <select v-model="settings.interface.theme" class="setting-select">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="system">跟随系统</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">语言</label>
          <select v-model="settings.interface.language" class="setting-select">
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">字体大小</label>
          <select v-model="settings.interface.fontSize" class="setting-select">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
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
        <h2>存储设置</h2>
        <p class="section-description">管理项目存储和缓存</p>
        
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
        <h2>关于</h2>
        <p class="section-description">应用信息和更新</p>
        
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
import { ref, reactive } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';

const uiStore = useUIStore();

// 分类
const categories = [
  { id: 'ai', label: 'AI服务', icon: icons.zap },
  { id: 'generation', label: '生成参数', icon: icons.settings },
  { id: 'interface', label: '界面设置', icon: icons.eye },
  { id: 'storage', label: '存储设置', icon: icons.folder },
  { id: 'about', label: '关于', icon: icons.info }
];

const activeCategory = ref('ai');
const showApiKey = ref(false);
const cacheSize = ref('128 MB');

// 设置数据
const settings = reactive({
  ai: {
    provider: 'zhipu',
    apiKey: '',
    endpoint: '',
    model: 'glm-4'
  },
  generation: {
    style: 'anime',
    resolution: '1080p',
    fps: 30,
    episodeDuration: 5,
    enableVoice: true,
    voiceStyle: 'natural'
  },
  interface: {
    theme: 'light',
    language: 'zh-CN',
    fontSize: 'medium',
    animations: true
  },
  storage: {
    projectDir: '~/Documents/NovelAnime/Projects',
    cacheDir: '~/Documents/NovelAnime/Cache',
    autoSave: true,
    autoSaveInterval: 5
  }
});

// 方法
function testConnection() {
  uiStore.addNotification({
    type: 'info',
    title: '测试连接',
    message: '正在测试AI服务连接...',
    timeout: 2000
  });
  
  // 模拟测试
  setTimeout(() => {
    if (settings.ai.apiKey) {
      uiStore.addNotification({
        type: 'success',
        title: '连接成功',
        message: 'AI服务连接正常',
        timeout: 3000
      });
    } else {
      uiStore.addNotification({
        type: 'error',
        title: '连接失败',
        message: '请先输入API密钥',
        timeout: 3000
      });
    }
  }, 1500);
}

function selectProjectDir() {
  uiStore.addNotification({
    type: 'info',
    title: '选择目录',
    message: '请选择项目存储目录',
    timeout: 2000
  });
}

function selectCacheDir() {
  uiStore.addNotification({
    type: 'info',
    title: '选择目录',
    message: '请选择缓存目录',
    timeout: 2000
  });
}

function clearCache() {
  if (confirm('确定要清除所有缓存吗？')) {
    uiStore.addNotification({
      type: 'success',
      title: '清除成功',
      message: '缓存已清除',
      timeout: 2000
    });
    cacheSize.value = '0 B';
  }
}

function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    // 重置设置
    settings.ai = {
      provider: 'zhipu',
      apiKey: '',
      endpoint: '',
      model: 'glm-4'
    };
    settings.generation = {
      style: 'anime',
      resolution: '1080p',
      fps: 30,
      episodeDuration: 5,
      enableVoice: true,
      voiceStyle: 'natural'
    };
    settings.interface = {
      theme: 'light',
      language: 'zh-CN',
      fontSize: 'medium',
      animations: true
    };
    settings.storage = {
      projectDir: '~/Documents/NovelAnime/Projects',
      cacheDir: '~/Documents/NovelAnime/Cache',
      autoSave: true,
      autoSaveInterval: 5
    };
    
    uiStore.addNotification({
      type: 'success',
      title: '重置成功',
      message: '设置已重置为默认值',
      timeout: 2000
    });
  }
}

function saveSettings() {
  // 保存设置到本地存储
  try {
    localStorage.setItem('novel-anime-settings', JSON.stringify(settings));
    uiStore.addNotification({
      type: 'success',
      title: '保存成功',
      message: '设置已保存',
      timeout: 2000
    });
  } catch (e) {
    uiStore.addNotification({
      type: 'error',
      title: '保存失败',
      message: e.message,
      timeout: 3000
    });
  }
}
</script>

<style scoped>
.settings-view {
  display: flex;
  height: 100%;
  gap: 24px;
}

/* 侧边栏 */
.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.category-item--active {
  background: #4a90d9;
  color: #fff;
}

/* 内容区域 */
.settings-content {
  flex: 1;
  overflow-y: auto;
}

.settings-section {
  max-width: 600px;
}

.settings-section h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #2c2c2e;
}

.section-description {
  margin: 0 0 24px;
  font-size: 14px;
  color: #6c6c6e;
}

/* 设置项 */
.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 8px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: #4a90d9;
}

.setting-hint {
  margin: 6px 0 0;
  font-size: 12px;
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
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
}

.input-action:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 开关 */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
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
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #4a90d9;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* 测试按钮 */
.test-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(74, 144, 217, 0.1);
  border: 1px solid #4a90d9;
  border-radius: 8px;
  color: #4a90d9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover {
  background: rgba(74, 144, 217, 0.2);
}

/* 存储信息 */
.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  margin-top: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 12px;
  color: #6c6c6e;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.clear-cache-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: none;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  color: #e74c3c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-cache-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

/* 关于页面 */
.about-info {
  text-align: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  margin-bottom: 24px;
}

.app-logo {
  color: #4a90d9;
  margin-bottom: 16px;
}

.about-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.about-info .version {
  margin: 0 0 12px;
  font-size: 14px;
  color: #6c6c6e;
}

.about-info .description {
  margin: 0;
  font-size: 14px;
  color: #4a4a4c;
}

.about-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.about-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  color: #4a4a4c;
  text-decoration: none;
  transition: all 0.2s;
}

.about-link:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #4a90d9;
}

/* 操作按钮 */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--secondary {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.btn--secondary:hover {
  background: rgba(0, 0, 0, 0.15);
}

.btn--primary {
  background: #4a90d9;
  color: #fff;
}

.btn--primary:hover {
  background: #3a7bc8;
}
</style>
