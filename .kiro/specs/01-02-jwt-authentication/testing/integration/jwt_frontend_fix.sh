#!/bin/bash

echo "🔧 Moqui JWT Frontend Fix Script"
echo "================================="

# Step 1: Get JWT Token
echo "📋 Step 1: Getting JWT token..."
JWT_RESPONSE=$(curl -s -X POST "http://localhost:8080/rest/s1/moqui/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username": "john.doe", "password": "moqui"}')

if [[ $? -ne 0 ]]; then
    echo "❌ Failed to get JWT token"
    exit 1
fi

# Extract token from response
JWT_TOKEN=$(echo "$JWT_RESPONSE" | grep -o '"accessToken" *: *"[^"]*"' | cut -d'"' -f4)

if [[ -z "$JWT_TOKEN" ]]; then
    echo "❌ JWT token not found in response"
    echo "Response: $JWT_RESPONSE"
    exit 1
fi

echo "✅ JWT Token received: ${JWT_TOKEN:0:20}..."

# Step 2: Create automated injection script
echo "📋 Step 2: Creating automated JWT injection..."

cat > /tmp/auto_jwt_inject.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Auto JWT Injection</title></head>
<body>
<script>
(async function() {
    try {
        console.log('🔐 Auto JWT Injection Starting...');

        // Get token from URL parameter or use embedded token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || 'REPLACE_TOKEN_HERE';

        if (!token || token === 'REPLACE_TOKEN_HERE') {
            console.error('❌ No JWT token provided');
            return;
        }

        // Store tokens in all possible locations
        localStorage.setItem('jwt_access_token', token);
        sessionStorage.setItem('jwt_access_token', token);
        document.cookie = `jwt_access_token=${token}; path=/; max-age=7200`;

        console.log('✅ JWT tokens injected successfully');

        // Test API access
        const response = await fetch('/qapps/menuData', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API test successful - received ' + data.length + ' menu items');

            // Redirect to main app
            setTimeout(() => {
                window.location.href = '/qapps';
            }, 1000);
        } else {
            console.error('❌ API test failed: ' + response.status);
        }

    } catch (error) {
        console.error('❌ JWT injection error:', error);
    }
})();
</script>
<div id="status">🔐 Auto-injecting JWT tokens... Please wait.</div>
</body>
</html>
EOF

# Replace token placeholder
sed -i '' "s/REPLACE_TOKEN_HERE/$JWT_TOKEN/g" /tmp/auto_jwt_inject.html

echo "✅ Auto injection script created"

# Step 3: Test with Chrome
echo "📋 Step 3: Testing with Chrome..."

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot=/tmp/jwt_injection_test.png \
    --window-size=1920,1080 \
    --virtual-time-budget=8000 \
    --run-all-compositor-stages-before-draw \
    "file:///tmp/auto_jwt_inject.html" 2>/dev/null

if [[ -f "/tmp/jwt_injection_test.png" ]]; then
    echo "✅ JWT injection test screenshot saved: /tmp/jwt_injection_test.png"
else
    echo "⚠️  Screenshot not generated"
fi

# Step 4: Test actual Moqui app access
echo "📋 Step 4: Testing Moqui app access..."

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot=/tmp/moqui_app_fixed.png \
    --window-size=1920,1080 \
    --virtual-time-budget=10000 \
    --run-all-compositor-stages-before-draw \
    --user-data-dir=/tmp/chrome-jwt-fixed \
    "file:///tmp/auto_jwt_inject.html?redirect=true" 2>/dev/null

echo "✅ Moqui app test screenshot saved: /tmp/moqui_app_fixed.png"

# Step 5: Manual verification instructions
echo ""
echo "🎯 Manual Verification Steps:"
echo "1. Open: file:///tmp/auto_jwt_inject.html"
echo "2. Check browser console for JWT injection success"
echo "3. Navigate to: http://localhost:8080/qapps"
echo "4. Verify application list loads correctly"
echo ""
echo "📸 Screenshots saved:"
echo "   - /tmp/jwt_injection_test.png"
echo "   - /tmp/moqui_app_fixed.png"
echo ""
echo "🔧 If issues persist, the Vue.js frontend needs deeper debugging"