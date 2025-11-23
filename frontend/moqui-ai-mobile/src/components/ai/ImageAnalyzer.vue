<template>
  <ComingSoonPage
    title="AI图像识别"
    icon="camera_alt"
    color="secondary"
    :features="[
      '商品图像识别',
      '质量检测分析',
      '文档OCR识别',
      '设备状态检测',
      '实时图像处理'
    ]"/>
</template>

<script setup lang="ts">
import ComingSoonPage from '@/components/shared/ComingSoonPage.vue'
</script>