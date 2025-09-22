package matching

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// MatchRequest represents a player's request to join a game
type MatchRequest struct {
	PlayerID    string                 `json:"player_id"`
	GameType    string                 `json:"game_type"`
	Platform    string                 `json:"platform"` // "web", "mobile", "desktop"
	SkillLevel  int                    `json:"skill_level"`
	Preferences map[string]interface{} `json:"preferences"`
	Connection  *websocket.Conn        `json:"-"`
	RequestTime time.Time              `json:"request_time"`
}

// GameRoom represents an active game room
type GameRoom struct {
	ID           string                 `json:"id"`
	GameType     string                 `json:"game_type"`
	Players      []*MatchRequest        `json:"players"`
	MaxPlayers   int                    `json:"max_players"`
	Status       string                 `json:"status"` // "waiting", "starting", "in_progress", "finished"
	CreatedAt    time.Time              `json:"created_at"`
	StartedAt    *time.Time             `json:"started_at,omitempty"`
	FinishedAt   *time.Time             `json:"finished_at,omitempty"`
	Settings     map[string]interface{} `json:"settings"`
	CrossPlatform bool                  `json:"cross_platform"`
}

// Matchmaker handles player matching and room management
type Matchmaker struct {
	mu            sync.RWMutex
	waitingQueue  map[string][]*MatchRequest // gameType -> requests
	activeRooms   map[string]*GameRoom       // roomID -> room
	playerRooms   map[string]string          // playerID -> roomID
	gameTypes     map[string]*GameTypeConfig
	ctx           context.Context
	cancel        context.CancelFunc
	matchInterval time.Duration
}

// GameTypeConfig defines configuration for different game types
type GameTypeConfig struct {
	Name                 string        `json:"name"`
	MinPlayers          int           `json:"min_players"`
	MaxPlayers          int           `json:"max_players"`
	OptimalPlayers      int           `json:"optimal_players"`
	MatchTimeout        time.Duration `json:"match_timeout"`
	SkillRangeThreshold int           `json:"skill_range_threshold"`
	CrossPlatformEnabled bool         `json:"cross_platform_enabled"`
	AllowedPlatforms    []string      `json:"allowed_platforms"`
}

// NewMatchmaker creates a new matchmaker instance
func NewMatchmaker() *Matchmaker {
	ctx, cancel := context.WithCancel(context.Background())

	mm := &Matchmaker{
		waitingQueue:  make(map[string][]*MatchRequest),
		activeRooms:   make(map[string]*GameRoom),
		playerRooms:   make(map[string]string),
		gameTypes:     make(map[string]*GameTypeConfig),
		ctx:           ctx,
		cancel:        cancel,
		matchInterval: 2 * time.Second,
	}

	// Initialize default game types
	mm.initializeGameTypes()

	// Start matching process
	go mm.runMatchmaker()

	return mm
}

// initializeGameTypes sets up default game configurations
func (mm *Matchmaker) initializeGameTypes() {
	gameTypes := []*GameTypeConfig{
		{
			Name:                 "paint_battle",
			MinPlayers:          2,
			MaxPlayers:          8,
			OptimalPlayers:      4,
			MatchTimeout:        30 * time.Second,
			SkillRangeThreshold: 200,
			CrossPlatformEnabled: true,
			AllowedPlatforms:    []string{"web", "mobile", "desktop"},
		},
		{
			Name:                 "physics_jump",
			MinPlayers:          1,
			MaxPlayers:          6,
			OptimalPlayers:      3,
			MatchTimeout:        15 * time.Second,
			SkillRangeThreshold: 150,
			CrossPlatformEnabled: true,
			AllowedPlatforms:    []string{"web", "mobile", "desktop"},
		},
		{
			Name:                 "memory_match",
			MinPlayers:          2,
			MaxPlayers:          4,
			OptimalPlayers:      2,
			MatchTimeout:        20 * time.Second,
			SkillRangeThreshold: 100,
			CrossPlatformEnabled: true,
			AllowedPlatforms:    []string{"web", "mobile"},
		},
		{
			Name:                 "click_speed",
			MinPlayers:          1,
			MaxPlayers:          10,
			OptimalPlayers:      5,
			MatchTimeout:        10 * time.Second,
			SkillRangeThreshold: 50,
			CrossPlatformEnabled: true,
			AllowedPlatforms:    []string{"web", "mobile", "desktop"},
		},
	}

	for _, gameType := range gameTypes {
		mm.gameTypes[gameType.Name] = gameType
	}
}

