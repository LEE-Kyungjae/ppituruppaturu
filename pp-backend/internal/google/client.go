// backend/internal/google/client.go
package google

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
	
	"github.com/pitturu-ppaturu/backend/internal/config"
)

// GoogleUser represents user info from Google
type GoogleUser struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// TokenResponse represents Google's token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// Client represents Google OAuth client
type Client struct {
	clientID     string
	clientSecret string
	httpClient   *http.Client
}

// NewClient creates a new Google OAuth client
func NewClient(cfg *config.Config) *Client {
	return &Client{
		clientID:     cfg.GoogleClientID,
		clientSecret: cfg.GoogleClientSecret,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ExchangeCode exchanges authorization code for access token
func (c *Client) ExchangeCode(code, redirectURI string) (*TokenResponse, error) {
	data := url.Values{}
	data.Set("client_id", c.clientID)
	data.Set("client_secret", c.clientSecret)
	data.Set("code", code)
	data.Set("grant_type", "authorization_code")
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", "https://oauth2.googleapis.com/token", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google API error: %s", string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &tokenResp, nil
}

// GetUserInfo retrieves user info using access token
func (c *Client) GetUserInfo(accessToken string) (*GoogleUser, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google API error: %s", string(body))
	}

	var user GoogleUser
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &user, nil
}