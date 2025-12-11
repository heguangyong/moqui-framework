/**
 * Port Layer Service
 * Provides Shanghai port POI data including terminals, gates, and parking lots
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

// Port POI types
export type PortPOIType = 'terminal' | 'gate' | 'parking' | 'checkpoint'

// Port POI status
export type PortPOIStatus = 'open' | 'closed' | 'busy'

// Port POI interface
export interface PortPOI {
  id: string
  name: string
  type: PortPOIType
  position: [number, number] // [lng, lat]
  address: string
  status?: PortPOIStatus
  details?: {
    operatingHours?: string
    capacity?: number
    availableSpots?: number
    restrictions?: string[]
    phone?: string
    description?: string
  }
}

// Shanghai port configuration
export const SHANGHAI_PORT_CONFIG = {
  center: [121.8, 30.9] as [number, number],
  zoom: 11,
  bounds: {
    southwest: [121.4, 30.6] as [number, number],
    northeast: [122.2, 31.2] as [number, number]
  }
}

// Shanghai port terminals data
const TERMINALS: PortPOI[] = [
  {
    id: 'terminal-ysg-1',
    name: '洋山港一期码头',
    type: 'terminal',
    position: [122.0673, 30.6297],
    address: '上海市浦东新区洋山深水港一期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-68281111',
      description: '洋山深水港一期码头，主要处理远洋集装箱船舶'
    }
  },
  {
    id: 'terminal-ysg-2',
    name: '洋山港二期码头',
    type: 'terminal',
    position: [122.0523, 30.6247],
    address: '上海市浦东新区洋山深水港二期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-68281112',
      description: '洋山深水港二期码头'
    }
  },
  {
    id: 'terminal-ysg-3',
    name: '洋山港三期码头',
    type: 'terminal',
    position: [122.0373, 30.6197],
    address: '上海市浦东新区洋山深水港三期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-68281113',
      description: '洋山深水港三期码头'
    }
  },
  {
    id: 'terminal-ysg-4',
    name: '洋山港四期自动化码头',
    type: 'terminal',
    position: [122.0223, 30.6147],
    address: '上海市浦东新区洋山深水港四期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-68281114',
      description: '全球最大的自动化集装箱码头'
    }
  },
  {
    id: 'terminal-wgq-1',
    name: '外高桥一期码头',
    type: 'terminal',
    position: [121.5873, 31.3497],
    address: '上海市浦东新区外高桥港区一期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-58691111',
      description: '外高桥港区一期码头'
    }
  },
  {
    id: 'terminal-wgq-2',
    name: '外高桥二期码头',
    type: 'terminal',
    position: [121.6023, 31.3547],
    address: '上海市浦东新区外高桥港区二期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-58691112',
      description: '外高桥港区二期码头'
    }
  },
  {
    id: 'terminal-wgq-3',
    name: '外高桥三期码头',
    type: 'terminal',
    position: [121.6173, 31.3597],
    address: '上海市浦东新区外高桥港区三期',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      phone: '021-58691113',
      description: '外高桥港区三期码头'
    }
  },
  {
    id: 'terminal-ws',
    name: '吴淞码头',
    type: 'terminal',
    position: [121.5023, 31.3897],
    address: '上海市宝山区吴淞港区',
    status: 'open',
    details: {
      operatingHours: '06:00-22:00',
      phone: '021-56161111',
      description: '吴淞港区码头，主要处理内贸集装箱'
    }
  }
]

// Shanghai port gates data
const GATES: PortPOI[] = [
  {
    id: 'gate-ysg-main',
    name: '洋山港主闸口',
    type: 'gate',
    position: [121.9373, 30.6897],
    address: '上海市浦东新区东海大桥洋山端',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      restrictions: ['需提前预约', '限高4.5米'],
      description: '洋山港区主要进出闸口'
    }
  },
  {
    id: 'gate-ysg-south',
    name: '洋山港南闸口',
    type: 'gate',
    position: [121.9523, 30.6747],
    address: '上海市浦东新区洋山港南侧',
    status: 'open',
    details: {
      operatingHours: '06:00-22:00',
      restrictions: ['仅限空箱进出'],
      description: '洋山港区南侧闸口，主要用于空箱进出'
    }
  },
  {
    id: 'gate-wgq-main',
    name: '外高桥主闸口',
    type: 'gate',
    position: [121.5673, 31.3397],
    address: '上海市浦东新区外高桥港区入口',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      restrictions: ['需提前预约'],
      description: '外高桥港区主要进出闸口'
    }
  },
  {
    id: 'gate-wgq-north',
    name: '外高桥北闸口',
    type: 'gate',
    position: [121.5823, 31.3647],
    address: '上海市浦东新区外高桥港区北侧',
    status: 'busy',
    details: {
      operatingHours: '06:00-22:00',
      description: '外高桥港区北侧闸口'
    }
  },
  {
    id: 'gate-ws-main',
    name: '吴淞港闸口',
    type: 'gate',
    position: [121.4923, 31.3797],
    address: '上海市宝山区吴淞港区入口',
    status: 'open',
    details: {
      operatingHours: '06:00-22:00',
      description: '吴淞港区主要进出闸口'
    }
  }
]

// Shanghai port parking lots data
const PARKING_LOTS: PortPOI[] = [
  {
    id: 'parking-ysg-1',
    name: '洋山港集卡停车场A区',
    type: 'parking',
    position: [121.9173, 30.6997],
    address: '上海市浦东新区东海大桥洋山端',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      capacity: 500,
      availableSpots: 128,
      description: '洋山港区大型集卡停车场'
    }
  },
  {
    id: 'parking-ysg-2',
    name: '洋山港集卡停车场B区',
    type: 'parking',
    position: [121.9273, 30.6897],
    address: '上海市浦东新区东海大桥洋山端',
    status: 'busy',
    details: {
      operatingHours: '00:00-24:00',
      capacity: 300,
      availableSpots: 15,
      description: '洋山港区集卡停车场B区'
    }
  },
  {
    id: 'parking-wgq-1',
    name: '外高桥集卡停车场',
    type: 'parking',
    position: [121.5573, 31.3297],
    address: '上海市浦东新区外高桥港区',
    status: 'open',
    details: {
      operatingHours: '00:00-24:00',
      capacity: 400,
      availableSpots: 89,
      description: '外高桥港区集卡停车场'
    }
  },
  {
    id: 'parking-wgq-2',
    name: '外高桥临时停车区',
    type: 'parking',
    position: [121.5723, 31.3447],
    address: '上海市浦东新区外高桥港区北侧',
    status: 'open',
    details: {
      operatingHours: '06:00-22:00',
      capacity: 150,
      availableSpots: 42,
      description: '外高桥港区临时停车区域'
    }
  },
  {
    id: 'parking-ws-1',
    name: '吴淞港停车场',
    type: 'parking',
    position: [121.4823, 31.3697],
    address: '上海市宝山区吴淞港区',
    status: 'open',
    details: {
      operatingHours: '06:00-22:00',
      capacity: 200,
      availableSpots: 67,
      description: '吴淞港区集卡停车场'
    }
  }
]

// Checkpoints data
const CHECKPOINTS: PortPOI[] = [
  {
    id: 'checkpoint-ysg-customs',
    name: '洋山港海关查验区',
    type: 'checkpoint',
    position: [121.9473, 30.6797],
    address: '上海市浦东新区洋山港海关',
    status: 'open',
    details: {
      operatingHours: '08:00-17:00',
      description: '洋山港海关查验区域'
    }
  },
  {
    id: 'checkpoint-wgq-customs',
    name: '外高桥海关查验区',
    type: 'checkpoint',
    position: [121.5773, 31.3497],
    address: '上海市浦东新区外高桥海关',
    status: 'open',
    details: {
      operatingHours: '08:00-17:00',
      description: '外高桥海关查验区域'
    }
  }
]

// All POIs combined
const ALL_POIS: PortPOI[] = [...TERMINALS, ...GATES, ...PARKING_LOTS, ...CHECKPOINTS]

// Port codes
export type PortCode = 'YSG' | 'WGQ' | 'WS' | 'ALL'

/**
 * Load port layer POIs for a specific port
 */
