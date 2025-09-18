// internal/gameserver/matchmaking.go
package gameserver

import (
	"context"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/minigame"
)

// MatchmakingRequest represents a request for matchmaking
type MatchmakingRequest struct {
	ID              uuid.UUID             `json:"id"`
	Username        string                `json:"username"`
	GameType        minigame.GameType     `json:"gameType"`
	SkillLevel      int                   `json:"skillLevel"`      // 1-100 skill rating
	PreferredPlayers int                  `json:"preferredPlayers"` // 2, 4, 6, 8
	MaxWaitTime     time.Duration         `json:"maxWaitTime"`     // Maximum time to wait
	CreatedAt       time.Time             `json:"createdAt"`
	Preferences     map[string]interface{} `json:"preferences"`
	Connection      *WebSocketConnection   `json:"-"`
}

// MatchmakingPool represents a pool of players waiting for a match
type MatchmakingPool struct {
	gameType    minigame.GameType
	requests    []*MatchmakingRequest
	mu          sync.RWMutex
}

// MatchResult represents the result of successful matchmaking
type MatchResult struct {
	MatchID     uuid.UUID               `json:"matchId"`
	Players     []*MatchmakingRequest   `json:"players"`
	GameType    minigame.GameType       `json:"gameType"`
	AverageSkill float64                `json:"averageSkill"`
	CreatedAt   time.Time               `json:"createdAt"`
}

// MatchmakingService handles player matchmaking
type MatchmakingService struct {
	pools           map[minigame.GameType]*MatchmakingPool
	activeRequests  map[uuid.UUID]*MatchmakingRequest
	userRequests    map[string]uuid.UUID // username -> request ID
	matchHistory    map[string][]time.Time // username -> match times (for cooldown)
	wsManager       *WebSocketManager
	roomManager     *RoomManager
	mu              sync.RWMutex
	matchTicker     *time.Ticker
	ctx             context.Context
	cancel          context.CancelFunc
}

// MatchmakingConfig contains configuration for matchmaking
type MatchmakingConfig struct {
	TickInterval         time.Duration `json:"tickInterval"`         // How often to try matching
	MaxSkillDifference   int           `json:"maxSkillDifference"`   // Max skill level difference
	MinPlayersPerMatch   int           `json:"minPlayersPerMatch"`   // Minimum players per match
	MaxPlayersPerMatch   int           `json:"maxPlayersPerMatch"`   // Maximum players per match
	DefaultWaitTime      time.Duration `json:"defaultWaitTime"`      // Default max wait time
	MaxWaitTime          time.Duration `json:"maxWaitTime"`          // Absolute max wait time
	SkillExpansionRate   float64       `json:"skillExpansionRate"`   // How fast to expand skill range
	MatchCooldown        time.Duration `json:"matchCooldown"`        // Cooldown between matches
}

// NewMatchmakingService creates a new matchmaking service
func NewMatchmakingService(ctx context.Context, wsManager *WebSocketManager, roomManager *RoomManager) *MatchmakingService {
	serviceCtx, cancel := context.WithCancel(ctx)

	ms := &MatchmakingService{
		pools:          make(map[minigame.GameType]*MatchmakingPool),
		activeRequests: make(map[uuid.UUID]*MatchmakingRequest),
		userRequests:   make(map[string]uuid.UUID),
		matchHistory:   make(map[string][]time.Time),
		wsManager:      wsManager,
		roomManager:    roomManager,
		ctx:            serviceCtx,
		cancel:         cancel,
	}

	// Initialize pools for each game type
	gameTypes := []minigame.GameType{
		minigame.GameTypeClickSpeed,
		minigame.GameTypeMemoryMatch,
		minigame.GameTypeNumberGuess,
		minigame.GameTypeWordScramble,
		minigame.GameTypePuzzle,
	}

	for _, gameType := range gameTypes {
		ms.pools[gameType] = &MatchmakingPool{
			gameType: gameType,
			requests: make([]*MatchmakingRequest, 0),
		}
	}

	// Start matchmaking ticker
	ms.matchTicker = time.NewTicker(2 * time.Second)
	go ms.matchmakingLoop()

	// Start cleanup routine
	go ms.cleanupRoutine()

	return ms
}

