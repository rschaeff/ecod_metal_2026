#!/bin/bash
# Start TriCyp Next.js app in production mode on sangala.
# Mirrors ~/dev/ecod_frontpage_2026/scripts/start-production.sh.
# Usage: ./scripts/start-production.sh [start|stop|restart|status]
#
# This file is a TEMPLATE — scripts/deploy.sh installs a copy at
# $PROD_DIR/start.sh and rewrites APP_DIR to the prod path. The
# in-tree value below is just a placeholder so the script is
# parseable; it isn't expected to run in dev.

APP_DIR="/home/rschaeff/dev/ecod_metal_2026"
PID_FILE="$APP_DIR/.next-server.pid"
LOG_FILE="$APP_DIR/logs/production.log"
PORT=3003

# Fix libstdc++ on sangala
export LD_LIBRARY_PATH=/usr/lib64${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}
export PATH=/home/rschaeff/.local/node/bin:$PATH
export NODE_ENV=production

# Load .env.production (Next.js may not find it due to workspace root detection)
ENV_FILE="$APP_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line; do
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        export "$line"
    done < "$ENV_FILE"
fi

mkdir -p "$APP_DIR/logs"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Server already running (PID $(cat "$PID_FILE"))"
        return 1
    fi

    echo "Starting TriCyp production server on port $PORT..."
    # After deploy.sh, the standalone bundle is flattened: server.js
    # lives at $APP_DIR/server.js (not $APP_DIR/.next/standalone/server.js).
    cd "$APP_DIR"
    HOSTNAME=0.0.0.0 PORT="$PORT" nohup node server.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2

    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Server started (PID $(cat "$PID_FILE")), port $PORT"
        echo "Logs: $LOG_FILE"
    else
        echo "Failed to start server. Check $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Stopping server (PID $PID)..."
            kill "$PID"
            sleep 2
            if kill -0 "$PID" 2>/dev/null; then
                kill -9 "$PID"
            fi
            echo "Server stopped"
        else
            echo "Server not running (stale PID file)"
        fi
        rm -f "$PID_FILE"
    else
        echo "No PID file found"
        pkill -f "node server.js.*tricyp" 2>/dev/null
    fi
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Server running (PID $(cat "$PID_FILE")) on port $PORT"
    else
        echo "Server not running"
    fi
}

case "${1:-start}" in
    start)   start ;;
    stop)    stop ;;
    restart) stop; sleep 1; start ;;
    status)  status ;;
    *)       echo "Usage: $0 {start|stop|restart|status}" ;;
esac
