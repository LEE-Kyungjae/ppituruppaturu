// backend/internal/repository/password_reset_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

var (
	ErrPasswordResetTokenNotFound = errors.New("password reset token not found")
)

// PasswordResetToken represents a password reset token.
type PasswordResetToken struct {
	Token     string
	UserID    string
	ExpiresAt time.Time
}

// PasswordResetTokenRepository defines the interface for password reset token data storage.
type PasswordResetTokenRepository interface {
	Create(token string, userID string, expiresAt time.Time) (*PasswordResetToken, error)
	FindByToken(token string) (*PasswordResetToken, error)
	Delete(token string) error
}

// --- PostgreSQL Implementation ---

type postgresPasswordResetTokenRepository struct {
	db DBTX
}

// NewPostgresPasswordResetTokenRepository creates a new PostgreSQL-backed password reset token repository.
func NewPostgresPasswordResetTokenRepository(db DBTX) PasswordResetTokenRepository {
	return &postgresPasswordResetTokenRepository{db: db}
}

func (r *postgresPasswordResetTokenRepository) Create(token string, userID string, expiresAt time.Time) (*PasswordResetToken, error) {
	query := "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3) RETURNING token, user_id, expires_at"
	row := r.db.QueryRow(query, token, userID, expiresAt)

	var prt PasswordResetToken
	if err := row.Scan(&prt.Token, &prt.UserID, &prt.ExpiresAt); err != nil {
		return nil, fmt.Errorf("failed to create password reset token: %w", err)
	}
	return &prt, nil
}

func (r *postgresPasswordResetTokenRepository) FindByToken(token string) (*PasswordResetToken, error) {
	query := "SELECT token, user_id, expires_at FROM password_reset_tokens WHERE token = $1"
	row := r.db.QueryRow(query, token)

	var prt PasswordResetToken
	if err := row.Scan(&prt.Token, &prt.UserID, &prt.ExpiresAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrPasswordResetTokenNotFound
		}
		return nil, fmt.Errorf("failed to find password reset token: %w", err)
	}
	return &prt, nil
}

func (r *postgresPasswordResetTokenRepository) Delete(token string) error {
	query := "DELETE FROM password_reset_tokens WHERE token = $1"
	result, err := r.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete password reset token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrPasswordResetTokenNotFound
	}

	return nil
}
