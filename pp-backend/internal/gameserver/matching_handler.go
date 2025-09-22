package gameserver

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pitturu-ppaturu/backend/internal/matching"
)

// MatchingWebSocketHandler handles WebSocket connections for matchmaking
type MatchingWebSocketHandler struct {
	matchmaker *matching.Matchmaker
	upgrader   websocket.Upgrader
}

// NewMatchingWebSocketHandler creates a new matching WebSocket handler
func NewMatchingWebSocketHandler() *MatchingWebSocketHandler {
	return &MatchingWebSocketHandler{
		matchmaker: matching.NewMatchmaker(),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins for development
				return true
			},
		},
	}
}

// HandleWebSocket handles WebSocket connections for matchmaking
func (h *MatchingWebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Get player info from query parameters
	playerID := r.URL.Query().Get("player_id")
	if playerID == "" {
		playerID = "player_" + generateRandomID()
	}

	platform := r.URL.Query().Get("platform")
	if platform == "" {
		platform = "web"
	}

	skillLevelStr := r.URL.Query().Get("skill_level")
	skillLevel := 1000 // Default skill level
	if skillLevelStr != "" {
		if sl, err := strconv.Atoi(skillLevelStr); err == nil {
			skillLevel = sl
		}
	}

	log.Printf("New matching connection: player=%s, platform=%s, skill=%d",
		playerID, platform, skillLevel)

	// Send welcome message
	welcomeMsg := map[string]interface{}{
		"type": "connected",
		"player_id": playerID,
		"platform": platform,
		"skill_level": skillLevel,
		"supported_games": []string{"paint_battle", "physics_jump", "memory_match", "click_speed"},
	}
	h.sendMessage(conn, welcomeMsg)

	// Handle messages
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		h.handleMessage(conn, playerID, platform, skillLevel, msg)
	}

	// Clean up: remove player from queues
	h.matchmaker.LeaveQueue(playerID)
	log.Printf("Player %s disconnected", playerID)
}

// handleMessage processes incoming WebSocket messages
func (h *MatchingWebSocketHandler) handleMessage(conn *websocket.Conn, playerID, platform string, skillLevel int, msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		h.sendError(conn, "INVALID_MESSAGE", "Message type required")
		return
	}

	switch msgType {
	case "join_queue":
		h.handleJoinQueue(conn, playerID, platform, skillLevel, msg)
	case "leave_queue":
		h.handleLeaveQueue(conn, playerID)
	case "get_queue_status":
		h.handleGetQueueStatus(conn, msg)
	case "get_room_info":
		h.handleGetRoomInfo(conn, msg)
	case "ping":
		h.handlePing(conn)
	default:
		h.sendError(conn, "UNKNOWN_MESSAGE_TYPE", "Unknown message type: "+msgType)
	}
}

// handleJoinQueue processes join queue requests
func (h *MatchingWebSocketHandler) handleJoinQueue(conn *websocket.Conn, playerID, platform string, skillLevel int, msg map[string]interface{}) {
	gameType, ok := msg["game_type"].(string)
	if !ok {
		h.sendError(conn, "INVALID_GAME_TYPE", "Game type required")
		return
	}

	// Extract preferences if provided
	preferences := make(map[string]interface{})
	if prefs, ok := msg["preferences"].(map[string]interface{}); ok {
		preferences = prefs
	}

	// Create match request
	request := &matching.MatchRequest{
		PlayerID:    playerID,
		GameType:    gameType,
		Platform:    platform,
		SkillLevel:  skillLevel,
		Preferences: preferences,
		Connection:  conn,
	}

	// Join queue
	err := h.matchmaker.JoinQueue(request)
	if err != nil {
		if matchErr, ok := err.(*matching.MatchError); ok {
			h.sendError(conn, matchErr.Code, matchErr.Message)
		} else {
			h.sendError(conn, "QUEUE_JOIN_FAILED", err.Error())
		}
		return
	}

	log.Printf("Player %s joined queue for %s", playerID, gameType)
}

