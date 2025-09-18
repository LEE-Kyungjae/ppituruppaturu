# 개발 가이드

PittuRu PpattuRu 플랫폼 개발을 위한 가이드

## 🚀 시작하기

### 개발 환경 설정

```bash
# 1. 레포지토리 클론
git clone <repository-url>
cd pitturu-ppaturu

# 2. Frontend 설정
cd frontend
npm install
cp .env.example .env.local
# .env.local 파일에서 환경 변수 설정

# 3. Backend 설정  
cd ../backend
go mod tidy
cp .env.example .env
# .env 파일에서 환경 변수 설정

# 4. 개발 서버 실행
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && go run main.go
```

### 필수 도구
- **Node.js** 18+
- **Go** 1.21+
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** (선택사항)

## 📋 개발 규칙

### Git 워크플로우
```bash
# 1. 기능 브랜치 생성
git checkout -b feature/new-feature

# 2. 개발 및 커밋
git add .
git commit -m "feat: add new feature"

# 3. 푸시 및 PR 생성
git push origin feature/new-feature
# GitHub에서 Pull Request 생성
```

### 커밋 메시지 규칙
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 코드 스타일 변경
- `refactor:` 코드 리팩토링

### 코드 스타일
- **Frontend**: ESLint + Prettier 사용
- **Backend**: `go fmt` 사용
- **공통**: 의미있는 변수명과 함수명

## 🔧 개발 팁

### API 테스트
```bash
# 건강 상태 확인
curl http://localhost:8080/health

# 사용자 인증 테스트
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 데이터베이스 관리
```bash
# 마이그레이션 실행
go run main.go migrate

# 테스트 데이터 추가
go run main.go seed
```

### 프론트엔드 빌드
```bash
# 개발 빌드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 🧪 테스트

### 단위 테스트
```bash
# Frontend 테스트
cd frontend && npm test

# Backend 테스트
cd backend && go test ./...
```

### E2E 테스트
```bash
# Playwright 실행
cd frontend && npm run test:e2e
```

## 🚨 문제 해결

### 자주 발생하는 문제

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000  # Frontend
lsof -i :8080  # Backend

# 프로세스 종료
kill -9 <PID>
```

#### 데이터베이스 연결 실패
- PostgreSQL 서비스 상태 확인
- 환경 변수 설정 확인
- 네트워크 방화벽 확인

#### Redis 연결 실패
```bash
# Redis 서버 시작
redis-server

# Redis 연결 테스트
redis-cli ping
```

## 📞 도움말

- **기술 문의**: GitHub Issues
- **개발 팀**: Slack #dev-channel
- **문서 업데이트**: 이 파일을 직접 수정하여 PR 생성