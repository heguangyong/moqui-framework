<template>
  <q-page class="coming-soon-page column items-center justify-center">
    <q-icon :name="icon" size="120px" :color="color" class="q-mb-lg"/>

    <div class="text-h4 text-center q-mb-md">{{ title }}</div>
    <div class="text-h6 text-grey-6 text-center q-mb-xl">功能开发中，敬请期待</div>

    <q-card class="feature-preview q-pa-lg" style="max-width: 400px">
      <div class="text-h6 q-mb-md">即将推出的功能：</div>
      <q-list>
        <q-item v-for="feature in features" :key="feature">
          <q-item-section avatar>
            <q-icon name="check_circle" color="positive"/>
          </q-item-section>
          <q-item-section>{{ feature }}</q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-btn
      @click="$router.push('/')"
      label="返回首页"
      color="primary"
      class="q-mt-xl"/>
  </q-page>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon: string
  color: string
  features: string[]
}

defineProps<Props>()
</script>

<style scoped>
.coming-soon-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.feature-preview {
  border-radius: 16px;
}
</style>