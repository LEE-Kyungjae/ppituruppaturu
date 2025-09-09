# Backend 개발 가이드

## 개발 가이드라인
- [개발 가이드라인](./DEVELOPMENT_GUIDELINES.md)
- [에러 처리 메커니즘](./ERROR_HANDLING_MECHANISM.md)
- [버그 수정 요약](./BUG_FIXES_SUMMARY.md)

## 빠른 시작

### 로컬 개발 환경 구성
```bash
# 의존성 설치
go mod download

# 환경변수 설정
cp .env.example .env

# 서버 실행
go run main.go
```

### 테스트 실행
```bash
# 단위 테스트
go test ./...

# 커버리지 포함
go test -cover ./...
```

### 빌드
```bash
# 로컬 빌드
go build -o bin/server main.go

# Docker 빌드
docker build -t pitturu-backend .
```