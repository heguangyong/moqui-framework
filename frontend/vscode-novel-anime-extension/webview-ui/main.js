// 小说动漫生成器 Webview 主脚本

(function() {
    'use strict';

    // 全局状态
    let currentProject = null;
    let workflowNodes = [];
    let selectedNode = null;

    // 初始化应用
    function initializeApp() {
        console.log('初始化小说动漫生成器 Webview');
        
        // 隐藏加载界面
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // 创建主界面
        createMainInterface();
        
        // 设置事件监听器
        setupEventListeners();
    }

    // 创建主界面
    function createMainInterface() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="main-container fade-in">
                <div class="sidebar">
                    <div class="panel">
                        <div class="panel-header">项目信息</div>
                        <div class="panel-content">
                            <div id="project-info" class="project-info">
                                <div class="project-name">未选择项目</div>
                                <div class="project-description">请创建或打开一个项目</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="panel">
                        <div class="panel-header">属性</div>
                        <div class="panel-content">
                            <div id="properties-panel" class="properties-panel">
                                <p style="color: var(--vscode-descriptionForeground); text-align: center; padding: 20px;">
                                    选择一个节点查看属性
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="content-area">
                    <div class="toolbar">
                        <button id="add-node-btn" class="toolbar-button">添加节点</button>
                        <button id="run-workflow-btn" class="toolbar-button">运行工作流</button>
                        <button id="save-workflow-btn" class="toolbar-button">保存工作流</button>
                        <div style="flex: 1;"></div>
                        <button id="settings-btn" class="toolbar-button">设置</button>
                    </div>
                    
                    <div id="workflow-editor" class="workflow-editor">
                        <div id="workflow-canvas" class="workflow-canvas">
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--vscode-descriptionForeground);">
                                <div style="text-align: center;">
                                    <h3>工作流编辑器</h3>
                                    <p style="margin-top: 8px;">点击"添加节点"开始创建工作流</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 工具栏按钮
        document.getElementById('add-node-btn').addEventListener('click', showAddNodeDialog);
        document.getElementById('run-workflow-btn').addEventListener('click', runWorkflow);
        document.getElementById('save-workflow-btn').addEventListener('click', saveWorkflow);
        document.getElementById('settings-btn').addEventListener('click', showSettings);
    }

    // 显示添加节点对话框
    function showAddNodeDialog() {
        const nodeTypes = [
            { id: 'novel-parser', name: '小说解析器', description: '解析小说文本，提取章节和角色信息' },
            { id: 'character-analyzer', name: '角色分析器', description: '分析角色特征和关系' },
            { id: 'scene-generator', name: '场景生成器', description: '生成场景描述和视觉元素' },
            { id: 'script-converter', name: '脚本转换器', description: '将小说转换为剧本格式' },
            { id: 'storyboard-creator', name: '分镜创建器', description: '创建分镜头脚本' },
            { id: 'video-generator', name: '视频生成器', description: '生成最终的动画视频' }
        ];

        // 创建简单的选择界面
        const canvas = document.getElementById('workflow-canvas');
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 20px;
            z-index: 1000;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        let dialogHTML = '<h3 style="margin-bottom: 16px;">选择节点类型</h3>';
        nodeTypes.forEach(type => {
            dialogHTML += `
                <div class="node-type-option" data-type="${type.id}" style="
                    padding: 12px;
                    margin-bottom: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='var(--vscode-list-hoverBackground)'" 
                   onmouseout="this.style.backgroundColor='transparent'">
                    <div style="font-weight: 600; margin-bottom: 4px;">${type.name}</div>
                    <div style="font-size: 12px; color: var(--vscode-descriptionForeground);">${type.description}</div>
                </div>
            `;
        });

        dialogHTML += `
            <div style="margin-top: 16px; text-align: right;">
                <button id="cancel-add-node" class="toolbar-button" style="margin-right: 8px;">取消</button>
            </div>
        `;

        dialog.innerHTML = dialogHTML;
        document.body.appendChild(dialog);

        // 添加事件监听器
        dialog.querySelectorAll('.node-type-option').forEach(option => {
            option.addEventListener('click', () => {
                const nodeType = option.dataset.type;
                addWorkflowNode(nodeType);
                document.body.removeChild(dialog);
            });
        });

        document.getElementById('cancel-add-node').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    // 添加工作流节点
    function addWorkflowNode(nodeType) {
        const nodeTypeMap = {
            'novel-parser': { name: '小说解析器', color: '#4CAF50' },
            'character-analyzer': { name: '角色分析器', color: '#2196F3' },
            'scene-generator': { name: '场景生成器', color: '#FF9800' },
            'script-converter': { name: '脚本转换器', color: '#9C27B0' },
            'storyboard-creator': { name: '分镜创建器', color: '#F44336' },
            'video-generator': { name: '视频生成器', color: '#607D8B' }
        };

        const nodeInfo = nodeTypeMap[nodeType];
        const nodeId = `node_${Date.now()}`;
        
        const node = {
            id: nodeId,
            type: nodeType,
            name: nodeInfo.name,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
            config: {}
        };

        workflowNodes.push(node);
        renderWorkflowNode(node, nodeInfo.color);
    }

    // 渲染工作流节点
    function renderWorkflowNode(node, color) {
        const canvas = document.getElementById('workflow-canvas');
        
        // 清空画布提示文字
        if (workflowNodes.length === 1) {
            canvas.innerHTML = '';
        }

        const nodeElement = document.createElement('div');
        nodeElement.className = 'workflow-node';
        nodeElement.id = node.id;
        nodeElement.style.cssText = `
            left: ${node.x}px;
            top: ${node.y}px;
            border-color: ${color};
        `;

        nodeElement.innerHTML = `
            <div class="node-title">${node.name}</div>
            <div class="node-description">点击配置参数</div>
            <div class="node-ports">
                <div class="node-port input-port"></div>
                <div class="node-port output-port"></div>
            </div>
        `;

        // 添加点击事件
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(node);
        });

        // 添加拖拽功能
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        nodeElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffset.x = e.clientX - node.x;
            dragOffset.y = e.clientY - node.y;
            nodeElement.style.zIndex = '1000';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && selectedNode?.id === node.id) {
                node.x = e.clientX - dragOffset.x;
                node.y = e.clientY - dragOffset.y;
                nodeElement.style.left = node.x + 'px';
                nodeElement.style.top = node.y + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                nodeElement.style.zIndex = '';
            }
        });

        canvas.appendChild(nodeElement);
    }

    // 选择节点
    function selectNode(node) {
        // 清除之前的选择
        document.querySelectorAll('.workflow-node').forEach(el => {
            el.classList.remove('selected');
        });

        // 选择当前节点
        document.getElementById(node.id).classList.add('selected');
        selectedNode = node;

        // 更新属性面板
        updatePropertiesPanel(node);
    }

    // 更新属性面板
    function updatePropertiesPanel(node) {
        const panel = document.getElementById('properties-panel');
        
        panel.innerHTML = `
            <div class="property-group">
                <label class="property-label">节点名称</label>
                <input type="text" class="property-input" value="${node.name}" 
                       onchange="updateNodeProperty('${node.id}', 'name', this.value)">
            </div>
            
            <div class="property-group">
                <label class="property-label">节点类型</label>
                <input type="text" class="property-input" value="${node.type}" readonly>
            </div>
            
            <div class="property-group">
                <label class="property-label">位置 X</label>
                <input type="number" class="property-input" value="${Math.round(node.x)}" 
                       onchange="updateNodePosition('${node.id}', 'x', this.value)">
            </div>
            
            <div class="property-group">
                <label class="property-label">位置 Y</label>
                <input type="number" class="property-input" value="${Math.round(node.y)}" 
                       onchange="updateNodePosition('${node.id}', 'y', this.value)">
            </div>
            
            <div class="property-group">
                <button class="toolbar-button" onclick="deleteNode('${node.id}')" 
                        style="background: var(--vscode-errorForeground); width: 100%;">
                    删除节点
                </button>
            </div>
        `;
    }

    // 更新节点属性
    window.updateNodeProperty = function(nodeId, property, value) {
        const node = workflowNodes.find(n => n.id === nodeId);
        if (node) {
            node[property] = value;
            if (property === 'name') {
                document.querySelector(`#${nodeId} .node-title`).textContent = value;
            }
        }
    };

    // 更新节点位置
    window.updateNodePosition = function(nodeId, axis, value) {
        const node = workflowNodes.find(n => n.id === nodeId);
        if (node) {
            node[axis] = parseInt(value);
            const element = document.getElementById(nodeId);
            if (axis === 'x') {
                element.style.left = value + 'px';
            } else {
                element.style.top = value + 'px';
            }
        }
    };

    // 删除节点
    window.deleteNode = function(nodeId) {
        const index = workflowNodes.findIndex(n => n.id === nodeId);
        if (index >= 0) {
            workflowNodes.splice(index, 1);
            const element = document.getElementById(nodeId);
            if (element) {
                element.remove();
            }
            
            // 清空属性面板
            document.getElementById('properties-panel').innerHTML = `
                <p style="color: var(--vscode-descriptionForeground); text-align: center; padding: 20px;">
                    选择一个节点查看属性
                </p>
            `;
            selectedNode = null;
            
            // 如果没有节点了，显示提示
            if (workflowNodes.length === 0) {
                const canvas = document.getElementById('workflow-canvas');
                canvas.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--vscode-descriptionForeground);">
                        <div style="text-align: center;">
                            <h3>工作流编辑器</h3>
                            <p style="margin-top: 8px;">点击"添加节点"开始创建工作流</p>
                        </div>
                    </div>
                `;
            }
        }
    };

    // 运行工作流
    function runWorkflow() {
        if (workflowNodes.length === 0) {
            showMessage('请先添加工作流节点', 'warning');
            return;
        }

        const workflowConfig = {
            id: `workflow_${Date.now()}`,
            name: '默认工作流',
            nodes: workflowNodes,
            connections: []
        };

        // 发送消息给扩展
        window.sendMessageToExtension({
            type: 'run-workflow',
            command: 'run-workflow',
            data: { workflowConfig },
            timestamp: Date.now()
        });

        showMessage('工作流开始执行...', 'info');
    }

    // 保存工作流
    function saveWorkflow() {
        if (workflowNodes.length === 0) {
            showMessage('没有可保存的工作流', 'warning');
            return;
        }

        const workflowData = {
            nodes: workflowNodes,
            connections: [],
            savedAt: new Date().toISOString()
        };

        // 发送消息给扩展
        window.sendMessageToExtension({
            type: 'save-file',
            command: 'save-workflow',
            data: {
                filePath: 'workflow.json',
                content: JSON.stringify(workflowData, null, 2)
            },
            timestamp: Date.now()
        });

        showMessage('工作流已保存', 'success');
    }

    // 显示设置
    function showSettings() {
        window.sendMessageToExtension({
            type: 'get-config',
            command: 'get-config',
            data: {},
            timestamp: Date.now()
        });
    }

    // 显示消息
    function showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 这里可以实现更好的消息显示UI
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: var(--vscode-notifications-background);
            border: 1px solid var(--vscode-notifications-border);
            border-radius: 4px;
            color: var(--vscode-notifications-foreground);
            z-index: 2000;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // 处理来自扩展的消息
    window.handleExtensionMessage = function(message) {
        console.log('处理扩展消息:', message);
        
        switch (message.command) {
            case 'initial-data':
                handleInitialData(message.data);
                break;
                
            case 'project-created':
            case 'project-loaded':
                handleProjectLoaded(message.data.project);
                break;
                
            case 'workflow-started':
                showMessage('工作流开始执行', 'info');
                break;
                
            case 'workflow-completed':
                showMessage('工作流执行完成', 'success');
                break;
                
            case 'config-data':
                handleConfigData(message.data);
                break;
                
            case 'error':
                showMessage(message.data.message, 'error');
                break;
        }
    };

    // 处理初始数据
    function handleInitialData(data) {
        if (data.project) {
            handleProjectLoaded(data.project);
        }
    }

    // 处理项目加载
    function handleProjectLoaded(project) {
        currentProject = project;
        updateProjectInfo(project);
    }

    // 更新项目信息
    function updateProjectInfo(project) {
        const projectInfo = document.getElementById('project-info');
        if (projectInfo && project) {
            projectInfo.innerHTML = `
                <div class="project-name">${project.name}</div>
                <div class="project-description">${project.config.description || '暂无描述'}</div>
                <div class="project-stats">
                    <div class="stat-item">
                        <div class="stat-value">${project.novels?.length || 0}</div>
                        <div class="stat-label">小说文件</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${project.config.characters?.length || 0}</div>
                        <div class="stat-label">角色</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${project.workflows?.length || 0}</div>
                        <div class="stat-label">工作流</div>
                    </div>
                </div>
            `;
        }
    }

    // 处理配置数据
    function handleConfigData(data) {
        console.log('配置数据:', data);
        showMessage('配置已加载', 'info');
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();