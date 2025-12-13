<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useReviewStore } from '@/stores/reviewStore'
import { reviewApi } from '@/services/api'
import ThreeDimensionalRating from '@/components/ThreeDimensionalRating.vue'

const route = useRoute()
const reviewStore = useReviewStore()
const reviewId = route.params.id as string
const comments = ref<any[]>([])
const newComment = ref('')

onMounted(async () => {
  await reviewStore.fetchReview(reviewId)
  const result = await reviewApi.getComments(reviewId) as any
  comments.value = result.comments || []
})

async function submitComment() {
  if (!newComment.value.trim()) return
  try {
    await reviewApi.addComment(reviewId, { content: newComment.value })
    newComment.value = ''
    const result = await reviewApi.getComments(reviewId) as any
    comments.value = result.comments || []
  } catch (e) {
    console.error('Failed to submit comment:', e)
  }
}
</script>

<template>
  <q-page class="page-container">
    <div v-if="reviewStore.loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else-if="reviewStore.currentReview">
      <article class="review-detail">
        <!-- 书籍信息 -->
        <router-link v-if="reviewStore.currentReview.book" :to="`/books/${reviewStore.currentReview.bookId}`" class="book-link q-mb-md">
          <q-chip icon="menu_book" color="secondary" text-color="white">
            {{ reviewStore.currentReview.book.title }}
          </q-chip>
        </router-link>
        
        <!-- 作者和时间 -->
        <div class="flex items-center q-mb-md">
          <q-avatar size="40px" color="primary" text-color="white">
            {{ reviewStore.currentReview.author?.userFullName?.charAt(0) || 'U' }}
          </q-avatar>
          <div class="q-ml-sm">
            <div class="text-subtitle2">{{ reviewStore.currentReview.author?.userFullName || '匿名用户' }}</div>
            <div class="text-caption text-grey">{{ reviewStore.currentReview.createdAt }}</div>
          </div>
          <q-space />
          <span v-if="reviewStore.currentReview.isFeatured" class="featured-badge">精选</span>
        </div>
        
        <!-- 三维评分 -->
        <div class="q-mb-md">
          <ThreeDimensionalRating :rating="reviewStore.currentReview.rating" readonly />
        </div>
        
        <!-- 书评内容 -->
        <div class="review-content q-mb-lg" v-html="reviewStore.currentReview.content"></div>
        
        <q-separator class="q-my-lg" />
        
        <!-- 评论区 -->
        <section>
          <h3 class="text-h6 q-mb-md">讨论 ({{ comments.length }})</h3>
          
          <!-- 评论输入 -->
          <div class="q-mb-lg">
            <q-input
              v-model="newComment"
              type="textarea"
              outlined
              placeholder="分享你的看法..."
              :rows="3"
            />
            <div class="flex justify-end q-mt-sm">
              <q-btn color="primary" label="发表评论" @click="submitComment" :disable="!newComment.trim()" />
            </div>
          </div>
          
          <!-- 评论列表 -->
          <q-list separator>
            <q-item v-for="comment in comments" :key="comment.commentId">
              <q-item-section avatar>
                <q-avatar color="grey" text-color="white" size="32px">U</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label v-if="comment.quotedText" class="text-italic text-grey q-mb-xs">
                  "{{ comment.quotedText }}"
                </q-item-label>
                <q-item-label>{{ comment.content }}</q-item-label>
                <q-item-label caption>{{ comment.createdAt }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          
          <div v-if="!comments.length" class="text-grey text-center q-pa-md">
            暂无评论，来发起讨论吧！
          </div>
        </section>
      </article>
    </template>
  </q-page>
</template>

<style lang="scss" scoped>
.book-link {
  text-decoration: none;
}
</style>
