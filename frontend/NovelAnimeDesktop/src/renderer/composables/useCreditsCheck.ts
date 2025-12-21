/**
 * Credits Check Composable
 * Provides utilities for checking and consuming credits before AI operations
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
import { ref } from 'vue'
import { useCreditsStore } from '../stores/credits'
import { useUIStore } from '../stores/ui'

// Operation costs
export const OPERATION_COSTS: Record<string, number> = {
  'novel-parse': 10,
  'character-extract': 20,
  'video-generate': 50,
  'image-analyze': 15,
  'voice-recognize': 5,
  'storyboard-create': 30,
  'script-convert': 25
}

// Operation display names
const OPERATION_NAMES: Record<string, string> = {
  'novel-parse': '小说解析',
  'character-extract': '角色提取',
  'video-generate': '视频生成',
  'image-analyze': '图像分析',
  'voice-recognize': '语音识别',
  'storyboard-create': '分镜创建',
  'script-convert': '剧本转换'
}

export interface CreditsCheckResult {
  success: boolean
  error?: string
  errorCode?: string
  requiredCredits?: number
  currentBalance?: number
}

export interface CreditsConsumeResult {
  success: boolean
  newBalance?: number
  transactionId?: string
  error?: string
}

export function useCreditsCheck() {
  const creditsStore = useCreditsStore()
  const uiStore = useUIStore()
  const showInsufficientDialog = ref(false)
  const requiredCreditsForDialog = ref(0)

  /**
   * Check if user has sufficient credits for an operation (Requirement 4.1)
   */
  function checkCredits(operationType: string): CreditsCheckResult {
    const cost = OPERATION_COSTS[operationType] || 10
    const balance = creditsStore.balance

    if (balance < cost) {
      return {
        success: false,
        error: `积分不足。需要: ${cost}, 当前: ${balance}`,
        errorCode: 'INSUFFICIENT_CREDITS',
        requiredCredits: cost,
        currentBalance: balance
      }
    }

    return {
      success: true,
      requiredCredits: cost,
      currentBalance: balance
    }
  }

  /**
   * Show insufficient credits dialog (Requirement 4.2)
   */
  function showInsufficientCreditsDialog(requiredCredits: number) {
    requiredCreditsForDialog.value = requiredCredits
    showInsufficientDialog.value = true
  }

  /**
   * Consume credits after successful operation (Requirement 4.3)
   */
  async function consumeCredits(
    operationType: string,
    description?: string
  ): Promise<CreditsConsumeResult> {
    const cost = OPERATION_COSTS[operationType] || 10

    const result = await creditsStore.consumeCredits(cost, operationType, description)

    if (result.success) {
      return {
        success: true,
        newBalance: result.newBalance,
        transactionId: result.transactionId
      }
    }

    return {
      success: false,
      error: result.error
    }
  }

  /**
   * Wrapper function for AI operations with credits check
   * Checks balance before operation, consumes credits on success
   * Does not deduct credits on failure (Requirement 4.4)
   */
  async function withCreditsCheck<T>(
    operationType: string,
    operation: () => Promise<T>,
    description?: string
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    const operationName = OPERATION_NAMES[operationType] || operationType
    const cost = OPERATION_COSTS[operationType] || 10

    // Pre-operation credits check (Requirement 4.1)
    const checkResult = checkCredits(operationType)

    if (!checkResult.success) {
      // Show insufficient credits dialog (Requirement 4.2)
      showInsufficientCreditsDialog(checkResult.requiredCredits!)
      uiStore.addNotification({
        type: 'warning',
        title: '积分不足',
        message: `${operationName}需要 ${cost} 积分，当前余额 ${checkResult.currentBalance}`
      })
      return {
        success: false,
        error: checkResult.error
      }
    }

    try {
      // Execute the operation
      const result = await operation()

      // Consume credits on success (Requirement 4.3)
      const consumeResult = await consumeCredits(
        operationType,
        description || `${operationName}`
      )

      if (consumeResult.success) {
        uiStore.addNotification({
          type: 'success',
          title: `${operationName}完成`,
          message: `消耗 ${cost} 积分，剩余 ${consumeResult.newBalance}`
        })
      } else {
        console.error('Failed to consume credits:', consumeResult.error)
        // Operation succeeded but credits consumption failed
        // This is a rare edge case - operation result is still valid
        uiStore.addNotification({
          type: 'warning',
          title: '积分扣除异常',
          message: '操作已完成，但积分扣除失败，请联系客服'
        })
      }

      return {
        success: true,
        result
      }
    } catch (error: any) {
      // Do not deduct credits on failure (Requirement 4.4)
      console.error('Operation failed:', error)
      uiStore.addNotification({
        type: 'error',
        title: `${operationName}失败`,
        message: error.message || '操作失败，积分未扣除'
      })
      return {
        success: false,
        error: error.message || 'Operation failed'
      }
    }
  }

  /**
   * Get operation cost
   */
  function getOperationCost(operationType: string): number {
    return OPERATION_COSTS[operationType] || 10
  }

  return {
    checkCredits,
    consumeCredits,
    withCreditsCheck,
    getOperationCost,
    showInsufficientDialog,
    requiredCreditsForDialog,
    showInsufficientCreditsDialog
  }
}
