# 삐뚜루빠뚜루 도메인 아키텍처 설계

## 📋 현재 상태 분석

### ✅ 구현된 기능들
- 기본 사용자 인증 (카카오/구글 OAuth)
- 게임 기본 구조
- 채팅 시스템
- 기본 상점 기능
- 관리자 패널

### ❌ 개선 필요한 영역들
- 사용자 경험 시스템 (레벨, 업적, 배지)
- 게임 통계 및 랭킹 시스템
- 포인트/재화 시스템 통합
- 친구 시스템 완성
- 게임 매칭 시스템

## 🏗️ 도메인 아키텍처 설계

### 1. 사용자 도메인 (User Domain)

#### 핵심 엔티티
```go
// 사용자 기본 정보
type User struct {
    Username          string     // PK
    Email            string
    PasswordHash     string
    Role             UserRole   // user, admin, moderator

    // 프로필 정보
    Nickname         *string
    ProfilePicture   *string
    StatusMessage    *string
    Bio             *string

    // 계정 상태
    IsActive         bool
    IsVerified       bool
    LastOnlineAt     *time.Time
    DeletedAt        *time.Time
    BannedAt         *time.Time
    BanReason        *string

    // OAuth 정보
    KakaoID          *string
    GoogleID         *string

    // 시간 정보
    CreatedAt        time.Time
    UpdatedAt        time.Time
}

// 사용자 통계
type UserStats struct {
    UserUsername     string     // FK
    Level           int        // 사용자 레벨
    Experience      int        // 경험치
    TotalGames      int        // 총 게임 수
    TotalWins       int        // 총 승리 수
    TotalLosses     int        // 총 패배 수
    WinRate         float64    // 승률
    CurrentStreak   int        // 현재 연승
    BestStreak      int        // 최고 연승
    TotalPlayTime   int        // 총 플레이 시간 (초)
    LastGameAt      *time.Time // 마지막 게임 시간
    UpdatedAt       time.Time
}

// 사용자 포인트
type UserPoints struct {
    UserUsername    string     // FK
    TotalPoints     int        // 총 포인트
    AvailablePoints int        // 사용 가능한 포인트
    SpentPoints     int        // 사용한 포인트
    UpdatedAt       time.Time
}
```

#### 서비스 레이어
```go
type UserService interface {
    // 기본 사용자 관리
    GetUser(username string) (*User, error)
    UpdateProfile(username string, req UpdateProfileRequest) error
    UpdateSettings(username string, req UpdateSettingsRequest) error

    // 통계 관리
    GetUserStats(username string) (*UserStats, error)
    UpdateGameStats(username string, gameResult GameResult) error
    AddExperience(username string, exp int) error

    // 포인트 관리
    GetUserPoints(username string) (*UserPoints, error)
    AddPoints(username string, points int, reason string) error
    SpendPoints(username string, points int, reason string) error

    // 레벨링 시스템
    CheckLevelUp(username string) (*LevelUpResult, error)
    GetLeaderboard(category string, limit int) ([]*UserRanking, error)
}
```

### 2. 게임 도메인 (Game Domain)

#### 핵심 엔티티
```go
// 게임 정의
type Game struct {
    ID            uuid.UUID
    Name          string
    Description   *string
    Category      GameCategory // action, puzzle, strategy, rhythm
    Difficulty    GameDifficulty // easy, medium, hard
    MinPlayers    int
    MaxPlayers    int
    Duration      int // 예상 게임 시간 (초)
    PointsReward  int // 승리 시 포인트
    ExpReward     int // 게임 완료 시 경험치
    IsActive      bool
    CreatedAt     time.Time
    UpdatedAt     time.Time
}

// 게임 세션
type GameSession struct {
    ID           uuid.UUID
    GameID       uuid.UUID
    PlayerCount  int
    Status       SessionStatus // waiting, playing, finished
    StartedAt    *time.Time
    FinishedAt   *time.Time
    Duration     int // 실제 게임 시간 (초)
    CreatedAt    time.Time
}

// 게임 참여자
type GameParticipant struct {
    SessionID    uuid.UUID
    Username     string
    Score        int
    Rank         int
    Result       GameResult // win, loss, draw
    PointsEarned int
    ExpEarned    int
    JoinedAt     time.Time
    FinishedAt   *time.Time
}

// 게임 기록
type GameHistory struct {
    ID           uuid.UUID
    Username     string
    GameID       uuid.UUID
    SessionID    uuid.UUID
    Score        int
    Rank         int
    Result       GameResult
    Duration     int
    PointsEarned int
    ExpEarned    int
    PlayedAt     time.Time
}
```

