#!/bin/bash

# 启动前后台应用脚本
# 用于同时启动Moqui后端和Novel Anime Desktop前端

set -e  # 遇到错误时退出

echo "🚀 启动前后台应用系统..."
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Java环境
check_java() {
    log_info "检查Java环境..."
    if ! command -v java &> /dev/null; then
        log_error "Java未安装或未在PATH中"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    log_success "Java版本: $JAVA_VERSION"
}

# 检查Node.js环境
check_node() {
    log_info "检查Node.js环境..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装或未在PATH中"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装或未在PATH中"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log_success "Node.js版本: $NODE_VERSION"
    log_success "npm版本: $NPM_VERSION"
}

# 启动Moqui后端
start_backend() {
    log_info "启动Moqui后端服务器..."
    
    # 检查是否已经构建
    if [ ! -f "moqui.war" ]; then
        log_warning "moqui.war不存在，开始构建..."
        ./gradlew build
        if [ $? -ne 0 ]; then
            log_error "Moqui构建失败"
            exit 1
        fi
    fi
    
    # 启动Moqui服务器（后台运行）
    log_info "启动Moqui服务器（端口8080）..."
    # 添加JVM参数解决Java模块系统问题
    JVM_ARGS="--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.text=ALL-UNNAMED --add-opens java.desktop/java.awt.font=ALL-UNNAMED"
    nohup java $JVM_ARGS -jar moqui.war > runtime/log/moqui-startup.log 2>&1 &
    MOQUI_PID=$!
    echo $MOQUI_PID > .moqui.pid
    
    log_success "Moqui后端已启动 (PID: $MOQUI_PID)"
    log_info "等待服务器启动完成..."
    
    # 等待服务器启动
    for i in {1..30}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            log_success "Moqui服务器启动完成！"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        log_error "Moqui服务器启动超时"
        exit 1
    fi
}

# 启动前端应用
start_frontend() {
    log_info "启动Novel Anime Desktop前端应用..."
    
    cd frontend/NovelAnimeDesktop
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "前端依赖安装失败"
            exit 1
        fi
    fi
    
    # 启动前端应用
    log_info "启动Electron桌面应用..."
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../../.frontend.pid
    
    log_success "前端应用已启动 (PID: $FRONTEND_PID)"
    
    cd ../..
}

# 显示状态信息
show_status() {
    echo ""
    echo "================================"
    log_success "应用启动完成！"
    echo ""
    echo "📊 服务状态:"
    echo "  🔧 Moqui后端:     http://localhost:8080"
    echo "  🖥️  桌面应用:     已启动Electron窗口"
    echo ""
    echo "📝 日志文件:"
    echo "  📄 Moqui日志:     runtime/log/moqui.log"
    echo "  📄 启动日志:      runtime/log/moqui-startup.log"
    echo ""
    echo "🛑 停止应用:"
    echo "  ./stop-applications.sh"
    echo ""
    echo "⚠️  注意: 请保持此终端窗口打开以查看日志"
}

# 清理函数
cleanup() {
    log_info "正在停止应用..."
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
        log_info "前端应用已停止"
    fi
    
    if [ -f ".moqui.pid" ]; then
        MOQUI_PID=$(cat .moqui.pid)
        kill $MOQUI_PID 2>/dev/null || true
        rm .moqui.pid
        log_info "Moqui后端已停止"
    fi
    
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM

# 主执行流程
main() {
    check_java
    check_node
    
    echo ""
    log_info "开始启动服务..."
    
    start_backend
    sleep 3  # 给后端一些启动时间
    start_frontend
    
    show_status
    
    # 保持脚本运行，显示日志
    log_info "监控应用状态... (按Ctrl+C停止)"
    while true; do
        sleep 5
        
        # 检查Moqui是否还在运行
        if [ -f ".moqui.pid" ]; then
            MOQUI_PID=$(cat .moqui.pid)
            if ! kill -0 $MOQUI_PID 2>/dev/null; then
                log_error "Moqui后端意外停止"
                cleanup
            fi
        fi
        
        # 检查前端是否还在运行
        if [ -f ".frontend.pid" ]; then
            FRONTEND_PID=$(cat .frontend.pid)
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                log_warning "前端应用已关闭"
                # 前端关闭时不自动退出，用户可能只是关闭了窗口
            fi
        fi
    done
}

# 执行主函数
main "$@"