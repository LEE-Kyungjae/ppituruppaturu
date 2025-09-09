// backend/internal/service/chat_service.go

package service

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"exit/internal/chat"
	"exit/internal/repository"
	serviceErrors "exit/internal/service/errors"
)

type ChatService interface {
	SendMessage(senderUsername, receiverUsername, content string) (*repository.Message, error)
	SendRoomMessage(senderUsername string, roomID uuid.UUID, content string) (*repository.Message, error)
	GetMessageHistory(user1Username, user2Username string, limit, offset int) ([]*repository.Message, error)
	GetRoomMessageHistory(roomID uuid.UUID, limit, offset int) ([]*repository.Message, error)
	MarkMessagesAsRead(senderUsername, receiverUsername string) error
	MarkRoomMessagesAsRead(roomID uuid.UUID, readerUsername string) error
	GetUserOnlineStatus(username string) bool

	// Internal methods for Hub to call
	BroadcastMessage(senderUsername, receiverUsername, content string)
	BroadcastRoomMessage(senderUsername string, roomID uuid.UUID, content string)
}

type chatService struct {
	messageRepo repository.MessageRepository
	userRepo    repository.UserRepository
	chatRoomRepo repository.ChatRoomRepository
	hub         chat.HubInterface
}

func NewChatService(messageRepo repository.MessageRepository, userRepo repository.UserRepository, chatRoomRepo repository.ChatRoomRepository, hub chat.HubInterface) ChatService {
	return &chatService{
		messageRepo: messageRepo,
		userRepo:    userRepo,
		chatRoomRepo: chatRoomRepo,
		hub:         hub,
	}
}

func (s *chatService) SendMessage(senderUsername, receiverUsername, content string) (*repository.Message, error) {
	// Basic validation: check if receiver exists
	_, err := s.userRepo.Find(receiverUsername)
	if err != nil {
		return nil, fmt.Errorf("receiver user not found: %w", serviceErrors.ErrUserNotFound)
	}

	msg, err := s.messageRepo.CreateMessage(senderUsername, sql.NullString{String: receiverUsername, Valid: true}, sql.Null[uuid.UUID]{}, content)
	if err != nil {
		return nil, fmt.Errorf("failed to send message: %w", err)
	}

	// Broadcast the message through the hub
	s.BroadcastMessage(senderUsername, receiverUsername, content)

	return msg, nil
}

func (s *chatService) SendRoomMessage(senderUsername string, roomID uuid.UUID, content string) (*repository.Message, error) {
	// Check if room exists
	_, err := s.chatRoomRepo.GetChatRoomByID(roomID)
	if err != nil {
		return nil, fmt.Errorf("chat room not found: %w", serviceErrors.ErrChatRoomNotFound)
	}

	// Check if sender is a member of the room
	isMember, err := s.chatRoomRepo.IsRoomMember(roomID, senderUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check room membership: %w", err)
	}
	if !isMember {
		return nil, fmt.Errorf("sender is not a member of this room")
	}

	msg, err := s.messageRepo.CreateMessage(senderUsername, sql.NullString{}, sql.Null[uuid.UUID]{V: roomID, Valid: true}, content)
	if err != nil {
		return nil, fmt.Errorf("failed to send room message: %w", err)
	}

	// Broadcast the message through the hub
	s.BroadcastRoomMessage(senderUsername, roomID, content)

	return msg, nil
}

func (s *chatService) GetMessageHistory(user1Username, user2Username string, limit, offset int) ([]*repository.Message, error) {
	// Basic validation: check if both users exist
	_, err := s.userRepo.Find(user1Username)
	if err != nil {
		return nil, fmt.Errorf("user %s not found: %w", user1Username, serviceErrors.ErrUserNotFound)
	}
	_, err = s.userRepo.Find(user2Username)
	if err != nil {
		return nil, fmt.Errorf("user %s not found: %w", user2Username, serviceErrors.ErrUserNotFound)
	}

	history, err := s.messageRepo.GetMessagesBetweenUsers(user1Username, user2Username, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get message history: %w", err)
	}
	return history, nil
}

func (s *chatService) GetRoomMessageHistory(roomID uuid.UUID, limit, offset int) ([]*repository.Message, error) {
	// Check if room exists
	_, err := s.chatRoomRepo.GetChatRoomByID(roomID)
	if err != nil {
		return nil, fmt.Errorf("chat room not found: %w", serviceErrors.ErrChatRoomNotFound)
	}

	history, err := s.messageRepo.GetRoomMessages(roomID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get room message history: %w", err)
	}
	return history, nil
}

func (s *chatService) MarkMessagesAsRead(senderUsername, receiverUsername string) error {
	return s.messageRepo.MarkMessagesAsRead(sql.NullString{String: senderUsername, Valid: true}, sql.NullString{String: receiverUsername, Valid: true}, sql.Null[uuid.UUID]{})
}

func (s *chatService) MarkRoomMessagesAsRead(roomID uuid.UUID, readerUsername string) error {
	return s.messageRepo.MarkMessagesAsRead(sql.NullString{}, sql.NullString{}, sql.Null[uuid.UUID]{V: roomID, Valid: true})
}

func (s *chatService) GetUserOnlineStatus(username string) bool {
	return s.hub.GetClientOnlineStatus(username)
}

func (s *chatService) BroadcastMessage(senderUsername, receiverUsername, content string) {
	// Format the message for broadcasting
	msg := &chat.Message{
		Type: chat.MessageTypeChat,
		Sender: senderUsername,
		Receiver: sql.NullString{String: receiverUsername, Valid: true},
		Content: content,
		Timestamp: time.Now(),
	}

	// Send private message if receiver is specified
	if receiverUsername != "" {
		s.hub.SendPrivateMessage(msg)
	}
}

func (s *chatService) BroadcastRoomMessage(senderUsername string, roomID uuid.UUID, content string) {
	// Format the message for broadcasting
	msg := &chat.Message{
		Type: chat.MessageTypeChat,
		Sender: senderUsername,
		RoomID: sql.Null[uuid.UUID]{V: roomID, Valid: true},
		Content: content,
		Timestamp: time.Now(),
	}

	// Send room message
	s.hub.SendRoomMessage(roomID, msg)
}