// backend/internal/handler/community_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
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

// MockCommunityService is a mock implementation of service.CommunityService
type MockCommunityService struct {
	mock.Mock
}

func (m *MockCommunityService) CreatePost(authorUsername, title, content string) (*repository.Post, error) {
	args := m.Called(authorUsername, title, content)
	return args.Get(0).(*repository.Post), args.Error(1)
}

func (m *MockCommunityService) GetPostByID(postID uuid.UUID) (*repository.Post, error) {
	args := m.Called(postID)
	return args.Get(0).(*repository.Post), args.Error(1)
}

func (m *MockCommunityService) ListPosts(limit, offset int) ([]*repository.Post, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]*repository.Post), args.Error(1)
}

func (m *MockCommunityService) UpdatePost(postID uuid.UUID, authorUsername, title, content string) (*repository.Post, error) {
	args := m.Called(postID, authorUsername, title, content)
	return args.Get(0).(*repository.Post), args.Error(1)
}

func (m *MockCommunityService) DeletePost(postID uuid.UUID, authorUsername string) error {
	args := m.Called(postID, authorUsername)
	return args.Error(0)
}

func (m *MockCommunityService) CreateComment(postID uuid.UUID, authorUsername, content string) (*repository.Comment, error) {
	args := m.Called(postID, authorUsername, content)
	return args.Get(0).(*repository.Comment), args.Error(1)
}

func (m *MockCommunityService) GetCommentByID(commentID uuid.UUID) (*repository.Comment, error) {
	args := m.Called(commentID)
	return args.Get(0).(*repository.Comment), args.Error(1)
}

func (m *MockCommunityService) ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*repository.Comment, error) {
	args := m.Called(postID, limit, offset)
	return args.Get(0).([]*repository.Comment), args.Error(1)
}

func (m *MockCommunityService) UpdateComment(commentID uuid.UUID, authorUsername, content string) (*repository.Comment, error) {
	args := m.Called(commentID, authorUsername, content)
	return args.Get(0).(*repository.Comment), args.Error(1)
}

func (m *MockCommunityService) DeleteComment(commentID uuid.UUID, authorUsername string) error {
	args := m.Called(commentID, authorUsername)
	return args.Error(0)
}

func TestCommunityHandler_CreatePost(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.POST("/posts", h.CreatePost)

	// Test success
	createReq := handler.CreatePostRequest{Title: "Test Post", Content: "This is a test post."}
	jsonValue, _ := json.Marshal(createReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodPost, "/posts", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockCommunityService.On("CreatePost", "testuser", "Test Post", "This is a test post.").Return(&repository.Post{}, nil).Once()

	h.CreatePost(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_GetPostByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.GET("/posts/:post_id", h.GetPostByID)

	postID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "post_id", Value: postID.String()}}
	req, _ := http.NewRequest(http.MethodGet, "/posts/"+postID.String(), nil)
	c.Request = req

	mockCommunityService.On("GetPostByID", postID).Return(&repository.Post{}, nil).Once()

	h.GetPostByID(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_ListPosts(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.GET("/posts", h.ListPosts)

	// Set up mock BEFORE making the request
	expectedPosts := []*repository.Post{{Title: "Post1"}, {Title: "Post2"}}
	mockCommunityService.On("ListPosts", 5, 0).Return(expectedPosts, nil).Once()

	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/posts?limit=5&offset=0", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_UpdatePost(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.PUT("/posts/:post_id", h.UpdatePost)

	postID := uuid.New()
	// Test success
	updateReq := handler.UpdatePostRequest{Title: "Updated Title", Content: "Updated Content"}
	jsonValue, _ := json.Marshal(updateReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Params = gin.Params{{Key: "post_id", Value: postID.String()}}
	req, _ := http.NewRequest(http.MethodPut, "/posts/"+postID.String(), bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockCommunityService.On("UpdatePost", postID, "testuser", "Updated Title", "Updated Content").Return(&repository.Post{}, nil).Once()

	h.UpdatePost(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_DeletePost(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.DELETE("/posts/:post_id", h.DeletePost)

	postID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Params = gin.Params{{Key: "post_id", Value: postID.String()}}
	req, _ := http.NewRequest(http.MethodDelete, "/posts/"+postID.String(), nil)
	c.Request = req

	mockCommunityService.On("DeletePost", postID, "testuser").Return(nil).Once()

	h.DeletePost(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_CreateComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.POST("/posts/:post_id/comments", h.CreateComment)

	postID := uuid.New()
	// Test success
	createReq := handler.CreateCommentRequest{Content: "Test Comment"}
	jsonValue, _ := json.Marshal(createReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Params = gin.Params{{Key: "post_id", Value: postID.String()}}
	req, _ := http.NewRequest(http.MethodPost, "/posts/"+postID.String()+"/comments", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockCommunityService.On("CreateComment", postID, "testuser", "Test Comment").Return(&repository.Comment{}, nil).Once()

	h.CreateComment(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_GetCommentByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.GET("/comments/:comment_id", h.GetCommentByID)

	commentID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "comment_id", Value: commentID.String()}}
	req, _ := http.NewRequest(http.MethodGet, "/comments/"+commentID.String(), nil)
	c.Request = req

	mockCommunityService.On("GetCommentByID", commentID).Return(&repository.Comment{}, nil).Once()

	h.GetCommentByID(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_ListCommentsByPostID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.GET("/posts/:post_id/comments", h.ListCommentsByPostID)

	postID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/posts/"+postID.String()+"/comments?limit=5&offset=0", nil)
	r.ServeHTTP(w, req)

	expectedComments := []*repository.Comment{{Content: "Comment1"}, {Content: "Comment2"}}
	mockCommunityService.On("ListCommentsByPostID", postID, 5, 0).Return(expectedComments, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_UpdateComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.PUT("/comments/:comment_id", h.UpdateComment)

	commentID := uuid.New()
	// Test success
	updateReq := handler.UpdateCommentRequest{Content: "Updated Content"}
	jsonValue, _ := json.Marshal(updateReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Params = gin.Params{{Key: "comment_id", Value: commentID.String()}}
	req, _ := http.NewRequest(http.MethodPut, "/comments/"+commentID.String(), bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockCommunityService.On("UpdateComment", commentID, "testuser", "Updated Content").Return(&repository.Comment{}, nil).Once()

	h.UpdateComment(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockCommunityService.AssertExpectations(t)
}

func TestCommunityHandler_DeleteComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockCommunityService := new(MockCommunityService)
	h := handler.NewCommunityHandler(mockCommunityService)

	r := gin.Default()
	r.DELETE("/comments/:comment_id", h.DeleteComment)

	commentID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Params = gin.Params{{Key: "comment_id", Value: commentID.String()}}
	req, _ := http.NewRequest(http.MethodDelete, "/comments/"+commentID.String(), nil)
	c.Request = req

	mockCommunityService.On("DeleteComment", commentID, "testuser").Return(nil).Once()

	h.DeleteComment(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockCommunityService.AssertExpectations(t)
}
