// backend/internal/service/friend_service_test.go
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

// MockFriendRepository is a mock implementation of repository.FriendRepository
type MockFriendRepository struct {
	mock.Mock
}

func (m *MockFriendRepository) CreateFriendRequest(sender, receiver string) (*repository.FriendRequest, error) {
	args := m.Called(sender, receiver)
	return args.Get(0).(*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendRepository) GetFriendRequest(id uuid.UUID) (*repository.FriendRequest, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendRepository) GetPendingFriendRequest(sender, receiver string) (*repository.FriendRequest, error) {
	args := m.Called(sender, receiver)
	return args.Get(0).(*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendRepository) UpdateFriendRequestStatus(id uuid.UUID, status string) error {
	args := m.Called(id, status)
	return args.Error(0)
}

func (m *MockFriendRepository) DeleteFriendRequest(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockFriendRepository) CreateFriendship(user1, user2 string) (*repository.Friend, error) {
	args := m.Called(user1, user2)
	return args.Get(0).(*repository.Friend), args.Error(1)
}

func (m *MockFriendRepository) DeleteFriendship(user1, user2 string) error {
	args := m.Called(user1, user2)
	return args.Error(0)
}

func (m *MockFriendRepository) IsFriends(user1, user2 string) (bool, error) {
	args := m.Called(user1, user2)
	return args.Bool(0), args.Error(1)
}

func (m *MockFriendRepository) BlockUser(blocker, blocked string) (*repository.BlockedUser, error) {
	args := m.Called(blocker, blocked)
	return args.Get(0).(*repository.BlockedUser), args.Error(1)
}

func (m *MockFriendRepository) UnblockUser(blocker, blocked string) error {
	args := m.Called(blocker, blocked)
	return args.Error(0)
}

func (m *MockFriendRepository) IsBlocked(blocker, blocked string) (bool, error) {
	args := m.Called(blocker, blocked)
	return args.Bool(0), args.Error(1)
}

func (m *MockFriendRepository) ListFriends(username string) ([]*repository.User, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.User), args.Error(1)
}

func (m *MockFriendRepository) ListIncomingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendRepository) ListOutgoingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendRepository) ListBlockedUsers(username string) ([]*repository.BlockedUser, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.BlockedUser), args.Error(1)
}

func TestFriendService_SendFriendRequest(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository) // Re-use MockUserRepository from user_service_test
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	mockUserRepo.On("Find", "receiver1").Return(&repository.User{}, nil).Once()
	mockFriendRepo.On("IsBlocked", "receiver1", "sender1").Return(false, nil).Once()
	mockFriendRepo.On("CreateFriendRequest", "sender1", "receiver1").Return(&repository.FriendRequest{SenderUsername: "sender1"}, nil).Once()
	fr, err := svc.SendFriendRequest("sender1", "receiver1")
	require.NoError(t, err)
	assert.NotNil(t, fr)
	mockFriendRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test receiver not found
	mockUserRepo.On("Find", "nonexistent").Return(&repository.User{}, repository.ErrUserNotFound).Once()
	_, err = svc.SendFriendRequest("sender1", "nonexistent")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)

	// Test sender blocked by receiver
	mockUserRepo.On("Find", "receiver_blocked").Return(&repository.User{}, nil).Once()
	mockFriendRepo.On("IsBlocked", "receiver_blocked", "sender_blocked").Return(true, nil).Once()
	_, err = svc.SendFriendRequest("sender_blocked", "receiver_blocked")
	assert.ErrorIs(t, err, repository.ErrUserBlocked)
	mockFriendRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test request already exists  
	mockUserRepo.On("Find", "receiver_exists").Return(&repository.User{}, nil).Once()
	mockFriendRepo.On("IsBlocked", "receiver_exists", "sender_exists").Return(false, nil).Once()
	mockFriendRepo.On("CreateFriendRequest", "sender_exists", "receiver_exists").Return(&repository.FriendRequest{}, repository.ErrFriendRequestExists).Once()
	_, err = svc.SendFriendRequest("sender_exists", "receiver_exists")
	assert.ErrorIs(t, err, repository.ErrFriendRequestExists)
	mockFriendRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
}

