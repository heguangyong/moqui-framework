<template>
  <div class="asset-browser">
    <div class="browser-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">素材浏览器</q-toolbar-title>
        <q-btn flat round dense icon="refresh" @click="refreshAssets" />
        <q-btn flat round dense icon="add" @click="addAsset" />
      </q-toolbar>
    </div>

    <div class="browser-content">
      <q-list>
        <q-item
          v-for="asset in assets"
          :key="asset.id"
          clickable
          @click="selectAsset(asset)"
          :class="{ 'bg-blue-1': selectedAsset?.id === asset.id }"
        >
          <q-item-section avatar>
            <q-icon :name="getAssetIcon(asset.type)" :color="getAssetColor(asset.type)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ asset.name }}</q-item-label>
            <q-item-label caption>{{ asset.description }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip dense size="sm" :color="getTypeColor(asset.type)">
              {{ getTypeLabel(asset.type) }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Asset {
  id: string;
  name: string;
  type: string;
  description: string;
  path: string;
}

interface Props {
  assets?: Asset[];
}

const props = withDefaults(defineProps<Props>(), {
  assets: () => []
});

const emit = defineEmits<{
  'asset-selected': [asset: Asset];
}>();

// State
const selectedAsset = ref<Asset | null>(null);
const assets = ref<Asset[]>([]);

// Methods
const refreshAssets = () => {
  // 模拟加载素材
  assets.value = [
    {
      id: '1',
      name: '角色设定图',
      type: 'image',
      description: '主角角色设定参考图',
      path: '/assets/characters/protagonist.jpg'
    },
    {
      id: '2',
      name: '背景音乐',
      type: 'audio',
      description: '开场背景音乐',
      path: '/assets/audio/opening.mp3'
    },
    {
      id: '3',
      name: '特效素材',
      type: 'video',
      description: '爆炸特效视频',
      path: '/assets/effects/explosion.mp4'
    }
  ];
};

const addAsset = () => {
  console.log('添加新素材');
};

const selectAsset = (asset: Asset) => {
  selectedAsset.value = asset;
  emit('asset-selected', asset);
};

const getAssetIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    image: 'image',
    audio: 'audiotrack',
    video: 'movie',
    document: 'description'
  };
  return iconMap[type] || 'insert_drive_file';
};

const getAssetColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    image: 'purple',
    audio: 'orange',
    video: 'red',
    document: 'blue'
  };
  return colorMap[type] || 'grey';
};

const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    image: 'purple-2',
    audio: 'orange-2',
    video: 'red-2',
    document: 'blue-2'
  };
  return colorMap[type] || 'grey-2';
};

const getTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    image: '图片',
    audio: '音频',
    video: '视频',
    document: '文档'
  };
  return labelMap[type] || '未知';
};

// Lifecycle
onMounted(() => {
  refreshAssets();
});
</script>

<style scoped>
.asset-browser {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.browser-header {
  flex-shrink: 0;
}

.browser-content {
  flex: 1;
  overflow-y: auto;
}
</style>