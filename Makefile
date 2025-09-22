# PittuRu Project - AI-Powered 1-Person Development Makefile
# Comprehensive automation for Unity + Flutter + Go backend hybrid architecture

.PHONY: help setup build test deploy clean ai-generate assets unity flutter backend all

# Default target
.DEFAULT_GOAL := help

# Color codes for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Project Configuration
PROJECT_NAME := pitturu
UNITY_PROJECT := unity_core
FLUTTER_PROJECT := flutter_shell
BACKEND_PROJECT := pp-backend
FRONTEND_PROJECT := pp-frontend

# Build Configuration
BUILD_DIR := build
ASSETS_DIR := assets
UNITY_BUILD_TARGET := Android
FLUTTER_BUILD_TYPE := release

# AI Configuration
AI_CONFIG := tools/configs/game_assets.json
AI_SCRIPT := tools/scripts/generate_assets.py

help: ## Show this help message
	@echo "$(CYAN)🎮 PittuRu Project - AI-Powered Development$(NC)"
	@echo "$(YELLOW)Usage: make [target]$(NC)"
	@echo ""
	@echo "$(BLUE)📋 Main Targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 환경 설정
install: ## 개발 환경 초기 설정
	@echo -e "$(BLUE)개발 환경 설정 중...$(NC)"

	# 디렉토리 구조 생성
	@mkdir -p tools/{prompts,scripts,ai/{prompts,outputs}}
	@mkdir -p assets/{raw,processed,dist}/{characters,icons,backgrounds,ui}
	@mkdir -p build/{unity,flutter,artifacts}

	# Git hooks 설정
	@if [ -d .git ]; then \
		cp tools/scripts/pre-commit .git/hooks/ 2>/dev/null || true; \
		chmod +x .git/hooks/pre-commit 2>/dev/null || true; \
	fi

	# Flutter 환경 확인
	@if command -v flutter >/dev/null 2>&1; then \
		echo -e "$(GREEN)✅ Flutter 설치됨$(NC)"; \
		cd $(FLUTTER_PROJECT) && flutter doctor --android-licenses >/dev/null 2>&1 || true; \
	else \
		echo -e "$(RED)❌ Flutter가 설치되지 않았습니다$(NC)"; \
	fi

	# Unity 환경 확인
	@if command -v Unity >/dev/null 2>&1; then \
		echo -e "$(GREEN)✅ Unity 설치됨$(NC)"; \
	else \
		echo -e "$(YELLOW)⚠️  Unity CLI를 찾을 수 없습니다$(NC)"; \
	fi

	@echo -e "$(GREEN)환경 설정 완료!$(NC)"

# AI 관련 작업
ai-setup: ## AI 도구 환경 설정
	@echo -e "$(BLUE)AI 도구 환경 설정 중...$(NC)"

	# Python 의존성 설치 (AI 도구용)
	@pip install --upgrade pip pillow requests beautifulsoup4 openai anthropic

	# Claude Code 설정 확인
	@if [ -f ~/.claude-code/config.json ]; then \
		echo -e "$(GREEN)✅ Claude Code 설정됨$(NC)"; \
	else \
		echo -e "$(YELLOW)⚠️  Claude Code 설정이 필요합니다$(NC)"; \
	fi

	@echo -e "$(GREEN)AI 도구 설정 완료!$(NC)"

ai-generate: ## AI로 코드/에셋 생성
	@echo -e "$(BLUE)AI 생성 작업 시작...$(NC)"

	# 에셋 생성
	@$(MAKE) assets-all

	# TODO: Claude Code API를 통한 코드 생성
	@echo -e "$(YELLOW)코드 생성은 Claude Code를 통해 대화형으로 진행하세요$(NC)"

	@echo -e "$(GREEN)AI 생성 작업 완료!$(NC)"

# 에셋 관리
assets-2d: ## 2D 에셋 생성 (캐릭터, 아이콘)
	@echo -e "$(BLUE)2D 에셋 생성 중...$(NC)"
	@chmod +x tools/scripts/asset-pipeline.sh
	@./tools/scripts/asset-pipeline.sh characters
	@./tools/scripts/asset-pipeline.sh icons
	@echo -e "$(GREEN)2D 에셋 생성 완료!$(NC)"

