# Backend API Documentation

## API 엔드포인트

### 인증 (Authentication)
- `POST /api/v1/auth/login` - 사용자 로그인
- `POST /api/v1/auth/logout` - 로그아웃
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/register` - 사용자 등록

### 소셜 로그인 (Social Auth)
- `GET /api/v1/auth/kakao` - 카카오 로그인 URL
- `POST /api/v1/auth/kakao/callback` - 카카오 콜백
- `GET /api/v1/auth/google` - 구글 로그인 URL
- `POST /api/v1/auth/google/callback` - 구글 콜백

### 사용자 (Users)
- `GET /api/v1/users/profile` - 프로필 조회
- `PUT /api/v1/users/profile` - 프로필 수정
- `GET /api/v1/users/friends` - 친구 목록

### 채팅 (Chat)
- `GET /api/v1/chat/ws` - WebSocket 연결
- `POST /api/v1/chat/rooms` - 채팅방 생성
- `GET /api/v1/chat/messages` - 메시지 조회

### 게임 (Games)
- `GET /api/v1/games` - 게임 목록
- `POST /api/v1/games/{id}/play` - 게임 시작
- `POST /api/v1/games/score` - 점수 제출
- `GET /api/v1/games/leaderboard` - 리더보드

### 결제 (Payments)
- `POST /api/v1/payments/toss/create` - 결제 생성
- `POST /api/v1/payments/toss/confirm` - 결제 확인
- `POST /api/v1/payments/webhook` - 웹훅 처리

자세한 API 스펙은 다음 파일들을 참조하세요:
- [결제 API](./payments.md)
- [Swagger 문서](./swagger.yaml)