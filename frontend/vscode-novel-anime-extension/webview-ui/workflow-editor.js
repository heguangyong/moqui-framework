// 工作流编辑器组件 - 可视化工作流设计和执行

(function() {
    'use strict';

    class WorkflowEditor {
        constructor() {
            this.canvas = null;
            this.nodes = new Map();
            this.connections = new Map();
            this.selectedNode = null;
            this.draggedNode = null;
            this.isConnecting = false;
            this.connectionStart = null;
            this.workflowConfig = null;
            this.executionState = {
                isRunning: false,
                currentNode: null,
                progress: 0,
                logs: []
            };
        }

        // 初始化工作流编辑器
        initialize(canvasElement) {
            this.canvas = canvasElement;
            this.setupCanvas();
            this.setupEventListeners();
            this.loadDefaultNodes();
            
            console.log('工作流编辑器已初始化');
        }

        // 设置画布
        setupCanvas() {
            if (!this.canvas) return;

            this.canvas.innerHTML = `
                <div class="workflow-toolbar">
                    <div class="workflow-toolbar-group">
                        <button class="workflow-btn" data-action="add-novel-parser">
                            <i class="icon-book"></i> 小说解析
                        </button>
                        <button class="workflow-btn" data-action="add-character-extractor">
                            <i class="icon-person"></i> 角色提取
                        </button>
                        <button class="workflow-btn" data-action="add-scene-analyzer">
                            <i class="icon-scene"></i> 场景分析
                        </button>
                        <button class="workflow-btn" data-action="add-script-generator">
                            <i class="icon-script"></i> 脚本生成
                        </button>
                        <button class="workflow-btn" data-action="add-video-generator">
                            <i class="icon-video"></i> 视频生成
                        </button>
                    </div>
                    <div class="workflow-toolbar-group">
                        <button class="workflow-btn" data-action="save-workflow">
                            <i class="icon-save"></i> 保存
                        </button>
                        <button class="workflow-btn workflow-btn-primary" data-action="run-workflow">
                            <i class="icon-play"></i> 运行
                        </button>
                        <button class="workflow-btn" data-action="stop-workflow" disabled>
                            <i class="icon-stop"></i> 停止
                        </button>
                    </div>
                </div>
                
                <div class="workflow-canvas-container">
                    <div class="workflow-canvas" id="workflow-canvas">
                        <div class="workflow-grid"></div>
                        <svg class="workflow-connections" id="workflow-connections">
                            <!-- 连接线将在这里绘制 -->
                        </svg>
                        <div class="workflow-nodes" id="workflow-nodes">
                            <!-- 节点将在这里添加 -->
                        </div>
                    </div>
                </div>
                
                <div class="workflow-properties" id="workflow-properties">
                    <div class="properties-header">
                        <h4>属性</h4>
                    </div>
                    <div class="properties-content" id="properties-content">
                        <div class="properties-placeholder">
                            选择一个节点查看属性
                        </div>
                    </div>
                </div>
                
                <div class="workflow-logs" id="workflow-logs">
                    <div class="logs-header">
                        <h4>执行日志</h4>
                        <button class="workflow-btn-small" data-action="clear-logs">清空</button>
                    </div>
                    <div class="logs-content" id="logs-content">
                        <!-- 日志将在这里显示 -->
                    </div>
                </div>
            `;
        }

        // 设置事件监听器
        setupEventListeners() {
            if (!this.canvas) return;

            // 工具栏按钮事件
            this.canvas.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                if (action) {
                    this.handleToolbarAction(action);
                }
            });

            // 画布事件
            const canvasElement = this.canvas.querySelector('#workflow-canvas');
            if (canvasElement) {
                canvasElement.addEventListener('click', this.handleCanvasClick.bind(this));
                canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
                canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
                canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
                canvasElement.addEventListener('contextmenu', this.handleContextMenu.bind(this));
            }

            // 键盘事件
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        // 加载默认节点类型
        loadDefaultNodes() {
            this.nodeTypes = {
                'novel-parser': {
                    name: '小说解析器',
                    description: '解析小说文本，提取章节和基本结构',
                    inputs: ['novel_file'],
                    outputs: ['chapters', 'metadata'],
                    icon: 'icon-book',
                    color: '#4CAF50',
                    config: {
                        encoding: 'utf-8',
                        chapterPattern: '^第.+章',
                        extractMetadata: true
                    }
                },
                
                'character-extractor': {
                    name: '角色提取器',
                    description: '从小说中提取角色信息和对话',
                    inputs: ['chapters'],
                    outputs: ['characters', 'dialogues'],
                    icon: 'icon-person',
                    color: '#2196F3',
                    config: {
                        dialoguePattern: '^([^：]+)：(.+)$',
                        extractTraits: true,
                        minDialogues: 3
                    }
                },
                
                'scene-analyzer': {
                    name: '场景分析器',
                    description: '分析场景描述和环境设置',
                    inputs: ['chapters'],
                    outputs: ['scenes', 'environments'],
                    icon: 'icon-scene',
                    color: '#FF9800',
                    config: {
                        scenePattern: '\\[场景：([^\\]]+)\\]',
                        extractMood: true,
                        timeAnalysis: true
                    }
                },
                
                'script-generator': {
                    name: '脚本生成器',
                    description: '生成动画脚本和分镜',
                    inputs: ['characters', 'scenes', 'dialogues'],
                    outputs: ['script', 'storyboard'],
                    icon: 'icon-script',
                    color: '#9C27B0',
                    config: {
                        scriptFormat: 'anime',
                        includeDirections: true,
                        generateStoryboard: true
                    }
                },
                
                'video-generator': {
                    name: '视频生成器',
                    description: '生成最终的动画视频',
                    inputs: ['script', 'storyboard'],
                    outputs: ['video'],
                    icon: 'icon-video',
                    color: '#F44336',
                    config: {
                        resolution: '1920x1080',
                        fps: 24,
                        format: 'mp4',
                        quality: 'high'
                    }
                }
            };
        }

        // 处理工具栏操作
        handleToolbarAction(action) {
            switch (action) {
                case 'add-novel-parser':
                    this.addNode('novel-parser', { x: 100, y: 100 });
                    break;
                case 'add-character-extractor':
                    this.addNode('character-extractor', { x: 300, y: 100 });
                    break;
                case 'add-scene-analyzer':
                    this.addNode('scene-analyzer', { x: 500, y: 100 });
                    break;
                case 'add-script-generator':
                    this.addNode('script-generator', { x: 700, y: 100 });
                    break;
                case 'add-video-generator':
                    this.addNode('video-generator', { x: 900, y: 100 });
                    break;
                case 'save-workflow':
                    this.saveWorkflow();
                    break;
                case 'run-workflow':
                    this.runWorkflow();
                    break;
                case 'stop-workflow':
                    this.stopWorkflow();
                    break;
                case 'clear-logs':
                    this.clearLogs();
                    break;
            }
        }

        // 添加节点
        addNode(type, position) {
            const nodeType = this.nodeTypes[type];
            if (!nodeType) return;

            const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const node = {
                id: nodeId,
                type: type,
                name: nodeType.name,
                description: nodeType.description,
                position: position,
                inputs: [...nodeType.inputs],
                outputs: [...nodeType.outputs],
                config: { ...nodeType.config },
                status: 'idle' // idle, running, completed, error
            };

            this.nodes.set(nodeId, node);
            this.renderNode(node);
            this.selectNode(nodeId);

            console.log(`添加节点: ${nodeType.name}`);
        }

        // 渲染节点
        renderNode(node) {
            const nodesContainer = this.canvas.querySelector('#workflow-nodes');
            if (!nodesContainer) return;

            const nodeType = this.nodeTypes[node.type];
            const nodeElement = document.createElement('div');
            nodeElement.className = 'workflow-node';
            nodeElement.setAttribute('data-node-id', node.id);
            nodeElement.style.left = `${node.position.x}px`;
            nodeElement.style.top = `${node.position.y}px`;
            nodeElement.style.borderColor = nodeType.color;

            nodeElement.innerHTML = `
                <div class="node-header" style="background-color: ${nodeType.color}">
                    <i class="${nodeType.icon}"></i>
                    <span class="node-title">${node.name}</span>
                    <div class="node-status node-status-${node.status}"></div>
                </div>
                <div class="node-body">
                    <div class="node-inputs">
                        ${node.inputs.map(input => `
                            <div class="node-port node-input" data-port="${input}">
                                <div class="port-dot"></div>
                                <span class="port-label">${input}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="node-outputs">
                        ${node.outputs.map(output => `
                            <div class="node-port node-output" data-port="${output}">
                                <span class="port-label">${output}</span>
                                <div class="port-dot"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            nodesContainer.appendChild(nodeElement);

            // 添加节点事件监听器
            this.setupNodeEventListeners(nodeElement, node);
        }

        // 设置节点事件监听器
        setupNodeEventListeners(nodeElement, node) {
            // 节点选择
            nodeElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectNode(node.id);
            });

            // 节点拖拽
            const header = nodeElement.querySelector('.node-header');
            header.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startNodeDrag(node.id, e);
            });

            // 端口连接
            const ports = nodeElement.querySelectorAll('.node-port');
            ports.forEach(port => {
                port.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.startConnection(node.id, port.getAttribute('data-port'), port.classList.contains('node-output'));
                });
            });
        }

        // 选择节点
        selectNode(nodeId) {
            // 清除之前的选择
            this.canvas.querySelectorAll('.workflow-node.selected').forEach(el => {
                el.classList.remove('selected');
            });

            // 选择新节点
            const nodeElement = this.canvas.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeElement) {
                nodeElement.classList.add('selected');
                this.selectedNode = nodeId;
                this.showNodeProperties(nodeId);
            }
        }

        // 显示节点属性
        showNodeProperties(nodeId) {
            const node = this.nodes.get(nodeId);
            if (!node) return;

            const propertiesContent = this.canvas.querySelector('#properties-content');
            if (!propertiesContent) return;

            propertiesContent.innerHTML = `
                <div class="property-group">
                    <label class="property-label">节点名称</label>
                    <input type="text" class="property-input" value="${node.name}" 
                           onchange="workflowEditor.updateNodeProperty('${nodeId}', 'name', this.value)">
                </div>
                
                <div class="property-group">
                    <label class="property-label">描述</label>
                    <textarea class="property-textarea" 
                              onchange="workflowEditor.updateNodeProperty('${nodeId}', 'description', this.value)">${node.description}</textarea>
                </div>
                
                <div class="property-section">
                    <h5>配置</h5>
                    ${this.renderNodeConfig(node)}
                </div>
                
                <div class="property-actions">
                    <button class="workflow-btn-small" onclick="workflowEditor.duplicateNode('${nodeId}')">复制</button>
                    <button class="workflow-btn-small workflow-btn-danger" onclick="workflowEditor.deleteNode('${nodeId}')">删除</button>
                </div>
            `;
        }

        // 渲染节点配置
        renderNodeConfig(node) {
            let configHTML = '';
            
            for (const [key, value] of Object.entries(node.config)) {
                const inputType = typeof value === 'boolean' ? 'checkbox' : 
                                typeof value === 'number' ? 'number' : 'text';
                
                configHTML += `
                    <div class="property-group">
                        <label class="property-label">${key}</label>
                        ${inputType === 'checkbox' ? 
                            `<input type="checkbox" class="property-checkbox" ${value ? 'checked' : ''} 
                                    onchange="workflowEditor.updateNodeConfig('${node.id}', '${key}', this.checked)">` :
                            `<input type="${inputType}" class="property-input" value="${value}" 
                                    onchange="workflowEditor.updateNodeConfig('${node.id}', '${key}', this.value)">`
                        }
                    </div>
                `;
            }
            
            return configHTML;
        }

        // 更新节点属性
        updateNodeProperty(nodeId, property, value) {
            const node = this.nodes.get(nodeId);
            if (node) {
                node[property] = value;
                
                // 更新UI
                if (property === 'name') {
                    const nodeElement = this.canvas.querySelector(`[data-node-id="${nodeId}"] .node-title`);
                    if (nodeElement) {
                        nodeElement.textContent = value;
                    }
                }
            }
        }

        // 更新节点配置
        updateNodeConfig(nodeId, key, value) {
            const node = this.nodes.get(nodeId);
            if (node) {
                // 类型转换
                if (typeof node.config[key] === 'number') {
                    value = parseFloat(value) || 0;
                } else if (typeof node.config[key] === 'boolean') {
                    value = Boolean(value);
                }
                
                node.config[key] = value;
            }
        }

        // 开始节点拖拽
        startNodeDrag(nodeId, event) {
            this.draggedNode = {
                id: nodeId,
                startX: event.clientX,
                startY: event.clientY,
                initialPosition: { ...this.nodes.get(nodeId).position }
            };

            document.addEventListener('mousemove', this.handleNodeDrag.bind(this));
            document.addEventListener('mouseup', this.endNodeDrag.bind(this));
        }

        // 处理节点拖拽
        handleNodeDrag(event) {
            if (!this.draggedNode) return;

            const deltaX = event.clientX - this.draggedNode.startX;
            const deltaY = event.clientY - this.draggedNode.startY;
            
            const newPosition = {
                x: this.draggedNode.initialPosition.x + deltaX,
                y: this.draggedNode.initialPosition.y + deltaY
            };

            // 更新节点位置
            const node = this.nodes.get(this.draggedNode.id);
            if (node) {
                node.position = newPosition;
                
                const nodeElement = this.canvas.querySelector(`[data-node-id="${this.draggedNode.id}"]`);
                if (nodeElement) {
                    nodeElement.style.left = `${newPosition.x}px`;
                    nodeElement.style.top = `${newPosition.y}px`;
                }
                
                // 更新连接线
                this.updateConnections();
            }
        }

        // 结束节点拖拽
        endNodeDrag() {
            this.draggedNode = null;
            document.removeEventListener('mousemove', this.handleNodeDrag.bind(this));
            document.removeEventListener('mouseup', this.endNodeDrag.bind(this));
        }

        // 开始连接
        startConnection(nodeId, portName, isOutput) {
            this.isConnecting = true;
            this.connectionStart = {
                nodeId,
                portName,
                isOutput
            };
            
            console.log(`开始连接: ${nodeId}.${portName} (${isOutput ? 'output' : 'input'})`);
        }

        // 创建连接
        createConnection(startNodeId, startPort, endNodeId, endPort) {
            const connectionId = `${startNodeId}.${startPort}->${endNodeId}.${endPort}`;
            
            const connection = {
                id: connectionId,
                from: { nodeId: startNodeId, port: startPort },
                to: { nodeId: endNodeId, port: endPort }
            };
            
            this.connections.set(connectionId, connection);
            this.renderConnection(connection);
            
            console.log(`创建连接: ${connectionId}`);
        }

        // 渲染连接线
        renderConnection(connection) {
            const svg = this.canvas.querySelector('#workflow-connections');
            if (!svg) return;

            const fromNode = this.nodes.get(connection.from.nodeId);
            const toNode = this.nodes.get(connection.to.nodeId);
            
            if (!fromNode || !toNode) return;

            // 计算连接点位置
            const fromPos = this.getPortPosition(fromNode, connection.from.port, true);
            const toPos = this.getPortPosition(toNode, connection.to.port, false);

            // 创建SVG路径
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = this.createConnectionPath(fromPos, toPos);
            
            path.setAttribute('d', d);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('data-connection-id', connection.id);
            
            svg.appendChild(path);
        }

        // 获取端口位置
        getPortPosition(node, portName, isOutput) {
            const nodeElement = this.canvas.querySelector(`[data-node-id="${node.id}"]`);
            if (!nodeElement) return { x: 0, y: 0 };

            const portElement = nodeElement.querySelector(`[data-port="${portName}"]`);
            if (!portElement) return { x: 0, y: 0 };

            const nodeRect = nodeElement.getBoundingClientRect();
            const portRect = portElement.getBoundingClientRect();
            const canvasRect = this.canvas.querySelector('#workflow-canvas').getBoundingClientRect();

            return {
                x: (isOutput ? portRect.right : portRect.left) - canvasRect.left,
                y: portRect.top + portRect.height / 2 - canvasRect.top
            };
        }

        // 创建连接路径
        createConnectionPath(from, to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const curve = Math.abs(dx) * 0.5;

            return `M ${from.x} ${from.y} C ${from.x + curve} ${from.y} ${to.x - curve} ${to.y} ${to.x} ${to.y}`;
        }

        // 更新所有连接线
        updateConnections() {
            const svg = this.canvas.querySelector('#workflow-connections');
            if (!svg) return;

            this.connections.forEach(connection => {
                const pathElement = svg.querySelector(`[data-connection-id="${connection.id}"]`);
                if (pathElement) {
                    const fromNode = this.nodes.get(connection.from.nodeId);
                    const toNode = this.nodes.get(connection.to.nodeId);
                    
                    if (fromNode && toNode) {
                        const fromPos = this.getPortPosition(fromNode, connection.from.port, true);
                        const toPos = this.getPortPosition(toNode, connection.to.port, false);
                        const d = this.createConnectionPath(fromPos, toPos);
                        pathElement.setAttribute('d', d);
                    }
                }
            });
        }

        // 保存工作流
        saveWorkflow() {
            const workflow = {
                id: this.workflowConfig?.id || `workflow_${Date.now()}`,
                name: this.workflowConfig?.name || '新工作流',
                description: this.workflowConfig?.description || '',
                nodes: Array.from(this.nodes.values()),
                connections: Array.from(this.connections.values()),
                version: '1.0.0',
                createdAt: new Date(),
                lastModified: new Date()
            };

            // 发送保存请求到扩展
            if (window.sendMessageToExtension) {
                window.sendMessageToExtension({
                    type: 'save-workflow',
                    command: 'save-workflow',
                    data: { workflow },
                    timestamp: Date.now()
                });
            }

            this.addLog('info', '工作流已保存');
        }

        // 运行工作流
        runWorkflow() {
            if (this.executionState.isRunning) {
                this.addLog('warning', '工作流正在运行中');
                return;
            }

            // 验证工作流
            const validation = this.validateWorkflow();
            if (!validation.isValid) {
                this.addLog('error', `工作流验证失败: ${validation.errors.join(', ')}`);
                return;
            }

            this.executionState.isRunning = true;
            this.executionState.progress = 0;
            this.executionState.logs = [];

            // 更新UI
            this.updateExecutionUI();

            // 发送执行请求到扩展
            if (window.sendMessageToExtension) {
                window.sendMessageToExtension({
                    type: 'run-workflow',
                    command: 'run-workflow',
                    data: {
                        workflowConfig: {
                            nodes: Array.from(this.nodes.values()),
                            connections: Array.from(this.connections.values())
                        }
                    },
                    timestamp: Date.now()
                });
            }

            this.addLog('info', '开始执行工作流');
        }

        // 停止工作流
        stopWorkflow() {
            this.executionState.isRunning = false;
            this.executionState.currentNode = null;
            
            // 更新UI
            this.updateExecutionUI();
            
            this.addLog('warning', '工作流执行已停止');
        }

        // 验证工作流
        validateWorkflow() {
            const errors = [];
            const warnings = [];

            // 检查是否有节点
            if (this.nodes.size === 0) {
                errors.push('工作流中没有节点');
            }

            // 检查节点连接
            this.nodes.forEach(node => {
                // 检查必需的输入
                node.inputs.forEach(input => {
                    const hasConnection = Array.from(this.connections.values()).some(
                        conn => conn.to.nodeId === node.id && conn.to.port === input
                    );
                    
                    if (!hasConnection && node.type !== 'novel-parser') {
                        warnings.push(`节点 ${node.name} 的输入 ${input} 未连接`);
                    }
                });
            });

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        }

        // 更新执行UI
        updateExecutionUI() {
            const runBtn = this.canvas.querySelector('[data-action="run-workflow"]');
            const stopBtn = this.canvas.querySelector('[data-action="stop-workflow"]');

            if (runBtn && stopBtn) {
                runBtn.disabled = this.executionState.isRunning;
                stopBtn.disabled = !this.executionState.isRunning;
            }

            // 更新节点状态
            this.nodes.forEach(node => {
                const nodeElement = this.canvas.querySelector(`[data-node-id="${node.id}"] .node-status`);
                if (nodeElement) {
                    nodeElement.className = `node-status node-status-${node.status}`;
                }
            });
        }

        // 添加日志
        addLog(level, message) {
            const log = {
                timestamp: new Date(),
                level,
                message
            };

            this.executionState.logs.push(log);
            this.renderLogs();
        }

        // 渲染日志
        renderLogs() {
            const logsContent = this.canvas.querySelector('#logs-content');
            if (!logsContent) return;

            const logsHTML = this.executionState.logs.map(log => `
                <div class="log-entry log-${log.level}">
                    <span class="log-timestamp">${log.timestamp.toLocaleTimeString()}</span>
                    <span class="log-level">[${log.level.toUpperCase()}]</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');

            logsContent.innerHTML = logsHTML;
            logsContent.scrollTop = logsContent.scrollHeight;
        }

        // 清空日志
        clearLogs() {
            this.executionState.logs = [];
            this.renderLogs();
        }

        // 复制节点
        duplicateNode(nodeId) {
            const originalNode = this.nodes.get(nodeId);
            if (!originalNode) return;

            const newPosition = {
                x: originalNode.position.x + 50,
                y: originalNode.position.y + 50
            };

            this.addNode(originalNode.type, newPosition);
        }

        // 删除节点
        deleteNode(nodeId) {
            // 删除相关连接
            const connectionsToDelete = [];
            this.connections.forEach((connection, id) => {
                if (connection.from.nodeId === nodeId || connection.to.nodeId === nodeId) {
                    connectionsToDelete.push(id);
                }
            });

            connectionsToDelete.forEach(id => {
                this.connections.delete(id);
                const pathElement = this.canvas.querySelector(`[data-connection-id="${id}"]`);
                if (pathElement) {
                    pathElement.remove();
                }
            });

            // 删除节点
            this.nodes.delete(nodeId);
            const nodeElement = this.canvas.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeElement) {
                nodeElement.remove();
            }

            // 清空属性面板
            if (this.selectedNode === nodeId) {
                this.selectedNode = null;
                const propertiesContent = this.canvas.querySelector('#properties-content');
                if (propertiesContent) {
                    propertiesContent.innerHTML = '<div class="properties-placeholder">选择一个节点查看属性</div>';
                }
            }
        }

        // 处理画布点击
        handleCanvasClick(event) {
            if (event.target.closest('.workflow-node')) return;
            
            // 取消选择
            this.canvas.querySelectorAll('.workflow-node.selected').forEach(el => {
                el.classList.remove('selected');
            });
            this.selectedNode = null;
            
            const propertiesContent = this.canvas.querySelector('#properties-content');
            if (propertiesContent) {
                propertiesContent.innerHTML = '<div class="properties-placeholder">选择一个节点查看属性</div>';
            }
        }

        // 处理鼠标按下
        handleMouseDown(event) {
            // 实现连接逻辑
        }

        // 处理鼠标移动
        handleMouseMove(event) {
            // 实现连接预览
        }

        // 处理鼠标释放
        handleMouseUp(event) {
            // 完成连接
            this.isConnecting = false;
            this.connectionStart = null;
        }

        // 处理右键菜单
        handleContextMenu(event) {
            event.preventDefault();
            // 显示上下文菜单
        }

        // 处理键盘事件
        handleKeyDown(event) {
            if (event.key === 'Delete' && this.selectedNode) {
                this.deleteNode(this.selectedNode);
            }
        }

        // 处理工作流状态更新
        handleWorkflowStatus(data) {
            if (data.status === 'running') {
                this.executionState.progress = data.progress || 0;
                if (data.currentNode) {
                    this.executionState.currentNode = data.currentNode;
                    // 更新节点状态
                    const node = this.nodes.get(data.currentNode);
                    if (node) {
                        node.status = 'running';
                    }
                }
            } else if (data.status === 'completed') {
                this.executionState.isRunning = false;
                this.executionState.progress = 100;
                this.addLog('success', '工作流执行完成');
            } else if (data.status === 'error') {
                this.executionState.isRunning = false;
                this.addLog('error', data.message || '工作流执行失败');
            }
            
            this.updateExecutionUI();
        }

        // 加载工作流
        loadWorkflow(workflowData) {
            // 清空当前工作流
            this.nodes.clear();
            this.connections.clear();
            
            const nodesContainer = this.canvas.querySelector('#workflow-nodes');
            const connectionsContainer = this.canvas.querySelector('#workflow-connections');
            
            if (nodesContainer) nodesContainer.innerHTML = '';
            if (connectionsContainer) connectionsContainer.innerHTML = '';

            // 加载节点
            if (workflowData.nodes) {
                workflowData.nodes.forEach(nodeData => {
                    this.nodes.set(nodeData.id, nodeData);
                    this.renderNode(nodeData);
                });
            }

            // 加载连接
            if (workflowData.connections) {
                workflowData.connections.forEach(connectionData => {
                    this.connections.set(connectionData.id, connectionData);
                    this.renderConnection(connectionData);
                });
            }

            this.workflowConfig = workflowData;
            console.log('工作流已加载:', workflowData.name);
        }
    }

    // 创建全局实例
    window.workflowEditor = new WorkflowEditor();

})();