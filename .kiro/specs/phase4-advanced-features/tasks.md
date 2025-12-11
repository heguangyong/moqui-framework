# Implementation Plan

- [x] 1. Set up infrastructure and base services
  - [x] 1.1 Install dependencies (高德地图SDK, Dexie.js, fast-check)
    - Add @amap/amap-jsapi-loader to package.json
    - Add dexie for IndexedDB operations
    - Add fast-check for property-based testing
    - _Requirements: 1.1, 5.2_

  - [x] 1.2 Create IndexedDB schema and database service
    - Create src/services/db/index.ts with Dexie configuration
    - Define tables: pushHistory, offlineRequests
    - Implement basic CRUD operations
    - _Requirements: 5.2, 4.4_

  - [x] 1.3 Write property test for offline cache round-trip
    - **Property 8: Offline cache round-trip**
    - **Validates: Requirements 5.2**

- [x] 2. Implement map integration module
  - [x] 2.1 Create AMap service wrapper
    - Create src/services/map/AMapService.ts
    - Implement SDK initialization with API key
    - Handle map loading states and errors
    - _Requirements: 1.1, 1.5_

  - [x] 2.2 Create AMapContainer.vue component
    - Create src/components/map/AMapContainer.vue
    - Implement map rendering with center and zoom props
    - Add marker support for origin/destination
    - Handle map ready and error events
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Write property test for route planning restrictions
    - **Property 1: Route planning respects truck restrictions**
    - **Validates: Requirements 1.4**

  - [x] 2.4 Implement route planning service
    - Create src/services/map/RouteService.ts
    - Implement driving route planning with AMap.Driving
    - Add truck restriction parameters (height, weight)
    - Return formatted route result
    - _Requirements: 1.2, 1.4_

  - [x] 2.5 Implement port layer service
    - Create src/services/map/PortLayerService.ts
    - Define Shanghai port POI data (terminals, gates, parking)
    - Implement POI loading and filtering
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.6 Write property test for port layer POI types
    - **Property 2: Port layer contains required POI types**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 2.7 Create POI detail popup component
    - Create src/components/map/POIPopup.vue
    - Display POI name, type, status, and details
    - Handle close action
    - _Requirements: 2.4_

  - [x] 2.8 Integrate map into OrderExecution page
    - Replace map placeholder in OrderExecution.vue
    - Add AMapContainer with route display
    - Implement navigation button functionality
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Checkpoint - Ensure map module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement push notification module
  - [x] 4.1 Create push service
    - Create src/services/push/PushService.ts
    - Implement settings management (get/update)
    - Implement subscribe/unsubscribe
    - _Requirements: 3.4, 4.1, 4.2_

  - [x] 4.2 Implement push filtering logic
    - Create src/services/push/PushFilter.ts
    - Implement vehicle type matching
    - Implement plate type matching
    - Implement distance calculation and filtering
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.3 Write property tests for push filtering
    - **Property 3: Push filtering by vehicle type**
    - **Property 4: Push filtering by plate type**
    - **Property 5: Push filtering by distance**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.3**

  - [x] 4.4 Implement push history service
    - Add history storage to IndexedDB
    - Implement getHistory with date range filter
    - Implement markAsRead and clearHistory
    - _Requirements: 4.4_

  - [ ]* 4.5 Write property test for push history time range
    - **Property 7: Push history time range**
    - **Validates: Requirements 4.4**

  - [x] 4.6 Create PushSettings page
    - Create src/pages/marketplace/PushSettings.vue
    - Add push enable/disable toggle
    - Add distance range slider
    - Add vehicle type selection
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.7 Write property test for push settings persistence
    - **Property 6: Push settings persistence**
    - **Validates: Requirements 4.2**

  - [x] 4.8 Create push notification UI component
    - Create src/components/push/PushNotification.vue
    - Display notification with order info
    - Handle click to navigate to order detail
    - _Requirements: 3.4, 3.5_

  - [x] 4.9 Create push history page
    - Create src/pages/marketplace/PushHistory.vue
    - Display notification list with infinite scroll
    - Show read/unread status
    - _Requirements: 4.4_

- [x] 5. Checkpoint - Ensure push module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement offline and error handling module
  - [x] 6.1 Create network monitor service
    - Create src/services/network/NetworkMonitor.ts
    - Implement online/offline detection
    - Add event listeners for network changes
    - _Requirements: 5.1_

  - [x] 6.2 Create offline cache service
    - Create src/services/network/OfflineCacheService.ts
    - Implement cacheRequest for offline submissions
    - Implement getCachedRequests and removeCachedRequest
    - _Requirements: 5.2_

  - [x] 6.3 Implement sync service
    - Create src/services/network/SyncService.ts
    - Implement syncAll to process pending requests
    - Handle success (clear cache) and failure (retain cache)
    - Auto-trigger sync on network recovery
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 6.4 Write property tests for sync behavior
    - **Property 9: Sync clears successful cache**
    - **Property 10: Sync preserves failed cache**
    - **Validates: Requirements 5.4, 5.5**

  - [x] 6.5 Create NetworkStatus component
    - Create src/components/common/NetworkStatus.vue
    - Display offline banner at page top
    - Show sync progress and results
    - _Requirements: 5.1_

  - [x] 6.6 Create ConfirmDialog component
    - Create src/components/common/ConfirmDialog.vue
    - Support info/warning/danger types
    - Display order details and consequences
    - Handle confirm and cancel actions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.7 Write property tests for confirm dialog
    - **Property 11: Confirm dialog shows order details**
    - **Property 12: Confirm cancel preserves state**
    - **Validates: Requirements 6.1, 6.4**

  - [x] 6.8 Create error message service
    - Create src/services/error/ErrorMessageService.ts
    - Implement error code to message mapping
    - Add solution suggestions for common errors
    - _Requirements: 7.1, 7.4_

  - [ ]* 6.9 Write property test for error messages
    - **Property 13: API error messages are specific**
    - **Validates: Requirements 7.1**

  - [x] 6.10 Enhance form validation with error highlighting
    - Update form components to show field-level errors
    - Add error message display below invalid fields
    - _Requirements: 7.2_

  - [ ]* 6.11 Write property test for form validation
    - **Property 14: Form validation highlights errors**
    - **Validates: Requirements 7.2**

- [x] 7. Checkpoint - Ensure offline module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration and page updates
  - [x] 8.1 Integrate NetworkStatus into main layout
    - Add NetworkStatus component to App.vue or MainLayout
    - Configure auto-hide behavior
    - _Requirements: 5.1_

  - [x] 8.2 Add confirm dialogs to critical actions
    - Add confirm dialog to grab order action
    - Add confirm dialog to complete order action
    - Add confirm dialog to cancel order action
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.3 Update API service with offline support
    - Wrap API calls with offline cache logic
    - Add network check before requests
    - Queue requests when offline
    - _Requirements: 5.2, 5.3_

  - [x] 8.4 Add push settings entry to MyProfile page
    - Add navigation to PushSettings page
    - Add navigation to PushHistory page
    - _Requirements: 4.1_

  - [x] 8.5 Configure routes for new pages
    - Add route for /marketplace/push-settings
    - Add route for /marketplace/push-history
    - _Requirements: 4.1, 4.4_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
