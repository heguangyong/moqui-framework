/**
 * Unified API Services Export
 * Provides easy access to all API services
 */

// Core API service
export { apiService } from './api'

// Specialized API services
export { novelApi } from './novelApi'
export { pipelineApi } from './pipelineApi'
export { characterApi } from './characterApi'
export { sceneApi } from './sceneApi'
export { episodeApi } from './episodeApi'

// Re-export for convenience using ES6 imports
import { apiService } from './api'
import { novelApi } from './novelApi'
import { pipelineApi } from './pipelineApi'
import { characterApi } from './characterApi'
import { sceneApi } from './sceneApi'
import { episodeApi } from './episodeApi'

export default {
  api: apiService,
  novel: novelApi,
  pipeline: pipelineApi,
  character: characterApi,
  scene: sceneApi,
  episode: episodeApi
}