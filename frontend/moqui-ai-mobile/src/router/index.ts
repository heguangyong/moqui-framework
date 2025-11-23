import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/hivemind',
      name: 'hivemind',
      component: () => import('@/pages/hivemind/ProjectDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/commerce',
      name: 'commerce',
      component: () => import('@/pages/commerce/CommerceDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/manufacturing',
      name: 'manufacturing',
      component: () => import('@/pages/manufacturing/ManufacturingDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: () => import('@/pages/marketplace/MessageSquare.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/marketplace/publish',
      name: 'marketplace-publish',
      component: () => import('@/pages/marketplace/PublishMessage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketplace/smart-matching',
      name: 'smart-matching',
      component: () => import('@/pages/marketplace/SmartMatching.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai/voice',
      name: 'voice-assistant',
      component: () => import('@/components/ai/VoiceAssistant.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai/image',
      name: 'image-analyzer',
      component: () => import('@/components/ai/ImageAnalyzer.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/api-test',
      name: 'api-test',
      component: () => import('@/pages/ApiTestPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue')
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isLoggedIn) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
