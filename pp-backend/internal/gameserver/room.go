// internal/gameserver/room.go
package gameserver

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/minigame"
)

// GameRoomState represents the current state of a game room
type GameRoomState string

const (
	RoomStateWaiting    GameRoomState = "waiting"    // Waiting for players
	RoomStateReady      GameRoomState = "ready"      // All players ready, can start
	RoomStateInProgress GameRoomState = "in_progress" // Game is running
	RoomStateCompleted  GameRoomState = "completed"  // Game finished
	RoomStateClosed     GameRoomState = "closed"     // Room closed
)

// Player represents a player in a game room
type Player struct {
	Username     string            `json:"username"`
	IsReady      bool              `json:"isReady"`
	IsHost       bool              `json:"isHost"`
	Score        int               `json:"score"`
	LastAction   *time.Time        `json:"lastAction,omitempty"`
	GameData     map[string]interface{} `json:"gameData"`
	Connection   *WebSocketConnection   `json:"-"`
	mu           sync.RWMutex           `json:"-"`
}

// GameRoom represents a multiplayer game room
type GameRoom struct {
	ID              uuid.UUID                `json:"id"`
	Name            string                   `json:"name"`
	GameType        minigame.GameType        `json:"gameType"`
	State           GameRoomState            `json:"state"`
	Players         map[string]*Player       `json:"players"`
	MaxPlayers      int                      `json:"maxPlayers"`
	MinPlayers      int                      `json:"minPlayers"`
	HostUsername    string                   `json:"hostUsername"`
	GameConfig      *minigame.GameConfig     `json:"gameConfig"`
	GameSession     *minigame.GameState      `json:"gameSession,omitempty"`
	StartTime       *time.Time               `json:"startTime,omitempty"`
	EndTime         *time.Time               `json:"endTime,omitempty"`
	CreatedAt       time.Time                `json:"createdAt"`
	LastActivity    time.Time                `json:"lastActivity"`
	IsPrivate       bool                     `json:"isPrivate"`
	Password        string                   `json:"-"` // Don't serialize password
	Settings        map[string]interface{}   `json:"settings"`
	mu              sync.RWMutex             `json:"-"`
	wsManager       *WebSocketManager        `json:"-"`
	miniGameEngine  *minigame.MiniGameEngine `json:"-"`
	eventChan       chan *GameRoomEvent      `json:"-"`
	ctx             context.Context          `json:"-"`
	cancel          context.CancelFunc       `json:"-"`
}

