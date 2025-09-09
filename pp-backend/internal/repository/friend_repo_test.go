// backend/internal/repository/friend_repo_test.go

package repository_test

import (
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"exit/internal/repository"
)

func withFriendRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.FriendRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresFriendRepository(tx)

	testFunc(repo)
}

func TestFriendRepository_CreateFriendRequest(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup: Create users
		userRepo := repository.NewPostgresUserRepository(testDB) // Use testDB directly for setup
		_, err := userRepo.Create("sender1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("receiver1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		fr, err := repo.CreateFriendRequest("sender1", "receiver1")
		require.NoError(t, err)
		assert.NotNil(t, fr)
		assert.Equal(t, "sender1", fr.SenderUsername)
		assert.Equal(t, "receiver1", fr.ReceiverUsername)
		assert.Equal(t, "pending", fr.Status)

		// Test duplicate request
		_, err = repo.CreateFriendRequest("sender1", "receiver1")
		assert.ErrorIs(t, err, repository.ErrFriendRequestExists)

		// Test if already friends (should be handled by service layer, but repo should prevent duplicate friendship)
		_, err = repo.CreateFriendship("sender1", "receiver1")
		require.NoError(t, err)
		_, err = repo.CreateFriendRequest("sender1", "receiver1")
		assert.ErrorIs(t, err, repository.ErrFriendshipExists)
	})
}

func TestFriendRepository_GetFriendRequest(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("userA", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("userB", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		fr, err := repo.CreateFriendRequest("userA", "userB")
		require.NoError(t, err)

		// Test success
		fetchedFr, err := repo.GetFriendRequest(fr.ID)
		require.NoError(t, err)
		assert.Equal(t, fr.ID, fetchedFr.ID)

		// Test not found
		_, err = repo.GetFriendRequest(uuid.New())
		assert.ErrorIs(t, err, repository.ErrFriendRequestNotFound)
	})
}

func TestFriendRepository_UpdateFriendRequestStatus(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("userX", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("userY", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		fr, err := repo.CreateFriendRequest("userX", "userY")
		require.NoError(t, err)

		// Test success
		err = repo.UpdateFriendRequestStatus(fr.ID, "accepted")
		require.NoError(t, err)
		fetchedFr, err := repo.GetFriendRequest(fr.ID)
		require.NoError(t, err)
		assert.Equal(t, "accepted", fetchedFr.Status)

		// Test not found
		err = repo.UpdateFriendRequestStatus(uuid.New(), "declined")
		assert.Error(t, err)
	})
}

func TestFriendRepository_DeleteFriendRequest(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("userC", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("userD", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		fr, err := repo.CreateFriendRequest("userC", "userD")
		require.NoError(t, err)

		// Test success
		err = repo.DeleteFriendRequest(fr.ID)
		require.NoError(t, err)

		// Verify deletion
		_, err = repo.GetFriendRequest(fr.ID)
		assert.ErrorIs(t, err, repository.ErrFriendRequestNotFound)
	})
}

func TestFriendRepository_CreateFriendship(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("friend1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("friend2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		f, err := repo.CreateFriendship("friend1", "friend2")
		require.NoError(t, err)
		assert.NotNil(t, f)
		assert.True(t, f.UserUsername1 == "friend1" || f.UserUsername1 == "friend2")
		assert.True(t, f.UserUsername2 == "friend1" || f.UserUsername2 == "friend2")

		// Test duplicate (should fail due to unique constraint)
		_, err = repo.CreateFriendship("friend1", "friend2")
		assert.Error(t, err)
	})
}

func TestFriendRepository_DeleteFriendship(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("deluser1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("deluser2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.CreateFriendship("deluser1", "deluser2")
		require.NoError(t, err)

		// Test success
		err = repo.DeleteFriendship("deluser1", "deluser2")
		require.NoError(t, err)

		// Verify deletion
		isFriends, err := repo.IsFriends("deluser1", "deluser2")
		require.NoError(t, err)
		assert.False(t, isFriends)
	})
}

func TestFriendRepository_IsFriends(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("isfriend1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("isfriend2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.CreateFriendship("isfriend1", "isfriend2")
		require.NoError(t, err)

		// Test true
		isFriends, err := repo.IsFriends("isfriend1", "isfriend2")
		require.NoError(t, err)
		assert.True(t, isFriends)

		// Test false
		isFriends, err = repo.IsFriends("isfriend1", "nonexistent")
		require.NoError(t, err)
		assert.False(t, isFriends)
	})
}

