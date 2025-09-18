// backend/internal/handler/minigame_handler.go
package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/minigame"
)

// MiniGameHandler handles mini game related HTTP requests
type MiniGameHandler struct {
	engine *minigame.MiniGameEngine
}

// NewMiniGameHandler creates a new MiniGameHandler
func NewMiniGameHandler(engine *minigame.MiniGameEngine) *MiniGameHandler {
	return &MiniGameHandler{
		engine: engine,
	}
}

// StartGameRequest represents a request to start a new game
type StartGameRequest struct {
	GameType string `json:"gameType" binding:"required"`
}

// StartGameResponse represents the response when starting a new game
type StartGameResponse struct {
	SessionID    string                 `json:"sessionId"`
	GameType     string                 `json:"gameType"`
	Duration     int                    `json:"duration"` // in seconds
	StartTime    string                 `json:"startTime"`
	GameData     map[string]interface{} `json:"gameData"`
	Instructions string                 `json:"instructions"`
}

// GameActionRequest represents a game action from the client
type GameActionRequest struct {
	Type string                 `json:"type" binding:"required"`
	Data map[string]interface{} `json:"data"`
}

// GameStateResponse represents the current game state
type GameStateResponse struct {
	SessionID    string                 `json:"sessionId"`
	GameType     string                 `json:"gameType"`
	CurrentScore int                    `json:"currentScore"`
	Status       string                 `json:"status"`
	GameData     map[string]interface{} `json:"gameData"`
	TimeLeft     int                    `json:"timeLeft"` // seconds remaining
}

// EndGameResponse represents the response when ending a game
type EndGameResponse struct {
	SessionID      string `json:"sessionId"`
	FinalScore     int    `json:"finalScore"`
	Duration       int    `json:"duration"` // in seconds
	PointsEarned   int    `json:"pointsEarned"`
	IsValid        bool   `json:"isValid"`
	Reason         string `json:"reason,omitempty"`
	Leaderboard    bool   `json:"leaderboard"` // if score qualifies for leaderboard
}

// ListGameTypesResponse represents available game types
type ListGameTypesResponse struct {
	Games []GameTypeInfo `json:"games"`
}

