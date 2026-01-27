#!/bin/bash

# 配置 GLM-4 API Key 到数据库
# 用法: ./configure-api-key.sh

set -e

API_KEY="7b547bec7286432186eb77a477e10c33.XtHQWZS5PoGKAkg0"

echo "========================================="
echo "配置 GLM-4 API Key"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "API Key: ${API_KEY:0:20}..."
echo ""

# 使用 H2 控制台或直接通过 SQL 配置
echo "方法 1: 通过 H2 控制台配置"
echo "================================"
echo "1. 访问 H2 控制台: http://localhost:8080/h2"
echo "2. 连接信息:"
echo "   JDBC URL: jdbc:h2:./runtime/db/h2/moqui"
echo "   User: sa"
echo "   Password: (留空)"
echo ""
echo "3. 执行以下 SQL:"
echo ""
echo "-- 删除旧配置(如果存在)"
echo "DELETE FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key';"
echo ""
echo "-- 插入新配置"
echo "INSERT INTO MCP_SYSTEM_CONFIG ("
echo "    CONFIG_ID,"
echo "    CONFIG_KEY,"
echo "    CONFIG_VALUE,"
echo "    CONFIG_TYPE,"
echo "    CATEGORY,"
echo "    DESCRIPTION,"
echo "    IS_USER_CONFIGURABLE"
echo ") VALUES ("
echo "    'AI_API_KEY',"
echo "    'ai.api.key',"
echo "    '${API_KEY}',"
echo "    'STRING',"
echo "    'AI',"
echo "    'GLM-4 API Key',"
echo "    'Y'"
echo ");"
echo ""
echo "================================"
echo ""

echo "方法 2: 通过 SQL 文件配置"
echo "================================"

# 创建 SQL 文件
SQL_FILE="/tmp/configure-api-key.sql"
cat > "$SQL_FILE" << EOF
-- 删除旧配置(如果存在)
DELETE FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key';

-- 插入新配置
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_ID,
    CONFIG_KEY,
    CONFIG_VALUE,
    CONFIG_TYPE,
    CATEGORY,
    DESCRIPTION,
    IS_USER_CONFIGURABLE
) VALUES (
    'AI_API_KEY',
    'ai.api.key',
    '${API_KEY}',
    'STRING',
    'AI',
    'GLM-4 API Key',
    'Y'
);
EOF

echo "SQL 文件已创建: $SQL_FILE"
echo ""
echo "执行 SQL:"
echo "  java -cp runtime/lib/h2-*.jar org.h2.tools.RunScript \\"
echo "    -url jdbc:h2:./runtime/db/h2/moqui \\"
echo "    -user sa \\"
echo "    -script $SQL_FILE"
echo ""
echo "================================"
echo ""

echo -e "${YELLOW}请选择一个方法来配置 API Key${NC}"
echo ""
echo "配置完成后，请重启 Moqui 服务:"
echo "  ./stop-applications.sh"
echo "  ./start-applications.sh"
echo ""
echo "然后运行测试:"
echo "  cd .kiro/specs/09-01-novel-to-anime-completion/scripts"
echo "  ./check-api-key.sh"
echo ""
