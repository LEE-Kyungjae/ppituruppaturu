// backend/internal/service/chat_service_test.go

package service_test

import (
	"database/sql"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestChatService_SendMessage(t *testing.T) {
	mockMessageRepo := new(mocks.MockMessageRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockHub := new(mocks.MockChatHub)
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	svc := service.NewChatService(mockMessageRepo, mockUserRepo, mockChatRoomRepo, mockHub)

	// Test success
	mockUserRepo.On("Find", "receiver_msg").Return(&repository.User{}, nil).Once()
	mockMessageRepo.On("CreateMessage", "sender_msg", sql.NullString{String: "receiver_msg", Valid: true}, sql.Null[uuid.UUID]{}, "Hello").Return(&repository.Message{}, nil).Once()
	mockHub.On("SendPrivateMessage", mock.AnythingOfType("*chat.Message")).Return().Once()
	msg, err := svc.SendMessage("sender_msg", "receiver_msg", "Hello")
	require.NoError(t, err)
	assert.NotNil(t, msg)
	mockMessageRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)

	// Test receiver not found
	mockUserRepo.On("Find", "nonexistent").Return(&repository.User{}, repository.ErrUserNotFound).Once()
	_, err = svc.SendMessage("sender_msg", "nonexistent", "Hello")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)
}

func TestChatService_GetMessageHistory(t *testing.T) {
	mockMessageRepo := new(mocks.MockMessageRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockHub := new(mocks.MockChatHub)
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	svc := service.NewChatService(mockMessageRepo, mockUserRepo, mockChatRoomRepo, mockHub)

	// Test success
	mockUserRepo.On("Find", "user1").Return(&repository.User{}, nil).Once()
	mockUserRepo.On("Find", "user2").Return(&repository.User{}, nil).Once()
	expectedMessages := []*repository.Message{{Content: "test"}}
	mockMessageRepo.On("GetMessagesBetweenUsers", "user1", "user2", 10, 0).Return(expectedMessages, nil).Once()
	messages, err := svc.GetMessageHistory("user1", "user2", 10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedMessages, messages)
	mockMessageRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test user1 not found
	mockUserRepo.On("Find", "user1_nf").Return(&repository.User{}, repository.ErrUserNotFound).Once()
	_, err = svc.GetMessageHistory("user1_nf", "user2", 10, 0)
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)
}

func TestChatService_MarkMessagesAsRead(t *testing.T) {
	mockMessageRepo := new(mocks.MockMessageRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockHub := new(mocks.MockChatHub)
	mockChatRoomRepo := new(mocks.MockChatRoomRepository)
	svc := service.NewChatService(mockMessageRepo, mockUserRepo, mockChatRoomRepo, mockHub)

	// Test success
	mockMessageRepo.On("MarkMessagesAsRead", sql.NullString{String: "sender_read", Valid: true}, sql.NullString{String: "receiver_read", Valid: true}, sql.Null[uuid.UUID]{}).Return(nil).Once()
	err := svc.MarkMessagesAsRead("sender_read", "receiver_read")
	require.NoError(t, err)
	mockMessageRepo.AssertExpectations(t)
}
