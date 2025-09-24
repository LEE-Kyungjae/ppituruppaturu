// backend/internal/handler/response.go

package handler

import (
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Response is a generic API response structure.
type Response struct {
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// CommentResponse is the API response structure for comments
type CommentResponse struct {
	ID             uuid.UUID  `json:"id"`
	PostID         uuid.UUID  `json:"post_id"`
	AuthorUsername string     `json:"author_username"`
	Content        string     `json:"content"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

// GameResponse is the API response structure for games
type GameResponse struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// GameSessionResponse is the API response structure for game sessions
type GameSessionResponse struct {
	ID           uuid.UUID  `json:"id"`
	GameID       uuid.UUID  `json:"game_id"`
	PlayerUsername string   `json:"player_username"`
	StartTime    time.Time  `json:"start_time"`
	EndTime      *time.Time `json:"end_time,omitempty"`
	Status       string     `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// GameResponseScore is the API response structure for game scores
type GameResponseScore struct {
	ID            uuid.UUID `json:"id"`
	SessionID     uuid.UUID `json:"session_id"`
	PlayerUsername string   `json:"player_username"`
	Score         int       `json:"score"`
	RecordedAt    time.Time `json:"recorded_at"`
}

// ItemResponse is the API response structure for items
type ItemResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	Type        string    `json:"type"`
	PriceCash   *int32    `json:"price_cash,omitempty"`
	PricePoints *int32    `json:"price_points,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UserInventoryResponse is the API response structure for user inventory
type UserInventoryResponse struct {
	ID            uuid.UUID  `json:"id"`
	UserUsername  string     `json:"user_username"`
	ItemID        uuid.UUID  `json:"item_id"`
	Quantity      int        `json:"quantity"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// TransactionResponse is the API response structure for transactions
type TransactionResponse struct {
	ID               uuid.UUID  `json:"id"`
	UserUsername     string     `json:"user_username"`
	ItemID           *uuid.UUID `json:"item_id,omitempty"`
	Amount           int32      `json:"amount"`
	Currency         string     `json:"currency"`
	Status           string     `json:"status"`
	PaymentGatewayID *string    `json:"payment_gateway_id,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// PointTransactionResponse is the API response structure for point transactions
type PointTransactionResponse struct {
	ID           uuid.UUID `json:"id"`
	UserUsername string    `json:"user_username"`
	Type         string    `json:"type"`
	Amount       int32     `json:"amount"`
	Description  *string   `json:"description,omitempty"`
	BalanceAfter *int32    `json:"balance_after,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// MessageResponse is the API response structure for messages
type MessageResponse struct {
	ID               uuid.UUID  `json:"id"`
	SenderUsername   string     `json:"sender_username"`
	ReceiverUsername *string    `json:"receiver_username,omitempty"`
	RoomID           *uuid.UUID `json:"room_id,omitempty"`
	Content          string     `json:"content"`
	CreatedAt        time.Time  `json:"created_at"`
	ReadAt           *time.Time `json:"read_at,omitempty"`
}

// PostResponse is the API response structure for posts
type PostResponse struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	AuthorUsername string    `json:"author_username"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ChatRoomResponse is the API response structure for chat rooms
type ChatRoomResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UserResponse is the API response structure for users
type UserResponse struct {
	Username          string     `json:"username"`
	Role              string     `json:"role"`
	Nickname          *string    `json:"nickname,omitempty"`
	ProfilePictureURL *string    `json:"profile_picture_url,omitempty"`
	StatusMessage     *string    `json:"status_message,omitempty"`
	LastOnlineAt      *time.Time `json:"last_online_at,omitempty"`
	IsActive          *bool      `json:"is_active,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// FriendRequestResponse is the API response structure for friend requests
type FriendRequestResponse struct {
	ID             uuid.UUID `json:"id"`
	SenderUsername   string    `json:"sender_username"`
	ReceiverUsername string    `json:"receiver_username"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// BlockedUserResponse is the API response structure for blocked users
type BlockedUserResponse struct {
	ID             uuid.UUID `json:"id"`
	BlockerUsername string    `json:"blocker_username"`
	BlockedUsername string    `json:"blocked_username"`
	CreatedAt      time.Time `json:"created_at"`
}

// RoomMemberResponse is the API response structure for room members
type RoomMemberResponse struct {
	RoomID        uuid.UUID `json:"room_id"`
	MemberUsername string    `json:"member_username"`
	JoinedAt      time.Time `json:"joined_at"`
}

// MaintenanceScheduleResponse is the API response structure for maintenance schedules
type MaintenanceScheduleResponse struct {
	ID        uuid.UUID `json:"id"`
	Start     time.Time `json:"start"`
	End       time.Time `json:"end"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// respondJSON makes the response with payload as json format
func respondJSON(c *gin.Context, status int, payload interface{}) {
	c.JSON(status, payload)
}

// respondError makes the error response with payload as json format
func respondError(c *gin.Context, code int, message string) {
	respondJSON(c, code, Response{Error: message})
}