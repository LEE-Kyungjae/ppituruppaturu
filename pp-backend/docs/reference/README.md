# Backend 참조 문서

## 데이터베이스
- [데이터베이스 스키마](./DATABASE_SCHEMA.md)

## 아키텍처
- [시스템 아키텍처](../architecture.md)

## 보안
- [보안 정책](../SECURITY.md)

## 기술 스택

### 핵심 기술
- **언어**: Go 1.21+
- **웹 프레임워크**: Gin
- **데이터베이스**: PostgreSQL + GORM
- **캐시**: Redis
- **인증**: JWT + OAuth 2.0

### 주요 라이브러리
```go
github.com/gin-gonic/gin              // HTTP 웹 프레임워크
gorm.io/gorm                         // ORM
github.com/redis/go-redis/v9         // Redis 클라이언트
github.com/golang-jwt/jwt/v5         // JWT 토큰
github.com/gorilla/websocket         // WebSocket
golang.org/x/crypto/bcrypt           // 패스워드 해싱
```