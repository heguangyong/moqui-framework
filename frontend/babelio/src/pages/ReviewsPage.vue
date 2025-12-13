<script setup lang="ts">
import { onMounted } from 'vue'
import { useReviewStore } from '@/stores/reviewStore'
import ReviewCard from '@/components/ReviewCard.vue'

const reviewStore = useReviewStore()

onMounted(() => {
  reviewStore.fetchReviews()
})
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">书评</h1>
    
    <div v-if="reviewStore.loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else>
      <div class="review-list">
        <ReviewCard v-for="review in reviewStore.reviews" :key="review.reviewId" :review="review" />
      </div>
      
      <div v-if="!reviewStore.reviews.length" class="text-grey text-center q-pa-xl">
        暂无书评
      </div>
    </template>
  </q-page>
</template>
