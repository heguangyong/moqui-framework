<template>
  <q-footer class="bottom-nav-bar">
    <q-tabs
      v-model="activeTab"
      class="nav-tabs"
      active-color="secondary"
      indicator-color="transparent"
      align="justify"
      narrow-indicator
    >
      <q-tab
        name="hall"
        icon="local_shipping"
        label="订单大厅"
        @click="navigateTo('/marketplace')"
      />
      <q-tab
        name="publish"
        icon="add_circle_outline"
        label="发布"
        @click="navigateTo('/marketplace/publish')"
      />
      <q-tab
        name="profile"
        icon="person_outline"
        label="我的"
        @click="navigateTo('/marketplace/profile')"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeTab = ref('hall')

// 根据当前路由设置激活的 tab
const updateActiveTab = () => {
  const path = route.path
  if (path.includes('/marketplace/publish')) {
    activeTab.value = 'publish'
  } else if (path.includes('/marketplace/profile') || path.includes('/marketplace/push')) {
    activeTab.value = 'profile'
  } else {
    activeTab.value = 'hall'
  }
}

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.bottom-nav-bar {
  background: linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-tabs {
  :deep(.q-tab) {
    color: rgba(255, 255, 255, 0.5);
    min-height: 56px;
    
    .q-tab__icon {
      font-size: 24px;
    }
    
    .q-tab__label {
      font-size: 11px;
      margin-top: 2px;
    }
  }
  
  :deep(.q-tab--active) {
    color: #00D4AA;
  }
}
</style>
