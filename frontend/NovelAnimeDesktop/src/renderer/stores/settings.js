import { defineStore } from 'pinia';

// 默认设置
const defaultSettings = {
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
};

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 设置数据
    settings: JSON.parse(JSON.stringify(defaultSettings)),
    // 是否已加载
    isLoaded: false,
    // 是否有未保存的更改
    hasUnsavedChanges: false,
    // 验证错误
    validationErrors: {}
  }),

  getters: {
    // AI设置
    aiSettings: (state) => state.settings.ai,
    
    // 生成参数
    generationSettings: (state) => state.settings.generation,
    
    // 界面设置
    interfaceSettings: (state) => state.settings.interface,
    
    // 存储设置
    storageSettings: (state) => state.settings.storage,
    
    // 是否配置了API密钥
    hasApiKey: (state) => !!state.settings.ai.apiKey,
    
    // 获取特定设置
    getSetting: (state) => (category, key) => {
      if (state.settings[category] && key in state.settings[category]) {
        return state.settings[category][key];
      }
      return null;
    },
    
    // 是否有验证错误
    hasValidationErrors: (state) => Object.keys(state.validationErrors).length > 0
  },

  actions: {
    // 加载设置
    loadSettings() {
      try {
        const saved = localStorage.getItem('novel-anime-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          // 深度合并，确保新增的默认设置也被包含
          this.settings = this.deepMerge(
            JSON.parse(JSON.stringify(defaultSettings)),
            parsed
          );
        }
        this.isLoaded = true;
        this.hasUnsavedChanges = false;
      } catch (e) {
        console.error('Failed to load settings:', e);
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
        this.isLoaded = true;
      }
    },
    
    // 保存设置
    saveSettings() {
      // 验证设置
      if (!this.validateSettings()) {
        return false;
      }
      
      try {
        localStorage.setItem('novel-anime-settings', JSON.stringify(this.settings));
        this.hasUnsavedChanges = false;
        return true;
      } catch (e) {
        console.error('Failed to save settings:', e);
        return false;
      }
    },
    
    // 更新设置
    updateSetting(category, key, value) {
      if (this.settings[category] && key in this.settings[category]) {
        this.settings[category][key] = value;
        this.hasUnsavedChanges = true;
        
        // 清除该字段的验证错误
        const errorKey = `${category}.${key}`;
        if (this.validationErrors[errorKey]) {
          delete this.validationErrors[errorKey];
        }
        
        return true;
      }
      return false;
    },
    
    // 批量更新设置
    updateSettings(category, updates) {
      if (this.settings[category]) {
        Object.assign(this.settings[category], updates);
        this.hasUnsavedChanges = true;
        return true;
      }
      return false;
    },
    
    // 重置为默认设置
    resetSettings(category = null) {
      if (category && defaultSettings[category]) {
        this.settings[category] = JSON.parse(JSON.stringify(defaultSettings[category]));
      } else {
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
      }
      this.hasUnsavedChanges = true;
      this.validationErrors = {};
    },
    
    // 验证设置
    validateSettings() {
      this.validationErrors = {};
      
      // 验证AI设置
      if (this.settings.ai.provider && !this.settings.ai.apiKey) {
        // API密钥可以为空，但如果设置了提供商，建议填写
        // this.validationErrors['ai.apiKey'] = 'API密钥不能为空';
      }
      
      if (this.settings.ai.endpoint && !this.isValidUrl(this.settings.ai.endpoint)) {
        this.validationErrors['ai.endpoint'] = '请输入有效的URL';
      }
      
      // 验证生成参数
      if (this.settings.generation.episodeDuration < 1 || this.settings.generation.episodeDuration > 60) {
        this.validationErrors['generation.episodeDuration'] = '每集时长必须在1-60分钟之间';
      }
      
      // 验证存储设置
      if (this.settings.storage.autoSave && 
          (this.settings.storage.autoSaveInterval < 1 || this.settings.storage.autoSaveInterval > 30)) {
        this.validationErrors['storage.autoSaveInterval'] = '自动保存间隔必须在1-30分钟之间';
      }
      
      return Object.keys(this.validationErrors).length === 0;
    },
    
    // 导出设置
    exportSettings() {
      const data = JSON.stringify(this.settings, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'novel-anime-settings.json';
      a.click();
      
      URL.revokeObjectURL(url);
    },
    
    // 导入设置
    async importSettings(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            
            // 验证导入的设置结构
            if (!this.validateImportedSettings(imported)) {
              reject(new Error('无效的设置文件格式'));
              return;
            }
            
            this.settings = this.deepMerge(
              JSON.parse(JSON.stringify(defaultSettings)),
              imported
            );
            this.hasUnsavedChanges = true;
            resolve(true);
          } catch (err) {
            reject(new Error('解析设置文件失败'));
          }
        };
        
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file);
      });
    },
    
    // 验证导入的设置结构
    validateImportedSettings(imported) {
      // 检查是否包含必要的分类
      const requiredCategories = ['ai', 'generation', 'interface', 'storage'];
      return requiredCategories.every(cat => typeof imported[cat] === 'object');
    },
    
    // 深度合并对象
    deepMerge(target, source) {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    },
    
    // 验证URL格式
    isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    },
    
    // 获取验证错误
    getValidationError(category, key) {
      return this.validationErrors[`${category}.${key}`] || null;
    },
    
    // 清除所有设置数据
    clearSettings() {
      localStorage.removeItem('novel-anime-settings');
      this.settings = JSON.parse(JSON.stringify(defaultSettings));
      this.hasUnsavedChanges = false;
      this.validationErrors = {};
    }
  }
});
