// internal/gameserver/events.go
package gameserver

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/minigame"
)

// EventType represents different types of game events
type EventType string

const (
	// Connection events
	EventTypeConnect    EventType = "connect"
	EventTypeDisconnect EventType = "disconnect"

	// Room events
	EventTypeRoomCreate EventType = "room_create"
	EventTypeRoomJoin   EventType = "room_join"
	EventTypeRoomLeave  EventType = "room_leave"
	EventTypeRoomClose  EventType = "room_close"

	// Game events
	EventTypeGameStart   EventType = "game_start"
	EventTypeGameAction  EventType = "game_action"
	EventTypeGameUpdate  EventType = "game_update"
	EventTypeGameEnd     EventType = "game_end"
	EventTypeGamePause   EventType = "game_pause"
	EventTypeGameResume  EventType = "game_resume"

	// Player events
	EventTypePlayerReady    EventType = "player_ready"
	EventTypePlayerNotReady EventType = "player_not_ready"
	EventTypePlayerScore    EventType = "player_score"
	EventTypePlayerAction   EventType = "player_action"

	// Matchmaking events
	EventTypeMatchmakingStart   EventType = "matchmaking_start"
	EventTypeMatchmakingCancel  EventType = "matchmaking_cancel"
	EventTypeMatchFound         EventType = "match_found"
	EventTypeMatchTimeout       EventType = "match_timeout"

	// System events
	EventTypeSystemError     EventType = "system_error"
	EventTypeSystemMaintenance EventType = "system_maintenance"
	EventTypeSystemShutdown    EventType = "system_shutdown"
)

// GameEvent represents a game-related event
type GameEvent struct {
	ID        uuid.UUID              `json:"id"`
	Type      EventType              `json:"type"`
	Source    string                 `json:"source"`    // Who/what generated the event
	Target    string                 `json:"target"`    // Who the event is for (optional)
	RoomID    *uuid.UUID             `json:"roomId,omitempty"`
	SessionID *uuid.UUID             `json:"sessionId,omitempty"`
	Username  string                 `json:"username,omitempty"`
	Data      map[string]interface{} `json:"data"`
	Metadata  map[string]interface{} `json:"metadata"`
	Timestamp time.Time              `json:"timestamp"`
	TTL       *time.Time             `json:"ttl,omitempty"` // Time to live
}

// EventHandler defines the interface for handling events
type EventHandler interface {
	HandleEvent(event *GameEvent) error
	GetEventTypes() []EventType
}

// EventSubscription represents a subscription to specific event types
type EventSubscription struct {
	ID         uuid.UUID   `json:"id"`
	Subscriber string      `json:"subscriber"`
	EventTypes []EventType `json:"eventTypes"`
	RoomID     *uuid.UUID  `json:"roomId,omitempty"`   // Subscribe to room-specific events
	Username   string      `json:"username,omitempty"` // Subscribe to user-specific events
	Handler    EventHandler `json:"-"`
	Channel    chan *GameEvent `json:"-"`
	Active     bool        `json:"active"`
	CreatedAt  time.Time   `json:"createdAt"`
}

// EventBus manages event distribution and subscriptions
type EventBus struct {
	subscriptions   map[uuid.UUID]*EventSubscription
	typeSubscriptions map[EventType][]*EventSubscription
	roomSubscriptions map[uuid.UUID][]*EventSubscription
	userSubscriptions map[string][]*EventSubscription
	eventHistory    []*GameEvent
	historyLimit    int
	eventQueue      chan *GameEvent
	mu              sync.RWMutex
	ctx             context.Context
	cancel          context.CancelFunc
	wsManager       *WebSocketManager
}

// EventProcessor handles different types of events
type EventProcessor struct {
	eventBus       *EventBus
	roomManager    *RoomManager
	matchmaking    *MatchmakingService
	miniGameEngine *minigame.MiniGameEngine
	wsManager      *WebSocketManager
	mu             sync.RWMutex
}

