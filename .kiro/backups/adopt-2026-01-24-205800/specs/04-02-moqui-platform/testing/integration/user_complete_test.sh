#!/bin/bash
# 模拟用户完整操作流程测试 - 重现[object Object]问题

echo "🧪 开始用户完整操作流程测试..."

# 1. 登录
echo "🔐 步骤1：登录系统"
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" \
     -c /tmp/user_test_session.txt -L > /dev/null

JSESSIONID=$(grep JSESSIONID /tmp/user_test_session.txt | cut -f7)
echo "Session ID: $JSESSIONID"

# 2. 访问主页
echo "🏠 步骤2：访问主页"
curl -s -b /tmp/user_test_session.txt "http://localhost:8080/qapps" > /tmp/user_main_page.html

# 3. 模拟点击用户账号菜单
echo "👤 步骤3：获取用户菜单数据"
curl -s -b /tmp/user_test_session.txt "http://localhost:8080/qapps/menuData" > /tmp/user_menu_data.json

# 4. 检查各种可能包含[object Object]的位置
echo "🔍 步骤4：检查可能的[object Object]位置"

echo "4.1 检查主页HTML中的[object Object]："
grep -n "object Object" /tmp/user_main_page.html || echo "主页HTML：未发现"

echo "4.2 检查menuData中的对象："
cat /tmp/user_menu_data.json | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    def check_objects(obj, path=''):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)) and v:
                    print(f'  对象字段: {path}.{k} = {type(v).__name__}')
                    if isinstance(v, dict):
                        check_objects(v, f'{path}.{k}')
                    elif isinstance(v, list):
                        for i, item in enumerate(v):
                            if isinstance(item, dict):
                                check_objects(item, f'{path}.{k}[{i}]')
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                if isinstance(item, dict):
                    check_objects(item, f'{path}[{i}]')
    check_objects(data)
except:
    print('JSON解析失败')
"

echo "🎯 用户完整操作流程测试完成"