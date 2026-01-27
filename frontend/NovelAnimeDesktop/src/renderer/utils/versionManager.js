/**
 * 版本管理工具
 * 当应用版本更新时，自动清理前端缓存
 */

// 当前应用版本（从 package.json 同步）
export const APP_VERSION = '1.0.3';

// localStorage 键名
const VERSION_KEY = 'novel_anime_app_version';
const LAST_CLEAR_KEY = 'novel_anime_last_clear_time';

/**
 * 检查版本并清理缓存
 * 在应用启动时调用
 */
export function checkVersionAndClearCache() {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const currentVersion = APP_VERSION;
  
  console.log('🔍 [VersionManager] 检查应用版本:', {
    storedVersion,
    currentVersion
  });
  
  // 如果版本不匹配，清理缓存
  if (storedVersion !== currentVersion) {
    console.log('🔄 [VersionManager] 检测到版本变更，清理前端缓存...');
    console.log(`   旧版本: ${storedVersion || '未知'}`);
    console.log(`   新版本: ${currentVersion}`);
    
    clearFrontendCache();
    
    // 更新版本号
    localStorage.setItem(VERSION_KEY, currentVersion);
    localStorage.setItem(LAST_CLEAR_KEY, new Date().toISOString());
    
    console.log('✅ [VersionManager] 缓存清理完成，版本已更新');
    
    return true; // 返回 true 表示执行了清理
  }
  
  console.log('✅ [VersionManager] 版本匹配，无需清理缓存');
  return false; // 返回 false 表示未执行清理
}

/**
 * 清理前端缓存
 * 保留认证信息和用户设置
 */
function clearFrontendCache() {
  // 需要保留的键
  const keysToKeep = [
    'auth_token',
    'auth_user',
    'novel_anime_access_token',
    'novel_anime_refresh_token',
    'novel-anime-settings', // 用户设置
    'theme', // 主题设置
    VERSION_KEY, // 版本号
    LAST_CLEAR_KEY // 清理时间
  ];
  
  // 记录清理前的键数量
  const beforeCount = localStorage.length;
  const keysToRemove = [];
  
  // 收集需要删除的键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }
  
  // 删除收集到的键
  keysToRemove.forEach(key => {
    console.log(`   🗑️  删除: ${key}`);
    localStorage.removeItem(key);
  });
  
  const afterCount = localStorage.length;
  
  console.log(`📊 [VersionManager] 清理统计:`);
  console.log(`   清理前: ${beforeCount} 个键`);
  console.log(`   清理后: ${afterCount} 个键`);
  console.log(`   删除了: ${keysToRemove.length} 个键`);
}

/**
 * 手动清理所有缓存（包括认证信息）
 * 用于用户主动清理或退出登录
 */
export function clearAllCache() {
  console.log('🗑️ [VersionManager] 清理所有缓存...');
  
  const beforeCount = localStorage.length;
  localStorage.clear();
  
  console.log(`✅ [VersionManager] 已清理 ${beforeCount} 个缓存项`);
}

/**
 * 获取版本信息
 */
export function getVersionInfo() {
  return {
    currentVersion: APP_VERSION,
    storedVersion: localStorage.getItem(VERSION_KEY),
    lastClearTime: localStorage.getItem(LAST_CLEAR_KEY)
  };
}

/**
 * 强制更新版本号（用于测试）
 */
export function forceUpdateVersion(newVersion) {
  console.log(`🔧 [VersionManager] 强制更新版本: ${APP_VERSION} -> ${newVersion}`);
  localStorage.setItem(VERSION_KEY, newVersion);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  const stats = {
    totalKeys: localStorage.length,
    totalSize: 0,
    keys: []
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      stats.totalSize += size;
      stats.keys.push({
        key,
        size,
        sizeKB: (size / 1024).toFixed(2)
      });
    }
  }
  
  stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
  stats.totalSizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);
  
  return stats;
}
