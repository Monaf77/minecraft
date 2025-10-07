#!/usr/bin/env bash
set -eo pipefail
echo "[init] Running in Codespace ..."
if [ -f server.jar ]; then
  echo "[init] server.jar already present"
else
  echo "[init] server.jar not found (created by dashboard backend)."
fi
echo "[init] Project: MySrv1218 | Software: Paper | Version: 1.21.8"

# Load .env if present (do not fail if missing)
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env || true
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
