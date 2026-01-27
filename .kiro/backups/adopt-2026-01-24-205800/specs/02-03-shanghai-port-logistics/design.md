# 上海港集装箱运输供需系统设计文档

## 概述

上海港集装箱运输供需系统是一个专为集装箱运输行业设计的移动端应用，采用Vue 3 + Quasar 2技术栈，集成高德地图API，提供完整的订单匹配、执行追踪和结算功能。

## 架构设计

### 技术架构

```
┌─────────────────────────────────────────┐
│           移动端应用层                   │
│    Vue 3.5 + Quasar 2.18 + TypeScript │
├─────────────────────────────────────────┤
│           状态管理层                     │
│         Pinia 3.x + IndexedDB          │
├─────────────────────────────────────────┤
│           服务集成层                     │
│    高德地图API + 推送服务 + 文件上传     │
├─────────────────────────────────────────┤
│           后端服务层                     │
│        Moqui Framework 3.1.0           │
├─────────────────────────────────────────┤
│           数据存储层                     │
│         关系数据库 + 文件存储            │
└─────────────────────────────────────────┘
```

### 组件架构

```
src/
├── components/           # 可复用组件
│   ├── OrderCard.vue    # 订单卡片组件
│   ├── ProgressBar.vue  # 进度条组件
│   ├── MapView.vue      # 地图组件
│   └── WalletCard.vue   # 钱包卡片组件
├── pages/               # 页面组件
│   ├── OrderHall.vue    # 订单大厅
│   ├── OrderExecution.vue # 订单执行
│   ├── Profile.vue      # 个人中心
│   └── PublishOrder.vue # 发布订单
├── stores/              # 状态管理
│   ├── orderStore.ts    # 订单状态
│   ├── userStore.ts     # 用户状态
│   └── mapStore.ts      # 地图状态
└── services/            # API服务
    ├── orderService.ts  # 订单服务
    ├── mapService.ts    # 地图服务
    └── pushService.ts   # 推送服务
```

## 数据模型

### 订单实体
```typescript
interface Order {
  id: string;
  orderNumber: string;
  fromPort: string;
  toPort: string;
  freight: number;
  containerType: string;
  requiresShanghai: boolean;
  publishTime: Date;
  status: OrderStatus;
  distance: number;
  estimatedTime: number;
}
```

### 用户实体
```typescript
interface Driver {
  id: string;
  plateNumber: string;
  vehicleType: string;
  isShanghai: boolean;
  level: number;
  wallet: Wallet;
  location: Location;
}
```

## 用户界面设计

### 设计系统

#### 色彩系统
- **主色**: `#0A1F6C` (科技蓝)
- **辅助色**: `#00D4AA` (港口绿)
- **行动色**: `#FF4F1E` (行动橙)
- **深色主题背景**: `#1C1C1E` / `#2C2C2E` / `#3A3A3C`

#### 字体规范
- **字体**: PingFang SC
- **大标题**: Semibold 34pt
- **卡片标题**: Medium 28pt
- **正文**: Regular 28pt

### 核心页面设计

#### 订单大厅页面
```vue
<template>
  <q-page class="order-hall">
    <!-- 状态栏 -->
    <div class="status-bar">
      <q-chip color="positive" text-color="white">听单中</q-chip>
      <span>洋山港四期</span>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <q-select v-model="filters.port" :options="portOptions" />
      <q-select v-model="filters.vehicleType" :options="vehicleTypes" />
      <q-toggle v-model="filters.shanghaiOnly" label="仅沪牌" />
    </div>
    
    <!-- 订单列表 -->
    <q-infinite-scroll @load="loadOrders">
      <order-card 
        v-for="order in orders" 
        :key="order.id"
        :order="order"
        @accept="acceptOrder"
        @reject="rejectOrder"
      />
    </q-infinite-scroll>
  </q-page>
</template>
```

#### 订单执行页面
```vue
<template>
  <q-page class="order-execution">
    <!-- 进度条 -->
    <progress-bar :current-step="currentStep" :steps="executionSteps" />
    
    <!-- 地图视图 -->
    <map-view 
      :route="route"
      :current-location="currentLocation"
      :destination="destination"
    />
    
    <!-- 操作区域 -->
    <div class="action-area">
      <template v-if="currentStep === 'PICKUP'">
        <q-input v-model="containerNumber" label="集装箱号" />
        <q-input v-model="sealNumber" label="铅封号" />
        <q-btn @click="takePhoto">拍摄照片</q-btn>
      </template>
    </div>
  </q-page>
</template>
```