// NewEventBus creates a new event bus
func NewEventBus(ctx context.Context, wsManager *WebSocketManager) *EventBus {
	busCtx, cancel := context.WithCancel(ctx)

	bus := &EventBus{
		subscriptions:     make(map[uuid.UUID]*EventSubscription),
		typeSubscriptions: make(map[EventType][]*EventSubscription),
		roomSubscriptions: make(map[uuid.UUID][]*EventSubscription),
		userSubscriptions: make(map[string][]*EventSubscription),
		eventHistory:      make([]*GameEvent, 0),
		historyLimit:      1000, // Keep last 1000 events
		eventQueue:        make(chan *GameEvent, 1024),
		ctx:               busCtx,
		cancel:            cancel,
		wsManager:         wsManager,
	}

	// Start event processing loop
	go bus.processEvents()

	// Start cleanup routine
	go bus.cleanupRoutine()

	return bus
}

// NewEventProcessor creates a new event processor
func NewEventProcessor(eventBus *EventBus, roomManager *RoomManager, matchmaking *MatchmakingService, miniGameEngine *minigame.MiniGameEngine, wsManager *WebSocketManager) *EventProcessor {
	processor := &EventProcessor{
		eventBus:       eventBus,
		roomManager:    roomManager,
		matchmaking:    matchmaking,
		miniGameEngine: miniGameEngine,
		wsManager:      wsManager,
	}

	// Subscribe to all event types for processing
	processor.subscribeToEvents()

	return processor
}

// PublishEvent publishes an event to the event bus
func (eb *EventBus) PublishEvent(event *GameEvent) {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	select {
	case eb.eventQueue <- event:
	case <-eb.ctx.Done():
	default:
		// Queue is full, drop the event (could also log this)
	}
}

// Subscribe creates a subscription to specific event types
func (eb *EventBus) Subscribe(subscriber string, eventTypes []EventType, roomID *uuid.UUID, username string) (*EventSubscription, error) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	subscription := &EventSubscription{
		ID:         uuid.New(),
		Subscriber: subscriber,
		EventTypes: eventTypes,
		RoomID:     roomID,
		Username:   username,
		Channel:    make(chan *GameEvent, 256),
		Active:     true,
		CreatedAt:  time.Now(),
	}

	eb.subscriptions[subscription.ID] = subscription

	// Add to type-based subscriptions
	for _, eventType := range eventTypes {
		eb.typeSubscriptions[eventType] = append(eb.typeSubscriptions[eventType], subscription)
	}

	// Add to room-based subscriptions
	if roomID != nil {
		eb.roomSubscriptions[*roomID] = append(eb.roomSubscriptions[*roomID], subscription)
	}

	// Add to user-based subscriptions
	if username != "" {
		eb.userSubscriptions[username] = append(eb.userSubscriptions[username], subscription)
	}

	return subscription, nil
}

// Unsubscribe removes a subscription
func (eb *EventBus) Unsubscribe(subscriptionID uuid.UUID) error {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	subscription, exists := eb.subscriptions[subscriptionID]
	if !exists {
		return fmt.Errorf("subscription not found")
	}

	subscription.Active = false
	close(subscription.Channel)

	// Remove from type subscriptions
	for _, eventType := range subscription.EventTypes {
		subs := eb.typeSubscriptions[eventType]
		for i, sub := range subs {
			if sub.ID == subscriptionID {
				eb.typeSubscriptions[eventType] = append(subs[:i], subs[i+1:]...)
				break
			}
		}
	}

	// Remove from room subscriptions
	if subscription.RoomID != nil {
		subs := eb.roomSubscriptions[*subscription.RoomID]
		for i, sub := range subs {
			if sub.ID == subscriptionID {
				eb.roomSubscriptions[*subscription.RoomID] = append(subs[:i], subs[i+1:]...)
				break
			}
		}
	}

	// Remove from user subscriptions
	if subscription.Username != "" {
		subs := eb.userSubscriptions[subscription.Username]
		for i, sub := range subs {
			if sub.ID == subscriptionID {
				eb.userSubscriptions[subscription.Username] = append(subs[:i], subs[i+1:]...)
				break
			}
		}
	}

	delete(eb.subscriptions, subscriptionID)

	return nil
}

