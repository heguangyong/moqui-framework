import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue')
    },
    {
      path: '/books',
      name: 'books',
      component: () => import('@/pages/BooksPage.vue')
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: () => import('@/pages/BookDetailPage.vue')
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/pages/ReviewsPage.vue')
    },
    {
      path: '/reviews/:id',
      name: 'review-detail',
      component: () => import('@/pages/ReviewDetailPage.vue')
    },
    {
      path: '/reviews/new',
      name: 'review-new',
      component: () => import('@/pages/ReviewEditorPage.vue')
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: () => import('@/pages/BookshelfPage.vue')
    },
    {
      path: '/drafts',
      name: 'drafts',
      component: () => import('@/pages/DraftsPage.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/ProfilePage.vue')
    }
  ]
})

export default router
