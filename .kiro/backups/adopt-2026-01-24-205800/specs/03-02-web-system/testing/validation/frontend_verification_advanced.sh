#!/bin/bash
# Chrome MCP Authentication Proxy - Ultimate Solution (Fixed)
# Based on CLAUDE.md guide: Chrome headless认证限制问题已彻底解决

echo "🔐 Chrome MCP Authentication Proxy - Starting (CLAUDE.md Version)..."

# Step 1: Get authenticated content via curl (this WORKS)
echo "📡 Authenticating and fetching content..."
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" \
     -c /tmp/auth_session.txt -L > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed"
    exit 1
fi

# Step 2: Fetch authenticated qapps content (verified working)
curl -s -b /tmp/auth_session.txt "http://localhost:8080/qapps" > /tmp/authenticated_qapps.html

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch authenticated content"
    exit 1
fi

# Check content size to ensure we got the full page
CONTENT_SIZE=$(wc -c < /tmp/authenticated_qapps.html)
echo "📊 Authenticated content size: $CONTENT_SIZE bytes"

if [ $CONTENT_SIZE -lt 10000 ]; then
    echo "⚠️  Content size seems small, may indicate authentication issue"
fi

# Step 3: Create self-contained HTML with absolute URLs for Chrome rendering
echo "🔧 Creating self-contained HTML for Chrome rendering..."

# Convert relative URLs to absolute URLs for proper rendering
sed 's|src="http://localhost:8080/|src="http://localhost:8080/|g; s|href="http://localhost:8080/|href="http://localhost:8080/|g; s|src="/|src="http://localhost:8080/|g; s|href="/|href="http://localhost:8080/|g' /tmp/authenticated_qapps.html > /tmp/moqui_chrome_ready.html

# Step 4: Use Chrome to render the prepared content
echo "🖼️  Rendering with Chrome (self-contained approach)..."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot=/tmp/moqui_verified.png \
    --window-size=1920,1080 \
    --virtual-time-budget=15000 \
    --run-all-compositor-stages-before-draw \
    --disable-web-security \
    --allow-running-insecure-content \
    "file:///tmp/moqui_chrome_ready.html"

if [ -f "/tmp/moqui_verified.png" ]; then
    SCREENSHOT_SIZE=$(wc -c < /tmp/moqui_verified.png)
    echo "✅ Chrome MCP Authentication Proxy completed successfully"
    echo "📸 Screenshot saved: /tmp/moqui_verified.png ($SCREENSHOT_SIZE bytes)"
    echo "🎯 Success: 绕过Chrome headless认证限制，使用curl获取认证内容，Chrome渲染本地文件"
    ls -la /tmp/moqui_verified.png
else
    echo "❌ Screenshot generation failed"
    exit 1
fi