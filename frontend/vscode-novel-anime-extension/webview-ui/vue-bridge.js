// Vue.js 应用桥接器 - 连接现有 Vue 应用与 VS Code Webview

(function() {
    'use strict';

    class VueBridge {
        constructor() {
            this.vueApp = null;
            this.stores = new Map();
            this.components = new Map();
            this.isInitialized = false;
            this.messageQueue = [];
        }

        // 初始化 Vue 应用桥接
        async initialize() {
            if (this.isInitialized) {
                return;
            }

            console.log('初始化 Vue 应用桥接器...');

            try {
                // 创建 Vue 应用实例
                await this.createVueApp();
                
                // 初始化存储系统
                this.initializeStores();
                
                // 注册组件
                this.registerComponents();
                
                // 设置消息处理
                this.setupMessageHandling();
                
                // 挂载应用
                await this.mountApp();
                
                this.isInitialized = true;
                console.log('Vue 应用桥接器初始化完成');
                
                // 处理队列中的消息
                this.processMessageQueue();
                
            } catch (error) {
                console.error('Vue 应用桥接器初始化失败:', error);
                throw error;
            }
        }

        // 创建 Vue 应用实例
        async createVueApp() {
            // 模拟 Vue 3 应用创建
            this.vueApp = {
                config: {
                    globalProperties: {},
                    errorHandler: (err, instance, info) => {
                        console.error('Vue 应用错误:', err, info);
                    }
                },
                
                // 全局状态
                provide: (key, value) => {
                    this.vueApp.config.globalProperties[key] = value;
                },
                
                // 组件注册
                component: (name, definition) => {
                    this.components.set(name, definition);
                },
                
                // 挂载
                mount: (selector) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        this.renderApp(element);
                        return this.createAppInstance();
                    }
                    throw new Error(`无法找到挂载元素: ${selector}`);
                }
            };
        }

        // 初始化存储系统（模拟 Pinia）
        initializeStores() {
            // 项目存储
            this.stores.set('project', {
                state: () => ({
                    currentProject: null,
                    projects: [],
                    isLoading: false
                }),
                
                actions: {
                    setCurrentProject: (project) => {
                        const store = this.stores.get('project');
                        store.state().currentProject = project;
                        this.notifyStoreChange('project', 'currentProject', project);
                    },
                    
                    addProject: (project) => {
                        const store = this.stores.get('project');
                        store.state().projects.push(project);
                        this.notifyStoreChange('project', 'projects', store.state().projects);
                    },
                    
                    updateProject: (projectId, updates) => {
                        const store = this.stores.get('project');
                        const projects = store.state().projects;
                        const index = projects.findIndex(p => p.id === projectId);
                        if (index >= 0) {
                            Object.assign(projects[index], updates);
                            this.notifyStoreChange('project', 'projects', projects);
                        }
                    }
                }
            });

            // 工作流存储
            this.stores.set('workflow', {
                state: () => ({
                    workflows: [],
                    activeWorkflow: null,
                    isExecuting: false,
                    executionProgress: 0
                }),
                
                actions: {
                    setActiveWorkflow: (workflow) => {
                        const store = this.stores.get('workflow');
                        store.state().activeWorkflow = workflow;
                        this.notifyStoreChange('workflow', 'activeWorkflow', workflow);
                    },
                    
                    executeWorkflow: (workflowId) => {
                        const store = this.stores.get('workflow');
                        store.state().isExecuting = true;
                        store.state().executionProgress = 0;
                        
                        this.sendMessageToExtension({
                            type: 'run-workflow',
                            command: 'run-workflow',
                            data: { workflowId },
                            timestamp: Date.now()
                        });
                        
                        this.notifyStoreChange('workflow', 'isExecuting', true);
                    },
                    
                    updateProgress: (progress) => {
                        const store = this.stores.get('workflow');
                        store.state().executionProgress = progress;
                        this.notifyStoreChange('workflow', 'executionProgress', progress);
                    }
                }
            });

            // 通知存储
            this.stores.set('notification', {
                state: () => ({
                    notifications: []
                }),
                
                actions: {
                    addNotification: (notification) => {
                        const store = this.stores.get('notification');
                        const id = `notification_${Date.now()}_${Math.random()}`;
                        const fullNotification = {
                            id,
                            timestamp: new Date(),
                            type: 'info',
                            duration: 5000,
                            ...notification
                        };
                        
                        store.state().notifications.unshift(fullNotification);
                        this.notifyStoreChange('notification', 'notifications', store.state().notifications);
                        
                        // 自动移除通知
                        if (fullNotification.autoRemove !== false) {
                            setTimeout(() => {
                                this.stores.get('notification').actions.removeNotification(id);
                            }, fullNotification.duration);
                        }
                        
                        return id;
                    },
                    
                    removeNotification: (id) => {
                        const store = this.stores.get('notification');
                        const notifications = store.state().notifications;
                        const index = notifications.findIndex(n => n.id === id);
                        if (index >= 0) {
                            notifications.splice(index, 1);
                            this.notifyStoreChange('notification', 'notifications', notifications);
                        }
                    }
                }
            });

            // 布局存储
            this.stores.set('layout', {
                state: () => ({
                    theme: 'auto',
                    sidebarCollapsed: false,
                    panelSizes: {
                        left: 300,
                        right: 300,
                        bottom: 200
                    },
                    activePanel: 'workflow'
                }),
                
                actions: {
                    setTheme: (theme) => {
                        const store = this.stores.get('layout');
                        store.state().theme = theme;
                        this.applyTheme(theme);
                        this.notifyStoreChange('layout', 'theme', theme);
                    },
                    
                    toggleSidebar: () => {
                        const store = this.stores.get('layout');
                        store.state().sidebarCollapsed = !store.state().sidebarCollapsed;
                        this.notifyStoreChange('layout', 'sidebarCollapsed', store.state().sidebarCollapsed);
                    },
                    
                    setActivePanel: (panel) => {
                        const store = this.stores.get('layout');
                        store.state().activePanel = panel;
                        this.notifyStoreChange('layout', 'activePanel', panel);
                    }
                }
            });
        }

        // 注册组件
        registerComponents() {
            // 主布局组件
            this.components.set('MainLayout', {
                name: 'MainLayout',
                template: this.getMainLayoutTemplate(),
                methods: {
                    onCreateProject: () => this.handleCreateProject(),
                    onOpenWorkflow: () => this.handleOpenWorkflow(),
                    onShowAssets: () => this.handleShowAssets()
                }
            });

            // 工作流编辑器组件
            this.components.set('WorkflowEditor', {
                name: 'WorkflowEditor',
                template: this.getWorkflowEditorTemplate(),
                props: ['workflow'],
                methods: {
                    onSaveWorkflow: (workflow) => this.handleSaveWorkflow(workflow),
                    onRunWorkflow: (workflow) => this.handleRunWorkflow(workflow)
                }
            });

            // 项目浏览器组件
            this.components.set('ProjectBrowser', {
                name: 'ProjectBrowser',
                template: this.getProjectBrowserTemplate(),
                props: ['projects', 'currentProject'],
                methods: {
                    onSelectProject: (project) => this.handleSelectProject(project),
                    onCreateProject: () => this.handleCreateProject()
                }
            });

            // 属性面板组件
            this.components.set('PropertiesPanel', {
                name: 'PropertiesPanel',
                template: this.getPropertiesPanelTemplate(),
                props: ['selectedItem'],
                methods: {
                    onUpdateProperty: (key, value) => this.handleUpdateProperty(key, value)
                }
            });

            // 通知组件
            this.components.set('NotificationList', {
                name: 'NotificationList',
                template: this.getNotificationListTemplate(),
                props: ['notifications'],
                methods: {
                    onDismissNotification: (id) => this.handleDismissNotification(id)
                }
            });
        }

        // 设置消息处理
        setupMessageHandling() {
            // 监听来自扩展的消息
            window.addEventListener('message', (event) => {
                this.handleExtensionMessage(event.data);
            });

            // 设置全局消息发送函数
            window.sendMessageToExtension = (message) => {
                this.sendMessageToExtension(message);
            };
        }

        // 挂载应用
        async mountApp() {
            const appElement = document.getElementById('app');
            if (!appElement) {
                throw new Error('找不到应用挂载点 #app');
            }

            // 渲染主应用
            this.renderApp(appElement);
            
            // 创建应用实例
            const appInstance = this.createAppInstance();
            
            // 设置全局引用
            window.vueApp = appInstance;
            
            return appInstance;
        }

        // 渲染应用
        renderApp(element) {
            const mainLayoutComponent = this.components.get('MainLayout');
            if (mainLayoutComponent) {
                element.innerHTML = mainLayoutComponent.template;
                
                // 绑定事件处理器
                this.bindEventHandlers(element, mainLayoutComponent.methods);
                
                // 初始化子组件
                this.initializeChildComponents(element);
            }
        }

        // 创建应用实例
        createAppInstance() {
            return {
                // 存储访问器
                $store: (storeName) => this.stores.get(storeName),
                
                // 组件访问器
                $component: (componentName) => this.components.get(componentName),
                
                // 消息发送
                $emit: (event, data) => this.handleAppEvent(event, data),
                
                // 状态更新
                $forceUpdate: () => this.forceUpdate(),
                
                // 销毁
                $destroy: () => this.destroy()
            };
        }

        // 绑定事件处理器
        bindEventHandlers(element, methods) {
            if (!methods) return;
            
            Object.keys(methods).forEach(methodName => {
                const handler = methods[methodName];
                const eventName = methodName.replace(/^on/, '').toLowerCase();
                
                // 查找对应的元素并绑定事件
                const elements = element.querySelectorAll(`[data-event="${eventName}"]`);
                elements.forEach(el => {
                    el.addEventListener('click', handler);
                });
            });
        }

        // 初始化子组件
        initializeChildComponents(element) {
            const componentElements = element.querySelectorAll('[data-component]');
            
            componentElements.forEach(el => {
                const componentName = el.getAttribute('data-component');
                const component = this.components.get(componentName);
                
                if (component) {
                    el.innerHTML = component.template;
                    
                    if (component.methods) {
                        this.bindEventHandlers(el, component.methods);
                    }
                }
            });
        }

        // 处理来自扩展的消息
        handleExtensionMessage(message) {
            if (!this.isInitialized) {
                this.messageQueue.push(message);
                return;
            }

            console.log('Vue 桥接器处理消息:', message);

            switch (message.command) {
                case 'initial-data':
                    this.handleInitialData(message.data);
                    break;

                case 'project-loaded':
                    this.handleProjectLoaded(message.data);
                    break;

                case 'workflow-status':
                    this.handleWorkflowStatus(message.data);
                    break;

                case 'config-updated':
                    this.handleConfigUpdated(message.data);
                    break;

                case 'error':
                    this.handleError(message.data);
                    break;

                default:
                    console.warn('未处理的消息类型:', message.command);
            }
        }

        // 处理初始数据
        handleInitialData(data) {
            if (data.project) {
                const projectStore = this.stores.get('project');
                projectStore.actions.setCurrentProject(data.project);
            }
            
            if (data.projects) {
                const projectStore = this.stores.get('project');
                data.projects.forEach(project => {
                    projectStore.actions.addProject(project);
                });
            }
            
            if (data.config) {
                this.handleConfigUpdated(data.config);
            }
        }

        // 处理项目加载
        handleProjectLoaded(data) {
            if (data.project) {
                const projectStore = this.stores.get('project');
                projectStore.actions.setCurrentProject(data.project);
                
                const notificationStore = this.stores.get('notification');
                notificationStore.actions.addNotification({
                    type: 'success',
                    title: '项目已加载',
                    message: `项目 "${data.project.name}" 已成功加载`
                });
            }
        }

        // 处理工作流状态
        handleWorkflowStatus(data) {
            const workflowStore = this.stores.get('workflow');
            
            if (data.status === 'running') {
                workflowStore.actions.updateProgress(data.progress || 0);
            } else if (data.status === 'completed') {
                workflowStore.state().isExecuting = false;
                workflowStore.actions.updateProgress(100);
                
                const notificationStore = this.stores.get('notification');
                notificationStore.actions.addNotification({
                    type: 'success',
                    title: '工作流完成',
                    message: '工作流执行已完成'
                });
            } else if (data.status === 'error') {
                workflowStore.state().isExecuting = false;
                
                const notificationStore = this.stores.get('notification');
                notificationStore.actions.addNotification({
                    type: 'error',
                    title: '工作流错误',
                    message: data.message || '工作流执行失败'
                });
            }
        }

        // 处理配置更新
        handleConfigUpdated(data) {
            console.log('配置已更新:', data);
            
            // 更新主题
            if (data.theme) {
                const layoutStore = this.stores.get('layout');
                layoutStore.actions.setTheme(data.theme);
            }
        }

        // 处理错误
        handleError(data) {
            const notificationStore = this.stores.get('notification');
            notificationStore.actions.addNotification({
                type: 'error',
                title: '错误',
                message: data.message || '发生未知错误'
            });
        }

        // 处理队列中的消息
        processMessageQueue() {
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.handleExtensionMessage(message);
            }
        }

        // 发送消息到扩展
        sendMessageToExtension(message) {
            if (window.vscode) {
                window.vscode.postMessage(message);
            } else {
                console.warn('VS Code API 不可用，无法发送消息:', message);
            }
        }

        // 通知存储变化
        notifyStoreChange(storeName, key, value) {
            // 触发 UI 更新
            this.updateUI(storeName, key, value);
            
            // 发送变化通知
            this.sendMessageToExtension({
                type: 'store-changed',
                command: 'store-changed',
                data: { storeName, key, value },
                timestamp: Date.now()
            });
        }

        // 更新 UI
        updateUI(storeName, key, value) {
            // 根据存储变化更新对应的 UI 元素
            switch (storeName) {
                case 'project':
                    this.updateProjectUI(key, value);
                    break;
                case 'workflow':
                    this.updateWorkflowUI(key, value);
                    break;
                case 'notification':
                    this.updateNotificationUI(key, value);
                    break;
                case 'layout':
                    this.updateLayoutUI(key, value);
                    break;
            }
        }

        // 更新项目 UI
        updateProjectUI(key, value) {
            if (key === 'currentProject' && value) {
                const projectInfo = document.getElementById('project-info');
                if (projectInfo) {
                    projectInfo.innerHTML = `
                        <h3>${value.name}</h3>
                        <p>${value.config?.description || '暂无描述'}</p>
                        <div class="project-stats">
                            <span>小说: ${value.novels?.length || 0}</span>
                            <span>角色: ${value.config?.characters?.length || 0}</span>
                        </div>
                    `;
                }
            }
        }

        // 更新工作流 UI
        updateWorkflowUI(key, value) {
            if (key === 'executionProgress') {
                const progressBar = document.getElementById('workflow-progress');
                if (progressBar) {
                    progressBar.style.width = `${value}%`;
                }
            }
        }

        // 更新通知 UI
        updateNotificationUI(key, value) {
            if (key === 'notifications') {
                const container = document.getElementById('notification-container');
                if (container) {
                    container.innerHTML = '';
                    value.forEach(notification => {
                        const el = this.createNotificationElement(notification);
                        container.appendChild(el);
                    });
                }
            }
        }

        // 更新布局 UI
        updateLayoutUI(key, value) {
            if (key === 'theme') {
                this.applyTheme(value);
            }
        }

        // 应用主题
        applyTheme(theme) {
            document.body.className = `vue-theme-${theme}`;
        }

        // 创建通知元素
        createNotificationElement(notification) {
            const el = document.createElement('div');
            el.className = `notification notification-${notification.type}`;
            el.innerHTML = `
                <div class="notification-content">
                    <div class="notification-title">${notification.title || ''}</div>
                    <div class="notification-message">${notification.message}</div>
                </div>
                <button class="notification-close" onclick="vueBridge.handleDismissNotification('${notification.id}')">×</button>
            `;
            return el;
        }

        // 事件处理方法
        handleCreateProject() {
            this.sendMessageToExtension({
                type: 'create-project',
                command: 'create-project',
                data: {},
                timestamp: Date.now()
            });
        }

        handleOpenWorkflow() {
            const layoutStore = this.stores.get('layout');
            layoutStore.actions.setActivePanel('workflow');
        }

        handleShowAssets() {
            const layoutStore = this.stores.get('layout');
            layoutStore.actions.setActivePanel('assets');
        }

        handleSelectProject(project) {
            const projectStore = this.stores.get('project');
            projectStore.actions.setCurrentProject(project);
        }

        handleSaveWorkflow(workflow) {
            this.sendMessageToExtension({
                type: 'save-workflow',
                command: 'save-workflow',
                data: { workflow },
                timestamp: Date.now()
            });
        }

        handleRunWorkflow(workflow) {
            const workflowStore = this.stores.get('workflow');
            workflowStore.actions.executeWorkflow(workflow.id);
        }

        handleUpdateProperty(key, value) {
            this.sendMessageToExtension({
                type: 'update-property',
                command: 'update-property',
                data: { key, value },
                timestamp: Date.now()
            });
        }

        handleDismissNotification(id) {
            const notificationStore = this.stores.get('notification');
            notificationStore.actions.removeNotification(id);
        }

        // 应用事件处理
        handleAppEvent(event, data) {
            console.log('应用事件:', event, data);
        }

        // 强制更新
        forceUpdate() {
            // 重新渲染应用
            const appElement = document.getElementById('app');
            if (appElement) {
                this.renderApp(appElement);
            }
        }

        // 销毁应用
        destroy() {
            this.isInitialized = false;
            this.stores.clear();
            this.components.clear();
            this.messageQueue = [];
        }

        // 模板方法
        getMainLayoutTemplate() {
            return `
                <div class="vue-main-layout">
                    <div class="vue-header">
                        <div class="vue-toolbar">
                            <button class="vue-btn" data-event="createproject">
                                <i class="icon-plus"></i> 新建项目
                            </button>
                            <button class="vue-btn" data-event="openworkflow">
                                <i class="icon-workflow"></i> 工作流
                            </button>
                            <button class="vue-btn" data-event="showassets">
                                <i class="icon-assets"></i> 素材库
                            </button>
                        </div>
                    </div>
                    
                    <div class="vue-content">
                        <div class="vue-sidebar">
                            <div data-component="ProjectBrowser" id="project-browser"></div>
                            <div data-component="PropertiesPanel" id="properties-panel"></div>
                        </div>
                        
                        <div class="vue-main">
                            <div data-component="WorkflowEditor" id="workflow-editor"></div>
                        </div>
                    </div>
                    
                    <div class="vue-footer">
                        <div class="vue-status-bar">
                            <span id="status-text">就绪</span>
                            <div class="vue-progress-container">
                                <div class="vue-progress-bar" id="workflow-progress"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div data-component="NotificationList" id="notification-container"></div>
                </div>
            `;
        }

        getWorkflowEditorTemplate() {
            return `
                <div class="workflow-editor">
                    <div class="workflow-header">
                        <h3>工作流编辑器</h3>
                        <div class="workflow-actions">
                            <button class="vue-btn" data-event="saveworkflow">保存</button>
                            <button class="vue-btn vue-btn-primary" data-event="runworkflow">运行</button>
                        </div>
                    </div>
                    <div class="workflow-canvas">
                        <div class="workflow-placeholder">
                            <p>工作流画布</p>
                            <p>在这里设计你的小说到动画转换流程</p>
                        </div>
                    </div>
                </div>
            `;
        }

        getProjectBrowserTemplate() {
            return `
                <div class="project-browser">
                    <div class="panel-header">
                        <h4>项目</h4>
                        <button class="vue-btn-small" data-event="createproject">+</button>
                    </div>
                    <div class="panel-content">
                        <div id="project-info">
                            <p>选择或创建一个项目</p>
                        </div>
                    </div>
                </div>
            `;
        }

        getPropertiesPanelTemplate() {
            return `
                <div class="properties-panel">
                    <div class="panel-header">
                        <h4>属性</h4>
                    </div>
                    <div class="panel-content">
                        <div class="properties-placeholder">
                            <p>选择一个项目查看属性</p>
                        </div>
                    </div>
                </div>
            `;
        }

        getNotificationListTemplate() {
            return `
                <div class="notification-list">
                    <!-- 通知将在这里动态添加 -->
                </div>
            `;
        }
    }

    // 创建全局实例
    window.vueBridge = new VueBridge();

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.vueBridge.initialize().catch(console.error);
        });
    } else {
        window.vueBridge.initialize().catch(console.error);
    }

})();