// JoinQueue adds a player to the matching queue
func (mm *Matchmaker) JoinQueue(request *MatchRequest) error {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	// Validate game type
	gameConfig, exists := mm.gameTypes[request.GameType]
	if !exists {
		return &MatchError{Code: "INVALID_GAME_TYPE", Message: "Game type not supported"}
	}

	// Validate platform
	platformAllowed := false
	for _, allowedPlatform := range gameConfig.AllowedPlatforms {
		if request.Platform == allowedPlatform {
			platformAllowed = true
			break
		}
	}
	if !platformAllowed {
		return &MatchError{Code: "PLATFORM_NOT_SUPPORTED", Message: "Platform not supported for this game type"}
	}

	// Check if player is already in queue or room
	if existingRoomID, exists := mm.playerRooms[request.PlayerID]; exists {
		return &MatchError{Code: "ALREADY_IN_GAME", Message: "Player already in game room: " + existingRoomID}
	}

	// Add to waiting queue
	if mm.waitingQueue[request.GameType] == nil {
		mm.waitingQueue[request.GameType] = make([]*MatchRequest, 0)
	}

	request.RequestTime = time.Now()
	mm.waitingQueue[request.GameType] = append(mm.waitingQueue[request.GameType], request)

	log.Printf("Player %s joined queue for %s (platform: %s, skill: %d)",
		request.PlayerID, request.GameType, request.Platform, request.SkillLevel)

	// Send confirmation to player
	mm.sendMessageToPlayer(request, map[string]interface{}{
		"type": "queue_joined",
		"game_type": request.GameType,
		"position": len(mm.waitingQueue[request.GameType]),
		"estimated_wait": mm.estimateWaitTime(request.GameType),
	})

	return nil
}

// LeaveQueue removes a player from the matching queue
func (mm *Matchmaker) LeaveQueue(playerID string) error {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	// Find and remove player from all queues
	for gameType, queue := range mm.waitingQueue {
		for i, request := range queue {
			if request.PlayerID == playerID {
				// Remove from queue
				mm.waitingQueue[gameType] = append(queue[:i], queue[i+1:]...)

				// Send confirmation
				mm.sendMessageToPlayer(request, map[string]interface{}{
					"type": "queue_left",
					"game_type": gameType,
				})

				log.Printf("Player %s left queue for %s", playerID, gameType)
				return nil
			}
		}
	}

	return &MatchError{Code: "NOT_IN_QUEUE", Message: "Player not found in any queue"}
}

// runMatchmaker is the main matching loop
func (mm *Matchmaker) runMatchmaker() {
	ticker := time.NewTicker(mm.matchInterval)
	defer ticker.Stop()

	for {
		select {
		case <-mm.ctx.Done():
			return
		case <-ticker.C:
			mm.processMatching()
		}
	}
}

// processMatching attempts to create matches from waiting queues
func (mm *Matchmaker) processMatching() {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	for gameType, queue := range mm.waitingQueue {
		if len(queue) == 0 {
			continue
		}

		gameConfig := mm.gameTypes[gameType]
		if gameConfig == nil {
			continue
		}

		// Try to create matches
		for len(queue) >= gameConfig.MinPlayers {
			// Find compatible players
			selectedPlayers := mm.findCompatiblePlayers(queue, gameConfig)

			if len(selectedPlayers) >= gameConfig.MinPlayers {
				// Create room
				room := mm.createGameRoom(gameType, selectedPlayers, gameConfig)

				// Remove selected players from queue
				queue = mm.removePlayersFromQueue(queue, selectedPlayers)
				mm.waitingQueue[gameType] = queue

				// Start the room
				go mm.startGameRoom(room)
			} else {
				// No compatible players found, check for timeouts
				mm.checkQueueTimeouts(gameType, queue)
				break
			}
		}
	}
}

