/**
 * Responsive Layout Composable
 * 
 * Provides reactive breakpoint detection and responsive utilities
 * for adapting UI to different screen sizes.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// Breakpoint definitions (matching design system)
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices (phones, < 640px)
  sm: 640,    // Small devices (large phones, >= 640px)
  md: 768,    // Medium devices (tablets, >= 768px)
  lg: 1024,   // Large devices (desktops, >= 1024px)
  xl: 1280,   // Extra large devices (large desktops, >= 1280px)
  '2xl': 1536 // 2X Extra large devices (>= 1536px)
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export interface ResponsiveState {
  width: number
  height: number
  breakpoint: Breakpoint
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2xl: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
}

/**
 * Composable for responsive layout management
 */
export function useResponsive() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  // Current breakpoint
  const breakpoint = computed<Breakpoint>(() => {
    const w = width.value
    if (w >= BREAKPOINTS['2xl']) return '2xl'
    if (w >= BREAKPOINTS.xl) return 'xl'
    if (w >= BREAKPOINTS.lg) return 'lg'
    if (w >= BREAKPOINTS.md) return 'md'
    if (w >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })

  // Breakpoint flags
  const isXs = computed(() => breakpoint.value === 'xs')
  const isSm = computed(() => breakpoint.value === 'sm')
  const isMd = computed(() => breakpoint.value === 'md')
  const isLg = computed(() => breakpoint.value === 'lg')
  const isXl = computed(() => breakpoint.value === 'xl')
  const is2xl = computed(() => breakpoint.value === '2xl')

  // Device type flags
  const isMobile = computed(() => width.value < BREAKPOINTS.md)
  const isTablet = computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg)
  const isDesktop = computed(() => width.value >= BREAKPOINTS.lg)

  // Orientation
  const orientation = computed<'portrait' | 'landscape'>(() => {
    return height.value > width.value ? 'portrait' : 'landscape'
  })

  // Responsive state object
  const state = computed<ResponsiveState>(() => ({
    width: width.value,
    height: height.value,
    breakpoint: breakpoint.value,
    isXs: isXs.value,
    isSm: isSm.value,
    isMd: isMd.value,
    isLg: isLg.value,
    isXl: isXl.value,
    is2xl: is2xl.value,
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    orientation: orientation.value
  }))

  // Update dimensions on resize
  const updateDimensions = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  // Debounced resize handler
  let resizeTimeout: number | null = null
  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    resizeTimeout = window.setTimeout(updateDimensions, 150)
  }

  // Lifecycle
  onMounted(() => {
    window.addEventListener('resize', handleResize)
    updateDimensions()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  })

  /**
   * Check if current breakpoint is at least the specified breakpoint
   */
  const isAtLeast = (bp: Breakpoint): boolean => {
    return width.value >= BREAKPOINTS[bp]
  }

  /**
   * Check if current breakpoint is at most the specified breakpoint
   */
  const isAtMost = (bp: Breakpoint): boolean => {
    const nextBp = getNextBreakpoint(bp)
    return nextBp ? width.value < BREAKPOINTS[nextBp] : true
  }

  /**
   * Check if current breakpoint is between two breakpoints
   */
  const isBetween = (min: Breakpoint, max: Breakpoint): boolean => {
    return width.value >= BREAKPOINTS[min] && width.value < BREAKPOINTS[max]
  }

  /**
   * Get the next breakpoint
   */
  const getNextBreakpoint = (bp: Breakpoint): Breakpoint | null => {
    const bps: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const index = bps.indexOf(bp)
    return index < bps.length - 1 ? bps[index + 1] : null
  }

  /**
   * Get responsive value based on breakpoint
   * Example: getResponsiveValue({ xs: 1, md: 2, lg: 3 }) returns appropriate value
   */
  const getResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
    const bps: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    for (const bp of bps) {
      if (isAtLeast(bp) && values[bp] !== undefined) {
        return values[bp]
      }
    }
    return undefined
  }

  return {
    // State
    width,
    height,
    breakpoint,
    state,
    
    // Breakpoint flags
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Device type flags
    isMobile,
    isTablet,
    isDesktop,
    
    // Orientation
    orientation,
    
    // Utility functions
    isAtLeast,
    isAtMost,
    isBetween,
    getResponsiveValue
  }
}

/**
 * Hook for responsive classes
 * Returns CSS classes based on current breakpoint
 */
export function useResponsiveClasses() {
  const { state } = useResponsive()

  const classes = computed(() => ({
    'is-mobile': state.value.isMobile,
    'is-tablet': state.value.isTablet,
    'is-desktop': state.value.isDesktop,
    'is-portrait': state.value.orientation === 'portrait',
    'is-landscape': state.value.orientation === 'landscape',
    [`breakpoint-${state.value.breakpoint}`]: true
  }))

  return classes
}
