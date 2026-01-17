/**
 * Error Handler Service
 * 统一的错误处理模块
 * 
 * Requirements: 7.1
 */

import { ErrorCode } from '../types/api';

// ============================================================================
// Types
// ============================================================================

/**
 * 应用错误类型
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * 错误严重级别
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  shouldLog?: boolean;
  shouldNotify?: boolean;
}

// ============================================================================
// Error Creation Functions
// ============================================================================

/**
 * 创建应用错误
 * @param code 错误代码
 * @param message 错误消息
 * @param options 可选配置
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  options: ErrorHandlerOptions = {}
): AppError {
  const error: AppError = {
    code,
    message,
    timestamp: new Date().toISOString(),
    context: options.context,
  };

  if (options.shouldLog !== false) {
    logError(error, options.severity || 'error');
  }

  return error;
}

/**
 * 从原生 Error 创建 AppError
 */
export function fromError(
  error: Error | unknown,
  code: ErrorCode = ErrorCode.UNKNOWN,
  options: ErrorHandlerOptions = {}
): AppError {
  const message = error instanceof Error ? error.message : String(error);
  const appError = createAppError(code, message, options);
  
  if (error instanceof Error) {
    appError.originalError = error;
    appError.details = error.stack;
  }
  
  return appError;
}

/**
 * 从 API 响应创建错误
 */
export function fromApiResponse(
  response: { success: boolean; message?: string; errorCode?: string },
  defaultCode: ErrorCode = ErrorCode.API_ERROR
): AppError | null {
  if (response.success) return null;
  
  const code = (response.errorCode as ErrorCode) || defaultCode;
  return createAppError(code, response.message || 'API request failed');
}

// ============================================================================
// Error Code Helpers
// ============================================================================

/**
 * 获取错误代码的用户友好消息
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
    [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
    [ErrorCode.FORBIDDEN]: '没有权限执行此操作',
    [ErrorCode.NOT_FOUND]: '请求的资源不存在',
    [ErrorCode.VALIDATION_ERROR]: '输入数据验证失败',
    [ErrorCode.SERVER_ERROR]: '服务器内部错误，请稍后重试',
    [ErrorCode.TIMEOUT]: '请求超时，请稍后重试',
    [ErrorCode.API_ERROR]: 'API 请求失败',
    [ErrorCode.UNKNOWN]: '发生未知错误',
  };
  
  return messages[code] || messages[ErrorCode.UNKNOWN];
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes: ErrorCode[] = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.SERVER_ERROR,
  ];
  
  return retryableCodes.includes(error.code);
}

/**
 * 判断错误是否需要重新登录
 */
export function requiresReauth(error: AppError): boolean {
  return error.code === ErrorCode.UNAUTHORIZED;
}

// ============================================================================
// Logging
// ============================================================================

/**
 * 记录错误日志
 */
function logError(error: AppError, severity: ErrorSeverity): void {
  const prefix = `[${severity.toUpperCase()}]`;
  const logMessage = `${prefix} ${error.code}: ${error.message}`;
  
  switch (severity) {
    case 'info':
      console.info(logMessage, error.context);
      break;
    case 'warning':
      console.warn(logMessage, error.context);
      break;
    case 'error':
    case 'critical':
      console.error(logMessage, error.context, error.originalError);
      break;
  }
}

// ============================================================================
// Error Boundary Helper
// ============================================================================

/**
 * 安全执行异步操作，捕获错误
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN,
  options: ErrorHandlerOptions = {}
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (e) {
    const error = fromError(e, errorCode, options);
    return { data: null, error };
  }
}

/**
 * 安全执行同步操作，捕获错误
 */
export function safeSync<T>(
  operation: () => T,
  errorCode: ErrorCode = ErrorCode.UNKNOWN,
  options: ErrorHandlerOptions = {}
): { data: T | null; error: AppError | null } {
  try {
    const data = operation();
    return { data, error: null };
  } catch (e) {
    const error = fromError(e, errorCode, options);
    return { data: null, error };
  }
}
