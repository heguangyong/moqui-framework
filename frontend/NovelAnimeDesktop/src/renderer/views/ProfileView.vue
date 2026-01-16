<template>
  <div class="profile-view">
    <!-- 视图头部 -->
    <div class="profile-header">
      <h1>个人资料</h1>
      <p>管理您的账户信息</p>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="profile-card">
      <div class="avatar-section">
        <div class="avatar-large" :style="{ background: avatarGradient }">
          {{ userInitial }}
        </div>
        <button class="change-avatar-btn">
          <component :is="icons.camera" :size="16" />
          <span>更换头像</span>
        </button>
      </div>
      
      <div class="info-section">
        <div class="info-group">
          <label>用户名</label>
          <div class="info-value">
            <span>{{ userName }}</span>
            <button class="edit-btn" @click="editField('username')">
              <component :is="icons.edit" :size="14" />
            </button>
          </div>
        </div>
        
        <div class="info-group">
          <label>邮箱</label>
          <div class="info-value">
            <span>{{ userEmail }}</span>
            <span class="verified-badge" v-if="emailVerified">已验证</span>
          </div>
        </div>
        
        <div class="info-group">
          <label>注册时间</label>
          <div class="info-value">
            <span>{{ formatDate(createdDate) }}</span>
          </div>
        </div>
        
        <div class="info-group">
          <label>最后登录</label>
          <div class="info-value">
            <span>{{ formatDate(lastLoginDate) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 积分信息 -->
    <div class="credits-card">
      <div class="credits-header">
        <h3>积分余额</h3>
        <button class="recharge-btn" @click="handleRecharge">
          <component :is="icons.plus" :size="16" />
          <span>充值</span>
        </button>
      </div>
      <div class="credits-amount">
        <span class="amount">{{ credits }}</span>
        <span class="unit">积分</span>
      </div>
      <div class="credits-hint">
        积分可用于AI生成、角色分析等功能
      </div>
    </div>
    
    <!-- 安全设置 -->
    <div class="security-card">
      <h3>安全设置</h3>
      <div class="security-item" @click="handleChangePassword">
        <div class="security-info">
          <component :is="icons.lock" :size="20" />
          <div class="security-text">
            <span class="security-title">修改密码</span>
            <span class="security-desc">定期更换密码以保护账户安全</span>
          </div>
        </div>
        <component :is="icons.chevronRight" :size="20" class="arrow" />
      </div>
      
      <div class="security-item" @click="handleBindPhone">
        <div class="security-info">
          <component :is="icons.phone" :size="20" />
          <div class="security-text">
            <span class="security-title">绑定手机</span>
            <span class="security-desc">{{ phoneNumber || '未绑定' }}</span>
          </div>
        </div>
        <component :is="icons.chevronRight" :size="20" class="arrow" />
      </div>
      
      <div class="security-item" @click="handleLogout">
        <div class="security-info">
          <component :is="icons.logOut" :size="20" />
          <div class="security-text">
            <span class="security-title">退出登录</span>
            <span class="security-desc">退出当前账户</span>
          </div>
        </div>
        <component :is="icons.chevronRight" :size="20" class="arrow" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { icons } from '../utils/icons.js';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();

// 用户信息
const userName = computed(() => authStore.user?.username || authStore.user?.email?.split('@')[0] || '用户');
const userEmail = computed(() => authStore.user?.email || '');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const credits = computed(() => authStore.user?.credits || 0);
const emailVerified = ref(true);
const phoneNumber = ref('');
const createdDate = computed(() => authStore.user?.createdDate || new Date());
const lastLoginDate = computed(() => authStore.user?.lastLoginDate || new Date());

const avatarGradient = computed(() => {
  const colors = [
    '#7a9188',
    '#8a9cad',
    '#949c98',
  ];
  const index = userName.value.charCodeAt(0) % colors.length;
  return colors[index];
});

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function editField(field) {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '编辑功能即将上线',
    timeout: 2000
  });
}

function handleRecharge() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '充值功能即将上线',
    timeout: 2000
  });
}

function handleChangePassword() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '修改密码功能即将上线',
    timeout: 2000
  });
}

function handleBindPhone() {
  uiStore.addNotification({
    type: 'info',
    title: '功能开发中',
    message: '绑定手机功能即将上线',
    timeout: 2000
  });
}

async function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout();
    router.push('/login');
  }
}

onMounted(() => {
  console.log('📋 ProfileView mounted');
});
</script>

<style scoped>
.profile-view {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.profile-header {
  margin-bottom: 8px;
}

.profile-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.profile-header p {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

/* 用户信息卡片 */
.profile-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.change-avatar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: #c8c8c8;
  border: none;
  border-radius: 6px;
  color: #2c2c2e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.change-avatar-btn:hover {
  background-color: #d8d8d8;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-group label {
  font-size: 11px;
  font-weight: 600;
  color: #8a8a8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2c2c2e;
}

.edit-btn {
  padding: 4px;
  background: none;
  border: none;
  color: #8a8a8c;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #4a4a4c;
}

.verified-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
  border-radius: 8px;
  font-weight: 500;
}

/* 积分卡片 */
.credits-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.credits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.credits-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0;
}

.recharge-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background-color: #7a9188;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.recharge-btn:hover {
  background-color: #6a8178;
}

.credits-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.credits-amount .amount {
  font-size: 36px;
  font-weight: 700;
  color: #2c2c2e;
}

.credits-amount .unit {
  font-size: 14px;
  color: #6c6c6e;
}

.credits-hint {
  font-size: 12px;
  color: #8a8a8c;
}

/* 安全设置卡片 */
.security-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.security-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 16px 0;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.security-item:last-child {
  border-bottom: none;
}

.security-item:hover {
  background: rgba(255, 255, 255, 0.1);
  margin: 0 -12px;
  padding: 14px 12px;
  border-radius: 8px;
}

.security-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a4a4c;
}

.security-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.security-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.security-desc {
  font-size: 12px;
  color: #8a8a8c;
}

.arrow {
  color: #8a8a8c;
}
</style>
