// backend/internal/repository/chat_room_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrChatRoomNotFound = errors.New("chat room not found")
	ErrChatRoomExists   = errors.New("chat room already exists")
	ErrRoomMemberNotFound = errors.New("room member not found")
	ErrRoomMemberExists   = errors.New("room member already exists")
)

type ChatRoom struct {
	ID          uuid.UUID
	Name        string
	Description *string
	Type        string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type RoomMember struct {
	RoomID        uuid.UUID
	MemberUsername string
	JoinedAt      time.Time
}

type ChatRoomRepository interface {
	CreateChatRoom(name, description, roomType string) (*ChatRoom, error)
	GetChatRoomByID(id uuid.UUID) (*ChatRoom, error)
	GetChatRoomByName(name string) (*ChatRoom, error)
	ListChatRooms(limit, offset int) ([]*ChatRoom, error)
	UpdateChatRoom(room *ChatRoom) (*ChatRoom, error)
	DeleteChatRoom(id uuid.UUID) error

	AddRoomMember(roomID uuid.UUID, memberUsername string) (*RoomMember, error)
	RemoveRoomMember(roomID uuid.UUID, memberUsername string) error
	IsRoomMember(roomID uuid.UUID, memberUsername string) (bool, error)
	ListRoomMembers(roomID uuid.UUID) ([]*User, error)
	ListUserChatRooms(username string) ([]*ChatRoom, error)
}

type postgresChatRoomRepository struct {
	db DBTX
}

func NewPostgresChatRoomRepository(db DBTX) ChatRoomRepository {
	return &postgresChatRoomRepository{db: db}
}

func (r *postgresChatRoomRepository) CreateChatRoom(name, description, roomType string) (*ChatRoom, error) {
	query := `INSERT INTO chat_rooms (name, description, type) VALUES ($1, $2, $3) RETURNING id, name, description, type, created_at, updated_at`
	var room ChatRoom
	err := r.db.QueryRow(query, name, description, roomType).Scan(&room.ID, &room.Name, &room.Description, &room.Type, &room.CreatedAt, &room.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat room: %w", err)
	}
	return &room, nil
}

func (r *postgresChatRoomRepository) GetChatRoomByID(id uuid.UUID) (*ChatRoom, error) {
	query := `SELECT id, name, description, type, created_at, updated_at FROM chat_rooms WHERE id = $1`
	var room ChatRoom
	err := r.db.QueryRow(query, id).Scan(&room.ID, &room.Name, &room.Description, &room.Type, &room.CreatedAt, &room.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChatRoomNotFound
		}
		return nil, fmt.Errorf("failed to get chat room by ID: %w", err)
	}
	return &room, nil
}

func (r *postgresChatRoomRepository) GetChatRoomByName(name string) (*ChatRoom, error) {
	query := `SELECT id, name, description, type, created_at, updated_at FROM chat_rooms WHERE name = $1`
	var room ChatRoom
	err := r.db.QueryRow(query, name).Scan(&room.ID, &room.Name, &room.Description, &room.Type, &room.CreatedAt, &room.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChatRoomNotFound
		}
		return nil, fmt.Errorf("failed to get chat room by name: %w", err)
	}
	return &room, nil
}

