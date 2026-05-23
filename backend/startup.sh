#!/bin/bash
# MMA Math Backend - Azure App Service startup script
#
# On each startup, installs Playwright system dependencies (apt packages that
# go to /usr/lib — needed every time since they can be absent after a new
# deployment). The Chromium binary itself is cached in /tmp/playwright-browsers
# and only reinstalled when that directory is wiped on a cold start.
set -e

PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/tmp/playwright-browsers}"
export PLAYWRIGHT_BROWSERS_PATH

# Always install system-level shared libraries (libglib-2.0, libnss, etc.).
# apt-get is a no-op when packages are already present, so this is fast on
# warm restarts but ensures deps are present after a fresh container image.
echo "[startup] Installing Playwright system dependencies..."
playwright install-deps chromium
echo "[startup] Playwright system dependencies ready."

CHROMIUM_MARKER="$PLAYWRIGHT_BROWSERS_PATH/.installed"

if [ ! -f "$CHROMIUM_MARKER" ]; then
    echo "[startup] Installing Playwright Chromium (browsers path: $PLAYWRIGHT_BROWSERS_PATH)..."
    playwright install chromium
    touch "$CHROMIUM_MARKER"
    echo "[startup] Chromium installed successfully."
else
    echo "[startup] Playwright Chromium already installed, skipping."
fi

echo "[startup] Starting Gunicorn..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
