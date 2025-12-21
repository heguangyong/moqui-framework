import { apiService } from './api'

/**
 * Scene Management API Service
 * Handles all scene-related operations
 */
export class SceneApiService {
  /**
   * Enhance scenes with AI analysis
   */
  async enhanceScenes(novelId: string): Promise<{
    success: boolean
    scenesEnhanced?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/scenes/enhance', {
        novelId
      })
      
      return {
        success: response.data.success || true,
        scenesEnhanced: response.data.scenesEnhanced,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to enhance scenes:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to enhance scenes'
      }
    }
  }

  /**
   * Get scenes for a novel
   */
  async getScenes(novelId: string, filters?: {
    chapterId?: string
    status?: string
    mood?: string
    timeOfDay?: string
    weather?: string
  }): Promise<{
    success: boolean
    scenes?: Array<{
      sceneId: string
      novelId: string
      chapterId: string
      sceneNumber: number
      content: string
      setting?: string
      mood?: string
      timeOfDay?: string
      weather?: string
      visualDescription?: string
      status: 'pending' | 'enhanced' | 'approved'
      isApproved?: boolean
      createdDate: string
      chapter?: {
        chapterId: string
        chapterNumber: number
        title: string
      }
    }>
    totalCount?: number
    message?: string
  }> {
    try {
      const params: any = { novelId }
      if (filters) {
        Object.assign(params, filters)
      }
      
      const response = await apiService.axiosInstance.get('/novels/scenes', { params })
      
      return {
        success: true,
        scenes: response.data.scenes || response.data,
        totalCount: response.data.totalCount
      }
    } catch (error: any) {
      console.error('Failed to get scenes:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get scenes'
      }
    }
  }

  /**
   * Update scene information
   */
  async updateScene(sceneId: string, updates: {
    content?: string
    setting?: string
    mood?: string
    timeOfDay?: string
    weather?: string
    visualDescription?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.put('/scene', {
        sceneId,
        ...updates
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to update scene:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update scene'
      }
    }
  }

  /**
   * Approve/reject scene
   */
  async approveScene(sceneId: string, isApproved: boolean): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/scene/approve', {
        sceneId,
        isApproved: isApproved ? 'Y' : 'N'
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to approve scene:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve scene'
      }
    }
  }

  /**
   * Re-analyze scene
   */
  async reanalyzeScene(sceneId: string, parameters?: {
    focusOnVisuals?: boolean
    enhanceDialogue?: boolean
    analyzeCharacters?: boolean
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/scene/reanalyze', {
        sceneId,
        ...parameters
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to reanalyze scene:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reanalyze scene'
      }
    }
  }

  /**
   * Get scene statistics
   */
  async getSceneStats(novelId: string): Promise<{
    success: boolean
    stats?: {
      totalScenes: number
      pendingScenes: number
      enhancedScenes: number
      approvedScenes: number
      averageSceneLength: number
      moodDistribution: Record<string, number>
      timeDistribution: Record<string, number>
      weatherDistribution: Record<string, number>
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/novels/scenes/stats', {
        params: { novelId }
      })
      
      return {
        success: true,
        stats: response.data.stats || response.data
      }
    } catch (error: any) {
      console.error('Failed to get scene stats:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get scene stats'
      }
    }
  }
}

// Export singleton instance
export const sceneApi = new SceneApiService()
export default sceneApi