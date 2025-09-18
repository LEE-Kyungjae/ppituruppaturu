// backend/internal/handler/user_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/handler"
	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type changePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type updateUserRequest struct {
	Role string `json:"role"`
}

func TestUserHandler_Me(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.GET("/me", h.Me)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	c.Set("role", "user")
	req, _ := http.NewRequest(http.MethodGet, "/me", nil)
	c.Request = req

	h.Me(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "testuser")
	assert.Contains(t, w.Body.String(), "user")
}

func TestUserHandler_GetMyProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.GET("/me/profile", h.GetMyProfile)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodGet, "/me/profile", nil)
	c.Request = req

	nickname := "TestNick"
	expectedUser := &repository.User{Username: "testuser", Nickname: &nickname}
	mockUserService.On("Find", "testuser").Return(expectedUser, nil).Once()

	h.GetMyProfile(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "TestNick")
	mockUserService.AssertExpectations(t)

	// Test user not found in context
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	req, _ = http.NewRequest(http.MethodGet, "/me/profile", nil)
	c.Request = req

	h.GetMyProfile(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "user not found in context")
}

func TestUserHandler_UpdateMyProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.PUT("/me/profile", h.UpdateMyProfile)

	// Test success
	nickname := "UpdatedNick"
	updateReq := repository.User{Nickname: &nickname}
	jsonValue, _ := json.Marshal(updateReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodPut, "/me/profile", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	updatedUser := &repository.User{Username: "testuser", Nickname: &nickname}
	mockUserService.On("UpdateProfile", mock.AnythingOfType("*repository.User")).Return(updatedUser, nil).Once()

	h.UpdateMyProfile(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "UpdatedNick")
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_ChangeMyPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{BcryptCost: 12}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.PUT("/me/password", h.ChangeMyPassword)

	// Test success
	changePassReq := changePasswordRequest{OldPassword: "oldpass", NewPassword: "newpass"}
	jsonValue, _ := json.Marshal(changePassReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodPut, "/me/password", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockUserService.On("Find", "testuser").Return(&repository.User{}, nil).Once()
	mockUserService.On("ChangePassword", "testuser", "oldpass", "newpass", 12).Return(nil).Once()

	h.ChangeMyPassword(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{BcryptCost: 12}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.POST("/users", h.Register)

	// Test success
	registerReq := registerRequest{Username: "newuser", Password: "password"}
	jsonValue, _ := json.Marshal(registerReq)

	expectedUser := &repository.User{Username: "newuser", Role: "user"}
	mockUserService.On("Register", "newuser", "password", 12).Return(expectedUser, nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/users", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "newuser")
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_Update(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.PUT("/admin/users/:username", h.Update)

	// Test success
	updateReq := updateUserRequest{Role: "admin"}
	jsonValue, _ := json.Marshal(updateReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "username", Value: "user_to_update"}}
	req, _ := http.NewRequest(http.MethodPut, "/admin/users/user_to_update", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	updatedUser := &repository.User{Username: "user_to_update", Role: "admin"}
	mockUserService.On("UpdateRole", "user_to_update", "admin").Return(updatedUser, nil).Once()

	h.Update(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "user_to_update")
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_Delete(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.DELETE("/admin/users/:username", h.Delete)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "username", Value: "user_to_delete"}}
	req, _ := http.NewRequest(http.MethodDelete, "/admin/users/user_to_delete", nil)
	c.Request = req

	mockUserService.On("Delete", "user_to_delete").Return(nil).Once()

	h.Delete(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_List(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.GET("/admin/users", h.List)

	// Test success
	expectedUsers := []*repository.User{{Username: "user1"}, {Username: "user2"}}
	mockUserService.On("List").Return(expectedUsers, nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/admin/users", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "user1")
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_DeactivateMyAccount(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.POST("/me/deactivate", h.DeactivateMyAccount)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodPost, "/me/deactivate", nil)
	c.Request = req

	mockUserService.On("DeactivateUser", "testuser").Return(nil).Once()

	h.DeactivateMyAccount(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestUserHandler_DeleteMyAccount(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := new(mocks.MockUserService)
	cfg := &config.Config{}
	h := handler.NewUserHandler(mockUserService, cfg)

	r := gin.Default()
	r.DELETE("/me", h.DeleteMyAccount)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "testuser")
	req, _ := http.NewRequest(http.MethodDelete, "/me", nil)
	c.Request = req

	mockUserService.On("DeleteUser", "testuser").Return(nil).Once()

	h.DeleteMyAccount(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockUserService.AssertExpectations(t)
}