<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { draftApi } from '@/services/api'

const router = useRouter()
const drafts = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await draftApi.list() as any
    drafts.value = result.drafts || []
  } catch (e) {
    console.error('Failed to load drafts:', e)
  } finally {
    loading.value = false
  }
})

async function deleteDraft(draftId: string) {
  if (!confirm('确定删除此草稿？')) return
  try {
    await draftApi.delete(draftId)
    drafts.value = drafts.value.filter((d: any) => d.draftId !== draftId)
  } catch (e) {
    console.error('Failed to delete draft:', e)
  }
}

function editDraft(draft: any) {
  router.push({ path: '/reviews/new', query: { bookId: draft.bookId, draftId: draft.draftId } })
}
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">草稿箱</h1>
    
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else>
      <q-list separator v-if="drafts.length">
        <q-item v-for="draft in drafts" :key="draft.draftId" clickable @click="editDraft(draft)">
          <q-item-section>
            <q-item-label>{{ draft.bookTitle || '未选择书籍' }}</q-item-label>
            <q-item-label caption lines="2">
              {{ draft.content?.replace(/<[^>]*>/g, '').substring(0, 100) }}...
            </q-item-label>
            <q-item-label caption>
              {{ draft.wordCount || 0 }} 字 · 保存于 {{ draft.updatedAt }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round icon="delete" color="negative" @click.stop="deleteDraft(draft.draftId)" />
          </q-item-section>
        </q-item>
      </q-list>
      
      <div v-else class="text-grey text-center q-pa-xl">
        <q-icon name="edit_note" size="64px" class="q-mb-md" />
        <p>暂无草稿</p>
        <q-btn color="primary" label="开始写书评" to="/reviews/new" />
      </div>
    </template>
  </q-page>
</template>