## 地图集成设计

### 高德地图集成
```typescript
class MapService {
  private map: AMap.Map;
  
  initMap(container: string) {
    this.map = new AMap.Map(container, {
      zoom: 11,
      center: [121.4737, 31.2304], // 上海中心
      mapStyle: 'amap://styles/dark'
    });
    
    // 加载港区图层
    this.loadPortLayers();
  }
  
  planRoute(start: Location, end: Location) {
    const driving = new AMap.Driving({
      policy: AMap.DrivingPolicy.LEAST_TIME,
      restrictions: {
        height: 4.2, // 集卡限高
        weight: 55   // 集卡限重
      }
    });
    
    return driving.search(start, end);
  }
}
```

### 港区专属图层
- 码头位置标记
- 闸口位置和状态
- 集卡专用停车场
- 限行路段标识

## 推送系统设计

### 推送规则引擎
```typescript
class PushEngine {
  filterOrders(driver: Driver, orders: Order[]): Order[] {
    return orders.filter(order => {
      // 车型匹配
      if (!this.matchVehicleType(driver.vehicleType, order.containerType)) {
        return false;
      }
      
      // 沪牌要求
      if (order.requiresShanghai && !driver.isShanghai) {
        return false;
      }
      
      // 距离限制
      const distance = this.calculateDistance(driver.location, order.fromPort);
      if (distance > 50) {
        return false;
      }
      
      return true;
    });
  }
}
```

## 离线处理设计

### 本地存储策略
```typescript
class OfflineManager {
  private db: Dexie;
  
  constructor() {
    this.db = new Dexie('ShangHaiPortApp');
    this.db.version(1).stores({
      orders: '++id, orderNumber, status, syncStatus',
      operations: '++id, type, data, timestamp, synced'
    });
  }
  
  async cacheOrder(order: Order) {
    await this.db.orders.put({
      ...order,
      syncStatus: 'cached'
    });
  }
  
  async syncPendingOperations() {
    const pending = await this.db.operations
      .where('synced')
      .equals(false)
      .toArray();
      
    for (const operation of pending) {
      try {
        await this.syncOperation(operation);
        await this.db.operations.update(operation.id, { synced: true });
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

## 性能优化

### 列表虚拟化
- 订单列表使用虚拟滚动
- 每页加载10条订单
- 图片懒加载

### 缓存策略
- 订单数据缓存30分钟
- 地图瓦片本地缓存
- 用户偏好设置持久化

### 网络优化
- API请求去重
- 图片压缩上传
- 关键数据预加载

## 错误处理

### 网络异常处理
```typescript
class NetworkHandler {
  handleNetworkError(error: NetworkError) {
    // 显示非阻塞式提示
    this.showNetworkToast();
    
    // 缓存失败的操作
    this.cacheFailedOperation(error.operation);
    
    // 切换到离线模式
    this.enableOfflineMode();
  }
  
  showNetworkToast() {
    Notify.create({
      message: '网络连接异常，部分功能可能受限',
      color: 'warning',
      position: 'top',
      timeout: 0,
      actions: [{ label: '重试', handler: () => this.retryConnection() }]
    });
  }
}
```

## 测试策略

### 单元测试
- 组件逻辑测试
- 服务层测试
- 工具函数测试

### 集成测试
- API集成测试
- 地图功能测试
- 推送功能测试

### 端到端测试
- 完整订单流程测试
- 离线功能测试
- 多设备兼容性测试

## 部署架构

### 移动端部署
- Capacitor打包为原生应用
- 支持iOS和Android平台
- 自动更新机制

### 后端部署
- Moqui Framework容器化部署
- 负载均衡和高可用
- 数据库集群

## 监控和分析

### 性能监控
- 页面加载时间
- API响应时间
- 内存使用情况

### 业务监控
- 订单匹配成功率
- 用户活跃度
- 功能使用统计