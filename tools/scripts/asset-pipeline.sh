#!/bin/bash
# 삐뚜루빠뚜루 AI Asset Pipeline - 2D/3D 에셋 자동 생성 및 최적화
set -e

# 색상 출력용
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정값
ASSETS_DIR="./assets"
RAW_DIR="$ASSETS_DIR/raw"
PROCESSED_DIR="$ASSETS_DIR/processed"
DIST_DIR="$ASSETS_DIR/dist"
AI_OUTPUTS_DIR="./tools/ai/outputs"

# AI 생성 관련 설정
CHARACTER_COUNT=3
EMOTION_COUNT=6
POSE_COUNT=4
ICON_COUNT=20
TARGET_RESOLUTION="512x512"

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

# 함수: 디렉토리 초기화
init_directories() {
    log_info "에셋 디렉토리 구조 초기화 중..."

    # 디렉토리 생성
    mkdir -p "$RAW_DIR"/{characters,icons,backgrounds,ui}
    mkdir -p "$PROCESSED_DIR"/{characters,icons,backgrounds,ui}
    mkdir -p "$DIST_DIR"/{2d,3d,ui}
    mkdir -p "$AI_OUTPUTS_DIR"/{characters,icons,backgrounds}

    log_success "디렉토리 구조 초기화 완료"
}

# 함수: AI 캐릭터 생성 (나노바나나 API 시뮬레이션)
generate_characters() {
    log_info "AI 캐릭터 생성 시작..."

    # 캐릭터 스타일 정의 (디자인 시스템에서)
    CHARACTER_STYLES=(
        "warrior_red_armor"
        "mage_blue_robe"
        "archer_green_cloak"
    )

    EMOTIONS=("idle" "happy" "angry" "sad" "surprised" "focused")
    POSES=("front" "side" "back" "action")

    for i in "${!CHARACTER_STYLES[@]}"; do
        style="${CHARACTER_STYLES[$i]}"
        log_info "캐릭터 $((i+1)): $style 생성 중..."

        for emotion in "${EMOTIONS[@]}"; do
            for pose in "${POSES[@]}"; do
                output_file="$AI_OUTPUTS_DIR/characters/${style}_${emotion}_${pose}.png"

                # AI 생성 프롬프트 (실제 API 호출은 별도 구현)
                prompt="2D game character, chibi style, $style, $emotion expression, $pose view, clean background, pixel perfect, 512x512px, anime aesthetic, consistent art style"

                # TODO: 실제 AI API 호출 구현
                # generate_image_with_ai "$prompt" "$output_file"

                # 임시: 더미 파일 생성 (개발용)
                if [ ! -f "$output_file" ]; then
                    log_info "더미 파일 생성: $output_file"
                    convert -size 512x512 xc:transparent "$output_file" 2>/dev/null || {
                        # ImageMagick이 없으면 빈 파일 생성
                        touch "$output_file"
                    }
                fi
            done
        done

        log_success "캐릭터 $((i+1)) 생성 완료"
    done

    log_success "모든 캐릭터 생성 완료"
}

# 함수: AI 아이콘 생성
generate_icons() {
    log_info "AI 아이콘 생성 시작..."

    ICON_TYPES=(
        "sword" "shield" "potion" "coin" "gem" "heart"
        "star" "lock" "key" "chest" "map" "book"
        "fire" "water" "earth" "air" "lightning" "ice"
        "play" "pause" "stop" "settings"
    )

    for icon in "${ICON_TYPES[@]}"; do
        output_file="$AI_OUTPUTS_DIR/icons/icon_${icon}.png"

        # AI 생성 프롬프트
        prompt="Game UI icon, minimalist style, $icon, 128x128px, flat design, #4A90E2 primary color, white background, vector style, mobile game interface"

        # TODO: 실제 AI API 호출
        if [ ! -f "$output_file" ]; then
            log_info "더미 아이콘 생성: $icon"
            convert -size 128x128 xc:transparent "$output_file" 2>/dev/null || touch "$output_file"
        fi
    done

    log_success "아이콘 생성 완료"
}

