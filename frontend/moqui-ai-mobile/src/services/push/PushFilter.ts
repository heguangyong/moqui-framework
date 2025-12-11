/**
 * Push Notification Filtering Service
 * Implements filtering logic for order push notifications based on driver conditions
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

// Order interface for push filtering
export interface OrderForPush {
  listingId: string
  requiresShPlate: boolean        // Whether order requires Shanghai plate
  vehicleType: string             // Required vehicle type (20GP, 40GP, 40HQ)
  originLocation: [number, number] // [longitude, latitude]
  freight: number
  route: string
}

// Driver interface for push filtering
export interface DriverForPush {
  driverId: string
  hasShPlate: boolean             // Whether driver has Shanghai plate
  vehicleType: string             // Driver's vehicle type
  currentLocation: [number, number] // [longitude, latitude]
  pushSettings: {
    enabled: boolean
    distanceRange: number         // Max distance in km
    vehicleTypes: string[]        // Accepted vehicle types
  }
}

// Push filter result
export interface PushFilterResult {
  shouldPush: boolean
  reason?: string
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate [longitude, latitude]
 * @param coord2 Second coordinate [longitude, latitude]
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1
  const [lon2, lat2] = coord2

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}


/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if driver's vehicle type matches order requirement
 * Requirements: 3.1
 * 
 * @param orderVehicleType Required vehicle type for the order
 * @param driverVehicleType Driver's vehicle type
 * @param acceptedTypes Vehicle types the driver accepts (from push settings)
 * @returns true if vehicle type matches
 */
export function matchesVehicleType(
  orderVehicleType: string,
  driverVehicleType: string,
  acceptedTypes: string[]
): boolean {
  // Driver must have the required vehicle type
  if (driverVehicleType !== orderVehicleType) {
    return false
  }

  // Driver must accept this vehicle type in their push settings
  if (!acceptedTypes.includes(orderVehicleType)) {
    return false
  }

  return true
}

/**
 * Check if driver's plate type matches order requirement
 * Requirements: 3.2
 * 
 * @param requiresShPlate Whether order requires Shanghai plate
 * @param hasShPlate Whether driver has Shanghai plate
 * @returns true if plate type matches
 */
export function matchesPlateType(
  requiresShPlate: boolean,
  hasShPlate: boolean
): boolean {
  // If order requires Shanghai plate, driver must have it
  if (requiresShPlate && !hasShPlate) {
    return false
  }

  // If order doesn't require Shanghai plate, any plate is acceptable
  return true
}

/**
 * Check if driver is within acceptable distance range
 * Requirements: 3.3
 * 
 * @param orderLocation Order origin location [longitude, latitude]
 * @param driverLocation Driver's current location [longitude, latitude]
 * @param maxDistance Maximum acceptable distance in km
 * @returns true if within distance range
 */
export function isWithinDistanceRange(
  orderLocation: [number, number],
  driverLocation: [number, number],
  maxDistance: number
): boolean {
  const distance = calculateDistance(orderLocation, driverLocation)
  return distance <= maxDistance
}

/**
 * Main push filter function
 * Determines if an order should be pushed to a specific driver
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param order Order to evaluate
 * @param driver Driver to evaluate
 * @returns PushFilterResult with shouldPush flag and reason
 */
export function shouldPushToDriver(
  order: OrderForPush,
  driver: DriverForPush
): PushFilterResult {
  // Check if push is enabled for driver
  if (!driver.pushSettings.enabled) {
    return {
      shouldPush: false,
      reason: 'Push notifications disabled'
    }
  }

  // Check vehicle type match (Requirement 3.1)
  if (!matchesVehicleType(
    order.vehicleType,
    driver.vehicleType,
    driver.pushSettings.vehicleTypes
  )) {
    return {
      shouldPush: false,
      reason: `Vehicle type mismatch: order requires ${order.vehicleType}, driver has ${driver.vehicleType}`
    }
  }

  // Check plate type match (Requirement 3.2)
  if (!matchesPlateType(order.requiresShPlate, driver.hasShPlate)) {
    return {
      shouldPush: false,
      reason: 'Order requires Shanghai plate, driver does not have one'
    }
  }

  // Check distance range (Requirement 3.3)
  const distance = calculateDistance(order.originLocation, driver.currentLocation)
  if (!isWithinDistanceRange(
    order.originLocation,
    driver.currentLocation,
    driver.pushSettings.distanceRange
  )) {
    return {
      shouldPush: false,
      reason: `Distance ${distance.toFixed(1)}km exceeds max range ${driver.pushSettings.distanceRange}km`
    }
  }

  // All checks passed
  return {
    shouldPush: true
  }
}

/**
 * Filter a list of drivers for a given order
 * Returns only drivers who should receive the push notification
 * 
 * @param order Order to push
 * @param drivers List of potential drivers
 * @returns List of drivers who should receive the notification
 */
export function filterDriversForOrder(
  order: OrderForPush,
  drivers: DriverForPush[]
): DriverForPush[] {
  return drivers.filter(driver => shouldPushToDriver(order, driver).shouldPush)
}

/**
 * Get distance between order and driver
 * Utility function for displaying distance in UI
 * 
 * @param order Order with origin location
 * @param driver Driver with current location
 * @returns Distance in kilometers
 */
export function getOrderDriverDistance(
  order: OrderForPush,
  driver: DriverForPush
): number {
  return calculateDistance(order.originLocation, driver.currentLocation)
}
