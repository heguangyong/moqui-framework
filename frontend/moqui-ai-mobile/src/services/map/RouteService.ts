/**
 * Route Planning Service
 * Provides driving route planning with truck restriction support
 * 
 * Requirements: 1.2, 1.4
 */

import { getAMapSDK, isSDKLoaded, type MapError } from './AMapService'

// Route step information
export interface RouteStep {
  instruction: string
  road: string
  distance: number // meters
  duration: number // seconds
  action: string
  assistantAction?: string
}

// Route result
export interface RouteResult {
  distance: number // meters
  duration: number // seconds
  polyline: [number, number][] // route coordinates
  steps: RouteStep[]
  tollCost?: number // toll fee in yuan
  trafficLights?: number
}

// Truck restrictions
export interface TruckRestrictions {
  height?: number // max height in meters
  weight?: number // max weight in tons
  width?: number // max width in meters
  length?: number // max length in meters
}

// Route planning options
export interface RoutePlanningOptions {
  origin: [number, number]
  destination: [number, number]
  waypoints?: [number, number][]
  avoidHighway?: boolean
  avoidToll?: boolean
  avoidCongestion?: boolean
  truckRestrictions?: TruckRestrictions
}

// Default truck restrictions for container trucks
export const DEFAULT_TRUCK_RESTRICTIONS: TruckRestrictions = {
  height: 4.5, // 4.5 meters max height
  weight: 49, // 49 tons max weight
  width: 2.55, // 2.55 meters max width
  length: 17.1 // 17.1 meters max length (semi-trailer)
}

// Shanghai port area restricted routes
export const RESTRICTED_AREAS = [
  { name: '外环隧道', type: 'height' as const, limit: 4.2 },
  { name: '长江隧道', type: 'height' as const, limit: 4.5 },
  { name: '翔殷路隧道', type: 'height' as const, limit: 4.0 },
  { name: '复兴东路隧道', type: 'height' as const, limit: 4.5 },
  { name: '大连路隧道', type: 'height' as const, limit: 4.5 },
  { name: '新建路隧道', type: 'height' as const, limit: 4.5 }
]

/**
 * Check if truck restrictions would be violated by a route
 */
export function checkTruckRestrictions(
  restrictions: TruckRestrictions,
  routeInfo?: { roads?: string[] }
): { valid: boolean; violations: string[] } {
  const violations: string[] = []

  if (!routeInfo?.roads) {
    return { valid: true, violations: [] }
  }

  // Check against known restricted areas
  for (const area of RESTRICTED_AREAS) {
    const routePassesArea = routeInfo.roads.some(road => 
      road.includes(area.name)
    )

    if (routePassesArea) {
      if (area.type === 'height' && restrictions.height && restrictions.height > area.limit) {
        violations.push(`${area.name}限高${area.limit}米，您的车辆高度${restrictions.height}米超限`)
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  }
}

/**
 * Plan a driving route
 */
export async function planRoute(options: RoutePlanningOptions): Promise<RouteResult> {
  if (!isSDKLoaded()) {
    throw {
      code: 'SDK_NOT_LOADED',
      message: '地图SDK未加载，请稍后重试'
    } as MapError
  }

  const AMap = getAMapSDK()

  return new Promise((resolve, reject) => {
    // Build driving options
    const drivingOptions: any = {
      policy: AMap.DrivingPolicy?.LEAST_TIME || 0, // Fastest route
      ferry: 1, // Allow ferry
      province: '沪' // Shanghai province code
    }

    // Apply route preferences
    if (options.avoidHighway) {
      drivingOptions.policy = AMap.DrivingPolicy?.AVOID_HIGHWAY || 1
    }
    if (options.avoidToll) {
      drivingOptions.policy = AMap.DrivingPolicy?.AVOID_TOLL || 2
    }
    if (options.avoidCongestion) {
      drivingOptions.policy = AMap.DrivingPolicy?.REAL_TRAFFIC || 4
    }

    // Create driving instance
    const driving = new AMap.Driving(drivingOptions)

    // Build waypoints if provided
    const waypoints = options.waypoints?.map(([lng, lat]) => 
      new AMap.LngLat(lng, lat)
    )

    // Search for route
    const origin = new AMap.LngLat(options.origin[0], options.origin[1])
    const destination = new AMap.LngLat(options.destination[0], options.destination[1])

    const searchCallback = (status: string, result: any) => {
      if (status === 'complete' && result.routes && result.routes.length > 0) {
        const route = result.routes[0]
        
        // Extract polyline coordinates
        const polyline: [number, number][] = []
        if (route.steps) {
          route.steps.forEach((step: any) => {
            if (step.path) {
              step.path.forEach((point: any) => {
                polyline.push([point.lng, point.lat])
              })
            }
          })
        }

        // Extract step information
        const steps: RouteStep[] = route.steps?.map((step: any) => ({
          instruction: step.instruction || '',
          road: step.road || '',
          distance: step.distance || 0,
          duration: step.time || 0,
          action: step.action || '',
          assistantAction: step.assistant_action
        })) || []

        // Extract road names for restriction checking
        const roads = steps.map(s => s.road).filter(Boolean)

        // Check truck restrictions if provided
        if (options.truckRestrictions) {
          const restrictionCheck = checkTruckRestrictions(
            options.truckRestrictions,
            { roads }
          )

          if (!restrictionCheck.valid) {
            // Log warnings but still return the route
            console.warn('Route has truck restriction violations:', restrictionCheck.violations)
          }
        }

        const routeResult: RouteResult = {
          distance: route.distance || 0,
          duration: route.time || 0,
          polyline,
          steps,
          tollCost: route.tolls,
          trafficLights: route.traffic_lights
        }

        resolve(routeResult)
      } else {
        const error: MapError = {
          code: 'ROUTE_ERROR',
          message: '路线规划失败，请检查起终点位置',
          originalError: result
        }
        reject(error)
      }
    }

    // Execute search
    if (waypoints && waypoints.length > 0) {
      driving.search(origin, destination, { waypoints }, searchCallback)
    } else {
      driving.search(origin, destination, searchCallback)
    }
  })
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = point1[1] * Math.PI / 180
  const lat2 = point2[1] * Math.PI / 180
  const deltaLat = (point2[1] - point1[1]) * Math.PI / 180
  const deltaLng = (point2[0] - point1[0]) * Math.PI / 180

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  }
  return `${(meters / 1000).toFixed(1)}公里`
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}分钟`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
}

/**
 * Get estimated arrival time
 */
export function getEstimatedArrival(durationSeconds: number): Date {
  return new Date(Date.now() + durationSeconds * 1000)
}

/**
 * Format arrival time for display
 */
export function formatArrivalTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