# 함수: 이미지 후처리 (업스케일, 배경 제거 등)
process_images() {
    log_info "이미지 후처리 시작..."

    # 캐릭터 이미지 처리
    log_info "캐릭터 이미지 처리 중..."
    for img in "$AI_OUTPUTS_DIR/characters"/*.png; do
        if [ -f "$img" ]; then
            filename=$(basename "$img")
            output="$PROCESSED_DIR/characters/$filename"

            # 업스케일 (2x) - 실제로는 AI 업스케일러 사용
            convert "$img" -resize 1024x1024 "$output" 2>/dev/null || cp "$img" "$output"

            # 알파 채널 최적화
            # TODO: 실제 배경 제거 AI 적용

            log_info "처리 완료: $filename"
        fi
    done

    # 아이콘 처리
    log_info "아이콘 처리 중..."
    for img in "$AI_OUTPUTS_DIR/icons"/*.png; do
        if [ -f "$img" ]; then
            filename=$(basename "$img")
            output="$PROCESSED_DIR/icons/$filename"

            # 벡터화 및 최적화
            convert "$img" -resize 256x256 "$output" 2>/dev/null || cp "$img" "$output"

            log_info "처리 완료: $filename"
        fi
    done

    log_success "이미지 후처리 완료"
}

# 함수: 스프라이트 시트 생성
create_sprite_sheets() {
    log_info "스프라이트 시트 생성 시작..."

    # TexturePacker가 있으면 사용, 없으면 간단한 방법으로
    if command -v TexturePacker &> /dev/null; then
        log_info "TexturePacker를 사용한 스프라이트 시트 생성..."

        # 캐릭터 스프라이트 시트
        TexturePacker \
            --data "$DIST_DIR/2d/characters.json" \
            --format json \
            --sheet "$DIST_DIR/2d/characters.png" \
            --max-size 2048 \
            --size-constraints AnySize \
            --disable-rotation \
            "$PROCESSED_DIR/characters"/*.png

        # 아이콘 스프라이트 시트
        TexturePacker \
            --data "$DIST_DIR/2d/icons.json" \
            --format json \
            --sheet "$DIST_DIR/2d/icons.png" \
            --max-size 1024 \
            --size-constraints AnySize \
            --disable-rotation \
            "$PROCESSED_DIR/icons"/*.png

        log_success "TexturePacker 스프라이트 시트 생성 완료"
    else
        log_warning "TexturePacker를 찾을 수 없습니다. 개별 파일로 복사합니다."

        # 개별 파일 복사
        cp "$PROCESSED_DIR/characters"/*.png "$DIST_DIR/2d/" 2>/dev/null || true
        cp "$PROCESSED_DIR/icons"/*.png "$DIST_DIR/2d/" 2>/dev/null || true

        log_success "개별 파일 복사 완료"
    fi
}

# 함수: Unity 임포트 설정 생성
create_unity_import_settings() {
    log_info "Unity 임포트 설정 생성 중..."

    # Unity 프로젝트 경로 확인
    UNITY_ASSETS_PATH="./unity-game/Assets"
    if [ ! -d "$UNITY_ASSETS_PATH" ]; then
        log_warning "Unity 프로젝트를 찾을 수 없습니다. 건너뜁니다."
        return
    fi

    # Unity 에셋 디렉토리 생성
    mkdir -p "$UNITY_ASSETS_PATH/Sprites"/{Characters,Icons,UI}
    mkdir -p "$UNITY_ASSETS_PATH/Editor/ImportSettings"

    # 스프라이트 임포트 설정 스크립트 생성
    cat > "$UNITY_ASSETS_PATH/Editor/ImportSettings/SpriteImportSettings.cs" << 'EOF'
using UnityEngine;
using UnityEditor;

public class SpriteImportSettings : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        TextureImporter importer = (TextureImporter)assetImporter;

        // 캐릭터 스프라이트 설정
        if (assetPath.Contains("Characters"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Multiple;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
        }

        // 아이콘 설정
        if (assetPath.Contains("Icons"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.filterMode = FilterMode.Bilinear;
            importer.maxTextureSize = 256;
        }
    }
}
EOF

    log_success "Unity 임포트 설정 생성 완료"
}

# 함수: 품질 검증
validate_assets() {
    log_info "에셋 품질 검증 시작..."

    validation_errors=0

    # 파일 크기 검증
    log_info "파일 크기 검증 중..."
    for img in "$DIST_DIR/2d"/*.png; do
        if [ -f "$img" ]; then
            size=$(du -k "$img" | cut -f1)
            if [ "$size" -gt 1024 ]; then  # 1MB 이상
                log_warning "파일이 큽니다: $(basename "$img") - ${size}KB"
                ((validation_errors++))
            fi
        fi
    done

    # 해상도 검증
    log_info "해상도 검증 중..."
    if command -v identify &> /dev/null; then
        for img in "$PROCESSED_DIR/characters"/*.png; do
            if [ -f "$img" ]; then
                resolution=$(identify -format "%wx%h" "$img" 2>/dev/null || echo "unknown")
                if [[ "$resolution" != "1024x1024" && "$resolution" != "512x512" ]]; then
                    log_warning "비표준 해상도: $(basename "$img") - $resolution"
                    ((validation_errors++))
                fi
            fi
        done
    else
        log_warning "ImageMagick이 설치되지 않아 해상도 검증을 건너뜁니다."
    fi

    # 검증 결과
    if [ "$validation_errors" -eq 0 ]; then
        log_success "모든 에셋이 품질 기준을 통과했습니다."
    else
        log_warning "$validation_errors 개의 에셋에서 품질 이슈가 발견되었습니다."
    fi
}

# 함수: 메타데이터 생성
generate_metadata() {
    log_info "에셋 메타데이터 생성 중..."

    # 에셋 정보 JSON 생성
    cat > "$DIST_DIR/asset_manifest.json" << EOF
{
  "version": "1.0.0",
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "characters": {
    "count": $(find "$PROCESSED_DIR/characters" -name "*.png" 2>/dev/null | wc -l),
    "resolution": "1024x1024",
    "format": "PNG with alpha"
  },
  "icons": {
    "count": $(find "$PROCESSED_DIR/icons" -name "*.png" 2>/dev/null | wc -l),
    "resolution": "256x256",
    "format": "PNG"
  },
  "sprite_sheets": {
    "characters": "characters.png",
    "icons": "icons.png"
  },
  "tools_used": [
    "AI generation (나노바나나)",
    "ImageMagick (processing)",
    "TexturePacker (sprite sheets)"
  ]
}
EOF

    log_success "메타데이터 생성 완료"
}

# 함수: 정리
cleanup() {
    log_info "임시 파일 정리 중..."

    # AI 출력 원본 파일 정리 (옵션)
    # rm -rf "$AI_OUTPUTS_DIR"

    log_success "정리 완료"
}

# 메인 함수
main() {
    log_info "🎨 삐뚜루빠뚜루 AI 에셋 파이프라인 시작"

    case "${1:-all}" in
        "characters")
            init_directories
            generate_characters
            process_images
            ;;
        "icons")
            init_directories
            generate_icons
            process_images
            ;;
        "sprites")
            create_sprite_sheets
            ;;
        "unity")
            create_unity_import_settings
            ;;
        "validate")
            validate_assets
            ;;
        "clean")
            cleanup
            ;;
        "all"|*)
            init_directories
            generate_characters
            generate_icons
            process_images
            create_sprite_sheets
            create_unity_import_settings
            validate_assets
            generate_metadata
            cleanup
            ;;
    esac

    log_success "🎉 에셋 파이프라인 완료!"
    log_info "결과물 위치: $DIST_DIR"
}

# 도움말
show_help() {
    echo "삐뚜루빠뚜루 AI Asset Pipeline"
    echo ""
    echo "사용법: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all         - 모든 에셋 생성 (기본값)"
    echo "  characters  - 캐릭터만 생성"
    echo "  icons       - 아이콘만 생성"
    echo "  sprites     - 스프라이트 시트만 생성"
    echo "  unity       - Unity 임포트 설정만 생성"
    echo "  validate    - 품질 검증만 실행"
    echo "  clean       - 정리만 실행"
    echo "  help        - 이 도움말 표시"
}

# 인자 처리
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# 스크립트 실행
main "$@"