// backend/internal/repository/refresh_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

func withRefreshTokenRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.RefreshTokenRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresRefreshTokenRepository(tx)

	testFunc(repo)
}

func TestRefreshTokenRepository_Store(t *testing.T) {
	withRefreshTokenRepo(t, testDB, func(repo repository.RefreshTokenRepository) {
		// Test success
		err := repo.Store("test_token_1", "test_user_1", 1*time.Hour)
		require.NoError(t, err)

		subject, err := repo.GetSubject("test_token_1")
		require.NoError(t, err)
		assert.Equal(t, "test_user_1", subject)

		// Test update (ON CONFLICT)
		err = repo.Store("test_token_2", "test_user_1", 2*time.Hour) // Same user, new token
		require.NoError(t, err)

		subject, err = repo.GetSubject("test_token_2")
		require.NoError(t, err)
		assert.Equal(t, "test_user_1", subject)

		// Old token should now be invalid for that user
		_, err = repo.GetSubject("test_token_1")
		assert.ErrorIs(t, err, repository.ErrTokenNotFound)
	})
}

func TestRefreshTokenRepository_GetSubject(t *testing.T) {
	withRefreshTokenRepo(t, testDB, func(repo repository.RefreshTokenRepository) {
		// Test token not found
		_, err := repo.GetSubject("non_existent_token")
		assert.ErrorIs(t, err, repository.ErrTokenNotFound)

		// Test expired token
		err = repo.Store("expired_token", "test_user_expired", -1*time.Hour) // Store with negative expiry
		require.NoError(t, err)
		_, err = repo.GetSubject("expired_token")
		assert.ErrorIs(t, err, repository.ErrTokenNotFound)

		// Test valid token
		err = repo.Store("valid_token", "test_user_valid", 1*time.Hour)
		require.NoError(t, err)
		subject, err := repo.GetSubject("valid_token")
		require.NoError(t, err)
		assert.Equal(t, "test_user_valid", subject)
	})
}

func TestRefreshTokenRepository_Delete(t *testing.T) {
	withRefreshTokenRepo(t, testDB, func(repo repository.RefreshTokenRepository) {
		err := repo.Store("token_to_delete", "test_user_delete", 1*time.Hour)
		require.NoError(t, err)

		// Test delete success
		err = repo.Delete("token_to_delete")
		require.NoError(t, err)

		_, err = repo.GetSubject("token_to_delete")
		assert.ErrorIs(t, err, repository.ErrTokenNotFound)

		// Test delete non-existent token (should not error)
		err = repo.Delete("non_existent_token_to_delete")
		require.NoError(t, err)
	})
}