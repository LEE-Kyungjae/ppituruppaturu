// internal/gameserver/websocket.go
package gameserver

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

// WebSocketConnection represents a single WebSocket connection
type WebSocketConnection struct {
	ID            uuid.UUID              `json:"id"`
	Username      string                 `json:"username"`
	Conn          *websocket.Conn        `json:"-"`
	Send          chan []byte            `json:"-"`
	RoomID        *uuid.UUID             `json:"roomId,omitempty"`
	LastActivity  time.Time              `json:"lastActivity"`
	IsAlive       bool                   `json:"isAlive"`
	Context       context.Context        `json:"-"`
	Cancel        context.CancelFunc     `json:"-"`
	mu            sync.RWMutex           `json:"-"`
}

// WebSocketMessage represents messages sent/received via WebSocket
type WebSocketMessage struct {
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	From      string                 `json:"from,omitempty"`
	To        string                 `json:"to,omitempty"`
	RoomID    *uuid.UUID             `json:"roomId,omitempty"`
}

// WebSocketManager manages all WebSocket connections
type WebSocketManager struct {
	connections    map[uuid.UUID]*WebSocketConnection
	userConnections map[string]*WebSocketConnection // username -> connection
	roomConnections map[uuid.UUID][]*WebSocketConnection // roomID -> connections
	register       chan *WebSocketConnection
	unregister     chan *WebSocketConnection
	broadcast      chan *WebSocketMessage
	roomBroadcast  chan *WebSocketMessage
	upgrader       websocket.Upgrader
	mu             sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
}

// Message types for WebSocket communication
const (
	MessageTypeJoinRoom       = "join_room"
	MessageTypeLeaveRoom      = "leave_room"
	MessageTypeGameAction     = "game_action"
	MessageTypeGameState      = "game_state"
	MessageTypeGameStart      = "game_start"
	MessageTypeGameEnd        = "game_end"
	MessageTypePlayerJoined   = "player_joined"
	MessageTypePlayerLeft     = "player_left"
	MessageTypeError          = "error"
	MessageTypePing           = "ping"
	MessageTypePong           = "pong"
	MessageTypeMatchmaking    = "matchmaking"
	MessageTypeMatchFound     = "match_found"
	MessageTypeMatchCancelled = "match_cancelled"
)

// NewWebSocketManager creates a new WebSocket manager
func NewWebSocketManager(ctx context.Context) *WebSocketManager {
	managerCtx, cancel := context.WithCancel(ctx)

	manager := &WebSocketManager{
		connections:     make(map[uuid.UUID]*WebSocketConnection),
		userConnections: make(map[string]*WebSocketConnection),
		roomConnections: make(map[uuid.UUID][]*WebSocketConnection),
		register:        make(chan *WebSocketConnection, 256),
		unregister:      make(chan *WebSocketConnection, 256),
		broadcast:       make(chan *WebSocketMessage, 1024),
		roomBroadcast:   make(chan *WebSocketMessage, 1024),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				// TODO: Implement proper origin checking for production
				return true
			},
		},
		ctx:    managerCtx,
		cancel: cancel,
	}

	// Start the manager goroutine
	go manager.run()

	return manager
}

// run manages the WebSocket connections lifecycle
func (m *WebSocketManager) run() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return

		case conn := <-m.register:
			m.registerConnection(conn)

		case conn := <-m.unregister:
			m.unregisterConnection(conn)

		case message := <-m.broadcast:
			m.broadcastToAll(message)

		case message := <-m.roomBroadcast:
			m.broadcastToRoom(message)

		case <-ticker.C:
			// Cleanup dead connections
			m.cleanupDeadConnections()
		}
	}
}

// HandleWebSocket upgrades HTTP connection to WebSocket
func (m *WebSocketManager) HandleWebSocket(w http.ResponseWriter, r *http.Request, username string) error {
	conn, err := m.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return fmt.Errorf("failed to upgrade connection: %w", err)
	}

	ctx, cancel := context.WithCancel(m.ctx)
	wsConn := &WebSocketConnection{
		ID:           uuid.New(),
		Username:     username,
		Conn:         conn,
		Send:         make(chan []byte, 256),
		LastActivity: time.Now(),
		IsAlive:      true,
		Context:      ctx,
		Cancel:       cancel,
	}

	// Register the connection
	m.register <- wsConn

	// Start goroutines for reading and writing
	go m.writePump(wsConn)
	go m.readPump(wsConn)

	return nil
}

