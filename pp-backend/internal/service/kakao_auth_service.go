// backend/internal/service/kakao_auth_service.go

package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/kakao"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
)

type KakaoAuthService interface {
	LoginOrRegister(authCode string) (*repository.User, string, string, error)
	SocialLoginOrRegister(kakaoID, nickname, email, profileImage, accessToken string) (*repository.User, string, string, error)
}

type kakaoAuthService struct {
	kakaoClient *kakao.Client
	userRepo    repository.UserRepository
	tokenService *TokenService
	cfg         *config.Config
}

func NewKakaoAuthService(kakaoClient *kakao.Client, userRepo repository.UserRepository, tokenService *TokenService, cfg *config.Config) KakaoAuthService {
	return &kakaoAuthService{
		kakaoClient: kakaoClient,
		userRepo:    userRepo,
		tokenService: tokenService,
		cfg:         cfg,
	}
}

func (s *kakaoAuthService) LoginOrRegister(authCode string) (*repository.User, string, string, error) {
	// 1. Exchange auth code for Kakao tokens
	kakaoTokenRes, err := s.kakaoClient.GetToken(context.Background(), authCode)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to get kakao token: %w", err)
	}

	// 2. Get Kakao user info
	kakaoUserInfo, err := s.kakaoClient.GetUserInfo(context.Background(), kakaoTokenRes.AccessToken)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to get kakao user info: %w", err)
	}

	kakaoID := fmt.Sprintf("kakao_%d", kakaoUserInfo.ID)

	// 3. Check if user exists in our DB
	user, err := s.userRepo.Find(kakaoID)
	if err != nil && !errors.Is(err, serviceErrors.ErrUserNotFound) {
		return nil, "", "", fmt.Errorf("failed to find user by kakao ID: %w", err)
	}

	if errors.Is(err, serviceErrors.ErrUserNotFound) {
		// 4. New user: Register them
		// For social login, we might not have a password, so we generate a dummy one or use a specific flag
		// For simplicity, let's use KakaoID as username and a dummy password
		generatedPassword := uuid.New().String() // Generate a random password
		user, err = s.userRepo.Create(kakaoID, generatedPassword, "user", s.cfg.BcryptCost, sql.NullString{String: kakaoID, Valid: true})
		if err != nil {
			return nil, "", "", fmt.Errorf("failed to create new user from kakao: %w", err)
		}
	}

	// 5. Generate our own JWTs
	accessToken, err := s.tokenService.CreateAccessToken(user.Username, user.Role)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to create access token: %w", err)
	}

	refreshToken, _, err := s.tokenService.CreateRefreshToken(user.Username)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	// Store refresh token (optional, depending on refresh token strategy)
	// For now, we'll just return it.

	return user, accessToken, refreshToken, nil
}

func (s *kakaoAuthService) SocialLoginOrRegister(kakaoID, nickname, email, profileImage, accessToken string) (*repository.User, string, string, error) {
	// Validate Kakao access token by calling Kakao API
	_, err := s.kakaoClient.GetUserInfo(context.Background(), accessToken)
	if err != nil {
		return nil, "", "", fmt.Errorf("invalid kakao access token: %w", err)
	}

	// Create unique username with kakao prefix
	username := fmt.Sprintf("kakao_%s", kakaoID)

	// Check if user exists in our DB
	user, err := s.userRepo.Find(username)
	if err != nil && !errors.Is(err, serviceErrors.ErrUserNotFound) {
		return nil, "", "", fmt.Errorf("failed to find user by kakao ID: %w", err)
	}

	if errors.Is(err, serviceErrors.ErrUserNotFound) {
		// New user: Register them with nickname as display name
		generatedPassword := uuid.New().String() // Generate a random password for security
		user, err = s.userRepo.Create(username, generatedPassword, "user", s.cfg.BcryptCost, sql.NullString{String: nickname, Valid: true})
		if err != nil {
			return nil, "", "", fmt.Errorf("failed to create new user from kakao: %w", err)
		}
	}

	// Generate our own JWTs
	accessTokenJWT, err := s.tokenService.CreateAccessToken(user.Username, user.Role)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to create access token: %w", err)
	}

	refreshToken, _, err := s.tokenService.CreateRefreshToken(user.Username)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	return user, accessTokenJWT, refreshToken, nil
}