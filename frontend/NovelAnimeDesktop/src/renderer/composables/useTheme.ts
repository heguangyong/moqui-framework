/**
 * Theme Management Composable
 * 
 * Manages application theme (light/dark mode) with persistence.
 * Requirements: 11.5
 */

import { ref, computed, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeConfig {
  theme: Theme
  systemPreference: 'light' | 'dark'
}

// Storage key
const STORAGE_KEY = 'novel-anime-theme'

// Global theme state
const currentTheme = ref<Theme>('auto')
const systemPreference = ref<'light' | 'dark'>('light')

// Computed actual theme (resolves 'auto' to light/dark)
const actualTheme = computed(() => {
  if (currentTheme.value === 'auto') {
    return systemPreference.value
  }
  return currentTheme.value
})

// Check if dark mode is active
const isDark = computed(() => actualTheme.value === 'dark')

/**
 * Load theme from storage
 */
function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored as Theme
    }
  } catch (error) {
    console.error('Failed to load theme:', error)
  }
  return 'auto'
}

/**
 * Save theme to storage
 */
function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

/**
 * Detect system theme preference
 */
function detectSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
  
  // Dispatch event for components that need to react
  window.dispatchEvent(new CustomEvent('theme-change', { 
    detail: { theme } 
  }))
}

/**
 * Setup system theme listener
 */
function setupSystemThemeListener() {
  if (!window.matchMedia) return
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    systemPreference.value = e.matches ? 'dark' : 'light'
  }
  
  // Initial detection
  handleChange(mediaQuery)
  
  // Listen for changes
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleChange)
  }
  
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.removeListener(handleChange)
    }
  }
}

export function useTheme() {
  /**
   * Initialize theme system
   */
  function initTheme() {
    // Load saved theme
    currentTheme.value = loadTheme()
    
    // Detect system preference
    systemPreference.value = detectSystemTheme()
    
    // Setup system theme listener
    setupSystemThemeListener()
    
    // Apply initial theme
    applyTheme(actualTheme.value)
    
    // Watch for theme changes
    watch(actualTheme, (newTheme) => {
      applyTheme(newTheme)
    })
  }
  
  /**
   * Set theme
   */
  function setTheme(theme: Theme) {
    currentTheme.value = theme
    saveTheme(theme)
  }
  
  /**
   * Toggle between light and dark
   */
  function toggleTheme() {
    if (currentTheme.value === 'auto') {
      // If auto, switch to opposite of current system preference
      setTheme(systemPreference.value === 'dark' ? 'light' : 'dark')
    } else {
      // Toggle between light and dark
      setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
    }
  }
  
  /**
   * Set to light theme
   */
  function setLightTheme() {
    setTheme('light')
  }
  
  /**
   * Set to dark theme
   */
  function setDarkTheme() {
    setTheme('dark')
  }
  
  /**
   * Set to auto theme (follow system)
   */
  function setAutoTheme() {
    setTheme('auto')
  }
  
  /**
   * Get theme config
   */
  function getThemeConfig(): ThemeConfig {
    return {
      theme: currentTheme.value,
      systemPreference: systemPreference.value
    }
  }
  
  /**
   * Get theme label
   */
  function getThemeLabel(theme: Theme): string {
    const labels: Record<Theme, string> = {
      light: '浅色',
      dark: '深色',
      auto: '跟随系统'
    }
    return labels[theme]
  }
  
  /**
   * Get theme icon
   */
  function getThemeIcon(theme: Theme): string {
    const icons: Record<Theme, string> = {
      light: 'sun',
      dark: 'moon',
      auto: 'monitor'
    }
    return icons[theme]
  }
  
  return {
    // State
    currentTheme,
    actualTheme,
    isDark,
    systemPreference,
    
    // Methods
    initTheme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    getThemeConfig,
    getThemeLabel,
    getThemeIcon
  }
}

// Auto-initialize on first import
let initialized = false

export function autoInitTheme() {
  if (!initialized) {
    initialized = true
    const { initTheme } = useTheme()
    initTheme()
  }
}
