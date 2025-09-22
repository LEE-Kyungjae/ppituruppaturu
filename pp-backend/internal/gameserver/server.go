// internal/gameserver/server.go
package gameserver

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/pitturu-ppaturu/backend/internal/minigame"
)

// GameServerConfig contains configuration for the game server
type GameServerConfig struct {
	Port                   int           `json:"port"`
	MaxConnections         int           `json:"maxConnections"`
	MaxRooms               int           `json:"maxRooms"`
	MaxPlayersPerRoom      int           `json:"maxPlayersPerRoom"`
	ConnectionTimeout      time.Duration `json:"connectionTimeout"`
	RoomInactivityTimeout  time.Duration `json:"roomInactivityTimeout"`
	MatchmakingTimeout     time.Duration `json:"matchmakingTimeout"`
	EnableCORS             bool          `json:"enableCORS"`
	AllowedOrigins         []string      `json:"allowedOrigins"`
	EnableMetrics          bool          `json:"enableMetrics"`
	EnableHealthCheck      bool          `json:"enableHealthCheck"`
	LogLevel               string        `json:"logLevel"`
}

// GameServerStats contains runtime statistics
type GameServerStats struct {
	ActiveConnections    int                    `json:"activeConnections"`
	ActiveRooms          int                    `json:"activeRooms"`
	TotalGamesPlayed     int64                  `json:"totalGamesPlayed"`
	TotalPlayersServed   int64                  `json:"totalPlayersServed"`
	AverageGameDuration  float64                `json:"averageGameDuration"`
	PopularGameTypes     map[string]int         `json:"popularGameTypes"`
	MatchmakingStats     map[string]interface{} `json:"matchmakingStats"`
	UptimeSeconds        float64                `json:"uptimeSeconds"`
	MemoryUsage          map[string]interface{} `json:"memoryUsage"`
	LastUpdated          time.Time              `json:"lastUpdated"`
}

// GameServer is the main multiplayer game server
type GameServer struct {
	config         *GameServerConfig
	wsManager      *WebSocketManager
	roomManager    *RoomManager
	matchmaking    *MatchmakingService
	eventBus       *EventBus
	eventProcessor *EventProcessor
	miniGameEngine *minigame.MiniGameEngine
	httpServer     *http.Server
	router         *mux.Router
	stats          *GameServerStats
	mu             sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
	startTime      time.Time
	isRunning      bool
}

