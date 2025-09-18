# Backend - Go API Server

Go + Gin 기반의 게임 플랫폼 백엔드 API 서버

## 🚀 Quick Start

```bash
# 환경설정
cp .env.example .env
# .env 파일에서 데이터베이스 설정 등 편집

# 실행
go mod tidy
go run main.go  # http://localhost:8080
```

## 🏗️ 아키텍처

### 기술 스택
- **Framework**: Go + Gin
- **Database**: PostgreSQL + GORM
- **Cache**: Redis  
- **Auth**: JWT + OAuth (Kakao)
- **Payment**: PortOne 결제 시스템
- **WebSocket**: Real-time communication

### 프로젝트 구조
```
internal/
├── handler/       # HTTP 핸들러
├── service/       # 비즈니스 로직
├── repository/    # 데이터 접근 계층
├── middleware/    # 미들웨어
└── models/        # 데이터 모델
```

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/kakao` - 카카오 로그인

### 사용자
- `GET /api/users/profile` - 프로필 조회
- `PUT /api/users/profile` - 프로필 수정

### 결제
- `POST /api/v1/payments/sessions` - 결제 세션 생성
- `POST /api/v1/payments/verify` - 결제 검증
- `GET /api/payments/history` - 결제 내역

### 관리자
- `GET /api/v1/admin/dashboard` - 대시보드 데이터
- `GET /api/v1/admin/users` - 사용자 관리

### 실시간
- `GET /ws` - WebSocket 연결

## 🗄️ 데이터베이스

PostgreSQL + GORM 사용, `internal/migrations/`에서 마이그레이션 관리

### 주요 테이블
- `users` - 사용자 정보
- `user_sessions` - 세션 관리
- `payments` - 결제 내역
- `chat_messages` - 채팅 메시지

## 🔧 환경 변수

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost/db_name

# Redis  
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# OAuth
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# Payment
PORTONE_STORE_ID=your-portone-store-id
PORTONE_API_KEY=your-portone-api-key
```

## 🔐 보안

- JWT 토큰 기반 인증
- CORS 정책 적용
- Rate Limiting
- SQL Injection 방지

## 📦 배포

```bash
# 빌드
go build -o main .

# Docker 배포
docker build -t backend .
docker run -p 8080:8080 backend
```