<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NetworkStatus from './components/common/NetworkStatus.vue'
import BottomNavBar from './components/common/BottomNavBar.vue'

const route = useRoute()

// 需要显示底部导航的页面
const showBottomNav = computed(() => {
  const path = route.path
  // 这些页面不显示底部导航
  const hideNavPaths = ['/login', '/execution']
  
  // 订单详情页也不显示（但订单大厅要显示）
  const isOrderDetail = /^\/marketplace\/order\/[^/]+$/.test(path)
  
  // marketplace 相关页面显示底部导航（除了上面排除的）
  const isMarketplace = path === '/marketplace' || path.startsWith('/marketplace/')
  
  return isMarketplace && !hideNavPaths.some(p => path.includes(p)) && !isOrderDetail
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <!-- Network Status Banner - Requirements 5.1 -->
    <NetworkStatus
      position="top"
      :auto-hide="true"
      :auto-hide-delay="3000"
    />

    <q-page-container>
      <RouterView />
    </q-page-container>

    <!-- 底部导航栏 -->
    <q-footer v-if="showBottomNav" class="bottom-nav-footer">
      <BottomNavBar />
    </q-footer>
  </q-layout>
</template>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
