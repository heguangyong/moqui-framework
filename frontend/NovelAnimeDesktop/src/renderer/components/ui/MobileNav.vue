<template>
  <div class="mobile-nav">
    <!-- Hamburger Menu Button -->
    <button 
      class="mobile-nav__toggle"
      @click="toggleMenu"
      :aria-label="isOpen ? 'Close menu' : 'Open menu'"
    >
      <component :is="isOpen ? icons.x : icons.menu" :size="24" />
    </button>

    <!-- Mobile Menu Overlay -->
    <transition name="fade">
      <div 
        v-if="isOpen" 
        class="mobile-nav__overlay"
        @click="closeMenu"
      />
    </transition>

    <!-- Mobile Menu Drawer -->
    <transition name="slide">
      <nav 
        v-if="isOpen" 
        class="mobile-nav__drawer"
        @click.stop
      >
        <!-- User Section -->
        <div class="mobile-nav__user">
          <div class="avatar-circle" :style="{ background: avatarGradient }">
            {{ userInitial }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-email">{{ userEmail }}</div>
          </div>
        </div>

        <!-- Navigation Items -->
        <div class="mobile-nav__items">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="mobile-nav__item"
            :class="{ 'mobile-nav__item--active': activeNavId === item.id }"
            @click="handleNavClick(item)"
          >
            <component :is="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Settings Link -->
        <div class="mobile-nav__footer">
          <button 
            class="mobile-nav__item"
            @click="handleSettingsClick"
          >
            <component :is="icons.settings" :size="20" />
            <span>设置</span>
          </button>
        </div>
      </nav>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '../../utils/icons.js'
import { useNavigationStore } from '../../stores/navigation.js'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

const isOpen = ref(false)

const navItems = [
  {
    id: 'dashboard',
    route: '/dashboard',
    label: '项目概览',
    icon: icons.home
  },
  {
    id: 'workflow',
    route: '/workflow',
    label: '工作流',
    icon: icons.gitBranch
  },
  {
    id: 'assets',
    route: '/assets',
    label: '资源库',
    icon: icons.folderOpen
  },
  {
    id: 'characters',
    route: '/characters',
    label: '角色管理',
    icon: icons.users
  }
]

const activeNavId = computed(() => navigationStore.activeNavId)
const userName = computed(() => userStore.displayName || '用户')
const userEmail = computed(() => userStore.email || '')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const avatarGradient = computed(() => {
  const colors = [
    '#7a9188',
    '#8a9aaa',
    '#959c98',
  ]
  const index = userName.value.charCodeAt(0) % colors.length
  return colors[index]
})

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleNavClick(nav) {
  navigationStore.setActiveNav(nav.id)
  router.push(nav.route)
  closeMenu()
}

function handleSettingsClick() {
  navigationStore.setActiveNav('settings')
  router.push('/settings')
  closeMenu()
}
</script>

<style scoped>
.mobile-nav {
  position: relative;
  z-index: 1000;
}

.mobile-nav__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #2c2c2e;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mobile-nav__toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.mobile-nav__toggle:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.mobile-nav__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-nav__drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: #eeeeee;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mobile-nav__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: #f8f8f8;
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 13px;
  color: #6c6c6e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-nav__items {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-nav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.mobile-nav__item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.mobile-nav__item:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.mobile-nav__item--active {
  background: rgba(205, 214, 210, 0.55);
  color: #2c2c2e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mobile-nav__footer {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
