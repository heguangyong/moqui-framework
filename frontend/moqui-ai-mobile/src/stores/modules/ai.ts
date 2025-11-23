import { defineStore } from 'pinia'

export interface AIState {
  isVoiceRecording: boolean
  isImageAnalyzing: boolean
  isProcessing: boolean
  conversation: Array<{
    id: string
    type: 'user' | 'assistant'
    content: string
    timestamp: Date
    metadata?: any
  }>
  analysisHistory: Array<{
    id: string
    type: 'voice' | 'image'
    result: any
    timestamp: Date
  }>
}

export const useAIStore = defineStore('ai', {
  state: (): AIState => ({
    isVoiceRecording: false,
    isImageAnalyzing: false,
    isProcessing: false,
    conversation: [],
    analysisHistory: []
  }),

  getters: {
    isBusy: (state) => state.isVoiceRecording || state.isImageAnalyzing || state.isProcessing,
    recentAnalysis: (state) => state.analysisHistory.slice(0, 10)
  },

  actions: {
    startVoiceRecording() {
      this.isVoiceRecording = true
    },

    stopVoiceRecording() {
      this.isVoiceRecording = false
    },

    startImageAnalysis() {
      this.isImageAnalyzing = true
    },

    stopImageAnalysis() {
      this.isImageAnalyzing = false
    },

    setProcessing(processing: boolean) {
      this.isProcessing = processing
    },

    addMessage(content: string, type: 'user' | 'assistant', metadata?: any) {
      this.conversation.push({
        id: `msg_${Date.now()}_${Math.random()}`,
        type,
        content,
        timestamp: new Date(),
        metadata
      })

      // 限制对话历史长度
      if (this.conversation.length > 100) {
        this.conversation = this.conversation.slice(-100)
      }
    },

    addAnalysisResult(type: 'voice' | 'image', result: any) {
      this.analysisHistory.unshift({
        id: `analysis_${Date.now()}_${Math.random()}`,
        type,
        result,
        timestamp: new Date()
      })

      // 限制历史记录长度
      if (this.analysisHistory.length > 50) {
        this.analysisHistory = this.analysisHistory.slice(0, 50)
      }
    },

    clearConversation() {
      this.conversation = []
    },

    clearAnalysisHistory() {
      this.analysisHistory = []
    }
  }
})