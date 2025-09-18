// backend/internal/repository/user_repo_test.go
package repository_test

import (
	"database/sql"
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/db"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

func withUserRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.UserRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresUserRepository(tx)

	testFunc(repo)
}

var testDB *sql.DB

func TestMain(m *testing.M) {
	// Load test configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("failed to load test config: %v", err)
	}

	// Connect to test database
	testDB, err = db.NewConnection(cfg)
	if err != nil {
		log.Fatalf("failed to connect to test database: %v", err)
	}
	defer testDB.Close()

	// Run tests
	code := m.Run()

	os.Exit(code)
}

// withTx runs a test function within a transaction, rolling it back afterwards.
func TestUserRepository_Create(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		// Test success
		user, err := repo.Create("testuser", "password123", "user", 12, sql.NullString{})
		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "user", user.Role)

		// Test duplicate username
		_, err = repo.Create("testuser", "password456", "admin", 12, sql.NullString{})
		assert.ErrorIs(t, err, repository.ErrUserAlreadyExists)
	})
}

func TestUserRepository_Find(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("finduser", "password123", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		user, err := repo.Find("finduser")
		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "finduser", user.Username)

		// Test not found
		_, err = repo.Find("nonexistent")
		assert.ErrorIs(t, err, repository.ErrUserNotFound)
	})
}

func TestUserRepository_ValidatePassword(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		user, err := repo.Create("passuser", "correctpassword", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test correct password
		err = repo.ValidatePassword(user, "correctpassword")
		require.NoError(t, err)

		// Test incorrect password
		err = repo.ValidatePassword(user, "wrongpassword")
		assert.ErrorIs(t, err, repository.ErrInvalidCredentials)
	})
}

func TestUserRepository_Update(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		user, err := repo.Create("updateuser", "password123", "user", 12, sql.NullString{})
		require.NoError(t, err)

		user.Role = "admin"
		updatedUser, err := repo.Update(user)
		require.NoError(t, err)
		assert.NotNil(t, updatedUser)
		assert.Equal(t, "admin", updatedUser.Role)

		// Test update non-existent user (should return ErrUserNotFound from Find)
		nonExistentUser := &repository.User{Username: "nonexistent", Role: "user"}
		_, err = repo.Update(nonExistentUser)
		assert.ErrorIs(t, err, repository.ErrUserNotFound)
	})
}

func TestUserRepository_Delete(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("deleteuser", "password123", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		err = repo.Delete("deleteuser")
		require.NoError(t, err)

		// Test delete non-existent user
		err = repo.Delete("nonexistent")
		assert.ErrorIs(t, err, repository.ErrUserNotFound)
	})
}

func TestUserRepository_List(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("listuser1", "password", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.Create("listuser2", "password", "admin", 12, sql.NullString{})
		require.NoError(t, err)

		users, err := repo.List()
		require.NoError(t, err)
		assert.Len(t, users, 2)

		// Check if users are present (order might vary)
		foundUser1 := false
		foundUser2 := false
		for _, u := range users {
			if u.Username == "listuser1" && u.Role == "user" {
				foundUser1 = true
			}
			if u.Username == "listuser2" && u.Role == "admin" {
				foundUser2 = true
			}
		}
		assert.True(t, foundUser1)
		assert.True(t, foundUser2)
	})
}

func TestUserRepository_UpdateProfileFields(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		user, err := repo.Create("profileuser", "password123", "user", 12, sql.NullString{})
		require.NoError(t, err)

		newNick := "NewNick"
		newPic := "http://example.com/pic.jpg"
		newStatus := "Feeling good!"
		user.Nickname = &newNick
		user.ProfilePictureURL = &newPic
		user.StatusMessage = &newStatus

		updatedUser, err := repo.Update(user)
		require.NoError(t, err)
		assert.NotNil(t, updatedUser)
		require.NotNil(t, updatedUser.Nickname)
		assert.Equal(t, "NewNick", *updatedUser.Nickname)
		require.NotNil(t, updatedUser.ProfilePictureURL)
		assert.Equal(t, "http://example.com/pic.jpg", *updatedUser.ProfilePictureURL)
		require.NotNil(t, updatedUser.StatusMessage)
		assert.Equal(t, "Feeling good!", *updatedUser.StatusMessage)

		// Verify by fetching again
		fetchedUser, err := repo.Find("profileuser")
		require.NoError(t, err)
		require.NotNil(t, fetchedUser.Nickname)
		assert.Equal(t, "NewNick", *fetchedUser.Nickname)
		require.NotNil(t, fetchedUser.ProfilePictureURL)
		assert.Equal(t, "http://example.com/pic.jpg", *fetchedUser.ProfilePictureURL)
		require.NotNil(t, fetchedUser.StatusMessage)
		assert.Equal(t, "Feeling good!", *fetchedUser.StatusMessage)
	})
}

func TestUserRepository_UpdatePasswordHash(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("passhashuser", "oldpassword", "user", 12, sql.NullString{})
		require.NoError(t, err)

		newHash := "newhashedpassword"
		err = repo.UpdatePasswordHash("passhashuser", newHash)
		require.NoError(t, err)

		// Verify by fetching again
		fetchedUser, err := repo.Find("passhashuser")
		require.NoError(t, err)
		assert.Equal(t, newHash, fetchedUser.PasswordHash)
	})
}

func TestUserRepository_DeactivateUser(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("deactivateuser", "password", "user", 12, sql.NullString{})
		require.NoError(t, err)

		err = repo.DeactivateUser("deactivateuser")
		require.NoError(t, err)

		fetchedUser, err := repo.Find("deactivateuser")
		require.NoError(t, err)
		require.NotNil(t, fetchedUser.IsActive)
		assert.False(t, *fetchedUser.IsActive)
		assert.NotNil(t, fetchedUser.DeletedAt)
	})
}

func TestUserRepository_DeleteUser(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		_, err := repo.Create("harddeleteuser", "password", "user", 12, sql.NullString{})
		require.NoError(t, err)

		err = repo.DeleteUser("harddeleteuser")
		require.NoError(t, err)

		_, err = repo.Find("harddeleteuser")
		assert.ErrorIs(t, err, repository.ErrUserNotFound)
	})
}

func TestUserRepository_CreateWithKakaoID(t *testing.T) {
	withUserRepo(t, testDB, func(repo repository.UserRepository) {
		user, err := repo.Create("kakaouser", "password", "user", 12, sql.NullString{String: "kakao_12345", Valid: true})
		require.NoError(t, err)
		assert.NotNil(t, user)
				require.NotNil(t, user.KakaoID)
		assert.Equal(t, "kakao_12345", *user.KakaoID)

		// Test duplicate Kakao ID
		_, err = repo.Create("anotherkakaouser", "password", "user", 12, sql.NullString{String: "kakao_12345", Valid: true})
		assert.ErrorIs(t, err, repository.ErrUserAlreadyExists)
	})
}
