# Implementation Plan

## Phase 1: 项目基础设施

- [x] 1. 创建 Moqui 组件基础结构
  - [x] 1.1 创建 babelio 组件目录结构 (entity/, service/, screen/, data/)
    - 创建 `runtime/component/babelio/` 目录
    - 创建 MoquiConf.xml 组件配置文件
    - 创建 component.xml 组件描述文件
    - _Requirements: 9.1_
  - [x] 1.2 定义核心实体 (Book, Review, Draft)
    - 创建 BookEntities.xml 定义 Book 实体
    - 创建 ReviewEntities.xml 定义 Review, ReviewVersion, Draft 实体
    - _Requirements: 1.1, 9.1, 9.2_
  - [ ]* 1.3 编写实体序列化属性测试
    - **Property 20: Review Serialization Round-Trip**
    - **Validates: Requirements 9.3, 9.4**
  - [x] 1.4 定义用户相关实体 (BookshelfEntry, UserContribution)
    - 创建 UserEntities.xml 定义书架和贡献统计实体
    - _Requirements: 4.1, 8.2_
  - [x] 1.5 定义讨论和审核实体 (Comment, ModerationTicket)
    - 创建 DiscussionEntities.xml 和 ModerationEntities.xml
    - _Requirements: 6.1, 7.1_

- [x] 2. Checkpoint - 确保所有实体定义正确
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: 核心服务层

- [x] 3. 实现书籍服务
  - [x] 3.1 创建 BookServices.xml 服务定义
    - 实现 createBook, getBook, searchBooks, updateBook 服务
    - _Requirements: 1.1, 1.4_
  - [x] 3.2 实现书籍搜索服务
    - 支持 ISBN 和标题搜索
    - 集成 OpenSearch 全文搜索
    - _Requirements: 1.1, 10.1, 10.2_
  - [x] 3.3 编写搜索结果属性测试
    - **Property 22: Search Result Completeness**
    - **Property 23: Search Filter Accuracy**
    - **Validates: Requirements 10.2, 10.4**

- [-] 4. 实现三维评分服务
  - [x] 4.1 创建评分验证和计算服务
    - 实现 validateRating, calculateAverageRating 服务
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 编写评分验证属性测试
    - **Property 1: Three-Dimensional Rating Completeness**
    - **Validates: Requirements 2.1**
  - [x] 4.3 编写评分聚合属性测试
    - **Property 2: Rating Aggregation Accuracy**
    - **Validates: Requirements 2.2, 2.4**

- [x] 5. 实现书评服务
  - [x] 5.1 创建 ReviewServices.xml 服务定义
    - 实现 createReview, updateReview, getReview, listReviews 服务
    - _Requirements: 3.1, 9.1_
  - [x] 5.2 实现书评内容验证
    - 验证最小字数 500 字
    - 验证三维评分完整性
    - _Requirements: 3.3, 2.1_
  - [x] 5.3 编写书评验证属性测试
    - **Property 3: Minimum Review Length Enforcement**
    - **Validates: Requirements 3.3**
  - [x] 5.4 实现书评版本历史
    - 更新时保存历史版本
    - _Requirements: 9.2_
  - [x] 5.5 编写版本历史属性测试
    - **Property 21: Review Version History Preservation**
    - **Validates: Requirements 9.2**

- [x] 6. 实现草稿服务
  - [x] 6.1 创建草稿保存和检索服务
    - 实现 saveDraft, getDraft, listDrafts, deleteDraft 服务
    - _Requirements: 3.2, 3.5_
  - [x] 6.2 编写草稿持久化属性测试
    - **Property 4: Draft Persistence Round-Trip**
    - **Validates: Requirements 3.5, 9.3, 9.4**
  - [x] 6.3 编写草稿列表属性测试
    - **Property 19: Draft List Completeness**
    - **Validates: Requirements 8.4**

- [x] 7. Checkpoint - 确保核心服务测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 书架和用户服务

- [x] 8. 实现书架服务
  - [x] 8.1 创建 BookshelfServices.xml 服务定义
    - 实现 addToShelf, updateShelfStatus, getBookshelf 服务
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 8.2 实现书架状态验证
    - 验证状态值有效性
    - 处理重复添加
    - _Requirements: 4.1, 4.5_
  - [ ]* 8.3 编写书架状态属性测试
    - **Property 6: Bookshelf Status Validity**
    - **Validates: Requirements 4.1**
  - [x] 8.4 实现书架分组和排序
    - 按状态分组显示
    - 记录状态变更时间戳
    - _Requirements: 4.3, 4.4_
  - [ ]* 8.5 编写书架分组属性测试
    - **Property 7: Bookshelf Grouping Correctness**
    - **Property 8: Status Change Timestamp Recording**
    - **Validates: Requirements 4.3, 4.4**

