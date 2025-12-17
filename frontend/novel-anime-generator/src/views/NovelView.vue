<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Novel Parser</div>
    <div class="text-body1 text-grey-6 q-mb-lg">
      Upload and analyze novel structure for video generation
    </div>
    
    <q-card>
      <q-card-section>
        <div class="text-h6">Upload Novel</div>
        <div class="text-body2 text-grey-6 q-mb-md">
          Select a TXT file containing your novel
        </div>
        
        <q-file
          v-model="selectedFile"
          label="Choose novel file"
          accept=".txt"
          max-file-size="10485760"
          @rejected="onRejected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
        
        <div class="q-mt-md">
          <q-btn
            color="primary"
            label="Parse Novel"
            :disable="!selectedFile"
            @click="parseNovel"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const selectedFile = ref<File | null>(null)

function onRejected() {
  $q.notify({
    type: 'negative',
    message: 'File rejected. Please select a valid TXT file under 10MB.'
  })
}

function parseNovel() {
  if (!selectedFile.value) return
  
  $q.notify({
    type: 'info',
    message: 'Novel parsing will be implemented in subsequent tasks'
  })
}
</script>