func TestFriendService_AcceptFriendRequest(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	requestID := uuid.New()
	fr := &repository.FriendRequest{ID: requestID, SenderUsername: "sender_acc", ReceiverUsername: "accepter_acc", Status: "pending"}

	// Test success
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	mockFriendRepo.On("CreateFriendship", "sender_acc", "accepter_acc").Return(&repository.Friend{}, nil).Once()
	mockFriendRepo.On("UpdateFriendRequestStatus", requestID, "accepted").Return(nil).Once()
	err := svc.AcceptFriendRequest(requestID, "accepter_acc")
	require.NoError(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test invalid request (wrong receiver)
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	err = svc.AcceptFriendRequest(requestID, "wrong_accepter")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test invalid request (not pending)
	fr.Status = "accepted"
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	err = svc.AcceptFriendRequest(requestID, "accepter_acc")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_DeclineFriendRequest(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	requestID := uuid.New()
	fr := &repository.FriendRequest{ID: requestID, SenderUsername: "sender_dec", ReceiverUsername: "decliner_dec", Status: "pending"}

	// Test success
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	mockFriendRepo.On("UpdateFriendRequestStatus", requestID, "declined").Return(nil).Once()

	err := svc.DeclineFriendRequest(requestID, "decliner_dec")
	require.NoError(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test invalid request (wrong decliner)
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	err = svc.DeclineFriendRequest(requestID, "wrong_decliner")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_CancelFriendRequest(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	requestID := uuid.New()
	fr := &repository.FriendRequest{ID: requestID, SenderUsername: "canceller_can", ReceiverUsername: "receiver_can", Status: "pending"}

	// Test success
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	mockFriendRepo.On("UpdateFriendRequestStatus", requestID, "cancelled").Return(nil).Once()
	err := svc.CancelFriendRequest(requestID, "canceller_can")
	require.NoError(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test invalid request (wrong canceller)
	mockFriendRepo.On("GetFriendRequest", requestID).Return(fr, nil).Once()
	err = svc.CancelFriendRequest(requestID, "wrong_canceller")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_RemoveFriend(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	mockFriendRepo.On("IsFriends", "user1_rem", "user2_rem").Return(true, nil).Once()
	mockFriendRepo.On("DeleteFriendship", "user1_rem", "user2_rem").Return(nil).Once()
	err := svc.RemoveFriend("user1_rem", "user2_rem")
	require.NoError(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test not friends
	mockFriendRepo.On("IsFriends", "user1_not_rem", "user2_not_rem").Return(false, nil).Once()
	err = svc.RemoveFriend("user1_not_rem", "user2_not_rem")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_BlockUser(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	mockFriendRepo.On("IsBlocked", "blocker_b", "blocked_b").Return(false, nil).Once()
	mockFriendRepo.On("IsFriends", "blocker_b", "blocked_b").Return(false, nil).Once()
	mockFriendRepo.On("BlockUser", "blocker_b", "blocked_b").Return(&repository.BlockedUser{}, nil).Once()
	bu, err := svc.BlockUser("blocker_b", "blocked_b")
	require.NoError(t, err)
	assert.NotNil(t, bu)
	mockFriendRepo.AssertExpectations(t)

	// Test already blocked
	mockFriendRepo.On("IsBlocked", "blocker_b_exist", "blocked_b_exist").Return(true, nil).Once()
	_, err = svc.BlockUser("blocker_b_exist", "blocked_b_exist")
	assert.ErrorIs(t, err, repository.ErrUserBlocked)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_UnblockUser(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	mockFriendRepo.On("IsBlocked", "unblocker_u", "unblocked_u").Return(true, nil).Once()
	mockFriendRepo.On("UnblockUser", "unblocker_u", "unblocked_u").Return(nil).Once()
	err := svc.UnblockUser("unblocker_u", "unblocked_u")
	require.NoError(t, err)
	mockFriendRepo.AssertExpectations(t)

	// Test not blocked
	mockFriendRepo.On("IsBlocked", "unblocker_u_not", "unblocked_u_not").Return(false, nil).Once()
	err = svc.UnblockUser("unblocker_u_not", "unblocked_u_not")
	assert.Error(t, err)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_ListFriends(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	expectedUsers := []*repository.User{{Username: "friend1"}, {Username: "friend2"}}
	mockFriendRepo.On("ListFriends", "main_user").Return(expectedUsers, nil).Once()
	users, err := svc.ListFriends("main_user")
	require.NoError(t, err)
	assert.Equal(t, expectedUsers, users)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_ListIncomingFriendRequests(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	expectedRequests := []*repository.FriendRequest{{SenderUsername: "req1"}, {SenderUsername: "req2"}}
	mockFriendRepo.On("ListIncomingFriendRequests", "receiver_user").Return(expectedRequests, nil).Once()
	requests, err := svc.ListIncomingFriendRequests("receiver_user")
	require.NoError(t, err)
	assert.Equal(t, expectedRequests, requests)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_ListOutgoingFriendRequests(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	expectedRequests := []*repository.FriendRequest{{ReceiverUsername: "out1"}, {ReceiverUsername: "out2"}}
	mockFriendRepo.On("ListOutgoingFriendRequests", "sender_user").Return(expectedRequests, nil).Once()
	requests, err := svc.ListOutgoingFriendRequests("sender_user")
	require.NoError(t, err)
	assert.Equal(t, expectedRequests, requests)
	mockFriendRepo.AssertExpectations(t)
}

func TestFriendService_ListBlockedUsers(t *testing.T) {
	mockFriendRepo := new(MockFriendRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewFriendService(mockFriendRepo, mockUserRepo)

	// Test success
	expectedBlockedUsers := []*repository.BlockedUser{{BlockedUsername: "blocked1"}, {BlockedUsername: "blocked2"}}
	mockFriendRepo.On("ListBlockedUsers", "blocker_user").Return(expectedBlockedUsers, nil).Once()
	blockedUsers, err := svc.ListBlockedUsers("blocker_user")
	require.NoError(t, err)
	assert.Equal(t, expectedBlockedUsers, blockedUsers)
	mockFriendRepo.AssertExpectations(t)
}