// NewGameServer creates a new game server instance
func NewGameServer(config *GameServerConfig, miniGameEngine *minigame.MiniGameEngine) *GameServer {
	if config == nil {
		config = GetDefaultConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	// Create components
	wsManager := NewWebSocketManager(ctx)
	roomManager := NewRoomManager(ctx, wsManager, miniGameEngine)
	matchmaking := NewMatchmakingService(ctx, wsManager, roomManager)
	eventBus := NewEventBus(ctx, wsManager)
	eventProcessor := NewEventProcessor(eventBus, roomManager, matchmaking, miniGameEngine, wsManager)

	// Create stats
	stats := &GameServerStats{
		PopularGameTypes: make(map[string]int),
		MatchmakingStats: make(map[string]interface{}),
		MemoryUsage:      make(map[string]interface{}),
		LastUpdated:      time.Now(),
	}

	server := &GameServer{
		config:         config,
		wsManager:      wsManager,
		roomManager:    roomManager,
		matchmaking:    matchmaking,
		eventBus:       eventBus,
		eventProcessor: eventProcessor,
		miniGameEngine: miniGameEngine,
		stats:          stats,
		ctx:            ctx,
		cancel:         cancel,
		startTime:      time.Now(),
		isRunning:      false,
	}

	// Set up HTTP router
	server.setupRouter()

	return server
}

// GetDefaultConfig returns default server configuration
func GetDefaultConfig() *GameServerConfig {
	return &GameServerConfig{
		Port:                   8082,
		MaxConnections:         1000,
		MaxRooms:               100,
		MaxPlayersPerRoom:      8,
		ConnectionTimeout:      5 * time.Minute,
		RoomInactivityTimeout:  30 * time.Minute,
		MatchmakingTimeout:     5 * time.Minute,
		EnableCORS:             true,
		AllowedOrigins:         []string{"*"}, // Configure properly for production
		EnableMetrics:          true,
		EnableHealthCheck:      true,
		LogLevel:               "info",
	}
}

// Start starts the game server
func (gs *GameServer) Start() error {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	if gs.isRunning {
		return fmt.Errorf("server is already running")
	}

	// Create HTTP server
	gs.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", gs.config.Port),
		Handler:      gs.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start statistics update routine
	go gs.updateStatsRoutine()

	// Start metrics collection if enabled
	if gs.config.EnableMetrics {
		go gs.metricsRoutine()
	}

	gs.isRunning = true

	// Publish server start event
	gs.eventBus.PublishEvent(CreateEvent(EventTypeSystemError, "game_server", map[string]interface{}{
		"action": "server_start",
		"port":   gs.config.Port,
	}))

	// Start HTTP server (this blocks)
	fmt.Printf("🎮 Game Server starting on port %d\n", gs.config.Port)
	if err := gs.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		gs.isRunning = false
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil
}

// Stop gracefully stops the game server
func (gs *GameServer) Stop() error {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	if !gs.isRunning {
		return fmt.Errorf("server is not running")
	}

	fmt.Println("🛑 Shutting down Game Server...")

	// Publish shutdown event
	gs.eventBus.PublishEvent(CreateEvent(EventTypeSystemShutdown, "game_server", map[string]interface{}{
		"reason": "graceful_shutdown",
	}))

	// Stop HTTP server
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := gs.httpServer.Shutdown(ctx); err != nil {
		fmt.Printf("❌ Error shutting down HTTP server: %v\n", err)
	}

	// Cancel context to stop all goroutines
	gs.cancel()

	// Shutdown components in order
	gs.matchmaking.Shutdown()
	gs.roomManager.Shutdown()
	gs.wsManager.Shutdown()
	gs.eventBus.Shutdown()

	gs.isRunning = false
	fmt.Println("✅ Game Server shutdown complete")

	return nil
}

// setupRouter sets up the HTTP router with all endpoints
func (gs *GameServer) setupRouter() {
	gs.router = mux.NewRouter()

	// Enable CORS if configured
	if gs.config.EnableCORS {
		gs.router.Use(gs.corsMiddleware)
	}

	// Add logging middleware
	gs.router.Use(gs.loggingMiddleware)

	// Health check endpoint
	if gs.config.EnableHealthCheck {
		gs.router.HandleFunc("/health", gs.handleHealth).Methods("GET")
	}

	// Metrics endpoint
	if gs.config.EnableMetrics {
		gs.router.HandleFunc("/metrics", gs.handleMetrics).Methods("GET")
	}

	// WebSocket endpoint
	gs.router.HandleFunc("/ws/{username}", gs.handleWebSocket).Methods("GET")

	// Game API endpoints
	api := gs.router.PathPrefix("/api/v1").Subrouter()

	// Room management
	api.HandleFunc("/rooms", gs.handleListRooms).Methods("GET")
	api.HandleFunc("/rooms", gs.handleCreateRoom).Methods("POST")
	api.HandleFunc("/rooms/{roomId}", gs.handleGetRoom).Methods("GET")
	api.HandleFunc("/rooms/{roomId}/join", gs.handleJoinRoom).Methods("POST")
	api.HandleFunc("/rooms/{roomId}/leave", gs.handleLeaveRoom).Methods("POST")
	api.HandleFunc("/rooms/{roomId}/ready", gs.handleSetReady).Methods("POST")
	api.HandleFunc("/rooms/{roomId}/start", gs.handleStartGame).Methods("POST")
	api.HandleFunc("/rooms/{roomId}/action", gs.handleGameAction).Methods("POST")

	// Matchmaking
	api.HandleFunc("/matchmaking/join", gs.handleJoinMatchmaking).Methods("POST")
	api.HandleFunc("/matchmaking/leave", gs.handleLeaveMatchmaking).Methods("POST")
	api.HandleFunc("/matchmaking/status/{username}", gs.handleMatchmakingStatus).Methods("GET")
	api.HandleFunc("/matchmaking/queue/{gameType}", gs.handleQueueStatus).Methods("GET")

	// New Matching System WebSocket endpoints
	gs.router.HandleFunc("/ws/matching", gs.handleMatchingWebSocket).Methods("GET")

	// Game types and configurations
	api.HandleFunc("/games/types", gs.handleListGameTypes).Methods("GET")

	// Statistics
	api.HandleFunc("/stats", gs.handleStats).Methods("GET")
	api.HandleFunc("/stats/pools", gs.handlePoolStats).Methods("GET")

	// Events (for debugging/monitoring)
	api.HandleFunc("/events/history", gs.handleEventHistory).Methods("GET")
}

// HTTP Handlers

func (gs *GameServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	gs.mu.RLock()
	defer gs.mu.RUnlock()

	health := map[string]interface{}{
		"status":     "healthy",
		"uptime":     time.Since(gs.startTime).Seconds(),
		"version":    "1.0.0",
		"timestamp":  time.Now(),
		"components": map[string]string{
			"websocket":   "healthy",
			"rooms":       "healthy",
			"matchmaking": "healthy",
			"events":      "healthy",
		},
	}

	if !gs.isRunning {
		health["status"] = "unhealthy"
		w.WriteHeader(http.StatusServiceUnavailable)
	}

	gs.writeJSONResponse(w, health)
}

func (gs *GameServer) handleMetrics(w http.ResponseWriter, r *http.Request) {
	gs.updateStats()
	gs.writeJSONResponse(w, gs.stats)
}

func (gs *GameServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	// TODO: Add authentication middleware to validate user
	// For now, we'll accept any username

	if err := gs.wsManager.HandleWebSocket(w, r, username); err != nil {
		http.Error(w, fmt.Sprintf("WebSocket error: %v", err), http.StatusInternalServerError)
		return
	}

	// Publish connect event
	gs.eventBus.PublishEvent(CreateUserEvent(EventTypeConnect, username, map[string]interface{}{
		"timestamp": time.Now(),
		"userAgent": r.UserAgent(),
		"remoteAddr": r.RemoteAddr,
	}))
}

func (gs *GameServer) handleListRooms(w http.ResponseWriter, r *http.Request) {
	rooms := gs.roomManager.ListPublicRooms()

	// Convert to response format
	roomList := make([]map[string]interface{}, len(rooms))
	for i, room := range rooms {
		roomList[i] = room.GetRoomStats()
	}

	gs.writeJSONResponse(w, map[string]interface{}{
		"rooms": roomList,
		"total": len(roomList),
	})
}

func (gs *GameServer) handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement room creation from HTTP request
	// Parse request body for room settings
	// Validate user authentication
	// Create room and return room info

	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleGetRoom(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement get room info
	// Parse room ID from URL
	// Return room details

	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement join room from HTTP request
	// Parse room ID and user info
	// Join room and return status

	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleLeaveRoom(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement leave room from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleSetReady(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement set ready state from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleStartGame(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement start game from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleGameAction(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement game action from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleJoinMatchmaking(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement join matchmaking from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleLeaveMatchmaking(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement leave matchmaking from HTTP request
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (gs *GameServer) handleMatchmakingStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	status, err := gs.matchmaking.GetMatchmakingStatus(username)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	gs.writeJSONResponse(w, status)
}

func (gs *GameServer) handleListGameTypes(w http.ResponseWriter, r *http.Request) {
	gameTypes := gs.miniGameEngine.ListGameTypes()
	gs.writeJSONResponse(w, map[string]interface{}{
		"gameTypes": gameTypes,
	})
}

func (gs *GameServer) handleStats(w http.ResponseWriter, r *http.Request) {
	gs.updateStats()
	gs.writeJSONResponse(w, gs.stats)
}

func (gs *GameServer) handlePoolStats(w http.ResponseWriter, r *http.Request) {
	poolStats := gs.matchmaking.GetPoolStats()
	gs.writeJSONResponse(w, poolStats)
}

func (gs *GameServer) handleEventHistory(w http.ResponseWriter, r *http.Request) {
	// TODO: Parse query parameters for filtering
	limit := 100 // default
	events := gs.eventBus.GetEventHistory(limit, nil, nil, "")

	gs.writeJSONResponse(w, map[string]interface{}{
		"events": events,
		"count":  len(events),
	})
}

func (gs *GameServer) handleQueueStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameType := vars["gameType"]

	if gameType == "" {
		http.Error(w, "Game type is required", http.StatusBadRequest)
		return
	}

	// TODO: Connect to new matching system
	// For now, return basic queue info
	gs.writeJSONResponse(w, map[string]interface{}{
		"game_type": gameType,
		"queue_length": 0,
		"estimated_wait": 30,
		"active_rooms": 0,
	})
}

func (gs *GameServer) handleMatchingWebSocket(w http.ResponseWriter, r *http.Request) {
	// Create new matching handler instance
	matchingHandler := NewMatchingWebSocketHandler()
	matchingHandler.HandleWebSocket(w, r)
}

// Middleware

func (gs *GameServer) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Configure properly for production
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (gs *GameServer) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)

		// TODO: Use proper logging library
		fmt.Printf("%s %s %d %v\n", r.Method, r.URL.Path, wrapped.statusCode, duration)
	})
}

// Helper types and functions

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (gs *GameServer) writeJSONResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")

	// TODO: Use proper JSON encoding with error handling
	// For now, we'll use a simple approach
	if err := gs.encodeJSON(w, data); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func (gs *GameServer) encodeJSON(w http.ResponseWriter, data interface{}) error {
	// TODO: Implement proper JSON encoding
	// This is a placeholder
	fmt.Fprintf(w, `{"status": "ok", "data": %v}`, data)
	return nil
}

// Statistics and monitoring

func (gs *GameServer) updateStats() {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	gs.stats.ActiveConnections = gs.wsManager.GetActiveConnectionsCount()
	gs.stats.UptimeSeconds = time.Since(gs.startTime).Seconds()
	gs.stats.MatchmakingStats = gs.matchmaking.GetPoolStats()
	gs.stats.LastUpdated = time.Now()

	// Count active rooms
	activeRooms := 0
	for _, room := range gs.roomManager.ListPublicRooms() {
		if room.State == RoomStateWaiting || room.State == RoomStateInProgress {
			activeRooms++
		}
	}
	gs.stats.ActiveRooms = activeRooms

	// TODO: Add more detailed statistics
	// - Memory usage
	// - Game type popularity
	// - Average game duration
	// - Player metrics
}

func (gs *GameServer) updateStatsRoutine() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-gs.ctx.Done():
			return
		case <-ticker.C:
			gs.updateStats()
		}
	}
}

func (gs *GameServer) metricsRoutine() {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-gs.ctx.Done():
			return
		case <-ticker.C:
			// TODO: Collect and send metrics to monitoring system
			// - Prometheus metrics
			// - Custom application metrics
			// - Performance metrics
		}
	}
}

// Public API methods

// GetConfig returns the server configuration
func (gs *GameServer) GetConfig() *GameServerConfig {
	return gs.config
}

// GetStats returns current server statistics
func (gs *GameServer) GetStats() *GameServerStats {
	gs.updateStats()
	return gs.stats
}

// IsRunning returns whether the server is currently running
func (gs *GameServer) IsRunning() bool {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return gs.isRunning
}

// GetWebSocketManager returns the WebSocket manager
func (gs *GameServer) GetWebSocketManager() *WebSocketManager {
	return gs.wsManager
}

// GetRoomManager returns the room manager
func (gs *GameServer) GetRoomManager() *RoomManager {
	return gs.roomManager
}

// GetMatchmakingService returns the matchmaking service
func (gs *GameServer) GetMatchmakingService() *MatchmakingService {
	return gs.matchmaking
}

// GetEventBus returns the event bus
func (gs *GameServer) GetEventBus() *EventBus {
	return gs.eventBus
}