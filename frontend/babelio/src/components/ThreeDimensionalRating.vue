<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rating: {
    thoughtDepth: number | null
    expressionQuality: number | null
    readability: number | null
  }
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:rating': [value: { thoughtDepth: number; expressionQuality: number; readability: number }]
}>()

const dimensions = [
  { key: 'thoughtDepth', label: '思想深度', tooltip: '评价书籍的思想价值、观点深度和启发性' },
  { key: 'expressionQuality', label: '表达质量', tooltip: '评价作者的文字功底、叙述技巧和结构安排' },
  { key: 'readability', label: '可读性', tooltip: '评价阅读体验、流畅度和易理解程度' }
]

const localRating = computed({
  get: () => props.rating,
  set: (val) => emit('update:rating', val as any)
})

function updateDimension(key: string, value: number) {
  if (props.readonly) return
  emit('update:rating', {
    ...props.rating,
    [key]: value
  } as any)
}
</script>

<template>
  <div class="three-dimensional-rating">
    <div v-for="dim in dimensions" :key="dim.key" class="rating-dimension">
      <div class="dimension-label">
        <span>{{ dim.label }}</span>
        <q-icon name="help_outline" size="14px" color="grey">
          <q-tooltip>{{ dim.tooltip }}</q-tooltip>
        </q-icon>
      </div>
      <q-rating
        :model-value="(localRating as any)[dim.key] || 0"
        @update:model-value="(v: number) => updateDimension(dim.key, v)"
        :readonly="readonly"
        size="20px"
        color="accent"
        icon="star_border"
        icon-selected="star"
      />
      <span class="rating-value">{{ (localRating as any)[dim.key] || '-' }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.three-dimensional-rating {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rating-dimension {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-label {
  width: 80px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.rating-value {
  width: 20px;
  font-size: 14px;
  color: #999;
  text-align: center;
}
</style>