func (r *postgresChatRoomRepository) ListChatRooms(limit, offset int) ([]*ChatRoom, error) {
	query := `SELECT id, name, description, type, created_at, updated_at FROM chat_rooms ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list chat rooms: %w", err)
	}
	defer rows.Close()

	var rooms []*ChatRoom
	for rows.Next() {
		var room ChatRoom
		if err := rows.Scan(&room.ID, &room.Name, &room.Description, &room.Type, &room.CreatedAt, &room.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan chat room row: %w", err)
		}
		rooms = append(rooms, &room)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during chat room list iteration: %w", err)
	}

	return rooms, nil
}

func (r *postgresChatRoomRepository) UpdateChatRoom(room *ChatRoom) (*ChatRoom, error) {
	query := `UPDATE chat_rooms SET name = $1, description = $2, type = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, type, created_at, updated_at`
	var updatedRoom ChatRoom
	err := r.db.QueryRow(query, room.Name, room.Description, room.Type, room.ID).Scan(&updatedRoom.ID, &updatedRoom.Name, &updatedRoom.Description, &updatedRoom.Type, &updatedRoom.CreatedAt, &updatedRoom.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChatRoomNotFound
		}
		return nil, fmt.Errorf("failed to update chat room: %w", err)
	}
	return &updatedRoom, nil
}

func (r *postgresChatRoomRepository) DeleteChatRoom(id uuid.UUID) error {
	query := `DELETE FROM chat_rooms WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete chat room: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrChatRoomNotFound
	}
	return nil
}

func (r *postgresChatRoomRepository) AddRoomMember(roomID uuid.UUID, memberUsername string) (*RoomMember, error) {
	query := `INSERT INTO room_members (room_id, member_username) VALUES ($1, $2) RETURNING room_id, member_username, joined_at`
	var member RoomMember
	err := r.db.QueryRow(query, roomID, memberUsername).Scan(&member.RoomID, &member.MemberUsername, &member.JoinedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to add room member: %w", err)
	}
	return &member, nil
}

func (r *postgresChatRoomRepository) RemoveRoomMember(roomID uuid.UUID, memberUsername string) error {
	query := `DELETE FROM room_members WHERE room_id = $1 AND member_username = $2`
	result, err := r.db.Exec(query, roomID, memberUsername)
	if err != nil {
		return fmt.Errorf("failed to remove room member: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrRoomMemberNotFound
	}
	return nil
}

func (r *postgresChatRoomRepository) IsRoomMember(roomID uuid.UUID, memberUsername string) (bool, error) {
	query := `SELECT COUNT(*) FROM room_members WHERE room_id = $1 AND member_username = $2`
	var count int
	err := r.db.QueryRow(query, roomID, memberUsername).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check if user is room member: %w", err)
	}
	return count > 0, nil
}

func (r *postgresChatRoomRepository) ListRoomMembers(roomID uuid.UUID) ([]*User, error) {
	query := `
		SELECT u.username, u.password_hash, u.role, u.nickname, u.profile_picture_url, u.status_message, u.last_online_at, u.is_active, u.deleted_at
		FROM users u
		JOIN room_members rm ON u.username = rm.member_username
		WHERE rm.room_id = $1
	`
	rows, err := r.db.Query(query, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to list room members: %w", err)
	}
	defer rows.Close()

	var members []*User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.Username, &user.PasswordHash, &user.Role, &user.Nickname, &user.ProfilePictureURL, &user.StatusMessage, &user.LastOnlineAt, &user.IsActive, &user.DeletedAt); err != nil {
			return nil, fmt.Errorf("failed to scan room member row: %w", err)
		}
		members = append(members, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during room member list iteration: %w", err)
	}

	return members, nil
}

func (r *postgresChatRoomRepository) ListUserChatRooms(username string) ([]*ChatRoom, error) {
	query := `
		SELECT cr.id, cr.name, cr.description, cr.type, cr.created_at, cr.updated_at
		FROM chat_rooms cr
		JOIN room_members rm ON cr.id = rm.room_id
		WHERE rm.member_username = $1
		ORDER BY cr.updated_at DESC
	`
	rows, err := r.db.Query(query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to list user chat rooms: %w", err)
	}
	defer rows.Close()

	var rooms []*ChatRoom
	for rows.Next() {
		var room ChatRoom
		if err := rows.Scan(&room.ID, &room.Name, &room.Description, &room.Type, &room.CreatedAt, &room.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan chat room row: %w", err)
		}
		rooms = append(rooms, &room)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during user chat room list iteration: %w", err)
	}

	return rooms, nil
}
