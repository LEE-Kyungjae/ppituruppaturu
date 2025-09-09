// backend/internal/repository/message_repo.go

package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID             uuid.UUID
	SenderUsername string
	ReceiverUsername sql.NullString
	RoomID         sql.Null[uuid.UUID]
	Content        string
	SentAt         time.Time
	ReadAt         sql.NullTime
}

type MessageRepository interface {
	CreateMessage(sender string, receiver sql.NullString, roomID sql.Null[uuid.UUID], content string) (*Message, error)
	GetMessagesBetweenUsers(user1, user2 string, limit, offset int) ([]*Message, error)
	GetRoomMessages(roomID uuid.UUID, limit, offset int) ([]*Message, error)
	MarkMessagesAsRead(sender sql.NullString, receiver sql.NullString, roomID sql.Null[uuid.UUID]) error
}

type postgresMessageRepository struct {
	db DBTX
}

func NewPostgresMessageRepository(db DBTX) MessageRepository {
	return &postgresMessageRepository{db: db}
}

func (r *postgresMessageRepository) CreateMessage(sender string, receiver sql.NullString, roomID sql.Null[uuid.UUID], content string) (*Message, error) {
	query := `INSERT INTO messages (sender_username, receiver_username, room_id, content) VALUES ($1, $2, $3, $4) RETURNING id, sender_username, receiver_username, room_id, content, sent_at, read_at`
	var msg Message
	err := r.db.QueryRow(query, sender, receiver, roomID, content).Scan(&msg.ID, &msg.SenderUsername, &msg.ReceiverUsername, &msg.RoomID, &msg.Content, &msg.SentAt, &msg.ReadAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}
	return &msg, nil
}

func (r *postgresMessageRepository) GetMessagesBetweenUsers(user1, user2 string, limit, offset int) ([]*Message, error) {
	query := `
		SELECT id, sender_username, receiver_username, room_id, content, sent_at, read_at
		FROM messages
		WHERE (sender_username = $1 AND receiver_username = $2 AND room_id IS NULL) OR (sender_username = $2 AND receiver_username = $1 AND room_id IS NULL)
		ORDER BY sent_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := r.db.Query(query, user1, user2, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.SenderUsername, &msg.ReceiverUsername, &msg.RoomID, &msg.Content, &msg.SentAt, &msg.ReadAt); err != nil {
			return nil, fmt.Errorf("failed to scan message row: %w", err)
		}
		messages = append(messages, &msg)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during message list iteration: %w", err)
	}

	return messages, nil
}

func (r *postgresMessageRepository) GetRoomMessages(roomID uuid.UUID, limit, offset int) ([]*Message, error) {
	query := `
		SELECT id, sender_username, receiver_username, room_id, content, sent_at, read_at
		FROM messages
		WHERE room_id = $1
		ORDER BY sent_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(query, roomID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get room messages: %w", err)
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.SenderUsername, &msg.ReceiverUsername, &msg.RoomID, &msg.Content, &msg.SentAt, &msg.ReadAt); err != nil {
			return nil, fmt.Errorf("failed to scan message row: %w", err)
		}
		messages = append(messages, &msg)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during room message list iteration: %w", err)
	}

	return messages, nil
}

func (r *postgresMessageRepository) MarkMessagesAsRead(sender sql.NullString, receiver sql.NullString, roomID sql.Null[uuid.UUID]) error {
	query := `UPDATE messages SET read_at = NOW() WHERE sender_username = $1 AND receiver_username = $2 AND room_id = $3 AND read_at IS NULL`
	_, err := r.db.Exec(query, sender, receiver, roomID)
	if err != nil {
		return fmt.Errorf("failed to mark messages as read: %w", err)
	}
	return nil
}