#### 서비스 레이어
```go
type GameService interface {
    // 게임 관리
    GetGames(category *GameCategory) ([]*Game, error)
    GetGame(id uuid.UUID) (*Game, error)
    GetPopularGames(limit int) ([]*GameWithStats, error)

    // 세션 관리
    CreateSession(gameID uuid.UUID, playerUsername string) (*GameSession, error)
    JoinSession(sessionID uuid.UUID, playerUsername string) error
    StartSession(sessionID uuid.UUID) error
    FinishSession(sessionID uuid.UUID, results []GameResult) error

    // 통계 및 기록
    GetUserGameHistory(username string, limit int) ([]*GameHistory, error)
    GetUserGameStats(username string, gameID *uuid.UUID) (*UserGameStats, error)
    GetGameLeaderboard(gameID uuid.UUID, period string) ([]*GameRanking, error)

    // 매칭 시스템
    FindMatch(username string, gameID uuid.UUID) (*MatchResult, error)
    CancelMatch(username string, gameID uuid.UUID) error
}
```

### 3. 업적 시스템 (Achievement Domain)

#### 핵심 엔티티
```go
// 업적 정의
type Achievement struct {
    ID           uuid.UUID
    Name         string
    Description  string
    Icon         string
    Category     AchievementCategory // gameplay, social, milestone
    Condition    string // JSON으로 조건 저장
    PointReward  int
    ExpReward    int
    BadgeURL     *string
    IsSecret     bool // 숨겨진 업적 여부
    CreatedAt    time.Time
}

// 사용자 업적
type UserAchievement struct {
    ID            uuid.UUID
    Username      string
    AchievementID uuid.UUID
    Progress      int    // 진행도
    MaxProgress   int    // 최대 진행도
    IsCompleted   bool
    CompletedAt   *time.Time
    CreatedAt     time.Time
    UpdatedAt     time.Time
}
```

#### 서비스 레이어
```go
type AchievementService interface {
    GetAchievements() ([]*Achievement, error)
    GetUserAchievements(username string) ([]*UserAchievement, error)
    CheckAchievements(username string, event AchievementEvent) ([]*UnlockedAchievement, error)
    UpdateProgress(username string, achievementID uuid.UUID, progress int) error
}
```

### 4. 친구 시스템 (Social Domain)

#### 핵심 엔티티
```go
// 친구 요청
type FriendRequest struct {
    ID          uuid.UUID
    Sender      string
    Receiver    string
    Status      FriendRequestStatus // pending, accepted, rejected
    Message     *string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// 친구 관계
type Friendship struct {
    ID         uuid.UUID
    User1      string // 알파벳 순으로 정렬된 첫 번째 사용자
    User2      string // 알파벳 순으로 정렬된 두 번째 사용자
    Status     FriendshipStatus // active, blocked
    CreatedAt  time.Time
}

// 차단된 사용자
type BlockedUser struct {
    ID         uuid.UUID
    Blocker    string
    Blocked    string
    Reason     *string
    CreatedAt  time.Time
}
```

### 5. 재화 시스템 (Economy Domain)

#### 핵심 엔티티
```go
// 포인트 거래 기록
type PointTransaction struct {
    ID          uuid.UUID
    Username    string
    Type        TransactionType // earned, spent, bonus, penalty
    Amount      int
    Balance     int // 거래 후 잔액
    Source      TransactionSource // game_win, shop_purchase, daily_bonus
    Reference   *string // 참조 ID (게임 세션 ID 등)
    Description string
    CreatedAt   time.Time
}

// 아이템
type Item struct {
    ID          uuid.UUID
    Name        string
    Description *string
    Category    ItemCategory // cosmetic, booster, badge
    Rarity      ItemRarity // common, rare, epic, legendary
    Price       int
    ImageURL    *string
    IsActive    bool
    CreatedAt   time.Time
}

// 사용자 인벤토리
type UserInventory struct {
    ID          uuid.UUID
    Username    string
    ItemID      uuid.UUID
    Quantity    int
    PurchasedAt time.Time
    ExpiresAt   *time.Time
}
```

