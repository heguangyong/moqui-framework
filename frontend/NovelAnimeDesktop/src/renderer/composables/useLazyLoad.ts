/**
 * Lazy Load Composable
 * 懒加载 - 用于优化组件和图片加载
 * 
 * Requirements: 9.2
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useLazyLoad(
  targetRef: Ref<HTMLElement | null>,
  callback: () => void,
  options: LazyLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = '50px', once = true } = options

  const isVisible = ref(false)
  const hasLoaded = ref(false)
  let observer: IntersectionObserver | null = null

  function handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        isVisible.value = true

        if (!hasLoaded.value) {
          callback()
          hasLoaded.value = true

          if (once && observer && targetRef.value) {
            observer.unobserve(targetRef.value)
          }
        }
      } else {
        isVisible.value = false
      }
    })
  }

  onMounted(() => {
    if (!targetRef.value) return

    observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observer.observe(targetRef.value)
  })

  onUnmounted(() => {
    if (observer && targetRef.value) {
      observer.unobserve(targetRef.value)
      observer.disconnect()
    }
  })

  return {
    isVisible,
    hasLoaded
  }
}

/**
 * 懒加载图片
 */
export function useLazyImage(
  imageRef: Ref<HTMLImageElement | null>,
  src: string,
  options: LazyLoadOptions = {}
) {
  const loaded = ref(false)
  const error = ref(false)

  const { isVisible } = useLazyLoad(
    imageRef,
    () => {
      if (!imageRef.value || loaded.value) return

      const img = imageRef.value
      img.src = src

      img.onload = () => {
        loaded.value = true
      }

      img.onerror = () => {
        error.value = true
      }
    },
    options
  )

  return {
    isVisible,
    loaded,
    error
  }
}
