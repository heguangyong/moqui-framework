/**
 * Marketplace API服务
 * 上海港集装箱运输供需匹配系统
 */
import { MoquiApiService, type ApiResponse } from './base'

// ==================== 类型定义 ====================

/**
 * 订单类型
 */
export interface Order {
  listingId: string
  listingType: 'SUPPLY' | 'DEMAND'
  title: string
  description: string
  
  // 路线信息
  originPort: string          // 起运港
  destinationPort: string     // 目的港
  distance: number            // 距离(km)
  duration: string            // 预计时长
  
  // 箱型信息
  containerType: string       // 20GP, 40GP, 40HQ等
  quantity: number
  
  // 时间信息
  latestPickup: string        // 最晚提箱时间
  validFrom: string
  validThru: string
  
  // 价格信息
  freight: number             // 运费
  currencyUomId: string
  
  // 特殊要求
  requiresShPlate: boolean    // 需要沪牌
  requiresHydraulicTailgate: boolean  // 需要液压尾板
  requiresPortExperience: boolean     // 需要熟悉港区
  
  // 货主信息
  shipper: {
    partyId: string
    name: string
    rating: number
    transactions: number
  }
  
  // 状态
  status: 'ACTIVE' | 'MATCHED' | 'EXPIRED' | 'CANCELLED'
  countdown?: number          // 抢单倒计时(秒)
  
  // 位置信息
  geoPointId?: string
  locationDesc?: string
}

/**
 * 订单列表查询参数
 */
export interface OrderListParams {
  listingType?: 'SUPPLY' | 'DEMAND'
  status?: string
  category?: string
  port?: string               // 港区筛选
  requiresShPlate?: boolean   // 沪牌筛选
  pageIndex?: number
  pageSize?: number
}

/**
 * 订单执行步骤
 */
export interface OrderStep {
  stepId: number
  label: string
  status: 'completed' | 'active' | 'pending'
  timestamp?: string
  location?: {
    lat: number
    lng: number
    address: string
  }
  data?: {
    containerNumber?: string  // 集装箱号
    sealNumber?: string       // 铅封号
    photos?: string[]         // 照片URLs
  }
}

/**
 * 订单执行信息
 */
export interface OrderExecution {
  orderId: string
  listingId: string
  currentStep: number
  steps: OrderStep[]
  route: {
    origin: { lat: number; lng: number; address: string }
    destination: { lat: number; lng: number; address: string }
    waypoints?: Array<{ lat: number; lng: number; address: string }>
  }
}

/**
 * 钱包信息
 */
export interface WalletInfo {
  balance: number             // 可用余额
  inTransit: number          // 在途运费
  inTransitCount: number     // 在途订单数
  todayIncome: number        // 今日收入
  weekIncome: number         // 本周收入
  currencyUomId: string
}

/**
 * 账单记录
 */
export interface BillRecord {
  billId: string
  timestamp: string
  type: 'INCOME' | 'WITHDRAW' | 'RECHARGE'
  amount: number
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  orderId?: string
  route?: string
  description: string
}

/**
 * 用户资料
 */
export interface UserProfile {
  partyId: string
  name: string
  plateNumber: string         // 车牌号
  level: number               // 等级
  levelName: string           // 等级名称 (如"洋山港熟手Lv.3")
  rating: number
  transactions: number
  certificates: Array<{
    type: string
    number: string
    validThru: string
  }>
}

// ==================== API服务类 ====================

export class MarketplaceApiService extends MoquiApiService {
  constructor() {
    super()
  }

  // ==================== 订单管理 ====================

  /**
   * 获取订单列表
   */
  async getOrderList(params: OrderListParams = {}): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    const queryParams = new URLSearchParams()
    
