/**
 * Error Reporting Composable
 * 
 * Provides error reporting and user feedback functionality.
 * Requirements: 11.3
 */

import { ref } from 'vue'
import type { ErrorInfo, ErrorAction } from '@/utils/errorMessages'
import { formatError, getErrorInfo, getScenarioError } from '@/utils/errorMessages'
import { ErrorCode } from '@/types/api'

interface ErrorDialogState {
  visible: boolean
  title: string
  message: string
  solution?: string
  details?: string
  severity: ErrorInfo['severity']
  actions: ErrorAction[]
}

const errorDialog = ref<ErrorDialogState>({
  visible: false,
  title: '',
  message: '',
  severity: 'error',
  actions: []
})

// Error history for debugging
const errorHistory = ref<Array<ErrorInfo & { timestamp: Date }>>([])
const MAX_HISTORY = 50

export function useErrorReporting() {
  /**
   * Show error dialog with enhanced information
   */
  function showError(
    error: Error | string | ErrorInfo,
    options: {
      code?: ErrorCode
      actions?: ErrorAction[]
      details?: string
    } = {}
  ) {
    let errorInfo: ErrorInfo
    
    if (typeof error === 'object' && 'title' in error) {
      // Already an ErrorInfo object
      errorInfo = error
    } else {
      // Convert to ErrorInfo
      errorInfo = formatError(error, options.code)
    }
    
    // Add to history
    errorHistory.value.unshift({
      ...errorInfo,
      timestamp: new Date()
    })
    
    // Keep history size manageable
    if (errorHistory.value.length > MAX_HISTORY) {
      errorHistory.value = errorHistory.value.slice(0, MAX_HISTORY)
    }
    
    // Show dialog
    errorDialog.value = {
      visible: true,
      title: errorInfo.title,
      message: errorInfo.message,
      solution: errorInfo.solution,
      details: options.details,
      severity: errorInfo.severity,
      actions: options.actions || errorInfo.actions || []
    }
  }
  
  /**
   * Show error by error code
   */
  function showErrorByCode(
    code: ErrorCode,
    customMessage?: string,
    options: {
      actions?: ErrorAction[]
      details?: string
    } = {}
  ) {
    const errorInfo = getErrorInfo(code, customMessage)
    showError(errorInfo, options)
  }
  
  /**
   * Show error by scenario
   */
  function showScenarioError(
    scenario: Parameters<typeof getScenarioError>[0],
    options: {
      actions?: ErrorAction[]
      details?: string
    } = {}
  ) {
    const errorInfo = getScenarioError(scenario)
    showError(errorInfo, options)
  }
  
  /**
   * Show network error with retry action
   */
  function showNetworkError(
    retryAction?: () => void | Promise<void>,
    details?: string
  ) {
    const actions: ErrorAction[] = []
    
    if (retryAction) {
      actions.push({
        label: '重试',
        action: retryAction,
        primary: true
      })
    }
    
    showErrorByCode(ErrorCode.NETWORK_ERROR, undefined, {
      actions,
      details
    })
  }
  
  /**
   * Show auth error with login action
   */
  function showAuthError(
    loginAction?: () => void | Promise<void>,
    details?: string
  ) {
    const actions: ErrorAction[] = []
    
    if (loginAction) {
      actions.push({
        label: '重新登录',
        action: loginAction,
        primary: true
      })
    }
    
    showErrorByCode(ErrorCode.UNAUTHORIZED, undefined, {
      actions,
      details
    })
  }
  
  /**
   * Show validation error with specific field info
   */
  function showValidationError(
    fieldName: string,
    requirement: string,
    details?: string
  ) {
    showErrorByCode(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} ${requirement}`,
      { details }
    )
  }
  
  /**
   * Show file error
   */
  function showFileError(
    scenario: 'FILE_TOO_LARGE' | 'FILE_TYPE_NOT_SUPPORTED' | 'SAVE_FAILED',
    details?: string
  ) {
    showScenarioError(scenario, { details })
  }
  
  /**
   * Show AI service error
   */
  function showAIError(
    scenario: 'AI_QUOTA_EXCEEDED' | 'AI_SERVICE_UNAVAILABLE',
    retryAction?: () => void | Promise<void>,
    details?: string
  ) {
    const actions: ErrorAction[] = []
    
    if (retryAction && scenario === 'AI_SERVICE_UNAVAILABLE') {
      actions.push({
        label: '重试',
        action: retryAction,
        primary: true
      })
    }
    
    showScenarioError(scenario, { actions, details })
  }
  
  /**
   * Close error dialog
   */
  function closeError() {
    errorDialog.value.visible = false
  }
  
  /**
   * Get error history
   */
  function getErrorHistory() {
    return errorHistory.value
  }
  
  /**
   * Clear error history
   */
  function clearErrorHistory() {
    errorHistory.value = []
  }
  
  /**
   * Export error history for debugging
   */
  function exportErrorHistory(): string {
    return JSON.stringify(
      errorHistory.value.map(err => ({
        timestamp: err.timestamp.toISOString(),
        title: err.title,
        message: err.message,
        severity: err.severity,
        category: err.category
      })),
      null,
      2
    )
  }
  
  /**
   * Show success message (using notification system)
   */
  function showSuccess(message: string, title = '成功') {
    // This would integrate with the notification system
    console.log(`✅ ${title}: ${message}`)
  }
  
  /**
   * Show warning message
   */
  function showWarning(message: string, title = '警告') {
    showError({
      title,
      message,
      severity: 'warning',
      category: 'system',
      icon: 'alert-triangle'
    })
  }
  
  /**
   * Show info message
   */
  function showInfo(message: string, title = '提示') {
    showError({
      title,
      message,
      severity: 'info',
      category: 'system',
      icon: 'info'
    })
  }
  
  return {
    // State
    errorDialog,
    errorHistory,
    
    // Methods
    showError,
    showErrorByCode,
    showScenarioError,
    showNetworkError,
    showAuthError,
    showValidationError,
    showFileError,
    showAIError,
    closeError,
    
    // History
    getErrorHistory,
    clearErrorHistory,
    exportErrorHistory,
    
    // Convenience methods
    showSuccess,
    showWarning,
    showInfo
  }
}