// findCompatiblePlayers selects players that can play together
func (mm *Matchmaker) findCompatiblePlayers(queue []*MatchRequest, config *GameTypeConfig) []*MatchRequest {
	if len(queue) == 0 {
		return nil
	}

	// Start with the first player (longest waiting)
	anchor := queue[0]
	selected := []*MatchRequest{anchor}

	// Find compatible players
	for i := 1; i < len(queue) && len(selected) < config.MaxPlayers; i++ {
		candidate := queue[i]

		// Check skill compatibility
		skillDiff := abs(anchor.SkillLevel - candidate.SkillLevel)
		if skillDiff <= config.SkillRangeThreshold {

			// Check platform compatibility
			if config.CrossPlatformEnabled || anchor.Platform == candidate.Platform {
				selected = append(selected, candidate)
			}
		}
	}

	// Prefer optimal player count, but accept minimum
	if len(selected) >= config.OptimalPlayers ||
	   (len(selected) >= config.MinPlayers && time.Since(anchor.RequestTime) > config.MatchTimeout) {
		return selected
	}

	return nil
}

// createGameRoom creates a new game room with selected players
func (mm *Matchmaker) createGameRoom(gameType string, players []*MatchRequest, config *GameTypeConfig) *GameRoom {
	roomID := generateRoomID()

	room := &GameRoom{
		ID:           roomID,
		GameType:     gameType,
		Players:      players,
		MaxPlayers:   config.MaxPlayers,
		Status:       "waiting",
		CreatedAt:    time.Now(),
		Settings:     map[string]interface{}{
			"skill_range": calculateSkillRange(players),
			"platforms":   getPlatforms(players),
		},
		CrossPlatform: hasMixedPlatforms(players),
	}

	// Add to active rooms
	mm.activeRooms[roomID] = room

	// Update player room mappings
	for _, player := range players {
		mm.playerRooms[player.PlayerID] = roomID
	}

	log.Printf("Created room %s for game type %s with %d players",
		roomID, gameType, len(players))

	return room
}

// startGameRoom initializes and starts a game room
func (mm *Matchmaker) startGameRoom(room *GameRoom) {
	room.Status = "starting"
	startTime := time.Now()
	room.StartedAt = &startTime

	// Notify all players
	for _, player := range room.Players {
		mm.sendMessageToPlayer(player, map[string]interface{}{
			"type": "match_found",
			"room_id": room.ID,
			"game_type": room.GameType,
			"players": mm.getPlayerInfoList(room.Players),
			"settings": room.Settings,
			"cross_platform": room.CrossPlatform,
		})
	}

	log.Printf("Started game room %s with %d players", room.ID, len(room.Players))

	// Set room to in progress after initial setup
	time.Sleep(5 * time.Second)
	room.Status = "in_progress"

	// Notify players game is starting
	for _, player := range room.Players {
		mm.sendMessageToPlayer(player, map[string]interface{}{
			"type": "game_starting",
			"room_id": room.ID,
			"countdown": 3,
		})
	}
}

// Helper functions

func (mm *Matchmaker) removePlayersFromQueue(queue []*MatchRequest, toRemove []*MatchRequest) []*MatchRequest {
	removeMap := make(map[string]bool)
	for _, player := range toRemove {
		removeMap[player.PlayerID] = true
	}

	var newQueue []*MatchRequest
	for _, player := range queue {
		if !removeMap[player.PlayerID] {
			newQueue = append(newQueue, player)
		}
	}
	return newQueue
}

func (mm *Matchmaker) estimateWaitTime(gameType string) int {
	gameConfig := mm.gameTypes[gameType]
	if gameConfig == nil {
		return 30 // Default 30 seconds
	}

	queueLength := len(mm.waitingQueue[gameType])
	if queueLength == 0 {
		return 10
	}

	// Simple estimation based on queue length and required players
	estimatedMatches := queueLength / gameConfig.OptimalPlayers
	return max(10, estimatedMatches * int(mm.matchInterval.Seconds()))
}

func (mm *Matchmaker) checkQueueTimeouts(gameType string, queue []*MatchRequest) {
	gameConfig := mm.gameTypes[gameType]
	now := time.Now()

	for _, request := range queue {
		if now.Sub(request.RequestTime) > gameConfig.MatchTimeout*2 {
			// Offer to play with bots or expand skill range
			mm.sendMessageToPlayer(request, map[string]interface{}{
				"type": "queue_timeout_options",
				"options": []string{"expand_skill_range", "play_with_bots", "continue_waiting"},
			})
		}
	}
}

