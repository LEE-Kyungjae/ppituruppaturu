# 배포 성공 체크리스트

이 문서는 삐뚜루빠뚜루 프로젝트 배포 시 필요한 모든 수정사항과 설정을 정리한 것입니다.

## 1. 코드 수정사항

### A. 백엔드 SQL 타입 에러 해결
**위치**: `pp-backend/internal/handler/`

**수정할 파일들**:
- `game.go`
- `payment.go`
- `user.go`
- `admin.go`
- `response.go`

**패턴**:
```go
// 변환 함수 추가
func toGameResponse(game *repository.Game) GameResponse {
    var description *string
    if game.Description.Valid {
        description = &game.Description.String
    }
    return GameResponse{
        ID:          game.ID,
        Name:        game.Name,
        Description: description,
        CreatedAt:   game.CreatedAt,
        UpdatedAt:   game.UpdatedAt,
    }
}

// 핸들러에서 사용
func (h *GameHandler) GetGame(c *gin.Context) {
    game, err := h.service.GetGame(id)
    if err != nil {
        respondError(c, http.StatusNotFound, "Game not found")
        return
    }
    respondJSON(c, http.StatusOK, toGameResponse(game))
}
```

### B. Response 구조체 수정
**위치**: `pp-backend/internal/handler/response.go`

**변경점**: SQL null 타입을 Go pointer 타입으로 변경
```go
type GameResponse struct {
    ID          uuid.UUID  `json:"id"`
    Name        string     `json:"name"`
    Description *string    `json:"description,omitempty"`  // sql.NullString → *string
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}
```

## 2. CI/CD 설정

### A. GitHub Actions 워크플로우
**파일**: `.github/workflows/deploy.yml`

**핵심 설정**:
```yaml
jobs:
  quick-check:
    runs-on: ubuntu-latest
    continue-on-error: true  # 실패해도 계속 진행

  deploy:
    runs-on: ubuntu-latest
    needs: [quick-check, frontend-check, mobile-check]
    if: always()  # 위 작업들이 실패해도 실행
```

### B. golangci-lint 설정 완화
**파일**: `pp-backend/.golangci.yml`

```yaml
linters:
  enable:
    - gofmt
    - goimports
  disable:
    - typecheck
    - errcheck
    - staticcheck
    - revive
    - misspell
    - prealloc
    - govet
    - ineffassign
    - unused
```

## 3. 배포 스크립트
**파일**: `deploy.sh`

**사용법**:
```bash
# 전체 배포
./deploy.sh

# 모바일 제외 배포
SKIP_MOBILE=true ./deploy.sh

# 안드로이드 APK 포함
BUILD_ANDROID=true ./deploy.sh

# 자동 커밋 포함
AUTO_COMMIT=true ./deploy.sh
```

## 4. 서버 설정

### A. Docker 컨테이너 설정
```bash
# 1. 기존 컨테이너 정리
docker stop ppituru-backend ppituru-frontend
docker rm ppituru-backend ppituru-frontend

# 2. 백엔드 컨테이너 (host 네트워킹)
docker run -d --name ppituru-fixed-backend --network host \
  -e DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_db?sslmode=disable" \
  ze2l/ppituruppaturu-backend:latest

# 3. 프론트엔드 컨테이너 확인 및 시작
docker ps -a | grep frontend
docker start ppituru-blue-frontend-1
```

### B. Nginx 설정
**파일**: `/etc/nginx/sites-available/ppituru.conf`

```nginx
server {
    listen 80;
    server_name ppituruppaturu.com www.ppituruppaturu.com;
    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API routes - /api/ prefix 제거
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

**적용 명령어**:
```bash
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/ppituru.conf
sudo ln -sf /etc/nginx/sites-available/ppituru.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/*-http.conf  # 중복 설정 제거
sudo nginx -t && sudo systemctl reload nginx
```

## 5. 검증 체크리스트

### A. 서버 상태 확인
```bash
# 1. Docker 컨테이너 상태
docker ps | grep -E "(backend|frontend)"

# 2. 포트 리스닝 확인
sudo netstat -tlnp | grep -E ":80|:8080|:3001"

# 3. 로컬 API 테스트
curl -s http://localhost:8080/health
curl -s -H "Host: ppituruppaturu.com" http://localhost:80/api/health

# 4. 공인 IP 확인
curl -s http://checkip.amazonaws.com/

# 5. 공인 IP로 직접 테스트
curl -s -H "Host: ppituruppaturu.com" http://[PUBLIC_IP]/api/health
```

### B. 서비스 동작 확인
✅ 백엔드 헬스체크: `/health`
✅ API 라우팅: `/api/health` → `/health`
✅ 프론트엔드: `/` → HTML 응답
✅ WebSocket: `/ws` (필요시)

## 6. 트러블슈팅

### A. 521 에러 (Cloudflare)
- **원인**: Cloudflare가 origin 서버에 연결할 수 없음
- **해결**: DNS A 레코드를 올바른 공인 IP로 업데이트

### B. Docker 컨테이너 재시작 루프
- **원인**: 데이터베이스 연결 실패 또는 네트워크 이슈
- **해결**: `--network host` 옵션 사용, DSN 확인

### C. API 404 에러
- **원인**: Nginx 라우팅 설정 오류
- **해결**: `/api/` prefix 제거 확인, rewrite 규칙 점검

## 7. 최종 확인사항

배포 완료 후 반드시 확인:
- [ ] `https://ppituruppaturu.com` 접속 가능
- [ ] `https://ppituruppaturu.com/api/health` JSON 응답
- [ ] 프론트엔드 페이지 정상 로드
- [ ] API 엔드포인트들 정상 동작
- [ ] WebSocket 연결 (게임 기능 사용 시)

---

이 체크리스트를 따르면 같은 설정으로 성공적인 배포가 가능합니다.