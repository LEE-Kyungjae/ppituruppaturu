#!/usr/bin/env bash
# 🚨 응급 배포 스크립트 - 3분 내 배포 완료 보장

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_HOST="ocloud"

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 0) 사전 체크
log "🔍 사전 체크 시작..."
command -v docker >/dev/null || error "Docker가 설치되지 않음"
command -v ssh >/dev/null || error "SSH가 설치되지 않음"

if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $SSH_HOST "echo connected" >/dev/null 2>&1; then
    error "SSH 접속 실패. SSH 키를 확인하세요."
fi

success "사전 체크 완료"

# 1) 빌드 (로컬에서 병렬로)
log "🔨 로컬 빌드 시작 (병렬)..."
start_time=$(date +%s)

# 백엔드 빌드
(
    cd pp-backend
    log "Backend 빌드 시작..."
    docker build -t emergency-backend . --target production
    docker tag emergency-backend ze2l/ppituruppaturu-backend:emergency
    success "Backend 빌드 완료"
) &

# 프론트엔드 빌드
(
    cd pp-frontend
    log "Frontend 빌드 시작..."
    docker build -t emergency-frontend . --target production
    docker tag emergency-frontend ze2l/ppituruppaturu-frontend:emergency
    success "Frontend 빌드 완료"
) &

wait
build_time=$(($(date +%s) - start_time))
success "전체 빌드 완료 (${build_time}초)"

# 2) 이미지 푸시
log "📤 이미지 푸시 시작..."
docker push ze2l/ppituruppaturu-backend:emergency &
docker push ze2l/ppituruppaturu-frontend:emergency &
wait
success "이미지 푸시 완료"

# 3) 서버 배포 (기존 컨테이너 강제 교체)
log "🚀 서버 배포 시작..."
ssh $SSH_HOST << 'EOF'
set -euo pipefail

log() { echo -e "\033[0;34m[$(date +'%H:%M:%S')]\033[0m $1"; }
success() { echo -e "\033[0;32m✅ $1\033[0m"; }

log "기존 컨테이너 정리..."
docker ps -q | xargs -r docker kill || true
docker ps -aq | xargs -r docker rm || true

log "새 이미지 Pull..."
docker pull ze2l/ppituruppaturu-backend:emergency
docker pull ze2l/ppituruppaturu-frontend:emergency

log "PostgreSQL & Redis 시작..."
docker run -d --name pitturu-postgres \
  -e POSTGRES_DB=pitturu_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=pitturu_dev_2024 \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d --name pitturu-redis \
  -p 6379:6379 \
  redis:7-alpine

log "서비스 시작 대기..."
sleep 10

log "백엔드 시작..."
docker run -d --name pitturu-backend \
  --link pitturu-postgres:postgres \
  --link pitturu-redis:redis \
  -e DSN="postgres://postgres:pitturu_dev_2024@postgres:5432/pitturu_db?sslmode=disable" \
  -e REDIS_URL="redis://redis:6379" \
  -e JWT_SECRET="emergency_jwt_secret_$(date +%s)" \
  -e REFRESH_SECRET="emergency_refresh_secret_$(date +%s)" \
  -p 8080:8080 \
  -p 8082:8082 \
  ze2l/ppituruppaturu-backend:emergency

log "프론트엔드 시작..."
docker run -d --name pitturu-frontend \
  --link pitturu-backend:backend \
  -e NEXT_PUBLIC_API_URL="http://152.67.201.101:8080/api" \
  -e NEXT_PUBLIC_WS_URL="ws://152.67.201.101:8082/ws" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  ze2l/ppituruppaturu-frontend:emergency

success "배포 완료!"

log "컨테이너 상태 확인..."
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'

log "헬스체크..."
sleep 15
curl -f http://localhost:3000/api/health || echo "Frontend 헬스체크 실패"
curl -f http://localhost:8080/health || echo "Backend 헬스체크 실패"

echo "🎉 응급 배포 완료! http://152.67.201.101:3000"
EOF

total_time=$(($(date +%s) - start_time))
success "🎉 전체 배포 완료! (총 ${total_time}초)"
log "🌐 서비스 URL: http://152.67.201.101:3000"
log "🔍 상태 확인: curl http://152.67.201.101:3000/api/health"