// GetDefaultConfig returns default matchmaking configuration
func (ms *MatchmakingService) GetDefaultConfig() *MatchmakingConfig {
	return &MatchmakingConfig{
		TickInterval:       2 * time.Second,
		MaxSkillDifference: 20,
		MinPlayersPerMatch: 2,
		MaxPlayersPerMatch: 8,
		DefaultWaitTime:    60 * time.Second,
		MaxWaitTime:        300 * time.Second, // 5 minutes
		SkillExpansionRate: 1.2,               // 20% expansion per tick
		MatchCooldown:      10 * time.Second,
	}
}

// JoinMatchmaking adds a player to the matchmaking queue
func (ms *MatchmakingService) JoinMatchmaking(username string, gameType minigame.GameType, skillLevel int, preferences map[string]interface{}) (*MatchmakingRequest, error) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	// Check if user is already in matchmaking
	if _, exists := ms.userRequests[username]; exists {
		return nil, fmt.Errorf("user %s is already in matchmaking", username)
	}

	// Check if user is in a room
	if _, exists := ms.roomManager.GetUserRoom(username); exists {
		return nil, fmt.Errorf("user %s is already in a game room", username)
	}

	// Check cooldown
	if ms.isInCooldown(username) {
		return nil, fmt.Errorf("user %s is in matchmaking cooldown", username)
	}

	// Get user connection
	conn, exists := ms.wsManager.GetConnection(username)
	if !exists {
		return nil, fmt.Errorf("user %s is not connected", username)
	}

	// Validate skill level
	if skillLevel < 1 || skillLevel > 100 {
		skillLevel = 50 // Default skill level
	}

	// Parse preferences
	preferredPlayers := 2 // default
	maxWaitTime := ms.GetDefaultConfig().DefaultWaitTime

	if preferences != nil {
		if v, ok := preferences["preferredPlayers"].(float64); ok && v >= 2 && v <= 8 {
			preferredPlayers = int(v)
		}
		if v, ok := preferences["maxWaitTime"].(float64); ok {
			waitTime := time.Duration(v) * time.Second
			if waitTime > 0 && waitTime <= ms.GetDefaultConfig().MaxWaitTime {
				maxWaitTime = waitTime
			}
		}
	}

	// Create matchmaking request
	request := &MatchmakingRequest{
		ID:              uuid.New(),
		Username:        username,
		GameType:        gameType,
		SkillLevel:      skillLevel,
		PreferredPlayers: preferredPlayers,
		MaxWaitTime:     maxWaitTime,
		CreatedAt:       time.Now(),
		Preferences:     preferences,
		Connection:      conn,
	}

	// Add to pool
	pool, exists := ms.pools[gameType]
	if !exists {
		return nil, fmt.Errorf("unsupported game type: %s", gameType)
	}

	pool.mu.Lock()
	pool.requests = append(pool.requests, request)
	pool.mu.Unlock()

	ms.activeRequests[request.ID] = request
	ms.userRequests[username] = request.ID

	// Send matchmaking started message
	message := &WebSocketMessage{
		Type: MessageTypeMatchmaking,
		Data: map[string]interface{}{
			"status":            "searching",
			"requestId":         request.ID.String(),
			"gameType":          gameType,
			"estimatedWaitTime": maxWaitTime.Seconds(),
		},
		Timestamp: time.Now(),
	}
	ms.wsManager.SendToUser(username, message)

	return request, nil
}

// LeaveMatchmaking removes a player from the matchmaking queue
func (ms *MatchmakingService) LeaveMatchmaking(username string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	requestID, exists := ms.userRequests[username]
	if !exists {
		return fmt.Errorf("user %s is not in matchmaking", username)
	}

	request, exists := ms.activeRequests[requestID]
	if !exists {
		return fmt.Errorf("matchmaking request not found")
	}

	// Remove from pool
	pool := ms.pools[request.GameType]
	pool.mu.Lock()
	for i, req := range pool.requests {
		if req.ID == requestID {
			pool.requests = append(pool.requests[:i], pool.requests[i+1:]...)
			break
		}
	}
	pool.mu.Unlock()

	// Clean up
	delete(ms.activeRequests, requestID)
	delete(ms.userRequests, username)

	// Send matchmaking cancelled message
	message := &WebSocketMessage{
		Type: MessageTypeMatchCancelled,
		Data: map[string]interface{}{
			"reason": "user_cancelled",
		},
		Timestamp: time.Now(),
	}
	ms.wsManager.SendToUser(username, message)

	return nil
}

