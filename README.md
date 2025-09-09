# 🎮 PITTURU - PortOne 결제 통합 플랫폼

Real-time gaming platform with PortOne payment integration

## ⚡ Quick Start

```bash
# Frontend
cd pp-frontend && npm install && npm run dev

# Backend  
cd pp-backend && go mod tidy && go run main.go
```

**즉시 사용 가능** - Mock 모드로 바로 테스트할 수 있습니다.

## 🏗️ Architecture

```
pp-backend/     # Go + Gin + PostgreSQL
pp-frontend/    # Next.js + React + TypeScript  
```

## 💳 Payment Setup

### Development (Mock Mode)
현재 상태 그대로 사용 - 별도 설정 불필요

### Production (Real Payment)
1. [PortOne Console](https://admin.portone.io)에서 정보 확인
2. Backend: `cp .env.example .env` → PortOne 정보 입력
3. Frontend: `cp .env.example .env.local` → Store ID 입력

## 🎯 Features

### ✅ 완료된 기능
- PortOne 결제 게이트웨이 완전 통합
- 관리자 대시보드 (매출, 회원, 통계)
- 실시간 알림 시스템
- 회원 관리 및 결제 내역
- Flutter 스타일 UI 디자인

### 🚧 개발 예정
- 웹훅 엔드포인트 구현
- 정기 결제 기능
- 모바일 앱

## 🔧 Configuration

### Backend (.env)
```env
PORTONE_STORE_ID=your_store_id
PORTONE_API_KEY=your_api_key  
PORTONE_API_SECRET=your_secret
DSN=postgres://user:pass@host/db
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🚀 Deployment

### Development
```bash
# Backend
go run main.go

# Frontend
npm run dev
```

### Production
```bash
# Backend
go build -o app && ./app

# Frontend  
npm run build && npm start
```

## 📁 Project Structure

```
pp-backend/
├── internal/
│   ├── portone/         # PortOne client
│   ├── handler/         # API handlers
│   ├── service/         # Business logic
│   └── repository/      # Data access
└── main.go

pp-frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Next.js pages
│   ├── services/       # API services
│   └── config/         # Configuration
└── package.json
```

## 🔒 Security

- JWT 기반 인증
- CORS 설정
- Rate limiting
- Input validation
- Environment variables for secrets

---

**Generated with Claude Code** • Last updated: 2024-09-09