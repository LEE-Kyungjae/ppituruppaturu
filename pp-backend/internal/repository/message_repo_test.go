// backend/internal/repository/message_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"exit/internal/repository"
)

func withMessageRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.MessageRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresMessageRepository(tx)

	testFunc(repo)
}

func TestMessageRepository_CreateMessage(t *testing.T) {
	withMessageRepo(t, testDB, func(repo repository.MessageRepository) {
		// Setup: Create users
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("sender_msg", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("receiver_msg", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		msg, err := repo.CreateMessage(
			"sender_msg",
			sql.NullString{String: "receiver_msg", Valid: true},
			sql.Null[uuid.UUID]{},
			"Hello, world!",
		)
		require.NoError(t, err)
		assert.NotNil(t, msg)
		assert.Equal(t, "sender_msg", msg.SenderUsername)
		assert.Equal(t, "receiver_msg", msg.ReceiverUsername.String)
		assert.True(t, msg.ReceiverUsername.Valid)
		assert.Equal(t, "Hello, world!", msg.Content)
		assert.False(t, msg.ReadAt.Valid)
	})
}

func TestMessageRepository_GetMessagesBetweenUsers(t *testing.T) {
	withMessageRepo(t, testDB, func(repo repository.MessageRepository) {
		// Setup: Create users
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("userA_msg", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("userB_msg", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Create messages
		_, err = repo.CreateMessage("userA_msg", sql.NullString{String: "userB_msg", Valid: true}, sql.Null[uuid.UUID]{}, "Msg 1 from A to B")
		require.NoError(t, err)
		time.Sleep(1 * time.Millisecond) // Ensure different timestamps
		_, err = repo.CreateMessage("userB_msg", sql.NullString{String: "userA_msg", Valid: true}, sql.Null[uuid.UUID]{}, "Msg 2 from B to A")
		require.NoError(t, err)
		time.Sleep(1 * time.Millisecond)
		_, err = repo.CreateMessage("userA_msg", sql.NullString{String: "userB_msg", Valid: true}, sql.Null[uuid.UUID]{}, "Msg 3 from A to B")
		require.NoError(t, err)

		// Test success: Get all messages
		messages, err := repo.GetMessagesBetweenUsers("userA_msg", "userB_msg", 10, 0)
		require.NoError(t, err)
		assert.Len(t, messages, 3)
		assert.Equal(t, "Msg 3 from A to B", messages[0].Content) // Ordered by sent_at DESC

		// Test pagination
		paginatedMessages, err := repo.GetMessagesBetweenUsers("userA_msg", "userB_msg", 1, 1)
		require.NoError(t, err)
		assert.Len(t, paginatedMessages, 1)
		assert.Equal(t, "Msg 2 from B to A", paginatedMessages[0].Content)
	})
}

func TestMessageRepository_MarkMessagesAsRead(t *testing.T) {
	withMessageRepo(t, testDB, func(repo repository.MessageRepository) {
		// Setup: Create users
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("reader_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("writer_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Create unread messages
		_, err = repo.CreateMessage("writer_user", sql.NullString{String: "reader_user", Valid: true}, sql.Null[uuid.UUID]{}, "Unread Msg 1")
		require.NoError(t, err)
		_, err = repo.CreateMessage("writer_user", sql.NullString{String: "reader_user", Valid: true}, sql.Null[uuid.UUID]{}, "Unread Msg 2")
		require.NoError(t, err)
		// Create a message from reader to writer (should not be marked as read)
		_, err = repo.CreateMessage("reader_user", sql.NullString{String: "writer_user", Valid: true}, sql.Null[uuid.UUID]{}, "Sent Msg")
		require.NoError(t, err)

		// Test success
		err = repo.MarkMessagesAsRead(
			sql.NullString{String: "writer_user", Valid: true},
			sql.NullString{String: "reader_user", Valid: true},
			sql.Null[uuid.UUID]{},
		)
		require.NoError(t, err)

		// Verify messages are marked as read
		messages, err := repo.GetMessagesBetweenUsers("reader_user", "writer_user", 10, 0)
		require.NoError(t, err)
		assert.Len(t, messages, 3)

		for _, msg := range messages {
			if msg.SenderUsername == "writer_user" && msg.ReceiverUsername.Valid && msg.ReceiverUsername.String == "reader_user" {
				assert.True(t, msg.ReadAt.Valid)
			} else {
				assert.False(t, msg.ReadAt.Valid)
			}
		}
	})
}
