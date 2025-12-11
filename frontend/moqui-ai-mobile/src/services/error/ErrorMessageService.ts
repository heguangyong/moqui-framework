/**
 * Error Message Service
 * Provides error code to message mapping and solution suggestions
 * 
 * Requirements: 7.1, 7.4
 */

export interface ErrorInfo {
  message: string
  suggestion?: string
  retryable?: boolean
}

// Error code to message mapping
const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // Network errors
  'NETWORK_ERROR': {
    message: '网络连接失败，请检查网络设置',
    suggestion: '请确保您的设备已连接到互联网',
    retryable: true
  },
  'TIMEOUT': {
    message: '请求超时，请稍后重试',
    suggestion: '网络可能较慢，请稍后再试',
    retryable: true
  },
  'CONNECTION_REFUSED': {
    message: '无法连接到服务器',
    suggestion: '服务器可能正在维护，请稍后再试',
    retryable: true
  },

  // Authentication errors
  'UNAUTHORIZED': {
    message: '登录已过期，请重新登录',
    suggestion: '您的登录状态已失效，请重新登录',
    retryable: false
  },
  'FORBIDDEN': {
    message: '您没有权限执行此操作',
    suggestion: '请联系管理员获取相应权限',
    retryable: false
  },
  'INVALID_TOKEN': {
    message: '身份验证失败',
    suggestion: '请重新登录后再试',
    retryable: false
  },

  // Business errors - Order related
  'ORDER_GRABBED': {
    message: '该订单已被其他司机抢走',
    suggestion: '请查看其他可用订单',
    retryable: false
  },
  'ORDER_EXPIRED': {
    message: '订单已过期，无法抢单',
    suggestion: '请查看其他可用订单',
    retryable: false
  },
  'ORDER_CANCELLED': {
    message: '订单已被取消',
    suggestion: '请联系货主了解详情',
    retryable: false
  },
  'ORDER_NOT_FOUND': {
    message: '订单不存在或已被删除',
    suggestion: '请刷新页面查看最新订单',
    retryable: false
  },


  // Business errors - Driver related
  'INSUFFICIENT_BALANCE': {
    message: '余额不足，请先充值',
    suggestion: '请前往钱包页面充值后再试',
    retryable: false
  },
  'INVALID_PLATE': {
    message: '您的车牌不符合该订单要求',
    suggestion: '该订单要求沪牌车辆',
    retryable: false
  },
  'VEHICLE_TYPE_MISMATCH': {
    message: '您的车型不符合该订单要求',
    suggestion: '请查看订单要求的车型',
    retryable: false
  },
  'DRIVER_NOT_VERIFIED': {
    message: '您的司机资质尚未通过审核',
    suggestion: '请等待审核通过后再试',
    retryable: false
  },

  // Validation errors
  'INVALID_CONTAINER_NUMBER': {
    message: '集装箱号格式错误',
    suggestion: '正确格式：4位字母+7位数字（如ABCD1234567）',
    retryable: false
  },
  'INVALID_SEAL_NUMBER': {
    message: '铅封号不能为空',
    suggestion: '请输入有效的铅封号',
    retryable: false
  },
  'PHOTO_REQUIRED': {
    message: '请上传集装箱照片',
    suggestion: '需要上传集装箱照片才能完成操作',
    retryable: false
  },
  'INVALID_PHONE': {
    message: '手机号格式错误',
    suggestion: '请输入11位有效手机号',
    retryable: false
  },

  // Server errors
  'SERVER_ERROR': {
    message: '服务器错误，请稍后重试',
    suggestion: '如问题持续，请联系客服',
    retryable: true
  },
  'SERVICE_UNAVAILABLE': {
    message: '服务暂时不可用',
    suggestion: '系统正在维护，请稍后再试',
    retryable: true
  },

  // Default
  'UNKNOWN': {
    message: '操作失败，请稍后重试',
    suggestion: '如问题持续，请联系客服',
    retryable: true
  }
}

// HTTP status code mapping
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'TIMEOUT',
  429: 'TOO_MANY_REQUESTS',
  500: 'SERVER_ERROR',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
  504: 'TIMEOUT'
}

class ErrorMessageServiceClass {
  /**
   * Get error info by error code
   */
  getErrorInfo(errorCode: string): ErrorInfo {
    const info = ERROR_MESSAGES[errorCode]
    if (info) return info
    return ERROR_MESSAGES['UNKNOWN'] as ErrorInfo
  }

  /**
   * Get error message by error code
   */
  getMessage(errorCode: string): string {
    return this.getErrorInfo(errorCode).message
  }

  /**
   * Get suggestion by error code
   */
  getSuggestion(errorCode: string): string | undefined {
    return this.getErrorInfo(errorCode).suggestion
  }

  /**
   * Check if error is retryable
   */
  isRetryable(errorCode: string): boolean {
    return this.getErrorInfo(errorCode).retryable ?? false
  }

  /**
   * Get error code from HTTP status
   */
  getErrorCodeFromStatus(status: number): string {
    return HTTP_STATUS_MESSAGES[status] || 'UNKNOWN'
  }

  /**
   * Parse error from API response
   */
  parseApiError(error: any): ErrorInfo {
    // Handle axios error
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // Check for business error code in response
      if (data?.errorCode) {
        return this.getErrorInfo(data.errorCode)
      }

      // Check for error message in response
      if (data?.message && data.message !== '操作失败') {
        return {
          message: data.message,
          suggestion: data.suggestion,
          retryable: status >= 500
        }
      }

      // Fall back to HTTP status mapping
      const errorCode = this.getErrorCodeFromStatus(status)
      return this.getErrorInfo(errorCode)
    }

    // Handle network error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return this.getErrorInfo('TIMEOUT')
    }

    if (error.message?.includes('Network Error')) {
      return this.getErrorInfo('NETWORK_ERROR')
    }

    // Default error
    return this.getErrorInfo('UNKNOWN')
  }

  /**
   * Format error for display
   */
  formatError(error: any): { message: string; suggestion?: string } {
    const errorInfo = this.parseApiError(error)
    return {
      message: errorInfo.message,
      suggestion: errorInfo.suggestion
    }
  }
}

// Singleton instance
export const errorMessageService = new ErrorMessageServiceClass()

// Export class for testing
export { ErrorMessageServiceClass, ERROR_MESSAGES }
