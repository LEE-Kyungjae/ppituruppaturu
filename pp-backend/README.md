# PittuRu Backend - Go API Server

**현대적인 Go 웹 애플리케이션**: Gin, GORM, PostgreSQL, Redis를 활용한 고성능 게임 플랫폼 백엔드

## 🚀 Quick Start

```bash
# 개발 환경 설정
make dev-setup

# 개발 서버 실행 (추천)
make run

# 또는 직접 실행
go run ./cmd/server
```

## 🏗️ 프로젝트 구조

이 프로젝트는 **Go 표준 프로젝트 레이아웃**을 따릅니다:

```
pp-backend/
├── cmd/                    # 실행 가능한 애플리케이션들
│   ├── server/            # 메인 서버 애플리케이션
│   └── migrate/           # 데이터베이스 마이그레이션 도구
├── internal/              # 내부 애플리케이션 코드
│   ├── config/           # 설정 관리
│   ├── handler/          # HTTP 핸들러 (컨트롤러)
│   ├── service/          # 비즈니스 로직
│   ├── repository/       # 데이터 액세스 계층
│   ├── middleware/       # HTTP 미들웨어
│   ├── auth/            # 인증 관련
│   └── models/          # 데이터 모델
├── pkg/                   # 외부에서 사용 가능한 라이브러리 코드
│   ├── logger/          # 로깅 유틸리티
│   ├── response/        # API 응답 표준화
│   └── shared/          # 공유 타입 및 유틸리티
├── api/v1/               # API 정의 및 문서
├── build/                # 빌드 결과물
├── test/                 # 추가 테스트 파일들
└── scripts/              # 빌드, 설치, 분석 등의 스크립트
```

## 🛠️ 기술 스택

### 핵심 기술
- **언어**: Go 1.23+
- **웹 프레임워크**: Gin
- **ORM**: GORM
- **데이터베이스**: PostgreSQL 15+
- **캐시**: Redis 7+
- **인증**: JWT + OAuth (Kakao)

### 외부 서비스
- **결제**: PortOne 결제 시스템
- **로깅**: Logrus + Lumberjack (파일 로테이션)
- **문서**: Swagger/OpenAPI
- **테스트**: Testify

## 📡 API 엔드포인트

### 인증
- `POST /api/v1/auth/login` - 이메일 로그인
- `POST /api/v1/auth/register` - 회원가입  
- `POST /api/v1/auth/kakao` - 카카오 OAuth 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신

### 사용자 관리
- `GET /api/v1/users/profile` - 프로필 조회
- `PUT /api/v1/users/profile` - 프로필 수정
- `POST /api/v1/users/avatar` - 아바타 업로드

### 게임
- `GET /api/v1/games` - 게임 목록
- `POST /api/v1/games/:id/sessions` - 게임 세션 시작
- `GET /api/v1/leaderboard/:game` - 리더보드

### 결제
- `POST /api/v1/payments/sessions` - 결제 세션 생성
- `POST /api/v1/payments/verify` - 결제 검증
- `GET /api/v1/payments/history` - 결제 내역

### 실시간 기능
- `GET /ws` - WebSocket 연결 (채팅, 게임 상태)

### 관리자
- `GET /api/v1/admin/dashboard` - 대시보드 데이터
- `GET /api/v1/admin/users` - 사용자 관리

## 🔧 개발 가이드

### Makefile 명령어

```bash
# 개발 환경
make dev-setup          # 개발 도구 설치
make run                # 개발 서버 실행
make dev                # 라이브 리로드 서버 (Air)

# 빌드
make build              # 바이너리 빌드
make build-all          # 멀티플랫폼 빌드

# 테스트
make test               # 단위 테스트
make test-coverage      # 커버리지 리포트
make test-integration   # 통합 테스트

# 코드 품질
make lint               # 코드 린트
make format             # 코드 포맷팅
make vet                # go vet 실행

# 데이터베이스
make db-migrate-up      # 마이그레이션 실행
make db-migrate-create NAME=new_migration  # 새 마이그레이션 생성

# Docker
make docker-build       # 이미지 빌드
make docker-run         # 컨테이너 실행
```

