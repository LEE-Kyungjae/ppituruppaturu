// backend/internal/handler/auth_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/handler"
	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAuthHandler_Login(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuthSvc := new(mocks.MockAuthService)
	mockKakaoAuthSvc := new(mocks.MockKakaoAuthService)
	h := handler.NewAuthHandler(mockAuthSvc, mockKakaoAuthSvc)

	r := gin.Default()
	r.POST("/login", h.Login)

	// Test success
	loginReq := handler.LoginReq{Username: "testuser", Password: "password"}
	jsonValue, _ := json.Marshal(loginReq)

	mockAuthSvc.On("Login", "testuser", "password").Return("access_token_val", "refresh_token_val", nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "access_token_val")
	assert.Contains(t, w.Body.String(), "refresh_token_val")
	mockAuthSvc.AssertExpectations(t)

	// Test invalid credentials
	loginReq = handler.LoginReq{Username: "wronguser", Password: "wrongpass"}
	jsonValue, _ = json.Marshal(loginReq)
	mockAuthSvc.On("Login", "wronguser", "wrongpass").Return("", "", repository.ErrInvalidCredentials).Once()

	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid credentials")
	mockAuthSvc.AssertExpectations(t)
}

func TestAuthHandler_Refresh(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuthSvc := new(mocks.MockAuthService)
	mockKakaoAuthSvc := new(mocks.MockKakaoAuthService)
	h := handler.NewAuthHandler(mockAuthSvc, mockKakaoAuthSvc)

	r := gin.Default()
	r.POST("/refresh", h.Refresh)

	// Test success
	refreshReq := handler.RefreshReq{RefreshToken: "valid_refresh_token"}
	jsonValue, _ := json.Marshal(refreshReq)

	mockAuthSvc.On("Refresh", "valid_refresh_token").Return("new_access_token", nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/refresh", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "new_access_token")
	mockAuthSvc.AssertExpectations(t)

	// Test invalid refresh token
	refreshReq = handler.RefreshReq{RefreshToken: "invalid_refresh_token"}
	jsonValue, _ = json.Marshal(refreshReq)
	mockAuthSvc.On("Refresh", "invalid_refresh_token").Return("", errors.New("invalid token")).Once()

	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/refresh", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid refresh token")
	mockAuthSvc.AssertExpectations(t)
}

func TestAuthHandler_Logout(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuthSvc := new(mocks.MockAuthService)
	mockKakaoAuthSvc := new(mocks.MockKakaoAuthService)
	h := handler.NewAuthHandler(mockAuthSvc, mockKakaoAuthSvc)

	r := gin.Default()
	r.POST("/logout", h.Logout)

	// Test success
	logoutReq := handler.RefreshReq{RefreshToken: "token_to_logout"}
	jsonValue, _ := json.Marshal(logoutReq)
	mockAuthSvc.On("Logout", "token_to_logout").Return(nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/logout", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockAuthSvc.AssertExpectations(t)

	// Test malformed request (should still return 204)
	jsonValue = []byte(`{"refresh_token":}`)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/logout", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestAuthHandler_KakaoLogin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuthSvc := new(mocks.MockAuthService)
	mockKakaoAuthSvc := new(mocks.MockKakaoAuthService)
	h := handler.NewAuthHandler(mockAuthSvc, mockKakaoAuthSvc)

	r := gin.Default()
	r.GET("/kakao/callback", h.KakaoLogin)

	// Test success
	mockKakaoAuthSvc.On("LoginOrRegister", "auth_code_valid").Return(&repository.User{}, "access_token_kakao", "refresh_token_kakao", nil).Once()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/kakao/callback?code=auth_code_valid", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "access_token_kakao")
	assert.Contains(t, w.Body.String(), "refresh_token_kakao")
	mockKakaoAuthSvc.AssertExpectations(t)

	// Test missing code
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/kakao/callback", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "authorization code not provided")

	// Test Kakao login failure
	mockKakaoAuthSvc.On("LoginOrRegister", "auth_code_fail").Return(&repository.User{}, "", "", errors.New("kakao api error")).Once()
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/kakao/callback?code=auth_code_fail", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "kakao login failed")
	mockKakaoAuthSvc.AssertExpectations(t)
}