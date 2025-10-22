# JWT认证统一规范 - Claude Code & Codex 协作标准

> 📋 本文档建立 Claude Code 与 Codex 在 JWT 认证实施上的统一标准，确保团队协作的一致性和可靠性。

## 🎯 统一目标

**主要目标**: 将 Moqui 系统从 Cookie Session 模式平滑迁移到 JWT 认证模式，确保 Chrome MCP 验证和开发工作流程无缝衔接。

**关键原则**:
- **向后兼容**: 迁移过程中保持现有功能正常运行
- **逐步过渡**: 采用混合模式，渐进式替换认证机制
- **验证优先**: 每个阶段都有对应的 Chrome MCP 验证方案
- **统一标准**: Claude Code 审查和 Codex 实施使用相同的技术规范

## 🏗️ JWT认证架构现状

### 系统当前状态
- **认证模式**: `confAuthMode="hybrid"` (支持 Session + JWT)
- **前端支持**: ✅ WebrootVue.qvt.js 包含完整 JWT 处理函数
- **后端支持**: ✅ JwtAuthManager 类提供认证管理
- **迁移计划**: ⚠️ 系统计划彻底移除 cookie session 模式

### JWT实现组件
- **核心函数**: `moqui.getJwtToken()`, `moqui.setJwtToken()`, `moqui.getAuthHeaders()`
- **存储机制**: localStorage (持久) / sessionStorage (会话)
- **同步机制**: BroadcastChannel 跨标签页同步
- **请求注入**: 自动在 AJAX 请求中添加 `Authorization: Bearer {token}` 头

## 📏 统一技术规范

### 1. JWT Token 获取规范

**标准流程** (Claude Code 审查 + Codex 实施):
```bash
# A. REST API登录 (推荐方式)
JWT_RESPONSE=$(curl -s -X POST "http://localhost:8080/rest/s1/moqui/auth/login/login" \
                    -H "Content-Type: application/json" \
                    -d '{"username":"john.doe","password":"moqui"}')
JWT_TOKEN=$(echo $JWT_RESPONSE | jq -r '.accessToken')

# B. 混合模式fallback (兼容现有系统)
if [ -z "$JWT_TOKEN" ]; then
    # 使用传统session获取，然后检查响应头中的JWT
    curl -s -X POST "http://localhost:8080/Login/login" \
         -d "username=john.doe&password=moqui" \
         -c /tmp/session.txt -D /tmp/headers.txt
    JWT_TOKEN=$(grep -i "x-access-token" /tmp/headers.txt | cut -d: -f2 | tr -d ' \r\n')
fi
```

### 2. Chrome MCP JWT认证规范

**统一认证脚本模式** (必须遵循):
```bash
#!/bin/bash
# JWT Chrome MCP认证代理 - 统一标准版本
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/moqui_jwt_verified.png"

echo "🔐 JWT Chrome MCP认证代理启动"

# 步骤1: 尝试获取JWT token
echo "📋 步骤1: 获取JWT认证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo $JWT_RESPONSE | jq -r '.accessToken' 2>/dev/null || echo "")

# 步骤2: Fallback到混合认证模式
if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
    echo "⚠️  JWT API不可用，切换到混合认证模式"
    curl -s -X POST "$MOQUI_URL/Login/login" \
         -d "username=$USERNAME&password=$PASSWORD" \
         -c /tmp/session.txt -D /tmp/headers.txt -L > /dev/null

    JWT_TOKEN=$(grep -i "x-access-token" /tmp/headers.txt | cut -d: -f2 | tr -d ' \r\n' 2>/dev/null || echo "")
    JSESSIONID=$(grep JSESSIONID /tmp/session.txt | cut -f7 2>/dev/null || echo "")
else
    echo "✅ 获得JWT Token: ${JWT_TOKEN:0:20}..."
fi

# 步骤3: 选择认证方式访问Chrome
echo "📋 步骤3: Chrome MCP访问"
if [ -n "$JWT_TOKEN" ]; then
    echo "🔐 使用JWT认证访问"
    cat > /tmp/moqui_jwt_loader.html <<'EOF'
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Moqui JWT Loader</title></head>
<body><script>
localStorage.setItem('jwt_token', '$JWT_TOKEN');
localStorage.setItem('jwt_refresh_token', '$REFRESH_TOKEN');
localStorage.setItem('jwt_access_token', '$JWT_TOKEN');
localStorage.setItem('jwt_refresh_token', '$REFRESH_TOKEN');
sessionStorage.setItem('jwt_token', '$JWT_TOKEN');
sessionStorage.setItem('jwt_refresh_token', '$REFRESH_TOKEN');
document.cookie = 'jwt_token=$JWT_TOKEN; path=/; SameSite=Strict';
setTimeout(function(){ window.location.replace('$MOQUI_URL/qapps'); }, 10);
</script></body></html>
EOF
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --headless --disable-gpu \
        --screenshot="$SCREENSHOT_PATH" \
        --window-size=1920,1080 \
        --virtual-time-budget=8000 \
        --allow-insecure-localhost \
        "file:///tmp/moqui_jwt_loader.html" 2>/dev/null
else
    echo "❌ 认证失败：未获取到 JWT Token"
    exit 1
fi

# 步骤4: 验证结果
if [ -f "$SCREENSHOT_PATH" ]; then
    SCREENSHOT_SIZE=$(wc -c < "$SCREENSHOT_PATH")
    echo "✅ Chrome MCP截图完成: ${SCREENSHOT_SIZE}字节"
    echo "📸 截图路径: $SCREENSHOT_PATH"

    # 检查认证方式
    if [ -n "$JWT_TOKEN" ]; then
        echo "🔐 认证方式: JWT (Bearer Token)"
    else
        echo "🍪 认证方式: Session Cookie"
    fi
else
    echo "❌ Chrome MCP截图失败"
    exit 1
fi

echo "🎉 JWT Chrome MCP认证代理成功完成"
```