## 📊 API 설계

### 사용자 관련 API
```
GET    /api/v1/users/me                    # 내 정보
PUT    /api/v1/users/me/profile            # 프로필 수정
GET    /api/v1/users/me/stats              # 내 통계
GET    /api/v1/users/me/points             # 내 포인트
GET    /api/v1/users/me/achievements       # 내 업적
GET    /api/v1/users/me/friends            # 친구 목록
GET    /api/v1/users/{username}/profile    # 다른 사용자 프로필
```

### 게임 관련 API
```
GET    /api/v1/games                       # 게임 목록
GET    /api/v1/games/{id}                  # 게임 상세
GET    /api/v1/games/{id}/leaderboard      # 게임 리더보드
POST   /api/v1/games/{id}/sessions         # 게임 세션 생성
POST   /api/v1/games/sessions/{id}/join    # 게임 세션 참여
POST   /api/v1/games/sessions/{id}/start   # 게임 시작
POST   /api/v1/games/sessions/{id}/finish  # 게임 종료
```

### 랭킹 및 통계 API
```
GET    /api/v1/leaderboard/global          # 전체 리더보드
GET    /api/v1/leaderboard/games/{id}      # 게임별 리더보드
GET    /api/v1/stats/games/{id}            # 게임 통계
GET    /api/v1/users/me/history            # 내 게임 기록
```

## 🔄 이벤트 기반 아키텍처

### 이벤트 정의
```go
type DomainEvent interface {
    EventType() string
    OccurredAt() time.Time
    AggregateID() string
}

// 게임 완료 이벤트
type GameCompletedEvent struct {
    SessionID    uuid.UUID
    GameID       uuid.UUID
    Username     string
    Score        int
    Result       GameResult
    Duration     int
    CompletedAt  time.Time
}

// 레벨업 이벤트
type LevelUpEvent struct {
    Username     string
    OldLevel     int
    NewLevel     int
    OccurredAt   time.Time
}

// 업적 달성 이벤트
type AchievementUnlockedEvent struct {
    Username      string
    AchievementID uuid.UUID
    UnlockedAt    time.Time
}
```

### 이벤트 핸들러
```go
type EventHandler interface {
    Handle(ctx context.Context, event DomainEvent) error
}

// 게임 완료 시 처리할 핸들러들
- UpdateUserStatsHandler: 사용자 통계 업데이트
- AwardPointsHandler: 포인트 지급
- CheckAchievementsHandler: 업적 확인
- UpdateLeaderboardHandler: 리더보드 업데이트
```

## 🎯 구현 우선순위

### Phase 1: 사용자 경험 개선
1. **레벨링 시스템** 구현
2. **포인트 시스템** 통합
3. **게임 통계** 실시간 업데이트
4. **기본 업적** 시스템

### Phase 2: 게임 시스템 고도화
1. **매칭 시스템** 구현
2. **게임 세션 관리** 개선
3. **실시간 리더보드** 구축
4. **게임별 상세 통계**

### Phase 3: 소셜 기능 완성
1. **친구 시스템** 완성
2. **길드/팀** 시스템
3. **챌린지** 시스템
4. **토너먼트** 시스템

### Phase 4: 고급 기능
1. **AI 기반 매칭**
2. **개인화 추천**
3. **시즌 시스템**
4. **프리미엄 기능**

## 🛡️ 보안 및 성능 고려사항

### 보안
- JWT 기반 인증/인가
- RBAC (Role-Based Access Control)
- Rate Limiting
- 입력 값 검증 및 SQL Injection 방지
- XSS 방지

### 성능
- Redis 캐싱 (리더보드, 사용자 세션)
- 데이터베이스 인덱싱 최적화
- Connection Pooling
- 페이지네이션
- CDN 활용

### 모니터링
- 애플리케이션 메트릭
- 에러 트래킹
- 성능 모니터링
- 사용자 행동 분석

---

이 아키텍처를 통해 확장 가능하고 유지보수 가능한 게임 플랫폼을 구축할 수 있습니다.