// matchmakingLoop runs the main matchmaking algorithm
func (ms *MatchmakingService) matchmakingLoop() {
	defer ms.matchTicker.Stop()

	for {
		select {
		case <-ms.ctx.Done():
			return

		case <-ms.matchTicker.C:
			ms.processMatchmaking()
		}
	}
}

// processMatchmaking attempts to create matches from the current pools
func (ms *MatchmakingService) processMatchmaking() {
	config := ms.GetDefaultConfig()

	for gameType, pool := range ms.pools {
		pool.mu.Lock()
		if len(pool.requests) < config.MinPlayersPerMatch {
			pool.mu.Unlock()
			continue
		}

		// Sort requests by wait time (longest waiting first)
		sort.Slice(pool.requests, func(i, j int) bool {
			return pool.requests[i].CreatedAt.Before(pool.requests[j].CreatedAt)
		})

		var matchedRequests []*MatchmakingRequest
		var remainingRequests []*MatchmakingRequest

		i := 0
		for i < len(pool.requests) {
			// Try to create a match starting with the longest waiting player
			match := ms.findMatch(pool.requests[i:], config)
			if match != nil {
				matchedRequests = append(matchedRequests, match...)
				// Remove matched players from the slice
				requestMap := make(map[uuid.UUID]bool)
				for _, req := range match {
					requestMap[req.ID] = true
				}

				for j := i; j < len(pool.requests); j++ {
					if !requestMap[pool.requests[j].ID] {
						remainingRequests = append(remainingRequests, pool.requests[j])
					}
				}
				break
			} else {
				remainingRequests = append(remainingRequests, pool.requests[i])
				i++
			}
		}

		// Update the pool with remaining requests
		pool.requests = remainingRequests
		pool.mu.Unlock()

		// Create room for matched players
		if len(matchedRequests) > 0 {
			ms.createMatchRoom(gameType, matchedRequests)
		}
	}

	// Clean up expired requests
	ms.cleanupExpiredRequests()
}

// findMatch attempts to find a suitable match from a list of requests
func (ms *MatchmakingService) findMatch(requests []*MatchmakingRequest, config *MatchmakingConfig) []*MatchmakingRequest {
	if len(requests) < config.MinPlayersPerMatch {
		return nil
	}

	anchor := requests[0]
	waitTime := time.Since(anchor.CreatedAt)

	// Calculate dynamic skill range based on wait time
	baseSkillRange := config.MaxSkillDifference
	expansionFactor := math.Pow(config.SkillExpansionRate, waitTime.Seconds()/30.0) // Expand every 30 seconds
	skillRange := int(float64(baseSkillRange) * expansionFactor)

	if skillRange > 50 { // Cap at 50 skill difference
		skillRange = 50
	}

	var candidates []*MatchmakingRequest
	candidates = append(candidates, anchor)

	// Find compatible players
	for i := 1; i < len(requests) && len(candidates) < config.MaxPlayersPerMatch; i++ {
		candidate := requests[i]

		// Check skill compatibility
		skillDiff := int(math.Abs(float64(anchor.SkillLevel - candidate.SkillLevel)))
		if skillDiff <= skillRange {
			candidates = append(candidates, candidate)
		}
	}

	// Check if we have enough players for a match
	if len(candidates) >= config.MinPlayersPerMatch {
		// Try to match preferred player count
		targetSize := anchor.PreferredPlayers
		if targetSize > len(candidates) {
			targetSize = len(candidates)
		}
		if targetSize < config.MinPlayersPerMatch {
			targetSize = config.MinPlayersPerMatch
		}

		return candidates[:targetSize]
	}

	return nil
}

