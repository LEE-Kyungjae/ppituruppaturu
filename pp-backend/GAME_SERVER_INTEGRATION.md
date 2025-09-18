# PittuRu 실시간 게임서버 통합 가이드

## 개요

PittuRu 백엔드에 실시간 게임서버가 성공적으로 통합되었습니다. 이 문서는 통합된 게임서버의 사용법과 API 엔드포인트를 설명합니다.

## 아키텍처

### 서버 구조
- **메인 서버**: HTTP REST API (포트 8080)
- **게임 서버**: WebSocket 기반 실시간 게임 (포트 8081)

### 통합 특징
- 메인 서버와 게임서버가 동일한 프로세스에서 실행
- 공통 설정 및 종속성 공유
- 환경변수를 통한 게임서버 활성화/비활성화 제어

## 환경변수 설정

```bash
# 게임서버 활성화/비활성화
GAME_SERVER_ENABLED=true

# 게임서버 포트 설정
WS_PORT=8081

# CORS 설정 (프론트엔드 도메인)
CORS_ORIGINS=http://localhost:3000,https://pitturu.com
```

## API 엔드포인트

### 게임서버 상태 확인
```http
GET /api/v1/game/status
Authorization: Bearer {token}
```

**응답 예시 (게임서버 활성화시):**
```json
{
  "status": "running",
  "enabled": true,
  "config": {
    "port": 8081,
    "maxConnections": 1000,
    "maxRooms": 100,
    "maxPlayersPerRoom": 8
  },
  "stats": {
    "activeConnections": 5,
    "activeRooms": 2,
    "totalGamesPlayed": 15,
    "uptimeSeconds": 3600.5
  }
}
```

**응답 예시 (게임서버 비활성화시):**
```json
{
  "status": "disabled",
  "enabled": false,
  "note": "Game server is disabled. Set GAME_SERVER_ENABLED=true to enable."
}
```

### 활성 게임룸 목록 조회
```http
GET /api/v1/game/rooms
Authorization: Bearer {token}
```

**응답 예시:**
```json
{
  "rooms": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "테스트 클릭 스피드 룸",
      "gameType": "click_speed",
      "state": "waiting",
      "currentPlayers": 1,
      "maxPlayers": 4,
      "isPrivate": false
    }
  ],
  "total": 1
}
```

### 게임 타입 목록 조회
```http
GET /api/v1/game/types
Authorization: Bearer {token}
```

**응답 예시:**
```json
{
  "gameTypes": {
    "click_speed": {
      "type": "click_speed",
      "duration": 30000000000,
      "maxScore": 1000,
      "pointsPerScore": 1.0,
      "difficulty": 2
    },
    "memory_match": {
      "type": "memory_match",
      "duration": 60000000000,
      "maxScore": 500,
      "pointsPerScore": 2.0,
      "difficulty": 3
    }
  }
}
```

### WebSocket 연결 정보
```http
GET /ws/game
```

**응답:**
```json
{
  "message": "Game WebSocket is available on port 8081",
  "endpoint": "ws://localhost:8081/ws/{username}",
  "note": "Connect directly to the game server for real-time game features"
}
```

## WebSocket 연결

### 연결 방법
```javascript
// 웹소켓 연결
const username = "player123";
const ws = new WebSocket(`ws://localhost:8081/ws/${username}`);

ws.onopen = function(event) {
    console.log("게임서버에 연결됨");
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log("메시지 수신:", data);
};
```

### 주요 이벤트 타입
- `connect`: 플레이어 연결
- `disconnect`: 플레이어 연결 해제
- `room_join`: 룸 참가
- `room_leave`: 룸 나가기
- `game_start`: 게임 시작
- `game_end`: 게임 종료
- `player_action`: 플레이어 액션

## 테스트용 기능

### 자동 생성되는 테스트 룸
개발 환경(`GO_ENV=development`)에서 서버 시작시 자동으로 생성되는 테스트 룸들:

1. **테스트 클릭 스피드 룸** (click_speed)
2. **테스트 메모리 매칭 룸** (memory_match)
3. **테스트 숫자 추측 룸** (number_guess)

### 헬스체크 엔드포인트
```bash
# 서버 실행 중 헬스체크
curl http://localhost:8080/health

# 게임서버 전용 헬스체크
curl http://localhost:8081/health
```

## 서버 실행

### 개발 환경
```bash
# 환경변수 설정
export GAME_SERVER_ENABLED=true
export WS_PORT=8081
export GO_ENV=development

# 서버 실행
make run
# 또는
go run ./cmd/server
```

### 프로덕션 환경
```bash
# 게임서버 비활성화
export GAME_SERVER_ENABLED=false

# 또는 별도 포트로 실행
export GAME_SERVER_ENABLED=true
export WS_PORT=8082
export GO_ENV=production

./bin/server
```

## 모니터링

### Prometheus 메트릭
- `http_requests_total`: HTTP 요청 수
- `http_request_duration_seconds`: HTTP 요청 지연시간
- 게임서버 전용 메트릭은 `/metrics` 엔드포인트에서 확인

### 로그 모니터링
```bash
# 게임서버 시작 로그
🎮 Game Server starting on port 8081

# 테스트 룸 생성 로그
✅ 테스트 룸 생성 성공: 테스트 클릭 스피드 룸 (click_speed)
```

## 프론트엔드 연동

### React/Next.js 예시
```javascript
import { useEffect, useState } from 'react';

const GameConnection = () => {
  const [ws, setWs] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);

  useEffect(() => {
    // 게임서버 상태 확인
    fetch('/api/v1/game/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setGameStatus);

    // WebSocket 연결
    if (gameStatus?.enabled) {
      const websocket = new WebSocket(`ws://localhost:8081/ws/${username}`);
      setWs(websocket);

      return () => websocket.close();
    }
  }, [gameStatus?.enabled]);

  return (
    <div>
      <h2>게임서버 상태: {gameStatus?.status}</h2>
      {gameStatus?.enabled && <GameRoomList />}
    </div>
  );
};
```

## 문제 해결

### 게임서버가 시작되지 않는 경우
1. `GAME_SERVER_ENABLED=true` 확인
2. 포트 충돌 확인 (`WS_PORT` 설정)
3. 로그에서 오류 메시지 확인

### WebSocket 연결 실패
1. 게임서버 활성화 상태 확인 (`/api/v1/game/status`)
2. CORS 설정 확인 (`CORS_ORIGINS`)
3. 방화벽/프록시 설정 확인

### 테스트 룸이 생성되지 않는 경우
1. `GO_ENV=development` 설정 확인
2. 게임서버 시작 후 2초 대기
3. 게임 타입이 올바른지 확인

## 향후 개선사항

1. **HTTP API를 통한 룸 생성/관리** - 현재는 WebSocket으로만 가능
2. **인증 미들웨어 강화** - WebSocket 연결시 토큰 검증
3. **게임별 커스텀 로직** - 게임 타입별 특화 기능
4. **성능 최적화** - 연결 풀링, 메시지 압축
5. **모니터링 강화** - 상세 메트릭, 알림 시스템

## 지원

문제가 발생하거나 추가 기능이 필요한 경우:
1. GitHub Issues에 문제 보고
2. 개발팀에 직접 연락
3. 로그 파일과 함께 상세한 재현 단계 제공