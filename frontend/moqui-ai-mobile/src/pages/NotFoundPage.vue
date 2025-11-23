<template>
  <q-page class="not-found-page column items-center justify-center">
    <q-icon name="sentiment_dissatisfied" size="120px" color="grey-5" class="q-mb-lg"/>
    <div class="text-h4 text-center q-mb-md">404</div>
    <div class="text-h6 text-grey-6 text-center q-mb-xl">页面未找到</div>
    <q-btn
      @click="$router.push('/')"
      label="返回首页"
      color="primary"/>
  </q-page>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
}
</style>