// createMatchRoom creates a game room for matched players
func (ms *MatchmakingService) createMatchRoom(gameType minigame.GameType, players []*MatchmakingRequest) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if len(players) == 0 {
		return
	}

	// Use first player as host
	host := players[0]

	// Create room settings
	settings := map[string]interface{}{
		"maxPlayers": len(players),
		"minPlayers": len(players),
		"isPrivate":  false,
		"name":       fmt.Sprintf("Match Room - %s", gameType),
	}

	// Create room
	room, err := ms.roomManager.CreateRoom(host.Username, gameType, settings)
	if err != nil {
		// Handle error - notify players that match failed
		for _, player := range players {
			message := &WebSocketMessage{
				Type: MessageTypeError,
				Data: map[string]interface{}{
					"error":   "Failed to create match room",
					"details": err.Error(),
				},
				Timestamp: time.Now(),
			}
			ms.wsManager.SendToUser(player.Username, message)
		}
		return
	}

	// Add remaining players to room
	for i := 1; i < len(players); i++ {
		player := players[i]
		_, err := ms.roomManager.JoinRoom(room.ID, player.Username, "")
		if err != nil {
			// Handle error - player couldn't join
			message := &WebSocketMessage{
				Type: MessageTypeError,
				Data: map[string]interface{}{
					"error":   "Failed to join match room",
					"details": err.Error(),
				},
				Timestamp: time.Now(),
			}
			ms.wsManager.SendToUser(player.Username, message)
			continue
		}
	}

	// Clean up matchmaking requests
	for _, player := range players {
		delete(ms.activeRequests, player.ID)
		delete(ms.userRequests, player.Username)

		// Add to match history for cooldown
		ms.addToMatchHistory(player.Username)

		// Send match found message
		message := &WebSocketMessage{
			Type: MessageTypeMatchFound,
			Data: map[string]interface{}{
				"roomId":       room.ID.String(),
				"gameType":     gameType,
				"playerCount":  len(players),
				"averageSkill": ms.calculateAverageSkill(players),
			},
			Timestamp: time.Now(),
		}
		ms.wsManager.SendToUser(player.Username, message)
	}
}

// calculateAverageSkill calculates the average skill level of players
func (ms *MatchmakingService) calculateAverageSkill(players []*MatchmakingRequest) float64 {
	if len(players) == 0 {
		return 0
	}

	total := 0
	for _, player := range players {
		total += player.SkillLevel
	}

	return float64(total) / float64(len(players))
}

// isInCooldown checks if a user is in matchmaking cooldown
func (ms *MatchmakingService) isInCooldown(username string) bool {
	history, exists := ms.matchHistory[username]
	if !exists {
		return false
	}

	config := ms.GetDefaultConfig()
	now := time.Now()

	for _, matchTime := range history {
		if now.Sub(matchTime) < config.MatchCooldown {
			return true
		}
	}

	return false
}

// addToMatchHistory adds a match to user's history
func (ms *MatchmakingService) addToMatchHistory(username string) {
	now := time.Now()

	if history, exists := ms.matchHistory[username]; exists {
		// Keep only last 5 matches
		if len(history) >= 5 {
			history = history[1:]
		}
		ms.matchHistory[username] = append(history, now)
	} else {
		ms.matchHistory[username] = []time.Time{now}
	}
}

// cleanupExpiredRequests removes requests that have exceeded their wait time
func (ms *MatchmakingService) cleanupExpiredRequests() {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	now := time.Now()

	for _, pool := range ms.pools {
		pool.mu.Lock()
		var validRequests []*MatchmakingRequest

		for _, request := range pool.requests {
			if now.Sub(request.CreatedAt) > request.MaxWaitTime {
				// Request expired - remove and notify user
				delete(ms.activeRequests, request.ID)
				delete(ms.userRequests, request.Username)

				message := &WebSocketMessage{
					Type: MessageTypeMatchCancelled,
					Data: map[string]interface{}{
						"reason": "timeout",
						"waitTime": now.Sub(request.CreatedAt).Seconds(),
					},
					Timestamp: time.Now(),
				}
				ms.wsManager.SendToUser(request.Username, message)
			} else {
				validRequests = append(validRequests, request)
			}
		}

		pool.requests = validRequests
		pool.mu.Unlock()
	}
}

// cleanupRoutine periodically cleans up old match history
func (ms *MatchmakingService) cleanupRoutine() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ms.ctx.Done():
			return

		case <-ticker.C:
			ms.cleanupMatchHistory()
		}
	}
}

// cleanupMatchHistory removes old entries from match history
func (ms *MatchmakingService) cleanupMatchHistory() {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	now := time.Now()
	cutoff := 24 * time.Hour // Keep history for 24 hours

	for username, history := range ms.matchHistory {
		var validHistory []time.Time
		for _, matchTime := range history {
			if now.Sub(matchTime) < cutoff {
				validHistory = append(validHistory, matchTime)
			}
		}

		if len(validHistory) == 0 {
			delete(ms.matchHistory, username)
		} else {
			ms.matchHistory[username] = validHistory
		}
	}
}

