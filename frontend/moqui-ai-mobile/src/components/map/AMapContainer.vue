<template>
  <div class="amap-container" :class="{ 'is-loading': isLoading, 'has-error': hasError }">
    <!-- Loading State -->
    <div v-if="isLoading" class="map-loading">
      <q-spinner-dots color="primary" size="40px" />
      <div class="loading-text">地图加载中...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="map-error">
      <q-icon name="error_outline" color="negative" size="48px" />
      <div class="error-message">{{ errorMessage }}</div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        label="重试"
        @click="retryLoad"
      />
    </div>

    <!-- Map Container -->
    <div
      ref="mapContainerRef"
      class="map-element"
      :style="{ visibility: isLoading || hasError ? 'hidden' : 'visible' }"
    />

    <!-- Map Controls Overlay -->
    <div v-if="!isLoading && !hasError" class="map-controls">
      <slot name="controls">
        <q-btn
          v-if="showLocationBtn"
          round
          dense
          color="white"
          text-color="primary"
          icon="my_location"
          class="control-btn location-btn"
          @click="centerOnCurrentLocation"
        />
        <q-btn
          v-if="showZoomControls"
          round
          dense
          color="white"
          text-color="dark"
          icon="add"
          class="control-btn zoom-in-btn"
          @click="zoomIn"
        />
        <q-btn
          v-if="showZoomControls"
          round
          dense
          color="white"
          text-color="dark"
          icon="remove"
          class="control-btn zoom-out-btn"
          @click="zoomOut"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  initAMapSDK,
  createMapInstance,
  createMarker,
  createPolyline,
  fitMapView,
  getCurrentLocation,
  resetAMapService,
  type AMapInstance,
  type AMapMarker,
  type AMapPolyline,
  type MapError
} from '@/services/map/AMapService'

// Props
export interface MapMarker {
  id: string
  position: [number, number]
  type: 'origin' | 'destination' | 'waypoint' | 'poi'
  icon?: string
  title?: string
  content?: string
}

export interface RouteInfo {
  origin: [number, number]
  destination: [number, number]
  waypoints?: [number, number][]
  polyline?: [number, number][]
  strokeColor?: string
}

interface Props {
  center?: [number, number]
  zoom?: number
  showPortLayer?: boolean
  markers?: MapMarker[]
  route?: RouteInfo
  showLocationBtn?: boolean
  showZoomControls?: boolean
  apiKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [121.8, 30.9], // Shanghai port default
  zoom: 11,
  showPortLayer: false,
  markers: () => [],
  showLocationBtn: true,
  showZoomControls: true,
  apiKey: '' // Should be provided via environment or config
})

// Emits
const emit = defineEmits<{
  (e: 'mapReady', map: AMapInstance): void
  (e: 'mapError', error: MapError): void
  (e: 'markerClick', marker: MapMarker): void
  (e: 'routeComplete', route: { distance: number; duration: number }): void
}>()

// Refs
const mapContainerRef = ref<HTMLElement | null>(null)
const mapInstance = ref<AMapInstance | null>(null)
const markerInstances = ref<Map<string, AMapMarker>>(new Map())
const routePolyline = ref<AMapPolyline | null>(null)

// State
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')

// Computed
const effectiveApiKey = computed(() => {
  return props.apiKey || import.meta.env.VITE_AMAP_KEY || ''
})

// Initialize map
async function initMap(): Promise<void> {
  if (!mapContainerRef.value) return

  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    // Initialize SDK
    await initAMapSDK({ key: effectiveApiKey.value })

    // Create map instance
    mapInstance.value = createMapInstance(mapContainerRef.value, {
      center: props.center,
      zoom: props.zoom
    })

    // Wait for map to be ready
    mapInstance.value.on('complete', () => {
      isLoading.value = false
      emit('mapReady', mapInstance.value!)
      
      // Render initial markers
      renderMarkers()
      
      // Render initial route
      if (props.route) {
        renderRoute()
      }
    })

  } catch (error) {
    const mapError = error as MapError
    isLoading.value = false
    hasError.value = true
    errorMessage.value = mapError.message || '地图加载失败'
    emit('mapError', mapError)
  }
}

