/**
 * AMap (高德地图) Service Wrapper
 * Provides SDK initialization and map instance management
 * 
 * Requirements: 1.1, 1.5
 */

import AMapLoader from '@amap/amap-jsapi-loader'

// Map loading states
export type MapLoadingState = 'idle' | 'loading' | 'loaded' | 'error'

// Map error types
export interface MapError {
  code: string
  message: string
  originalError?: unknown
}

// AMap configuration
export interface AMapConfig {
  key: string
  version?: string
  plugins?: string[]
}

// Map instance type (using any since AMap types are not available)
export type AMapInstance = any
export type AMapMarker = any
export type AMapPolyline = any

// Default configuration
const DEFAULT_CONFIG: Partial<AMapConfig> = {
  version: '2.0',
  plugins: [
    'AMap.Driving',
    'AMap.Geolocation',
    'AMap.PlaceSearch',
    'AMap.Geocoder',
    'AMap.Scale',
    'AMap.ToolBar'
  ]
}

// Service state
let mapLoadingState: MapLoadingState = 'idle'
let mapLoadError: MapError | null = null
let AMapSDK: any = null
let loadPromise: Promise<any> | null = null

// State change listeners
type StateChangeListener = (state: MapLoadingState, error?: MapError) => void
const stateListeners: Set<StateChangeListener> = new Set()

/**
 * Get the current loading state
 */
export function getLoadingState(): MapLoadingState {
  return mapLoadingState
}

/**
 * Get the last error if any
 */
export function getLoadError(): MapError | null {
  return mapLoadError
}

/**
 * Subscribe to state changes
 */
export function onStateChange(listener: StateChangeListener): () => void {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}

/**
 * Notify all listeners of state change
 */
function notifyStateChange(state: MapLoadingState, error?: MapError): void {
  mapLoadingState = state
  mapLoadError = error || null
  stateListeners.forEach(listener => listener(state, error))
}

/**
 * Initialize the AMap SDK
 * @param config AMap configuration with API key
 * @returns Promise resolving to the AMap SDK
 */
export async function initAMapSDK(config: AMapConfig): Promise<any> {
  // If already loaded, return the SDK
  if (mapLoadingState === 'loaded' && AMapSDK) {
    return AMapSDK
  }

  // If currently loading, wait for the existing promise
  if (mapLoadingState === 'loading' && loadPromise) {
    return loadPromise
  }

  // Start loading
  notifyStateChange('loading')

  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    plugins: [...(DEFAULT_CONFIG.plugins || []), ...(config.plugins || [])]
  }

  loadPromise = AMapLoader.load({
    key: mergedConfig.key,
    version: mergedConfig.version || '2.0',
    plugins: mergedConfig.plugins
  })
    .then((AMap) => {
      AMapSDK = AMap
      notifyStateChange('loaded')
      return AMap
    })
    .catch((error) => {
      const mapError: MapError = {
        code: 'MAP_LOAD_ERROR',
        message: '地图SDK加载失败，请检查网络连接后重试',
        originalError: error
      }
      notifyStateChange('error', mapError)
      loadPromise = null
      throw mapError
    })

  return loadPromise
}

/**
 * Get the loaded AMap SDK instance
 * @throws Error if SDK is not loaded
 */
export function getAMapSDK(): any {
  if (!AMapSDK) {
    throw new Error('AMap SDK not initialized. Call initAMapSDK first.')
  }
  return AMapSDK
}

/**
 * Check if SDK is loaded
 */
export function isSDKLoaded(): boolean {
  return mapLoadingState === 'loaded' && AMapSDK !== null
}

/**
 * Reset the service state (useful for testing or retry)
 */
export function resetAMapService(): void {
  mapLoadingState = 'idle'
  mapLoadError = null
  AMapSDK = null
  loadPromise = null
}

/**
 * Create a map instance
 * @param container DOM element or element ID
 * @param options Map options
 */
export function createMapInstance(
  container: string | HTMLElement,
  options: {
    center?: [number, number]
    zoom?: number
    viewMode?: '2D' | '3D'
    pitch?: number
    rotation?: number
  } = {}
): AMapInstance {
  const AMap = getAMapSDK()
  
  const defaultOptions = {
    zoom: 11,
    viewMode: '2D' as const,
    center: [121.8, 30.9] as [number, number] // Shanghai port area default
  }

  return new AMap.Map(container, {
    ...defaultOptions,
    ...options
  })
}

/**
 * Create a marker on the map
 */
export function createMarker(
  map: AMapInstance,
  options: {
    position: [number, number]
    title?: string
    icon?: string
    offset?: [number, number]
    anchor?: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
): AMapMarker {
  const AMap = getAMapSDK()
  
  const markerOptions: any = {
    position: new AMap.LngLat(options.position[0], options.position[1]),
    map
  }

  if (options.title) {
    markerOptions.title = options.title
  }

  if (options.icon) {
    markerOptions.icon = options.icon
  }

  if (options.offset) {
    markerOptions.offset = new AMap.Pixel(options.offset[0], options.offset[1])
  }

  if (options.anchor) {
    markerOptions.anchor = options.anchor
  }

  return new AMap.Marker(markerOptions)
}

/**
 * Create a polyline on the map
 */
export function createPolyline(
  map: AMapInstance,
  options: {
    path: [number, number][]
    strokeColor?: string
    strokeWeight?: number
    strokeOpacity?: number
    strokeStyle?: 'solid' | 'dashed'
  }
): AMapPolyline {
  const AMap = getAMapSDK()
  
  const path = options.path.map(([lng, lat]) => new AMap.LngLat(lng, lat))
  
  return new AMap.Polyline({
    path,
    strokeColor: options.strokeColor || '#3366FF',
    strokeWeight: options.strokeWeight || 6,
    strokeOpacity: options.strokeOpacity || 0.8,
    strokeStyle: options.strokeStyle || 'solid',
    map
  })
}

/**
 * Fit map view to show all markers
 */
export function fitMapView(map: AMapInstance, markers: AMapMarker[]): void {
  if (markers.length === 0) return
  
  map.setFitView(markers, false, [50, 50, 50, 50])
}

/**
 * Get current geolocation
 */
export function getCurrentLocation(): Promise<{ lng: number; lat: number; accuracy: number }> {
  const AMap = getAMapSDK()
  
  return new Promise((resolve, reject) => {
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        resolve({
          lng: result.position.lng,
          lat: result.position.lat,
          accuracy: result.accuracy
        })
      } else {
        const error: MapError = {
          code: 'LOCATION_ERROR',
          message: '定位失败，请检查定位权限设置',
          originalError: result
        }
        reject(error)
      }
    })
  })
}

/**
 * Open external navigation app
 */
export function openExternalNavigation(
  destination: [number, number],
  destinationName: string
): void {
  const [lng, lat] = destination
  // Use AMap navigation URL scheme
  const url = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(destinationName)}&mode=car&coordinate=gaode`
  window.open(url, '_blank')
}
