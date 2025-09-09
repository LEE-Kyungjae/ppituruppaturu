<!-- /Users/ze/work/go/docs/architecture.md -->
# Chat & Gaming Platform - 기술 아키텍처 문서

## 📋 개요

채팅과 게임이 통합된 종합 멀티플레이어 플랫폼으로, React/Next.js 프론트엔드와 Go 백엔드로 구성된 풀스택 웹 애플리케이션입니다. 실시간 채팅, 소셜 기능, 컨텐츠 관리, 수익화 시스템을 포함한 완전한 게이밍 생태계를 제공합니다.

## 🎯 핵심 기술 스택

### Frontend
- **Framework**: Next.js 14 + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API + WebRTC
- **Testing**: Jest + React Testing Library
- **Real-time**: WebSocket, Server-Sent Events
- **Media**: WebRTC, Web Audio API, MediaRecorder API

### Backend  
- **Language**: Go 1.21+
- **Web Framework**: Gin (github.com/gin-gonic/gin)
- **Database ORM**: GORM (gorm.io/gorm)
- **Cache**: Redis (github.com/redis/go-redis/v9)
- **WebSocket**: Gorilla WebSocket (github.com/gorilla/websocket)
- **Authentication**: JWT (github.com/golang-jwt/jwt/v5)
- **Password Hashing**: bcrypt (golang.org/x/crypto/bcrypt)
- **File Storage**: Local/Cloud Storage with multipart upload
- **Analytics**: Custom metrics collection and aggregation

## Layered Architecture

The application follows a classic layered architecture to promote separation of concerns, testability, and maintainability.

```
+----------------------------------------------------+
|                       main.go                      |
| (Initialization, Dependency Injection, HTTP Server)  |
+------------------------+---------------------------+
                         |
           +-------------+-------------+
           |   (HTTP Requests)   |
           v                     v
+------------------------+---------------------------+
|                  Gin Router & Middleware           |
| (CORS, Rate Limiting, Logging, Auth Middleware)    |
+------------------------+---------------------------+
                         |
           +-------------+-------------+
           | (Request Context)   |
           v                     v
+------------------------+---------------------------+
|                        Handlers                    |
|      (e.g., AuthHandler, UserHandler)              |
| (Parses requests, calls services, formats responses) |
+------------------------+---------------------------+
                         |
           +-------------+-------------+
           |  (Go function calls)  |
           v                     v
+------------------------+---------------------------+
|                        Services                    |
|      (e.g., TokenService)                          |
| (Contains core business logic, independent of HTTP) |
+------------------------+---------------------------+
                         |
           +-------------+-------------+
           |   (Go interfaces)   |
           v                     v
+------------------------+---------------------------+
|                      Repositories                  |
| (e.g., UserRepository, RefreshTokenRepository)     |
| (Data access layer, abstracts data source)         |
+------------------------+---------------------------+
                         |
           +-------------+-------------+
           | (In-memory maps)    |
           v                     v
+------------------------+---------------------------+
|                     Data Source                    |
|             (In-Memory Store / Database)           |
+----------------------------------------------------+
```

### Layers

1.  **`main.go` (Entrypoint)**: The outermost layer responsible for reading configuration, initializing all components (repositories, services, handlers), setting up the dependency injection container, and starting the HTTP server with graceful shutdown.

2.  **`internal/handler` (Handlers)**: This layer is responsible for handling HTTP requests. It parses request bodies and parameters, calls the appropriate service methods to perform business logic, and formats the HTTP response (using response helpers). It is the bridge between the web and the application's core logic.

3.  **`internal/auth` & `internal/service` (Services)**: This layer contains the core business logic of the application. For example, the `TokenService` knows how to create and validate JWTs. This layer is completely independent of the web layer (it knows nothing about HTTP or Gin).

4.  **`internal/repository` (Repositories)**: This layer is responsible for data storage and retrieval. It defines interfaces (`UserRepository`) that the services use, and provides concrete implementations (`inMemoryUserRepository`). This decouples the business logic from the data storage details, making it easy to swap the in-memory store for a real database (like PostgreSQL or Redis) in the future without changing the service layer.

## 🚀 주요 기능 모듈

### 1. 고급 채팅 시스템 (`frontend/src/components/chat/`)
- **AdvancedChatSystem.tsx**: 다중 룸 지원, 실시간 메시징, 타이핑 표시기
- **EmojiStickerSystem.tsx**: 이모지 시스템, 프리미엄 스티커 팩, 피부톤 지원
- **FileMediaSystem.tsx**: 드래그앤드롭 파일 업로드, 미디어 미리보기, 진행률 추적
- **VoiceChatSystem.tsx**: WebRTC 음성 채팅, 음성 활동 감지, 다중 채널 지원
- **ChatRoomManagement.tsx**: 룸 생성/관리, 사용자 권한, 모더레이션 도구

