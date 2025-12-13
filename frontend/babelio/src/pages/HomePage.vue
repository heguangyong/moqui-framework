<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { homeApi } from '@/services/api'
import BookCard from '@/components/BookCard.vue'
import ReviewCard from '@/components/ReviewCard.vue'

const featuredBooks = ref<any[]>([])
const featuredReviews = ref<any[]>([])
const discussing = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [booksRes, reviewsRes, discussingRes] = await Promise.all([
      homeApi.getFeaturedBooks(),
      homeApi.getFeaturedReviews(),
      homeApi.getDiscussing()
    ]) as any[]
    featuredBooks.value = booksRes.books || []
    featuredReviews.value = reviewsRes.reviews || []
    discussing.value = discussingRes.items || []
  } catch (e) {
    console.error('Failed to load home data:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page class="page-container">
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else>
      <!-- 编辑推荐书籍 -->
      <section class="q-mb-lg">
        <h2 class="text-h6 q-mb-md">编辑推荐</h2>
        <div class="book-grid">
          <BookCard v-for="book in featuredBooks" :key="book.bookId" :book="book" />
        </div>
        <div v-if="!featuredBooks.length" class="text-grey text-center q-pa-md">
          暂无推荐书籍
        </div>
      </section>

      <!-- 精选书评 -->
      <section class="q-mb-lg">
        <h2 class="text-h6 q-mb-md">精选书评</h2>
        <div class="review-list">
          <ReviewCard v-for="review in featuredReviews" :key="review.reviewId" :review="review" />
        </div>
        <div v-if="!featuredReviews.length" class="text-grey text-center q-pa-md">
          暂无精选书评
        </div>
      </section>

      <!-- 正在讨论 -->
      <section>
        <h2 class="text-h6 q-mb-md">正在讨论</h2>
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="item in discussing" :key="item.reviewId" clickable :to="`/reviews/${item.reviewId}`">
            <q-item-section>
              <q-item-label>{{ item.bookTitle }}</q-item-label>
              <q-item-label caption>{{ item.commentCount }} 条讨论</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="!discussing.length" class="text-grey text-center q-pa-md">
          暂无热门讨论
        </div>
      </section>
    </template>
  </q-page>
</template>
