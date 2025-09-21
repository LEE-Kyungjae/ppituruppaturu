# 🎮 PittuRu - 물리 엔진 기반 멀티플레이어 게임 플랫폼

> **실시간 물리 시뮬레이션 기반 온라인 게임 플랫폼**

## 📁 프로젝트 구조

### 애플리케이션 코드 (이 레포지토리)
```
pp/
├── pp-backend/          # Go 기반 API 서버 + WebSocket 게임 서버
├── pp-frontend/         # Next.js 웹 애플리케이션 + 물리 게임 엔진
├── pp_mobile/           # Flutter 모바일 애플리케이션
└── docker-compose.dev.yml  # 개발환경 설정
```

### 인프라 관리 (별도 레포지토리)
```
📁 pp-infra/            # Oracle Cloud 기반 프로덕션 인프라
├── terraform/          # Infrastructure as Code
├── ansible/            # 자동 서버 설정
├── monitoring/         # Prometheus + Grafana
└── docker-compose.prod.yml  # 프로덕션 배포
```

## 🚀 개발 환경 시작

### 1. 사전 요구사항
```bash
# Go 1.21+, Node.js 18+, Docker, Docker Compose
```

### 2. 데이터베이스 시작
```bash
# PostgreSQL + Redis 컨테이너 실행
docker-compose -f docker-compose.dev.yml up -d
```

### 3. 백엔드 서버 실행
```bash
cd pp-backend
# 환경변수 설정
export DSN="postgres://postgres:pitturu_dev_2024@localhost:5432/pitturu_dev_db?sslmode=disable"
export JWT_SECRET="your-jwt-secret-key-here"
export REFRESH_SECRET="your-refresh-secret-key-here"

# 데이터베이스 마이그레이션
go run cmd/migrate/main.go up

# API 서버 + 게임 서버 동시 실행
make run
```

### 4. 프론트엔드 서버 실행
```bash
cd pp-frontend
npm install
npm run dev
```

## 🎯 게임 기능

### 물리 엔진 게임들
- **물리 점프 게임**: 중력과 물리 법칙 기반 플랫폼 게임
- **물리 캐치 게임**: 실시간 물체 낙하 캐치 게임
- **물리 밸런스 게임**: 균형감각 기반 퍼즐 게임
- **물리 배틀로얄**: 20명 동시 접속 생존 게임

### 멀티플레이어 시스템
- **실시간 WebSocket 통신**: 60fps 게임 상태 동기화
- **룸 기반 매칭**: 최대 20명 동시 접속
- **크로스 플랫폼**: 웹 ↔ 모바일 크로스플레이

## 🛠 기술 스택

### Backend
- **Go 1.21**: 고성능 API 서버
- **Gorilla WebSocket**: 실시간 게임 통신
- **PostgreSQL 15**: 사용자 데이터 및 게임 기록
- **Redis 7**: 세션 관리 및 캐싱

### Frontend
- **Next.js 14**: 서버사이드 렌더링
- **Matter.js**: 2D 물리 엔진
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 반응형 UI

### Mobile
- **Flutter 3.19**: 크로스 플랫폼 모바일

## 🔗 접속 정보

### 개발 환경
- **웹 애플리케이션**: http://localhost:3000
- **API 서버**: http://localhost:8080
- **게임 서버**: ws://localhost:8082
- **데이터베이스**: localhost:5432

### 프로덕션 환경
- **웹사이트**: http://152.67.201.101 (배포 완료 🚀)
- **API**: http://152.67.201.101/api
- **배포 상태**: ✅ Ansible + GitHub Actions 자동 배포
- **인프라 관리**: `/Users/ze/work/pp-infra/`

## 📊 모니터링

개발 중 시스템 상태 확인:
```bash
# 백엔드 헬스체크
curl http://localhost:8080/health

# 게임 서버 상태
curl http://localhost:8082/health

# 데이터베이스 연결 확인
docker exec pitturu_postgres_dev pg_isready -U postgres
```

## 🚨 중요 사항

### 역할 구분
- **이 레포지토리 (pp/)**: 게임 애플리케이션 개발에만 집중
- **pp-infra 레포지토리**: 모든 인프라, 배포, 모니터링 작업

### 개발 워크플로우
1. 기능 개발은 이 레포지토리에서 진행
2. 로컬 테스트는 `docker-compose.dev.yml` 사용
3. 프로덕션 배포는 `pp-infra` 레포지토리에서 관리

### 포트 사용 현황
- `3000`: Next.js 프론트엔드
- `8080`: Go API 서버
- `8082`: Go WebSocket 게임 서버
- `5432`: PostgreSQL
- `6379`: Redis

## 📞 지원

문제가 발생하면:
1. 로컬 로그 확인: `docker-compose logs`
2. 게임 서버 로그: 백엔드 콘솔 출력 확인
3. GitHub Issues를 통한 문의# Trigger deployment
