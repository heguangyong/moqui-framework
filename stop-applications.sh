#!/bin/bash

# 停止前后台应用脚本

echo "🛑 停止前后台应用..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 停止前端应用
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    log_info "停止前端应用 (PID: $FRONTEND_PID)..."
    
    # 尝试优雅停止
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    
    # 检查是否还在运行
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_warning "强制停止前端应用..."
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    
    rm .frontend.pid
    log_success "前端应用已停止"
else
    log_info "前端应用未运行"
fi

# 停止Moqui后端
if [ -f ".moqui.pid" ]; then
    MOQUI_PID=$(cat .moqui.pid)
    log_info "停止Moqui后端 (PID: $MOQUI_PID)..."
    
    # 尝试优雅停止
    kill $MOQUI_PID 2>/dev/null
    sleep 5
    
    # 检查是否还在运行
    if kill -0 $MOQUI_PID 2>/dev/null; then
        log_warning "强制停止Moqui后端..."
        kill -9 $MOQUI_PID 2>/dev/null
    fi
    
    rm .moqui.pid
    log_success "Moqui后端已停止"
else
    log_info "Moqui后端未运行"
fi

# 清理其他可能的进程
log_info "清理相关进程..."

# 查找并停止可能的Moqui进程
MOQUI_PROCESSES=$(pgrep -f "moqui.war" || true)
if [ ! -z "$MOQUI_PROCESSES" ]; then
    log_warning "发现其他Moqui进程，正在停止..."
    echo "$MOQUI_PROCESSES" | xargs kill 2>/dev/null || true
fi

# 查找并停止可能的Electron进程
ELECTRON_PROCESSES=$(pgrep -f "novel-anime-desktop" || true)
if [ ! -z "$ELECTRON_PROCESSES" ]; then
    log_warning "发现其他Electron进程，正在停止..."
    echo "$ELECTRON_PROCESSES" | xargs kill 2>/dev/null || true
fi

log_success "所有应用已停止"

# 显示端口占用情况
echo ""
log_info "检查端口占用情况:"
echo "端口8080 (Moqui):"
lsof -i :8080 || echo "  无进程占用"
echo ""