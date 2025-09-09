// backend/internal/handler/auth.go
package handler

import (
	"log"
	"net/http"

	"exit/internal/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related requests.
type AuthHandler struct {
	authService  service.AuthService
	kakaoAuthSvc service.KakaoAuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService service.AuthService, kakaoAuthSvc service.KakaoAuthService) *AuthHandler {
	return &AuthHandler{authService: authService, kakaoAuthSvc: kakaoAuthSvc}
}

// LoginReq is the request body for the login endpoint.
type LoginReq struct {
	Username string `json:"username" binding:"required" example:"admin"`
	Password string `json:"password" binding:"required" example:"pass1234"`
}

type loginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Login handles user login.
// @Summary      User login
// @Description  Authenticates a user and returns JWT tokens.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        credentials body LoginReq true "User credentials"
// @Success      200 {object} loginResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "bad request")
		return
	}

	accessToken, refreshToken, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		respondError(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	respondJSON(c, http.StatusOK, loginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// RefreshReq is the request body for the refresh endpoint.
type RefreshReq struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type refreshResponse struct {
	AccessToken string `json:"access_token"`
}

// Refresh handles token refreshing.
// @Summary      Refresh access token
// @Description  Refreshes an access token using a valid refresh token.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        token body RefreshReq true "Refresh token"
// @Success      200 {object} refreshResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "bad request")
		return
	}

	accessToken, err := h.authService.Refresh(req.RefreshToken)
	if err != nil {
		respondError(c, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	respondJSON(c, http.StatusOK, refreshResponse{AccessToken: accessToken})
}

// Logout handles user logout.
// @Summary      User logout
// @Description  Invalidates a refresh token.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        token body RefreshReq true "Refresh token to invalidate"
// @Success      204 "No Content"
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	var req RefreshReq
	if err := c.ShouldBindJSON(&req); err != nil {
		// We can ignore the error here. If the token is missing or malformed,
		// we can just proceed as if the logout was successful.
		respondJSON(c, http.StatusNoContent, nil)
		return
	}

	if err := h.authService.Logout(req.RefreshToken); err != nil {
		log.Printf("failed to delete refresh token: %v", err)
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// ForgotPasswordReq is the request body for the forgot password endpoint.
type ForgotPasswordReq struct {
	Username string `json:"username" binding:"required"`
}

// ForgotPassword handles the forgot password request.
// @Summary      Forgot password
// @Description  Sends a password reset link to the user's email.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        body body ForgotPasswordReq true "Username"
// @Success      204 "No Content"
// @Router       /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "bad request")
		return
	}

	if err := h.authService.ForgotPassword(req.Username); err != nil {
		log.Printf("failed to send password reset email: %v", err)
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// ResetPasswordReq is the request body for the reset password endpoint.
type ResetPasswordReq struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=72"`
}

// ResetPassword handles the reset password request.
// @Summary      Reset password
// @Description  Resets the user's password using a valid token.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        body body ResetPasswordReq true "Token and new password"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Router       /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "bad request")
		return
	}

	if err := h.authService.ResetPassword(req.Token, req.NewPassword); err != nil {
		respondError(c, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// KakaoLogin handles Kakao OAuth callback.
// @Summary      Kakao Login Callback
// @Description  Handles the OAuth callback from Kakao, exchanges code for tokens, and logs in/registers user.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        code query string true "Authorization Code from Kakao"
// @Success      200 {object} loginResponse
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Router       /auth/kakao/callback [get]
func (h *AuthHandler) KakaoLogin(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		respondError(c, http.StatusBadRequest, "authorization code not provided")
		return
	}

	_, accessToken, refreshToken, err := h.kakaoAuthSvc.LoginOrRegister(code)
	if err != nil {
		log.Printf("Kakao login failed: %v", err)
		respondError(c, http.StatusInternalServerError, "kakao login failed")
		return
	}

	respondJSON(c, http.StatusOK, loginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}
