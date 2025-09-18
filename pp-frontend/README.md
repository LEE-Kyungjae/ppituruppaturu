# PittuRu Frontend - Next.js 14 App

**현대적인 React 웹 애플리케이션**: Next.js 14, App Router, TypeScript, Tailwind CSS를 활용한 게임 플랫폼 프론트엔드

## 🚀 Quick Start

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Turbo 모드)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 🏗️ 현대적인 아키텍처

### Next.js 14 App Router 구조
```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지
│   ├── globals.css        # 전역 스타일
│   ├── admin/             # 관리자 페이지
│   ├── auth/              # 인증 페이지
│   ├── games/             # 게임 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 UI 컴포넌트
│   ├── games/            # 게임 관련 컴포넌트
│   ├── chat/             # 채팅 시스템
│   └── layout/           # 레이아웃 컴포넌트
├── lib/                  # 유틸리티 라이브러리
│   └── utils.ts          # 공통 유틸리티
├── hooks/                # 커스텀 React 훅
├── stores/               # Zustand 상태 관리
├── types/                # TypeScript 타입 정의
└── services/             # API 서비스
```

## 🛠️ 기술 스택

### 핵심 기술
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.2+
- **UI Library**: React 18 + Radix UI
- **Styling**: Tailwind CSS 3.3+
- **Animation**: Framer Motion 10+
- **State Management**: Zustand 4+
- **Form**: React Hook Form + Zod
- **HTTP Client**: Axios + TanStack Query

### 개발 도구
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library + Playwright
- **Storybook**: 컴포넌트 개발 및 문서화
- **Bundle Analysis**: Next.js Bundle Analyzer
- **Pre-commit**: Husky + Lint-staged

## 🎯 주요 기능

### 🎮 게임 시스템
- 실시간 멀티플레이어 게임
- 리더보드 및 순위 시스템
- 게임 세션 관리
- 성과 및 업적 시스템

### 💬 채팅 시스템
- 실시간 메시징 (WebSocket)
- 다중 채팅방 지원
- 파일 및 이미지 공유
- 이모지 및 반응 시스템

### 👤 사용자 관리
- OAuth 로그인 (Kakao, Google)
- 프로필 관리
- 친구 시스템
- 사용자 설정

### 💳 결제 시스템
- 포인트 충전 (PortOne)
- 프리미엄 기능
- 구매 내역 관리
- 구독 관리

## 📦 스크립트 명령어

### 개발
```bash
npm run dev              # 개발 서버 (Turbo 모드)
npm run type-check       # TypeScript 타입 검사
npm run lint             # ESLint 실행 + 자동 수정
npm run lint:check       # ESLint 검사만
npm run format           # Prettier 코드 포맷팅
npm run format:check     # Prettier 검사만
```

### 테스트
```bash
npm run test             # Jest 단위 테스트 (watch)
npm run test:ci          # CI용 테스트 (coverage)
npm run test:coverage    # 커버리지 리포트
npm run test:e2e         # Playwright E2E 테스트
npm run test:e2e:ui      # E2E 테스트 UI 모드
```

### 빌드 & 분석
```bash
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run analyze          # 번들 분석 (ANALYZE=true)
npm run clean            # 빌드 파일 정리
```

### Storybook
```bash
npm run storybook        # Storybook 개발 서버
npm run build-storybook  # Storybook 빌드
```

## 🎨 UI 컴포넌트

### 디자인 시스템
- **Radix UI**: 접근성을 고려한 headless 컴포넌트
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Class Variance Authority**: 타입 안전한 컴포넌트 variants
- **Tailwind Merge**: 클래스 충돌 방지

### 주요 컴포넌트
```tsx
// 버튼 컴포넌트 예시
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  게임 시작
</Button>

// 폼 컴포넌트 예시
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
})
```

## 🔧 상태 관리

### Zustand Store 예시
```tsx
// stores/gameStore.ts
import { create } from 'zustand'

interface GameState {
  currentGame: Game | null
  score: number
  isPlaying: boolean
  startGame: (game: Game) => void
  updateScore: (score: number) => void
  endGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  score: 0,
  isPlaying: false,
  startGame: (game) => set({ currentGame: game, isPlaying: true, score: 0 }),
  updateScore: (score) => set({ score }),
  endGame: () => set({ isPlaying: false, currentGame: null }),
}))
```