- [x] 9. 实现用户贡献服务
  - [x] 9.1 创建贡献统计计算服务
    - 实现 calculateContributionScore, getUserContribution 服务
    - _Requirements: 7.4, 8.2_
  - [ ]* 9.2 编写贡献计算属性测试
    - **Property 16: Contribution Score Calculation**
    - **Property 18: User Contribution Display Completeness**
    - **Validates: Requirements 7.4, 8.2**

- [x] 10. Checkpoint - 确保书架和用户服务测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 讨论和审核服务

- [x] 11. 实现讨论服务
  - [x] 11.1 创建 DiscussionServices.xml 服务定义
    - 实现 createComment, getComments, quoteReview 服务
    - _Requirements: 6.1, 6.2_
  - [x] 11.2 实现评论内容验证
    - 禁止纯 emoji 或单字评论
    - _Requirements: 6.5_
  - [ ]* 11.3 编写评论验证属性测试
    - **Property 13: Invalid Comment Rejection**
    - **Validates: Requirements 6.5**
  - [x] 11.4 实现评论质量排序
    - 按质量分数排序而非时间
    - _Requirements: 6.1_
  - [ ]* 11.5 编写评论排序属性测试
    - **Property 11: Comment Quality Sorting**
    - **Validates: Requirements 6.1**
  - [x] 11.6 实现引用功能
    - 支持引用书评特定段落
    - _Requirements: 6.2_
  - [ ]* 11.7 编写引用保留属性测试
    - **Property 12: Quote Preservation**
    - **Validates: Requirements 6.2**

- [x] 12. 实现内容审核服务
  - [x] 12.1 创建 ModerationServices.xml 服务定义
    - 实现 reportContent, createTicket, resolveTicket 服务
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 12.2 编写审核工单属性测试
    - **Property 15: Moderation Ticket Creation**
    - **Validates: Requirements 7.1**
  - [x] 12.3 实现多人举报自动隐藏
    - 达到阈值自动隐藏评论
    - _Requirements: 6.4_
  - [ ]* 12.4 编写自动隐藏属性测试
    - **Property 14: Multi-Report Auto-Hide**
    - **Validates: Requirements 6.4**
  - [x] 12.5 实现渐进式限制
    - 根据违规次数递增限制
    - _Requirements: 7.5_
  - [ ]* 12.6 编写渐进限制属性测试
    - **Property 17: Progressive Restriction Application**
    - **Validates: Requirements 7.5**

- [x] 13. Checkpoint - 确保讨论和审核服务测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 质量权重和编辑推荐

- [x] 14. 实现质量权重算法
  - [x] 14.1 创建 QualityServices.xml 服务定义
    - 实现 calculateQualityWeight, updateVisibilityWeight 服务
    - _Requirements: 5.2, 5.4, 5.5_
  - [ ]* 14.2 编写质量排序属性测试
    - **Property 9: Quality-Based Review Ordering**
    - **Validates: Requirements 5.2**
  - [ ]* 14.3 编写贡献者权重属性测试
    - **Property 10: Contributor Weight Influence**
    - **Validates: Requirements 5.4, 8.3**

- [x] 15. 实现编辑推荐服务
  - [x] 15.1 创建首页内容聚合服务
    - 实现 getFeaturedBooks, getFeaturedReviews, getCurrentlyDiscussing 服务
    - _Requirements: 5.1, 5.3_
  - [x] 15.2 实现编辑精选标记
    - 支持编辑标记精选内容
    - _Requirements: 5.5_

- [x] 16. Checkpoint - 确保质量算法测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: REST API 端点

- [x] 17. 创建 API 端点
  - [x] 17.1 创建书籍 API 端点
    - GET /api/v1/books, GET /api/v1/books/{id}, POST /api/v1/books
    - _Requirements: 1.1, 1.4_
  - [x] 17.2 创建书评 API 端点
    - GET /api/v1/reviews, POST /api/v1/reviews, PUT /api/v1/reviews/{id}
    - _Requirements: 3.1, 9.1_
  - [x] 17.3 创建草稿 API 端点
    - GET /api/v1/drafts, POST /api/v1/drafts, DELETE /api/v1/drafts/{id}
    - _Requirements: 3.2, 3.5_
  - [x] 17.4 创建书架 API 端点
    - GET /api/v1/bookshelf, POST /api/v1/bookshelf, PUT /api/v1/bookshelf/{id}
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 17.5 创建讨论 API 端点
    - GET /api/v1/reviews/{id}/comments, POST /api/v1/comments
    - _Requirements: 6.1, 6.2_
  - [x] 17.6 创建搜索 API 端点
    - GET /api/v1/search
    - _Requirements: 10.1, 10.2, 10.4_
  - [x] 17.7 创建用户 API 端点
    - GET /api/v1/users/{id}/profile, GET /api/v1/users/{id}/contributions
    - _Requirements: 8.1, 8.2_