export async function loadPortLayer(portCode: PortCode = 'ALL'): Promise<PortPOI[]> {
  // Simulate async loading (in real app, this might fetch from API)
  await new Promise(resolve => setTimeout(resolve, 100))

  if (portCode === 'ALL') {
    return [...ALL_POIS]
  }

  const portPrefixMap: Record<string, string> = {
    'YSG': 'ysg',
    'WGQ': 'wgq',
    'WS': 'ws'
  }

  const prefix = portPrefixMap[portCode]
  if (!prefix) {
    return []
  }

  return ALL_POIS.filter(poi => poi.id.includes(prefix))
}

/**
 * Get all terminals
 */
export function getTerminals(): PortPOI[] {
  return [...TERMINALS]
}

/**
 * Get all gates
 */
export function getGates(): PortPOI[] {
  return [...GATES]
}

/**
 * Get all parking lots
 */
export function getParkingLots(): PortPOI[] {
  return [...PARKING_LOTS]
}

/**
 * Get all checkpoints
 */
export function getCheckpoints(): PortPOI[] {
  return [...CHECKPOINTS]
}

/**
 * Get POIs by type
 */
export function getPOIsByType(type: PortPOIType): PortPOI[] {
  return ALL_POIS.filter(poi => poi.type === type)
}