// GameRoomEvent represents events that occur in a game room
type GameRoomEvent struct {
	Type      string                 `json:"type"`
	RoomID    uuid.UUID              `json:"roomId"`
	Username  string                 `json:"username,omitempty"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// RoomEventType constants for game room events
const (
	RoomEventPlayerJoined    = "player_joined"
	RoomEventPlayerLeft      = "player_left"
	RoomEventPlayerReady     = "player_ready"
	RoomEventPlayerNotReady  = "player_not_ready"
	RoomEventGameStarted     = "game_started"
	RoomEventGameAction      = "game_action"
	RoomEventGameStateUpdate = "game_state_update"
	RoomEventGameEnded       = "game_ended"
	RoomEventRoomClosed      = "room_closed"
	RoomEventHostChanged     = "host_changed"
	RoomEventSettingsChanged = "settings_changed"
)

// RoomManager manages all game rooms
type RoomManager struct {
	rooms         map[uuid.UUID]*GameRoom
	userRooms     map[string]uuid.UUID    // username -> roomID
	publicRooms   []uuid.UUID             // list of public rooms
	mu            sync.RWMutex
	wsManager     *WebSocketManager
	miniGameEngine *minigame.MiniGameEngine
	ctx           context.Context
	cancel        context.CancelFunc
}

// NewRoomManager creates a new room manager
func NewRoomManager(ctx context.Context, wsManager *WebSocketManager, miniGameEngine *minigame.MiniGameEngine) *RoomManager {
	managerCtx, cancel := context.WithCancel(ctx)

	rm := &RoomManager{
		rooms:          make(map[uuid.UUID]*GameRoom),
		userRooms:      make(map[string]uuid.UUID),
		publicRooms:    make([]uuid.UUID, 0),
		wsManager:      wsManager,
		miniGameEngine: miniGameEngine,
		ctx:            managerCtx,
		cancel:         cancel,
	}

	// Start cleanup routine
	go rm.cleanupRoutine()

	return rm
}

// CreateRoom creates a new game room
func (rm *RoomManager) CreateRoom(hostUsername string, gameType minigame.GameType, settings map[string]interface{}) (*GameRoom, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	// Check if user is already in a room
	if _, exists := rm.userRooms[hostUsername]; exists {
		return nil, fmt.Errorf("user %s is already in a room", hostUsername)
	}

	// Get game config
	gameConfigs := rm.miniGameEngine.ListGameTypes()
	gameConfig, exists := gameConfigs[gameType]
	if !exists {
		return nil, fmt.Errorf("unsupported game type: %s", gameType)
	}

	// Parse settings
	maxPlayers := 2 // default
	minPlayers := 2 // default
	isPrivate := false
	password := ""
	roomName := fmt.Sprintf("%s's Room", hostUsername)

	if settings != nil {
		if v, ok := settings["maxPlayers"].(float64); ok && v >= 2 && v <= 8 {
			maxPlayers = int(v)
		}
		if v, ok := settings["minPlayers"].(float64); ok && v >= 2 && v <= float64(maxPlayers) {
			minPlayers = int(v)
		}
		if v, ok := settings["isPrivate"].(bool); ok {
			isPrivate = v
		}
		if v, ok := settings["password"].(string); ok {
			password = v
		}
		if v, ok := settings["name"].(string); ok && v != "" {
			roomName = v
		}
	}

	roomCtx, roomCancel := context.WithCancel(rm.ctx)
	roomID := uuid.New()

	room := &GameRoom{
		ID:              roomID,
		Name:            roomName,
		GameType:        gameType,
		State:           RoomStateWaiting,
		Players:         make(map[string]*Player),
		MaxPlayers:      maxPlayers,
		MinPlayers:      minPlayers,
		HostUsername:    hostUsername,
		GameConfig:      gameConfig,
		CreatedAt:       time.Now(),
		LastActivity:    time.Now(),
		IsPrivate:       isPrivate,
		Password:        password,
		Settings:        settings,
		wsManager:       rm.wsManager,
		miniGameEngine:  rm.miniGameEngine,
		eventChan:       make(chan *GameRoomEvent, 256),
		ctx:             roomCtx,
		cancel:          roomCancel,
	}

	// Add host as first player
	hostPlayer := &Player{
		Username: hostUsername,
		IsReady:  false,
		IsHost:   true,
		Score:    0,
		GameData: make(map[string]interface{}),
	}

	room.Players[hostUsername] = hostPlayer
	rm.rooms[roomID] = room
	rm.userRooms[hostUsername] = roomID

	// Add to public rooms if not private
	if !isPrivate {
		rm.publicRooms = append(rm.publicRooms, roomID)
	}

	// Start room event processor
	go room.processEvents()

	return room, nil
}

// JoinRoom adds a player to an existing room
func (rm *RoomManager) JoinRoom(roomID uuid.UUID, username string, password string) (*GameRoom, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	// Check if user is already in a room
	if _, exists := rm.userRooms[username]; exists {
		return nil, fmt.Errorf("user %s is already in a room", username)
	}

	room, exists := rm.rooms[roomID]
	if !exists {
		return nil, fmt.Errorf("room not found")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	// Check room state
	if room.State != RoomStateWaiting {
		return nil, fmt.Errorf("room is not accepting new players")
	}

	// Check room capacity
	if len(room.Players) >= room.MaxPlayers {
		return nil, fmt.Errorf("room is full")
	}

	// Check password for private rooms
	if room.IsPrivate && room.Password != password {
		return nil, fmt.Errorf("incorrect password")
	}

	// Add player to room
	player := &Player{
		Username: username,
		IsReady:  false,
		IsHost:   false,
		Score:    0,
		GameData: make(map[string]interface{}),
	}

	room.Players[username] = player
	rm.userRooms[username] = roomID
	room.LastActivity = time.Now()

	// Emit player joined event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventPlayerJoined,
		RoomID:    roomID,
		Username:  username,
		Data:      map[string]interface{}{"player": player},
		Timestamp: time.Now(),
	})

	return room, nil
}

// LeaveRoom removes a player from a room
func (rm *RoomManager) LeaveRoom(roomID uuid.UUID, username string) error {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	room, exists := rm.rooms[roomID]
	if !exists {
		return fmt.Errorf("room not found")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	// Check if player is in room
	if _, exists := room.Players[username]; !exists {
		return fmt.Errorf("player not in room")
	}

	// Remove player
	delete(room.Players, username)
	delete(rm.userRooms, username)
	room.LastActivity = time.Now()

	// Handle host leaving
	if room.HostUsername == username && len(room.Players) > 0 {
		// Transfer host to another player
		for newHostUsername := range room.Players {
			room.HostUsername = newHostUsername
			room.Players[newHostUsername].IsHost = true

			room.emitEvent(&GameRoomEvent{
				Type:      RoomEventHostChanged,
				RoomID:    roomID,
				Username:  newHostUsername,
				Data:      map[string]interface{}{"newHost": newHostUsername},
				Timestamp: time.Now(),
			})
			break
		}
	}

	// Emit player left event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventPlayerLeft,
		RoomID:    roomID,
		Username:  username,
		Data:      map[string]interface{}{},
		Timestamp: time.Now(),
	})

	// Close room if empty
	if len(room.Players) == 0 {
		return rm.closeRoom(roomID)
	}

	return nil
}

// SetPlayerReady sets a player's ready state
func (rm *RoomManager) SetPlayerReady(roomID uuid.UUID, username string, ready bool) error {
	room, exists := rm.GetRoom(roomID)
	if !exists {
		return fmt.Errorf("room not found")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	player, exists := room.Players[username]
	if !exists {
		return fmt.Errorf("player not in room")
	}

	player.mu.Lock()
	player.IsReady = ready
	player.mu.Unlock()

	room.LastActivity = time.Now()

	// Emit ready state change event
	eventType := RoomEventPlayerReady
	if !ready {
		eventType = RoomEventPlayerNotReady
	}

	room.emitEvent(&GameRoomEvent{
		Type:      eventType,
		RoomID:    roomID,
		Username:  username,
		Data:      map[string]interface{}{"ready": ready},
		Timestamp: time.Now(),
	})

	// Check if all players are ready and minimum players met
	if room.State == RoomStateWaiting && len(room.Players) >= room.MinPlayers {
		allReady := true
		for _, p := range room.Players {
			p.mu.RLock()
			if !p.IsReady {
				allReady = false
				p.mu.RUnlock()
				break
			}
			p.mu.RUnlock()
		}

		if allReady {
			room.State = RoomStateReady
		}
	}

	return nil
}

// StartGame starts the game for a room
func (rm *RoomManager) StartGame(roomID uuid.UUID, hostUsername string) error {
	room, exists := rm.GetRoom(roomID)
	if !exists {
		return fmt.Errorf("room not found")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	// Check if user is host
	if room.HostUsername != hostUsername {
		return fmt.Errorf("only host can start the game")
	}

	// Check room state
	if room.State != RoomStateReady {
		return fmt.Errorf("room is not ready to start")
	}

	// Start game session
	// TODO: Create multiplayer game session
	// For now, we'll create individual sessions for each player
	now := time.Now()
	room.State = RoomStateInProgress
	room.StartTime = &now
	room.LastActivity = time.Now()

	// Initialize game data for each player
	for _, player := range room.Players {
		player.mu.Lock()
		player.Score = 0
		player.GameData = make(map[string]interface{})
		// TODO: Initialize game-specific data based on game type
		player.mu.Unlock()
	}

	// Emit game started event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventGameStarted,
		RoomID:    roomID,
		Username:  hostUsername,
		Data:      map[string]interface{}{"startTime": now},
		Timestamp: time.Now(),
	})

	return nil
}

// ProcessGameAction processes a game action from a player
func (rm *RoomManager) ProcessGameAction(roomID uuid.UUID, username string, action map[string]interface{}) error {
	room, exists := rm.GetRoom(roomID)
	if !exists {
		return fmt.Errorf("room not found")
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	// Check room state
	if room.State != RoomStateInProgress {
		return fmt.Errorf("game is not in progress")
	}

	player, exists := room.Players[username]
	if !exists {
		return fmt.Errorf("player not in room")
	}

	// Update player's last action time
	now := time.Now()
	player.mu.Lock()
	player.LastAction = &now
	player.mu.Unlock()

	room.LastActivity = time.Now()

	// TODO: Process action based on game type
	// For now, emit the action as an event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventGameAction,
		RoomID:    roomID,
		Username:  username,
		Data:      action,
		Timestamp: time.Now(),
	})

	return nil
}

// EndGame ends the game for a room
func (rm *RoomManager) EndGame(roomID uuid.UUID) error {
	room, exists := rm.GetRoom(roomID)
	if !exists {
		return fmt.Errorf("room not found")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.State != RoomStateInProgress {
		return fmt.Errorf("game is not in progress")
	}

	now := time.Now()
	room.State = RoomStateCompleted
	room.EndTime = &now
	room.LastActivity = time.Now()

	// TODO: Calculate final scores and award points
	results := make(map[string]interface{})
	for username, player := range room.Players {
		player.mu.RLock()
		results[username] = map[string]interface{}{
			"score": player.Score,
			"gameData": player.GameData,
		}
		player.mu.RUnlock()
	}

	// Emit game ended event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventGameEnded,
		RoomID:    roomID,
		Username:  "",
		Data:      map[string]interface{}{"results": results, "endTime": now},
		Timestamp: time.Now(),
	})

	return nil
}

// GetRoom returns a room by ID
func (rm *RoomManager) GetRoom(roomID uuid.UUID) (*GameRoom, bool) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	room, exists := rm.rooms[roomID]
	return room, exists
}

// GetUserRoom returns the room a user is currently in
func (rm *RoomManager) GetUserRoom(username string) (*GameRoom, bool) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	roomID, exists := rm.userRooms[username]
	if !exists {
		return nil, false
	}

	room, exists := rm.rooms[roomID]
	return room, exists
}

// ListPublicRooms returns a list of public rooms
func (rm *RoomManager) ListPublicRooms() []*GameRoom {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	var rooms []*GameRoom
	for _, roomID := range rm.publicRooms {
		if room, exists := rm.rooms[roomID]; exists {
			rooms = append(rooms, room)
		}
	}

	return rooms
}

// closeRoom closes and removes a room
func (rm *RoomManager) closeRoom(roomID uuid.UUID) error {
	room, exists := rm.rooms[roomID]
	if !exists {
		return fmt.Errorf("room not found")
	}

	// Remove all players from user rooms map
	for username := range room.Players {
		delete(rm.userRooms, username)
	}

	// Remove from public rooms if exists
	for i, id := range rm.publicRooms {
		if id == roomID {
			rm.publicRooms = append(rm.publicRooms[:i], rm.publicRooms[i+1:]...)
			break
		}
	}

	// Cancel room context and cleanup
	room.cancel()
	delete(rm.rooms, roomID)

	// Emit room closed event
	room.emitEvent(&GameRoomEvent{
		Type:      RoomEventRoomClosed,
		RoomID:    roomID,
		Username:  "",
		Data:      map[string]interface{}{},
		Timestamp: time.Now(),
	})

	return nil
}

// processEvents processes room events and sends WebSocket messages
func (room *GameRoom) processEvents() {
	for {
		select {
		case <-room.ctx.Done():
			return

		case event := <-room.eventChan:
			// Convert event to WebSocket message
			message := &WebSocketMessage{
				Type:      event.Type,
				Data:      event.Data,
				Timestamp: event.Timestamp,
				From:      event.Username,
				RoomID:    &event.RoomID,
			}

			// Send to all players in the room
			room.wsManager.SendToRoom(event.RoomID, message)
		}
	}
}

// emitEvent emits an event to the room
func (room *GameRoom) emitEvent(event *GameRoomEvent) {
	select {
	case room.eventChan <- event:
	case <-room.ctx.Done():
	}
}

// cleanupRoutine periodically cleans up inactive rooms
func (rm *RoomManager) cleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-rm.ctx.Done():
			return

		case <-ticker.C:
			rm.cleanupInactiveRooms()
		}
	}
}

// cleanupInactiveRooms removes rooms that have been inactive for too long
func (rm *RoomManager) cleanupInactiveRooms() {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	now := time.Now()
	inactiveThreshold := 30 * time.Minute

	for roomID, room := range rm.rooms {
		room.mu.RLock()
		inactive := now.Sub(room.LastActivity) > inactiveThreshold
		isEmpty := len(room.Players) == 0
		room.mu.RUnlock()

		if inactive || isEmpty {
			rm.closeRoom(roomID)
		}
	}
}

// GetRoomStats returns statistics about the room
func (room *GameRoom) GetRoomStats() map[string]interface{} {
	room.mu.RLock()
	defer room.mu.RUnlock()

	playerStats := make(map[string]interface{})
	for username, player := range room.Players {
		player.mu.RLock()
		playerStats[username] = map[string]interface{}{
			"score":      player.Score,
			"isReady":    player.IsReady,
			"isHost":     player.IsHost,
			"lastAction": player.LastAction,
		}
		player.mu.RUnlock()
	}

	return map[string]interface{}{
		"id":           room.ID,
		"name":         room.Name,
		"gameType":     room.GameType,
		"state":        room.State,
		"playerCount":  len(room.Players),
		"maxPlayers":   room.MaxPlayers,
		"minPlayers":   room.MinPlayers,
		"isPrivate":    room.IsPrivate,
		"createdAt":    room.CreatedAt,
		"startTime":    room.StartTime,
		"endTime":      room.EndTime,
		"lastActivity": room.LastActivity,
		"players":      playerStats,
	}
}

// Shutdown gracefully shuts down the room manager
func (rm *RoomManager) Shutdown() {
	rm.cancel()

	rm.mu.Lock()
	defer rm.mu.Unlock()

	for roomID := range rm.rooms {
		rm.closeRoom(roomID)
	}
}