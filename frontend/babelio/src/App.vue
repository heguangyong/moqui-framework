<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const route = useRoute()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isMobile = computed(() => $q.screen.lt.md)

// 底部 Tab 配置
const tabs = [
  { name: 'home', path: '/', icon: 'home', label: '首页' },
  { name: 'books', path: '/books', icon: 'menu_book', label: '书籍' },
  { name: 'reviews', path: '/reviews', icon: 'rate_review', label: '书评' },
  { name: 'bookshelf', path: '/bookshelf', icon: 'collections_bookmark', label: '书架' },
  { name: 'profile', path: '/profile', icon: 'person', label: '我的' }
]

const activeTab = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  if (path.startsWith('/books')) return 'books'
  if (path.startsWith('/reviews') || path.startsWith('/drafts')) return 'reviews'
  if (path.startsWith('/bookshelf')) return 'bookshelf'
  if (path.startsWith('/profile') || path.startsWith('/login') || path.startsWith('/register')) return 'profile'
  return 'home'
})

const showBottomTabs = computed(() => {
  return isMobile.value && !['/login', '/register'].includes(route.path)
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <!-- 顶部导航栏 -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- 桌面端显示菜单按钮 -->
        <q-btn v-if="!isMobile" flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none">
            Babelio
          </router-link>
        </q-toolbar-title>
        <q-btn flat round icon="search" to="/search" />
        <!-- 桌面端显示登录/头像按钮 -->
        <template v-if="!isMobile">
          <q-btn v-if="isLoggedIn" flat round icon="person" to="/profile" />
          <q-btn v-else flat label="登录" to="/login" class="q-mr-sm" />
        </template>
      </q-toolbar>
    </q-header>

    <!-- 桌面端侧边栏 -->
    <q-drawer v-if="!isMobile" v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>导航</q-item-label>
        <q-item clickable v-ripple to="/">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>首页</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/books">
          <q-item-section avatar><q-icon name="menu_book" /></q-item-section>
          <q-item-section>书籍</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/reviews">
          <q-item-section avatar><q-icon name="rate_review" /></q-item-section>
          <q-item-section>书评</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/bookshelf">
          <q-item-section avatar><q-icon name="collections_bookmark" /></q-item-section>
          <q-item-section>我的书架</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/drafts">
          <q-item-section avatar><q-icon name="edit_note" /></q-item-section>
          <q-item-section>草稿箱</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 主内容区 -->
    <q-page-container :class="{ 'mobile-container': isMobile && showBottomTabs }">
      <RouterView />
    </q-page-container>

    <!-- 手机端底部 Tab 栏 -->
    <q-footer v-if="showBottomTabs" elevated class="bg-white bottom-tabs">
      <q-tabs
        :model-value="activeTab"
        class="text-grey-7"
        active-color="primary"
        indicator-color="transparent"
      >
        <q-route-tab
          v-for="tab in tabs"
          :key="tab.name"
          :name="tab.name"
          :to="tab.path"
          :icon="tab.icon"
          :label="tab.label"
          no-caps
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<style lang="scss">
.text-decoration-none {
  text-decoration: none;
}

// 手机端底部 Tab 样式
.bottom-tabs {
  .q-tabs {
    .q-tab {
      min-width: 0;
      padding: 8px 0;
      
      .q-tab__icon {
        font-size: 22px;
      }
      
      .q-tab__label {
        font-size: 10px;
        margin-top: 2px;
      }
    }
  }
}

// 手机端内容区底部留白
.mobile-container {
  padding-bottom: 56px;
}
</style>
