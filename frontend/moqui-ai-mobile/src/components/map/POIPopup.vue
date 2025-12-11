<template>
  <q-dialog
    :model-value="visible"
    position="bottom"
    @update:model-value="handleVisibilityChange"
  >
    <q-card class="poi-popup-card">
      <!-- Header -->
      <q-card-section class="popup-header">
        <div class="header-content">
          <div class="poi-icon-wrapper" :class="poi?.type">
            <q-icon :name="getIcon()" size="24px" />
          </div>
          <div class="poi-info">
            <div class="poi-name">{{ poi?.name }}</div>
            <div class="poi-type-badge">
              <q-badge :color="getTypeColor()" :label="getTypeLabel()" />
            </div>
          </div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey"
          @click="handleClose"
        />
      </q-card-section>

      <q-separator />

      <!-- Status -->
      <q-card-section v-if="poi?.status" class="status-section">
        <div class="status-indicator">
          <div class="status-dot" :class="poi.status" />
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
        <div v-if="poi.details?.operatingHours" class="operating-hours">
          <q-icon name="schedule" size="16px" />
          <span>{{ poi.details.operatingHours }}</span>
        </div>
      </q-card-section>

      <!-- Details -->
      <q-card-section class="details-section">
        <!-- Address -->
        <div class="detail-item">
          <q-icon name="location_on" size="20px" color="grey" />
          <span class="detail-text">{{ poi?.address }}</span>
        </div>

        <!-- Phone -->
        <div v-if="poi?.details?.phone" class="detail-item clickable" @click="callPhone">
          <q-icon name="phone" size="20px" color="grey" />
          <span class="detail-text">{{ poi.details.phone }}</span>
          <q-icon name="chevron_right" size="20px" color="grey" />
        </div>

        <!-- Capacity (for parking) -->
        <div v-if="poi?.type === 'parking' && poi.details?.capacity" class="detail-item">
          <q-icon name="local_parking" size="20px" color="grey" />
          <span class="detail-text">
            车位: {{ poi.details.availableSpots ?? 0 }} / {{ poi.details.capacity }}
          </span>
          <q-badge
            v-if="poi.details.availableSpots !== undefined"
            :color="getAvailabilityColor()"
            :label="getAvailabilityLabel()"
          />
        </div>

        <!-- Description -->
        <div v-if="poi?.details?.description" class="detail-item description">
          <q-icon name="info" size="20px" color="grey" />
          <span class="detail-text">{{ poi.details.description }}</span>
        </div>

        <!-- Restrictions -->
        <div v-if="poi?.details?.restrictions?.length" class="restrictions-section">
          <div class="restrictions-title">
            <q-icon name="warning" size="18px" color="warning" />
            <span>注意事项</span>
          </div>
          <ul class="restrictions-list">
            <li v-for="(restriction, index) in poi.details.restrictions" :key="index">
              {{ restriction }}
            </li>
          </ul>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="popup-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="navigation"
          label="导航前往"
          class="action-btn"
          @click="navigateTo"
        />
        <q-btn
          flat
          no-caps
          color="grey"
          icon="share"
          label="分享位置"
          class="action-btn"
          @click="shareLocation"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import type { PortPOI, PortPOIType, PortPOIStatus } from '@/services/map/PortLayerService'
import { openExternalNavigation } from '@/services/map/AMapService'

// Props
interface Props {
  visible: boolean
  poi: PortPOI | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'navigate', poi: PortPOI): void
  (e: 'share', poi: PortPOI): void
}>()

const $q = useQuasar()

// Methods
function handleVisibilityChange(value: boolean): void {
  emit('update:visible', value)
  if (!value) {
    emit('close')
  }
}

function handleClose(): void {
  emit('update:visible', false)
  emit('close')
}

function getIcon(): string {
  const iconMap: Record<PortPOIType, string> = {
    terminal: 'directions_boat',
    gate: 'door_front',
    parking: 'local_parking',
    checkpoint: 'security'
  }
  return props.poi?.type ? iconMap[props.poi.type] : 'place'
}

function getTypeColor(): string {
  const colorMap: Record<PortPOIType, string> = {
    terminal: 'primary',
    gate: 'secondary',
    parking: 'info',
    checkpoint: 'warning'
  }
  return props.poi?.type ? colorMap[props.poi.type] : 'grey'
}