### 3. 验证清单统一标准

**JWT认证验证项** (Claude Code 审查标准):
- [ ] **JWT API可用性**: `curl -X POST /rest/s1/moqui/auth/login/login` 返回有效 accessToken
- [ ] **混合模式兼容**: Session认证 fallback 机制工作正常
- [ ] **Chrome MCP兼容**: JWT和Session两种模式都能生成有效截图
- [ ] **Token持久化**: localStorage 正确存储和读取 JWT token
- [ ] **跨标签同步**: BroadcastChannel 机制正常工作
- [ ] **请求注入**: AJAX 请求自动添加 Authorization 头

## 🔄 迁移阶段规范

### 阶段0: 基线确认（当前阶段）
**Codex任务**:
1. 实施统一JWT Chrome MCP脚本 (`testing-tools/jwt_chrome_mcp.sh`)
2. 生成JWT认证基线截图 (`/tmp/baseline_jwt_homepage.png`)

**Claude Code任务**:
1. 审查JWT脚本是否符合统一规范
2. 验证JWT和Session两种认证模式的截图质量
3. 确认基线满足后续阶段要求

### 阶段1: JWT优先模式
**目标**: 优先使用JWT，Session作为fallback
**验证**: Chrome MCP脚本成功率 >95%，JWT使用率 >70%

### 阶段2: 纯JWT模式
**目标**: 完全移除Session依赖，纯JWT认证
**验证**: Chrome MCP脚本100%使用JWT认证

## 🤝 协作执行规范

### Claude Code 职责
- **技术审查**: 确保所有JWT实现符合统一规范
- **质量验证**: 验证JWT Chrome MCP截图质量和认证有效性
- **规范维护**: 发现问题时更新技术规范并通知Codex
- **兼容性检查**: 确保JWT迁移不影响现有功能

### Codex 职责
- **脚本实施**: 按统一规范实现JWT Chrome MCP脚本
- **测试执行**: 在不同认证模式下验证脚本兼容性
- **问题反馈**: 实施过程中发现的技术问题及时反馈Claude Code
- **文档更新**: 实施完成后更新progress-log.md和validation-checklist.md

### 协调者职责
- **方案决策**: 在多个技术方案中选择最适合的统一标准
- **进度推进**: 确保JWT迁移按阶段有序进行
- **冲突解决**: 当Claude Code和Codex在技术方案上有分歧时进行协调

## 📋 统一文件命名规范

**脚本文件**: `testing-tools/jwt_chrome_mcp.sh` (统一JWT Chrome MCP脚本)
**基线截图**: `/tmp/baseline_jwt_homepage.png` (JWT认证基线)
**验证截图**: `/tmp/moqui_jwt_verified.png` (JWT验证截图)
**临时文件**: `/tmp/jwt_session.txt`, `/tmp/jwt_headers.txt`, `/tmp/jwt_response.json`

## ✅ 当前行动项

**立即执行** (2025-10-18):
1. **Codex**: 根据统一规范实施 `testing-tools/jwt_chrome_mcp.sh`
2. **Claude Code**: 审查脚本实现并验证JWT认证质量
3. **协调者**: 确认统一规范被正确理解和执行

**成功标准**:
- JWT Chrome MCP脚本按统一规范成功实施
- 生成高质量的JWT认证基线截图
- Claude Code和Codex在JWT技术方案上达成完全一致

---

> 📌 **重要提醒**: 任何对JWT认证方案的修改都必须同时更新本规范文档，确保Claude Code和Codex始终保持一致的技术标准。
> ⚠️ 如果 `/rest/s1/moqui/auth/login/login` 尚未配置/启用，请在阶段 0 内完成服务端支持，否则无法执行纯 JWT 流程。阶段完成前需确认该 API 可返回 accessToken。

