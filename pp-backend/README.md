# 🎮 PittuRu PpattuRu - Backend API Server

> **Go 기반 고성능 게이밍 플랫폼 백엔드** - JWT 인증, WebSocket, PostgreSQL, Redis 통합

실시간 채팅, 소셜 로그인, 게임 시스템, 결제 연동을 제공하는 RESTful API 서버입니다.

## ✨ 핵심 기능

### 🔐 인증 & 권한
- JWT 기반 토큰 인증 (Access + Refresh)
- 소셜 로그인 (카카오, 구글)
- 역할 기반 접근 제어 (RBAC)
- 보안 강화 (bcrypt, CSRF 방지)

### 💬 실시간 통신
- WebSocket 기반 채팅 시스템
- 다중 채팅방 지원
- 온라인 상태 추적
- 실시간 게임 상태 동기화

### 🎮 게임 시스템
- 미니게임 프레임워크
- 리더보드 및 점수 추적
- 게임 세션 관리
- 포인트 기반 보상 시스템

### 💰 결제 시스템
- TossPayments 통합
- 인앱 구매 (IAP)
- 포인트 시스템
- 거래 내역 및 분석

## 🏗️ 아키텍처

### 기술 스택
- **언어**: Go 1.21+
- **웹 프레임워크**: Gin HTTP Framework
- **데이터베이스**: PostgreSQL 13+ with GORM
- **캐시**: Redis 6+
- **인증**: JWT tokens
- **실시간**: Gorilla WebSocket

### 디렉토리 구조
```
backend/
├── cmd/server/            # 애플리케이션 진입점
├── internal/
│   ├── api/              # HTTP 핸들러 및 라우트
│   ├── service/          # 비즈니스 로직
│   ├── repository/       # 데이터 액세스 계층
│   ├── model/            # 데이터 모델
│   ├── auth/             # JWT 인증 로직
│   ├── chat/             # WebSocket 채팅 시스템
│   └── middleware/       # HTTP 미들웨어
├── pkg/                  # 공유 패키지
├── docs/                 # API 문서
│   ├── api/              # API 스펙 (Swagger)
│   ├── development/      # 개발 가이드
│   └── deployment/       # 배포 가이드
├── config/               # 설정 파일
├── scripts/              # 유틸리티 스크립트
└── shared/               # 공통 타입 정의
```

## 🚀 빠른 시작

### 사전 요구사항
- Go 1.21+
- PostgreSQL 13+
- Redis 6+
- Docker (선택사항)

### 로컬 개발 환경 구성

1. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일 수정
   ```

2. **의존성 설치**
   ```bash
   go mod download
   ```

3. **데이터베이스 설정**
   ```bash
   # PostgreSQL 실행
   psql -c "CREATE DATABASE pitturu_dev;"
   
   # Redis 실행
   redis-server
   ```

4. **서버 실행**
   ```bash
   go run cmd/server/main.go
   ```

### Docker로 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f api
```

## 📊 API 엔드포인트

### 인증
```bash
POST /api/v1/auth/login      # 로그인
POST /api/v1/auth/refresh    # 토큰 갱신
POST /api/v1/auth/logout     # 로그아웃
POST /api/v1/auth/register   # 회원가입
```

### 소셜 로그인
```bash
GET  /api/v1/auth/kakao      # 카카오 로그인 URL
POST /api/v1/auth/kakao/callback # 카카오 콜백
GET  /api/v1/auth/google     # 구글 로그인 URL
POST /api/v1/auth/google/callback # 구글 콜백
```

### 실시간 채팅
```bash
GET  /api/v1/chat/ws         # WebSocket 연결
POST /api/v1/chat/rooms      # 채팅방 생성
GET  /api/v1/chat/messages   # 메시지 조회
```

### 게임 시스템
```bash
GET  /api/v1/games           # 게임 목록
POST /api/v1/games/{id}/play # 게임 시작
POST /api/v1/games/score     # 점수 제출
GET  /api/v1/games/leaderboard # 리더보드
```

### 사용자 관리
```bash
GET  /api/v1/users/profile   # 프로필 조회
PUT  /api/v1/users/profile   # 프로필 수정
GET  /api/v1/users/friends   # 친구 목록
```

## 🔧 설정

### 환경 변수
```env
# 서버 설정
PORT=8080
GIN_MODE=release
APP_ENV=production

# 데이터베이스
DSN="postgres://user:pass@localhost:5432/db?sslmode=disable"
REDIS_URL="redis://localhost:6379"

# JWT 토큰
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here

# 소셜 로그인
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# TossPayments
TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key
```

## 🧪 테스트

### 단위 테스트 실행
```bash
# 모든 테스트 실행
go test ./... -v

# 커버리지 포함
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```

### 특정 테스트 실행
```bash
# 서비스 계층 테스트
go test ./internal/service/... -v

# 통합 테스트 (Docker 필요)
go test ./internal/repository/... -v
```

## 📈 성능 최적화

### 데이터베이스
- 연결 풀 최적화
- 인덱스 활용
- 쿼리 최적화
- N+1 문제 해결

### 캐싱 전략
- Redis 세션 저장소
- API 응답 캐싱
- 데이터베이스 쿼리 캐싱
- 정적 자산 CDN

### 메모리 관리
- 고루틴 풀 사용
- 메모리 누수 방지
- GC 튜닝
- 프로파일링

## 🔍 모니터링

### 헬스 체크
```bash
# 기본 헬스 체크
GET /health

# 상세 헬스 체크
GET /api/v1/health/detailed
```

### 메트릭
- Prometheus 메트릭 수집
- HTTP 요청 지연시간
- 데이터베이스 연결 상태
- 활성 WebSocket 연결 수

### 로깅
```go
// 구조화된 로깅
log.WithFields(log.Fields{
    "user_id": userID,
    "action":  "login",
    "ip":      clientIP,
}).Info("User login successful")
```

## 🛡️ 보안

### 인증 보안
- bcrypt 패스워드 해싱
- JWT 토큰 만료 관리
- 리프레시 토큰 순환
- 브루트포스 방지

### API 보안
- CORS 설정
- 속도 제한
- 입력 검증
- SQL 인젝션 방지

### 데이터 보안
- 데이터베이스 암호화
- 민감정보 마스킹
- 감사 로깅
- GDPR 준수

## 🚢 배포

### 프로덕션 배포
```bash
# Docker 이미지 빌드
docker build -t pitturu-backend .

# 프로덕션 환경 실행
docker-compose -f docker-compose.prod.yml up -d
```

### 무중단 배포
- 헬스 체크 엔드포인트
- 우아한 종료 (Graceful Shutdown)
- 롤링 업데이트
- 블루-그린 배포

## 📋 개발 가이드

### 코딩 스타일
- Go 표준 포매팅 (`go fmt`)
- golangci-lint 사용
- 의미있는 변수명
- 포괄적인 테스트

### Git 워크플로우
- Feature Branch 전략
- Pull Request 리뷰
- 자동화된 CI/CD
- 시맨틱 버저닝

### 기여 가이드
1. 이슈 생성
2. Feature Branch 생성
3. 코드 작성 및 테스트
4. Pull Request 제출
5. 코드 리뷰 및 머지

## 📞 지원

- 📧 이메일: dev@pitturu.com
- 📖 문서: [API Documentation](docs/api/)
- 🐛 이슈: GitHub Issues

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.