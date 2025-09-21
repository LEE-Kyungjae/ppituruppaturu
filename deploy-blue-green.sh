#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/opt/pitturu"
BLUE_PORT=3001
GREEN_PORT=3002
UPSTREAM_DIR="/etc/nginx/upstreams"
UPSTREAM_LINK="/etc/nginx/conf.d/app-upstream.conf"

COMPOSE_BLUE="$STACK_DIR/docker-compose.blue.yml"
COMPOSE_GREEN="$STACK_DIR/docker-compose.green.yml"

health_ok(){ curl -fsS "http://127.0.0.1:$1/health" >/dev/null 2>&1; }
port_used(){ docker ps --filter "publish=$1" -q | grep -q . ; }

current_color() {
  # 1) 링크 기준
  if [ -L "$UPSTREAM_LINK" ]; then
    readlink -f "$UPSTREAM_LINK" | grep -q "app-blue.conf" && { echo blue; return; }
    readlink -f "$UPSTREAM_LINK" | grep -q "app-green.conf" && { echo green; return; }
  fi
  # 2) 헬스 응답 기준
  health_ok $BLUE_PORT && { echo blue; return; }
  health_ok $GREEN_PORT && { echo green; return; }
  # 3) 포트 점유 기준
  port_used $BLUE_PORT && { echo blue; return; }
  port_used $GREEN_PORT && { echo green; return; }
  # 4) 모름
  echo none
}

switch_link_and_reload(){
  local target_conf="$1" # app-blue.conf or app-green.conf
  ln -sfn "$UPSTREAM_DIR/$target_conf" "$UPSTREAM_LINK"
  nginx -t
  nginx -s reload
}

echo "🔄 Blue/Green 배포 시작..."

CUR=$(current_color)
if [ "$CUR" = "blue" ]; then NEXT="green"; TARGET_PORT=$GREEN_PORT; TARGET_COMPOSE=$COMPOSE_GREEN; TARGET_CONF="app-green.conf"; fi
if [ "$CUR" = "green" ]; then NEXT="blue"; TARGET_PORT=$BLUE_PORT; TARGET_COMPOSE=$COMPOSE_BLUE; TARGET_CONF="app-blue.conf"; fi
if [ "$CUR" = "none" ]; then
  # 초기 진입: 3001이 이미 점유라면 blue가 살아있는 셈 → green부터 띄움
  if port_used $BLUE_PORT || health_ok $BLUE_PORT; then
    NEXT="green"; TARGET_PORT=$GREEN_PORT; TARGET_COMPOSE=$COMPOSE_GREEN; TARGET_CONF="app-green.conf"
  else
    NEXT="blue";  TARGET_PORT=$BLUE_PORT;  TARGET_COMPOSE=$COMPOSE_BLUE;  TARGET_CONF="app-blue.conf"
  fi
fi

echo "🔁 현재색: $CUR  →  다음색: $NEXT (포트 $TARGET_PORT)"

echo "📥 새 이미지 Pull"
docker compose -f "$TARGET_COMPOSE" pull

echo "🚀 $NEXT 스택 시작"
docker compose -f "$TARGET_COMPOSE" up -d

echo "⏳ 헬스체크 대기: http://127.0.0.1:$TARGET_PORT/health"
for i in {1..60}; do
  if health_ok $TARGET_PORT; then echo "✅ Healthy"; break; fi
  sleep 2
  if [ $i -eq 60 ]; then echo "❌ 헬스 타임아웃"; exit 1; fi
done

echo "🔁 업스트림 전환 및 무중단 reload"
switch_link_and_reload "$TARGET_CONF"

if [ "$CUR" != "none" ]; then
  echo "🧹 이전색($CUR) 정리"
  if [ "$CUR" = "blue" ]; then docker compose -f "$COMPOSE_BLUE" down --remove-orphans; fi
  if [ "$CUR" = "green" ]; then docker compose -f "$COMPOSE_GREEN" down --remove-orphans; fi
fi

echo "📊 컨테이너 상태"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
echo "✅ 배포 완료: $CUR → $NEXT"