// shared/types/auth.go
package types

import "time"

// SocialProvider represents supported social login providers
type SocialProvider string

const (
	ProviderGoogle SocialProvider = "google"
	ProviderKakao  SocialProvider = "kakao"
	ProviderNaver  SocialProvider = "naver"
)

// SocialLoginRequest represents a social login request
type SocialLoginRequest struct {
	Provider     SocialProvider `json:"provider"`
	Code         string         `json:"code"`
	State        string         `json:"state"`
	RedirectURI  string         `json:"redirect_uri"`
}

// SocialUserInfo represents user info from social providers
type SocialUserInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
	Provider string `json:"provider"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	User         UserInfo  `json:"user"`
}

// UserInfo represents user information
type UserInfo struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Points   int    `json:"points"`
	Avatar   string `json:"avatar"`
}