// GetMatchmakingStatus returns the current status of a user's matchmaking request
func (ms *MatchmakingService) GetMatchmakingStatus(username string) (map[string]interface{}, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	requestID, exists := ms.userRequests[username]
	if !exists {
		return nil, fmt.Errorf("user %s is not in matchmaking", username)
	}

	request, exists := ms.activeRequests[requestID]
	if !exists {
		return nil, fmt.Errorf("matchmaking request not found")
	}

	waitTime := time.Since(request.CreatedAt)
	remainingTime := request.MaxWaitTime - waitTime

	if remainingTime < 0 {
		remainingTime = 0
	}

	// Count players in same pool
	pool := ms.pools[request.GameType]
	pool.mu.RLock()
	poolSize := len(pool.requests)
	pool.mu.RUnlock()

	return map[string]interface{}{
		"requestId":       request.ID.String(),
		"gameType":        request.GameType,
		"skillLevel":      request.SkillLevel,
		"waitTime":        waitTime.Seconds(),
		"remainingTime":   remainingTime.Seconds(),
		"poolSize":        poolSize,
		"estimatedMatch":  ms.estimateMatchTime(request),
	}, nil
}

// estimateMatchTime estimates when a match might be found
func (ms *MatchmakingService) estimateMatchTime(request *MatchmakingRequest) float64 {
	pool := ms.pools[request.GameType]
	pool.mu.RLock()
	defer pool.mu.RUnlock()

	poolSize := len(pool.requests)
	config := ms.GetDefaultConfig()

	if poolSize >= config.MinPlayersPerMatch {
		// Estimate based on current pool size and skill compatibility
		compatibleCount := 0
		for _, req := range pool.requests {
			skillDiff := int(math.Abs(float64(request.SkillLevel - req.SkillLevel)))
			if skillDiff <= config.MaxSkillDifference*2 { // Allow wider range for estimation
				compatibleCount++
			}
		}

		if compatibleCount >= config.MinPlayersPerMatch {
			return 10.0 // Should match soon
		}
	}

	// Estimate based on average arrival rate (simplified)
	return 60.0 // 1 minute estimate if no immediate match
}

// GetPoolStats returns statistics about all matchmaking pools
func (ms *MatchmakingService) GetPoolStats() map[string]interface{} {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	stats := make(map[string]interface{})

	for gameType, pool := range ms.pools {
		pool.mu.RLock()
		poolStats := map[string]interface{}{
			"playerCount":    len(pool.requests),
			"averageWaitTime": ms.calculateAverageWaitTime(pool.requests),
			"skillDistribution": ms.calculateSkillDistribution(pool.requests),
		}
		pool.mu.RUnlock()

		stats[string(gameType)] = poolStats
	}

	stats["totalPlayers"] = len(ms.activeRequests)
	stats["totalPools"] = len(ms.pools)

	return stats
}

// calculateAverageWaitTime calculates average wait time for requests in a pool
func (ms *MatchmakingService) calculateAverageWaitTime(requests []*MatchmakingRequest) float64 {
	if len(requests) == 0 {
		return 0
	}

	now := time.Now()
	total := 0.0

	for _, req := range requests {
		total += now.Sub(req.CreatedAt).Seconds()
	}

	return total / float64(len(requests))
}

// calculateSkillDistribution calculates skill level distribution in a pool
func (ms *MatchmakingService) calculateSkillDistribution(requests []*MatchmakingRequest) map[string]int {
	distribution := map[string]int{
		"1-20":   0,
		"21-40":  0,
		"41-60":  0,
		"61-80":  0,
		"81-100": 0,
	}

	for _, req := range requests {
		skill := req.SkillLevel
		switch {
		case skill <= 20:
			distribution["1-20"]++
		case skill <= 40:
			distribution["21-40"]++
		case skill <= 60:
			distribution["41-60"]++
		case skill <= 80:
			distribution["61-80"]++
		default:
			distribution["81-100"]++
		}
	}

	return distribution
}

// Shutdown gracefully shuts down the matchmaking service
func (ms *MatchmakingService) Shutdown() {
	ms.cancel()

	ms.mu.Lock()
	defer ms.mu.Unlock()

	// Notify all users in matchmaking that service is shutting down
	for username := range ms.userRequests {
		message := &WebSocketMessage{
			Type: MessageTypeMatchCancelled,
			Data: map[string]interface{}{
				"reason": "service_shutdown",
			},
			Timestamp: time.Now(),
		}
		ms.wsManager.SendToUser(username, message)
	}

	// Clear all data
	for _, pool := range ms.pools {
		pool.mu.Lock()
		pool.requests = nil
		pool.mu.Unlock()
	}

	ms.activeRequests = nil
	ms.userRequests = nil
	ms.matchHistory = nil
}