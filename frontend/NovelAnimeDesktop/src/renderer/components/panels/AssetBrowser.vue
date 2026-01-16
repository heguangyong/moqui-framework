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
const refreshAssets = async () => {
  // 从后端加载素材
  const novelId = localStorage.getItem('novel_anime_current_novel_id');
  if (!novelId) {
    assets.value = [];
    return;
  }
  
  try {
    // 加载角色作为素材
    const response = await fetch(`http://localhost:8080/rest/s1/novel-anime/characters?novelId=${novelId}`);
    if (response.ok) {
      const data = await response.json();
      assets.value = (data.characters || []).map((c: any) => ({
        id: c.characterId,
        name: c.name,
        type: 'image',
        description: c.description || '角色',
        path: c.imagePath || ''
      }));
    } else {
      assets.value = [];
    }
  } catch (e) {
    console.warn('加载素材失败:', e);
    assets.value = [];
  }
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