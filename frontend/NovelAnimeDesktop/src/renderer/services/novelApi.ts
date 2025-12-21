import { apiService } from './api'

/**
 * Novel Management API Service
 * Handles all novel-related operations
 */
export class NovelApiService {
  /**
   * Import text as a novel
   */
  async importText(data: {
    projectId: string
    title: string
    author?: string
    content: string
  }): Promise<{
    success: boolean
    novel?: {
      novelId: string
      title: string
      author?: string
      wordCount: number
      status: string
      createdDate: string
    }
    creditsUsed?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/import-text', data)
      
      return {
        success: response.data.success || true,
        novel: response.data.novel,
        creditsUsed: response.data.creditsUsed,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to import text:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to import text'
      }
    }
  }

  /**
   * Import file as a novel
   */
  async importFile(data: {
    projectId: string
    title?: string
    author?: string
    fileName: string
    fileContent: string // base64 encoded
  }): Promise<{
    success: boolean
    novel?: any
    creditsUsed?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/import-file', data)
      
      return {
        success: response.data.success || true,
        novel: response.data.novel,
        creditsUsed: response.data.creditsUsed,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to import file:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to import file'
      }
    }
  }

  /**
   * Analyze novel structure (chapters and scenes)
   */
  async analyzeStructure(novelId: string): Promise<{
    success: boolean
    chaptersCreated?: number
    scenesCreated?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/analyze-structure', {
        novelId
      })
      
      return {
        success: response.data.success || true,
        chaptersCreated: response.data.chaptersCreated,
        scenesCreated: response.data.scenesCreated,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to analyze structure:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to analyze structure'
      }
    }
  }

  /**
   * Get novel details
   */
  async getNovel(novelId: string): Promise<{
    success: boolean
    novel?: {
      novelId: string
      title: string
      author?: string
      content?: string
      wordCount: number
      status: string
      createdDate: string
      chapters?: Array<{
        chapterId: string
        chapterNumber: number
        title: string
        content: string
        wordCount: number
      }>
      scenes?: Array<{
        sceneId: string
        chapterId: string
        sceneNumber: number
        content: string
        setting?: string
        mood?: string
        timeOfDay?: string
        weather?: string
        visualDescription?: string
        status?: string
      }>
    }
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/novel', {
        params: { novelId }
      })
      
      return {
        success: true,
        novel: response.data.novel || response.data
      }
    } catch (error: any) {
      console.error('Failed to get novel:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get novel'
      }
    }
  }

  /**
   * List novels for a project
   */
  async listNovels(projectId: string): Promise<{
    success: boolean
    novels?: Array<{
      novelId: string
      title: string
      author?: string
      wordCount: number
      status: string
      createdDate: string
    }>
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/novels', {
        params: { projectId }
      })
      
      return {
        success: true,
        novels: response.data.novels || response.data
      }
    } catch (error: any) {
      console.error('Failed to list novels:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to list novels'
      }
    }
  }

  /**
   * Update novel metadata
   */
  async updateNovel(novelId: string, updates: {
    title?: string
    author?: string
    status?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.put('/novel', {
        novelId,
        ...updates
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to update novel:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update novel'
      }
    }
  }

  /**
   * Delete novel
   */
  async deleteNovel(novelId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.delete('/novel', {
        params: { novelId }
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to delete novel:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete novel'
      }
    }
  }
}

// Export singleton instance
export const novelApi = new NovelApiService()
export default novelApi