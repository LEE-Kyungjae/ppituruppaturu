// backend/internal/repository/friend_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrFriendRequestNotFound = errors.New("friend request not found")
	ErrFriendRequestExists   = errors.New("friend request already exists")
	ErrFriendshipExists      = errors.New("friendship already exists")
	ErrUserBlocked           = errors.New("user is blocked")
)

type FriendRequest struct {
	ID             uuid.UUID
	SenderUsername string
	ReceiverUsername string
	Status         string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type Friend struct {
	ID           uuid.UUID
	UserUsername1 string
	UserUsername2 string
	CreatedAt    time.Time
}

type BlockedUser struct {
	ID             uuid.UUID
	BlockerUsername string
	BlockedUsername string
	CreatedAt      time.Time
}

type FriendRepository interface {
	CreateFriendRequest(sender, receiver string) (*FriendRequest, error)
	GetFriendRequest(id uuid.UUID) (*FriendRequest, error)
	GetPendingFriendRequest(sender, receiver string) (*FriendRequest, error)
	UpdateFriendRequestStatus(id uuid.UUID, status string) error
	DeleteFriendRequest(id uuid.UUID) error
	CreateFriendship(user1, user2 string) (*Friend, error)
	DeleteFriendship(user1, user2 string) error
	IsFriends(user1, user2 string) (bool, error)
	BlockUser(blocker, blocked string) (*BlockedUser, error)
	UnblockUser(blocker, blocked string) error
	IsBlocked(blocker, blocked string) (bool, error)
	ListFriends(username string) ([]*User, error)
	ListIncomingFriendRequests(username string) ([]*FriendRequest, error)
	ListOutgoingFriendRequests(username string) ([]*FriendRequest, error)
	ListBlockedUsers(username string) ([]*BlockedUser, error)
}

type postgresFriendRepository struct {
	db DBTX
}

func NewPostgresFriendRepository(db DBTX) FriendRepository {
	return &postgresFriendRepository{db: db}
}

func (r *postgresFriendRepository) CreateFriendRequest(sender, receiver string) (*FriendRequest, error) {
	// Check if already friends
	isFriends, err := r.IsFriends(sender, receiver)
	if err != nil {
		return nil, fmt.Errorf("failed to check friendship status: %w", err)
	}
	if isFriends {
		return nil, ErrFriendshipExists
	}

	// Check if request already exists
	_, err = r.GetPendingFriendRequest(sender, receiver)
	if err == nil {
		return nil, ErrFriendRequestExists
	}

	// Check if sender is blocked by receiver
	isBlocked, err := r.IsBlocked(receiver, sender)
	if err != nil {
		return nil, fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return nil, ErrUserBlocked
	}

	query := `INSERT INTO friend_requests (sender_username, receiver_username) VALUES ($1, $2) RETURNING id, sender_username, receiver_username, status, created_at, updated_at`
	var fr FriendRequest
	err = r.db.QueryRow(query, sender, receiver).Scan(&fr.ID, &fr.SenderUsername, &fr.ReceiverUsername, &fr.Status, &fr.CreatedAt, &fr.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create friend request: %w", err)
	}
	return &fr, nil
}

func (r *postgresFriendRepository) GetFriendRequest(id uuid.UUID) (*FriendRequest, error) {
	query := `SELECT id, sender_username, receiver_username, status, created_at, updated_at FROM friend_requests WHERE id = $1`
	var fr FriendRequest
	err := r.db.QueryRow(query, id).Scan(&fr.ID, &fr.SenderUsername, &fr.ReceiverUsername, &fr.Status, &fr.CreatedAt, &fr.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFriendRequestNotFound
		}
		return nil, fmt.Errorf("failed to get friend request: %w", err)
	}
	return &fr, nil
}

func (r *postgresFriendRepository) GetPendingFriendRequest(sender, receiver string) (*FriendRequest, error) {
	query := `SELECT id, sender_username, receiver_username, status, created_at, updated_at FROM friend_requests WHERE sender_username = $1 AND receiver_username = $2 AND status = 'pending'`
	var fr FriendRequest
	err := r.db.QueryRow(query, sender, receiver).Scan(&fr.ID, &fr.SenderUsername, &fr.ReceiverUsername, &fr.Status, &fr.CreatedAt, &fr.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFriendRequestNotFound
		}
		return nil, fmt.Errorf("failed to get pending friend request: %w", err)
	}
	return &fr, nil
}

func (r *postgresFriendRepository) UpdateFriendRequestStatus(id uuid.UUID, status string) error {
	query := `UPDATE friend_requests SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update friend request status: %w", err)
	}
	return nil
}

func (r *postgresFriendRepository) DeleteFriendRequest(id uuid.UUID) error {
	query := `DELETE FROM friend_requests WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete friend request: %w", err)
	}
	return nil
}

func (r *postgresFriendRepository) CreateFriendship(user1, user2 string) (*Friend, error) {
	// Ensure consistent order for unique constraint
	if user1 > user2 {
		user1, user2 = user2, user1
	}

	query := `INSERT INTO friends (user_username_1, user_username_2) VALUES ($1, $2) RETURNING id, user_username_1, user_username_2, created_at`
	var f Friend
	err := r.db.QueryRow(query, user1, user2).Scan(&f.ID, &f.UserUsername1, &f.UserUsername2, &f.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create friendship: %w", err)
	}
	return &f, nil
}

