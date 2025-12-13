import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reviewApi } from '@/services/api'

export interface Review {
  reviewId: string
  bookId: string
  userId: string
  content: string
  rating: {
    thoughtDepth: number
    expressionQuality: number
    readability: number
  }
  wordCount: number
  qualityWeight: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  author?: { userId: string; username: string; userFullName: string }
  book?: { bookId: string; title: string; author: string; coverUrl?: string }
}

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<Review[]>([])
  const featuredReviews = ref<Review[]>([])
  const currentReview = ref<Review | null>(null)
  const loading = ref(false)
  const totalCount = ref(0)

  async function fetchReviews(params?: { bookId?: string; pageIndex?: number; pageSize?: number }) {
    loading.value = true
    try {
      const result = await reviewApi.list(params) as any
      reviews.value = result.reviewList || []
      totalCount.value = result.totalCount || 0
    } finally {
      loading.value = false
    }
  }

  async function fetchFeaturedReviews() {
    loading.value = true
    try {
      const result = await reviewApi.getFeatured() as any
      featuredReviews.value = result.reviews || []
    } finally {
      loading.value = false
    }
  }

  async function fetchReview(reviewId: string) {
    loading.value = true
    try {
      const result = await reviewApi.get(reviewId) as any
      currentReview.value = result.review
      return result.review
    } finally {
      loading.value = false
    }
  }

  async function createReview(data: any) {
    const result = await reviewApi.create(data)
    return result
  }

  async function updateReview(reviewId: string, data: any) {
    const result = await reviewApi.update(reviewId, data)
    return result
  }

  return {
    reviews, featuredReviews, currentReview, loading, totalCount,
    fetchReviews, fetchFeaturedReviews, fetchReview, createReview, updateReview
  }
})
