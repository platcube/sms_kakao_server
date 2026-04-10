#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/home/platcube/dev1/platcube/message_pr}"
APP_NAME="${APP_NAME:-sms_kakao_server}"
APP_DIR="${APP_DIR:-$DEPLOY_ROOT/$APP_NAME}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEPLOY_ROOT/docker-compose.yml}"
SERVICE_NAME="${SERVICE_NAME:-sms_kakao_server}"
BUILD_NO_CACHE="${BUILD_NO_CACHE:-1}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_file() {
  local path="$1"

  if [[ ! -e "$path" ]]; then
    echo "Required path not found: $path" >&2
    exit 1
  fi
}

require_command() {
  local name="$1"

  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

require_command git
require_command docker

require_file "$APP_DIR"
require_file "$COMPOSE_FILE"

log "Deployment root: $DEPLOY_ROOT"
log "Application dir: $APP_DIR"
log "Compose file: $COMPOSE_FILE"
log "Compose service: $SERVICE_NAME"

log "Updating repository"
cd "$APP_DIR"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
git pull --ff-only origin "$current_branch"

log "Validating compose configuration"
docker compose -f "$COMPOSE_FILE" config >/dev/null

if [[ "$BUILD_NO_CACHE" == "1" ]]; then
  log "Building image without cache"
  docker compose -f "$COMPOSE_FILE" build --no-cache "$SERVICE_NAME"
else
  log "Building image"
  docker compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"
fi

log "Running Prisma migration"
docker compose --env-file "$APP_DIR/.env" -f "$COMPOSE_FILE" run --rm "$SERVICE_NAME" npm run prisma:deploy

log "Starting service"
docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"

log "Current container status"
docker compose -f "$COMPOSE_FILE" ps

log "Recent application logs"
docker compose -f "$COMPOSE_FILE" logs --tail=100 "$SERVICE_NAME"


echo "🎉 모든 작업 완료"
# --- 여기부터 SSH 세션 유지 옵션 ---
# SSH 접속으로 이 스크립트를 실행했을 때 자동 종료되는 게 싫다면,
# 아래 줄이 SSH 세션을 로그인 셸로 전환해 줍니다.
if [[ -n "${SSH_TTY:-}" || -n "${SSH_CONNECTION:-}" ]]; then
  exec bash -l
fi