func (r *postgresFriendRepository) DeleteFriendship(user1, user2 string) error {
	// Ensure consistent order for deletion
	if user1 > user2 {
		user1, user2 = user2, user1
	}
	query := `DELETE FROM friends WHERE user_username_1 = $1 AND user_username_2 = $2`
	_, err := r.db.Exec(query, user1, user2)
	if err != nil {
		return fmt.Errorf("failed to delete friendship: %w", err)
	}
	return nil
}

func (r *postgresFriendRepository) IsFriends(user1, user2 string) (bool, error) {
	// Ensure consistent order for lookup
	if user1 > user2 {
		user1, user2 = user2, user1
	}
	query := `SELECT COUNT(*) FROM friends WHERE user_username_1 = $1 AND user_username_2 = $2`
	var count int
	err := r.db.QueryRow(query, user1, user2).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check friendship: %w", err)
	}
	return count > 0, nil
}

func (r *postgresFriendRepository) BlockUser(blocker, blocked string) (*BlockedUser, error) {
	query := `INSERT INTO blocked_users (blocker_username, blocked_username) VALUES ($1, $2) RETURNING id, blocker_username, blocked_username, created_at`
	var bu BlockedUser
	err := r.db.QueryRow(query, blocker, blocked).Scan(&bu.ID, &bu.BlockerUsername, &bu.BlockedUsername, &bu.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to block user: %w", err)
	}
	return &bu, nil
}

func (r *postgresFriendRepository) UnblockUser(blocker, blocked string) error {
	query := `DELETE FROM blocked_users WHERE blocker_username = $1 AND blocked_username = $2`
	_, err := r.db.Exec(query, blocker, blocked)
	if err != nil {
		return fmt.Errorf("failed to unblock user: %w", err)
	}
	return nil
}

func (r *postgresFriendRepository) IsBlocked(blocker, blocked string) (bool, error) {
	query := `SELECT COUNT(*) FROM blocked_users WHERE blocker_username = $1 AND blocked_username = $2`
	var count int
	err := r.db.QueryRow(query, blocker, blocked).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check block status: %w", err)
	}
	return count > 0, nil
}

func (r *postgresFriendRepository) ListFriends(username string) ([]*User, error) {
	query := `
		SELECT u.username, u.password_hash, u.role, u.nickname, u.profile_picture_url, u.status_message, u.last_online_at, u.is_active, u.deleted_at
		FROM users u
		JOIN friends f ON (u.username = f.user_username_1 AND f.user_username_2 = $1) OR (u.username = f.user_username_2 AND f.user_username_1 = $1)
		WHERE u.username != $1
	`
	rows, err := r.db.Query(query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to list friends: %w", err)
	}
	defer rows.Close()

	var friends []*User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.Username, &user.PasswordHash, &user.Role, &user.Nickname, &user.ProfilePictureURL, &user.StatusMessage, &user.LastOnlineAt, &user.IsActive, &user.DeletedAt); err != nil {
			return nil, fmt.Errorf("failed to scan friend row: %w", err)
		}
		friends = append(friends, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during friend list iteration: %w", err)
	}

	return friends, nil
}

func (r *postgresFriendRepository) ListIncomingFriendRequests(username string) ([]*FriendRequest, error) {
	query := `SELECT id, sender_username, receiver_username, status, created_at, updated_at FROM friend_requests WHERE receiver_username = $1 AND status = 'pending'`
	rows, err := r.db.Query(query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to list incoming friend requests: %w", err)
	}
	defer rows.Close()

	var requests []*FriendRequest
	for rows.Next() {
		var fr FriendRequest
		if err := rows.Scan(&fr.ID, &fr.SenderUsername, &fr.ReceiverUsername, &fr.Status, &fr.CreatedAt, &fr.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan incoming friend request row: %w", err)
		}
		requests = append(requests, &fr)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during incoming friend request list iteration: %w", err)
	}

	return requests, nil
}

func (r *postgresFriendRepository) ListOutgoingFriendRequests(username string) ([]*FriendRequest, error) {
	query := `SELECT id, sender_username, receiver_username, status, created_at, updated_at FROM friend_requests WHERE sender_username = $1 AND status = 'pending'`
	rows, err := r.db.Query(query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to list outgoing friend requests: %w", err)
	}
	defer rows.Close()

	var requests []*FriendRequest
	for rows.Next() {
		var fr FriendRequest
		if err := rows.Scan(&fr.ID, &fr.SenderUsername, &fr.ReceiverUsername, &fr.Status, &fr.CreatedAt, &fr.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan outgoing friend request row: %w", err)
		}
		requests = append(requests, &fr)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during outgoing friend request list iteration: %w", err)
	}

	return requests, nil
}

func (r *postgresFriendRepository) ListBlockedUsers(username string) ([]*BlockedUser, error) {
	query := `SELECT id, blocker_username, blocked_username, created_at FROM blocked_users WHERE blocker_username = $1`
	rows, err := r.db.Query(query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to list blocked users: %w", err)
	}
	defer rows.Close()

	var blockedUsers []*BlockedUser
	for rows.Next() {
		var bu BlockedUser
		if err := rows.Scan(&bu.ID, &bu.BlockerUsername, &bu.BlockedUsername, &bu.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan blocked user row: %w", err)
		}
		blockedUsers = append(blockedUsers, &bu)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during blocked user list iteration: %w", err)
	}

	return blockedUsers, nil
}
