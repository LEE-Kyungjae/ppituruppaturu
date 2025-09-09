// backend/internal/container/container.go
package container

import (
	"database/sql"
	"log"
	"time"

	"exit/internal/auth"
	"exit/internal/chat"
	"exit/internal/config"
	"exit/internal/db"
	"exit/internal/email"
	"exit/internal/handler"
	"exit/internal/kakao"
	"exit/internal/minigame"
	"exit/internal/repository"
	"exit/internal/service"
)

// Container holds all the application's dependencies.
type Container struct {
	Config *config.Config
	DBConn *sql.DB
	DB     repository.DBTX
	Hub    *chat.Hub

	// Repositories
	UserRepo               repository.UserRepository
	FriendRepo             repository.FriendRepository
	TokenRepo              repository.RefreshTokenRepository
	MessageRepo            repository.MessageRepository
	PostRepo               repository.PostRepository
	CommentRepo            repository.CommentRepository
	GameRepo               repository.GameRepository
	ItemRepo               repository.ItemRepository
	TransactionRepo        repository.TransactionRepository
	ChatRoomRepo           repository.ChatRoomRepository
	PasswordResetTokenRepo repository.PasswordResetTokenRepository

	// Services
	UserService      service.UserService
	FriendService    service.FriendService
	ChatService      service.ChatService
	CommunityService service.CommunityService
	GameService      service.GameService
	PaymentService   service.PaymentService
	ChatRoomService  service.ChatRoomService
	KakaoAuthService service.KakaoAuthService
	AuthService      service.AuthService

	// Email
	EmailSender email.Sender

	// Handlers
	AuthHandler      *handler.AuthHandler
	UserHandler      *handler.UserHandler
	AdminHandler     *handler.AdminHandler
	FriendHandler    *handler.FriendHandler
	ChatHandler      *handler.ChatHandler
	CommunityHandler *handler.CommunityHandler
	GameHandler      *handler.GameHandler
	PaymentHandler   *handler.PaymentHandler
	ChatRoomHandler  *handler.ChatRoomHandler
	MiniGameHandler  *handler.MiniGameHandler

	// Mini Game Engine
	MiniGameEngine   *minigame.MiniGameEngine

	// Middleware
	AuthMiddleware *auth.Middleware
}