// processEvents processes events from the queue
func (eb *EventBus) processEvents() {
	for {
		select {
		case <-eb.ctx.Done():
			return

		case event := <-eb.eventQueue:
			eb.distributeEvent(event)
			eb.addToHistory(event)
			eb.sendWebSocketEvent(event)
		}
	}
}

// distributeEvent distributes an event to all relevant subscriptions
func (eb *EventBus) distributeEvent(event *GameEvent) {
	eb.mu.RLock()
	defer eb.mu.RUnlock()

	// Check TTL
	if event.TTL != nil && time.Now().After(*event.TTL) {
		return
	}

	var targetSubscriptions []*EventSubscription

	// Get subscriptions by event type
	if subs, exists := eb.typeSubscriptions[event.Type]; exists {
		targetSubscriptions = append(targetSubscriptions, subs...)
	}

	// Filter by room if specified
	if event.RoomID != nil {
		if subs, exists := eb.roomSubscriptions[*event.RoomID]; exists {
			targetSubscriptions = append(targetSubscriptions, subs...)
		}
	}

	// Filter by user if specified
	if event.Username != "" {
		if subs, exists := eb.userSubscriptions[event.Username]; exists {
			targetSubscriptions = append(targetSubscriptions, subs...)
		}
	}

	// Remove duplicates and send to active subscriptions
	sent := make(map[uuid.UUID]bool)
	for _, sub := range targetSubscriptions {
		if sub.Active && !sent[sub.ID] {
			sent[sub.ID] = true

			// Check if subscription matches event criteria
			if eb.matchesSubscription(event, sub) {
				select {
				case sub.Channel <- event:
				default:
					// Channel is full, could log this
				}

				// Call handler if available
				if sub.Handler != nil {
					go func(handler EventHandler, e *GameEvent) {
						if err := handler.HandleEvent(e); err != nil {
							// Could log error here
						}
					}(sub.Handler, event)
				}
			}
		}
	}
}

// matchesSubscription checks if an event matches a subscription's criteria
func (eb *EventBus) matchesSubscription(event *GameEvent, sub *EventSubscription) bool {
	// Check event type
	typeMatches := false
	for _, eventType := range sub.EventTypes {
		if eventType == event.Type {
			typeMatches = true
			break
		}
	}
	if !typeMatches {
		return false
	}

	// Check room filter
	if sub.RoomID != nil && (event.RoomID == nil || *sub.RoomID != *event.RoomID) {
		return false
	}

	// Check user filter
	if sub.Username != "" && event.Username != sub.Username {
		return false
	}

	return true
}

// addToHistory adds an event to the history
func (eb *EventBus) addToHistory(event *GameEvent) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.eventHistory = append(eb.eventHistory, event)

	// Maintain history limit
	if len(eb.eventHistory) > eb.historyLimit {
		eb.eventHistory = eb.eventHistory[1:]
	}
}

// sendWebSocketEvent sends events to WebSocket clients
func (eb *EventBus) sendWebSocketEvent(event *GameEvent) {
	message := &WebSocketMessage{
		Type:      string(event.Type),
		Data:      event.Data,
		Timestamp: event.Timestamp,
		From:      event.Source,
		To:        event.Target,
		RoomID:    event.RoomID,
	}

	// Send to specific user
	if event.Username != "" {
		eb.wsManager.SendToUser(event.Username, message)
		return
	}

	// Send to room
	if event.RoomID != nil {
		eb.wsManager.SendToRoom(*event.RoomID, message)
		return
	}

	// Broadcast to all (be careful with this)
	if event.Target == "all" {
		eb.wsManager.Broadcast(message)
	}
}

// GetEventHistory returns the event history
func (eb *EventBus) GetEventHistory(limit int, eventTypes []EventType, roomID *uuid.UUID, username string) []*GameEvent {
	eb.mu.RLock()
	defer eb.mu.RUnlock()

	var filtered []*GameEvent

	for i := len(eb.eventHistory) - 1; i >= 0 && len(filtered) < limit; i-- {
		event := eb.eventHistory[i]

		// Filter by event types
		if len(eventTypes) > 0 {
			typeMatches := false
			for _, eventType := range eventTypes {
				if event.Type == eventType {
					typeMatches = true
					break
				}
			}
			if !typeMatches {
				continue
			}
		}

		// Filter by room
		if roomID != nil && (event.RoomID == nil || *event.RoomID != *roomID) {
			continue
		}

		// Filter by user
		if username != "" && event.Username != username {
			continue
		}

		filtered = append(filtered, event)
	}

	return filtered
}

