#!/bin/bash
# 삐뚜루빠뚜루 Hybrid Build Script - Unity + Flutter 통합 빌드
set -e

# 색상 출력용
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정값
UNITY_PROJECT_PATH="./unity-game"
FLUTTER_PROJECT_PATH="./flutter-shell"
BUILD_DIR="./build"
UNITY_BUILD_TARGET="Android"
FLUTTER_FLAVOR="production"

# 함수: 로그 출력
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 함수: 프리체크 (필수 도구 설치 확인)
check_prerequisites() {
    log_info "Prerequisites 체크 중..."

    # Unity 설치 확인
    if ! command -v Unity &> /dev/null; then
        log_error "Unity가 설치되지 않았습니다."
        exit 1
    fi

    # Flutter 설치 확인
    if ! command -v flutter &> /dev/null; then
        log_error "Flutter가 설치되지 않았습니다."
        exit 1
    fi

    # Flutter 환경 체크
    flutter doctor --android-licenses > /dev/null 2>&1 || true

    log_success "Prerequisites 체크 완료"
}

# 함수: Unity 빌드
build_unity() {
    log_info "Unity 게임 빌드 시작..."

    # Unity 프로젝트 경로 확인
    if [ ! -d "$UNITY_PROJECT_PATH" ]; then
        log_error "Unity 프로젝트를 찾을 수 없습니다: $UNITY_PROJECT_PATH"
        exit 1
    fi

    # Unity 빌드 디렉토리 생성
    mkdir -p "$BUILD_DIR/unity"

    # Unity 배치 빌드 실행
    log_info "Unity 배치 빌드 실행 중..."
    Unity -batchmode -quit \
        -projectPath "$UNITY_PROJECT_PATH" \
        -buildTarget "$UNITY_BUILD_TARGET" \
        -executeMethod BuildScript.BuildForFlutter \
        -customBuildPath "$BUILD_DIR/unity" \
        -logFile "$BUILD_DIR/unity-build.log"

    # 빌드 결과 확인
    if [ $? -eq 0 ]; then
        log_success "Unity 빌드 완료"
    else
        log_error "Unity 빌드 실패 - 로그 확인: $BUILD_DIR/unity-build.log"
        exit 1
    fi
}

# 함수: Unity 빌드 결과를 Flutter로 복사
copy_unity_to_flutter() {
    log_info "Unity 빌드 결과를 Flutter 프로젝트로 복사 중..."

    # Unity 빌드 결과물 경로
    UNITY_OUTPUT="$BUILD_DIR/unity"
    FLUTTER_ANDROID_PATH="$FLUTTER_PROJECT_PATH/android/unityLibrary"

    # 기존 Unity 라이브러리 제거
    if [ -d "$FLUTTER_ANDROID_PATH" ]; then
        rm -rf "$FLUTTER_ANDROID_PATH"
    fi

    # Unity 빌드 결과 복사
    if [ -d "$UNITY_OUTPUT/unityLibrary" ]; then
        cp -r "$UNITY_OUTPUT/unityLibrary" "$FLUTTER_ANDROID_PATH"
        log_success "Unity 라이브러리 복사 완료"
    else
        log_error "Unity 빌드 결과물을 찾을 수 없습니다."
        exit 1
    fi

    # Gradle 설정 업데이트
    log_info "Flutter Gradle 설정 업데이트 중..."
    # TODO: 필요시 Gradle 설정 자동 수정 로직 추가
}

# 함수: Flutter 빌드
build_flutter() {
    log_info "Flutter 앱 빌드 시작..."

    # Flutter 프로젝트 경로 확인
    if [ ! -d "$FLUTTER_PROJECT_PATH" ]; then
        log_error "Flutter 프로젝트를 찾을 수 없습니다: $FLUTTER_PROJECT_PATH"
        exit 1
    fi

    # Flutter 프로젝트로 이동
    cd "$FLUTTER_PROJECT_PATH"

    # 의존성 업데이트
    log_info "Flutter 의존성 업데이트 중..."
    flutter pub get

    # 코드 생성 (build_runner 등)
    log_info "Flutter 코드 생성 중..."
    flutter packages pub run build_runner build --delete-conflicting-outputs

    # Flutter 빌드 (APK)
    log_info "Flutter APK 빌드 중..."
    flutter build apk --release \
        --dart-define=FLAVOR="$FLUTTER_FLAVOR" \
        --dart-define=API_URL="https://api.ppituruppaturu.com" \
        --dart-define=UNITY_ENABLED=true

    # 빌드 결과 확인
    if [ $? -eq 0 ]; then
        log_success "Flutter 빌드 완료"

        # APK 파일 경로 출력
        APK_PATH="./build/app/outputs/flutter-apk/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            log_success "APK 생성 완료: $APK_PATH (크기: $APK_SIZE)"

            # APK 크기 체크 (300MB 임계값)
            APK_SIZE_MB=$(du -m "$APK_PATH" | cut -f1)
            if [ "$APK_SIZE_MB" -gt 300 ]; then
                log_warning "APK 크기가 너무 큽니다: ${APK_SIZE_MB}MB > 300MB"
            fi
        fi
    else
        log_error "Flutter 빌드 실패"
        exit 1
    fi

    # 원래 디렉토리로 복귀
    cd - > /dev/null
}

# 함수: 빌드 결과 검증
validate_build() {
    log_info "빌드 결과 검증 중..."

    # APK 파일 존재 확인
    APK_PATH="$FLUTTER_PROJECT_PATH/build/app/outputs/flutter-apk/app-release.apk"
    if [ ! -f "$APK_PATH" ]; then
        log_error "APK 파일을 찾을 수 없습니다: $APK_PATH"
        exit 1
    fi

    # APK 정보 출력
    log_info "APK 정보:"
    aapt dump badging "$APK_PATH" | grep -E "(package|sdkVersion|targetSdkVersion)" || true

    # Unity 통합 확인 (간단한 검사)
    if unzip -l "$APK_PATH" | grep -q "libunity.so"; then
        log_success "Unity 네이티브 라이브러리 포함 확인"
    else
        log_warning "Unity 네이티브 라이브러리를 찾을 수 없습니다"
    fi

    log_success "빌드 결과 검증 완료"
}

# 함수: 정리
cleanup() {
    log_info "임시 파일 정리 중..."

    # 임시 빌드 파일 정리 (선택적)
    # rm -rf "$BUILD_DIR/unity"

    log_success "정리 완료"
}

# 메인 빌드 프로세스
main() {
    log_info "삐뚜루빠뚜루 하이브리드 빌드 시작"
    log_info "Unity: $UNITY_PROJECT_PATH"
    log_info "Flutter: $FLUTTER_PROJECT_PATH"

    # 빌드 디렉토리 생성
    mkdir -p "$BUILD_DIR"

    # 빌드 프로세스 실행
    check_prerequisites
    build_unity
    copy_unity_to_flutter
    build_flutter
    validate_build
    cleanup

    log_success "🎉 전체 빌드 완료!"
    log_info "APK 위치: $FLUTTER_PROJECT_PATH/build/app/outputs/flutter-apk/app-release.apk"
}

# 스크립트 실행
main "$@"