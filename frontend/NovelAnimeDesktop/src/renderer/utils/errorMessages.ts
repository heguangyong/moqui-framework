/**
 * Enhanced Error Messages and Solutions
 * 
 * Provides user-friendly error messages with actionable solutions.
 * Requirements: 11.3
 */

import { ErrorCode } from '../types/api'

export interface ErrorInfo {
  title: string
  message: string
  solution?: string
  actions?: ErrorAction[]
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: ErrorCategory
  icon?: string
}

export interface ErrorAction {
  label: string
  action: () => void | Promise<void>
  primary?: boolean
}

export type ErrorCategory = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'file'
  | 'ai'
  | 'system'
  | 'unknown'

/**
 * Enhanced error messages with solutions
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorInfo> = {
  [ErrorCode.NETWORK_ERROR]: {
    title: '网络连接失败',
    message: '无法连接到服务器，请检查您的网络连接。',
    solution: '请尝试以下解决方案：\n1. 检查网络连接是否正常\n2. 确认防火墙未阻止应用\n3. 稍后重试',
    severity: 'error',
    category: 'network',
    icon: 'wifi-off'
  },
  
  [ErrorCode.UNAUTHORIZED]: {
    title: '登录已过期',
    message: '您的登录会话已过期，请重新登录。',
    solution: '点击下方按钮重新登录以继续使用。',
    severity: 'warning',
    category: 'auth',
    icon: 'lock'
  },
  
  [ErrorCode.FORBIDDEN]: {
    title: '权限不足',
    message: '您没有权限执行此操作。',
    solution: '如需访问此功能，请联系管理员获取相应权限。',
    severity: 'warning',
    category: 'auth',
    icon: 'shield-off'
  },
  
  [ErrorCode.NOT_FOUND]: {
    title: '资源不存在',
    message: '请求的资源未找到或已被删除。',
    solution: '请检查资源是否存在，或尝试刷新页面。',
    severity: 'warning',
    category: 'system',
    icon: 'search'
  },
  
  [ErrorCode.VALIDATION_ERROR]: {
    title: '输入验证失败',
    message: '您输入的数据格式不正确。',
    solution: '请检查输入内容是否符合要求，并重试。',
    severity: 'warning',
    category: 'validation',
    icon: 'alert-circle'
  },
  
  [ErrorCode.SERVER_ERROR]: {
    title: '服务器错误',
    message: '服务器遇到了问题，无法完成您的请求。',
    solution: '这通常是临时问题，请稍后重试。如果问题持续，请联系技术支持。',
    severity: 'error',
    category: 'system',
    icon: 'server'
  },
  
  [ErrorCode.TIMEOUT]: {
    title: '请求超时',
    message: '服务器响应时间过长，请求已超时。',
    solution: '请检查网络连接，或稍后重试。如果处理大文件，请耐心等待。',
    severity: 'warning',
    category: 'network',
    icon: 'clock'
  },
  
  [ErrorCode.API_ERROR]: {
    title: 'API 请求失败',
    message: 'API 请求遇到问题。',
    solution: '请稍后重试。如果问题持续，请检查 API 配置或联系技术支持。',
    severity: 'error',
    category: 'system',
    icon: 'alert-triangle'
  },
  
  [ErrorCode.UNKNOWN]: {
    title: '未知错误',
    message: '发生了意外错误。',
    solution: '请尝试刷新页面或重启应用。如果问题持续，请联系技术支持。',
    severity: 'error',
    category: 'unknown',
    icon: 'help-circle'
  }
}

/**
 * Common error scenarios with specific messages
 */
