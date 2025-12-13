<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '@/stores/bookStore'
import { useReviewStore } from '@/stores/reviewStore'
import { draftApi } from '@/services/api'
import ThreeDimensionalRating from '@/components/ThreeDimensionalRating.vue'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const reviewStore = useReviewStore()

const bookId = ref(route.query.bookId as string || '')
const content = ref('')
const rating = ref({ thoughtDepth: 0, expressionQuality: 0, readability: 0 })
const wordCount = ref(0)
const saving = ref(false)
const lastSaved = ref<Date | null>(null)

const MIN_WORD_COUNT = 500

// 计算字数
watch(content, (val) => {
  wordCount.value = val.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length
})

// 自动保存草稿
let autoSaveTimer: number | null = null
watch(content, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(saveDraft, 30000) // 30秒自动保存
})

onMounted(async () => {
  if (bookId.value) {
    await bookStore.fetchBook(bookId.value)
  }
})

async function saveDraft() {
  if (!content.value.trim()) return
  saving.value = true
  try {
    await draftApi.save({
      bookId: bookId.value,
      content: content.value,
      thoughtDepth: rating.value.thoughtDepth,
      expressionQuality: rating.value.expressionQuality,
      readability: rating.value.readability
    })
    lastSaved.value = new Date()
  } catch (e) {
    console.error('Failed to save draft:', e)
  } finally {
    saving.value = false
  }
}

async function submitReview() {
  if (wordCount.value < MIN_WORD_COUNT) {
    alert(`书评字数不能少于${MIN_WORD_COUNT}字，当前${wordCount.value}字`)
    return
  }
  if (!rating.value.thoughtDepth || !rating.value.expressionQuality || !rating.value.readability) {
    alert('请完成三维评分')
    return
  }
  
  try {
    await reviewStore.createReview({
      bookId: bookId.value,
      content: content.value,
      ...rating.value
    })
    router.push(`/books/${bookId.value}`)
  } catch (e) {
    console.error('Failed to submit review:', e)
    alert('提交失败，请重试')
  }
}
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">写书评</h1>
    
    <!-- 书籍信息 -->
    <div v-if="bookStore.currentBook" class="babelio-card q-mb-md">
      <div class="flex items-center">
        <q-icon name="menu_book" size="24px" class="q-mr-sm" />
        <span class="text-subtitle1">{{ bookStore.currentBook.title }}</span>
        <span class="text-grey q-ml-sm">{{ bookStore.currentBook.author }}</span>
      </div>
    </div>
    
    <!-- 三维评分 -->
    <div class="babelio-card q-mb-md">
      <h3 class="text-subtitle1 q-mb-md">评分</h3>
      <ThreeDimensionalRating v-model:rating="rating" />
    </div>
    
    <!-- 写作提示 -->
    <q-expansion-item label="写作结构提示" icon="lightbulb" class="q-mb-md">
      <q-card>
        <q-card-section>
          <ul class="text-body2">
            <li>开篇：简述阅读背景和整体印象</li>
            <li>内容概述：核心观点或故事梗概（避免剧透）</li>
            <li>深度分析：思想价值、写作技巧、独特见解</li>
            <li>个人感悟：阅读收获和推荐理由</li>
          </ul>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    
    <!-- 编辑器 -->
    <div class="babelio-card">
      <q-input
        v-model="content"
        type="textarea"
        outlined
        placeholder="开始写你的书评..."
        :rows="15"
        autogrow
      />
      
      <div class="flex items-center justify-between q-mt-sm">
        <div class="text-caption" :class="wordCount < MIN_WORD_COUNT ? 'text-negative' : 'text-positive'">
          {{ wordCount }} / {{ MIN_WORD_COUNT }} 字
        </div>
        <div class="text-caption text-grey">
          <span v-if="saving">保存中...</span>
          <span v-else-if="lastSaved">已保存于 {{ lastSaved.toLocaleTimeString() }}</span>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="flex justify-end q-mt-lg q-gutter-sm">
      <q-btn flat label="保存草稿" @click="saveDraft" :loading="saving" />
      <q-btn color="primary" label="发布书评" @click="submitReview" :disable="wordCount < MIN_WORD_COUNT" />
    </div>
  </q-page>
</template>
