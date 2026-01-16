<template>
  <div 
    class="responsive-container"
    :class="containerClasses"
  >
    <slot 
      :breakpoint="state.breakpoint"
      :isMobile="state.isMobile"
      :isTablet="state.isTablet"
      :isDesktop="state.isDesktop"
      :width="state.width"
      :height="state.height"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsive, useResponsiveClasses } from '../../composables/useResponsive'

const props = defineProps({
  /**
   * Apply container max-width constraints
   */
  constrained: {
    type: Boolean,
    default: false
  },
  
  /**
   * Apply responsive padding
   */
  padded: {
    type: Boolean,
    default: false
  },
  
  /**
   * Custom CSS classes
   */
  customClass: {
    type: String,
    default: ''
  }
})

const { state } = useResponsive()
const responsiveClasses = useResponsiveClasses()

const containerClasses = computed(() => ({
  ...responsiveClasses.value,
  'container': props.constrained,
  'spacing-responsive': props.padded,
  [props.customClass]: !!props.customClass
}))
</script>

<style scoped>
.responsive-container {
  width: 100%;
  height: 100%;
}
</style>
