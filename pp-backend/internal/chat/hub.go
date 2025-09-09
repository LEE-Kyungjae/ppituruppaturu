// backend/internal/chat/hub.go
package chat

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// HubInterface defines the interface for the chat hub.
type HubInterface interface {
	Run()
	GetClientOnlineStatus(username string) bool
	SendPrivateMessage(msg *Message)
	SendRoomMessage(roomID uuid.UUID, message *Message)
	Register() chan<- *Client
	Unregister() chan<- *Client
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	Hub HubInterface
	Conn *websocket.Conn
	Send chan []byte
	Username string // Unique identifier for the client
	Online bool
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients, mapped by username.
	clients map[string]*Client

	// Registered rooms, mapped by room ID.
	rooms map[uuid.UUID]map[string]*Client

	// Inbound messages from the clients.
	Broadcast chan *Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Private messages to specific clients.
	PrivateMessage chan *Message

	// Status updates for presence
	StatusUpdate chan *Client

	// Mutex for concurrent map access
	mu sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:      make(chan *Message),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		PrivateMessage: make(chan *Message),
		StatusUpdate:   make(chan *Client),
		clients:        make(map[string]*Client),
		rooms:          make(map[uuid.UUID]map[string]*Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.Username] = client
			client.Online = true
			h.mu.Unlock()
			log.Printf("Client registered: %s", client.Username)
			h.StatusUpdate <- client // Notify about status change
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.Username]; ok {
				delete(h.clients, client.Username)
				close(client.Send)
				client.Online = false
				log.Printf("Client unregistered: %s", client.Username)
				h.StatusUpdate <- client // Notify about status change
			}
			// Also remove from any rooms they might be in
			for roomID, clientsInRoom := range h.rooms {
				if _, ok := clientsInRoom[client.Username]; ok {
					delete(clientsInRoom, client.Username)
					if len(clientsInRoom) == 0 {
						delete(h.rooms, roomID)
					}
				}
			}
			h.mu.Unlock()
		case message := <-h.Broadcast:
			// This channel is now primarily for internal hub messages or general announcements
			// For now, just log it.
			log.Printf("General broadcast message: %+v", message)
		case message := <-h.PrivateMessage:
			h.mu.Lock()
			if client, ok := h.clients[message.Receiver.String]; ok {
				msgBytes, _ := json.Marshal(message)
				select {
				case client.Send <- msgBytes:
				default:
					close(client.Send)
					delete(h.clients, client.Username)
				}
			} else {
				log.Printf("Receiver %s not found for private message.", message.Receiver.String)
			}
			h.mu.Unlock()
		}
	}
}

// JoinRoom adds a client to a specific chat room.
func (h *Hub) JoinRoom(roomID uuid.UUID, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.rooms[roomID]; !ok {
		h.rooms[roomID] = make(map[string]*Client)
	}
	h.rooms[roomID][client.Username] = client
	log.Printf("Client %s joined room %s", client.Username, roomID.String())
}

// LeaveRoom removes a client from a specific chat room.
func (h *Hub) LeaveRoom(roomID uuid.UUID, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clientsInRoom, ok := h.rooms[roomID]; ok {
		if _, ok := clientsInRoom[client.Username]; ok {
			delete(clientsInRoom, client.Username)
			if len(clientsInRoom) == 0 {
				delete(h.rooms, roomID)
			}
			log.Printf("Client %s left room %s", client.Username, roomID.String())
		}
	}
}

// SendPrivateMessage sends a message to a specific user.
func (h *Hub) SendPrivateMessage(msg *Message) {
	h.PrivateMessage <- msg
}

// SendRoomMessage sends a message to all clients in a specific room.
func (h *Hub) SendRoomMessage(roomID uuid.UUID, message *Message) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clientsInRoom, ok := h.rooms[roomID]; ok {
		msgBytes, _ := json.Marshal(message)
		for _, client := range clientsInRoom {
			select {
			case client.Send <- msgBytes:
			default:
				close(client.Send)
				delete(clientsInRoom, client.Username)
			}
		}
	} else {
		log.Printf("Room %s not found for message.", roomID.String())
	}
}

// GetClientOnlineStatus returns the online status of a client.
func (h *Hub) GetClientOnlineStatus(username string) bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	client, ok := h.clients[username]
	return ok && client.Online
}

func (h *Hub) Register() chan<- *Client {
	return h.register
}

func (h *Hub) Unregister() chan<- *Client {
	return h.unregister
}

// ReadPump pumps messages from the websocket connection to the hub.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister() <- c
		c.Conn.Close()
	}()
	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Error unmarshalling message: %v", err)
			continue
		}

		msg.Sender = c.Username
		msg.Timestamp = time.Now()

		switch msg.Type {
		case MessageTypeChat:
			if msg.Receiver.Valid {
				c.Hub.SendPrivateMessage(&msg)
			} else if msg.RoomID.Valid {
				c.Hub.SendRoomMessage(msg.RoomID.V, &msg)
			} else {
				log.Printf("Chat message from %s has no receiver or room ID.", msg.Sender)
			}
		case MessageTypeSystem:
			// Handle system messages (e.g., user status updates)
			log.Printf("System message from %s: %s", msg.Sender, msg.Content)
		case MessageTypeGame:
			// Handle game-related messages
			log.Printf("Game message from %s: %s", msg.Sender, msg.Content)
		default:
			log.Printf("Unknown message type from %s: %s", msg.Sender, msg.Type)
		}
	}
}

// WritePump pumps messages from the hub to the websocket connection.
func (c *Client) WritePump() {
	defer func() {
		c.Hub.Unregister() <- c
		c.Conn.Close()
	}()
	for message := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("error: %v", err)
			return
		}
	}
}

var _ HubInterface = (*Hub)(nil)