// cleanupRoutine periodically cleans up expired events and subscriptions
func (eb *EventBus) cleanupRoutine() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-eb.ctx.Done():
			return

		case <-ticker.C:
			eb.cleanup()
		}
	}
}

// cleanup removes expired events and inactive subscriptions
func (eb *EventBus) cleanup() {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	now := time.Now()

	// Clean up expired events from history
	var validEvents []*GameEvent
	for _, event := range eb.eventHistory {
		if event.TTL == nil || now.Before(*event.TTL) {
			validEvents = append(validEvents, event)
		}
	}
	eb.eventHistory = validEvents

	// Clean up inactive subscriptions (older than 1 hour)
	for id, sub := range eb.subscriptions {
		if !sub.Active || now.Sub(sub.CreatedAt) > time.Hour {
			eb.Unsubscribe(id)
		}
	}
}

// subscribeToEvents sets up event subscriptions for the processor
func (ep *EventProcessor) subscribeToEvents() {
	allEventTypes := []EventType{
		EventTypeConnect, EventTypeDisconnect,
		EventTypeRoomCreate, EventTypeRoomJoin, EventTypeRoomLeave, EventTypeRoomClose,
		EventTypeGameStart, EventTypeGameAction, EventTypeGameUpdate, EventTypeGameEnd,
		EventTypePlayerReady, EventTypePlayerNotReady, EventTypePlayerScore, EventTypePlayerAction,
		EventTypeMatchmakingStart, EventTypeMatchmakingCancel, EventTypeMatchFound, EventTypeMatchTimeout,
		EventTypeSystemError, EventTypeSystemMaintenance, EventTypeSystemShutdown,
	}

	ep.eventBus.Subscribe("event_processor", allEventTypes, nil, "")
}

// HandleEvent processes different types of events
func (ep *EventProcessor) HandleEvent(event *GameEvent) error {
	switch event.Type {
	case EventTypeConnect:
		return ep.handleConnectEvent(event)
	case EventTypeDisconnect:
		return ep.handleDisconnectEvent(event)
	case EventTypeRoomCreate:
		return ep.handleRoomCreateEvent(event)
	case EventTypeRoomJoin:
		return ep.handleRoomJoinEvent(event)
	case EventTypeRoomLeave:
		return ep.handleRoomLeaveEvent(event)
	case EventTypeGameStart:
		return ep.handleGameStartEvent(event)
	case EventTypeGameAction:
		return ep.handleGameActionEvent(event)
	case EventTypeGameEnd:
		return ep.handleGameEndEvent(event)
	case EventTypePlayerScore:
		return ep.handlePlayerScoreEvent(event)
	case EventTypeMatchmakingStart:
		return ep.handleMatchmakingStartEvent(event)
	case EventTypeMatchFound:
		return ep.handleMatchFoundEvent(event)
	default:
		// Log unknown event type
		return nil
	}
}

// GetEventTypes returns the event types this processor handles
func (ep *EventProcessor) GetEventTypes() []EventType {
	return []EventType{
		EventTypeConnect, EventTypeDisconnect,
		EventTypeRoomCreate, EventTypeRoomJoin, EventTypeRoomLeave,
		EventTypeGameStart, EventTypeGameAction, EventTypeGameEnd,
		EventTypePlayerScore, EventTypeMatchmakingStart, EventTypeMatchFound,
	}
}

// Event handler implementations

func (ep *EventProcessor) handleConnectEvent(event *GameEvent) error {
	// TODO: Handle user connection events
	// Could update user status, notify friends, etc.
	return nil
}

