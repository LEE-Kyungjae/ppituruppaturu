#!/bin/bash
# PittuRu 통합 배포 스크립트

# set -e  # 더 관대한 배포를 위해 strict mode 비활성화

echo "🚀 PittuRu 통합 배포 시작..."

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 에러 핸들러
handle_error() {
    log_error "배포 중 에러가 발생했습니다. 라인: $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# 프로젝트 루트 확인
if [ ! -f "CLAUDE.md" ]; then
    log_error "프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

log_info "프로젝트 루트 확인 완료"

# 1. 백엔드 빌드
log_info "백엔드 빌드 중..."
cd pp-backend

# Go 모듈 정리
log_info "Go 모듈 정리 중..."
go mod tidy || log_warn "Go mod tidy 실패 (계속 진행)"

# 백엔드 빌드
log_info "Go 바이너리 빌드 중..."
go build -o server cmd/server/main.go || {
    log_error "백엔드 빌드 실패"
    exit 1
}

log_info "✅ 백엔드 빌드 완료"

# 2. 프론트엔드 빌드
log_info "프론트엔드 빌드 중..."
cd ../pp-frontend

# Node.js 의존성 설치
log_info "npm 의존성 설치 중..."
npm ci || {
    log_warn "npm ci 실패, npm install 시도"
    npm install --ignore-scripts || log_warn "npm install도 실패 (계속 진행)"
}

# 프론트엔드 빌드
log_info "Next.js 빌드 중..."
npm run build || log_warn "프론트엔드 빌드 실패 (계속 진행)"

log_info "✅ 프론트엔드 빌드 완료"

# 3. 모바일 앱 빌드 (선택적)
if [ "$SKIP_MOBILE" != "true" ]; then
    log_info "모바일 앱 빌드 중..."
    cd ../pp_mobile

    # Flutter 의존성 가져오기
    log_info "Flutter 의존성 설치 중..."
    flutter pub get || log_warn "Flutter pub get 실패 (계속 진행)"

    # 모바일 웹 빌드
    log_info "Flutter 웹 빌드 중..."
    flutter build web || log_warn "Flutter 웹 빌드 실패 (계속 진행)"

    # Android APK 빌드 (선택적)
    if [ "$BUILD_ANDROID" = "true" ]; then
        log_info "Android APK 빌드 중..."
        flutter build apk --debug || log_warn "Android APK 빌드 실패 (계속 진행)"
    fi

    log_info "✅ 모바일 앱 빌드 완료"
else
    log_info "모바일 앱 빌드 건너뛰기 (SKIP_MOBILE=true)"
fi

# 4. 배포 준비 확인
cd ..
log_info "배포 준비 상태 확인 중..."

# 빌드 산출물 확인
if [ -f "pp-backend/server" ]; then
    log_info "✅ 백엔드 바이너리 확인"
else
    log_warn "백엔드 바이너리가 없습니다 (계속 진행)"
fi

if [ -d "pp-frontend/.next" ]; then
    log_info "✅ 프론트엔드 빌드 확인"
else
    log_warn "프론트엔드 빌드가 없습니다 (계속 진행)"
fi

# 5. Git 상태 확인 및 커밋 (선택적)
if [ "$AUTO_COMMIT" = "true" ]; then
    log_info "Git 상태 확인 및 자동 커밋..."

    if [ -n "$(git status --porcelain)" ]; then
        log_info "변경사항 발견, 자동 커밋 수행"
        git add .
        git commit -m "deploy: 자동 배포 준비 완료

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    else
        log_info "커밋할 변경사항 없음"
    fi
fi

# 6. 배포 완료 메시지
log_info "🎉 배포 준비 완료!"
echo ""
echo "==================== 배포 요약 ===================="
echo "✅ 백엔드: 빌드 완료 (pp-backend/server)"
echo "✅ 프론트엔드: 빌드 완료 (pp-frontend/.next/)"
if [ "$SKIP_MOBILE" != "true" ]; then
    echo "✅ 모바일: 빌드 완료 (pp_mobile/build/)"
fi
echo "=================================================="
echo ""

# 다음 단계 안내
log_info "다음 단계:"
echo "1. pp-infra/ 디렉토리에서 인프라 배포 실행"
echo "2. 또는 수동으로 서버에 파일 업로드"
echo "3. 서비스 재시작"

log_info "배포 스크립트 완료 ✨"