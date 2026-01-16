<template>
  <div class="user-panel" :class="{ 'user-panel--collapsed': collapsed }">
    <!-- Not logged in state -->
    <div v-if="!authStore.isAuthenticated" class="user-panel__guest">
      <button class="login-btn" @click="goToLogin">
        <span class="login-icon">👤</span>
        <span v-if="!collapsed" class="login-text">登录</span>
      </button>
    </div>

    <!-- Logged in state -->
    <div v-else class="user-panel__user">
      <!-- User Avatar -->
      <div class="user-avatar" @click="toggleDropdown">
        <img 
          v-if="authStore.user?.avatarUrl" 
          :src="authStore.user.avatarUrl" 
          :alt="authStore.displayName"
          class="avatar-image"
        />
        <div v-else class="avatar-initials">
          {{ userInitials }}
        </div>
        
        <!-- Auth Provider Badge -->
        <span v-if="authProviderIcon" class="provider-badge" :title="authProviderLabel">
          {{ authProviderIcon }}
        </span>
      </div>

      <!-- User Info (when not collapsed) -->
      <div v-if="!collapsed" class="user-info">
        <div class="user-name">{{ authStore.displayName }}</div>
        
        <!-- Credits Display -->
        <div class="credits-display" :class="{ 'credits-low': authStore.hasLowCredits }">
          <span class="credits-icon">💎</span>
          <span class="credits-value">{{ creditsStore.formattedBalance }}</span>
          <span v-if="authStore.hasLowCredits" class="credits-warning" title="积分不足">⚠️</span>
        </div>
      </div>

      <!-- Dropdown Menu -->
      <Teleport to="body">
        <Transition name="dropdown">
          <div 
            v-if="showDropdown" 
            class="user-dropdown"
            :style="dropdownStyle"
            @click.stop
          >
            <div class="dropdown-header">
              <div class="dropdown-user-info">
                <div class="dropdown-avatar">
                  <img 
                    v-if="authStore.user?.avatarUrl" 
                    :src="authStore.user.avatarUrl" 
                    :alt="authStore.displayName"
                  />
                  <div v-else class="avatar-initials">{{ userInitials }}</div>
                </div>
                <div class="dropdown-user-details">
                  <div class="dropdown-user-name">{{ authStore.displayName }}</div>
                  <div class="dropdown-user-email">{{ authStore.user?.email }}</div>
                </div>
              </div>
            </div>

            <div class="dropdown-divider"></div>

            <!-- Credits Section -->
            <div class="dropdown-credits">
              <div class="credits-header">
                <span class="credits-label">积分余额</span>
                <span class="credits-amount" :class="{ 'low': authStore.hasLowCredits }">
                  💎 {{ creditsStore.formattedBalance }}
                </span>
              </div>
              <button class="credits-history-btn" @click="openCreditsHistory">
                查看积分记录
              </button>
            </div>

            <div class="dropdown-divider"></div>

            <!-- Menu Items -->
            <div class="dropdown-menu">
              <button class="dropdown-item" @click="goToSettings">
                <span class="item-icon">⚙️</span>
                <span class="item-label">设置</span>
              </button>
              <button class="dropdown-item" @click="switchAccount">
                <span class="item-icon">🔄</span>
                <span class="item-label">切换账号</span>
              </button>
              <button class="dropdown-item dropdown-item--danger" @click="handleLogout">
                <span class="item-icon">🚪</span>
                <span class="item-label">退出登录</span>
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Click outside to close -->
      <div v-if="showDropdown" class="dropdown-overlay" @click="closeDropdown"></div>
    </div>

    <!-- Credits History Dialog -->
    <CreditsHistoryDialog 
      v-model="showCreditsHistory"
      @close="showCreditsHistory = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCreditsStore } from '../../stores/credits'
import { useUIStore } from '../../stores/ui'
import CreditsHistoryDialog from '../dialogs/CreditsHistoryDialog.vue'

const props = defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const creditsStore = useCreditsStore()
const uiStore = useUIStore()

// Dropdown state
const showDropdown = ref(false)
const dropdownPosition = ref({ x: 0, y: 0 })

// Credits history dialog
const showCreditsHistory = ref(false)