// registerConnection adds a new connection to the manager
func (m *WebSocketManager) registerConnection(conn *WebSocketConnection) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if user already has a connection and close the old one
	if existingConn, exists := m.userConnections[conn.Username]; exists {
		m.closeConnection(existingConn)
	}

	m.connections[conn.ID] = conn
	m.userConnections[conn.Username] = conn

	// Send welcome message
	welcomeMsg := &WebSocketMessage{
		Type: "connected",
		Data: map[string]interface{}{
			"connectionId": conn.ID.String(),
			"username":     conn.Username,
		},
		Timestamp: time.Now(),
	}
	m.sendToConnection(conn, welcomeMsg)
}

// unregisterConnection removes a connection from the manager
func (m *WebSocketManager) unregisterConnection(conn *WebSocketConnection) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.connections[conn.ID]; exists {
		// Remove from room if connected
		if conn.RoomID != nil {
			m.removeFromRoom(conn, *conn.RoomID)
		}

		delete(m.connections, conn.ID)
		delete(m.userConnections, conn.Username)
		m.closeConnection(conn)
	}
}

// readPump handles reading messages from WebSocket
func (m *WebSocketManager) readPump(conn *WebSocketConnection) {
	defer func() {
		m.unregister <- conn
	}()

	// Set read deadline and pong handler
	conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.Conn.SetPongHandler(func(string) error {
		conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		conn.mu.Lock()
		conn.LastActivity = time.Now()
		conn.mu.Unlock()
		return nil
	})

	for {
		select {
		case <-conn.Context.Done():
			return
		default:
			_, messageBytes, err := conn.Conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					// Log unexpected close error
				}
				return
			}

			var message WebSocketMessage
			if err := json.Unmarshal(messageBytes, &message); err != nil {
				// Send error message back to client
				errorMsg := &WebSocketMessage{
					Type: MessageTypeError,
					Data: map[string]interface{}{
						"error": "Invalid message format",
					},
					Timestamp: time.Now(),
				}
				m.sendToConnection(conn, errorMsg)
				continue
			}

			// Update last activity
			conn.mu.Lock()
			conn.LastActivity = time.Now()
			conn.mu.Unlock()

			// Process the message
			m.processMessage(conn, &message)
		}
	}
}

// writePump handles writing messages to WebSocket
func (m *WebSocketManager) writePump(conn *WebSocketConnection) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Conn.Close()
	}()

	for {
		select {
		case <-conn.Context.Done():
			return

		case message, ok := <-conn.Send:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				conn.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := conn.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to current message
			n := len(conn.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-conn.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// processMessage processes incoming WebSocket messages
func (m *WebSocketManager) processMessage(conn *WebSocketConnection, message *WebSocketMessage) {
	message.From = conn.Username
	message.Timestamp = time.Now()

	switch message.Type {
	case MessageTypePing:
		// Respond with pong
		pongMsg := &WebSocketMessage{
			Type:      MessageTypePong,
			Data:      map[string]interface{}{},
			Timestamp: time.Now(),
		}
		m.sendToConnection(conn, pongMsg)

	case MessageTypeJoinRoom:
		// TODO: Implement room joining logic
		// This should be handled by the RoomManager

	case MessageTypeLeaveRoom:
		// TODO: Implement room leaving logic
		// This should be handled by the RoomManager

	case MessageTypeGameAction:
		// TODO: Forward game actions to the appropriate game room
		// This should be handled by the GameServer

	case MessageTypeMatchmaking:
		// TODO: Forward matchmaking requests to MatchmakingService
		// This should be handled by the MatchmakingService

	default:
		// Unknown message type
		errorMsg := &WebSocketMessage{
			Type: MessageTypeError,
			Data: map[string]interface{}{
				"error": fmt.Sprintf("Unknown message type: %s", message.Type),
			},
			Timestamp: time.Now(),
		}
		m.sendToConnection(conn, errorMsg)
	}
}

// sendToConnection sends a message to a specific connection
func (m *WebSocketManager) sendToConnection(conn *WebSocketConnection, message *WebSocketMessage) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return
	}

	select {
	case conn.Send <- messageBytes:
	case <-conn.Context.Done():
	default:
		// Channel is full, close connection
		m.unregister <- conn
	}
}

// broadcastToAll broadcasts a message to all connected clients
func (m *WebSocketManager) broadcastToAll(message *WebSocketMessage) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return
	}

	for _, conn := range m.connections {
		select {
		case conn.Send <- messageBytes:
		case <-conn.Context.Done():
		default:
			m.unregister <- conn
		}
	}
}

