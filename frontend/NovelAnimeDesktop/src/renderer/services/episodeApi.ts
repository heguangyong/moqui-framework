import { apiService } from './api'

/**
 * Episode Management API Service
 * Handles all episode-related operations
 */
export class EpisodeApiService {
  /**
   * Generate episodes from scenes
   */
  async generateEpisodes(novelId: string, options?: {
    targetDuration?: number // minutes per episode
    maxEpisodes?: number
    groupingStrategy?: 'duration' | 'scenes' | 'chapters'
  }): Promise<{
    success: boolean
    episodesGenerated?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/episodes/generate', {
        novelId,
        ...options
      })
      
      return {
        success: response.data.success || true,
        episodesGenerated: response.data.episodesGenerated,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to generate episodes:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate episodes'
      }
    }
  }

  /**
   * Get episodes for a novel
   */
  async getEpisodes(novelId: string, filters?: {
    status?: string
    minDuration?: number
    maxDuration?: number
  }): Promise<{
    success: boolean
    episodes?: Array<{
      episodeId: string
      novelId: string
      episodeNumber: number
      title: string
      summary?: string
      duration: number // minutes
      status: 'generated' | 'reviewed' | 'finalized'
      sceneCount: number
      createdDate: string
      scenes?: Array<{
        sceneId: string
        sequenceNumber: number
        title?: string
        duration?: number
        setting?: string
        mood?: string
      }>
    }>
    totalCount?: number
    totalDuration?: number
    message?: string
  }> {
    try {
      const params: any = { novelId }
      if (filters) {
        Object.assign(params, filters)
      }
      
      const response = await apiService.axiosInstance.get('/novels/episodes', { params })
      
      return {
        success: true,
        episodes: response.data.episodes || response.data,
        totalCount: response.data.totalCount,
        totalDuration: response.data.totalDuration
      }
    } catch (error: any) {
      console.error('Failed to get episodes:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get episodes'
      }
    }
  }

  /**
   * Update episode information
   */
  async updateEpisode(episodeId: string, updates: {
    title?: string
    summary?: string
    status?: 'generated' | 'reviewed' | 'finalized'
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.put('/episode', {
        episodeId,
        ...updates
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to update episode:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update episode'
      }
    }
  }

  /**
   * Delete episode
   */
  async deleteEpisode(episodeId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.delete('/episode', {
        params: { episodeId }
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to delete episode:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete episode'
      }
    }
  }

  /**
   * Generate screenplay for episode
   */
  async generateScreenplay(episodeId: string, options?: {
    format?: 'markdown' | 'pdf' | 'docx'
    includeVisualNotes?: boolean
    includeCharacterNotes?: boolean
    includeDirectorNotes?: boolean
  }): Promise<{
    success: boolean
    screenplay?: {
      screenplayId: string
      episodeId: string
      format: string
      content: string
      generatedDate: string
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/episode/screenplay', {
        episodeId,
        ...options
      })
      
      return {
        success: response.data.success || true,
        screenplay: response.data.screenplay,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to generate screenplay:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate screenplay'
      }
    }
  }

  /**
   * Adjust episode boundaries
   */
  async adjustBoundaries(data: {
    episodeId: string
    newScenes: Array<{
      sceneId: string
      sequenceNumber: number
    }>
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/episode/adjust-boundaries', data)
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to adjust episode boundaries:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to adjust episode boundaries'
      }
    }
  }

  /**
   * Get episode statistics
   */
  async getEpisodeStats(novelId: string): Promise<{
    success: boolean
    stats?: {
      totalEpisodes: number
      totalDuration: number
      averageDuration: number
      averageScenesPerEpisode: number
      statusDistribution: Record<string, number>
      durationDistribution: Array<{
        range: string
        count: number
      }>
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/novels/episodes/stats', {
        params: { novelId }
      })
      
      return {
        success: true,
        stats: response.data.stats || response.data
      }
    } catch (error: any) {
      console.error('Failed to get episode stats:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get episode stats'
      }
    }
  }
}

// Export singleton instance
export const episodeApi = new EpisodeApiService()
export default episodeApi