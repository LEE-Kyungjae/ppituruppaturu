package gameserver

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/pool"
)

// ConnectionPool manages WebSocket connections with optimized performance
type ConnectionPool struct {
	connections     sync.Map // uuid.UUID -> *OptimizedConnection
	userConnections sync.Map // string -> *OptimizedConnection
	roomConnections sync.Map // uuid.UUID -> *sync.Map (connectionID -> *OptimizedConnection)

	// Channels for connection management
	register   chan *OptimizedConnection
	unregister chan *OptimizedConnection

	// Broadcast channels with buffering
	globalBroadcast chan *PooledMessage
	roomBroadcast   chan *RoomMessage

	// Configuration
	config *PoolConfig

	// Metrics
	activeConnections int64
	totalMessages     int64
	failedMessages    int64

	// Cleanup
	cleanupTicker *time.Ticker
	done          chan struct{}

	upgrader websocket.Upgrader
}

// PoolConfig holds configuration for the connection pool
type PoolConfig struct {
	MaxConnections     int
	WriteTimeout       time.Duration
	ReadTimeout        time.Duration
	PingPeriod         time.Duration
	PongTimeout        time.Duration
	MaxMessageSize     int64
	WriteBufferSize    int
	ReadBufferSize     int
	CleanupInterval    time.Duration
	MessageChannelSize int
}

// DefaultPoolConfig returns default configuration
func DefaultPoolConfig() *PoolConfig {
	return &PoolConfig{
		MaxConnections:     10000,
		WriteTimeout:       10 * time.Second,
		ReadTimeout:        60 * time.Second,
		PingPeriod:         54 * time.Second,
		PongTimeout:        60 * time.Second,
		MaxMessageSize:     512,
		WriteBufferSize:    1024,
		ReadBufferSize:     1024,
		CleanupInterval:    30 * time.Second,
		MessageChannelSize: 1000,
	}
}

// OptimizedConnection represents an optimized WebSocket connection
type OptimizedConnection struct {
	ID           uuid.UUID
	Username     string
	Conn         *websocket.Conn
	RoomID       *uuid.UUID
	LastActivity int64 // Unix timestamp for atomic operations
	IsAlive      int32 // Atomic boolean (0 = false, 1 = true)

	// Channels
	send chan *PooledMessage
	done chan struct{}

	// Context for cancellation
	ctx    context.Context
	cancel context.CancelFunc

	// Message processing
	messageHandler func(*PooledMessage)

	// Performance metrics
	messagesSent     int64
	messagesReceived int64
	bytesTransferred int64
}

// PooledMessage represents a message that can be reused
type PooledMessage struct {
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
	From      string                 `json:"from,omitempty"`
	To        string                 `json:"to,omitempty"`
	RoomID    *uuid.UUID             `json:"roomId,omitempty"`

	// For pooling
	buf   []byte
	inUse bool
}

// RoomMessage represents a message targeted to a specific room
type RoomMessage struct {
	RoomID  uuid.UUID
	Message *PooledMessage
	Exclude []uuid.UUID // Connection IDs to exclude
}

// MessagePool for reusing message objects
var messagePool = sync.Pool{
	New: func() interface{} {
		return &PooledMessage{
			Data: make(map[string]interface{}),
			buf:  make([]byte, 0, 512),
		}
	},
}

// GetMessage returns a pooled message
func GetMessage() *PooledMessage {
	msg := messagePool.Get().(*PooledMessage)
	msg.inUse = true
	msg.Timestamp = time.Now().Unix()
	// Clear previous data
	for k := range msg.Data {
		delete(msg.Data, k)
	}
	msg.buf = msg.buf[:0]
	return msg
}

// ReleaseMessage returns a message to the pool
func ReleaseMessage(msg *PooledMessage) {
	if !msg.inUse {
		return
	}
	msg.inUse = false
	msg.Type = ""
	msg.From = ""
	msg.To = ""
	msg.RoomID = nil
	messagePool.Put(msg)
}

// NewConnectionPool creates a new optimized connection pool
func NewConnectionPool(config *PoolConfig) *ConnectionPool {
	if config == nil {
		config = DefaultPoolConfig()
	}

	pool := &ConnectionPool{
		register:        make(chan *OptimizedConnection, 100),
		unregister:      make(chan *OptimizedConnection, 100),
		globalBroadcast: make(chan *PooledMessage, config.MessageChannelSize),
		roomBroadcast:   make(chan *RoomMessage, config.MessageChannelSize),
		config:          config,
		done:            make(chan struct{}),
		cleanupTicker:   time.NewTicker(config.CleanupInterval),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  config.ReadBufferSize,
			WriteBufferSize: config.WriteBufferSize,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
	}

	return pool
}

