// backend/internal/minigame/engine.go
package minigame

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"exit/internal/service"
)

// GameType represents different types of mini games
type GameType string

const (
	GameTypeClickSpeed   GameType = "click_speed"
	GameTypeMemoryMatch  GameType = "memory_match"
	GameTypeNumberGuess  GameType = "number_guess"
	GameTypeWordScramble GameType = "word_scramble"
	GameTypePuzzle       GameType = "puzzle"
)

// GameConfig holds configuration for each game type
type GameConfig struct {
	Type           GameType      `json:"type"`
	Duration       time.Duration `json:"duration"`       // Game duration
	MaxScore       int           `json:"maxScore"`       // Maximum possible score
	PointsPerScore float64       `json:"pointsPerScore"` // Conversion rate: score -> points
	MinValidScore  int           `json:"minValidScore"`  // Minimum valid score (anti-cheat)
	MaxValidScore  int           `json:"maxValidScore"`  // Maximum valid score (anti-cheat)
	Difficulty     int           `json:"difficulty"`     // 1-5 difficulty level
}

// GameState represents the current state of a game session
type GameState struct {
	SessionID    uuid.UUID              `json:"sessionId"`
	GameType     GameType               `json:"gameType"`
	PlayerUsername string               `json:"playerUsername"`
	StartTime    time.Time              `json:"startTime"`
	EndTime      *time.Time             `json:"endTime,omitempty"`
	CurrentScore int                    `json:"currentScore"`
	GameData     map[string]interface{} `json:"gameData"` // Game-specific data
	Status       GameStatus             `json:"status"`
	LastActivity time.Time              `json:"lastActivity"`
}

type GameStatus string

const (
	GameStatusWaiting    GameStatus = "waiting"
	GameStatusInProgress GameStatus = "in_progress"
	GameStatusCompleted  GameStatus = "completed"
	GameStatusAbandoned  GameStatus = "abandoned"
)

