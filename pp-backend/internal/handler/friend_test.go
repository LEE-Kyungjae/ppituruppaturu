// backend/internal/handler/friend_test.go
package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"exit/internal/handler"
	"exit/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockFriendService is a mock implementation of service.FriendService
type MockFriendService struct {
	mock.Mock
}

func (m *MockFriendService) SendFriendRequest(senderUsername, receiverUsername string) (*repository.FriendRequest, error) {
	args := m.Called(senderUsername, receiverUsername)
	return args.Get(0).(*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendService) AcceptFriendRequest(requestID uuid.UUID, acceptorUsername string) error {
	args := m.Called(requestID, acceptorUsername)
	return args.Error(0)
}

func (m *MockFriendService) DeclineFriendRequest(requestID uuid.UUID, declinerUsername string) error {
	args := m.Called(requestID, declinerUsername)
	return args.Error(0)
}

func (m *MockFriendService) CancelFriendRequest(requestID uuid.UUID, cancellerUsername string) error {
	args := m.Called(requestID, cancellerUsername)
	return args.Error(0)
}

func (m *MockFriendService) RemoveFriend(user1Username, user2Username string) error {
	args := m.Called(user1Username, user2Username)
	return args.Error(0)
}

func (m *MockFriendService) BlockUser(blockerUsername, blockedUsername string) (*repository.BlockedUser, error) {
	args := m.Called(blockerUsername, blockedUsername)
	return args.Get(0).(*repository.BlockedUser), args.Error(1)
}

func (m *MockFriendService) UnblockUser(blockerUsername, blockedUsername string) error {
	args := m.Called(blockerUsername, blockedUsername)
	return args.Error(0)
}

func (m *MockFriendService) ListFriends(username string) ([]*repository.User, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.User), args.Error(1)
}

func (m *MockFriendService) ListIncomingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendService) ListOutgoingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.FriendRequest), args.Error(1)
}

func (m *MockFriendService) ListBlockedUsers(username string) ([]*repository.BlockedUser, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.BlockedUser), args.Error(1)
}

func TestFriendHandler_SendFriendRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.POST("/users/:username/friend-request", h.SendFriendRequest)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "sender1")
	c.Params = gin.Params{{Key: "username", Value: "receiver1"}}
	req, _ := http.NewRequest(http.MethodPost, "/users/receiver1/friend-request", nil)
	c.Request = req

	mockFriendService.On("SendFriendRequest", "sender1", "receiver1").Return(&repository.FriendRequest{}, nil).Once()

	h.SendFriendRequest(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockFriendService.AssertExpectations(t)

	// Test self request
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Set("user", "selfuser")
	c.Params = gin.Params{{Key: "username", Value: "selfuser"}}
	req, _ = http.NewRequest(http.MethodPost, "/users/selfuser/friend-request", nil)
	c.Request = req

	h.SendFriendRequest(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "cannot send friend request to self")
}

