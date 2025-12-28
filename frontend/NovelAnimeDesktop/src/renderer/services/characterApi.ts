import { apiService } from './api'

/**
 * Character Management API Service
 * Handles all character-related operations
 */
export class CharacterApiService {
  /**
   * Extract characters from a novel
   */
  async extractCharacters(novelId: string): Promise<{
    success: boolean
    charactersExtracted?: number
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/novels/extract-characters', {
        novelId
      })
      
      return {
        success: response.data.success || true,
        charactersExtracted: response.data.charactersExtracted,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to extract characters:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to extract characters'
      }
    }
  }

  /**
   * Get characters for a novel
   */
  async getCharacters(novelId: string, filters?: {
    role?: string
    isLocked?: boolean
    minMentionCount?: number
  }): Promise<{
    success: boolean
    characters?: Array<{
      characterId: string
      novelId: string
      name: string
      role: 'protagonist' | 'supporting' | 'minor' | 'antagonist'
      description?: string
      appearance?: string
      personality?: string
      mentionCount: number
      extractionConfidence: number
      isLocked: boolean
      createdDate: string
      relationships?: Array<{
        relatedCharacterId: string
        relatedCharacterName: string
        relationshipType: string
        description?: string
      }>
    }>
    totalCount?: number
    message?: string
  }> {
    try {
      const params: any = { novelId }
      if (filters) {
        Object.assign(params, filters)
      }
      
      const response = await apiService.axiosInstance.get('/characters', { params })
      
      return {
        success: true,
        characters: response.data.characters || response.data,
        totalCount: response.data.totalCount
      }
    } catch (error: any) {
      console.error('Failed to get characters:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get characters'
      }
    }
  }

  /**
   * Get single character details
   */
  async getCharacter(characterId: string): Promise<{
    success: boolean
    character?: any
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.get('/character', {
        params: { characterId }
      })
      
      return {
        success: true,
        character: response.data.character || response.data
      }
    } catch (error: any) {
      console.error('Failed to get character:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get character'
      }
    }
  }

  /**
   * Update character information
   */
  async updateCharacter(characterId: string, updates: {
    name?: string
    role?: 'protagonist' | 'supporting' | 'minor' | 'antagonist'
    description?: string
    appearance?: string
    personality?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.put('/character', {
        characterId,
        ...updates
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to update character:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update character'
      }
    }
  }

  /**
   * Lock/unlock character
   */
  async lockCharacter(characterId: string, isLocked: boolean): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/character/lock', {
        characterId,
        isLocked: isLocked ? 'Y' : 'N'
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to lock character:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to lock character'
      }
    }
  }

  /**
   * Merge characters
   */
  async mergeCharacters(data: {
    primaryCharacterId: string
    duplicateCharacterId: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/characters-merge', data)
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to merge characters:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to merge characters'
      }
    }
  }

  /**
   * Delete character
   */
  async deleteCharacter(characterId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.delete('/character', {
        params: { characterId }
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to delete character:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete character'
      }
    }
  }

  /**
   * Create character relationship
   */
  async createRelationship(data: {
    characterId: string
    relatedCharacterId: string
    relationshipType: string
    description?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await apiService.axiosInstance.post('/character/relationships', data)
      
      return {
        success: response.data.success || true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to create relationship:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create relationship'
      }
    }
  }
}

// Export singleton instance
export const characterApi = new CharacterApiService()
export default characterApi