/**
 * API Type Definitions
 * API 响应和错误类型定义
 * 
 * Requirements: 7.1, 8.2
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // API 错误
  API_ERROR = 'API_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  
  // 认证错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 资源错误
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 服务器错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // 未知错误
  UNKNOWN = 'UNKNOWN',
}

/**
 * API 错误接口
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  originalError?: Error;
  statusCode?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * 基础 API 响应接口
 */
export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 基础查询参数
 */
export interface BaseQueryParams extends PaginationParams {
  search?: string;
  filter?: Record<string, unknown>;
}

// ============================================================================
// Auth Types
// ============================================================================

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: UserInfo;
  message?: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  userId: string;
  email: string;
  username?: string;
  avatar?: string;
  createdAt?: string;
}

// ============================================================================
// Project Types
// ============================================================================

/**
 * 项目信息
 */
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  status: string;
  userId: string;
  createdDate: string;
  lastUpdatedDate: string;
}

/**
 * 创建项目请求
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  userId?: string;
}

/**
 * 更新项目请求
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
}

// ============================================================================
// Asset Types
// ============================================================================

/**
 * 资产类型
 */
export type AssetType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'model'
  | 'other';

/**
 * 资产信息
 */
export interface Asset {
  assetId: string;
  projectId?: string;
  novelId?: string;
  userId?: string;
  assetType: AssetType;
  name: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
  version?: string;
  isShared?: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

/**
 * 创建资产请求
 */
export interface CreateAssetRequest {
  projectId?: string;
  novelId?: string;
  userId?: string;
  assetType: AssetType;
  name: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
  version?: string;
  isShared?: boolean;
}

/**
 * 更新资产请求
 */
export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
  version?: string;
  isShared?: boolean;
}

// ============================================================================
// Novel Types
// ============================================================================

/**
 * 小说信息
 */
export interface Novel {
  novelId: string;
  projectId?: string;
  title: string;
  author?: string;
  description?: string;
  content?: string;
  chapters?: NovelChapter[];
  status: string;
  createdDate: string;
  lastUpdatedDate: string;
}

/**
 * 小说章节
 */
export interface NovelChapter {
  chapterId: string;
  novelId: string;
  title: string;
  content: string;
  orderIndex: number;
  createdDate: string;
  lastUpdatedDate: string;
}

// ============================================================================
// User Settings Types
// ============================================================================

/**
 * 通知设置
 */
export interface NotificationSettings {
  email?: boolean;
  push?: boolean;
}

/**
 * 用户设置
 */
export interface UserSettings {
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: NotificationSettings;
  defaultWorkflowTemplate?: string;
  autoSave?: boolean;
}

/**
 * 更新用户设置请求
 */
export interface UpdateUserSettingsRequest {
  userId?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: NotificationSettings;
  defaultWorkflowTemplate?: string;
  autoSave?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 创建 API 错误的工厂函数类型
 */
export type CreateApiErrorFn = (
  error: unknown,
  context?: string
) => ApiError;

/**
 * HTTP 方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 请求配置
 */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}
