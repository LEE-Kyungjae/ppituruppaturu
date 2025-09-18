// backend/internal/service/chat_room_service.go
package service

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	ierrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
)

var (
	ErrChatRoomNotFound   = ierrors.ErrChatRoomNotFound
	ErrChatRoomExists     = ierrors.ErrChatRoomExists
	ErrRoomMemberNotFound = ierrors.ErrRoomMemberNotFound
	ErrRoomMemberExists   = ierrors.ErrRoomMemberExists
)

type ChatRoomService interface {
	// Room Management
	CreateChatRoom(name, description, roomType string, creatorUsername string) (*repository.ChatRoom, error)
	GetChatRoomByID(id uuid.UUID) (*repository.ChatRoom, error)
	GetChatRoomByName(name string) (*repository.ChatRoom, error)
	ListChatRooms(limit, offset int) ([]*repository.ChatRoom, error)
	UpdateChatRoom(roomID uuid.UUID, name, description, roomType string, updaterUsername string) (*repository.ChatRoom, error)
	DeleteChatRoom(roomID uuid.UUID, deleterUsername string) error

	// Member Management
	AddRoomMember(roomID uuid.UUID, memberUsername string, inviterUsername string) (*repository.RoomMember, error)
	RemoveRoomMember(roomID uuid.UUID, memberUsername string, removerUsername string) error
	IsRoomMember(roomID uuid.UUID, memberUsername string) (bool, error)
	ListRoomMembers(roomID uuid.UUID) ([]*repository.User, error)
	ListUserChatRooms(username string) ([]*repository.ChatRoom, error)
}

type chatRoomService struct {
	chatRoomRepo repository.ChatRoomRepository
	userRepo     repository.UserRepository
}

func NewChatRoomService(chatRoomRepo repository.ChatRoomRepository, userRepo repository.UserRepository) ChatRoomService {
	return &chatRoomService{
		chatRoomRepo: chatRoomRepo,
		userRepo:     userRepo,
	}
}

// Room Management
func (s *chatRoomService) CreateChatRoom(name, description, roomType string, creatorUsername string) (*repository.ChatRoom, error) {
	// Check if creator exists
	_, err := s.userRepo.Find(creatorUsername)
	if err != nil {
		return nil, fmt.Errorf("creator user not found: %w", ierrors.ErrUserNotFound)
	}

	// Check if room name already exists
	_, err = s.chatRoomRepo.GetChatRoomByName(name)
	if err == nil { // Room exists
		return nil, ierrors.ErrChatRoomExists
	}

	room, err := s.chatRoomRepo.CreateChatRoom(name, description, roomType)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat room: %w", err)
	}

	// Add creator as the first member
	_, err = s.chatRoomRepo.AddRoomMember(room.ID, creatorUsername)
	if err != nil {
		// Need to implement transaction rollback for room creation failure
		return nil, fmt.Errorf("failed to add creator to room: %w", err)
	}

	return room, nil
}

func (s *chatRoomService) GetChatRoomByID(id uuid.UUID) (*repository.ChatRoom, error) {
	room, err := s.chatRoomRepo.GetChatRoomByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat room by ID: %w", err)
	}
	return room, nil
}

func (s *chatRoomService) GetChatRoomByName(name string) (*repository.ChatRoom, error) {
	room, err := s.chatRoomRepo.GetChatRoomByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat room by name: %w", err)
	}
	return room, nil
}

func (s *chatRoomService) ListChatRooms(limit, offset int) ([]*repository.ChatRoom, error) {
	rooms, err := s.chatRoomRepo.ListChatRooms(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list chat rooms: %w", err)
	}
	return rooms, nil
}

