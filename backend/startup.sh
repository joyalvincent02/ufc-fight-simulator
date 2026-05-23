#!/bin/bash
# MMA Math Backend - Azure App Service startup script
#
# Installs the Playwright Chromium browser binary if it is not already present,
# then starts the Gunicorn/Uvicorn server.
#
# Azure App Service restarts the container periodically; /tmp is wiped on each
# cold start, so we keep browsers in /tmp/playwright-browsers and reinstall
# them when missing (typically takes 30-60 s on first cold start).
set -e

PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/tmp/playwright-browsers}"
export PLAYWRIGHT_BROWSERS_PATH

CHROMIUM_MARKER="$PLAYWRIGHT_BROWSERS_PATH/.installed"

if [ ! -f "$CHROMIUM_MARKER" ]; then
    echo "[startup] Installing Playwright system dependencies..."
    playwright install-deps chromium
    echo "[startup] Installing Playwright Chromium (browsers path: $PLAYWRIGHT_BROWSERS_PATH)..."
    playwright install chromium
    touch "$CHROMIUM_MARKER"
    echo "[startup] Chromium installed successfully."
else
    echo "[startup] Playwright Chromium already installed, skipping."
fi

echo "[startup] Starting Gunicorn..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