func (mm *Matchmaker) sendMessageToPlayer(player *MatchRequest, message map[string]interface{}) {
	if player.Connection != nil {
		jsonData, _ := json.Marshal(message)
		player.Connection.WriteMessage(websocket.TextMessage, jsonData)
	}
}

func (mm *Matchmaker) getPlayerInfoList(players []*MatchRequest) []map[string]interface{} {
	var result []map[string]interface{}
	for _, player := range players {
		result = append(result, map[string]interface{}{
			"player_id": player.PlayerID,
			"platform": player.Platform,
			"skill_level": player.SkillLevel,
		})
	}
	return result
}

// Utility functions

func generateRoomID() string {
	return "room_" + time.Now().Format("20060102_150405") + "_" + randString(6)
}

func calculateSkillRange(players []*MatchRequest) map[string]int {
	if len(players) == 0 {
		return map[string]int{"min": 0, "max": 0, "avg": 0}
	}

	min, max, sum := players[0].SkillLevel, players[0].SkillLevel, 0
	for _, player := range players {
		if player.SkillLevel < min {
			min = player.SkillLevel
		}
		if player.SkillLevel > max {
			max = player.SkillLevel
		}
		sum += player.SkillLevel
	}

	return map[string]int{
		"min": min,
		"max": max,
		"avg": sum / len(players),
	}
}

func getPlatforms(players []*MatchRequest) []string {
	platformSet := make(map[string]bool)
	for _, player := range players {
		platformSet[player.Platform] = true
	}

	var platforms []string
	for platform := range platformSet {
		platforms = append(platforms, platform)
	}
	return platforms
}

func hasMixedPlatforms(players []*MatchRequest) bool {
	if len(players) <= 1 {
		return false
	}

	firstPlatform := players[0].Platform
	for _, player := range players[1:] {
		if player.Platform != firstPlatform {
			return true
		}
	}
	return false
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func randString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// MatchError represents matching-related errors
type MatchError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *MatchError) Error() string {
	return e.Message
}

// Public API methods

// GetQueueStatus returns current queue information
func (mm *Matchmaker) GetQueueStatus(gameType string) map[string]interface{} {
	mm.mu.RLock()
	defer mm.mu.RUnlock()

	queue := mm.waitingQueue[gameType]
	if queue == nil {
		queue = []*MatchRequest{}
	}

	return map[string]interface{}{
		"game_type": gameType,
		"queue_length": len(queue),
		"estimated_wait": mm.estimateWaitTime(gameType),
		"active_rooms": len(mm.activeRooms),
	}
}

// GetRoomInfo returns information about a specific room
func (mm *Matchmaker) GetRoomInfo(roomID string) (*GameRoom, error) {
	mm.mu.RLock()
	defer mm.mu.RUnlock()

	room, exists := mm.activeRooms[roomID]
	if !exists {
		return nil, &MatchError{Code: "ROOM_NOT_FOUND", Message: "Game room not found"}
	}

	return room, nil
}

// EndGame marks a game room as finished
func (mm *Matchmaker) EndGame(roomID string, results map[string]interface{}) error {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	room, exists := mm.activeRooms[roomID]
	if !exists {
		return &MatchError{Code: "ROOM_NOT_FOUND", Message: "Game room not found"}
	}

	room.Status = "finished"
	finishedTime := time.Now()
	room.FinishedAt = &finishedTime

	// Clean up player mappings
	for _, player := range room.Players {
		delete(mm.playerRooms, player.PlayerID)
	}

	// Remove room after a delay
	go func() {
		time.Sleep(5 * time.Minute)
		mm.mu.Lock()
		delete(mm.activeRooms, roomID)
		mm.mu.Unlock()
	}()

	log.Printf("Game room %s finished", roomID)
	return nil
}

// Shutdown gracefully shuts down the matchmaker
func (mm *Matchmaker) Shutdown() {
	mm.cancel()
	log.Println("Matchmaker shutdown")
}