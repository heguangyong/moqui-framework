<script setup lang="ts">
import { ref } from 'vue'
import { searchApi } from '@/services/api'
import BookCard from '@/components/BookCard.vue'
import ReviewCard from '@/components/ReviewCard.vue'

const query = ref('')
const searchType = ref('all')
const books = ref<any[]>([])
const reviews = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

async function doSearch() {
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const result = await searchApi.unified(query.value, searchType.value) as any
    books.value = result.books || []
    reviews.value = result.reviews || []
  } catch (e) {
    console.error('Search failed:', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">搜索</h1>
    
    <!-- 搜索框 -->
    <div class="q-mb-lg">
      <q-input
        v-model="query"
        outlined
        placeholder="搜索书籍或书评..."
        @keyup.enter="doSearch"
      >
        <template v-slot:append>
          <q-btn flat round icon="search" @click="doSearch" />
        </template>
      </q-input>
      
      <q-btn-toggle
        v-model="searchType"
        class="q-mt-sm"
        toggle-color="primary"
        :options="[
          { label: '全部', value: 'all' },
          { label: '书籍', value: 'books' },
          { label: '书评', value: 'reviews' }
        ]"
      />
    </div>
    
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else-if="searched">
      <!-- 书籍结果 -->
      <section v-if="searchType !== 'reviews' && books.length" class="q-mb-lg">
        <h2 class="text-h6 q-mb-md">书籍 ({{ books.length }})</h2>
        <div class="book-grid">
          <BookCard v-for="book in books" :key="book.bookId" :book="book" />
        </div>
      </section>
      
      <!-- 书评结果 -->
      <section v-if="searchType !== 'books' && reviews.length">
        <h2 class="text-h6 q-mb-md">书评 ({{ reviews.length }})</h2>
        <div class="review-list">
          <ReviewCard v-for="review in reviews" :key="review.reviewId" :review="review" />
        </div>
      </section>
      
      <div v-if="!books.length && !reviews.length" class="text-grey text-center q-pa-xl">
        未找到相关结果
      </div>
    </template>
  </q-page>
</template>