// Computed
const userInitials = computed(() => {
  const name = authStore.displayName
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
})

const authProviderIcon = computed(() => {
  switch (authStore.userAuthProvider) {
    case 'github': return '🐙'
    case 'google': return '🔍'
    case 'wechat': return '💬'
    default: return null
  }
})

const authProviderLabel = computed(() => {
  switch (authStore.userAuthProvider) {
    case 'github': return 'GitHub 账号'
    case 'google': return 'Google 账号'
    case 'wechat': return '微信账号'
    default: return '本地账号'
  }
})

const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${dropdownPosition.value.x}px`,
  top: `${dropdownPosition.value.y}px`
}))

// Methods
function toggleDropdown(event: MouseEvent) {
  if (showDropdown.value) {
    closeDropdown()
  } else {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    dropdownPosition.value = {
      x: rect.left,
      y: rect.bottom + 8
    }
    showDropdown.value = true
  }
}

function closeDropdown() {
  showDropdown.value = false
}

function goToLogin() {
  router.push('/login')
}

function goToSettings() {
  closeDropdown()
  router.push('/settings')
}

function openCreditsHistory() {
  closeDropdown()
  showCreditsHistory.value = true
}

function switchAccount() {
  closeDropdown()
  uiStore.addNotification({
    type: 'info',
    title: '切换账号',
    message: '已退出当前账号，请重新登录'
  })
  authStore.logout()
  router.push('/login')
}

async function handleLogout() {
  closeDropdown()
  const userName = authStore.displayName
  await authStore.logout()
  uiStore.addNotification({
    type: 'success',
    title: '已退出登录',
    message: `再见，${userName}！`
  })
  router.push('/login')
}

// Fetch credits on mount if authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await creditsStore.fetchBalance()
  }
})

// Close dropdown on escape
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showDropdown.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.user-panel {
  padding: 12px;
  border-top: 1px solid var(--sidebar-border, #e0e0e0);

  &--collapsed {
    padding: 8px;
    display: flex;
    justify-content: center;
  }
}

.user-panel__guest {
  .login-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: #6e64c6;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }

    .login-icon {
      font-size: 18px;
    }
  }
}

.user-panel__user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  cursor: pointer;
  flex-shrink: 0;

  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #6e64c6;
    color: #fff;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 600;
  }

  .provider-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 50%;
    font-size: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--sidebar-text, #333);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .credits-display {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--sidebar-text-secondary, #666);

    &.credits-low {
      color: #f44336;
    }

    .credits-icon {
      font-size: 11px;
    }

    .credits-value {
      font-weight: 500;
    }

    .credits-warning {
      font-size: 11px;
    }
  }
}

// Dropdown
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.user-dropdown {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px;
  background: #6e64c6;
  color: #fff;
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .avatar-initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-size: 18px;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
}

.dropdown-user-details {
  flex: 1;
  min-width: 0;
}

.dropdown-user-name {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: #eee;
}

.dropdown-credits {
  padding: 12px 16px;

  .credits-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .credits-label {
    font-size: 13px;
    color: #666;
  }

  .credits-amount {
    font-size: 16px;
    font-weight: 600;
    color: #333;

    &.low {
      color: #f44336;
    }
  }

  .credits-history-btn {
    width: 100%;
    padding: 8px;
    background: #f5f5f5;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #eee;
    }
  }
}

.dropdown-menu {
  padding: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  &--danger {
    color: #f44336;

    &:hover {
      background: #ffebee;
    }
  }

  .item-icon {
    font-size: 16px;
  }
}

// Dropdown animation
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .user-dropdown {
    background: #1e1e2e;
  }

  .dropdown-divider {
    background: #3a3a4e;
  }

  .dropdown-credits {
    .credits-label {
      color: #aaa;
    }

    .credits-amount {
      color: #fff;
    }

    .credits-history-btn {
      background: #2a2a3e;
      color: #aaa;

      &:hover {
        background: #3a3a4e;
      }
    }
  }

  .dropdown-item {
    color: #ddd;

    &:hover {
      background: #2a2a3e;
    }

    &--danger:hover {
      background: rgba(244, 67, 54, 0.1);
    }
  }
}
</style>
