<script setup lang="ts">
defineProps<{
  review: {
    reviewId: string
    content: string
    rating: {
      thoughtDepth: number
      expressionQuality: number
      readability: number
    }
    wordCount?: number
    isFeatured?: boolean
    createdAt?: string
    author?: { userFullName?: string; username?: string }
    book?: { title?: string; author?: string }
  }
}>()

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '') || ''
}
</script>

<template>
  <router-link :to="`/reviews/${review.reviewId}`" class="review-card babelio-card">
    <div class="review-header">
      <div class="author-info">
        <q-avatar size="32px" color="primary" text-color="white">
          {{ review.author?.userFullName?.charAt(0) || 'U' }}
        </q-avatar>
        <div class="author-text">
          <span class="author-name">{{ review.author?.userFullName || '匿名用户' }}</span>
          <span class="review-date">{{ review.createdAt }}</span>
        </div>
      </div>
      <span v-if="review.isFeatured" class="featured-badge">精选</span>
    </div>
    
    <div v-if="review.book" class="book-ref">
      <q-icon name="menu_book" size="14px" />
      {{ review.book.title }}
    </div>
    
    <div class="review-rating">
      <span class="rating-item">
        <span class="label">思想</span>
        <q-rating :model-value="review.rating.thoughtDepth" readonly size="12px" color="accent" />
      </span>
      <span class="rating-item">
        <span class="label">表达</span>
        <q-rating :model-value="review.rating.expressionQuality" readonly size="12px" color="accent" />
      </span>
      <span class="rating-item">
        <span class="label">可读</span>
        <q-rating :model-value="review.rating.readability" readonly size="12px" color="accent" />
      </span>
    </div>
    
    <p class="review-excerpt">{{ stripHtml(review.content).substring(0, 200) }}...</p>
    
    <div class="review-footer">
      <span class="word-count">{{ review.wordCount || 0 }} 字</span>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
.review-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-text {
  display: flex;
  flex-direction: column;
  
  .author-name {
    font-size: 14px;
    font-weight: 500;
  }
  
  .review-date {
    font-size: 12px;
    color: #999;
  }
}

.book-ref {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #8B4513;
  margin-bottom: 8px;
}

.review-rating {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  
  .rating-item {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .label {
      font-size: 12px;
      color: #666;
    }
  }
}

.review-excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 12px;
}

.review-footer {
  font-size: 12px;
  color: #999;
}
</style>
