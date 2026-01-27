#!/bin/bash
# Wrapper to run the Node-based Vue mounting diagnostics
set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
node "$SCRIPT_DIR/debug_vue_mounting.js"