type GameTypeInfo struct {
	Type           string  `json:"type"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	Duration       int     `json:"duration"`       // seconds
	MaxScore       int     `json:"maxScore"`
	Difficulty     int     `json:"difficulty"`     // 1-5
	PointsPerScore float64 `json:"pointsPerScore"`
}

// @Summary List available game types
// @Description Get all available mini game types with their configurations
// @Tags minigames
// @Accept json
// @Produce json
// @Success 200 {object} ListGameTypesResponse
// @Router /api/v1/minigames/types [get]
func (h *MiniGameHandler) ListGameTypes(c *gin.Context) {
	configs := h.engine.ListGameTypes()
	
	var games []GameTypeInfo
	for gameType, config := range configs {
		games = append(games, GameTypeInfo{
			Type:         string(gameType),
			Name:         h.getGameTypeName(gameType),
			Description:  h.getGameTypeDescription(gameType),
			Duration:     int(config.Duration.Seconds()),
			MaxScore:     config.MaxScore,
			Difficulty:   config.Difficulty,
			PointsPerScore: config.PointsPerScore,
		})
	}

	c.JSON(http.StatusOK, ListGameTypesResponse{Games: games})
}

// @Summary Start a new mini game session
// @Description Start a new mini game session for the authenticated user
// @Tags minigames
// @Accept json
// @Produce json
// @Param request body StartGameRequest true "Game start request"
// @Success 200 {object} StartGameResponse
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/v1/minigames/start [post]
func (h *MiniGameHandler) StartGame(c *gin.Context) {
	var req StartGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Get authenticated user
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	usernameStr, ok := username.(string)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid user claims")
		return
	}

	// Convert string to GameType
	gameType := minigame.GameType(req.GameType)

	// Start game session
	gameState, err := h.engine.StartGameSession(gameType, usernameStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	response := StartGameResponse{
		SessionID:    gameState.SessionID.String(),
		GameType:     string(gameState.GameType),
		Duration:     int(h.engine.ListGameTypes()[gameType].Duration.Seconds()),
		StartTime:    gameState.StartTime.Format(time.RFC3339),
		GameData:     gameState.GameData,
		Instructions: h.getGameInstructions(gameType),
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Submit a game action
// @Description Submit an action during an active game session
// @Tags minigames
// @Accept json
// @Produce json
// @Param sessionId path string true "Game session ID"
// @Param request body GameActionRequest true "Game action"
// @Success 200 {object} GameStateResponse
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /api/v1/minigames/sessions/{sessionId}/action [post]
func (h *MiniGameHandler) SubmitGameAction(c *gin.Context) {
	sessionIDStr := c.Param("sessionId")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid session ID")
		return
	}

	var req GameActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify user owns this session
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	usernameStr, ok := username.(string)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid user claims")
		return
	}

	// Get current session to verify ownership
	currentState, err := h.engine.GetActiveSession(sessionID)
	if err != nil {
		respondError(c, http.StatusNotFound, "session not found")
		return
	}

	if currentState.PlayerUsername != usernameStr {
		respondError(c, http.StatusForbidden, "session does not belong to user")
		return
	}

	// Process the action
	action := minigame.GameAction{
		Type:      req.Type,
		Data:      req.Data,
		Timestamp: time.Now(),
	}

	updatedState, err := h.engine.ProcessGameAction(sessionID, action)
	if err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Calculate time left
	configs := h.engine.ListGameTypes()
	config := configs[updatedState.GameType]
	timeLeft := int(config.Duration.Seconds() - time.Since(updatedState.StartTime).Seconds())
	if timeLeft < 0 {
		timeLeft = 0
	}

	response := GameStateResponse{
		SessionID:    updatedState.SessionID.String(),
		GameType:     string(updatedState.GameType),
		CurrentScore: updatedState.CurrentScore,
		Status:       string(updatedState.Status),
		GameData:     updatedState.GameData,
		TimeLeft:     timeLeft,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary End a game session
// @Description End an active game session and calculate rewards
// @Tags minigames
// @Accept json
// @Produce json
// @Param sessionId path string true "Game session ID"
// @Success 200 {object} EndGameResponse
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /api/v1/minigames/sessions/{sessionId}/end [post]
func (h *MiniGameHandler) EndGame(c *gin.Context) {
	sessionIDStr := c.Param("sessionId")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid session ID")
		return
	}

	// Verify user owns this session
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	usernameStr, ok := username.(string)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid user claims")
		return
	}

	// Get current session to verify ownership
	currentState, err := h.engine.GetActiveSession(sessionID)
	if err != nil {
		respondError(c, http.StatusNotFound, "session not found")
		return
	}

	if currentState.PlayerUsername != usernameStr {
		respondError(c, http.StatusForbidden, "session does not belong to user")
		return
	}

	// End the game session
	result, err := h.engine.EndGameSession(sessionID)
	if err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Award points if valid
	if result.IsValid && result.PointsEarned > 0 {
		if err := h.engine.AwardPoints(result); err != nil {
			// Log error but don't fail the response - user should still see their score
			// In production, this would be logged properly
		}
	}

	// Check if score qualifies for leaderboard (top 10% of max score)
	configs := h.engine.ListGameTypes()
	config := configs[result.GameType]
	leaderboardThreshold := int(float64(config.MaxScore) * 0.7) // Top 30%
	qualifiesForLeaderboard := result.FinalScore >= leaderboardThreshold

	response := EndGameResponse{
		SessionID:      result.SessionID.String(),
		FinalScore:     result.FinalScore,
		Duration:       int(result.Duration.Seconds()),
		PointsEarned:   result.PointsEarned,
		IsValid:        result.IsValid,
		Reason:         result.Reason,
		Leaderboard:    qualifiesForLeaderboard,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get game session status
// @Description Get the current status of an active game session
// @Tags minigames
// @Accept json
// @Produce json
// @Param sessionId path string true "Game session ID"
// @Success 200 {object} GameStateResponse
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /api/v1/minigames/sessions/{sessionId} [get]
func (h *MiniGameHandler) GetGameStatus(c *gin.Context) {
	sessionIDStr := c.Param("sessionId")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid session ID")
		return
	}

	// Verify user owns this session
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	usernameStr, ok := username.(string)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid user claims")
		return
	}

	// Get session state
	gameState, err := h.engine.GetActiveSession(sessionID)
	if err != nil {
		respondError(c, http.StatusNotFound, "session not found")
		return
	}

	if gameState.PlayerUsername != usernameStr {
		respondError(c, http.StatusForbidden, "session does not belong to user")
		return
	}

	// Calculate time left
	configs := h.engine.ListGameTypes()
	config := configs[gameState.GameType]
	timeLeft := int(config.Duration.Seconds() - time.Since(gameState.StartTime).Seconds())
	if timeLeft < 0 {
		timeLeft = 0
	}

	response := GameStateResponse{
		SessionID:    gameState.SessionID.String(),
		GameType:     string(gameState.GameType),
		CurrentScore: gameState.CurrentScore,
		Status:       string(gameState.Status),
		GameData:     gameState.GameData,
		TimeLeft:     timeLeft,
	}

	c.JSON(http.StatusOK, response)
}

// Helper methods for game information

func (h *MiniGameHandler) getGameTypeName(gameType minigame.GameType) string {
	switch gameType {
	case minigame.GameTypeClickSpeed:
		return "Click Speed Challenge"
	case minigame.GameTypeMemoryMatch:
		return "Memory Match"
	case minigame.GameTypeNumberGuess:
		return "Number Guessing Game"
	case minigame.GameTypeWordScramble:
		return "Word Scramble"
	case minigame.GameTypePuzzle:
		return "Puzzle Challenge"
	default:
		return string(gameType)
	}
}

func (h *MiniGameHandler) getGameTypeDescription(gameType minigame.GameType) string {
	switch gameType {
	case minigame.GameTypeClickSpeed:
		return "Click as fast as you can within the time limit!"
	case minigame.GameTypeMemoryMatch:
		return "Match pairs of cards by remembering their positions."
	case minigame.GameTypeNumberGuess:
		return "Guess the secret number with as few attempts as possible."
	case minigame.GameTypeWordScramble:
		return "Unscramble words to earn points."
	case minigame.GameTypePuzzle:
		return "Solve challenging puzzles to earn maximum points."
	default:
		return "Play this exciting mini game!"
	}
}

func (h *MiniGameHandler) getGameInstructions(gameType minigame.GameType) string {
	switch gameType {
	case minigame.GameTypeClickSpeed:
		return "Click the button as many times as possible within 30 seconds. Each click gives you 1 point!"
	case minigame.GameTypeMemoryMatch:
		return "Flip cards to find matching pairs. Remember their positions! Each match gives you 10 points."
	case minigame.GameTypeNumberGuess:
		return "Guess the number between 1-100. Fewer attempts = more points!"
	case minigame.GameTypeWordScramble:
		return "Unscramble the given words. Faster solving = bonus points!"
	case minigame.GameTypePuzzle:
		return "Solve the puzzle by arranging pieces correctly. Complexity = higher rewards!"
	default:
		return "Follow the game rules and have fun!"
	}
}