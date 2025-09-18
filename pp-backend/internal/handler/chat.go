// backend/internal/handler/chat.go

package handler

import (
	"log"
	"net/http"

	"github.com/pitturu-ppaturu/backend/internal/chat"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now, but in production, you should restrict this
		return true
	},
}

// ChatHandler handles chat-related WebSocket connections.
type ChatHandler struct {
	userService service.UserService
	chatService service.ChatService
	hub         chat.HubInterface
}

// NewChatHandler creates a new ChatHandler.
func NewChatHandler(us service.UserService, cs service.ChatService, h chat.HubInterface) *ChatHandler {
	return &ChatHandler{userService: us, chatService: cs, hub: h}
}

// HandleWebSocketConnection upgrades HTTP connection to WebSocket and handles messages.
// @Summary      Establish WebSocket connection for chat
// @Description  Upgrades the HTTP connection to a WebSocket for real-time chat.
// @Tags         Chat
// @Produce      json
// @Success      101 "Switching Protocols"
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /ws/chat [get]
func (h *ChatHandler) HandleWebSocketConnection(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to set websocket upgrade: %v", err)
		respondError(c, http.StatusBadRequest, "Failed to set websocket upgrade")
		return
	}
	defer conn.Close()

	// Get username from context (set by auth middleware)
	username, exists := c.Get("user")
	if !exists {
		log.Println("User not found in context for websocket connection")
		return
	}

	log.Printf("WebSocket connection established for user: %s", username.(string))

	client := &chat.Client{Hub: h.hub, Conn: conn, Send: make(chan []byte, 256), Username: username.(string)}
	h.hub.Register() <- client

	// Handle room joining if room_id is provided in query param
	roomIDStr := c.Query("room_id")
	if roomIDStr != "" {
		// No room joining logic implemented yet.
		// If roomIDStr is not empty, it means a room ID was provided but not used.
		// log.Printf("Room ID provided but not used: %s", roomIDStr)
	}

	go client.WritePump()
	client.ReadPump()
}
