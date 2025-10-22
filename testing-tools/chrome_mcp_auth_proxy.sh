#!/bin/bash
# Legacy wrapper for JWT Chrome MCP script (session-only mode deprecated)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/jwt_chrome_mcp.sh" "$@"
