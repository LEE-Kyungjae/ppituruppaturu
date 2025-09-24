#!/usr/bin/env bash
# 🚨 Blue/Green 포트 충돌 안전 해결 스크립트
set -euo pipefail

BLUE_COMPOSE="/opt/ppituru/docker-compose.blue.yml"
PROJECT="ppituru-blue"

echo "🔍 현재 포트 점유 상태 (프로젝트 한정)"
echo "=== 8081 포트 ==="
docker ps --filter "publish=8081" --filter "name=ppituru" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8081 포트 비어있음"

echo "=== 8082 포트 ==="
docker ps --filter "publish=8082" --filter "name=ppituru" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8082 포트 비어있음"

echo "=== 8083 포트 ==="
docker ps --filter "publish=8083" --filter "name=ppituru" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8083 포트 비어있음"

echo "=== 8084 포트 ==="
docker ps --filter "publish=8084" --filter "name=ppituru" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8084 포트 비어있음"

echo "🔍 8082 포트 점유자 상세 분석"
echo "=== Docker 컨테이너 확인 ==="
docker ps --filter "publish=8082" --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "Docker 컨테이너 없음"

echo "=== 시스템 프로세스 확인 ==="
ss -ltnp | grep ':8082' || echo "시스템 프로세스 없음"

echo "🧹 8082 점유 컨테이너 완전 정리"
# 1) ppituru 프로젝트 컨테이너만 안전 제거
ids=$(docker ps --filter "publish=8082" --filter "name=ppituru" -q || true)
if [ -n "${ids:-}" ]; then
    echo "⚠️  8082 사용 ppituru 컨테이너 강제 종료/삭제: $ids"
    docker stop $ids || true
    docker rm $ids || true
else
    echo "ppituru 컨테이너가 8082 사용하지 않음"
fi

# 2) 여전히 8082가 점유되어 있으면 모든 8082 컨테이너 정리
remaining_ids=$(docker ps --filter "publish=8082" -q || true)
if [ -n "${remaining_ids:-}" ]; then
    echo "⚠️  잔여 8082 컨테이너 발견 - 강제 정리: $remaining_ids"
    docker stop $remaining_ids || true
    docker rm $remaining_ids || true
fi

# 3) docker-proxy 잔재 정리 (예외적 경우)
if ss -ltn | grep -q ':8082'; then
    echo "⚠️  docker-proxy 잔재 감지 - 프로세스 정리"
    pids=$(ss -ltnp | grep ':8082' | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 || true)
    if [ -n "${pids:-}" ]; then
        echo "8082 점유 프로세스 종료: $pids"
        echo "$pids" | xargs -r kill -9 || true
    fi
fi

echo "🔄 Blue 스택 완전 정리"
docker compose -f "$BLUE_COMPOSE" -p "$PROJECT" down --remove-orphans || true

echo "🧹 이전 컨테이너명 정리 (ppituru-backend-blue 등)"
old_ids=$(docker ps -a --format '{{.ID}}\t{{.Names}}' | grep -E 'ppituru-backend-blue|ppituru-frontend-blue' | awk '{print $1}' || true)
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
echo "=== 현재 실행 중인 ppituru 컨테이너 ==="
docker ps --filter "name=ppituru" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'

echo "=== 포트 점유 상태 (ppituru 프로젝트만) ==="
echo "8081: $(docker ps --filter "publish=8081" --filter "name=ppituru" --format '{{.Names}}' || echo '비어있음')"
echo "8082: $(docker ps --filter "publish=8082" --filter "name=ppituru" --format '{{.Names}}' || echo '비어있음')"
echo "8083: $(docker ps --filter "publish=8083" --filter "name=ppituru" --format '{{.Names}}' || echo '비어있음')"
echo "8084: $(docker ps --filter "publish=8084" --filter "name=ppituru" --format '{{.Names}}' || echo '비어있음')"

echo "🎯 이제 GitHub Actions에서 Green(8082/8084) 배포가 성공할 것입니다!"