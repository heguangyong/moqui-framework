/**
 * Tutorial/Onboarding System Composable
 * 
 * Manages the interactive tutorial/onboarding experience for new users.
 * Provides step-by-step guidance through core features.
 * 
 * Requirements: 11.1
 */

import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string  // CSS selector for highlighting
  route?: string   // Route to navigate to
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: () => void | Promise<void>
  canSkip?: boolean
  nextLabel?: string
  prevLabel?: string
}

export interface TutorialConfig {
  id: string
  name: string
  description: string
  steps: TutorialStep[]
  autoStart?: boolean
}

// Tutorial definitions
const TUTORIALS: Record<string, TutorialConfig> = {
  welcome: {
    id: 'welcome',
    name: '欢迎使用小说动漫生成器',
    description: '让我们快速了解如何使用这个应用',
    autoStart: true,
    steps: [
      {
        id: 'welcome-1',
        title: '欢迎！',
        description: '欢迎使用小说动漫生成器！这个应用可以帮助您将文字小说转换为动漫形式的视觉内容。让我们开始快速导览。',
        position: 'center',
        nextLabel: '开始导览',
        canSkip: true
      },
      {
        id: 'welcome-2',
        title: '项目管理',
        description: '在仪表盘中您可以创建和管理您的项目。每个项目可以包含多个小说、角色和工作流。',
        route: '/dashboard',
        target: '.workflow-guide',
        position: 'right',
        nextLabel: '下一步'
      },
      {
        id: 'welcome-3',
        title: '小说导入',
        description: '在仪表盘的快速开始区域，点击"选择文件"按钮可以导入您的小说文本文件。支持 .txt 和 .md 格式。',
        route: '/dashboard',
        target: '.step-card',
        position: 'bottom',
        nextLabel: '下一步'
      },
      {
        id: 'welcome-4',
        title: '角色管理',
        description: '在角色管理页面，您可以定义小说中的角色信息，包括外貌、性格等。这些信息将用于生成角色形象。',
        route: '/characters',
        target: '.character-list',
        position: 'right',
        nextLabel: '下一步'
      },
      {
        id: 'welcome-5',
        title: '工作流设计',
        description: '工作流编辑器让您可以自定义处理流程。通过拖拽节点来设计您的转换流程。',
        route: '/workflow',
        target: '.workflow-canvas',
        position: 'left',
        nextLabel: '下一步'
      },
      {
        id: 'welcome-6',
        title: '完成！',
        description: '您已经了解了基本功能！现在可以开始创建您的第一个项目了。如需帮助，可以随时在设置中重新查看教程。',
        position: 'center',
        nextLabel: '开始使用',
        canSkip: false
      }
    ]
  },
  
  workflow: {
    id: 'workflow',
    name: '工作流编辑器教程',
    description: '学习如何设计和使用工作流',
    steps: [
      {
        id: 'workflow-1',
        title: '节点库',
        description: '左侧是节点库，包含各种处理节点。您可以拖拽节点到画布上。',
        target: '.node-library',
        position: 'right',
        nextLabel: '下一步'
      },
      {
        id: 'workflow-2',
        title: '画布',
        description: '中间是工作流画布。在这里排列和连接节点来设计处理流程。',
        target: '.workflow-canvas',
        position: 'top',
        nextLabel: '下一步'
      },
      {
        id: 'workflow-3',
        title: '节点连接',
        description: '点击节点的输出端口，然后点击另一个节点的输入端口来创建连接。',
        target: '.workflow-canvas',
        position: 'top',
        nextLabel: '下一步'
      },
      {
        id: 'workflow-4',
        title: '执行工作流',
        description: '设计完成后，点击"执行"按钮来运行工作流。您可以在执行监控面板查看进度。',
        target: '.execute-button',
        position: 'bottom',
        nextLabel: '完成'
      }
    ]
  }
}

// Tutorial state stored in localStorage
const STORAGE_KEY = 'novel-anime-tutorial-state'

interface TutorialState {
  completedTutorials: string[]
  skippedTutorials: string[]
  currentTutorial?: string
  currentStep?: number
  showTutorials: boolean
}

function loadState(): TutorialState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load tutorial state:', error)
  }
  
  return {
    completedTutorials: [],
    skippedTutorials: [],
    showTutorials: true
  }
}

function saveState(state: TutorialState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save tutorial state:', error)
  }
}

// Global tutorial state
const tutorialState = ref<TutorialState>(loadState())
const activeTutorial = ref<TutorialConfig | null>(null)
const currentStepIndex = ref(0)
const isActive = ref(false)

// Watch for state changes and persist
watch(tutorialState, (state) => {
  saveState(state)
}, { deep: true })

