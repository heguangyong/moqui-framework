// Vue.js 应用适配器 - 将现有的 Vue 应用集成到 VS Code Webview 中

(function() {
    'use strict';

    // 模拟 Vue 应用的核心功能
    class VueAppAdapter {
        constructor() {
            this.stores = {
                project: null,
                workflow: null,
                notification: null,
                layout: null,
                command: null
            };
            
            this.components = new Map();
            this.eventBus = new EventTarget();
            this.isInitialized = false;
        }

        // 初始化适配器
        async initialize() {
            if (this.isInitialized) {
                return;
            }

            console.log('初始化 Vue 应用适配器...');
            
            // 初始化存储
            this.initializeStores();
            
            // 注册组件
            this.registerComponents();
            
            // 设置事件监听
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Vue 应用适配器初始化完成');
            
            // 调用初始化完成回调
            if (window.onVueAdapterReady) {
                window.onVueAdapterReady();
            }
        }

        // 初始化存储（模拟 Pinia stores）
        initializeStores() {
            // 项目存储
            this.stores.project = {
                currentProject: null,
                projects: [],
                
                setCurrentProject(project) {
                    this.currentProject = project;
                    vueAdapter.emit('project-changed', project);
                },
                
                addProject(project) {
                    this.projects.push(project);
                    vueAdapter.emit('projects-updated', this.projects);
                },
                
                updateProject(projectId, updates) {
                    const project = this.projects.find(p => p.id === projectId);
                    if (project) {
                        Object.assign(project, updates);
                        vueAdapter.emit('project-updated', project);
                    }
                }
            };

            // 工作流存储
            this.stores.workflow = {
                workflows: [],
                activeWorkflow: null,
                isExecuting: false,
                
                setActiveWorkflow(workflow) {
                    this.activeWorkflow = workflow;
                    vueAdapter.emit('workflow-changed', workflow);
                },
                
                addWorkflow(workflow) {
                    this.workflows.push(workflow);
                    vueAdapter.emit('workflows-updated', this.workflows);
                },
                
                executeWorkflow(workflowId) {
                    this.isExecuting = true;
                    vueAdapter.emit('workflow-execution-started', workflowId);
                    
                    // 发送到扩展执行
                    window.sendMessageToExtension({
                        type: 'run-workflow',
                        command: 'run-workflow',
                        data: { workflowId },
                        timestamp: Date.now()
                    });
                },
                
                stopExecution() {
                    this.isExecuting = false;
                    vueAdapter.emit('workflow-execution-stopped');
                }
            };

            // 通知存储
            this.stores.notification = {
                notifications: [],
                
                addNotification(notification) {
                    const id = `notification_${Date.now()}`;
                    const fullNotification = {
                        id,
                        timestamp: new Date(),
                        ...notification
                    };
                    
                    this.notifications.unshift(fullNotification);
                    vueAdapter.emit('notification-added', fullNotification);
                    
                    // 自动移除通知
                    if (notification.autoRemove !== false) {
                        setTimeout(() => {
                            this.removeNotification(id);
                        }, notification.duration || 5000);
                    }
                },
                
                removeNotification(id) {
                    const index = this.notifications.findIndex(n => n.id === id);
                    if (index >= 0) {
                        const notification = this.notifications.splice(index, 1)[0];
                        vueAdapter.emit('notification-removed', notification);
                    }
                },
                
                clearAll() {
                    this.notifications = [];
                    vueAdapter.emit('notifications-cleared');
                }
            };

            // 布局存储
            this.stores.layout = {
                theme: 'auto',
                sidebarCollapsed: false,
                panelSizes: {
                    left: 300,
                    right: 300,
                    bottom: 200
                },
                
                setTheme(theme) {
                    this.theme = theme;
                    vueAdapter.emit('theme-changed', theme);
                },
                
                toggleSidebar() {
                    this.sidebarCollapsed = !this.sidebarCollapsed;
                    vueAdapter.emit('sidebar-toggled', this.sidebarCollapsed);
                },
                
                updatePanelSize(panel, size) {
                    this.panelSizes[panel] = size;
                    vueAdapter.emit('panel-resized', { panel, size });
                }
            };

            // 命令存储
            this.stores.command = {
                commands: [],
                recentCommands: [],
                
                registerCommand(command) {
                    this.commands.push(command);
                    vueAdapter.emit('command-registered', command);
                },
                
                executeCommand(commandId, args = {}) {
                    const command = this.commands.find(c => c.id === commandId);
                    if (command) {
                        this.recentCommands.unshift(command);
                        if (this.recentCommands.length > 10) {
                            this.recentCommands.pop();
                        }
                        
                        vueAdapter.emit('command-executed', { command, args });
                        
                        // 发送到扩展执行
                        window.sendMessageToExtension({
                            type: 'execute-command',
                            command: 'execute-command',
                            data: { commandId, args },
                            timestamp: Date.now()
                        });
                    }
                }
            };
        }

        // 注册组件（模拟 Vue 组件）
        registerComponents() {
            // 主布局组件
            this.components.set('MainLayout', {
                name: 'MainLayout',
                render: () => this.renderMainLayout(),
                mounted: () => console.log('MainLayout mounted')
            });

            // 工作流面板组件
            this.components.set('WorkflowPanel', {
                name: 'WorkflowPanel',
                render: (props) => this.renderWorkflowPanel(props),
                mounted: () => console.log('WorkflowPanel mounted')
            });

            // 属性面板组件
            this.components.set('PropertiesPanel', {
                name: 'PropertiesPanel',
                render: (props) => this.renderPropertiesPanel(props),
                mounted: () => console.log('PropertiesPanel mounted')
            });

            // 素材浏览器组件
            this.components.set('AssetBrowser', {
                name: 'AssetBrowser',
                render: (props) => this.renderAssetBrowser(props),
                mounted: () => console.log('AssetBrowser mounted')
            });

            // 通知系统组件
            this.components.set('NotificationSystem', {
                name: 'NotificationSystem',
                render: () => this.renderNotificationSystem(),
                mounted: () => console.log('NotificationSystem mounted')
            });
        }

        // 设置事件监听
        setupEventListeners() {
            // 监听存储变化
            this.on('project-changed', (project) => {
                this.updateUI('project-info', project);
            });

            this.on('workflow-changed', (workflow) => {
                this.updateUI('workflow-editor', workflow);
            });

            this.on('notification-added', (notification) => {
                this.showNotification(notification);
            });

            this.on('theme-changed', (theme) => {
                this.applyTheme(theme);
            });
        }

        // 渲染主布局
        renderMainLayout() {
            return `
                <div class="vue-main-layout">
                    <div class="vue-header">
                        <div class="vue-toolbar">
                            <button class="vue-btn" onclick="vueAdapter.createProject()">
                                <i class="icon-plus"></i> 新建项目
                            </button>
                            <button class="vue-btn" onclick="vueAdapter.openWorkflow()">
                                <i class="icon-workflow"></i> 工作流
                            </button>
                            <button class="vue-btn" onclick="vueAdapter.showAssets()">
                                <i class="icon-assets"></i> 素材库
                            </button>
                        </div>
                    </div>
                    
                    <div class="vue-content">
                        <div class="vue-sidebar">
                            <div id="vue-project-panel" class="vue-panel">
                                <div class="vue-panel-header">项目</div>
                                <div class="vue-panel-content" id="project-content">
                                    <!-- 项目内容将在这里渲染 -->
                                </div>
                            </div>
                            
                            <div id="vue-properties-panel" class="vue-panel">
                                <div class="vue-panel-header">属性</div>
                                <div class="vue-panel-content" id="properties-content">
                                    <!-- 属性内容将在这里渲染 -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="vue-main">
                            <div id="vue-workflow-area" class="vue-workflow-area">
                                <!-- 工作流编辑器将在这里渲染 -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="vue-footer">
                        <div class="vue-status-bar">
                            <span id="vue-status-text">就绪</span>
                            <div class="vue-progress" id="vue-progress" style="display: none;">
                                <div class="vue-progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 渲染工作流面板
        renderWorkflowPanel(props = {}) {
            const workflows = this.stores.workflow.workflows;
            
            let workflowsHTML = '';
            workflows.forEach(workflow => {
                workflowsHTML += `
                    <div class="vue-workflow-item" onclick="vueAdapter.selectWorkflow('${workflow.id}')">
                        <div class="vue-workflow-name">${workflow.name}</div>
                        <div class="vue-workflow-description">${workflow.description || ''}</div>
                        <div class="vue-workflow-actions">
                            <button class="vue-btn-small" onclick="vueAdapter.editWorkflow('${workflow.id}')">编辑</button>
                            <button class="vue-btn-small" onclick="vueAdapter.runWorkflow('${workflow.id}')">运行</button>
                        </div>
                    </div>
                `;
            });

            return `
                <div class="vue-workflow-panel">
                    <div class="vue-workflow-list">
                        ${workflowsHTML || '<div class="vue-empty-state">暂无工作流</div>'}
                    </div>
                    <div class="vue-workflow-actions">
                        <button class="vue-btn" onclick="vueAdapter.createWorkflow()">
                            <i class="icon-plus"></i> 新建工作流
                        </button>
                    </div>
                </div>
            `;
        }

        // 渲染属性面板
        renderPropertiesPanel(props = {}) {
            const selectedItem = props.selectedItem;
            
            if (!selectedItem) {
                return `
                    <div class="vue-properties-empty">
                        <p>选择一个项目查看属性</p>
                    </div>
                `;
            }

            return `
                <div class="vue-properties-panel">
                    <div class="vue-property-group">
                        <label class="vue-property-label">名称</label>
                        <input type="text" class="vue-property-input" 
                               value="${selectedItem.name || ''}"
                               onchange="vueAdapter.updateProperty('name', this.value)">
                    </div>
                    
                    <div class="vue-property-group">
                        <label class="vue-property-label">类型</label>
                        <select class="vue-property-select" 
                                onchange="vueAdapter.updateProperty('type', this.value)">
                            <option value="novel">小说</option>
                            <option value="character">角色</option>
                            <option value="scene">场景</option>
                        </select>
                    </div>
                    
                    <div class="vue-property-group">
                        <label class="vue-property-label">描述</label>
                        <textarea class="vue-property-textarea" 
                                  onchange="vueAdapter.updateProperty('description', this.value)"
                                  placeholder="输入描述...">${selectedItem.description || ''}</textarea>
                    </div>
                </div>
            `;
        }

        // 渲染素材浏览器
        renderAssetBrowser(props = {}) {
            return `
                <div class="vue-asset-browser">
                    <div class="vue-asset-toolbar">
                        <input type="text" class="vue-search-input" 
                               placeholder="搜索素材..." 
                               onchange="vueAdapter.searchAssets(this.value)">
                        <button class="vue-btn" onclick="vueAdapter.uploadAsset()">
                            <i class="icon-upload"></i> 上传
                        </button>
                    </div>
                    
                    <div class="vue-asset-grid" id="asset-grid">
                        <!-- 素材网格将在这里渲染 -->
                    </div>
                </div>
            `;
        }

        // 渲染通知系统
        renderNotificationSystem() {
            return `
                <div id="vue-notifications" class="vue-notifications">
                    <!-- 通知将在这里动态添加 -->
                </div>
            `;
        }

        // 更新UI
        updateUI(elementId, data) {
            const element = document.getElementById(elementId);
            if (!element) return;

            switch (elementId) {
                case 'project-info':
                    this.updateProjectInfo(data);
                    break;
                case 'workflow-editor':
                    this.updateWorkflowEditor(data);
                    break;
            }
        }

        // 更新项目信息
        updateProjectInfo(project) {
            const content = document.getElementById('project-content');
            if (content && project) {
                content.innerHTML = `
                    <div class="vue-project-info">
                        <h3>${project.name}</h3>
                        <p>${project.config?.description || '暂无描述'}</p>
                        <div class="vue-project-stats">
                            <div class="vue-stat">
                                <span class="vue-stat-value">${project.novels?.length || 0}</span>
                                <span class="vue-stat-label">小说</span>
                            </div>
                            <div class="vue-stat">
                                <span class="vue-stat-value">${project.config?.characters?.length || 0}</span>
                                <span class="vue-stat-label">角色</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // 更新工作流编辑器
        updateWorkflowEditor(workflow) {
            const area = document.getElementById('vue-workflow-area');
            if (area && workflow) {
                area.innerHTML = `
                    <div class="vue-workflow-editor">
                        <h3>工作流: ${workflow.name}</h3>
                        <div class="vue-workflow-canvas">
                            <!-- 工作流画布 -->
                        </div>
                    </div>
                `;
            }
        }

        // 显示通知
        showNotification(notification) {
            const container = document.getElementById('vue-notifications');
            if (!container) return;

            const notificationEl = document.createElement('div');
            notificationEl.className = `vue-notification vue-notification-${notification.type || 'info'}`;
            notificationEl.innerHTML = `
                <div class="vue-notification-content">
                    <div class="vue-notification-title">${notification.title || ''}</div>
                    <div class="vue-notification-message">${notification.message}</div>
                </div>
                <button class="vue-notification-close" onclick="vueAdapter.removeNotification('${notification.id}')">
                    ×
                </button>
            `;

            container.appendChild(notificationEl);

            // 添加动画
            setTimeout(() => {
                notificationEl.classList.add('vue-notification-show');
            }, 10);
        }

        // 应用主题
        applyTheme(theme) {
            document.body.className = `vue-theme-${theme}`;
        }

        // 事件系统
        on(event, callback) {
            this.eventBus.addEventListener(event, (e) => callback(e.detail));
        }

        emit(event, data) {
            this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
        }

        // 公共方法（供HTML调用）
        createProject() {
            window.sendMessageToExtension({
                type: 'create-project',
                command: 'create-project',
                data: {},
                timestamp: Date.now()
            });
        }

        openWorkflow() {
            this.stores.notification.addNotification({
                type: 'info',
                message: '正在打开工作流编辑器...'
            });
        }

        showAssets() {
            this.stores.notification.addNotification({
                type: 'info',
                message: '正在加载素材库...'
            });
        }

        selectWorkflow(workflowId) {
            const workflow = this.stores.workflow.workflows.find(w => w.id === workflowId);
            if (workflow) {
                this.stores.workflow.setActiveWorkflow(workflow);
            }
        }

        editWorkflow(workflowId) {
            this.stores.notification.addNotification({
                type: 'info',
                message: `正在编辑工作流: ${workflowId}`
            });
        }

        runWorkflow(workflowId) {
            this.stores.workflow.executeWorkflow(workflowId);
        }

        createWorkflow() {
            const workflow = {
                id: `workflow_${Date.now()}`,
                name: '新工作流',
                description: '新创建的工作流',
                nodes: [],
                connections: []
            };
            
            this.stores.workflow.addWorkflow(workflow);
            this.stores.notification.addNotification({
                type: 'success',
                message: '工作流创建成功'
            });
        }

        updateProperty(property, value) {
            console.log(`更新属性: ${property} = ${value}`);
            // 这里可以发送到扩展进行实际更新
        }

        searchAssets(query) {
            console.log(`搜索素材: ${query}`);
        }

        uploadAsset() {
            this.stores.notification.addNotification({
                type: 'info',
                message: '正在打开文件选择器...'
            });
        }

        removeNotification(id) {
            this.stores.notification.removeNotification(id);
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.remove();
            }
        }

        // 处理来自扩展的消息
        handleExtensionMessage(message) {
            console.log('Vue适配器处理消息:', message);

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
            }
        }

        handleInitialData(data) {
            if (data.project) {
                this.stores.project.setCurrentProject(data.project);
            }
            
            if (data.projects) {
                this.stores.project.projects = data.projects;
            }
        }

        handleProjectLoaded(data) {
            if (data.project) {
                this.stores.project.setCurrentProject(data.project);
                this.stores.notification.addNotification({
                    type: 'success',
                    message: `项目 "${data.project.name}" 已加载`
                });
            }
        }

        handleWorkflowStatus(data) {
            if (data.status === 'running') {
                this.stores.notification.addNotification({
                    type: 'info',
                    message: '工作流正在执行...',
                    autoRemove: false
                });
            } else if (data.status === 'completed') {
                this.stores.workflow.stopExecution();
                this.stores.notification.addNotification({
                    type: 'success',
                    message: '工作流执行完成'
                });
            }
        }

        handleConfigUpdated(data) {
            console.log('配置已更新:', data);
        }

        handleError(data) {
            this.stores.notification.addNotification({
                type: 'error',
                title: '错误',
                message: data.message
            });
        }
    }

    // 创建全局实例
    window.vueAdapter = new VueAppAdapter();

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.vueAdapter.initialize();
        });
    } else {
        window.vueAdapter.initialize();
    }

})();