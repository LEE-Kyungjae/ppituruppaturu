// backend/internal/service/auth_service.go

package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"exit/internal/config"
	"exit/internal/email"
	"exit/internal/repository"
)

var (
	ErrInvalidToken  = errors.New("invalid token")
	ErrInvalidClaims = errors.New("invalid claims")
	ErrTokenExpired  = errors.New("token expired")
)

// AuthService provides authentication-related services.
type AuthService interface {
	Login(username, password string) (string, string, error)
	Refresh(refreshToken string) (string, error)
	Logout(refreshToken string) error
	ForgotPassword(username string) error
	ResetPassword(token, newPassword string) error
}

type authService struct {
	userRepo               repository.UserRepository
	tokenRepo              repository.RefreshTokenRepository
	passwordResetTokenRepo repository.PasswordResetTokenRepository
	tokenSvc               *TokenService
	emailSender            email.Sender
	cfg                    *config.Config
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo repository.UserRepository, tokenRepo repository.RefreshTokenRepository, passwordResetTokenRepo repository.PasswordResetTokenRepository, tokenSvc *TokenService, emailSender email.Sender, cfg *config.Config) AuthService {
	return &authService{
		userRepo:               userRepo,
		tokenRepo:              tokenRepo,
		passwordResetTokenRepo: passwordResetTokenRepo,
		tokenSvc:               tokenSvc,
		emailSender:            emailSender,
		cfg:                    cfg,
	}
}

func (s *authService) Login(username, password string) (string, string, error) {
	user, err := s.userRepo.Find(username)
	if err != nil {
		return "", "", repository.ErrInvalidCredentials
	}

	if err := s.userRepo.ValidatePassword(user, password); err != nil {
		return "", "", repository.ErrInvalidCredentials
	}

	accessToken, err := s.tokenSvc.CreateAccessToken(user.Username, user.Role)
	if err != nil {
		return "", "", fmt.Errorf("could not create access token: %w", err)
	}

	refreshToken, refreshTTL, err := s.tokenSvc.CreateRefreshToken(user.Username)
	if err != nil {
		return "", "", fmt.Errorf("could not create refresh token: %w", err)
	}

	if err := s.tokenRepo.Store(refreshToken, user.Username, refreshTTL); err != nil {
		return "", "", fmt.Errorf("could not store refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

func (s *authService) Refresh(refreshToken string) (string, error) {
	claims, err := s.tokenSvc.ValidateToken(refreshToken, true)
	if err != nil {
		return "", ErrInvalidToken
	}

	subject, _ := claims["sub"].(string)
	user, err := s.userRepo.Find(subject)
	if err != nil {
		return "", fmt.Errorf("user not found: %w", err)
	}

	accessToken, err := s.tokenSvc.CreateAccessToken(user.Username, user.Role)
	if err != nil {
		return "", fmt.Errorf("could not create access token: %w", err)
	}

	return accessToken, nil
}

func (s *authService) Logout(refreshToken string) error {
	return s.tokenRepo.Delete(refreshToken)
}

func (s *authService) ForgotPassword(username string) error {
	user, err := s.userRepo.Find(username)
	if err != nil {
		// Don't return an error if the user is not found to prevent user enumeration attacks.
		return nil
	}

	// Generate a random token.
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("could not generate token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	// Store the token in the database.
	expiresAt := time.Now().Add(1 * time.Hour)
	if _, err := s.passwordResetTokenRepo.Create(token, user.Username, expiresAt); err != nil {
		return fmt.Errorf("could not store password reset token: %w", err)
	}

	// Send the password reset email.
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)
	body := fmt.Sprintf("Click the following link to reset your password: %s", resetLink)
	if err := s.emailSender.Send(user.Username, "Password Reset", body); err != nil {
		return fmt.Errorf("could not send password reset email: %w", err)
	}

	return nil
}

func (s *authService) ResetPassword(token, newPassword string) error {
	prt, err := s.passwordResetTokenRepo.FindByToken(token)
	if err != nil {
		return ErrInvalidToken
	}

	if time.Now().After(prt.ExpiresAt) {
		return ErrTokenExpired
	}

	if err := s.userRepo.UpdatePasswordHash(prt.UserID, newPassword); err != nil {
		return fmt.Errorf("could not update password: %w", err)
	}

	return s.passwordResetTokenRepo.Delete(token)
}

// TokenService provides functionality for creating and validating JWTs.
type TokenService struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

// NewTokenService creates a new TokenService.
func NewTokenService(accessSecret, refreshSecret string, accessTTLMin, refreshTTLDays int) *TokenService {
	return &TokenService{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     time.Duration(accessTTLMin) * time.Minute,
		refreshTTL:    time.Duration(refreshTTLDays) * 24 * time.Hour,
	}
}

// CreateAccessToken creates a new access token for a given user.
func (s *TokenService) CreateAccessToken(subject, role string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  subject,
		"role": role,
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(s.accessTTL).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.accessSecret)
}

// CreateRefreshToken creates a new refresh token.
func (s *TokenService) CreateRefreshToken(subject string) (string, time.Duration, error) {
	claims := jwt.MapClaims{
		"sub": subject,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(s.refreshTTL).Unix(),
		"typ": "refresh",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(s.refreshSecret)
	return signedToken, s.refreshTTL, err
}

// ValidateToken parses and validates a token string, returning the claims.
func (s *TokenService) ValidateToken(tokenStr string, isRefresh bool) (jwt.MapClaims, error) {
	secret := s.accessSecret
	if isRefresh {
		secret = s.refreshSecret
	}

	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken // Unexpected signing method
		}
		return secret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	if !tok.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidClaims
	}

	return claims, nil
}