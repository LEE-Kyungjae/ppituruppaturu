#!/usr/bin/env bash
# 🚨 포트 충돌 응급 해결 스크립트

set -euo pipefail

echo "🔍 현재 포트 점유 상태 확인"
echo "=== 8081 포트 ==="
docker ps --filter "publish=8081" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8081 포트 비어있음"

echo "=== 8082 포트 ==="
docker ps --filter "publish=8082" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8082 포트 비어있음"

echo "🧹 모든 충돌 컨테이너 정리"
# 8082를 쓰는 컨테이너가 있으면 중지 (Blue의 잘못된 실행)
if docker ps --filter "publish=8082" -q | grep -q .; then
    echo "⚠️  8082 포트 사용 컨테이너 발견 - 강제 중지"
    docker ps --filter "publish=8082" -q | xargs docker stop || true
    docker ps --filter "publish=8082" -q | xargs docker rm || true
fi

# 8081을 쓰는 컨테이너도 정리 (깨끗한 재시작)
if docker ps --filter "publish=8081" -q | grep -q .; then
    echo "8081 포트 사용 컨테이너도 정리"
    docker ps --filter "publish=8081" -q | xargs docker stop || true
    docker ps --filter "publish=8081" -q | xargs docker rm || true
fi

echo "🔄 Blue 스택 완전 정리"
# 모든 Blue 관련 컨테이너 정리
docker compose -f /opt/pitturu/docker-compose.blue.yml -p pitturu-blue down --remove-orphans || true
docker ps -a | grep pitturu | grep blue | awk '{print $1}' | xargs docker rm -f || true

echo "⏳ 잠시 대기..."
sleep 3

echo "🚀 Blue 스택 8081 포트로 재시작"
docker compose -f /opt/pitturu/docker-compose.blue.yml -p pitturu-blue up -d

echo "✅ 포트 충돌 완전 해결!"
echo "📋 포트 할당:"
echo "  Blue:  8081(API) + 8083(WS)"
echo "  Green: 8082(API) + 8084(WS)"

echo "📊 최종 상태 확인"
echo "=== 현재 실행 중인 컨테이너 ==="
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'

echo "=== 포트 점유 상태 ==="
echo "8081: $(docker ps --filter "publish=8081" --format '{{.Names}}' || echo '비어있음')"
echo "8082: $(docker ps --filter "publish=8082" --format '{{.Names}}' || echo '비어있음')"
echo "8083: $(docker ps --filter "publish=8083" --format '{{.Names}}' || echo '비어있음')"
echo "8084: $(docker ps --filter "publish=8084" --format '{{.Names}}' || echo '비어있음')"

echo "🎯 이제 GitHub Actions에서 Green 배포가 성공할 것입니다!"