    if (params.listingType) queryParams.append('listingType', params.listingType)
    if (params.status) queryParams.append('status', params.status)
    if (params.category) queryParams.append('category', params.category)
    if (params.port) queryParams.append('port', params.port)
    if (params.requiresShPlate !== undefined) queryParams.append('requiresShPlate', String(params.requiresShPlate))
    if (params.pageIndex) queryParams.append('pageIndex', String(params.pageIndex))
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize))

    return this.get<{ orders: Order[]; total: number }>(
      `/rest/s1/marketplace/listing?${queryParams.toString()}`
    )
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(listingId: string): Promise<ApiResponse<Order>> {
    return this.get<Order>(`/rest/s1/marketplace/listing/${listingId}`)
  }

  /**
   * 抢单
   */
  async grabOrder(listingId: string, driverInfo?: any): Promise<ApiResponse<{ orderId: string; message: string }>> {
    return this.post<{ orderId: string; message: string }>(
      `/rest/s1/marketplace/listing/${listingId}/grab`,
      driverInfo
    )
  }

  /**
   * 发布订单
   */
  async publishOrder(orderData: Partial<Order>): Promise<ApiResponse<{ listingId: string }>> {
    return this.post<{ listingId: string }>('/rest/s1/marketplace/listing', orderData)
  }

  /**
   * 更新订单
   */
  async updateOrder(listingId: string, orderData: Partial<Order>): Promise<ApiResponse<{ success: boolean }>> {
    return this.put<{ success: boolean }>(`/rest/s1/marketplace/listing/${listingId}`, orderData)
  }

  /**
   * 取消订单
   */
  async cancelOrder(listingId: string, reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>(`/rest/s1/marketplace/listing/${listingId}/cancel`, { reason })
  }

  // ==================== 订单执行 ====================

  /**
   * 获取订单执行信息
   */
  async getOrderExecution(orderId: string): Promise<ApiResponse<OrderExecution>> {
    return this.get<OrderExecution>(`/rest/s1/marketplace/order/${orderId}/execution`)
  }

  /**
   * 更新订单步骤
   */
  async updateOrderStep(
    orderId: string,
    stepId: number,
    stepData: {
      containerNumber?: string
      sealNumber?: string
      photos?: string[]
      location?: { lat: number; lng: number }
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>(
      `/rest/s1/marketplace/order/${orderId}/step/${stepId}`,
      stepData
    )
  }

  /**
   * 上传照片
   */
  async uploadPhoto(orderId: string, photoBlob: Blob): Promise<ApiResponse<{ photoUrl: string }>> {
    const formData = new FormData()
    formData.append('photo', photoBlob, 'container-photo.jpg')
    formData.append('orderId', orderId)

    return this.upload<{ photoUrl: string }>('/rest/s1/marketplace/order/photo', formData)
  }

  /**
   * 完成订单
   */
  async completeOrder(orderId: string, completionData: any): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>(
      `/rest/s1/marketplace/order/${orderId}/complete`,
      completionData
    )
  }

  // ==================== 钱包管理 ====================

  /**
   * 获取钱包信息
   */
  async getWalletInfo(): Promise<ApiResponse<WalletInfo>> {
    return this.get<WalletInfo>('/rest/s1/marketplace/wallet')
  }

  /**
   * 获取账单列表
   */
  async getBillList(params: {
    pageIndex?: number
    pageSize?: number
    type?: string
  } = {}): Promise<ApiResponse<{ bills: BillRecord[]; total: number }>> {
    const queryParams = new URLSearchParams()
    if (params.pageIndex) queryParams.append('pageIndex', String(params.pageIndex))
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize))
    if (params.type) queryParams.append('type', params.type)

    return this.get<{ bills: BillRecord[]; total: number }>(
      `/rest/s1/marketplace/wallet/bills?${queryParams.toString()}`
    )
  }

  /**
   * 提现
   */
  async withdraw(amount: number, bankInfo?: any): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.post<{ success: boolean; message: string }>('/rest/s1/marketplace/wallet/withdraw', {
      amount,
      bankInfo
    })
  }

  /**
   * 充值
   */
  async recharge(amount: number, paymentMethod?: string): Promise<ApiResponse<{ success: boolean; paymentUrl?: string }>> {
    return this.post<{ success: boolean; paymentUrl?: string }>('/rest/s1/marketplace/wallet/recharge', {
      amount,
      paymentMethod
    })
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户资料
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>('/rest/s1/marketplace/profile')
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<{ success: boolean }>> {
    return this.put<{ success: boolean }>('/rest/s1/marketplace/profile', profileData)
  }

  /**
   * 获取我的订单列表
   */
  async getMyOrders(params: {
    status?: string
    pageIndex?: number
    pageSize?: number
  } = {}): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.pageIndex) queryParams.append('pageIndex', String(params.pageIndex))
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize))

    return this.get<{ orders: Order[]; total: number }>(
      `/rest/s1/marketplace/profile/orders?${queryParams.toString()}`
    )
  }

  // ==================== 统计信息 ====================

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ApiResponse<any>> {
    return this.get('/rest/s1/marketplace/stats')
  }

  /**
   * 获取匹配统计
   */
  async getMatchingStats(): Promise<ApiResponse<any>> {
    return this.get('/rest/s1/marketplace/stats/matching')
  }

  // ==================== 地图相关 ====================

  /**
   * 获取路线规划
   */
  async getRoutePlan(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints?: Array<{ lat: number; lng: number }>
  ): Promise<ApiResponse<any>> {
    return this.post('/rest/s1/marketplace/route/plan', {
      origin,
      destination,
      waypoints
    })
  }

  /**
   * 获取港区信息
   */
  async getPortInfo(portCode: string): Promise<ApiResponse<any>> {
    return this.get(`/rest/s1/marketplace/port/${portCode}`)
  }
}

// 导出单例实例
export const marketplaceApi = new MarketplaceApiService()