/**
 * Get POI details by ID
 */
export async function getPOIDetails(poiId: string): Promise<PortPOI | null> {
  // Simulate async loading
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return ALL_POIS.find(poi => poi.id === poiId) || null
}

/**
 * Search POIs by name
 */
export function searchPOIs(query: string): PortPOI[] {
  const lowerQuery = query.toLowerCase()
  return ALL_POIS.filter(poi => 
    poi.name.toLowerCase().includes(lowerQuery) ||
    poi.address.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get POIs within a bounding box
 */
export function getPOIsInBounds(
  southwest: [number, number],
  northeast: [number, number]
): PortPOI[] {
  return ALL_POIS.filter(poi => {
    const [lng, lat] = poi.position
    return lng >= southwest[0] && lng <= northeast[0] &&
           lat >= southwest[1] && lat <= northeast[1]
  })
}

/**
 * Get nearest POI of a specific type
 */
export function getNearestPOI(
  position: [number, number],
  type?: PortPOIType
): PortPOI | null {
  const pois = type ? getPOIsByType(type) : ALL_POIS
  
  if (pois.length === 0) return null

  let nearest: PortPOI | null = null
  let minDistance = Infinity

  for (const poi of pois) {
    const distance = calculateHaversineDistance(position, poi.position)
    if (distance < minDistance) {
      minDistance = distance
      nearest = poi
    }
  }

  return nearest
}

/**
 * Calculate Haversine distance between two points
 */
function calculateHaversineDistance(
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

  return R * c
}

/**
 * Get POI icon based on type
 */
export function getPOIIcon(type: PortPOIType): string {
  const iconMap: Record<PortPOIType, string> = {
    terminal: 'directions_boat',
    gate: 'door_front',
    parking: 'local_parking',
    checkpoint: 'security'
  }
  return iconMap[type] || 'place'
}

/**
 * Get POI status color
 */
export function getPOIStatusColor(status?: PortPOIStatus): string {
  const colorMap: Record<PortPOIStatus, string> = {
    open: 'positive',
    closed: 'negative',
    busy: 'warning'
  }
  return status ? colorMap[status] : 'grey'
}

/**
 * Get POI status text
 */
export function getPOIStatusText(status?: PortPOIStatus): string {
  const textMap: Record<PortPOIStatus, string> = {
    open: '正常开放',
    closed: '暂停服务',
    busy: '繁忙'
  }
  return status ? textMap[status] : '未知'
}
