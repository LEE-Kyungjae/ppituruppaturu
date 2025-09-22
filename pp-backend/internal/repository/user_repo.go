package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserAlreadyExists  = errors.New("user already exists")
)

// User represents a user in the system.
type User struct {
	Username          string
	PasswordHash      string
	Role              string
	Nickname          *string
	ProfilePictureURL *string
	StatusMessage     *string
	LastOnlineAt      *time.Time
	IsActive          *bool
	DeletedAt         *time.Time
	BannedAt          *time.Time
	KakaoID           *string
	Points            int
}

// UserRepository defines the interface for user data storage.
type UserRepository interface {
	Find(username string) (*User, error)
	ValidatePassword(user *User, password string) error
	Create(username, password, role string, bcryptCost int, kakaoID sql.NullString) (*User, error)
	Delete(username string) error
	Update(user *User) (*User, error)
	List() ([]*User, error)
	UpdatePasswordHash(username, newPasswordHash string) error
	DeactivateUser(username string) error
	DeleteUser(username string) error
	CountTotalUsers() (int, error)
	CountActiveUsers(since time.Time) (int, error)
	CountNewUsers(since time.Time) (int, error)
	BanUser(username string) error
}

// --- PostgreSQL Implementation ---

type postgresUserRepository struct {
	db DBTX
}

// NewPostgresUserRepository creates a new PostgreSQL-backed user repository.
func NewPostgresUserRepository(db DBTX) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) Find(username string) (*User, error) {
	query := "SELECT username, password_hash, role, nickname, profile_picture_url, status_message, last_online_at, is_active, deleted_at, kakao_id FROM users WHERE username = $1"
	row := r.db.QueryRow(query, username)

	var user User
	if err := row.Scan(&user.Username, &user.PasswordHash, &user.Role, &user.Nickname, &user.ProfilePictureURL, &user.StatusMessage, &user.LastOnlineAt, &user.IsActive, &user.DeletedAt, &user.KakaoID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return &user, nil
}

func (r *postgresUserRepository) ValidatePassword(user *User, password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return fmt.Errorf("password validation failed: %w", ErrInvalidCredentials)
	}
	return nil
}

func (r *postgresUserRepository) Create(username, password, role string, bcryptCost int, kakaoID sql.NullString) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	query := "INSERT INTO users (username, password_hash, role, kakao_id) VALUES ($1, $2, $3, $4) RETURNING nickname, profile_picture_url, status_message, last_online_at, is_active, deleted_at, kakao_id"
	row := r.db.QueryRow(query, username, string(hashedPassword), role, kakaoID)

	var user User
	if err := row.Scan(&user.Nickname, &user.ProfilePictureURL, &user.StatusMessage, &user.LastOnlineAt, &user.IsActive, &user.DeletedAt, &user.KakaoID); err != nil {
		return nil, fmt.Errorf("failed to scan user after creation: %w", err)
	}

	user.Username = username
	user.PasswordHash = string(hashedPassword)
	user.Role = role
	return &user, nil
}

func (r *postgresUserRepository) Delete(username string) error {
	query := "DELETE FROM users WHERE username = $1"
	result, err := r.db.Exec(query, username)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *postgresUserRepository) Update(user *User) (*User, error) {
	query := `
		UPDATE users
		SET role = $1, nickname = $2, profile_picture_url = $3, status_message = $4, updated_at = NOW()
		WHERE username = $5
		RETURNING nickname, profile_picture_url, status_message, last_online_at, is_active, deleted_at
	`
	row := r.db.QueryRow(query, user.Role, user.Nickname, user.ProfilePictureURL, user.StatusMessage, user.Username)

	var updatedUser User
	if err := row.Scan(&updatedUser.Nickname, &updatedUser.ProfilePictureURL, &updatedUser.StatusMessage, &updatedUser.LastOnlineAt, &updatedUser.IsActive, &updatedUser.DeletedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to scan updated user: %w", err)
	}

	updatedUser.Username = user.Username
	updatedUser.PasswordHash = user.PasswordHash // Password hash is not updated here
	updatedUser.Role = user.Role

	return &updatedUser, nil
}

func (r *postgresUserRepository) List() ([]*User, error) {
	query := "SELECT username, password_hash, role, nickname, profile_picture_url, status_message, last_online_at, is_active, deleted_at FROM users ORDER BY created_at DESC"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.Username, &user.PasswordHash, &user.Role, &user.Nickname, &user.ProfilePictureURL, &user.StatusMessage, &user.LastOnlineAt, &user.IsActive, &user.DeletedAt); err != nil {
			return nil, fmt.Errorf("failed to scan user row: %w", err)
		}
		users = append(users, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during user list iteration: %w", err)
	}

	return users, nil
}

func (r *postgresUserRepository) UpdatePasswordHash(username, newPasswordHash string) error {
	query := "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE username = $2"
	_, err := r.db.Exec(query, newPasswordHash, username)
	if err != nil {
		return fmt.Errorf("failed to update password hash: %w", err)
	}
	return nil
}

func (r *postgresUserRepository) DeactivateUser(username string) error {
	query := "UPDATE users SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW() WHERE username = $1"
	result, err := r.db.Exec(query, username)
	if err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) DeleteUser(username string) error {
	query := "DELETE FROM users WHERE username = $1"
	result, err := r.db.Exec(query, username)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) CountTotalUsers() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL").Scan(&count)
	return count, err
}

func (r *postgresUserRepository) CountActiveUsers(since time.Time) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(DISTINCT username) FROM users WHERE last_online_at >= $1 AND deleted_at IS NULL", since).Scan(&count)
	return count, err
}

func (r *postgresUserRepository) CountNewUsers(since time.Time) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM users WHERE created_at >= $1 AND deleted_at IS NULL", since).Scan(&count)
	return count, err
}

func (r *postgresUserRepository) BanUser(username string) error {
	query := "UPDATE users SET banned_at = NOW(), updated_at = NOW() WHERE username = $1"
	result, err := r.db.Exec(query, username)
	if err != nil {
		return fmt.Errorf("failed to ban user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}