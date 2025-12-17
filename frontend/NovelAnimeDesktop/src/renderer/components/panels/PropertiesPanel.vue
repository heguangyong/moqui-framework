<template>
  <div class="properties-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">属性面板</q-toolbar-title>
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div v-if="selectedItem" class="properties-content">
        <q-list>
          <q-item-label header>基本属性</q-item-label>
          
          <q-item>
            <q-item-section>
              <q-input
                v-model="selectedItem.name"
                label="名称"
                dense
                @update:model-value="onPropertyChanged"
              />
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-input
                v-model="selectedItem.description"
                label="描述"
                type="textarea"
                dense
                @update:model-value="onPropertyChanged"
              />
            </q-item-section>
          </q-item>

          <q-item v-if="selectedItem.type">
            <q-item-section>
              <q-select
                v-model="selectedItem.type"
                :options="typeOptions"
                label="类型"
                dense
                @update:model-value="onPropertyChanged"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      
      <div v-else class="no-selection">
        <q-icon name="tune" size="48px" color="grey-5" />
        <div class="text-grey-6">选择一个项目以查看属性</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  selectedItem?: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'property-changed': [property: any];
}>();

// State
const selectedItem = ref(props.selectedItem);
const typeOptions = ['文件', '文件夹', '角色', '场景', '素材'];

// Methods
const onPropertyChanged = () => {
  emit('property-changed', selectedItem.value);
};

// Watchers
watch(() => props.selectedItem, (newItem) => {
  selectedItem.value = newItem;
});
</script>

<style scoped>
.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.properties-content {
  padding: 8px;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}
</style>