// GameAction represents an action taken by the player
type GameAction struct {
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// GameResult represents the final result of a game session
type GameResult struct {
	SessionID      uuid.UUID `json:"sessionId"`
	PlayerUsername string    `json:"playerUsername"`
	GameType       GameType  `json:"gameType"`
	FinalScore     int       `json:"finalScore"`
	Duration       time.Duration `json:"duration"`
	PointsEarned   int       `json:"pointsEarned"`
	IsValid        bool      `json:"isValid"`
	Reason         string    `json:"reason,omitempty"`
}

// MiniGameEngine manages all mini game sessions
type MiniGameEngine struct {
	gameConfigs   map[GameType]*GameConfig
	activeSessions map[uuid.UUID]*GameState
	sessionMutex   sync.RWMutex
	gameService    service.GameService
	paymentService service.PaymentService
}

// NewMiniGameEngine creates a new mini game engine
func NewMiniGameEngine(gameService service.GameService, paymentService service.PaymentService) *MiniGameEngine {
	engine := &MiniGameEngine{
		gameConfigs:    make(map[GameType]*GameConfig),
		activeSessions: make(map[uuid.UUID]*GameState),
		gameService:    gameService,
		paymentService: paymentService,
	}
	
	// Initialize default game configurations
	engine.initializeDefaultConfigs()
	
	// Start cleanup routine for abandoned sessions
	go engine.cleanupAbandonedSessions()
	
	return engine
}

// initializeDefaultConfigs sets up default configurations for all game types
func (e *MiniGameEngine) initializeDefaultConfigs() {
	e.gameConfigs[GameTypeClickSpeed] = &GameConfig{
		Type:           GameTypeClickSpeed,
		Duration:       30 * time.Second,
		MaxScore:       200,
		PointsPerScore: 1.0,
		MinValidScore:  10,
		MaxValidScore:  180, // Allow some variance but prevent impossible scores
		Difficulty:     2,
	}

	e.gameConfigs[GameTypeMemoryMatch] = &GameConfig{
		Type:           GameTypeMemoryMatch,
		Duration:       60 * time.Second,
		MaxScore:       100,
		PointsPerScore: 2.0,
		MinValidScore:  5,
		MaxValidScore:  90,
		Difficulty:     3,
	}

	e.gameConfigs[GameTypeNumberGuess] = &GameConfig{
		Type:           GameTypeNumberGuess,
		Duration:       45 * time.Second,
		MaxScore:       50,
		PointsPerScore: 3.0,
		MinValidScore:  1,
		MaxValidScore:  45,
		Difficulty:     2,
	}

	e.gameConfigs[GameTypeWordScramble] = &GameConfig{
		Type:           GameTypeWordScramble,
		Duration:       90 * time.Second,
		MaxScore:       80,
		PointsPerScore: 2.5,
		MinValidScore:  3,
		MaxValidScore:  70,
		Difficulty:     4,
	}

	e.gameConfigs[GameTypePuzzle] = &GameConfig{
		Type:           GameTypePuzzle,
		Duration:       120 * time.Second,
		MaxScore:       60,
		PointsPerScore: 4.0,
		MinValidScore:  2,
		MaxValidScore:  55,
		Difficulty:     5,
	}
}

// StartGameSession creates a new game session
func (e *MiniGameEngine) StartGameSession(gameType GameType, playerUsername string) (*GameState, error) {
	config, exists := e.gameConfigs[gameType]
	if !exists {
		return nil, fmt.Errorf("unsupported game type: %s", gameType)
	}

	sessionID := uuid.New()
	gameState := &GameState{
		SessionID:      sessionID,
		GameType:       gameType,
		PlayerUsername: playerUsername,
		StartTime:      time.Now(),
		CurrentScore:   0,
		GameData:       make(map[string]interface{}),
		Status:         GameStatusInProgress,
		LastActivity:   time.Now(),
	}

	// Initialize game-specific data
	switch gameType {
	case GameTypeClickSpeed:
		gameState.GameData["clicks"] = 0
		gameState.GameData["maxClicks"] = config.MaxScore
	case GameTypeMemoryMatch:
		gameState.GameData["matches"] = 0
		gameState.GameData["attempts"] = 0
		gameState.GameData["gridSize"] = 4 // 4x4 grid
	case GameTypeNumberGuess:
		gameState.GameData["targetNumber"] = e.generateRandomNumber(1, 100)
		gameState.GameData["attempts"] = 0
		gameState.GameData["maxAttempts"] = 10
	}

	e.sessionMutex.Lock()
	e.activeSessions[sessionID] = gameState
	e.sessionMutex.Unlock()

	return gameState, nil
}

// ProcessGameAction processes a game action and updates the game state
func (e *MiniGameEngine) ProcessGameAction(sessionID uuid.UUID, action GameAction) (*GameState, error) {
	e.sessionMutex.Lock()
	defer e.sessionMutex.Unlock()

	gameState, exists := e.activeSessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("game session not found: %s", sessionID)
	}

	if gameState.Status != GameStatusInProgress {
		return nil, fmt.Errorf("game session is not in progress")
	}

	// Update last activity
	gameState.LastActivity = time.Now()

	// Check if game has timed out
	config := e.gameConfigs[gameState.GameType]
	if time.Since(gameState.StartTime) > config.Duration {
		return e.endGameSession(sessionID, "timeout")
	}

	// Process action based on game type
	switch gameState.GameType {
	case GameTypeClickSpeed:
		return e.processClickSpeedAction(gameState, action)
	case GameTypeMemoryMatch:
		return e.processMemoryMatchAction(gameState, action)
	case GameTypeNumberGuess:
		return e.processNumberGuessAction(gameState, action)
	default:
		return nil, fmt.Errorf("unsupported game type: %s", gameState.GameType)
	}
}

// EndGameSession manually ends a game session and calculates rewards
func (e *MiniGameEngine) EndGameSession(sessionID uuid.UUID) (*GameResult, error) {
	gameState, err := e.endGameSession(sessionID, "manual")
	if err != nil {
		return nil, err
	}

	// Create game result
	duration := time.Since(gameState.StartTime)
	result := &GameResult{
		SessionID:      sessionID,
		PlayerUsername: gameState.PlayerUsername,
		GameType:       gameState.GameType,
		FinalScore:     gameState.CurrentScore,
		Duration:       duration,
	}

	// Calculate and validate reward
	return e.CalculateReward(result)
}

// endGameSession internal method to end a game session
func (e *MiniGameEngine) endGameSession(sessionID uuid.UUID, reason string) (*GameState, error) {
	gameState, exists := e.activeSessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("game session not found: %s", sessionID)
	}

	now := time.Now()
	gameState.EndTime = &now
	gameState.Status = GameStatusCompleted

	// Remove from active sessions
	delete(e.activeSessions, sessionID)

	return gameState, nil
}

