#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/opt/pitturu"
BLUE_PORT=3001; GREEN_PORT=3002
BLUE_NAME="pitturu-blue"; GREEN_NAME="pitturu-green"
COMPOSE_BLUE="$STACK_DIR/docker-compose.blue.yml"
COMPOSE_GREEN="$STACK_DIR/docker-compose.green.yml"
UPSTREAM_DIR="/etc/nginx/upstreams"
APP_UPSTREAM_LINK="/etc/nginx/conf.d/app-upstream.conf"
BACKEND_UPSTREAM_LINK="/etc/nginx/conf.d/backend-upstream.conf"
HEALTH_PATH="/api/health"   # ← 프론트에 구현된 경로

health_http(){ curl -fsS "http://127.0.0.1:$1$HEALTH_PATH" >/dev/null 2>&1; }
port_used(){ ss -ltn '( sport = :'$1' )' | grep -q LISTEN ; }

current_color(){
  if [ -L "$APP_UPSTREAM_LINK" ]; then
    readlink -f "$APP_UPSTREAM_LINK" | grep -q "app-blue.conf" && { echo blue; return; }
    readlink -f "$APP_UPSTREAM_LINK" | grep -q "app-green.conf" && { echo green; return; }
  fi
  health_http $BLUE_PORT && { echo blue; return; }
  health_http $GREEN_PORT && { echo green; return; }
  port_used $BLUE_PORT && { echo blue; return; }
  port_used $GREEN_PORT && { echo green; return; }
  echo none
}

switch_and_reload(){
  local app_conf="$1"
  local backend_conf="$2"
  echo "🔄 업스트림 전환: $app_conf + $backend_conf"
  ln -sfn "$UPSTREAM_DIR/$app_conf" "$APP_UPSTREAM_LINK"
  ln -sfn "$UPSTREAM_DIR/$backend_conf" "$BACKEND_UPSTREAM_LINK"
  nginx -t
  nginx -s reload
}

echo "🔄 Blue/Green 배포 시작..."

CUR=$(current_color)
if [ "$CUR" = "blue" ]; then
  NEXT="green"; TARGET_PORT=$GREEN_PORT; TARGET_COMPOSE=$COMPOSE_GREEN
  APP_CONF="app-green.conf"; BACKEND_CONF="nginx-backend-green.conf"; PROJECT="$GREEN_NAME"
elif [ "$CUR" = "green" ]; then
  NEXT="blue"; TARGET_PORT=$BLUE_PORT; TARGET_COMPOSE=$COMPOSE_BLUE
  APP_CONF="app-blue.conf"; BACKEND_CONF="nginx-backend-blue.conf"; PROJECT="$BLUE_NAME"
elif [ "$CUR" = "none" ]; then
  if port_used $BLUE_PORT || health_http $BLUE_PORT; then
    NEXT="green"; TARGET_PORT=$GREEN_PORT; TARGET_COMPOSE=$COMPOSE_GREEN
    APP_CONF="app-green.conf"; BACKEND_CONF="nginx-backend-green.conf"; PROJECT="$GREEN_NAME"
  else
    NEXT="blue"; TARGET_PORT=$BLUE_PORT; TARGET_COMPOSE=$COMPOSE_BLUE
    APP_CONF="app-blue.conf"; BACKEND_CONF="nginx-backend-blue.conf"; PROJECT="$BLUE_NAME"
  fi
fi

echo "🔁 현재색:$CUR → 다음색:$NEXT (PORT $TARGET_PORT, PROJECT $PROJECT)"

echo "📥 이미지 Pull"
docker compose -f "$TARGET_COMPOSE" -p "$PROJECT" pull

echo "🚀 $NEXT 스택 시작"
docker compose -f "$TARGET_COMPOSE" -p "$PROJECT" up -d

echo "⏳ 헬스체크 대기: http://127.0.0.1:$TARGET_PORT$HEALTH_PATH"
for i in {1..90}; do
  if health_http $TARGET_PORT; then
    echo "✅ Healthy - 응답 확인됨"
    break
  fi
  echo "대기중... ($i/90)"
  sleep 2
  if [ $i -eq 90 ]; then
    echo "❌ 헬스체크 타임아웃 - 로그 확인"
    docker compose -f "$TARGET_COMPOSE" -p "$PROJECT" logs --tail=50
    exit 1
  fi
done

echo "🔁 이중 업스트림 전환: Frontend + Backend"
switch_and_reload "$APP_CONF" "$BACKEND_CONF"
echo "✅ 무중단 전환 완료"

if [ "$CUR" != "none" ]; then
  echo "⏳ 안전 지연 (5초)"
  sleep 5

  OLD_PROJECT=$([ "$CUR" = "blue" ] && echo "$BLUE_NAME" || echo "$GREEN_NAME")
  OLD_COMPOSE=$([ "$CUR" = "blue" ] && echo "$COMPOSE_BLUE" || echo "$COMPOSE_GREEN")
  echo "🧹 이전색($CUR) 정리"
  docker compose -f "$OLD_COMPOSE" -p "$OLD_PROJECT" down --remove-orphans
fi

echo "📊 최종 컨테이너 상태"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'

echo "🎯 배포 검증"
echo "Frontend: http://127.0.0.1:$TARGET_PORT$HEALTH_PATH"
curl -s "http://127.0.0.1:$TARGET_PORT$HEALTH_PATH" | head -n 3

echo "✅ Blue/Green 배포 완료: $CUR → $NEXT"
echo "🌐 서비스 URL: http://152.67.201.101"