### 2. 소셜 시스템 (`frontend/src/components/social/`)
- **UserMatchingSystem.tsx**: AI 기반 사용자 매칭, 호환성 알고리즘, 고급 필터링
- **FriendSystem.tsx**: 친구 관리, 그룹화, 활동 추적, 즐겨찾기 시스템

### 3. 관리자 시스템 (`frontend/src/components/admin/`)
- **ContentManagementSystem.tsx**: 컨텐츠 생명주기 관리, SEO 최적화, 다국어 지원
- **AdminDashboard.tsx**: 실시간 시스템 모니터링, 사용자 분석, 성능 추적

### 4. 알림 시스템 (`frontend/src/components/notifications/`)
- **NotificationSystem.tsx**: 실시간 토스트 알림, 데스크톱 알림, 우선순위 기반 필터링

### 5. 데이터 분석 (`frontend/src/components/analytics/`)
- **AnalyticsSystem.tsx**: 다차원 분석 대시보드, 수익 분석, 사용자 행동 추적

## 🔧 핵심 기술 특징

### Real-time Communication
- **WebSocket**: 실시간 메시징, 게임 상태 동기화
- **WebRTC**: P2P 음성/비디오 채팅, 파일 전송
- **Server-Sent Events**: 일방향 실시간 업데이트

### Advanced UI/UX
- **Framer Motion**: 60fps 부드러운 애니메이션
- **Responsive Design**: 모바일 퍼스트 반응형 디자인
- **Accessibility**: WCAG 2.1 준수, 키보드 네비게이션

### Performance Optimization
- **Code Splitting**: 라우트 기반 번들 분할
- **Lazy Loading**: 컴포넌트 지연 로딩
- **Caching**: Redis 기반 데이터 캐싱
- **CDN Integration**: 정적 자산 최적화

### Security Features
- **JWT Authentication**: Refresh token rotation
- **CSRF Protection**: 크로스 사이트 요청 위조 방지
- **XSS Prevention**: 콘텐츠 보안 정책
- **Rate Limiting**: API 남용 방지

## 📊 데이터베이스 스키마

### 사용자 관련
```sql
Users (id, username, email, password_hash, profile_data, created_at)
UserProfiles (user_id, avatar, bio, preferences, settings)
Friendships (user_id, friend_id, status, created_at)
UserSessions (user_id, token, expires_at, device_info)
```

### 채팅 시스템
```sql
ChatRooms (id, name, type, settings, created_at)
Messages (id, room_id, user_id, type, content, metadata, created_at)
MessageReactions (message_id, user_id, reaction_type)
RoomMembers (room_id, user_id, role, permissions, joined_at)
```

### 컨텐츠 관리
```sql
Contents (id, type, title, body, author_id, status, published_at)
Categories (id, name, description, parent_id)
ContentTags (content_id, tag_name)
ContentStats (content_id, views, likes, shares, comments)
```

### 게임 시스템
```sql
Games (id, name, description, settings, created_at)
GameSessions (id, game_id, players, status, started_at, ended_at)
PlayerStats (user_id, game_id, wins, losses, rating, play_time)
Achievements (id, name, description, requirements, reward)
```

## 🔄 배포 아키텍처

### Development
```
Frontend (Next.js) → Backend (Go/Gin) → In-Memory Store
     ↓
WebSocket Server ← → Redis Cache
```

### Production
```
Load Balancer → Frontend (Next.js) → CDN
      ↓
API Gateway → Backend Cluster (Go) → PostgreSQL Primary
      ↓              ↓
WebSocket Cluster → Redis Cluster → PostgreSQL Replica
      ↓
File Storage (S3/Compatible)
```

### Monitoring & Analytics
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)  
- **Error Tracking**: Sentry
- **Performance**: New Relic / DataDog

## 🚦 개발 워크플로우

### Git Strategy
- **Main Branch**: Production ready code
- **Develop Branch**: Integration branch
- **Feature Branches**: feature/component-name
- **Release Branches**: release/v1.0.0

### CI/CD Pipeline
1. **Code Quality**: ESLint, Prettier, Go fmt
2. **Testing**: Unit tests, Integration tests
3. **Build**: Frontend build, Backend compilation
4. **Deploy**: Staging → Production
5. **Monitoring**: Health checks, Performance metrics

## 📈 확장성 고려사항

### Horizontal Scaling
- **Stateless Services**: JWT 기반 인증
- **Database Sharding**: 사용자 기반 샤딩
- **Microservices**: 도메인 분리 가능

### Performance Optimization
- **Database Indexing**: 쿼리 최적화
- **Caching Strategy**: 다계층 캐싱
- **Content Delivery**: 글로벌 CDN

### Future Enhancements
- **Mobile Apps**: React Native 또는 Flutter
- **AI Integration**: 콘텐츠 추천, 챗봇
- **Blockchain**: NFT, 토큰 경제
- **Machine Learning**: 사용자 행동 예측