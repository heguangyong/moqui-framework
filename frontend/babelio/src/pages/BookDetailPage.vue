<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBookStore } from '@/stores/bookStore'
import { useReviewStore } from '@/stores/reviewStore'
import { bookshelfApi } from '@/services/api'
import { Notify } from 'quasar'
import ThreeDimensionalRating from '@/components/ThreeDimensionalRating.vue'
import ReviewCard from '@/components/ReviewCard.vue'

const route = useRoute()
const bookStore = useBookStore()
const reviewStore = useReviewStore()
const bookId = route.params.id as string

const showShelfDialog = ref(false)
const selectedStatus = ref('want-to-read')
const addingToShelf = ref(false)

const statusOptions = [
  { label: '想读', value: 'want-to-read' },
  { label: '在读', value: 'reading' },
  { label: '已读', value: 'finished' }
]

async function addToBookshelf() {
  addingToShelf.value = true
  try {
    await bookshelfApi.add({ bookId, status: selectedStatus.value })
    Notify.create({ type: 'positive', message: '已加入书架' })
    showShelfDialog.value = false
  } catch (e: any) {
    Notify.create({ type: 'negative', message: e.response?.data?.errors || '加入书架失败' })
  } finally {
    addingToShelf.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    bookStore.fetchBook(bookId),
    reviewStore.fetchReviews({ bookId })
  ])
})
</script>

<template>
  <q-page class="page-container">
    <div v-if="bookStore.loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else-if="bookStore.currentBook">
      <div class="book-detail">
        <div class="flex q-mb-lg">
          <q-img
            v-if="bookStore.currentBook.coverUrl"
            :src="bookStore.currentBook.coverUrl"
            class="book-cover"
            style="width: 150px; height: 220px"
          />
          <div v-else class="book-cover-placeholder" style="width: 150px; height: 220px">
            <q-icon name="menu_book" size="48px" color="grey" />
          </div>
          
          <div class="q-ml-lg flex-1">
            <h1 class="text-h5 q-mb-sm">{{ bookStore.currentBook.title }}</h1>
            <p class="text-subtitle1 text-grey-7">{{ bookStore.currentBook.author }}</p>
            <p class="text-body2 text-grey-6">
              {{ bookStore.currentBook.publisher }} · {{ bookStore.currentBook.publishDate }}
            </p>
            <p class="text-body2 text-grey-6">ISBN: {{ bookStore.currentBook.isbn }}</p>
            
            <div class="q-mt-md">
              <ThreeDimensionalRating :rating="bookStore.currentBook.rating" readonly />
            </div>
            
            <div class="q-mt-md">
              <q-btn color="primary" label="写书评" :to="`/reviews/new?bookId=${bookId}`" />
              <q-btn flat color="secondary" label="加入书架" class="q-ml-sm" @click="showShelfDialog = true" />
            </div>
          </div>
        </div>
        
        <div v-if="bookStore.currentBook.description" class="babelio-card q-mb-lg">
          <h3 class="text-subtitle1 q-mb-sm">简介</h3>
          <p class="text-body2">{{ bookStore.currentBook.description }}</p>
        </div>
        
        <section>
          <h2 class="text-h6 q-mb-md">书评 ({{ reviewStore.totalCount }})</h2>
          <div class="review-list">
            <ReviewCard v-for="review in reviewStore.reviews" :key="review.reviewId" :review="review" />
          </div>
          <div v-if="!reviewStore.reviews.length" class="text-grey text-center q-pa-md">
            暂无书评，成为第一个评论者吧！
          </div>
        </section>
      </div>
    </template>

    <!-- 加入书架对话框 -->
    <q-dialog v-model="showShelfDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">加入书架</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="selectedStatus"
            :options="statusOptions"
            emit-value
            map-options
            label="阅读状态"
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="primary" label="确定" :loading="addingToShelf" @click="addToBookshelf" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style lang="scss" scoped>
.book-cover-placeholder {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
</style>