func (s *chatRoomService) UpdateChatRoom(roomID uuid.UUID, name, description, roomType string, updaterUsername string) (*repository.ChatRoom, error) {
	room, err := s.chatRoomRepo.GetChatRoomByID(roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat room for update: %w", err)
	}

	// Only members can update room info (or admin)
	isMember, err := s.chatRoomRepo.IsRoomMember(roomID, updaterUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check room membership: %w", err)
	}
	if !isMember { // Or check if updater is admin
		return nil, fmt.Errorf("user is not a member of this room")
	}

	room.Name = name
	if description != "" {
		room.Description = &description
	} else {
		room.Description = nil
	}
	room.Type = roomType

	updatedRoom, err := s.chatRoomRepo.UpdateChatRoom(room)
	if err != nil {
		return nil, fmt.Errorf("failed to update chat room: %w", err)
	}
	return updatedRoom, nil
}

func (s *chatRoomService) DeleteChatRoom(roomID uuid.UUID, deleterUsername string) error {
	// Only creator or admin can delete
	// For now, let's assume only creator can delete
	_, err := s.chatRoomRepo.GetChatRoomByID(roomID)
	if err != nil {
		return fmt.Errorf("failed to get chat room for deletion: %w", err)
	}

	// This check assumes creator is the only member initially. More robust check needed.
	isMember, err := s.chatRoomRepo.IsRoomMember(roomID, deleterUsername)
	if err != nil {
		return fmt.Errorf("failed to check room membership: %w", err)
	}
	if !isMember { // Or check if deleter is admin
		return fmt.Errorf("user is not authorized to delete this room")
	}

	err = s.chatRoomRepo.DeleteChatRoom(roomID)
	if err != nil {
		return fmt.Errorf("failed to delete chat room: %w", err)
	}
	return nil
}

// Member Management
func (s *chatRoomService) AddRoomMember(roomID uuid.UUID, memberUsername string, inviterUsername string) (*repository.RoomMember, error) {
	// Check if inviter is a member of the room
	isInviterMember, err := s.chatRoomRepo.IsRoomMember(roomID, inviterUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check inviter membership: %w", err)
	}
	if !isInviterMember { // Or check if inviter is admin
		return nil, fmt.Errorf("inviter is not a member of this room")
	}

	// Check if member exists
	_, err = s.userRepo.Find(memberUsername)
	if err != nil {
		return nil, fmt.Errorf("member user not found: %w", ierrors.ErrUserNotFound)
	}

	// Check if member is already in the room
	isMember, err := s.chatRoomRepo.IsRoomMember(roomID, memberUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check member membership: %w", err)
	}
	if isMember {
		return nil, ierrors.ErrRoomMemberExists
	}

	member, err := s.chatRoomRepo.AddRoomMember(roomID, memberUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to add room member: %w", err)
	}
	return member, nil
}

func (s *chatRoomService) RemoveRoomMember(roomID uuid.UUID, memberUsername string, removerUsername string) error {
	// Only member themselves or admin can remove
	// For now, let's assume only member themselves or admin can remove
	isRemoverMember, err := s.chatRoomRepo.IsRoomMember(roomID, removerUsername)
	if err != nil {
		return fmt.Errorf("failed to check remover membership: %w", err)
	}
	if !isRemoverMember && removerUsername != memberUsername { // Or check if remover is admin
		return fmt.Errorf("user is not authorized to remove this member")
	}

	// Check if member exists in the room
	isMember, err := s.chatRoomRepo.IsRoomMember(roomID, memberUsername)
	if err != nil {
		return fmt.Errorf("failed to check member membership: %w", err)
	}
	if !isMember {
		return ierrors.ErrRoomMemberNotFound
	}

	err = s.chatRoomRepo.RemoveRoomMember(roomID, memberUsername)
	if err != nil {
		return fmt.Errorf("failed to remove room member: %w", err)
	}
	return nil
}

func (s *chatRoomService) IsRoomMember(roomID uuid.UUID, memberUsername string) (bool, error) {
	return s.chatRoomRepo.IsRoomMember(roomID, memberUsername)
}

func (s *chatRoomService) ListRoomMembers(roomID uuid.UUID) ([]*repository.User, error) {
	return s.chatRoomRepo.ListRoomMembers(roomID)
}

func (s *chatRoomService) ListUserChatRooms(username string) ([]*repository.ChatRoom, error) {
	return s.chatRoomRepo.ListUserChatRooms(username)
}