// broadcastToRoom broadcasts a message to all clients in a specific room
func (m *WebSocketManager) broadcastToRoom(message *WebSocketMessage) {
	if message.RoomID == nil {
		return
	}

	m.mu.RLock()
	roomConnections, exists := m.roomConnections[*message.RoomID]
	m.mu.RUnlock()

	if !exists {
		return
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return
	}

	for _, conn := range roomConnections {
		select {
		case conn.Send <- messageBytes:
		case <-conn.Context.Done():
		default:
			m.unregister <- conn
		}
	}
}

// AddToRoom adds a connection to a room
func (m *WebSocketManager) AddToRoom(conn *WebSocketConnection, roomID uuid.UUID) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Remove from previous room if exists
	if conn.RoomID != nil {
		m.removeFromRoom(conn, *conn.RoomID)
	}

	conn.RoomID = &roomID
	m.roomConnections[roomID] = append(m.roomConnections[roomID], conn)
}

// RemoveFromRoom removes a connection from a room
func (m *WebSocketManager) RemoveFromRoom(conn *WebSocketConnection, roomID uuid.UUID) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.removeFromRoom(conn, roomID)
}

// removeFromRoom internal method to remove from room (assumes lock is held)
func (m *WebSocketManager) removeFromRoom(conn *WebSocketConnection, roomID uuid.UUID) {
	connections := m.roomConnections[roomID]
	for i, c := range connections {
		if c.ID == conn.ID {
			m.roomConnections[roomID] = append(connections[:i], connections[i+1:]...)
			break
		}
	}

	// Clean up empty room
	if len(m.roomConnections[roomID]) == 0 {
		delete(m.roomConnections, roomID)
	}

	conn.RoomID = nil
}

// GetConnection returns a connection by username
func (m *WebSocketManager) GetConnection(username string) (*WebSocketConnection, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	conn, exists := m.userConnections[username]
	return conn, exists
}

// GetRoomConnections returns all connections in a room
func (m *WebSocketManager) GetRoomConnections(roomID uuid.UUID) []*WebSocketConnection {
	m.mu.RLock()
	defer m.mu.RUnlock()

	connections := m.roomConnections[roomID]
	result := make([]*WebSocketConnection, len(connections))
	copy(result, connections)
	return result
}

// closeConnection closes a WebSocket connection
func (m *WebSocketManager) closeConnection(conn *WebSocketConnection) {
	conn.mu.Lock()
	defer conn.mu.Unlock()

	if conn.IsAlive {
		conn.IsAlive = false
		conn.Cancel()
		close(conn.Send)
		conn.Conn.Close()
	}
}

// cleanupDeadConnections removes inactive connections
func (m *WebSocketManager) cleanupDeadConnections() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for id, conn := range m.connections {
		conn.mu.RLock()
		inactive := now.Sub(conn.LastActivity) > 5*time.Minute
		conn.mu.RUnlock()

		if inactive {
			m.unregister <- conn
			delete(m.connections, id)
		}
	}
}

// SendToUser sends a message to a specific user
func (m *WebSocketManager) SendToUser(username string, message *WebSocketMessage) error {
	conn, exists := m.GetConnection(username)
	if !exists {
		return fmt.Errorf("user %s not connected", username)
	}

	m.sendToConnection(conn, message)
	return nil
}

// SendToRoom sends a message to all users in a room
func (m *WebSocketManager) SendToRoom(roomID uuid.UUID, message *WebSocketMessage) {
	message.RoomID = &roomID
	select {
	case m.roomBroadcast <- message:
	case <-m.ctx.Done():
	}
}

// Broadcast sends a message to all connected users
func (m *WebSocketManager) Broadcast(message *WebSocketMessage) {
	select {
	case m.broadcast <- message:
	case <-m.ctx.Done():
	}
}

// GetActiveConnectionsCount returns the number of active connections
func (m *WebSocketManager) GetActiveConnectionsCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.connections)
}

// GetRoomConnectionsCount returns the number of connections in a room
func (m *WebSocketManager) GetRoomConnectionsCount(roomID uuid.UUID) int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.roomConnections[roomID])
}

// Shutdown gracefully shuts down the WebSocket manager
func (m *WebSocketManager) Shutdown() {
	m.cancel()

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, conn := range m.connections {
		m.closeConnection(conn)
	}
}