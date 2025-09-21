#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/opt/pitturu"
UPSTREAM_DIR="/etc/nginx/upstreams"
LINK="/etc/nginx/conf.d/app-upstream.conf"

# 색상 결정 (현재 링크가 없으면 blue부터 시작)
if [ -L "$LINK" ]; then
  CUR=$(readlink -f "$LINK" | grep -q "app-blue.conf" && echo "blue" || echo "green")
  NEXT=$([ "$CUR" = "blue" ] && echo "green" || echo "blue")
else
  CUR="none"
  NEXT="blue"
fi

echo "🔄 Blue/Green 배포 시작: $CUR -> $NEXT"

# 1) 새 스택 올리기
if [ "$NEXT" = "green" ]; then
  PORT="3002"
  COMPOSE_FILE="$STACK_DIR/docker-compose.green.yml"
  TARGET_CONF="$UPSTREAM_DIR/app-green.conf"
  HEALTH_URL="http://127.0.0.1:3002/api/health"
  CONTAINER_NAME="pitturu-web-green"
else
  PORT="3001"
  COMPOSE_FILE="$STACK_DIR/docker-compose.blue.yml"
  TARGET_CONF="$UPSTREAM_DIR/app-blue.conf"
  HEALTH_URL="http://127.0.0.1:3001/api/health"
  CONTAINER_NAME="pitturu-web-blue"
fi

echo "📥 새 이미지 Pull"
docker pull ze2l/ppituruppaturu-frontend:latest
docker pull ze2l/ppituruppaturu-backend:latest

echo "🚀 $NEXT 스택 시작 (포트: $PORT)"
docker-compose -f "$COMPOSE_FILE" up -d

echo "⏳ 헬스체크 대기: $HEALTH_URL"
for i in {1..60}; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✅ $NEXT 스택 정상 동작 확인"
    break
  fi
  echo "대기중... ($i/60)"
  sleep 2
  if [ $i -eq 60 ]; then
    echo "❌ 헬스체크 실패"
    docker-compose -f "$COMPOSE_FILE" logs
    exit 1
  fi
done

# 2) Nginx 업스트림 전환
if [ -f "$TARGET_CONF" ]; then
  echo "🔄 Nginx 업스트림 전환: $NEXT"
  ln -sfn "$TARGET_CONF" "$LINK"
  nginx -t
  nginx -s reload
  echo "✅ Nginx 전환 완료"
else
  echo "⚠️  업스트림 설정 파일이 없습니다: $TARGET_CONF"
fi

# 3) 이전 스택 정리 (안전 지연 후)
if [ "$CUR" != "none" ]; then
  echo "⏳ 안전 지연 (5초)"
  sleep 5

  if [ "$CUR" = "green" ]; then
    OLD_COMPOSE="$STACK_DIR/docker-compose.green.yml"
  else
    OLD_COMPOSE="$STACK_DIR/docker-compose.blue.yml"
  fi

  echo "🗑️  이전 $CUR 스택 정리"
  docker-compose -f "$OLD_COMPOSE" down --remove-orphans || true
fi

echo "🎉 Blue/Green 배포 완료: $CUR -> $NEXT"