function getTypeLabel(): string {
  const labelMap: Record<PortPOIType, string> = {
    terminal: '码头',
    gate: '闸口',
    parking: '停车场',
    checkpoint: '查验区'
  }
  return props.poi?.type ? labelMap[props.poi.type] : '未知'
}

function getStatusText(): string {
  const textMap: Record<PortPOIStatus, string> = {
    open: '正常开放',
    closed: '暂停服务',
    busy: '繁忙'
  }
  return props.poi?.status ? textMap[props.poi.status] : '未知'
}

const availabilityRatio = computed(() => {
  if (!props.poi?.details?.capacity || props.poi.details.availableSpots === undefined) {
    return 1
  }
  return props.poi.details.availableSpots / props.poi.details.capacity
})

function getAvailabilityColor(): string {
  if (availabilityRatio.value > 0.3) return 'positive'
  if (availabilityRatio.value > 0.1) return 'warning'
  return 'negative'
}

function getAvailabilityLabel(): string {
  if (availabilityRatio.value > 0.3) return '充足'
  if (availabilityRatio.value > 0.1) return '紧张'
  return '已满'
}

function callPhone(): void {
  if (props.poi?.details?.phone) {
    window.location.href = `tel:${props.poi.details.phone}`
  }
}

function navigateTo(): void {
  if (props.poi) {
    openExternalNavigation(props.poi.position, props.poi.name)
    emit('navigate', props.poi)
  }
}

function shareLocation(): void {
  if (props.poi) {
    if (navigator.share) {
      navigator.share({
        title: props.poi.name,
        text: `${props.poi.name}\n${props.poi.address}`,
        url: `https://uri.amap.com/marker?position=${props.poi.position[0]},${props.poi.position[1]}&name=${encodeURIComponent(props.poi.name)}`
      }).catch(() => {
        // User cancelled or share failed
      })
    } else {
      // Fallback: copy to clipboard
      const text = `${props.poi.name}\n${props.poi.address}\n坐标: ${props.poi.position[0]}, ${props.poi.position[1]}`
      navigator.clipboard.writeText(text).then(() => {
        $q.notify({
          type: 'positive',
          message: '位置信息已复制到剪贴板'
        })
      })
    }
    emit('share', props.poi)
  }
}
</script>

<style scoped lang="scss">
.poi-popup-card {
  width: 100%;
  max-width: 500px;
  border-radius: 16px 16px 0 0;
  background: #2C2C2E;
  color: white;
}

.popup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .poi-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.terminal {
      background: linear-gradient(135deg, #3366FF, #5588FF);
    }
    &.gate {
      background: linear-gradient(135deg, #FF9500, #FFAA33);
    }
    &.parking {
      background: linear-gradient(135deg, #00C7BE, #33D4CC);
    }
    &.checkpoint {
      background: linear-gradient(135deg, #FF3B30, #FF6B60);
    }
  }

  .poi-info {
    .poi-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
  }
}

.status-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.open {
        background: #34C759;
      }
      &.closed {
        background: #FF3B30;
      }
      &.busy {
        background: #FF9500;
      }
    }

    .status-text {
      font-size: 14px;
      font-weight: 500;
    }
  }

  .operating-hours {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.details-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    &.clickable {
      cursor: pointer;
      padding: 8px 12px;
      margin: 0 -12px;
      border-radius: 8px;

      &:active {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &.description {
      align-items: flex-start;

      .detail-text {
        line-height: 1.5;
      }
    }

    .detail-text {
      flex: 1;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .restrictions-section {
    margin-top: 8px;
    padding: 12px;
    background: rgba(255, 149, 0, 0.1);
    border-radius: 8px;
    border-left: 3px solid #FF9500;

    .restrictions-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #FF9500;
      margin-bottom: 8px;
    }

    .restrictions-list {
      margin: 0;
      padding-left: 24px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);

      li {
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.popup-actions {
  padding: 16px;
  gap: 12px;

  .action-btn {
    flex: 1;
    height: 44px;
    border-radius: 12px;
    font-weight: 600;
  }
}
</style>