export function useTutorial() {
  const router = useRouter()
  
  const currentStep = computed(() => {
    if (!activeTutorial.value) return null
    return activeTutorial.value.steps[currentStepIndex.value] || null
  })
  
  const progress = computed(() => {
    if (!activeTutorial.value) return 0
    return ((currentStepIndex.value + 1) / activeTutorial.value.steps.length) * 100
  })
  
  const canGoNext = computed(() => {
    return currentStepIndex.value < (activeTutorial.value?.steps.length || 0) - 1
  })
  
  const canGoPrev = computed(() => {
    return currentStepIndex.value > 0
  })
  
  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => {
    return currentStepIndex.value === (activeTutorial.value?.steps.length || 0) - 1
  })
  
  /**
   * Start a tutorial
   */
  function startTutorial(tutorialId: string) {
    const tutorial = TUTORIALS[tutorialId]
    if (!tutorial) {
      console.warn(`Tutorial not found: ${tutorialId}`)
      return
    }
    
    activeTutorial.value = tutorial
    currentStepIndex.value = 0
    isActive.value = true
    
    tutorialState.value.currentTutorial = tutorialId
    tutorialState.value.currentStep = 0
    
    // Navigate to first step's route if specified
    const firstStep = tutorial.steps[0]
    if (firstStep.route) {
      router.push(firstStep.route)
    }
  }
  
  /**
   * Go to next step
   */
  async function nextStep() {
    if (!activeTutorial.value || !canGoNext.value) return
    
    const step = currentStep.value
    if (step?.action) {
      await step.action()
    }
    
    currentStepIndex.value++
    tutorialState.value.currentStep = currentStepIndex.value
    
    // Navigate to next step's route if specified
    const nextStepData = activeTutorial.value.steps[currentStepIndex.value]
    if (nextStepData?.route) {
      router.push(nextStepData.route)
    }
  }
  
  /**
   * Go to previous step
   */
  function prevStep() {
    if (!canGoPrev.value) return
    
    currentStepIndex.value--
    tutorialState.value.currentStep = currentStepIndex.value
    
    // Navigate to previous step's route if specified
    const prevStepData = activeTutorial.value?.steps[currentStepIndex.value]
    if (prevStepData?.route) {
      router.push(prevStepData.route)
    }
  }
  
  /**
   * Skip current tutorial
   */
  function skipTutorial() {
    if (!activeTutorial.value) return
    
    const tutorialId = activeTutorial.value.id
    if (!tutorialState.value.skippedTutorials.includes(tutorialId)) {
      tutorialState.value.skippedTutorials.push(tutorialId)
    }
    
    endTutorial()
  }
  
  /**
   * Complete current tutorial
   */
  function completeTutorial() {
    if (!activeTutorial.value) return
    
    const tutorialId = activeTutorial.value.id
    if (!tutorialState.value.completedTutorials.includes(tutorialId)) {
      tutorialState.value.completedTutorials.push(tutorialId)
    }
    
    endTutorial()
  }
  
  /**
   * End tutorial (cleanup)
   */
  function endTutorial() {
    activeTutorial.value = null
    currentStepIndex.value = 0
    isActive.value = false
    
    tutorialState.value.currentTutorial = undefined
    tutorialState.value.currentStep = undefined
  }
  
  /**
   * Reset tutorial progress
   */
  function resetTutorial(tutorialId: string) {
    tutorialState.value.completedTutorials = tutorialState.value.completedTutorials.filter(
      id => id !== tutorialId
    )
    tutorialState.value.skippedTutorials = tutorialState.value.skippedTutorials.filter(
      id => id !== tutorialId
    )
  }
  
  /**
   * Reset all tutorials
   */
  function resetAllTutorials() {
    tutorialState.value.completedTutorials = []
    tutorialState.value.skippedTutorials = []
    tutorialState.value.showTutorials = true
  }
  
  /**
   * Check if tutorial is completed
   */
  function isTutorialCompleted(tutorialId: string): boolean {
    return tutorialState.value.completedTutorials.includes(tutorialId)
  }
  
  /**
   * Check if tutorial is skipped
   */
  function isTutorialSkipped(tutorialId: string): boolean {
    return tutorialState.value.skippedTutorials.includes(tutorialId)
  }
  
  /**
   * Check if should show tutorials
   */
  function shouldShowTutorials(): boolean {
    return tutorialState.value.showTutorials
  }
  
  /**
   * Toggle tutorial visibility
   */
  function setShowTutorials(show: boolean) {
    tutorialState.value.showTutorials = show
  }
  
  /**
   * Get all available tutorials
   */
  function getAllTutorials(): TutorialConfig[] {
    return Object.values(TUTORIALS)
  }
  
  /**
   * Get tutorial by ID
   */
  function getTutorial(tutorialId: string): TutorialConfig | undefined {
    return TUTORIALS[tutorialId]
  }
  
  /**
   * Auto-start welcome tutorial for first-time users
   */
  function autoStartWelcomeTutorial() {
    if (
      shouldShowTutorials() &&
      !isTutorialCompleted('welcome') &&
      !isTutorialSkipped('welcome')
    ) {
      startTutorial('welcome')
    }
  }
  
  return {
    // State
    isActive,
    activeTutorial,
    currentStep,
    currentStepIndex,
    progress,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    
    // Actions
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    endTutorial,
    resetTutorial,
    resetAllTutorials,
    
    // Queries
    isTutorialCompleted,
    isTutorialSkipped,
    shouldShowTutorials,
    setShowTutorials,
    getAllTutorials,
    getTutorial,
    autoStartWelcomeTutorial
  }
}