// Render markers on the map
function renderMarkers(): void {
  if (!mapInstance.value) return

  // Clear existing markers
  markerInstances.value.forEach(marker => {
    marker.setMap(null)
  })
  markerInstances.value.clear()

  // Create new markers
  props.markers.forEach(markerData => {
    const iconMap: Record<string, string> = {
      origin: '//webapi.amap.com/theme/v1.3/markers/n/start.png',
      destination: '//webapi.amap.com/theme/v1.3/markers/n/end.png',
      waypoint: '//webapi.amap.com/theme/v1.3/markers/n/mid.png',
      poi: '//webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
    }

    const marker = createMarker(mapInstance.value!, {
      position: markerData.position,
      title: markerData.title,
      icon: markerData.icon || iconMap[markerData.type]
    })

    // Add click handler
    marker.on('click', () => {
      emit('markerClick', markerData)
    })

    markerInstances.value.set(markerData.id, marker)
  })

  // Fit view to show all markers
  if (props.markers.length > 0) {
    const allMarkers = Array.from(markerInstances.value.values())
    fitMapView(mapInstance.value, allMarkers)
  }
}

// Render route polyline
function renderRoute(): void {
  if (!mapInstance.value || !props.route) return

  // Clear existing route
  if (routePolyline.value) {
    routePolyline.value.setMap(null)
    routePolyline.value = null
  }

  // If polyline path is provided, draw it directly
  if (props.route.polyline && props.route.polyline.length > 0) {
    routePolyline.value = createPolyline(mapInstance.value, {
      path: props.route.polyline,
      strokeColor: props.route.strokeColor || '#3366FF',
      strokeWeight: 6,
      strokeOpacity: 0.8
    })

    // Add origin and destination markers if not already present
    const hasOriginMarker = props.markers.some(m => m.type === 'origin')
    const hasDestMarker = props.markers.some(m => m.type === 'destination')

    if (!hasOriginMarker) {
      const originMarker = createMarker(mapInstance.value, {
        position: props.route.origin,
        title: '起点',
        icon: '//webapi.amap.com/theme/v1.3/markers/n/start.png'
      })
      markerInstances.value.set('route-origin', originMarker)
    }

    if (!hasDestMarker) {
      const destMarker = createMarker(mapInstance.value, {
        position: props.route.destination,
        title: '终点',
        icon: '//webapi.amap.com/theme/v1.3/markers/n/end.png'
      })
      markerInstances.value.set('route-destination', destMarker)
    }

    // Fit view to show the route
    const allMarkers = Array.from(markerInstances.value.values())
    fitMapView(mapInstance.value, allMarkers)
  }
}

// Retry loading the map
function retryLoad(): void {
  resetAMapService()
  initMap()
}

// Center map on current location
async function centerOnCurrentLocation(): Promise<void> {
  if (!mapInstance.value) return

  try {
    const location = await getCurrentLocation()
    mapInstance.value.setCenter([location.lng, location.lat])
    mapInstance.value.setZoom(15)
  } catch (error) {
    console.error('Failed to get current location:', error)
  }
}

// Zoom controls
function zoomIn(): void {
  if (!mapInstance.value) return
  const currentZoom = mapInstance.value.getZoom()
  mapInstance.value.setZoom(Math.min(currentZoom + 1, 18))
}

function zoomOut(): void {
  if (!mapInstance.value) return
  const currentZoom = mapInstance.value.getZoom()
  mapInstance.value.setZoom(Math.max(currentZoom - 1, 3))
}

// Watch for prop changes
watch(() => props.center, (newCenter) => {
  if (mapInstance.value && newCenter) {
    mapInstance.value.setCenter(newCenter)
  }
})

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value && newZoom) {
    mapInstance.value.setZoom(newZoom)
  }
})

watch(() => props.markers, () => {
  renderMarkers()
}, { deep: true })

watch(() => props.route, () => {
  renderRoute()
}, { deep: true })

// Lifecycle
onMounted(() => {
  initMap()
})

onUnmounted(() => {
  // Cleanup
  if (mapInstance.value) {
    mapInstance.value.destroy()
    mapInstance.value = null
  }
  markerInstances.value.clear()
})

// Expose methods for parent component
defineExpose({
  getMapInstance: () => mapInstance.value,
  centerOnCurrentLocation,
  zoomIn,
  zoomOut,
  fitView: () => {
    if (mapInstance.value) {
      const allMarkers = Array.from(markerInstances.value.values())
      fitMapView(mapInstance.value, allMarkers)
    }
  }
})
</script>

<style scoped lang="scss">
.amap-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #1C1C1E;
  border-radius: 12px;
  overflow: hidden;
}

.map-element {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #2C2C2E;
  z-index: 10;
}

.loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.error-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  padding: 0 20px;
  margin-bottom: 8px;
}

.map-controls {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;

  .control-btn {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .location-btn {
    margin-bottom: 8px;
  }
}
</style>
