<script setup lang="ts">
import { onMounted } from 'vue'
import { useBookStore } from '@/stores/bookStore'
import BookCard from '@/components/BookCard.vue'

const bookStore = useBookStore()

onMounted(() => {
  bookStore.fetchBooks()
})
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">书籍</h1>
    
    <div v-if="bookStore.loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else>
      <div class="book-grid">
        <BookCard v-for="book in bookStore.books" :key="book.bookId" :book="book" />
      </div>
      
      <div v-if="!bookStore.books.length" class="text-grey text-center q-pa-xl">
        暂无书籍
      </div>
      
      <div v-if="bookStore.totalCount > 20" class="flex justify-center q-mt-lg">
        <q-pagination
          v-model="currentPage"
          :max="Math.ceil(bookStore.totalCount / 20)"
          direction-links
        />
      </div>
    </template>
  </q-page>
</template>

<script lang="ts">
import { ref } from 'vue'
export default {
  setup() {
    const currentPage = ref(1)
    return { currentPage }
  }
}
</script>