func (ep *EventProcessor) handleDisconnectEvent(event *GameEvent) error {
	// TODO: Handle user disconnection events
	// Could clean up user's room, cancel matchmaking, etc.
	if event.Username != "" {
		// Leave matchmaking if active
		ep.matchmaking.LeaveMatchmaking(event.Username)

		// Leave room if in one
		if room, exists := ep.roomManager.GetUserRoom(event.Username); exists {
			ep.roomManager.LeaveRoom(room.ID, event.Username)
		}
	}
	return nil
}

func (ep *EventProcessor) handleRoomCreateEvent(event *GameEvent) error {
	// TODO: Log room creation, update statistics
	return nil
}

func (ep *EventProcessor) handleRoomJoinEvent(event *GameEvent) error {
	// TODO: Update room statistics, notify other services
	return nil
}

func (ep *EventProcessor) handleRoomLeaveEvent(event *GameEvent) error {
	// TODO: Handle room leave cleanup
	return nil
}

func (ep *EventProcessor) handleGameStartEvent(event *GameEvent) error {
	// TODO: Initialize game-specific logic, start timers, etc.
	return nil
}

func (ep *EventProcessor) handleGameActionEvent(event *GameEvent) error {
	// TODO: Validate and process game actions
	// Could implement anti-cheat logic here
	return nil
}

func (ep *EventProcessor) handleGameEndEvent(event *GameEvent) error {
	// TODO: Calculate final scores, award points, update statistics
	if event.RoomID != nil {
		room, exists := ep.roomManager.GetRoom(*event.RoomID)
		if exists {
			// Award points based on game results
			// This is a simplified implementation
			for username, player := range room.Players {
				if player.Score > 0 {
					// Create a simple game result for point calculation
					result := &minigame.GameResult{
						SessionID:      uuid.New(),
						PlayerUsername: username,
						GameType:       room.GameType,
						FinalScore:     player.Score,
						Duration:       time.Since(*room.StartTime),
						IsValid:        true,
					}

					// Calculate and award points
					calculatedResult, err := ep.miniGameEngine.CalculateReward(result)
					if err == nil && calculatedResult.IsValid {
						ep.miniGameEngine.AwardPoints(calculatedResult)
					}
				}
			}
		}
	}
	return nil
}

func (ep *EventProcessor) handlePlayerScoreEvent(event *GameEvent) error {
	// TODO: Update player scores, check for achievements
	return nil
}

func (ep *EventProcessor) handleMatchmakingStartEvent(event *GameEvent) error {
	// TODO: Log matchmaking start, update statistics
	return nil
}

func (ep *EventProcessor) handleMatchFoundEvent(event *GameEvent) error {
	// TODO: Log successful matches, update matchmaking statistics
	return nil
}

// CreateEvent is a helper function to create common events
func CreateEvent(eventType EventType, source string, data map[string]interface{}) *GameEvent {
	return &GameEvent{
		ID:        uuid.New(),
		Type:      eventType,
		Source:    source,
		Data:      data,
		Metadata:  make(map[string]interface{}),
		Timestamp: time.Now(),
	}
}

// CreateRoomEvent creates a room-specific event
func CreateRoomEvent(eventType EventType, roomID uuid.UUID, username string, data map[string]interface{}) *GameEvent {
	event := CreateEvent(eventType, "room_manager", data)
	event.RoomID = &roomID
	event.Username = username
	return event
}

// CreateUserEvent creates a user-specific event
func CreateUserEvent(eventType EventType, username string, data map[string]interface{}) *GameEvent {
	event := CreateEvent(eventType, "user_manager", data)
	event.Username = username
	return event
}

// CreateGameEvent creates a game-specific event
func CreateGameEvent(eventType EventType, roomID uuid.UUID, sessionID uuid.UUID, username string, data map[string]interface{}) *GameEvent {
	event := CreateEvent(eventType, "game_engine", data)
	event.RoomID = &roomID
	event.SessionID = &sessionID
	event.Username = username
	return event
}

// Shutdown gracefully shuts down the event bus
func (eb *EventBus) Shutdown() {
	eb.cancel()

	eb.mu.Lock()
	defer eb.mu.Unlock()

	// Close all subscription channels
	for _, sub := range eb.subscriptions {
		if sub.Active {
			sub.Active = false
			close(sub.Channel)
		}
	}

	close(eb.eventQueue)
}