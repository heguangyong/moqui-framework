<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { bookshelfApi } from '@/services/api'

const bookshelf = ref<Record<string, any[]>>({
  'want-to-read': [],
  'reading': [],
  'finished': []
})
const loading = ref(true)
const activeTab = ref('want-to-read')

const statusLabels: Record<string, string> = {
  'want-to-read': '想读',
  'reading': '在读',
  'finished': '读过'
}

onMounted(async () => {
  try {
    const result = await bookshelfApi.get() as any
    bookshelf.value = result.bookshelf || {}
  } catch (e) {
    console.error('Failed to load bookshelf:', e)
  } finally {
    loading.value = false
  }
})

async function updateStatus(entryId: string, newStatus: string) {
  try {
    await bookshelfApi.updateStatus(entryId, { status: newStatus })
    // 重新加载
    const result = await bookshelfApi.get() as any
    bookshelf.value = result.bookshelf || {}
  } catch (e) {
    console.error('Failed to update status:', e)
  }
}

async function removeFromShelf(entryId: string) {
  try {
    await bookshelfApi.remove(entryId)
    const result = await bookshelfApi.get() as any
    bookshelf.value = result.bookshelf || {}
  } catch (e) {
    console.error('Failed to remove from shelf:', e)
  }
}
</script>

<template>
  <q-page class="page-container">
    <h1 class="text-h5 q-mb-md">我的书架</h1>
    
    <div v-if="loading" class="flex justify-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
    
    <template v-else>
      <q-tabs v-model="activeTab" class="q-mb-md" align="left">
        <q-tab v-for="(label, status) in statusLabels" :key="status" :name="status" :label="`${label} (${bookshelf[status]?.length || 0})`" />
      </q-tabs>
      
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel v-for="(label, status) in statusLabels" :key="status" :name="status">
          <q-list separator v-if="bookshelf[status]?.length">
            <q-item v-for="entry in bookshelf[status]" :key="entry.entryId">
              <q-item-section avatar>
                <q-icon name="menu_book" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  <router-link :to="`/books/${entry.bookId}`">{{ entry.bookId }}</router-link>
                </q-item-label>
                <q-item-label caption>
                  添加于 {{ entry.addedAt }}
                  <q-icon v-if="entry.isPrivate" name="lock" size="12px" class="q-ml-xs" />
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn-dropdown flat dense color="grey" icon="more_vert">
                  <q-list>
                    <q-item v-for="(l, s) in statusLabels" :key="s" clickable v-close-popup @click="updateStatus(entry.entryId, s)" :disable="s === status">
                      <q-item-section>{{ l }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="removeFromShelf(entry.entryId)">
                      <q-item-section class="text-negative">移除</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey text-center q-pa-xl">
            暂无{{ label }}的书籍
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-page>
</template>