## 🌐 API 통신

### TanStack Query 활용
```tsx
// hooks/useGames.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { gameService } from '@/services/gameService'

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: gameService.getAll,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useStartGame() {
  return useMutation({
    mutationFn: gameService.startSession,
    onSuccess: (data) => {
      // 게임 시작 성공 처리
    },
  })
}
```

## 🔐 인증 시스템

### Next.js Middleware 활용
```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*']
}
```

## 🧪 테스트 전략

### 단위 테스트
```tsx
// components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E 테스트
```tsx
// tests/e2e/game.spec.ts
import { test, expect } from '@playwright/test'

test('사용자가 게임을 시작할 수 있다', async ({ page }) => {
  await page.goto('/')
  
  await page.click('[data-testid="snake-game"]')
  await page.click('[data-testid="start-game"]')
  
  await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible()
  await expect(page.locator('[data-testid="score"]')).toContainText('0')
})
```

## 📱 반응형 디자인

### Tailwind CSS 활용
```tsx
const ResponsiveComponent = () => (
  <div className="
    container mx-auto px-4
    sm:px-6 sm:max-w-2xl
    md:px-8 md:max-w-4xl
    lg:px-12 lg:max-w-6xl
    xl:px-16 xl:max-w-7xl
  ">
    <div className="
      grid grid-cols-1
      md:grid-cols-2
      lg:grid-cols-3
      gap-4 md:gap-6 lg:gap-8
    ">
      {/* 컨텐츠 */}
    </div>
  </div>
)
```

## ⚡ 성능 최적화

### Next.js 14 최적화 기능
- **Turbo**: 개발 서버 성능 향상
- **Package Optimization**: 자주 사용하는 패키지 최적화
- **Image Optimization**: AVIF, WebP 지원
- **Bundle Analysis**: 번들 크기 분석
- **Code Splitting**: 자동 코드 분할

### 메모이제이션
```tsx
import { memo, useMemo, useCallback } from 'react'

const GameList = memo(({ games, onGameSelect }) => {
  const filteredGames = useMemo(
    () => games.filter(game => game.isActive),
    [games]
  )
  
  const handleGameClick = useCallback(
    (gameId: string) => onGameSelect(gameId),
    [onGameSelect]
  )
  
  return (
    <div>
      {filteredGames.map(game => (
        <GameCard 
          key={game.id} 
          game={game} 
          onSelect={handleGameClick}
        />
      ))}
    </div>
  )
})
```

## 🔍 SEO 최적화

### App Router Metadata API
```tsx
// app/games/[gameId]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const game = await getGame(params.gameId)
  
  return {
    title: `${game.name} - PittuRu PpattuRu`,
    description: game.description,
    openGraph: {
      title: game.name,
      description: game.description,
      images: [game.thumbnail],
    },
  }
}
```

## 🚀 배포

### 프로덕션 빌드
```bash
# 빌드 최적화
npm run build

# 정적 분석
npm run analyze

# 컨테이너 빌드
docker build -t pitturu-frontend .
docker run -p 3000:3000 pitturu-frontend
```

### Vercel 배포 (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

## 📚 추가 문서

- **Component Guide**: Storybook에서 확인 (`npm run storybook`)
- **API Documentation**: `/docs/api.md`
- **Deployment Guide**: `/docs/deployment.md`
- **Contributing**: `/CONTRIBUTING.md`

## 🤝 개발 가이드

### 컴포넌트 작성 규칙
1. TypeScript 필수 사용
2. Props 인터페이스 정의
3. 기본 props 값 설정
4. 접근성 고려 (ARIA 속성)
5. 반응형 디자인 적용

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드
chore: 기타 변경사항
```

## 🔧 개발 환경 설정

### VS Code 확장프로그램 (권장)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

### 환경 변수
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

**🎯 목표**: 최신 웹 기술을 활용한 현대적이고 성능 최적화된 게임 플랫폼 프론트엔드 구축