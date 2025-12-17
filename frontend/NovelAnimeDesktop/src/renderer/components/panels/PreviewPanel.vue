<template>
  <div class="preview-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">预览面板</q-toolbar-title>
        <q-btn flat round dense icon="fullscreen" @click="toggleFullscreen" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div v-if="previewData" class="preview-content">
        <!-- Image Preview -->
        <div v-if="previewData.type === 'image'" class="image-preview">
          <img :src="previewData.url" :alt="previewData.name" />
        </div>

        <!-- Video Preview -->
        <div v-else-if="previewData.type === 'video'" class="video-preview">
          <video :src="previewData.url" controls />
        </div>

        <!-- Text Preview -->
        <div v-else-if="previewData.type === 'text'" class="text-preview">
          <pre>{{ previewData.content }}</pre>
        </div>

        <!-- Default Preview -->
        <div v-else class="default-preview">
          <q-icon :name="getPreviewIcon(previewData.type)" size="64px" color="grey-5" />
          <div class="preview-info">
            <div class="preview-name">{{ previewData.name }}</div>
            <div class="preview-type">{{ previewData.type }}</div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-preview">
        <q-icon name="preview" size="48px" color="grey-5" />
        <div class="text-grey-6">选择一个项目以预览</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  previewData?: any;
}

const props = defineProps<Props>();

// Methods
const toggleFullscreen = () => {
  console.log('切换全屏预览');
};

const getPreviewIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    image: 'image',
    video: 'movie',
    audio: 'audiotrack',
    text: 'description',
    document: 'description'
  };
  return iconMap[type] || 'insert_drive_file';
};
</script>

<style scoped>
.preview-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
}

.preview-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.video-preview video {
  max-width: 100%;
  max-height: 100%;
}

.text-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: white;
  padding: 16px;
  border-radius: 4px;
}

.text-preview pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
}

.default-preview {
  text-align: center;
}

.preview-info {
  margin-top: 16px;
}

.preview-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.preview-type {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}
</style>