# Requirements Document

## Introduction

本需求文档定义了上海港集装箱运输供需系统 Phase 4 高级功能的开发需求。Phase 4 聚焦于三个核心模块：地图集成、推送系统和异常状态处理，旨在提升司机端的导航体验、订单推送精准度和系统稳定性。

基于已完成的 Phase 1-3（设计系统、司机端核心功能、货主端功能），Phase 4 将为系统增加关键的高级功能，使其成为一个完整的生产级应用。

## Glossary

- **高德地图SDK**: 高德开放平台提供的地图服务开发工具包，支持地图显示、路线规划、导航等功能
- **港区图层**: 上海港区域的专属地图图层，包含码头、闸口、停车场等港区特定POI
- **集卡限制**: 集装箱卡车的通行限制，包括限高（桥梁、隧道）、限重（道路承载）
- **推送规则**: 根据司机车型、牌照、位置等条件筛选订单并推送的业务逻辑
- **本地缓存**: 将数据存储在客户端本地存储（LocalStorage/IndexedDB）中，用于离线访问和网络恢复
- **二次确认**: 对关键操作（如抢单、确认送达）要求用户再次确认的交互模式
- **沪牌**: 上海本地车牌，部分港区订单要求沪牌车辆

## Requirements

### Requirement 1

**User Story:** As a 集装箱卡车司机, I want to 在订单执行页面查看地图导航, so that I can 快速找到最优路线到达目的地。

#### Acceptance Criteria

1. WHEN 司机进入订单执行页面 THEN THE 系统 SHALL 显示高德地图组件并标注当前位置和目标位置
2. WHEN 地图加载完成 THEN THE 系统 SHALL 绘制从当前位置到目标位置的推荐路线
3. WHEN 司机点击导航按钮 THEN THE 系统 SHALL 调用高德地图导航功能启动实时导航
4. WHEN 路线规划时 THEN THE 系统 SHALL 考虑集卡限高和限重限制选择合适路线
5. WHEN 地图加载失败 THEN THE 系统 SHALL 显示友好的错误提示并提供重试选项

### Requirement 2

**User Story:** As a 集装箱卡车司机, I want to 在地图上查看上海港区的专属信息, so that I can 快速识别码头、闸口和停车场位置。

#### Acceptance Criteria

1. WHEN 地图显示上海港区域 THEN THE 系统 SHALL 加载港区专属图层显示码头位置
2. WHEN 地图显示上海港区域 THEN THE 系统 SHALL 标注各闸口入口和出口位置
3. WHEN 地图显示上海港区域 THEN THE 系统 SHALL 显示集卡停车场位置和可用状态
4. WHEN 司机点击港区POI标注 THEN THE 系统 SHALL 显示该位置的详细信息弹窗

### Requirement 3

**User Story:** As a 集装箱卡车司机, I want to 接收符合我条件的订单推送, so that I can 及时获取适合我的运输任务。

#### Acceptance Criteria

1. WHEN 新订单发布 THEN THE 系统 SHALL 根据司机车型筛选匹配的订单
2. WHEN 新订单发布 THEN THE 系统 SHALL 根据司机牌照类型（沪牌/非沪牌）筛选匹配的订单
3. WHEN 新订单发布 THEN THE 系统 SHALL 只推送距离司机当前位置50公里内的订单
4. WHEN 推送订单到达 THEN THE 系统 SHALL 显示推送通知并播放提示音
5. WHEN 司机点击推送通知 THEN THE 系统 SHALL 跳转到对应的订单详情页面

### Requirement 4

**User Story:** As a 集装箱卡车司机, I want to 管理我的推送设置, so that I can 控制接收推送的时间和类型。

#### Acceptance Criteria

1. WHEN 司机进入推送设置页面 THEN THE 系统 SHALL 显示推送开关和筛选条件设置
2. WHEN 司机关闭推送开关 THEN THE 系统 SHALL 停止向该司机推送新订单
3. WHEN 司机设置推送距离范围 THEN THE 系统 SHALL 按照设置的距离范围筛选推送订单
4. WHEN 司机查看推送历史 THEN THE 系统 SHALL 显示最近30天的推送记录列表

### Requirement 5

**User Story:** As a 集装箱卡车司机, I want to 在网络异常时继续使用应用, so that I can 在信号不好的港区也能完成工作。

#### Acceptance Criteria

1. WHEN 网络连接断开 THEN THE 系统 SHALL 在页面顶部显示非阻塞式网络状态提示条
2. WHEN 网络断开时司机提交数据 THEN THE 系统 SHALL 将数据缓存到本地存储
3. WHEN 网络连接恢复 THEN THE 系统 SHALL 自动提交本地缓存的数据
4. WHEN 本地缓存数据提交成功 THEN THE 系统 SHALL 显示同步成功提示并清除缓存
5. WHEN 本地缓存数据提交失败 THEN THE 系统 SHALL 保留缓存并提示用户手动重试

### Requirement 6

**User Story:** As a 集装箱卡车司机, I want to 在执行关键操作前收到确认提示, so that I can 避免误操作造成的问题。

#### Acceptance Criteria

1. WHEN 司机点击抢单按钮 THEN THE 系统 SHALL 显示二次确认弹窗包含订单关键信息
2. WHEN 司机点击确认送达按钮 THEN THE 系统 SHALL 显示二次确认弹窗要求确认
3. WHEN 司机点击取消订单按钮 THEN THE 系统 SHALL 显示二次确认弹窗并说明取消后果
4. WHEN 司机在确认弹窗中点击取消 THEN THE 系统 SHALL 关闭弹窗并保持当前状态
5. WHEN 司机在确认弹窗中点击确认 THEN THE 系统 SHALL 执行对应操作并显示结果反馈

### Requirement 7

**User Story:** As a 集装箱卡车司机, I want to 看到清晰的错误提示, so that I can 了解问题原因并采取正确的解决措施。

#### Acceptance Criteria

1. WHEN API请求失败 THEN THE 系统 SHALL 显示具体的错误原因而非通用错误信息
2. WHEN 表单验证失败 THEN THE 系统 SHALL 高亮显示错误字段并显示具体错误原因
3. WHEN 操作超时 THEN THE 系统 SHALL 显示超时提示并提供重试选项
4. WHEN 服务器返回业务错误 THEN THE 系统 SHALL 显示业务错误信息并提供解决建议