// handleLeaveQueue processes leave queue requests
func (h *MatchingWebSocketHandler) handleLeaveQueue(conn *websocket.Conn, playerID string) {
	err := h.matchmaker.LeaveQueue(playerID)
	if err != nil {
		if matchErr, ok := err.(*matching.MatchError); ok {
			h.sendError(conn, matchErr.Code, matchErr.Message)
		} else {
			h.sendError(conn, "QUEUE_LEAVE_FAILED", err.Error())
		}
		return
	}

	h.sendMessage(conn, map[string]interface{}{
		"type": "queue_left_success",
	})
}

// handleGetQueueStatus provides queue status information
func (h *MatchingWebSocketHandler) handleGetQueueStatus(conn *websocket.Conn, msg map[string]interface{}) {
	gameType, ok := msg["game_type"].(string)
	if !ok {
		h.sendError(conn, "INVALID_GAME_TYPE", "Game type required")
		return
	}

	status := h.matchmaker.GetQueueStatus(gameType)
	status["type"] = "queue_status"

	h.sendMessage(conn, status)
}

// handleGetRoomInfo provides room information
func (h *MatchingWebSocketHandler) handleGetRoomInfo(conn *websocket.Conn, msg map[string]interface{}) {
	roomID, ok := msg["room_id"].(string)
	if !ok {
		h.sendError(conn, "INVALID_ROOM_ID", "Room ID required")
		return
	}

	room, err := h.matchmaker.GetRoomInfo(roomID)
	if err != nil {
		if matchErr, ok := err.(*matching.MatchError); ok {
			h.sendError(conn, matchErr.Code, matchErr.Message)
		} else {
			h.sendError(conn, "ROOM_INFO_FAILED", err.Error())
		}
		return
	}

	response := map[string]interface{}{
		"type": "room_info",
		"room": room,
	}

	h.sendMessage(conn, response)
}

// handlePing responds to ping messages
func (h *MatchingWebSocketHandler) handlePing(conn *websocket.Conn) {
	h.sendMessage(conn, map[string]interface{}{
		"type": "pong",
		"timestamp": getCurrentTimestamp(),
	})
}

// HTTP API Handlers

// HandleGetQueueStatusHTTP provides queue status via HTTP
func (h *MatchingWebSocketHandler) HandleGetQueueStatusHTTP(w http.ResponseWriter, r *http.Request) {
	gameType := r.URL.Query().Get("game_type")
	if gameType == "" {
		http.Error(w, "game_type parameter required", http.StatusBadRequest)
		return
	}

	status := h.matchmaker.GetQueueStatus(gameType)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// HandleGetRoomInfoHTTP provides room information via HTTP
func (h *MatchingWebSocketHandler) HandleGetRoomInfoHTTP(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room_id")
	if roomID == "" {
		http.Error(w, "room_id parameter required", http.StatusBadRequest)
		return
	}

	room, err := h.matchmaker.GetRoomInfo(roomID)
	if err != nil {
		if matchErr, ok := err.(*matching.MatchError); ok {
			http.Error(w, matchErr.Message, http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// HandleEndGameHTTP marks a game as finished via HTTP
func (h *MatchingWebSocketHandler) HandleEndGameHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		RoomID  string                 `json:"room_id"`
		Results map[string]interface{} `json:"results"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if request.RoomID == "" {
		http.Error(w, "room_id required", http.StatusBadRequest)
		return
	}

	err = h.matchmaker.EndGame(request.RoomID, request.Results)
	if err != nil {
		if matchErr, ok := err.(*matching.MatchError); ok {
			http.Error(w, matchErr.Message, http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Game ended successfully",
	})
}

// Utility methods

func (h *MatchingWebSocketHandler) sendMessage(conn *websocket.Conn, message map[string]interface{}) {
	err := conn.WriteJSON(message)
	if err != nil {
		log.Printf("WebSocket write error: %v", err)
	}
}

func (h *MatchingWebSocketHandler) sendError(conn *websocket.Conn, code, message string) {
	errorMsg := map[string]interface{}{
		"type": "error",
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
	}
	h.sendMessage(conn, errorMsg)
}

func generateRandomID() string {
	return strconv.FormatInt(getCurrentTimestamp(), 36)
}

func getCurrentTimestamp() int64 {
	return time.Now().UnixMilli()
}

// GetMatchmaker returns the matchmaker instance for testing
func (h *MatchingWebSocketHandler) GetMatchmaker() *matching.Matchmaker {
	return h.matchmaker
}