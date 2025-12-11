/**
 * Map Services Index
 * Re-exports all map-related services for convenient imports
 */

// AMap Service
export {
  initAMapSDK,
  getAMapSDK,
  isSDKLoaded,
  resetAMapService,
  getLoadingState,
  getLoadError,
  onStateChange,
  createMapInstance,
  createMarker,
  createPolyline,
  fitMapView,
  getCurrentLocation,
  openExternalNavigation,
  type MapLoadingState,
  type MapError,
  type AMapConfig,
  type AMapInstance,
  type AMapMarker,
  type AMapPolyline
} from './AMapService'

// Route Service
export {
  planRoute,
  checkTruckRestrictions,
  calculateDistance,
  formatDistance,
  formatDuration,
  getEstimatedArrival,
  formatArrivalTime,
  DEFAULT_TRUCK_RESTRICTIONS,
  RESTRICTED_AREAS,
  type RouteStep,
  type RouteResult,
  type TruckRestrictions,
  type RoutePlanningOptions
} from './RouteService'

// Port Layer Service
export {
  loadPortLayer,
  getTerminals,
  getGates,
  getParkingLots,
  getCheckpoints,
  getPOIsByType,
  getPOIDetails,
  searchPOIs,
  getPOIsInBounds,
  getNearestPOI,
  getPOIIcon,
  getPOIStatusColor,
  getPOIStatusText,
  SHANGHAI_PORT_CONFIG,
  type PortPOI,
  type PortPOIType,
  type PortPOIStatus,
  type PortCode
} from './PortLayerService'