export const SCENARIO_ERRORS = {
  FILE_TOO_LARGE: {
    title: '文件过大',
    message: '上传的文件超过了大小限制。',
    solution: '请选择小于 10MB 的文件，或将大文件分割后上传。',
    severity: 'warning' as const,
    category: 'file' as const,
    icon: 'file'
  },
  
  FILE_TYPE_NOT_SUPPORTED: {
    title: '文件类型不支持',
    message: '不支持此文件格式。',
    solution: '请上传 .txt 或 .md 格式的文本文件。',
    severity: 'warning' as const,
    category: 'file' as const,
    icon: 'file-text'
  },
  
  AI_QUOTA_EXCEEDED: {
    title: 'AI 配额不足',
    message: '您的 AI 服务配额已用完。',
    solution: '请充值积分或等待配额重置后继续使用。',
    severity: 'warning' as const,
    category: 'ai' as const,
    icon: 'zap-off'
  },
  
  AI_SERVICE_UNAVAILABLE: {
    title: 'AI 服务不可用',
    message: 'AI 服务暂时无法使用。',
    solution: '请稍后重试，或在设置中切换到其他 AI 服务提供商。',
    severity: 'error' as const,
    category: 'ai' as const,
    icon: 'cloud-off'
  },
  
  PROJECT_NOT_FOUND: {
    title: '项目不存在',
    message: '找不到指定的项目。',
    solution: '项目可能已被删除或移动。请返回项目列表重新选择。',
    severity: 'warning' as const,
    category: 'system' as const,
    icon: 'folder'
  },
  
  SAVE_FAILED: {
    title: '保存失败',
    message: '无法保存您的更改。',
    solution: '请检查磁盘空间是否充足，并确保有写入权限。',
    severity: 'error' as const,
    category: 'file' as const,
    icon: 'save'
  },
  
  WORKFLOW_VALIDATION_FAILED: {
    title: '工作流验证失败',
    message: '工作流配置存在错误。',
    solution: '请检查节点连接是否正确，确保所有必需参数已配置。',
    severity: 'warning' as const,
    category: 'validation' as const,
    icon: 'git-branch'
  },
  
  EXECUTION_FAILED: {
    title: '执行失败',
    message: '工作流执行过程中遇到错误。',
    solution: '请查看执行日志了解详情，修复问题后重试。',
    severity: 'error' as const,
    category: 'system' as const,
    icon: 'play'
  }
}

/**
 * Get error info by error code
 */
export function getErrorInfo(code: ErrorCode, customMessage?: string): ErrorInfo {
  const info = ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN]
  
  if (customMessage) {
    return {
      ...info,
      message: customMessage
    }
  }
  
  return info
}

/**
 * Get error info by scenario
 */
export function getScenarioError(scenario: keyof typeof SCENARIO_ERRORS): ErrorInfo {
  return SCENARIO_ERRORS[scenario]
}

/**
 * Format error for display
 */
export function formatError(error: Error | string, code?: ErrorCode): ErrorInfo {
  const message = typeof error === 'string' ? error : error.message
  
  if (code) {
    return getErrorInfo(code, message)
  }
  
  // Try to match common error patterns
  if (message.includes('network') || message.includes('fetch')) {
    return getErrorInfo(ErrorCode.NETWORK_ERROR, message)
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return getErrorInfo(ErrorCode.UNAUTHORIZED, message)
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return getErrorInfo(ErrorCode.FORBIDDEN, message)
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return getErrorInfo(ErrorCode.NOT_FOUND, message)
  }
  
  if (message.includes('timeout')) {
    return getErrorInfo(ErrorCode.TIMEOUT, message)
  }
  
  // Default to unknown error
  return {
    title: '错误',
    message,
    severity: 'error',
    category: 'unknown',
    icon: 'alert-circle'
  }
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: ErrorInfo['severity']): string {
  const colors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    critical: '#dc2626'
  }
  
  return colors[severity]
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: ErrorCategory): string {
  const icons = {
    network: 'wifi',
    auth: 'lock',
    validation: 'check-circle',
    file: 'file',
    ai: 'zap',
    system: 'settings',
    unknown: 'help-circle'
  }
  
  return icons[category]
}
