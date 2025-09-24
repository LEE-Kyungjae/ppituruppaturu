# 삐뚜루빠뚜루 하이브리드 아키텍처 (1인 개발 + AI 최적화)

## 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                   삐뚜루빠뚜루 Service Shell                     │
│                     (Flutter)                              │
├─────────────────────────────────────────────────────────────┤
│ • 로그인/회원가입 (카카오/구글)                                  │
│ • 랭킹/리더보드                                               │
│ • 커뮤니티/채팅                                               │
│ • 상점/결제 (PortOne)                                        │
│ • 설정/프로필                                                │
│ • 게임 런처                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕️ Platform Channel
┌─────────────────────────────────────────────────────────────┐
│                   삐뚜루빠뚜루 Game Core                        │
│                     (Unity)                                │
├─────────────────────────────────────────────────────────────┤
│ • 3D 페인트 배틀 게임                                          │
│ • 실시간 멀티플레이어                                          │
│ • 물리 엔진 (포물선 투사체)                                     │
│ • 3D 캐릭터/에셋                                             │
│ • 게임 로직/점수 계산                                          │
│ • Unity Netcode for GameObjects                           │
└─────────────────────────────────────────────────────────────┘
                            ↕️ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   Backend Services                         │
│                     (Go + PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│ • JWT 인증 시스템                                            │
│ • 게임 매치메이킹                                             │
│ • 랭킹/통계 관리                                              │
│ • 실시간 채팅                                                │
│ • 결제/포인트 시스템                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 AI 활용 전략

### 코드 생성 (Claude Code/Cursor)
- Unity C# 게임 로직 보일러플레이트
- Flutter UI 컴포넌트 자동 생성
- Platform Channel 브리지 코드
- Go REST API 엔드포인트
- 유닛 테스트 자동 생성

### 에셋 생성 (나노바나나/MidJourney)
- 2D 캐릭터 스프라이트 (표정/포즈 바리에이션)
- UI 아이콘/버튼 세트
- 배경 텍스처/환경 에셋
- 프로모션 이미지/스토어 스크린샷

### 3D 파이프라인 (AI + Blender)
- AI 컨셉 아트 → Triposr/Meshy → 3D 메쉬 초안
- Blender 자동 리토폴로지/리깅
- Unity Addressables 최적화

### 운영 자동화 (GPT/Claude)
- CI/CD 워크플로우 생성
- QA 시나리오 자동 생성
- 문서화/번역 자동화
- 버그 리포트 분석

## 📁 프로젝트 구조

```
ppituru-hybrid/
├── tools/
│   ├── prompts/
│   │   ├── system.md          # AI 가드레일/코딩 규칙
│   │   ├── asset-spec.md      # 디자인 시스템 규격
│   │   └── unity-flutter.md   # 브리지 인터페이스 규칙
│   ├── scripts/
│   │   ├── asset-pipeline.sh  # 2D/3D 자동 생성
│   │   ├── build-all.sh       # Unity + Flutter 통합 빌드
│   │   └── deploy.sh          # 스토어 배포 자동화
│   └── ai/
│       ├── prompts/           # 재사용 가능한 프롬프트 템플릿
│       └── outputs/           # AI 생성 결과물 임시 저장
├── unity-game/
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── GameCore/      # 게임 로직
│   │   │   ├── Networking/    # 멀티플레이어
│   │   │   └── FlutterBridge/ # Platform Channel 통신
│   │   ├── Prefabs/           # 게임 오브젝트
│   │   ├── Materials/         # 3D 머티리얼
│   │   └── Addressables/      # 동적 로딩 에셋
│   └── ProjectSettings/
├── flutter-shell/
│   ├── lib/
│   │   ├── screens/           # UI 스크린들
│   │   ├── widgets/           # 재사용 위젯
│   │   ├── services/          # API 통신/상태관리
│   │   ├── unity/             # Unity 통합 관리
│   │   └── generated/         # AI 생성 코드
│   ├── assets/
│   │   ├── images/            # UI 이미지/아이콘
│   │   ├── fonts/             # 폰트 파일
│   │   └── ai-generated/      # AI 생성 에셋
│   └── android/
├── backend/                   # 기존 Go 백엔드
├── assets/
│   ├── raw/                   # AI 생성 원본
│   ├── processed/             # 후처리 완료
│   └── dist/                  # 게임 준비 완료
└── .github/workflows/         # CI/CD 자동화
```

## 🔧 핵심 기술 스택

### Unity Game Core
- **엔진**: Unity 2023.3 LTS
- **네트워킹**: Unity Netcode for GameObjects
- **물리**: Unity Physics (현재 Three.js 로직 포팅)
- **에셋**: Unity Addressables (동적 로딩)
- **플랫폼**: Android/iOS (Flutter 임베딩)

### Flutter Service Shell
- **프레임워크**: Flutter 3.16+
- **상태관리**: Riverpod
- **로컬 저장**: Hive/SharedPreferences
- **네트워킹**: Dio/WebSocket
- **Unity 통합**: Platform Channels

### AI 파이프라인
- **코드**: Claude Code, Cursor, GitHub Copilot
- **2D 에셋**: 나노바나나, Stable Diffusion
- **3D 파이프라인**: Triposr → Blender → Unity
- **자동화**: GitHub Actions + AI 스크립트

## 🚀 개발 로드맵

### Phase 1: 기반 구축 (2주)
1. Unity 프로젝트 생성 + Three.js 게임 로직 포팅
2. Flutter 앱 + Unity 임베딩 설정
3. Platform Channel 브리지 구현
4. AI 가드레일/프롬프트 템플릿 작성

### Phase 2: 게임 코어 (3주)
1. Unity 3D 페인트 배틀 완성
2. 멀티플레이어 네트워킹
3. AI 생성 3D 캐릭터/환경 적용
4. 게임 밸런싱/튜닝

### Phase 3: 서비스 셸 (2주)
1. Flutter UI 완성 (AI 생성 디자인 시스템)
2. 로그인/랭킹/상점 기능
3. Unity ↔ Flutter 데이터 연동
4. 결제 시스템 통합

### Phase 4: 운영 자동화 (1주)
1. CI/CD 파이프라인 구축
2. AI QA/테스트 자동화
3. 스토어 배포 자동화
4. 모니터링/로깅 시스템

## 💡 AI 최적화 포인트

### 1. 코드 생산성 10x
- 보일러플레이트 자동 생성
- Unity/Flutter 브리지 코드 자동화
- 테스트 케이스 자동 작성

### 2. 에셋 생산성 5x
- 캐릭터 바리에이션 자동 생성
- UI 아이콘 세트 일괄 생성
- 3D 메쉬 초안 자동화

### 3. 운영 효율성 3x
- 빌드/배포 완전 자동화
- QA 시나리오 AI 생성
- 버그 분석 자동화

## ⚠️ 위험 요소 & 대응

### 기술적 위험
- **Unity ↔ Flutter 성능**: Platform Channel 오버헤드 최소화
- **3D 에셋 품질**: AI 초안 + 수동 최적화 하이브리드
- **빌드 복잡성**: 단계별 자동화 스크립트

### 운영적 위험
- **1인 체력 한계**: AI 자동화로 반복 작업 최소화
- **디자인 일관성**: 엄격한 디자인 시스템 가드레일
- **품질 관리**: 자동화된 테스트 + AI QA

## 🎯 성공 지표

### 개발 효율성
- 코드 생성 시간: 80% 단축
- 에셋 제작 시간: 70% 단축
- 빌드/배포 시간: 90% 단축

### 게임 품질
- 60fps 안정성 (Android 중급기)
- 10초 내 콜드 스타트
- 300MB 이하 APK 크기

### 서비스 운영
- 99% 업타임
- 자동 배포 성공률 95%
- AI QA 커버리지 80%