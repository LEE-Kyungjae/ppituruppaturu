// backend/internal/repository/chat_room_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"exit/internal/repository"
)

func withChatRoomRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.ChatRoomRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresChatRoomRepository(tx)

	testFunc(repo)
}

func TestChatRoomRepository_CreateChatRoom(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Test success
		room, err := repo.CreateChatRoom("Test Room", "A test chat room", "public")
		require.NoError(t, err)
		assert.NotNil(t, room)
		assert.Equal(t, "Test Room", room.Name)
		assert.Equal(t, "public", room.Type)

		// Test duplicate name (should fail due to unique constraint)
		_, err = repo.CreateChatRoom("Test Room", "Another description", "private")
		assert.Error(t, err)
	})
}

func TestChatRoomRepository_GetChatRoomByID(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		room, err := repo.CreateChatRoom("RoomByID", "Description for RoomByID", "public")
		require.NoError(t, err)

		// Test success
		fetchedRoom, err := repo.GetChatRoomByID(room.ID)
		require.NoError(t, err)
		assert.Equal(t, room.ID, fetchedRoom.ID)

		// Test not found
		_, err = repo.GetChatRoomByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	})
}

func TestChatRoomRepository_GetChatRoomByName(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		room, err := repo.CreateChatRoom("RoomByName", "Description for RoomByName", "public")
		require.NoError(t, err)

		// Test success
		fetchedRoom, err := repo.GetChatRoomByName("RoomByName")
		require.NoError(t, err)
		assert.Equal(t, room.Name, fetchedRoom.Name)

		// Test not found
		_, err = repo.GetChatRoomByName("NonExistentRoom")
		assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	})
}

func TestChatRoomRepository_ListChatRooms(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		_, err := repo.CreateChatRoom("Room A", "Desc A", "public")
		require.NoError(t, err)
		_, err = repo.CreateChatRoom("Room B", "Desc B", "private")
		require.NoError(t, err)

		// Test success
		rooms, err := repo.ListChatRooms(10, 0)
		require.NoError(t, err)
		assert.Len(t, rooms, 2)
		assert.Equal(t, "Room B", rooms[0].Name) // Ordered by created_at DESC
	})
}

func TestChatRoomRepository_UpdateChatRoom(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		room, err := repo.CreateChatRoom("Update Room", "Original Desc", "public")
		require.NoError(t, err)

		// Test success
		room.Name = "Updated Room"
		updatedDesc := "Updated Desc"
		room.Description = &updatedDesc
		room.Type = "private"
		updatedRoom, err := repo.UpdateChatRoom(room)
		require.NoError(t, err)
		assert.NotNil(t, updatedRoom)
		assert.Equal(t, "Updated Room", updatedRoom.Name)
		require.NotNil(t, updatedRoom.Description) // Ensure pointer is not nil
		assert.Equal(t, "Updated Desc", *updatedRoom.Description) // Dereference pointer
		assert.Equal(t, "private", updatedRoom.Type)

		// Test not found
		room.ID = uuid.New()
		_, err = repo.UpdateChatRoom(room)
		assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	})
}

func TestChatRoomRepository_DeleteChatRoom(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		room, err := repo.CreateChatRoom("Delete Room", "Desc", "public")
		require.NoError(t, err)

		// Test success
		err = repo.DeleteChatRoom(room.ID)
		require.NoError(t, err)

		// Verify deletion
		_, err = repo.GetChatRoomByID(room.ID)
		assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	})
}

func TestChatRoomRepository_AddRoomMember(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("member1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		room, err := repo.CreateChatRoom("Member Room", "Desc", "public")
		require.NoError(t, err)

		// Test success
		member, err := repo.AddRoomMember(room.ID, "member1")
		require.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, room.ID, member.RoomID)
		assert.Equal(t, "member1", member.MemberUsername)

		// Test duplicate
		_, err = repo.AddRoomMember(room.ID, "member1")
		assert.Error(t, err)
	})
}

func TestChatRoomRepository_RemoveRoomMember(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("member_remove", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		room, err := repo.CreateChatRoom("Remove Member Room", "Desc", "public")
		require.NoError(t, err)
		_, err = repo.AddRoomMember(room.ID, "member_remove")
		require.NoError(t, err)

		// Test success
		err = repo.RemoveRoomMember(room.ID, "member_remove")
		require.NoError(t, err)

		// Verify removal
		isMember, err := repo.IsRoomMember(room.ID, "member_remove")
		require.NoError(t, err)
		assert.False(t, isMember)
	})
}

func TestChatRoomRepository_IsRoomMember(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("member_check", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		room, err := repo.CreateChatRoom("Check Member Room", "Desc", "public")
		require.NoError(t, err)
		_, err = repo.AddRoomMember(room.ID, "member_check")
		require.NoError(t, err)

		// Test true
		isMember, err := repo.IsRoomMember(room.ID, "member_check")
		require.NoError(t, err)
		assert.True(t, isMember)

		// Test false
		isMember, err = repo.IsRoomMember(room.ID, "nonexistent_member")
		require.NoError(t, err)
		assert.False(t, isMember)
	})
}

func TestChatRoomRepository_ListRoomMembers(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("member_list1", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = userRepo.Create("member_list2", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		room, err := repo.CreateChatRoom("List Members Room", "Desc", "public")
		require.NoError(t, err)
		_, err = repo.AddRoomMember(room.ID, "member_list1")
		require.NoError(t, err)
		_, err = repo.AddRoomMember(room.ID, "member_list2")
		require.NoError(t, err)

		// Test success
		members, err := repo.ListRoomMembers(room.ID)
		require.NoError(t, err)
		assert.Len(t, members, 2)

		found1 := false
		found2 := false
		for _, m := range members {
			if m.Username == "member_list1" {
				found1 = true
			}
			if m.Username == "member_list2" {
				found2 = true
			}
		}
		assert.True(t, found1)
		assert.True(t, found2)
	})
}

func TestChatRoomRepository_ListUserChatRooms(t *testing.T) {
	withChatRoomRepo(t, testDB, func(repo repository.ChatRoomRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("user_room_list", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		room1, err := repo.CreateChatRoom("User Room 1", "Desc 1", "public")
		require.NoError(t, err)
		room2, err := repo.CreateChatRoom("User Room 2", "Desc 2", "private")
		require.NoError(t, err)

		_, err = repo.AddRoomMember(room1.ID, "user_room_list")
		require.NoError(t, err)
		_, err = repo.AddRoomMember(room2.ID, "user_room_list")
		require.NoError(t, err)

		// Test success
		rooms, err := repo.ListUserChatRooms("user_room_list")
		require.NoError(t, err)
		assert.Len(t, rooms, 2)

		found1 := false
		found2 := false
		for _, r := range rooms {
			if r.Name == "User Room 1" {
				found1 = true
			}
			if r.Name == "User Room 2" {
				found2 = true
			}
		}
		assert.True(t, found1)
		assert.True(t, found2)
	})
}
