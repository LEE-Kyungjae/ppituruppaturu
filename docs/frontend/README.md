# Frontend - Next.js App

React/Next.js 14 기반의 게임 플랫폼 프론트엔드

## 🚀 Quick Start

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
```

## 🏗️ 아키텍처

### 기술 스택
- **Framework**: Next.js 14 + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand
- **WebSocket**: Native WebSocket API

### 주요 컴포넌트
- `components/chat/` - 실시간 채팅 시스템
- `components/games/` - 게임 시스템
- `components/payment/` - 결제 시스템
- `components/admin/` - 관리자 시스템

## 📁 프로젝트 구조

```
src/
├── components/     # React 컴포넌트
├── pages/         # Next.js 페이지
├── hooks/         # 커스텀 훅
├── stores/        # Zustand 상태 관리
├── services/      # API 서비스
└── utils/         # 유틸리티 함수
```

## 🎯 주요 기능

### 실시간 기능
- WebSocket 채팅
- 게임 상태 동기화
- 실시간 알림

### UI/UX
- 반응형 디자인
- 부드러운 애니메이션
- 접근성 준수

### 성능 최적화
- 코드 스플리팅
- 이미지 최적화
- SSR/SSG

## 🔧 개발 가이드

### 환경 변수
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### 컴포넌트 작성
- TypeScript 사용
- Props 인터페이스 정의
- Tailwind CSS 스타일링

### 테스트
```bash
npm test           # Jest + React Testing Library
npm run test:e2e   # E2E 테스트
```

## 📦 배포

```bash
# 프로덕션 빌드
npm run build
npm start

# Docker 배포
docker build -t frontend .
docker run -p 3000:3000 frontend
```