### 환경 변수

`.env` 파일 예시:
```bash
# 서버 설정
PORT=8080
GIN_MODE=debug

# 데이터베이스
DATABASE_URL=postgres://user:password@localhost:5432/pitturu?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE_HOURS=24

# OAuth
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# PortOne 결제
PORTONE_STORE_ID=your-portone-store-id
PORTONE_API_KEY=your-portone-api-key

# 로깅
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🗄️ 데이터베이스

### 주요 테이블
- `users` - 사용자 기본 정보
- `refresh_tokens` - JWT 리프레시 토큰
- `user_profiles` - 사용자 상세 프로필
- `friends` - 친구 관계
- `messages` - 채팅 메시지
- `chat_rooms` - 채팅방 관리
- `games` - 게임 정보
- `game_sessions` - 게임 세션
- `payments` - 결제 내역
- `community_posts` - 커뮤니티 게시글

### 마이그레이션 관리
```bash
# 새 마이그레이션 생성
make db-migrate-create NAME=add_user_avatar

# 마이그레이션 실행
make db-migrate-up

# 마이그레이션 되돌리기 (주의!)
make db-migrate-down
```

## 🔐 보안

### 구현된 보안 기능
- **JWT 토큰 인증** + Refresh Token 로테이션
- **비밀번호 해싱** (bcrypt)
- **CORS 정책** 설정
- **Rate Limiting** (IP 기반)
- **SQL Injection 방지** (GORM 사용)
- **XSS 방지** (입력 검증)

### 보안 설정 파일
- `internal/config/security.go` - 보안 설정
- `internal/middleware/security.go` - 보안 미들웨어

## 🧪 테스트

### 테스트 구조
```
internal/
├── handler/
│   ├── user_test.go          # 핸들러 단위 테스트
│   └── auth_test.go
├── service/
│   ├── user_service_test.go  # 서비스 단위 테스트
│   └── auth_service_test.go
└── repository/
    ├── user_repo_test.go     # 리포지토리 단위 테스트
    └── auth_repo_test.go
```

### 테스트 실행
```bash
# 전체 테스트
make test

# 커버리지 포함
make test-coverage

# 특정 패키지 테스트
go test ./internal/handler -v

# 벤치마크 테스트
make test-benchmark
```

## 📦 배포

### 프로덕션 빌드
```bash
# 바이너리 빌드
make build

# 실행
./bin/server
```

### Docker 배포
```bash
# 이미지 빌드
make docker-build

# 컨테이너 실행
make docker-run

# 또는 직접 실행
docker run -p 8080:8080 --env-file .env pitturu-backend:latest
```

### 환경별 설정
- **Development**: `.env` 파일 사용
- **Staging**: 환경 변수 직접 설정
- **Production**: Docker secrets 또는 외부 설정 관리 도구

## 🔍 모니터링

### Health Check
```bash
curl http://localhost:8080/health
```

### 로깅
- **개발**: 콘솔 출력 (color)
- **운영**: 파일 출력 (JSON 형식)
- **로그 로테이션**: Lumberjack 사용

### 메트릭스
- `/metrics` 엔드포인트에서 Prometheus 메트릭 제공
- 주요 메트릭: HTTP 요청 수/시간, 데이터베이스 연결 수, 메모리 사용량

## 📚 추가 문서

- **API 문서**: `/swagger/index.html` (개발 모드)
- **아키텍처**: `docs/architecture.md`
- **배포 가이드**: `docs/deployment.md`
- **기여 가이드**: `CONTRIBUTING.md`

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
pg_isready -h localhost -p 5432

# 연결 테스트
psql -h localhost -U pitturu -d pitturu
```

#### 2. Redis 연결 실패
```bash
# Redis 상태 확인
redis-cli ping

# Redis 서버 시작
redis-server
```

#### 3. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8080

# 프로세스 종료
kill -9 <PID>
```

## 🤝 기여

1. Fork the project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 `LICENSE` 파일을 확인하세요.

---

**🎯 목표**: 안정적이고 확장 가능한 고성능 게임 플랫폼 백엔드 구축