// Start begins the connection pool management
func (p *ConnectionPool) Start(ctx context.Context) {
	go p.run(ctx)
}

// run is the main event loop for the connection pool
func (p *ConnectionPool) run(ctx context.Context) {
	defer p.cleanupTicker.Stop()

	for {
		select {
		case conn := <-p.register:
			p.handleRegister(conn)

		case conn := <-p.unregister:
			p.handleUnregister(conn)

		case msg := <-p.globalBroadcast:
			p.handleGlobalBroadcast(msg)

		case roomMsg := <-p.roomBroadcast:
			p.handleRoomBroadcast(roomMsg)

		case <-p.cleanupTicker.C:
			p.cleanup()

		case <-ctx.Done():
			p.shutdown()
			return

		case <-p.done:
			p.shutdown()
			return
		}
	}
}

// handleRegister adds a new connection to the pool
func (p *ConnectionPool) handleRegister(conn *OptimizedConnection) {
	// Check connection limit
	if atomic.LoadInt64(&p.activeConnections) >= int64(p.config.MaxConnections) {
		conn.Close("Connection limit exceeded")
		return
	}

	// Store connection
	p.connections.Store(conn.ID, conn)
	p.userConnections.Store(conn.Username, conn)

	if conn.RoomID != nil {
		p.addToRoom(conn)
	}

	atomic.AddInt64(&p.activeConnections, 1)

	// Start connection handlers
	go conn.writePump(p)
	go conn.readPump(p)
}

// handleUnregister removes a connection from the pool
func (p *ConnectionPool) handleUnregister(conn *OptimizedConnection) {
	// Remove from maps
	p.connections.Delete(conn.ID)
	p.userConnections.Delete(conn.Username)

	if conn.RoomID != nil {
		p.removeFromRoom(conn)
	}

	atomic.AddInt64(&p.activeConnections, -1)
	conn.Close("")
}

// addToRoom adds a connection to a room
func (p *ConnectionPool) addToRoom(conn *OptimizedConnection) {
	roomConnections, _ := p.roomConnections.LoadOrStore(*conn.RoomID, &sync.Map{})
	roomMap := roomConnections.(*sync.Map)
	roomMap.Store(conn.ID, conn)
}

// removeFromRoom removes a connection from a room
func (p *ConnectionPool) removeFromRoom(conn *OptimizedConnection) {
	if roomConnections, ok := p.roomConnections.Load(*conn.RoomID); ok {
		roomMap := roomConnections.(*sync.Map)
		roomMap.Delete(conn.ID)
	}
}

// handleGlobalBroadcast sends a message to all connections
func (p *ConnectionPool) handleGlobalBroadcast(msg *PooledMessage) {
	defer ReleaseMessage(msg)

	p.connections.Range(func(key, value interface{}) bool {
		conn := value.(*OptimizedConnection)
		conn.SendMessage(msg)
		return true
	})

	atomic.AddInt64(&p.totalMessages, 1)
}

// handleRoomBroadcast sends a message to all connections in a room
func (p *ConnectionPool) handleRoomBroadcast(roomMsg *RoomMessage) {
	defer ReleaseMessage(roomMsg.Message)

	if roomConnections, ok := p.roomConnections.Load(roomMsg.RoomID); ok {
		roomMap := roomConnections.(*sync.Map)

		// Create exclude map for faster lookup
		excludeMap := make(map[uuid.UUID]bool)
		for _, id := range roomMsg.Exclude {
			excludeMap[id] = true
		}

		roomMap.Range(func(key, value interface{}) bool {
			connID := key.(uuid.UUID)
			if !excludeMap[connID] {
				conn := value.(*OptimizedConnection)
				conn.SendMessage(roomMsg.Message)
			}
			return true
		})
	}

	atomic.AddInt64(&p.totalMessages, 1)
}

// cleanup removes dead connections
func (p *ConnectionPool) cleanup() {
	now := time.Now().Unix()
	timeout := int64(p.config.ReadTimeout.Seconds())

	var toRemove []*OptimizedConnection

	p.connections.Range(func(key, value interface{}) bool {
		conn := value.(*OptimizedConnection)
		lastActivity := atomic.LoadInt64(&conn.LastActivity)

		if now-lastActivity > timeout || atomic.LoadInt32(&conn.IsAlive) == 0 {
			toRemove = append(toRemove, conn)
		}
		return true
	})

	// Remove dead connections
	for _, conn := range toRemove {
		p.unregister <- conn
	}
}

