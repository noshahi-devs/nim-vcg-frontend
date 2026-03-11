#!/usr/bin/env bash
set -euo pipefail

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SKIP_SYNC="${SKIP_SYNC:-0}"
FRONTEND_REPO="${FRONTEND_REPO:-/var/www/apps/nim-vcg-frontend}"
FRONTEND_LIVE="${FRONTEND_LIVE:-/var/www/visioncollegegojra/frontend}"
FRONTEND_OWNER="${FRONTEND_OWNER:-www-data:www-data}"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

run_sudo() {
  if sudo -n true 2>/dev/null; then
    sudo "$@"
  elif [ -n "${SUDO_PASSWORD:-}" ]; then
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

sync_branch() {
  cd "$FRONTEND_REPO"
  git fetch origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
  git reset --hard "origin/$DEPLOY_BRANCH"
  git clean -fd
}

log "Deploying frontend"
run_sudo chown -R "$(id -un):$(id -gn)" "$FRONTEND_REPO"

if [ "$SKIP_SYNC" != "1" ]; then
  sync_branch
fi

cd "$FRONTEND_REPO"
rm -rf node_modules dist
npm ci
npm run build

BUILD_DIR="dist/wowdash/browser"
if [ ! -d "$BUILD_DIR" ]; then
  BUILD_DIR="dist/wowdash"
fi

run_sudo mkdir -p "$FRONTEND_LIVE"
run_sudo rsync -a --delete "$BUILD_DIR"/ "$FRONTEND_LIVE"/
run_sudo chown -R "$FRONTEND_OWNER" "$FRONTEND_LIVE"

curl -fsSI https://visioncollegegojra.com >/dev/null
log "Frontend deploy complete"
