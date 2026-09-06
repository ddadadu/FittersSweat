#!/usr/bin/env bash
# macOS Chrome Remote Debugging Launcher
# Starts Google Chrome with remote debugging enabled on port 9222

PORT=${1:-9222}
USER_DATA_DIR=${2:-"/tmp/chrome_dev_profile"}

echo "🚀 Starting Google Chrome with remote debugging on port $PORT..."
echo "📁 Profile directory: $USER_DATA_DIR"

if [ -d "/Applications/Google Chrome.app" ]; then
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --remote-debugging-port="$PORT" \
        --user-data-dir="$USER_DATA_DIR" \
        --no-first-run \
        --no-default-browser-check &
    echo "✅ Chrome launched. PID: $!"
else
    echo "❌ Google Chrome not found at /Applications/Google Chrome.app"
    exit 1
fi
