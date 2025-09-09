// backend/internal/chat/message.go

package chat

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// MessageType defines the type of message being sent.
type MessageType string

const (
	MessageTypeChat MessageType = "chat"
	MessageTypeSystem MessageType = "system"
	MessageTypeGame MessageType = "game"
)

// Message represents a message sent over WebSocket.
type Message struct {
	Type    MessageType `json:"type"`
	Sender  string      `json:"sender"`
	Receiver sql.NullString `json:"receiver,omitempty"` // For 1:1 chat
	RoomID  sql.Null[uuid.UUID] `json:"room_id,omitempty"` // For room chat
	Content string      `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	// Add other fields like GroupID for group chat, etc.
}