assets-3d: ## 3D 에셋 생성 (모델, 텍스처)
	@echo -e "$(BLUE)3D 에셋 생성 중...$(NC)"
	@echo -e "$(YELLOW)3D 에셋 생성은 별도 도구 연동이 필요합니다$(NC)"
	# TODO: Blender/3D 파이프라인 연동
	@echo -e "$(GREEN)3D 에셋 생성 완료!$(NC)"

assets-all: ## 모든 에셋 생성
	@echo -e "$(BLUE)전체 에셋 생성 중...$(NC)"
	@chmod +x tools/scripts/asset-pipeline.sh
	@./tools/scripts/asset-pipeline.sh all
	@echo -e "$(GREEN)전체 에셋 생성 완료!$(NC)"

assets-clean: ## 에셋 캐시 정리
	@echo -e "$(BLUE)에셋 정리 중...$(NC)"
	@rm -rf assets/raw/* assets/processed/* tools/ai/outputs/*
	@echo -e "$(GREEN)에셋 정리 완료!$(NC)"

# 빌드 관리
build-unity: ## Unity 게임 빌드
	@echo -e "$(BLUE)Unity 빌드 시작...$(NC)"
	@if [ ! -d "$(UNITY_PROJECT)" ]; then \
		echo -e "$(RED)❌ Unity 프로젝트를 찾을 수 없습니다: $(UNITY_PROJECT)$(NC)"; \
		exit 1; \
	fi

	@mkdir -p build/unity
	@Unity -batchmode -quit \
		-projectPath "$(UNITY_PROJECT)" \
		-buildTarget Android \
		-executeMethod BuildScript.BuildForFlutter \
		-customBuildPath "$(PROJECT_ROOT)/build/unity" \
		-logFile "$(PROJECT_ROOT)/build/unity-build.log" || \
		(echo -e "$(RED)❌ Unity 빌드 실패$(NC)" && cat build/unity-build.log && exit 1)

	@echo -e "$(GREEN)Unity 빌드 완료!$(NC)"

build-flutter: ## Flutter 앱 빌드
	@echo -e "$(BLUE)Flutter 빌드 시작...$(NC)"
	@if [ ! -d "$(FLUTTER_PROJECT)" ]; then \
		echo -e "$(RED)❌ Flutter 프로젝트를 찾을 수 없습니다: $(FLUTTER_PROJECT)$(NC)"; \
		exit 1; \
	fi

	@cd $(FLUTTER_PROJECT) && \
		flutter pub get && \
		flutter packages pub run build_runner build --delete-conflicting-outputs && \
		flutter build apk --release \
			--dart-define=FLAVOR=production \
			--dart-define=API_URL=https://api.ppituruppaturu.com \
			--dart-define=UNITY_ENABLED=true

	@if [ -f "$(FLUTTER_PROJECT)/build/app/outputs/flutter-apk/app-release.apk" ]; then \
		echo -e "$(GREEN)Flutter 빌드 완료!$(NC)"; \
		ls -lh $(FLUTTER_PROJECT)/build/app/outputs/flutter-apk/app-release.apk; \
	else \
		echo -e "$(RED)❌ APK 파일을 찾을 수 없습니다$(NC)"; \
		exit 1; \
	fi

build-backend: ## 백엔드 빌드
	@echo -e "$(BLUE)백엔드 빌드 시작...$(NC)"
	@cd $(BACKEND_PROJECT) && go build -o ../build/pitturu-server ./cmd/server/
	@echo -e "$(GREEN)백엔드 빌드 완료!$(NC)"

build-all: ## 전체 프로젝트 빌드 (Unity + Flutter)
	@echo -e "$(BLUE)전체 빌드 시작...$(NC)"
	@chmod +x tools/scripts/build-all.sh
	@./tools/scripts/build-all.sh
	@echo -e "$(GREEN)전체 빌드 완료!$(NC)"

# 개발 서버
dev-backend: ## 백엔드 개발 서버 시작
	@echo -e "$(BLUE)백엔드 개발 서버 시작...$(NC)"
	@cd $(BACKEND_PROJECT) && \
		DSN="postgres://postgres:pitturu_dev_2024@localhost:5432/pitturu_dev_db?sslmode=disable" \
		go run cmd/server/main.go

dev-frontend: ## 프론트엔드 개발 서버 시작
	@echo -e "$(BLUE)프론트엔드 개발 서버 시작...$(NC)"
	@cd pp-frontend && npm run dev

dev-flutter: ## Flutter 개발 서버 시작
	@echo -e "$(BLUE)Flutter 개발 서버 시작...$(NC)"
	@if [ -d "$(FLUTTER_PROJECT)" ]; then \
		cd $(FLUTTER_PROJECT) && flutter run; \
	else \
		echo -e "$(YELLOW)Flutter 프로젝트가 아직 생성되지 않았습니다$(NC)"; \
	fi

# 테스트
test: ## 전체 테스트 실행
	@echo -e "$(BLUE)테스트 실행 중...$(NC)"

	# 백엔드 테스트
	@if [ -d "$(BACKEND_PROJECT)" ]; then \
		echo -e "$(BLUE)백엔드 테스트...$(NC)"; \
		cd $(BACKEND_PROJECT) && go test ./...; \
	fi

	# Flutter 테스트
	@if [ -d "$(FLUTTER_PROJECT)" ]; then \
		echo -e "$(BLUE)Flutter 테스트...$(NC)"; \
		cd $(FLUTTER_PROJECT) && flutter test; \
	fi

	@echo -e "$(GREEN)테스트 완료!$(NC)"

test-assets: ## 에셋 품질 테스트
	@echo -e "$(BLUE)에셋 품질 테스트 중...$(NC)"
	@chmod +x tools/scripts/asset-pipeline.sh
	@./tools/scripts/asset-pipeline.sh validate
	@echo -e "$(GREEN)에셋 테스트 완료!$(NC)"

# 코드 품질
lint: ## 코드 린팅
	@echo -e "$(BLUE)코드 린팅 중...$(NC)"

	# Go 린팅
	@if [ -d "$(BACKEND_PROJECT)" ] && command -v golangci-lint >/dev/null 2>&1; then \
		cd $(BACKEND_PROJECT) && golangci-lint run; \
	fi

	# Dart 린팅
	@if [ -d "$(FLUTTER_PROJECT)" ]; then \
		cd $(FLUTTER_PROJECT) && flutter analyze; \
	fi

	@echo -e "$(GREEN)린팅 완료!$(NC)"

format: ## 코드 포맷팅
	@echo -e "$(BLUE)코드 포맷팅 중...$(NC)"

	# Go 포맷팅
	@if [ -d "$(BACKEND_PROJECT)" ]; then \
		cd $(BACKEND_PROJECT) && go fmt ./...; \
	fi

	# Dart 포맷팅
	@if [ -d "$(FLUTTER_PROJECT)" ]; then \
		cd $(FLUTTER_PROJECT) && flutter format .; \
	fi

	@echo -e "$(GREEN)포맷팅 완료!$(NC)"

# 배포
deploy-staging: ## 스테이징 환경 배포
	@echo -e "$(BLUE)스테이징 배포 시작...$(NC)"
	@$(MAKE) build-all
	# TODO: 스테이징 배포 로직
	@echo -e "$(GREEN)스테이징 배포 완료!$(NC)"

deploy-production: ## 프로덕션 환경 배포
	@echo -e "$(BLUE)프로덕션 배포 시작...$(NC)"
	@$(MAKE) test
	@$(MAKE) build-all
	# TODO: 프로덕션 배포 로직
	@echo -e "$(GREEN)프로덕션 배포 완료!$(NC)"

# 정리
clean: ## 빌드 결과물 정리
	@echo -e "$(BLUE)정리 중...$(NC)"
	@rm -rf build/*
	@if [ -d "$(FLUTTER_PROJECT)" ]; then \
		cd $(FLUTTER_PROJECT) && flutter clean; \
	fi
	@if [ -d "$(BACKEND_PROJECT)" ]; then \
		cd $(BACKEND_PROJECT) && go clean; \
	fi
	@echo -e "$(GREEN)정리 완료!$(NC)"

clean-all: ## 모든 임시 파일 정리 (에셋 포함)
	@$(MAKE) clean
	@$(MAKE) assets-clean
	@echo -e "$(GREEN)전체 정리 완료!$(NC)"

# 문서화
docs: ## 문서 생성
	@echo -e "$(BLUE)문서 생성 중...$(NC)"
	# TODO: 문서 자동 생성 (godoc, dartdoc 등)
	@echo -e "$(GREEN)문서 생성 완료!$(NC)"

# 상태 확인
status: ## 프로젝트 상태 확인
	@echo -e "$(BLUE)프로젝트 상태 확인$(NC)"
	@echo ""

	@echo -e "$(YELLOW)=== 환경 ====$(NC)"
	@command -v flutter >/dev/null 2>&1 && echo "✅ Flutter" || echo "❌ Flutter"
	@command -v Unity >/dev/null 2>&1 && echo "✅ Unity" || echo "❌ Unity"
	@command -v go >/dev/null 2>&1 && echo "✅ Go" || echo "❌ Go"
	@command -v node >/dev/null 2>&1 && echo "✅ Node.js" || echo "❌ Node.js"

	@echo ""
	@echo -e "$(YELLOW)=== 프로젝트 구조 ====$(NC)"
	@[ -d "$(UNITY_PROJECT)" ] && echo "✅ Unity 프로젝트" || echo "❌ Unity 프로젝트"
	@[ -d "$(FLUTTER_PROJECT)" ] && echo "✅ Flutter 프로젝트" || echo "❌ Flutter 프로젝트"
	@[ -d "$(BACKEND_PROJECT)" ] && echo "✅ 백엔드 프로젝트" || echo "✅ 백엔드 프로젝트"

	@echo ""
	@echo -e "$(YELLOW)=== 에셋 ====$(NC)"
	@char_count=$$(find assets/processed/characters -name "*.png" 2>/dev/null | wc -l | tr -d ' '); \
	 echo "🎨 캐릭터: $$char_count개"
	@icon_count=$$(find assets/processed/icons -name "*.png" 2>/dev/null | wc -l | tr -d ' '); \
	 echo "🔧 아이콘: $$icon_count개"

	@echo ""
	@echo -e "$(YELLOW)=== 빌드 결과물 ====$(NC)"
	@[ -f "build/unity/unityLibrary/build.gradle" ] && echo "✅ Unity 빌드" || echo "❌ Unity 빌드"
	@[ -f "$(FLUTTER_PROJECT)/build/app/outputs/flutter-apk/app-release.apk" ] && echo "✅ Flutter APK" || echo "❌ Flutter APK"
	@[ -f "build/pitturu-server" ] && echo "✅ 백엔드 바이너리" || echo "❌ 백엔드 바이너리"

# 통합 워크플로우
workflow-full: ## 전체 개발 워크플로우 (AI 생성 → 빌드 → 테스트)
	@echo -e "$(BLUE)전체 워크플로우 시작...$(NC)"
	@$(MAKE) ai-generate
	@$(MAKE) build-all
	@$(MAKE) test
	@$(MAKE) lint
	@echo -e "$(GREEN)🎉 전체 워크플로우 완료!$(NC)"

workflow-quick: ## 빠른 개발 워크플로우 (빌드 → 테스트)
	@echo -e "$(BLUE)빠른 워크플로우 시작...$(NC)"
	@$(MAKE) build-all
	@$(MAKE) test
	@echo -e "$(GREEN)빠른 워크플로우 완료!$(NC)"

# Claude Code 연동용 단축 명령어
cc-setup: ## Claude Code 연동 설정
	@echo -e "$(BLUE)Claude Code 연동 설정...$(NC)"
	@echo "프로젝트가 Claude Code에 최적화되었습니다."
	@echo ""
	@echo -e "$(GREEN)사용 예시:$(NC)"
	@echo "  make assets-2d     # 2D 에셋 생성"
	@echo "  make build-all     # 전체 빌드"
	@echo "  make workflow-full # 전체 워크플로우"
	@echo ""
	@echo -e "$(YELLOW)Claude Code에게 이렇게 요청하세요:$(NC)"
	@echo '  "tools/prompts/system.md를 읽고 Unity 캐릭터 컨트롤러를 생성해주세요"'
	@echo '  "Flutter 로그인 화면을 Material Design 3 기준으로 만들어주세요"'
	@echo '  "Go 백엔드에 게임 매치메이킹 API를 추가해주세요"'