func TestFriendRepository_BlockUser(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("blocker1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("blocked1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		bu, err := repo.BlockUser("blocker1", "blocked1")
		require.NoError(t, err)
		assert.NotNil(t, bu)
		assert.Equal(t, "blocker1", bu.BlockerUsername)
		assert.Equal(t, "blocked1", bu.BlockedUsername)

		// Test duplicate
		_, err = repo.BlockUser("blocker1", "blocked1")
		assert.Error(t, err)
	})
}

func TestFriendRepository_UnblockUser(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("unblocker1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("unblocked1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.BlockUser("unblocker1", "unblocked1")
		require.NoError(t, err)

		// Test success
		err = repo.UnblockUser("unblocker1", "unblocked1")
		require.NoError(t, err)

		// Verify unblock
		isBlocked, err := repo.IsBlocked("unblocker1", "unblocked1")
		require.NoError(t, err)
		assert.False(t, isBlocked)
	})
}

func TestFriendRepository_IsBlocked(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("isblocker1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("isblocked1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.BlockUser("isblocker1", "isblocked1")
		require.NoError(t, err)

		// Test true
		isBlocked, err := repo.IsBlocked("isblocker1", "isblocked1")
		require.NoError(t, err)
		assert.True(t, isBlocked)

		// Test false
		isBlocked, err = repo.IsBlocked("isblocker1", "nonexistent")
		require.NoError(t, err)
		assert.False(t, isBlocked)
	})
}

func TestFriendRepository_ListFriends(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("mainuser", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("friendA", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("friendB", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.CreateFriendship("mainuser", "friendA")
		require.NoError(t, err)
		_, err = repo.CreateFriendship("mainuser", "friendB")
		require.NoError(t, err)

		// Test success
		friends, err := repo.ListFriends("mainuser")
		require.NoError(t, err)
		assert.Len(t, friends, 2)

		foundA := false
		foundB := false
		for _, f := range friends {
			if f.Username == "friendA" {
				foundA = true
			}
			if f.Username == "friendB" {
				foundB = true
			}
		}
		assert.True(t, foundA)
		assert.True(t, foundB)
	})
}

func TestFriendRepository_ListIncomingFriendRequests(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("reqsender1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("reqreceiver1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("reqsender2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.CreateFriendRequest("reqsender1", "reqreceiver1")
		require.NoError(t, err)
		_, err = repo.CreateFriendRequest("reqsender2", "reqreceiver1")
		require.NoError(t, err)

		// Test success
		requests, err := repo.ListIncomingFriendRequests("reqreceiver1")
		require.NoError(t, err)
		assert.Len(t, requests, 2)

		found1 := false
		found2 := false
		for _, r := range requests {
			if r.SenderUsername == "reqsender1" {
				found1 = true
			}
			if r.SenderUsername == "reqsender2" {
				found2 = true
			}
		}
		assert.True(t, found1)
		assert.True(t, found2)
	})
}

func TestFriendRepository_ListOutgoingFriendRequests(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("outreqsender1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("outreqreceiver1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("outreqreceiver2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.CreateFriendRequest("outreqsender1", "outreqreceiver1")
		require.NoError(t, err)
		_, err = repo.CreateFriendRequest("outreqsender1", "outreqreceiver2")
		require.NoError(t, err)

		// Test success
		requests, err := repo.ListOutgoingFriendRequests("outreqsender1")
		require.NoError(t, err)
		assert.Len(t, requests, 2)

		found1 := false
		found2 := false
		for _, r := range requests {
			if r.ReceiverUsername == "outreqreceiver1" {
				found1 = true
			}
			if r.ReceiverUsername == "outreqreceiver2" {
				found2 = true			}
		}
		assert.True(t, found1)
		assert.True(t, found2)
	})
}

func TestFriendRepository_ListBlockedUsers(t *testing.T) {
	withFriendRepo(t, testDB, func(repo repository.FriendRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("blockerUser", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("blockedUser1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("blockedUser2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.BlockUser("blockerUser", "blockedUser1")
		require.NoError(t, err)
		_, err = repo.BlockUser("blockerUser", "blockedUser2")
		require.NoError(t, err)

		// Test success
		blockedUsers, err := repo.ListBlockedUsers("blockerUser")
		require.NoError(t, err)
		assert.Len(t, blockedUsers, 2)

		found1 := false
		found2 := false
		for _, bu := range blockedUsers {
			if bu.BlockedUsername == "blockedUser1" {
				found1 = true
			}
			if bu.BlockedUsername == "blockedUser2" {
				found2 = true
			}
		}
		assert.True(t, found1)
		assert.True(t, found2)
	})
}