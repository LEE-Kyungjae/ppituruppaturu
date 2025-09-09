// backend/internal/service/chat_room_service_test.go
package service_test

import (
	"testing"

	"exit/internal/mocks"
	"exit/internal/repository"
	"exit/internal/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestChatRoomService_CreateChatRoom(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	// Test success
	mockUserRepo.On("Find", "creator1").Return(&repository.User{}, nil).Once()
	mockChatRoomRepo.On("GetChatRoomByName", "New Room").Return(&repository.ChatRoom{}, repository.ErrChatRoomNotFound).Once()
	mockChatRoomRepo.On("CreateChatRoom", "New Room", "Description", "public").Return(&repository.ChatRoom{ID: uuid.New()}, nil).Once()
	mockChatRoomRepo.On("AddRoomMember", mock.AnythingOfType("uuid.UUID"), "creator1").Return(&repository.RoomMember{}, nil).Once()
	room, err := svc.CreateChatRoom("New Room", "Description", "public", "creator1")
	require.NoError(t, err)
	assert.NotNil(t, room)
	mockChatRoomRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test creator not found
	mockUserRepo.On("Find", "nonexistent").Return(&repository.User{}, repository.ErrUserNotFound).Once()
	_, err = svc.CreateChatRoom("Room2", "Desc2", "public", "nonexistent")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)

	// Test room already exists
	mockUserRepo.On("Find", "creator3").Return(&repository.User{}, nil).Once()
	mockChatRoomRepo.On("GetChatRoomByName", "Existing Room").Return(&repository.ChatRoom{}, nil).Once()
	_, err = svc.CreateChatRoom("Existing Room", "Desc", "public", "creator3")
	assert.ErrorIs(t, err, repository.ErrChatRoomExists)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_GetChatRoomByID(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(&repository.ChatRoom{}, nil).Once()
	room, err := svc.GetChatRoomByID(roomID)
	require.NoError(t, err)
	assert.NotNil(t, room)
	mockChatRoomRepo.AssertExpectations(t)

	// Test not found
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(&repository.ChatRoom{}, repository.ErrChatRoomNotFound).Once()
	_, err = svc.GetChatRoomByID(roomID)
	assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_GetChatRoomByName(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	// Test success
	mockChatRoomRepo.On("GetChatRoomByName", "Room Name").Return(&repository.ChatRoom{}, nil).Once()
	room, err := svc.GetChatRoomByName("Room Name")
	require.NoError(t, err)
	assert.NotNil(t, room)
	mockChatRoomRepo.AssertExpectations(t)

	// Test not found
	mockChatRoomRepo.On("GetChatRoomByName", "NonExistent").Return(&repository.ChatRoom{}, repository.ErrChatRoomNotFound).Once()
	_, err = svc.GetChatRoomByName("NonExistent")
	assert.ErrorIs(t, err, repository.ErrChatRoomNotFound)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_ListChatRooms(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	// Test success
	expectedRooms := []*repository.ChatRoom{{Name: "Room1"}, {Name: "Room2"}}
	mockChatRoomRepo.On("ListChatRooms", 10, 0).Return(expectedRooms, nil).Once()
	rooms, err := svc.ListChatRooms(10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedRooms, rooms)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_UpdateChatRoom(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	desc := "Old Desc"
	existingRoom := &repository.ChatRoom{ID: roomID, Name: "Old Name", Description: &desc, Type: "public"}
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(existingRoom, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "updater1").Return(true, nil).Once()
	mockChatRoomRepo.On("UpdateChatRoom", mock.AnythingOfType("*repository.ChatRoom")).Return(&repository.ChatRoom{}, nil).Once()
	room, err := svc.UpdateChatRoom(roomID, "New Name", "New Desc", "private", "updater1")
	require.NoError(t, err)
	assert.NotNil(t, room)
	mockChatRoomRepo.AssertExpectations(t)

	// Test not member
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(existingRoom, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "wrong_updater").Return(false, nil).Once()
	_, err = svc.UpdateChatRoom(roomID, "New Name", "New Desc", "private", "wrong_updater")
	assert.Error(t, err)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_DeleteChatRoom(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	existingRoom := &repository.ChatRoom{ID: roomID, Name: "Room to Delete"}
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(existingRoom, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "deleter1").Return(true, nil).Once()
	mockChatRoomRepo.On("DeleteChatRoom", roomID).Return(nil).Once()
	err := svc.DeleteChatRoom(roomID, "deleter1")
	require.NoError(t, err)
	mockChatRoomRepo.AssertExpectations(t)

	// Test not authorized
	mockChatRoomRepo.On("GetChatRoomByID", roomID).Return(existingRoom, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "wrong_deleter").Return(false, nil).Once()
	err = svc.DeleteChatRoom(roomID, "wrong_deleter")
	assert.Error(t, err)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_AddRoomMember(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	mockChatRoomRepo.On("IsRoomMember", roomID, "inviter1").Return(true, nil).Once()
	mockUserRepo.On("Find", "new_member").Return(&repository.User{}, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "new_member").Return(false, nil).Once()
	mockChatRoomRepo.On("AddRoomMember", roomID, "new_member").Return(&repository.RoomMember{}, nil).Once()
	member, err := svc.AddRoomMember(roomID, "new_member", "inviter1")
	require.NoError(t, err)
	assert.NotNil(t, member)
	mockChatRoomRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test inviter not member
	mockChatRoomRepo.On("IsRoomMember", roomID, "inviter2").Return(false, nil).Once()
	_, err = svc.AddRoomMember(roomID, "member2", "inviter2")
	assert.Error(t, err)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_RemoveRoomMember(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	mockChatRoomRepo.On("IsRoomMember", roomID, "remover1").Return(true, nil).Once()
	mockChatRoomRepo.On("IsRoomMember", roomID, "member_to_remove").Return(true, nil).Once()
	mockChatRoomRepo.On("RemoveRoomMember", roomID, "member_to_remove").Return(nil).Once()
	err := svc.RemoveRoomMember(roomID, "member_to_remove", "remover1")
	require.NoError(t, err)
	mockChatRoomRepo.AssertExpectations(t)

	// Test not authorized
	mockChatRoomRepo.On("IsRoomMember", roomID, "wrong_remover").Return(false, nil).Once()
	err = svc.RemoveRoomMember(roomID, "member_to_remove", "wrong_remover")
	assert.Error(t, err)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_IsRoomMember(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	mockChatRoomRepo.On("IsRoomMember", roomID, "member1").Return(true, nil).Once()
	isMember, err := svc.IsRoomMember(roomID, "member1")
	require.NoError(t, err)
	assert.True(t, isMember)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_ListRoomMembers(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	roomID := uuid.New()
	// Test success
	expectedMembers := []*repository.User{{Username: "member1"}, {Username: "member2"}}
	mockChatRoomRepo.On("ListRoomMembers", roomID).Return(expectedMembers, nil).Once()
	members, err := svc.ListRoomMembers(roomID)
	require.NoError(t, err)
	assert.Equal(t, expectedMembers, members)
	mockChatRoomRepo.AssertExpectations(t)
}

func TestChatRoomService_ListUserChatRooms(t *testing.T) {
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewChatRoomService(mockChatRoomRepo, mockUserRepo)

	// Test success
	expectedRooms := []*repository.ChatRoom{{Name: "Room1"}, {Name: "Room2"}}
	mockChatRoomRepo.On("ListUserChatRooms", "user1").Return(expectedRooms, nil).Once()
	rooms, err := svc.ListUserChatRooms("user1")
	require.NoError(t, err)
	assert.Equal(t, expectedRooms, rooms)
	mockChatRoomRepo.AssertExpectations(t)
}