// NewContainer creates a new Container with all the dependencies initialized.
func NewContainer(cfg *config.Config) *Container {
	// 1) DB 연결
	dbConn, err := db.NewConnection(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	// 1-1) 커넥션 풀 튜닝(기본값 + cfg가 있으면 덮어쓰기)
	tuneDBPool(dbConn, cfg)

	// 2) 채팅 허브(백그라운드 루프 시작)
	hub := chat.NewHub()
	go hub.Run()

	// 3) 리포지토리 초기화
	userRepo := repository.NewPostgresUserRepository(dbConn)
	friendRepo := repository.NewPostgresFriendRepository(dbConn)
	tokenRepo := repository.NewPostgresRefreshTokenRepository(dbConn)
	messageRepo := repository.NewPostgresMessageRepository(dbConn)
	postRepo := repository.NewPostgresPostRepository(dbConn)
	commentRepo := repository.NewPostgresCommentRepository(dbConn)
	gameRepo := repository.NewPostgresGameRepository(dbConn)
	itemRepo := repository.NewPostgresItemRepository(dbConn)
	transactionRepo := repository.NewPostgresTransactionRepository(dbConn)
	chatRoomRepo := repository.NewPostgresChatRoomRepository(dbConn)
	passwordResetTokenRepo := repository.NewPostgresPasswordResetTokenRepository(dbConn)

	// 4) 이메일 발송기
	emailSender := email.NewSMTPSender(cfg)

	// 5) 서비스 초기화
	tokenSvc := service.NewTokenService(cfg.AccessSecret, cfg.RefreshSecret, cfg.AccessTTLMin, cfg.RefreshTTLDays)

	// kakao.Client 개선 버전 사용 (기본 타임아웃/재시도 내장)
	// 필요 시 cfg로 재시도 파라미터를 노출해도 됩니다.
	kakaoClient := kakao.NewClient(
		cfg,
		// kakao.WithHTTPClient(customHTTP), // 필요 시 커스텀 클라이언트 주입
		// kakao.WithRetry(3, 300*time.Millisecond, 5*time.Second),
	)

	userService := service.NewUserService(userRepo)
	friendService := service.NewFriendService(friendRepo, userRepo)
	chatService := service.NewChatService(messageRepo, userRepo, chatRoomRepo, hub)
	communityService := service.NewCommunityService(postRepo, commentRepo, userRepo)
	gameService := service.NewGameService(gameRepo, userRepo)
	paymentService := service.NewPaymentService(itemRepo, userRepo, transactionRepo)
	chatRoomService := service.NewChatRoomService(chatRoomRepo, userRepo)
	kakaoAuthSvc := service.NewKakaoAuthService(kakaoClient, userRepo, tokenSvc, cfg)
	authService := service.NewAuthService(userRepo, tokenRepo, passwordResetTokenRepo, tokenSvc, emailSender, cfg)

	// 5-1) 미니게임 엔진
	miniGameEngine := minigame.NewMiniGameEngine(gameService, paymentService)

	// 6) 미들웨어
	authMiddleware := auth.NewMiddleware(tokenSvc)

	// 7) 핸들러
	startedAt := time.Now() // 앱 시작 시각을 고정 캡처 → 업타임 계산 정확
	authHandler := handler.NewAuthHandler(authService, kakaoAuthSvc)
	userHandler := handler.NewUserHandler(userService, cfg)
	adminHandler := handler.NewAdminHandler(startedAt)
	friendHandler := handler.NewFriendHandler(friendService)
	chatHandler := handler.NewChatHandler(userService, chatService, hub)
	communityHandler := handler.NewCommunityHandler(communityService)
	gameHandler := handler.NewGameHandler(gameService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	chatRoomHandler := handler.NewChatRoomHandler(chatRoomService)
	miniGameHandler := handler.NewMiniGameHandler(miniGameEngine)

	return &Container{
		Config:                 cfg,
		DBConn:                 dbConn,
		DB:                     dbConn, // repository.DBTX로 sql.DB를 그대로 사용
		Hub:                    hub,
		UserRepo:               userRepo,
		FriendRepo:             friendRepo,
		TokenRepo:              tokenRepo,
		MessageRepo:            messageRepo,
		PostRepo:               postRepo,
		CommentRepo:            commentRepo,
		GameRepo:               gameRepo,
		ItemRepo:               itemRepo,
		TransactionRepo:        transactionRepo,
		ChatRoomRepo:           chatRoomRepo,
		PasswordResetTokenRepo: passwordResetTokenRepo,
		UserService:            userService,
		FriendService:          friendService,
		ChatService:            chatService,
		CommunityService:       communityService,
		GameService:            gameService,
		PaymentService:         paymentService,
		ChatRoomService:        chatRoomService,
		KakaoAuthService:       kakaoAuthSvc,
		AuthService:            authService,
		EmailSender:            emailSender,
		AuthHandler:            authHandler,
		UserHandler:            userHandler,
		AdminHandler:           adminHandler,
		FriendHandler:          friendHandler,
		ChatHandler:            chatHandler,
		CommunityHandler:       communityHandler,
		GameHandler:            gameHandler,
		PaymentHandler:         paymentHandler,
		ChatRoomHandler:        chatRoomHandler,
		MiniGameHandler:        miniGameHandler,

		// Mini Game Engine
		MiniGameEngine:         miniGameEngine,

		// Middleware
		AuthMiddleware:         authMiddleware,
	}
}

// tuneDBPool sets sane defaults for DB connection pooling.
// cfg에 DB 연결 풀 관련 값이 있으면 해당 값으로 덮어씁니다.
// (예: cfg.DBMaxOpenConns, cfg.DBMaxIdleConns, cfg.DBConnMaxLifetimeMin 등)
func tuneDBPool(db *sql.DB, cfg *config.Config) {
	// 기본값
	maxOpen := 25
	maxIdle := 25
	maxLife := 30 * time.Minute
	maxIdleTime := 5 * time.Minute

	// cfg에 값이 있으면 반영 (필드명은 프로젝트에 맞게 수정하세요)
	if cfg.DBMaxOpenConns > 0 {
		maxOpen = cfg.DBMaxOpenConns
	}
	if cfg.DBMaxIdleConns > 0 {
		maxIdle = cfg.DBMaxIdleConns
	}
	if cfg.DBConnMaxLifetime > 0 {
		maxLife = time.Duration(cfg.DBConnMaxLifetime) * time.Hour
	}
	if cfg.DBConnMaxIdleTime > 0 {
		maxIdleTime = time.Duration(cfg.DBConnMaxIdleTime) * time.Minute
	}

	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(maxLife)
	db.SetConnMaxIdleTime(maxIdleTime)
}

/*
[확장 포인트 메모]
- 트랜잭션 매니저: repository.DBTX를 sql.Tx로 대체해 주입하는 팩토리/헬퍼 추가 가능
- 캐시/세션: Redis 클라이언트 생성해 Service에 주입
- 메일 발송: emailSender를 큐(채널/워크풀)로 감싸 비동기 처리
- 샌드박스/프로덕션 분기: cfg.Environment에 따라 의존성 대체
- Graceful Shutdown: 컨테이너 Close() 제공(허브 종료/DB Close 등) → 서버 Stop Hook에서 호출
*/
