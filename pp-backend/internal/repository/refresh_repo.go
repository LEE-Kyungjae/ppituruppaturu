// backend/internal/repository/refresh_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)



var ErrTokenNotFound = errors.New("refresh token not found")

// RefreshTokenRepository defines the interface for refresh token storage.
type RefreshTokenRepository interface {
	Store(token, subject string, expiry time.Duration) error
	GetSubject(token string) (string, error)
	Delete(token string) error
}

// --- PostgreSQL Implementation ---

type postgresRefreshTokenRepository struct {
	db DBTX
}

// NewPostgresRefreshTokenRepository creates a new PostgreSQL-backed token repository.
func NewPostgresRefreshTokenRepository(db DBTX) RefreshTokenRepository {
	return &postgresRefreshTokenRepository{db: db}
}

func (r *postgresRefreshTokenRepository) Store(token, subject string, expiry time.Duration) error {
	query := `
        INSERT INTO refresh_tokens (token, user_username, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_username) DO UPDATE
        SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`

	expiresAt := time.Now().Add(expiry)

	_, err := r.db.Exec(query, token, subject, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to store refresh token: %w", err)
	}
	return nil
}

func (r *postgresRefreshTokenRepository) GetSubject(token string) (string, error) {
	query := "SELECT user_username FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()"
	row := r.db.QueryRow(query, token)

	var subject string
	if err := row.Scan(&subject); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrTokenNotFound
		}
		return "", fmt.Errorf("failed to get refresh token subject: %w", err)
	}
	return subject, nil
}

func (r *postgresRefreshTokenRepository) Delete(token string) error {
	query := "DELETE FROM refresh_tokens WHERE token = $1"
	_, err := r.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete refresh token: %w", err)
	}
	return nil
}