// CalculateReward calculates the points earned from a game session
func (e *MiniGameEngine) CalculateReward(result *GameResult) (*GameResult, error) {
	config, exists := e.gameConfigs[result.GameType]
	if !exists {
		return nil, fmt.Errorf("unsupported game type: %s", result.GameType)
	}

	// Validate score range
	if result.FinalScore < config.MinValidScore || result.FinalScore > config.MaxValidScore {
		result.IsValid = false
		result.Reason = fmt.Sprintf("score %d is outside valid range [%d, %d]", 
			result.FinalScore, config.MinValidScore, config.MaxValidScore)
		result.PointsEarned = 0
		return result, nil
	}

	// Calculate points based on score
	basePoints := float64(result.FinalScore) * config.PointsPerScore
	
	// Apply difficulty multiplier
	difficultyMultiplier := float64(config.Difficulty) * 0.1 + 0.9 // 1.0x to 1.4x
	totalPoints := basePoints * difficultyMultiplier

	result.PointsEarned = int(totalPoints)
	result.IsValid = true
	
	return result, nil
}

// AwardPoints awards points to the player for completing a game
func (e *MiniGameEngine) AwardPoints(result *GameResult) error {
	if !result.IsValid || result.PointsEarned <= 0 {
		return fmt.Errorf("invalid game result, no points awarded")
	}

	description := fmt.Sprintf("%s game - Score: %d", result.GameType, result.FinalScore)
	_, err := e.paymentService.AddPoints(result.PlayerUsername, result.PointsEarned, description)
	if err != nil {
		return fmt.Errorf("failed to award points: %w", err)
	}

	return nil
}

// GetActiveSession retrieves an active game session
func (e *MiniGameEngine) GetActiveSession(sessionID uuid.UUID) (*GameState, error) {
	e.sessionMutex.RLock()
	defer e.sessionMutex.RUnlock()

	gameState, exists := e.activeSessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("game session not found: %s", sessionID)
	}

	return gameState, nil
}

// ListGameTypes returns all available game types with their configurations
func (e *MiniGameEngine) ListGameTypes() map[GameType]*GameConfig {
	configs := make(map[GameType]*GameConfig)
	for gameType, config := range e.gameConfigs {
		// Create a copy to avoid external modifications
		configCopy := *config
		configs[gameType] = &configCopy
	}
	return configs
}

// Helper methods for game-specific logic

func (e *MiniGameEngine) processClickSpeedAction(gameState *GameState, action GameAction) (*GameState, error) {
	if action.Type != "click" {
		return gameState, fmt.Errorf("invalid action type for click speed game: %s", action.Type)
	}

	clicks, _ := gameState.GameData["clicks"].(int)
	clicks++
	gameState.GameData["clicks"] = clicks
	gameState.CurrentScore = clicks

	return gameState, nil
}

func (e *MiniGameEngine) processMemoryMatchAction(gameState *GameState, action GameAction) (*GameState, error) {
	if action.Type != "match_attempt" {
		return gameState, fmt.Errorf("invalid action type for memory match game: %s", action.Type)
	}

	attempts, _ := gameState.GameData["attempts"].(int)
	attempts++
	gameState.GameData["attempts"] = attempts

	// Check if it's a successful match
	if isMatch, ok := action.Data["isMatch"].(bool); ok && isMatch {
		matches, _ := gameState.GameData["matches"].(int)
		matches++
		gameState.GameData["matches"] = matches
		gameState.CurrentScore = matches * 10 // 10 points per match
	}

	return gameState, nil
}

func (e *MiniGameEngine) processNumberGuessAction(gameState *GameState, action GameAction) (*GameState, error) {
	if action.Type != "guess" {
		return gameState, fmt.Errorf("invalid action type for number guess game: %s", action.Type)
	}

	guess, ok := action.Data["number"].(float64)
	if !ok {
		return gameState, fmt.Errorf("invalid guess data")
	}

	targetNumber, _ := gameState.GameData["targetNumber"].(int)
	attempts, _ := gameState.GameData["attempts"].(int)
	attempts++
	gameState.GameData["attempts"] = attempts

	if int(guess) == targetNumber {
		// Correct guess! Award points based on remaining attempts
		maxAttempts, _ := gameState.GameData["maxAttempts"].(int)
		gameState.CurrentScore = (maxAttempts - attempts + 1) * 5
		gameState.Status = GameStatusCompleted
	}

	return gameState, nil
}

func (e *MiniGameEngine) generateRandomNumber(min, max int) int {
	// Simple random number generation - in production, use crypto/rand for better security
	return min + int(time.Now().UnixNano())%(max-min+1)
}

// cleanupAbandonedSessions runs periodically to clean up abandoned sessions
func (e *MiniGameEngine) cleanupAbandonedSessions() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		e.sessionMutex.Lock()
		now := time.Now()
		
		for sessionID, gameState := range e.activeSessions {
			// Mark sessions as abandoned if no activity for 10 minutes
			if now.Sub(gameState.LastActivity) > 10*time.Minute {
				gameState.Status = GameStatusAbandoned
				delete(e.activeSessions, sessionID)
			}
		}
		
		e.sessionMutex.Unlock()
	}
}