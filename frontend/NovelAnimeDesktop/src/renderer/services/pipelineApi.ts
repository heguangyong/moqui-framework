import { apiService } from './api'

/**
 * Processing Pipeline API Service
 * Handles all pipeline-related operations
 */
export class PipelineApiService {
  /**
   * Create processing pipeline for a novel
   */
  async createPipeline(novelId: string): Promise<{
    success: boolean
    pipeline?: {
      pipelineId: string
      novelId: string
      status: string
      currentStage: string
      totalStages: number
      completedStages: number
      creditsReserved: number
      creditsUsed: number
      estimatedDuration: number
      createdDate: string
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/pipeline/create', {
        novelId
      })
      
      return {
        success: response.data.success || true,
        pipeline: response.data.pipeline,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to create pipeline:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create pipeline'
      }
    }
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(novelId: string): Promise<{
    success: boolean
    pipeline?: {
      pipelineId: string
      novelId: string
      status: string
      currentStage: string
      totalStages: number
      completedStages: number
      creditsReserved: number
      creditsUsed: number
      estimatedDuration: number
      startTime?: string
      endTime?: string
      errorMessage?: string
      stages?: Array<{
        stageName: string
        status: string
        startTime?: string
        endTime?: string
        creditsUsed?: number
      }>
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/novels/pipeline/status', {
        params: { novelId }
      })
      
      return {
        success: true,
        pipeline: response.data.pipeline || response.data
      }
    } catch (error: any) {
      console.error('Failed to get pipeline status:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get pipeline status'
      }
    }
  }

  /**
   * Update pipeline progress
   */
  async updateProgress(data: {
    pipelineId: string
    currentStage?: string
    completedStages?: number
    creditsUsed?: number
    progress?: number
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.put('/novels/pipeline/update', data)
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to update pipeline progress:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update pipeline progress'
      }
    }
  }

  /**
   * Complete pipeline
   */
  async completePipeline(data: {
    pipelineId: string
    finalCreditsUsed?: number
  }): Promise<{
    success: boolean
    creditsRefunded?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/pipeline/complete', data)
      
      return {
        success: response.data.success || true,
        creditsRefunded: response.data.creditsRefunded,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to complete pipeline:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to complete pipeline'
      }
    }
  }

  /**
   * Fail pipeline
   */
  async failPipeline(data: {
    pipelineId: string
    errorMessage: string
    failedStage?: string
  }): Promise<{
    success: boolean
    creditsRefunded?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/pipeline/fail', data)
      
      return {
        success: response.data.success || true,
        creditsRefunded: response.data.creditsRefunded,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to fail pipeline:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fail pipeline'
      }
    }
  }

  /**
   * Monitor pipeline progress with polling
   */
  async monitorPipeline(
    novelId: string,
    onProgress: (pipeline: any) => void,
    onComplete: (pipeline: any) => void,
    onError: (error: string) => void,
    pollInterval: number = 2000
  ): Promise<() => void> {
    let isMonitoring = true
    
    const poll = async () => {
      if (!isMonitoring) return
      
      try {
        const result = await this.getPipelineStatus(novelId)
        
        if (result.success && result.pipeline) {
          onProgress(result.pipeline)
          
          if (result.pipeline.status === 'completed') {
            isMonitoring = false
            onComplete(result.pipeline)
            return
          }
          
          if (result.pipeline.status === 'failed') {
            isMonitoring = false
            onError(result.pipeline.errorMessage || 'Pipeline failed')
            return
          }
        } else {
          onError(result.message || 'Failed to get pipeline status')
          return
        }
        
        // Continue polling
        setTimeout(poll, pollInterval)
      } catch (error: any) {
        isMonitoring = false
        onError(error.message || 'Monitoring error')
      }
    }
    
    // Start polling
    poll()
    
    // Return stop function
    return () => {
      isMonitoring = false
    }
  }
}

// Export singleton instance
export const pipelineApi = new PipelineApiService()
export default pipelineApi