- [x] 18. Checkpoint - 确保 API 端点正常工作
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: 前端基础设施

- [x] 19. 创建前端项目结构
  - [x] 19.1 初始化 Vue 3 + Quasar 项目
    - 创建 `frontend/babelio/` 目录
    - 配置 Vite, TypeScript, Pinia
    - _Requirements: 3.1_
  - [x] 19.2 配置 UI 主题和样式
    - 实现极简理性风格的色彩和排版规范
    - 配置 SCSS 变量
    - _Requirements: UI/UX 规范_
  - [x] 19.3 创建 API 服务层
    - 创建 bookApi.ts, reviewApi.ts, searchApi.ts
    - _Requirements: 1.1, 3.1, 10.1_

- [x] 20. 实现通用组件
  - [x] 20.1 创建 ThreeDimensionalRating 组件
    - 支持评分输入和显示
    - 实现 tooltip 说明
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 20.2 创建 SearchBar 组件
    - 支持书籍和书评搜索
    - _Requirements: 10.1_
  - [x] 20.3 创建 Pagination 组件
    - 通用分页组件
    - _Requirements: 1.3, 10.2_

## Phase 8: 书籍和书评前端

- [x] 21. 实现书籍相关页面
  - [x] 21.1 创建 BookCard 组件
    - 显示书籍封面、标题、作者、评分
    - _Requirements: 1.1, 2.2_
  - [x] 21.2 创建 BookDetail 页面
    - 显示完整书籍信息和三维评分
    - 显示精选书评和全部书评链接
    - _Requirements: 1.2, 1.3_
  - [x] 21.3 创建 BookPage 路由和状态管理
    - 配置 Vue Router 和 Pinia store
    - _Requirements: 1.1_

- [x] 22. 实现书评编辑器
  - [x] 22.1 集成 TipTap 富文本编辑器
    - 支持 Markdown 和富文本格式
    - 实现实时预览
    - _Requirements: 3.1, 3.6_
  - [ ]* 22.2 编写 Markdown 渲染属性测试
    - **Property 5: Markdown Rendering Consistency**
    - **Validates: Requirements 3.1, 3.6**
  - [x] 22.3 实现自动保存功能
    - 每 30 秒自动保存草稿
    - _Requirements: 3.2_
  - [x] 22.4 实现字数统计和验证
    - 显示实时字数
    - 提交时验证最小字数
    - _Requirements: 3.3_
  - [x] 22.5 实现写作结构提示
    - 可折叠的写作指引
    - _Requirements: 3.4_

- [x] 23. 实现书评展示
  - [x] 23.1 创建 ReviewCard 组件
    - 显示书评摘要、评分、作者
    - _Requirements: 1.3, 5.2_
  - [x] 23.2 创建 ReviewList 组件
    - 按质量权重排序显示
    - _Requirements: 5.2_
  - [x] 23.3 创建 ReviewPage 详情页
    - 显示完整书评内容
    - 显示评论讨论区
    - _Requirements: 6.1_

- [x] 24. Checkpoint - 确保书籍和书评前端正常工作
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: 书架和用户中心前端

- [x] 25. 实现书架功能
  - [x] 25.1 创建 ShelfStatusSelector 组件
    - 想读/在读/读过状态选择
    - 公开/私密切换
    - _Requirements: 4.1, 4.2_
  - [x] 25.2 创建 BookshelfView 页面
    - 按状态分组显示
    - 支持排序选项
    - _Requirements: 4.3_

- [x] 26. 实现用户中心
  - [x] 26.1 创建 ProfilePage 页面
    - 显示用户书评、书架、草稿箱
    - _Requirements: 8.1_
  - [x] 26.2 创建贡献统计展示
    - 显示书评数、总字数、质量指标
    - _Requirements: 8.2_
  - [x] 26.3 创建草稿箱视图
    - 显示草稿列表和字数
    - _Requirements: 8.4_

## Phase 10: 讨论和首页前端

- [x] 27. 实现讨论功能
  - [x] 27.1 创建 CommentList 组件
    - 按质量分数排序显示
    - _Requirements: 6.1_
  - [x] 27.2 创建 CommentEditor 组件
    - 支持引用书评内容
    - 内容验证
    - _Requirements: 6.2, 6.5_
  - [x] 27.3 创建 QuoteBlock 组件
    - 显示引用的书评段落
    - _Requirements: 6.2_

- [x] 28. 实现首页
  - [x] 28.1 创建 HomePage 页面
    - 编辑推荐书籍区
    - 精选书评区
    - 正在讨论区
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 28.2 实现搜索页面
    - 搜索结果展示
    - 筛选功能
    - _Requirements: 10.2, 10.4_

- [x] 29. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
