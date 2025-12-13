<script setup lang="ts">
defineProps<{
  book: {
    bookId: string
    title: string
    author: string
    coverUrl?: string
    reviewCount?: number
    rating?: {
      thoughtDepth: number | null
      expressionQuality: number | null
      readability: number | null
    }
  }
}>()

function getAverageRating(rating: any): string {
  if (!rating) return '-'
  const values = [rating.thoughtDepth, rating.expressionQuality, rating.readability].filter(v => v != null)
  if (!values.length) return '-'
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
}
</script>

<template>
  <router-link :to="`/books/${book.bookId}`" class="book-card">
    <div class="book-cover">
      <q-img v-if="book.coverUrl" :src="book.coverUrl" :ratio="2/3" />
      <div v-else class="cover-placeholder">
        <q-icon name="menu_book" size="32px" color="grey" />
      </div>
    </div>
    <div class="book-info">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-author">{{ book.author }}</p>
      <div class="book-meta">
        <span class="rating">
          <q-icon name="star" color="accent" size="14px" />
          {{ getAverageRating(book.rating) }}
        </span>
        <span class="review-count">{{ book.reviewCount || 0 }} 评</span>
      </div>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
.book-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.book-cover {
  aspect-ratio: 2/3;
  background: #f5f5f5;
  
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.book-info {
  padding: 12px;
}

.book-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  
  .rating {
    display: flex;
    align-items: center;
    gap: 2px;
  }
}
</style>
