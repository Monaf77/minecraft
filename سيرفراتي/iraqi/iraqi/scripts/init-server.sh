#!/usr/bin/env bash
set -eo pipefail
echo "[init] Running in Codespace ..."
if [ -f server.jar ]; then
  echo "[init] server.jar already present"
else
  echo "[init] server.jar not found (created by dashboard backend)."
fi
echo "[init] Project: iraqi | Software: Spigot | Version: 1.21.8"

# Load .env if present (do not fail if missing)
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env || true
fi

# If server.jar missing, try to download using JAR_URL or jar.url
if [ ! -f server.jar ]; then
  URL=""
  if [ -f jar.url ]; then
    URL="$(cat jar.url | tr -d '
')"
  fi
  if [ -n "$JAR_URL" ]; then
    URL="$JAR_URL"
  fi
  if [ -n "$URL" ]; then
    echo "[init] Downloading server.jar from $URL"
    if command -v curl >/dev/null 2>&1; then
      curl -L "$URL" -o server.jar
    elif command -v wget >/dev/null 2>&1; then
      wget -O server.jar "$URL"
    else
      echo "[init] Neither curl nor wget found to download server.jar"
    fi
  else
    echo "[init] No JAR URL available to download server.jar"
  fi
fi

# Default START to false if unset
START_DEFAULT=false
START_VAL="${START:-${START_DEFAULT}}"
if [ "$START_VAL" = "true" ]; then
  echo "[init] START=true detected, launching server..."
  nohup bash start.sh > server.log 2>&1 &
  echo "[init] Server started in background. Logs: server.log"
else
  echo "[init] START is not true. Skipping auto start."
fi
