#!/usr/bin/env bash
# 🚨 포트 충돌 응급 해결 스크립트

set -euo pipefail

echo "🔍 현재 포트 점유 상태 확인"
echo "=== 8081 포트 ==="
docker ps --filter "publish=8081" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8081 포트 비어있음"

echo "=== 8082 포트 ==="
docker ps --filter "publish=8082" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || echo "8082 포트 비어있음"

echo "🧹 충돌 컨테이너 정리"
# 8082를 쓰는 컨테이너가 있으면 중지
if docker ps --filter "publish=8082" -q | grep -q .; then
    echo "8082 포트 사용 컨테이너 중지 중..."
    docker ps --filter "publish=8082" -q | xargs docker stop
    docker ps --filter "publish=8082" -q | xargs docker rm
fi

echo "🔄 Blue 스택 정리 후 재시작 (8081 포트로)"
# 기존 Blue 컨테이너 모두 정리
docker compose -f /opt/pitturu/docker-compose.blue.yml -p pitturu-blue down --remove-orphans || true

echo "⏳ 잠시 대기..."
sleep 3

echo "🚀 Blue 스택 8081 포트로 재시작"
docker compose -f /opt/pitturu/docker-compose.blue.yml -p pitturu-blue up -d

echo "✅ 포트 충돌 해결 완료!"
echo "Blue: 8081/8083 (정상)"
echo "Green: 8082/8084 (준비됨)"

echo "📊 최종 포트 상태"
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'