import { defineStore } from 'pinia';
import { NovelParser } from '../services/NovelParser.ts';

export const useNovelStore = defineStore('novel', {
  state: () => ({
    currentNovel: null,
    novels: [],
    isLoading: false,
    parseProgress: 0,
    parseStatus: 'idle', // idle, validating, extracting, parsing, completed, failed
    parseMessage: '',
    error: null
  }),

  getters: {
    hasCurrentNovel: (state) => state.currentNovel !== null,
    
    currentChapters: (state) => {
      if (!state.currentNovel) return [];
      return state.currentNovel.chapters || [];
    },

    currentMetadata: (state) => {
      if (!state.currentNovel) return null;
      return state.currentNovel.metadata;
    },

    chapterCount: (state) => {
      if (!state.currentNovel) return 0;
      return state.currentNovel.chapters?.length || 0;
    },

    totalWordCount: (state) => {
      if (!state.currentNovel) return 0;
      return state.currentNovel.metadata?.wordCount || 0;
    },

    // 获取所有场景
    allScenes: (state) => {
      if (!state.currentNovel) return [];
      const scenes = [];
      for (const chapter of state.currentNovel.chapters || []) {
        scenes.push(...(chapter.scenes || []));
      }
      return scenes;
    }
  },

  actions: {
    // 解析小说文件
    async parseNovelFile(file, title, author) {
      this.isLoading = true;
      this.parseProgress = 0;
      this.parseStatus = 'validating';
      this.parseMessage = '正在验证文件...';
      this.error = null;

      try {
        // 步骤1: 验证文件
        this.parseProgress = 10;
        const validation = NovelParser.validateFile(file);
        
        if (!validation.isValid) {
          throw new Error(validation.errors.map(e => e.message).join(', '));
        }

        // 步骤2: 提取文本内容
        this.parseStatus = 'extracting';
        this.parseMessage = '正在提取文本内容...';
        this.parseProgress = 30;

        // 步骤3: 解析小说结构
        this.parseStatus = 'parsing';
        this.parseMessage = '正在解析章节结构...';
        this.parseProgress = 50;

        const novelStructure = await NovelParser.parseNovel(file, title, author);
        
        this.parseProgress = 80;
        this.parseMessage = '正在验证内容完整性...';

        // 步骤4: 验证内容完整性
        const contentValidation = NovelParser.validateContentIntegrity(novelStructure);
        if (!contentValidation.isValid) {
          console.warn('Content validation warnings:', contentValidation.warnings);
        }

        // 步骤5: 存储小说结构
        this.parseStatus = 'completed';
        this.parseMessage = '解析完成！';
        this.parseProgress = 100;

        const novelId = await NovelParser.storeNovelStructure(novelStructure);
        
        this.currentNovel = {
          id: novelId,
          ...novelStructure
        };

        // 添加到小说列表
        this.novels.push({
          id: novelId,
          title: novelStructure.title,
          author: novelStructure.author,
          wordCount: novelStructure.metadata.wordCount,
          chapterCount: novelStructure.chapters.length,
          createdAt: new Date().toISOString()
        });

        return this.currentNovel;
      } catch (error) {
        this.parseStatus = 'failed';
        this.parseMessage = '解析失败: ' + error.message;
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // 加载已存储的小说
    async loadNovel(novelId) {
      this.isLoading = true;
      this.error = null;

      try {
        const novelStructure = await NovelParser.retrieveNovelStructure(novelId);
        if (novelStructure) {
          this.currentNovel = {
            id: novelId,
            ...novelStructure
          };
        }
        return this.currentNovel;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // 获取章节内容
    getChapter(chapterId) {
      if (!this.currentNovel) return null;
      return this.currentNovel.chapters.find(c => c.id === chapterId);
    },

    // 获取场景内容
    getScene(sceneId) {
      if (!this.currentNovel) return null;
      for (const chapter of this.currentNovel.chapters) {
        const scene = chapter.scenes?.find(s => s.id === sceneId);
        if (scene) return scene;
      }
      return null;
    },

    // 加载所有已存储的小说列表
    loadNovelsList() {
      const stored = localStorage.getItem('novels_list');
      if (stored) {
        this.novels = JSON.parse(stored);
      }
    },

    // 删除小说
    deleteNovel(novelId) {
      localStorage.removeItem(`novel_${novelId}`);
      this.novels = this.novels.filter(n => n.id !== novelId);
      localStorage.setItem('novels_list', JSON.stringify(this.novels));
      
      if (this.currentNovel?.id === novelId) {
        this.currentNovel = null;
      }
    },

    // 重置解析状态
    resetParseState() {
      this.parseProgress = 0;
      this.parseStatus = 'idle';
      this.parseMessage = '';
      this.error = null;
    },

    // 清除错误
    clearError() {
      this.error = null;
    }
  }
});