func TestFriendHandler_AcceptFriendRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.PUT("/me/friend-requests/:request_id/accept", h.AcceptFriendRequest)

	requestID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "accepter1")
	c.Params = gin.Params{{Key: "request_id", Value: requestID.String()}}
	req, _ := http.NewRequest(http.MethodPut, "/me/friend-requests/"+requestID.String()+"/accept", nil)
	c.Request = req

	mockFriendService.On("AcceptFriendRequest", requestID, "accepter1").Return(nil).Once()

	h.AcceptFriendRequest(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_DeclineFriendRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.PUT("/me/friend-requests/:request_id/decline", h.DeclineFriendRequest)

	requestID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "decliner1")
	c.Params = gin.Params{{Key: "request_id", Value: requestID.String()}}
	req, _ := http.NewRequest(http.MethodPut, "/me/friend-requests/"+requestID.String()+"/decline", nil)
	c.Request = req

	mockFriendService.On("DeclineFriendRequest", requestID, "decliner1").Return(nil).Once()

	h.DeclineFriendRequest(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_CancelFriendRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.DELETE("/me/friend-requests/:request_id", h.CancelFriendRequest)

	requestID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "canceller1")
	c.Params = gin.Params{{Key: "request_id", Value: requestID.String()}}
	req, _ := http.NewRequest(http.MethodDelete, "/me/friend-requests/"+requestID.String(), nil)
	c.Request = req

	mockFriendService.On("CancelFriendRequest", requestID, "canceller1").Return(nil).Once()

	h.CancelFriendRequest(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_RemoveFriend(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.DELETE("/me/friends/:username", h.RemoveFriend)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "user1")
	c.Params = gin.Params{{Key: "username", Value: "user2"}}
	req, _ := http.NewRequest(http.MethodDelete, "/me/friends/user2", nil)
	c.Request = req

	mockFriendService.On("RemoveFriend", "user1", "user2").Return(nil).Once()

	h.RemoveFriend(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockFriendService.AssertExpectations(t)

	// Test self remove
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Set("user", "selfuser")
	c.Params = gin.Params{{Key: "username", Value: "selfuser"}}
	req, _ = http.NewRequest(http.MethodDelete, "/me/friends/selfuser", nil)
	c.Request = req

	h.RemoveFriend(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "cannot remove self as friend")
}

func TestFriendHandler_BlockUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.POST("/users/:username/block", h.BlockUser)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "blocker1")
	c.Params = gin.Params{{Key: "username", Value: "blocked1"}}
	req, _ := http.NewRequest(http.MethodPost, "/users/blocked1/block", nil)
	c.Request = req

	mockFriendService.On("BlockUser", "blocker1", "blocked1").Return(&repository.BlockedUser{}, nil).Once()

	h.BlockUser(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockFriendService.AssertExpectations(t)

	// Test self block
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Set("user", "selfuser")
	c.Params = gin.Params{{Key: "username", Value: "selfuser"}}
	req, _ = http.NewRequest(http.MethodPost, "/users/selfuser/block", nil)
	c.Request = req

	h.BlockUser(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "cannot block self")
}

func TestFriendHandler_UnblockUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.DELETE("/users/:username/unblock", h.UnblockUser)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "unblocker1")
	c.Params = gin.Params{{Key: "username", Value: "unblocked1"}}
	req, _ := http.NewRequest(http.MethodDelete, "/users/unblocked1/unblock", nil)
	c.Request = req

	mockFriendService.On("UnblockUser", "unblocker1", "unblocked1").Return(nil).Once()

	h.UnblockUser(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_ListFriends(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.GET("/me/friends", h.ListFriends)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodGet, "/me/friends", nil)
	c.Request = req

	expectedUsers := []*repository.User{{Username: "friend1"}, {Username: "friend2"}}
	mockFriendService.On("ListFriends", "testuser").Return(expectedUsers, nil).Once()

	h.ListFriends(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "friend1")
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_ListIncomingFriendRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.GET("/me/friend-requests/incoming", h.ListIncomingFriendRequests)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodGet, "/me/friend-requests/incoming", nil)
	c.Request = req

	expectedRequests := []*repository.FriendRequest{{SenderUsername: "req1"}, {SenderUsername: "req2"}}
	mockFriendService.On("ListIncomingFriendRequests", "testuser").Return(expectedRequests, nil).Once()

	h.ListIncomingFriendRequests(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "req1")
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_ListOutgoingFriendRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.GET("/me/friend-requests/outgoing", h.ListOutgoingFriendRequests)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodGet, "/me/friend-requests/outgoing", nil)
	c.Request = req

	expectedRequests := []*repository.FriendRequest{{ReceiverUsername: "out1"}, {ReceiverUsername: "out2"}}
	mockFriendService.On("ListOutgoingFriendRequests", "testuser").Return(expectedRequests, nil).Once()

	h.ListOutgoingFriendRequests(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "out1")
	mockFriendService.AssertExpectations(t)
}

func TestFriendHandler_ListBlockedUsers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockFriendService := new(MockFriendService)
	h := handler.NewFriendHandler(mockFriendService)

	r := gin.Default()
	r.GET("/me/blocked-users", h.ListBlockedUsers)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodGet, "/me/blocked-users", nil)
	c.Request = req

	expectedBlockedUsers := []*repository.BlockedUser{{BlockedUsername: "blocked1"}, {BlockedUsername: "blocked2"}}
	mockFriendService.On("ListBlockedUsers", "testuser").Return(expectedBlockedUsers, nil).Once()

	h.ListBlockedUsers(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "blocked1")
	mockFriendService.AssertExpectations(t)
}