// shutdown gracefully shuts down the connection pool
func (p *ConnectionPool) shutdown() {
	p.connections.Range(func(key, value interface{}) bool {
		conn := value.(*OptimizedConnection)
		conn.Close("Server shutting down")
		return true
	})
}

// GetConnectionCount returns the current number of active connections
func (p *ConnectionPool) GetConnectionCount() int64 {
	return atomic.LoadInt64(&p.activeConnections)
}

// GetMetrics returns performance metrics
func (p *ConnectionPool) GetMetrics() map[string]int64 {
	return map[string]int64{
		"active_connections": atomic.LoadInt64(&p.activeConnections),
		"total_messages":     atomic.LoadInt64(&p.totalMessages),
		"failed_messages":    atomic.LoadInt64(&p.failedMessages),
	}
}

// SendMessage sends a message to a specific connection
func (conn *OptimizedConnection) SendMessage(msg *PooledMessage) {
	if atomic.LoadInt32(&conn.IsAlive) == 0 {
		return
	}

	select {
	case conn.send <- msg:
		atomic.StoreInt64(&conn.LastActivity, time.Now().Unix())
	default:
		// Channel is full, connection might be slow
		atomic.StoreInt32(&conn.IsAlive, 0)
	}
}

// Close closes the connection gracefully
func (conn *OptimizedConnection) Close(reason string) {
	if atomic.SwapInt32(&conn.IsAlive, 0) == 1 {
		close(conn.done)
		conn.cancel()
		conn.Conn.Close()
	}
}

// writePump handles writing messages to the WebSocket connection
func (conn *OptimizedConnection) writePump(pool *ConnectionPool) {
	defer conn.Conn.Close()

	ticker := time.NewTicker(pool.config.PingPeriod)
	defer ticker.Stop()

	for {
		select {
		case msg, ok := <-conn.send:
			conn.Conn.SetWriteDeadline(time.Now().Add(pool.config.WriteTimeout))
			if !ok {
				conn.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Get buffer from pool
			buf := pool.GetBuffer()
			defer pool.PutBuffer(buf)

			if err := conn.Conn.WriteJSON(msg); err != nil {
				atomic.AddInt64(&pool.failedMessages, 1)
				return
			}

			atomic.AddInt64(&conn.messagesSent, 1)

		case <-ticker.C:
			conn.Conn.SetWriteDeadline(time.Now().Add(pool.config.WriteTimeout))
			if err := conn.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-conn.done:
			return
		}
	}
}

// readPump handles reading messages from the WebSocket connection
func (conn *OptimizedConnection) readPump(pool *ConnectionPool) {
	defer func() {
		pool.unregister <- conn
		conn.Conn.Close()
	}()

	conn.Conn.SetReadLimit(pool.config.MaxMessageSize)
	conn.Conn.SetReadDeadline(time.Now().Add(pool.config.PongTimeout))
	conn.Conn.SetPongHandler(func(string) error {
		conn.Conn.SetReadDeadline(time.Now().Add(pool.config.PongTimeout))
		atomic.StoreInt64(&conn.LastActivity, time.Now().Unix())
		return nil
	})

	for {
		select {
		case <-conn.done:
			return
		default:
			msg := GetMessage()
			err := conn.Conn.ReadJSON(msg)
			if err != nil {
				ReleaseMessage(msg)
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					// Log unexpected close
				}
				return
			}

			atomic.StoreInt64(&conn.LastActivity, time.Now().Unix())
			atomic.AddInt64(&conn.messagesReceived, 1)

			// Handle message
			if conn.messageHandler != nil {
				go func() {
					defer ReleaseMessage(msg)
					conn.messageHandler(msg)
				}()
			} else {
				ReleaseMessage(msg)
			}
		}
	}
}

// GetBuffer returns a buffer from the pool (reuse pool.GetBuffer)
func (p *ConnectionPool) GetBuffer() *[]byte {
	return pool.GetByteSlice()
}

// PutBuffer returns a buffer to the pool (reuse pool.PutByteSlice)
func (p *ConnectionPool) PutBuffer(buf *[]byte) {
	pool.PutByteSlice(buf)
}