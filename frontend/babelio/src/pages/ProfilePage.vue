<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const contributions = ref<any>(null)
const loading = ref(true)

const user = computed(() => authStore.user)
const isLoggedIn = computed(() => authStore.isLoggedIn)

onMounted(async () => {
  if (!isLoggedIn.value) {
    loading.value = false
    return
  }
  try {
    await authStore.checkAuth()
    if (authStore.user?.userId) {
      const contribResult = await userApi.getContributions(authStore.user.userId) as any
      contributions.value = contribResult.contribution
    }
  } catch (e) {
    console.error('Failed to load profile:', e)
  } finally {
    loading.value = false
  }
})

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <q-page class="page-container">
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else-if="user">
      <!-- 用户信息 -->
      <div class="babelio-card q-mb-lg">
        <div class="flex items-center">
          <q-avatar size="64px" color="primary" text-color="white">
            {{ user.userFullName?.charAt(0) || 'U' }}
          </q-avatar>
          <div class="q-ml-md">
            <h2 class="text-h6 q-mb-xs">{{ user.userFullName || user.username }}</h2>
            <p class="text-grey">@{{ user.username }}</p>
          </div>
        </div>
      </div>
      
      <!-- 贡献统计 -->
      <div class="babelio-card q-mb-lg" v-if="contributions">
        <h3 class="text-subtitle1 q-mb-md">贡献统计</h3>
        <div class="row q-col-gutter-md">
          <div class="col-4 text-center">
            <div class="text-h5 text-primary">{{ contributions.reviewCount || 0 }}</div>
            <div class="text-caption text-grey">书评数</div>
          </div>
          <div class="col-4 text-center">
            <div class="text-h5 text-primary">{{ contributions.totalWordCount || 0 }}</div>
            <div class="text-caption text-grey">总字数</div>
          </div>
          <div class="col-4 text-center">
            <div class="text-h5 text-primary">{{ contributions.averageQualityScore?.toFixed(1) || '-' }}</div>
            <div class="text-caption text-grey">平均质量</div>
          </div>
        </div>
      </div>
      
      <!-- 快捷入口 -->
      <q-list bordered separator class="rounded-borders">
        <q-item clickable v-ripple to="/bookshelf">
          <q-item-section avatar><q-icon name="collections_bookmark" /></q-item-section>
          <q-item-section>我的书架</q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/drafts">
          <q-item-section avatar><q-icon name="edit_note" /></q-item-section>
          <q-item-section>草稿箱</q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="handleLogout">
          <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
          <q-item-section class="text-negative">退出登录</q-item-section>
        </q-item>
      </q-list>
    </template>
    
    <template v-else>
      <div class="text-center q-pa-xl">
        <q-icon name="person" size="64px" color="grey" class="q-mb-md" />
        <p class="text-grey">请先登录</p>
        <q-btn color="primary" label="登录" @click="goToLogin" />
      </div>
    </template>
  </q-page>
</template>
