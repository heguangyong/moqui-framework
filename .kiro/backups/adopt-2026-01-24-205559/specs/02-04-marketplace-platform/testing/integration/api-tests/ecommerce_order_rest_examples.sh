#!/usr/bin/env bash

# Simple helper script to exercise the ecommerce order REST endpoints.
# Usage:
#   BASE_URL=http://localhost:8080 TOKEN=YOUR_JWT ./testing-tools/ecommerce_order_rest_examples.sh

set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:8080"}
TOKEN=${TOKEN:-"REPLACE_WITH_JWT"}

auth_header() {
  if [[ "${TOKEN}" == "REPLACE_WITH_JWT" ]]; then
    echo "⚠️  请先通过 export TOKEN=... 设置有效的 JWT，再运行本脚本。" >&2
    exit 1
  fi
  printf "Authorization: Bearer %s" "${TOKEN}"
}

echo "== 创建订单（customer=EC_CUST_001, items=ECP1001:1,ECP1004:2） =="
curl -sS -X POST "${BASE_URL}/rest/s1/marketplace/ecommerce/orders" \
  -H "Content-Type: application/json" \
  -H "$(auth_header)" \
  -d '{
        "ecommerceCustomerId": "EC_CUST_001",
        "shippingAddress": "东莞市松山湖创新街18号",
        "orderItems": [
          {"ecommerceProductId": "ECP1001", "quantity": 1},
          {"ecommerceProductId": "ECP1004", "quantity": 2}
        ]
      }' | jq .

echo ""
echo "== 查询最近订单列表（limit=5） =="
curl -sS "${BASE_URL}/rest/s1/marketplace/ecommerce/orders?limit=5" \
  -H "$(auth_header)" | jq .

echo ""
echo "== 根据订单号查询状态（请将 ORDER_ID 替换为上一步返回的 ID） =="
ORDER_ID=${ORDER_ID:-"EC_ORDER_001"}
curl -sS "${BASE_URL}/rest/s1/marketplace/ecommerce/orders/${ORDER_ID}" \
  -H "$(auth_header)" | jq .
