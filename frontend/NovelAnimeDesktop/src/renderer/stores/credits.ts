/**
 * Novel Anime Credits Store
 * Manages user credits state for Novel Anime Generator
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2
 */
import { defineStore } from 'pinia'
import { creditsApi } from '../services/creditsApi'
import { useAuthStore } from './auth'

// Credit transaction interface
export interface CreditTransaction {
  transactionId: string
  amount: number
  type: 'consume' | 'add' | 'initial' | 'refund'
  operationType: string
  description: string
  balanceAfter: number
  timestamp: string
}

// Credits state interface (Requirements: 3.1, 3.3)
export interface CreditsState {
  balance: number
  isLow: boolean
  history: CreditTransaction[]
  totalHistoryCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  error: string | null
}

// Initial state
const getInitialState = (): CreditsState => ({
  balance: 0,
  isLow: false,
  history: [],
  totalHistoryCount: 0,
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  isLoading: false,
  error: null
})

export const useCreditsStore = defineStore('credits', {
  state: (): CreditsState => getInitialState(),

  getters: {
    hasSufficientCredits: (state) => (amount: number) => state.balance >= amount,
    formattedBalance: (state) => state.balance.toLocaleString(),
    hasMoreHistory: (state) => state.currentPage < state.totalPages,
    recentTransactions: (state) => state.history.slice(0, 5)
  },

  actions: {
    /**
     * Fetch credits balance from backend (Requirements: 3.1, 3.2)
     */
    async fetchBalance() {
      this.isLoading = true
      this.error = null

      try {
        const response = await creditsApi.getBalance()

        if (response.success && response.data?.success) {
          this.balance = response.data.balance
          this.isLow = response.data.isLow

          const authStore = useAuthStore()
          authStore.updateCredits(this.balance)

          return { success: true, balance: this.balance, isLow: this.isLow }
        } else {
          this.error = response.data?.message || response.error || '获取积分余额失败'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || '获取积分余额失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Consume credits for an operation (Requirements: 4.1, 4.2, 4.3)
     */
    async consumeCredits(amount: number, operationType: string, description?: string) {
      // Pre-operation credits check (Requirement 4.1)
      if (this.balance < amount) {
        return {
          success: false,
          error: `积分不足。需要: ${amount}, 当前: ${this.balance}`,
          errorCode: 'INSUFFICIENT_CREDITS'
        }
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await creditsApi.consume({
          amount,
          operationType,
          description
        })

        if (response.success && response.data?.success) {
          this.balance = response.data.newBalance
          this.isLow = this.balance < 50

          const authStore = useAuthStore()
          authStore.updateCredits(this.balance)

          return {
            success: true,
            newBalance: this.balance,
            transactionId: response.data.transactionId
          }
        } else {
          this.error = response.data?.message || response.error || '消费积分失败'
          return {
            success: false,
            error: this.error,
            errorCode: response.data?.errorCode
          }
        }
      } catch (error: any) {
        this.error = error.message || '消费积分失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch credits history with pagination (Requirements: 3.4, 8.2)
     */
    async fetchHistory(page: number = 1, type?: 'consume' | 'add' | 'initial' | 'refund') {
      this.isLoading = true
      this.error = null

      try {
        const response = await creditsApi.getHistory({
          page,
          pageSize: this.pageSize,
          type
        })

        if (response.success && response.data?.success) {
          if (page === 1) {
            this.history = response.data.transactions
          } else {
            this.history = [...this.history, ...response.data.transactions]
          }

          this.totalHistoryCount = response.data.totalCount
          this.currentPage = response.data.page
          this.totalPages = response.data.totalPages

          return { success: true, transactions: response.data.transactions }
        } else {
          this.error = response.data?.message || response.error || '获取积分历史失败'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || '获取积分历史失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async loadMoreHistory(type?: 'consume' | 'add' | 'initial' | 'refund') {
      if (!this.hasMoreHistory) {
        return { success: false, error: '没有更多记录' }
      }
      return this.fetchHistory(this.currentPage + 1, type)
    },

    async refreshHistory(type?: 'consume' | 'add' | 'initial' | 'refund') {
      this.history = []
      this.currentPage = 1
      return this.fetchHistory(1, type)
    },

    checkSufficientCredits(requiredAmount: number): boolean {
      return this.balance >= requiredAmount
    },

    getOperationCost(operationType: string): number {
      const costs: Record<string, number> = {
        'novel-parse': 10,
        'character-extract': 20,
        'video-generate': 50,
        'image-analyze': 15,
        'voice-recognize': 5
      }
      return costs[operationType] || 10
    },

    updateBalance(newBalance: number) {
      this.balance = newBalance
      this.isLow = newBalance < 50
    },

    resetState() {
      const initial = getInitialState()
      Object.assign(this, initial)
    },

    clearError() {
      this.error = null
    }
  }
})
