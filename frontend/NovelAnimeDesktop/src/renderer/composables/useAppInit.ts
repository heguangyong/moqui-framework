/**
 * App Initialization Composable
 * 集中管理应用初始化流程，按依赖顺序初始化所有 stores
 * 
 * Requirements: 3.1, 3.2, 7.2, 6.4
 */
import { ref, readonly, type Ref } from 'vue';
import { useRouter } from 'vue-router';

// ============================================================================
// Module State (Singleton)
// ============================================================================

const isAppInitialized = ref(false);
const isInitializing = ref(false);
const initError = ref<string | null>(null);
let initPromise: Promise<void> | null = null;

// ============================================================================
// Types
// ============================================================================

export interface InitializableStore {
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export interface AppInitState {
  isAppInitialized: Readonly<Ref<boolean>>;
  isInitializing: Readonly<Ref<boolean>>;
  initError: Readonly<Ref<string | null>>;
}

// ============================================================================
// Composable
// ============================================================================

export function useAppInit() {
  /**
   * 初始化应用
   * 按依赖顺序初始化所有 stores
   * Requirements: 3.1, 3.2
   */
  async function initialize(): Promise<void> {
    // 如果已初始化，直接返回
    if (isAppInitialized.value) return;
    
    // 如果正在初始化，返回现有 Promise
    if (initPromise) return initPromise;
    
    initPromise = doInitialize();
    return initPromise;
  }

  /**
   * 执行初始化
   */
  async function doInitialize(): Promise<void> {
    isInitializing.value = true;
    initError.value = null;

    try {
      // 动态导入 stores 避免循环依赖
      const { useAuthStore } = await import('../stores/auth');
      const { useWorkflowStore } = await import('../stores/workflowStore');
      
      // 1. 初始化认证 Store（最高优先级）
      const authStore = useAuthStore();
      // Auth store 使用 validateToken 而不是 initialize
      if (authStore.accessToken) {
        await authStore.validateToken();
      }
      console.log('✅ AuthStore initialized');

      // 2. 初始化工作流 Store
      const workflowStore = useWorkflowStore();
      await workflowStore.initialize();
      console.log('✅ WorkflowStore initialized');

      // 3. 尝试初始化其他可选 stores
      try {
        const { useCreditsStore } = await import('../stores/credits');
        const creditsStore = useCreditsStore();
        if (typeof creditsStore.fetchBalance === 'function') {
          await creditsStore.fetchBalance();
          console.log('✅ CreditsStore initialized');
        }
      } catch (e) {
        // Credits store 是可选的
        console.log('ℹ️ CreditsStore not available');
      }

      isAppInitialized.value = true;
      console.log('🎉 App initialization complete');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown initialization error';
      initError.value = message;
      console.error('❌ App initialization failed:', message);
      throw e;
    } finally {
      isInitializing.value = false;
    }
  }

  /**
   * 等待初始化完成
   * Requirements: 3.3, 3.4
   */
  async function waitForInit(): Promise<void> {
    if (isAppInitialized.value) return;
    if (initPromise) {
      await initPromise;
      return;
    }
    // 如果还没开始初始化，启动初始化
    await initialize();
  }

  /**
   * 重置初始化状态（用于测试或重新登录）
   */
  function reset(): void {
    isAppInitialized.value = false;
    isInitializing.value = false;
    initError.value = null;
    initPromise = null;
  }

  /**
   * 初始化认证状态（兼容旧版本）
   * Requirements: 7.2
   */
  async function initializeAuth(): Promise<void> {
    try {
      const { useAuthStore } = await import('../stores/auth');
      const { useUIStore } = await import('../stores/ui');
      
      const authStore = useAuthStore();
      const uiStore = useUIStore();

      if (authStore.accessToken) {
        const result = await authStore.validateToken?.();

        if (result?.success) {
          try {
            const { useCreditsStore } = await import('../stores/credits');
            const creditsStore = useCreditsStore();
            await creditsStore.fetchBalance();
            
            uiStore.addNotification?.({
              type: 'success',
              title: '欢迎回来',
              message: `${authStore.displayName}，您的积分余额：${creditsStore.formattedBalance}`
            });
          } catch (e) {
            // Credits store 可能不可用
          }
        } else {
          uiStore.addNotification?.({
            type: 'warning',
            title: '登录已过期',
            message: '请重新登录'
          });
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      initError.value = message;
      console.error('Auth initialization failed:', message);
    }
  }

  /**
   * 处理启动重定向
   * Requirements: 6.4, 7.2, 7.3
   */
  async function handleStartupRedirect(): Promise<void> {
    try {
      const router = useRouter();
      const { useAuthStore } = await import('../stores/auth');
      const authStore = useAuthStore();
      
      const currentPath = router.currentRoute.value.path;
      
      if (!authStore.isAuthenticated && currentPath !== '/login') {
        router.push({
          path: '/login',
          query: { redirect: currentPath }
        });
      }
    } catch (e) {
      console.error('handleStartupRedirect failed:', e);
    }
  }

  return {
    // State (readonly)
    isAppInitialized: readonly(isAppInitialized),
    isInitializing: readonly(isInitializing),
    initError: readonly(initError),
    
    // Actions
    initialize,
    waitForInit,
    reset,
    
    // Legacy compatibility
    initializeAuth,
    handleStartupRedirect,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 检查 store 是否已初始化
 */
export function isStoreInitialized(store: unknown): store is InitializableStore {
  return (
    typeof store === 'object' &&
    store !== null &&
    'isInitialized' in store &&
    'initialize' in store
  );
}

/**
 * 获取当前初始化状态
 */
export function getInitState(): AppInitState {
  return {
    isAppInitialized: readonly(isAppInitialized),
    isInitializing: readonly(isInitializing),
    initError: readonly(initError),
  };
}
