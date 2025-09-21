#!/usr/bin/env bash
# 🚨 Blue/Green 포트 충돌 안전 해결 스크립트
set -euo pipefail

BLUE_COMPOSE="/opt/pitturu/docker-compose.blue.yml"
PROJECT="pitturu-blue"

echo "🔍 현재 포트 점유 상태 (프로젝트 한정)"
echo "=== 8081 포트 ==="
docker ps --filter "publish=8081" --filter "name=pitturu" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8081 포트 비어있음"

echo "=== 8082 포트 ==="
docker ps --filter "publish=8082" --filter "name=pitturu" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8082 포트 비어있음"

echo "=== 8083 포트 ==="
docker ps --filter "publish=8083" --filter "name=pitturu" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8083 포트 비어있음"

echo "=== 8084 포트 ==="
docker ps --filter "publish=8084" --filter "name=pitturu" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8084 포트 비어있음"

echo "🧹 8082 점유 컨테이너 안전 정리 (프로젝트 한정)"
ids=$(docker ps --filter "publish=8082" --filter "name=pitturu" -q || true)
if [ -n "${ids:-}" ]; then
    echo "⚠️  8082 사용 pitturu 컨테이너 강제 종료/삭제: $ids"
    docker stop $ids || true
    docker rm $ids || true
else
    echo "8082 포트에 pitturu 컨테이너 없음"
fi

echo "🔄 Blue 스택 완전 정리"
docker compose -f "$BLUE_COMPOSE" -p "$PROJECT" down --remove-orphans || true

echo "🧹 이전 컨테이너명 정리 (pitturu-backend-blue 등)"
old_ids=$(docker ps -a --format '{{.ID}}\t{{.Names}}' | grep -E 'pitturu-backend-blue|pitturu-frontend-blue' | awk '{print $1}' || true)
if [ -n "${old_ids:-}" ]; then
    echo "이전 컨테이너 제거: $old_ids"
    echo "$old_ids" | xargs -r docker rm -f
fi

echo "⏳ 잠시 대기..."
sleep 3

echo "🚀 Blue 스택 8081/8083 포트로 재기동 + 헬스 대기"
docker compose -f "$BLUE_COMPOSE" -p "$PROJECT" up -d --force-recreate --wait

echo "✅ 포트 충돌 안전 해결 완료!"
echo "📋 포트 할당:"
echo "  Blue:  8081(API) + 8083(WebSocket) ✅"
echo "  Green: 8082(API) + 8084(WebSocket) 준비됨 ✅"

echo "📊 최종 상태 확인"
echo "=== 현재 실행 중인 pitturu 컨테이너 ==="
docker ps --filter "name=pitturu" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'

echo "=== 포트 점유 상태 (pitturu 프로젝트만) ==="
echo "8081: $(docker ps --filter "publish=8081" --filter "name=pitturu" --format '{{.Names}}' || echo '비어있음')"
echo "8082: $(docker ps --filter "publish=8082" --filter "name=pitturu" --format '{{.Names}}' || echo '비어있음')"
echo "8083: $(docker ps --filter "publish=8083" --filter "name=pitturu" --format '{{.Names}}' || echo '비어있음')"
echo "8084: $(docker ps --filter "publish=8084" --filter "name=pitturu" --format '{{.Names}}' || echo '비어있음')"

echo "🎯 이제 GitHub Actions에서 Green(8082/8084) 배포가 성공할 것입니다!"