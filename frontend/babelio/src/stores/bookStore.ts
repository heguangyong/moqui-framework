import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookApi } from '@/services/api'

export interface Book {
  bookId: string
  isbn: string
  title: string
  author: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  description?: string
  reviewCount: number
  rating: {
    thoughtDepth: number | null
    expressionQuality: number | null
    readability: number | null
  }
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const currentBook = ref<Book | null>(null)
  const loading = ref(false)
  const totalCount = ref(0)

  async function fetchBooks(params?: { pageIndex?: number; pageSize?: number; searchTerm?: string }) {
    loading.value = true
    try {
      const result = await bookApi.list(params) as any
      books.value = result.bookList || []
      totalCount.value = result.totalCount || 0
    } finally {
      loading.value = false
    }
  }

  async function fetchBook(bookId: string) {
    loading.value = true
    try {
      const result = await bookApi.get(bookId) as any
      currentBook.value = result.book
      return result.book
    } finally {
      loading.value = false
    }
  }

  async function searchBooks(queryString: string) {
    loading.value = true
    try {
      const result = await bookApi.search(queryString) as any
      books.value = result.bookList || []
      totalCount.value = result.totalCount || 0
    } finally {
      loading.value = false
    }
  }

  return { books, currentBook, loading, totalCount, fetchBooks, fetchBook, searchBooks }
})
