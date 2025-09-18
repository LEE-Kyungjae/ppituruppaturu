// backend/internal/kakao/client.go

package kakao

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/config"
)

const (
	defaultUserAgent = "exit-kakao-client/1.0"
	defaultTimeout   = 10 * time.Second
	maxBodyBytes     = 1 << 20 // 1 MiB

	tokenURL       = "https://kauth.kakao.com/oauth/token"
	userInfoURL    = "https://kapi.kakao.com/v2/user/me"
	disconnectURL  = "https://kapi.kakao.com/v1/user/unlink"
	contentTypeFrm = "application/x-www-form-urlencoded"
)

// Client is a Kakao API client with sane defaults and retries.
type Client struct {
	cfg        *config.Config
	httpClient *http.Client

	// retry policy
	maxRetries int
	baseDelay  time.Duration
	maxDelay   time.Duration
}

// Option to customize Client.
type Option func(*Client)

func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) {
		if hc != nil {
			c.httpClient = hc
		}
	}
}

func WithRetry(maxRetries int, baseDelay, maxDelay time.Duration) Option {
	return func(c *Client) {
		if maxRetries >= 0 {
			c.maxRetries = maxRetries
		}
		if baseDelay > 0 {
			c.baseDelay = baseDelay
		}
		if maxDelay > 0 {
			c.maxDelay = maxDelay
		}
	}
}

func NewClient(cfg *config.Config, opts ...Option) *Client {
	c := &Client{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
		maxRetries: 2,
		baseDelay:  200 * time.Millisecond,
		maxDelay:   3 * time.Second,
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// ---------- Models ----------

type TokenResponse struct {
	AccessToken           string `json:"access_token"`
	TokenType             string `json:"token_type"`
	RefreshToken          string `json:"refresh_token"`
	ExpiresIn             int    `json:"expires_in"`
	Scope                 string `json:"scope"`
	RefreshTokenExpiresIn int    `json:"refresh_token_expires_in"`
}

type RefreshRequest struct {
	RefreshToken string
}

type UserInfoResponse struct {
	ID           int64 `json:"id"`
	KakaoAccount struct {
		Profile struct {
			Nickname          string `json:"nickname"`
			ProfileImageURL   string `json:"profile_image_url"`
			ThumbnailImageURL string `json:"thumbnail_image_url"`
		} `json:"profile"`
		Email string `json:"email"`
	} `json:"kakao_account"`
}

// KakaoError is a normalized error type for Kakao API failures.
type KakaoError struct {
	Status int    // HTTP status code
	Code   string // oauth2 style "error" or number as string for API errors
	Msg    string // error_description / msg
	Raw    string // raw body (truncated)
}

func (e *KakaoError) Error() string {
	return fmt.Sprintf("kakao api error: status=%d code=%s msg=%s", e.Status, e.Code, e.Msg)
}

// parseKakaoError tries to parse both OAuth and REST error shapes.
func parseKakaoError(status int, body []byte) *KakaoError {
	type oauthErr struct {
		Error            string `json:"error"`
		ErrorDescription string `json:"error_description"`
	}
	type apiErr struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}
	ke := &KakaoError{Status: status, Raw: string(body)}

	var oe oauthErr
	if json.Unmarshal(body, &oe) == nil && (oe.Error != "" || oe.ErrorDescription != "") {
		ke.Code = oe.Error
		ke.Msg = oe.ErrorDescription
		return ke
	}
	var ae apiErr
	if json.Unmarshal(body, &ae) == nil && (ae.Code != 0 || ae.Msg != "") {
		ke.Code = strconv.Itoa(ae.Code)
		ke.Msg = ae.Msg
		return ke
	}
	// Fallback: try to capture "error" or "message" generically
	var generic map[string]any
	if json.Unmarshal(body, &generic) == nil {
		if v, ok := generic["error"].(string); ok && v != "" {
			ke.Code = v
		}
		if v, ok := generic["message"].(string); ok && v != "" {
			ke.Msg = v
		}
	}
	return ke
}

// ---------- Public Methods ----------

// GetToken exchanges an authorization code for Kakao tokens.
// Supports client_secret if configured.
func (c *Client) GetToken(ctx context.Context, code string) (*TokenResponse, error) {
	if code == "" {
		return nil, errors.New("authorization code is empty")
	}
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", c.cfg.KakaoClientID)
	data.Set("redirect_uri", c.cfg.KakaoRedirectURI)
	data.Set("code", code)
	if v := strings.TrimSpace(c.cfg.KakaoClientSecret); v != "" {
		data.Set("client_secret", v)
	}

	var res TokenResponse
	if err := c.postFormJSON(ctx, tokenURL, data, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// RefreshToken uses a refresh token to obtain a new access token.
func (c *Client) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	if refreshToken == "" {
		return nil, errors.New("refresh token is empty")
	}
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("client_id", c.cfg.KakaoClientID)
	data.Set("refresh_token", refreshToken)
	if v := strings.TrimSpace(c.cfg.KakaoClientSecret); v != "" {
		data.Set("client_secret", v)
	}

	var res TokenResponse
	if err := c.postFormJSON(ctx, tokenURL, data, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// GetUserInfo retrieves the authenticated user's profile.
func (c *Client) GetUserInfo(ctx context.Context, accessToken string) (*UserInfoResponse, error) {
	if accessToken == "" {
		return nil, errors.New("access token is empty")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, userInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create user info request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", defaultUserAgent)

	var res UserInfoResponse
	if err := c.doJSON(req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// Disconnect unlinks the user. You can pass accessToken (for current user) or
// use admin key+target_id 방식이 필요한 경우는 별도 구현 필요.
// 여기서는 accessToken 기반 언링크를 제공합니다.
func (c *Client) Disconnect(ctx context.Context, accessToken string) error {
	if accessToken == "" {
		return errors.New("access token is empty")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, disconnectURL, nil)
	if err != nil {
		return fmt.Errorf("create disconnect request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", defaultUserAgent)

	return c.doNoBody(req)
}

// ---------- Internal HTTP Helpers ----------

func (c *Client) postFormJSON(ctx context.Context, endpoint string, form url.Values, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("create POST form request: %w", err)
	}
	req.Header.Set("Content-Type", contentTypeFrm)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", defaultUserAgent)

	return c.doJSON(req, out)
}

func (c *Client) doJSON(req *http.Request, out any) error {
	resp, body, err := c.doWithRetry(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return parseKakaoError(resp.StatusCode, body)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("decode json: %w", err)
	}
	return nil
}

func (c *Client) doNoBody(req *http.Request) error {
	resp, body, err := c.doWithRetry(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return parseKakaoError(resp.StatusCode, body)
	}
	return nil
}

// doWithRetry executes the request with simple exponential backoff on 429/5xx.
// Respects Retry-After (seconds or HTTP-date).
func (c *Client) doWithRetry(req *http.Request) (*http.Response, []byte, error) {
	var lastErr error
	attempts := c.maxRetries + 1
	for i := 0; i < attempts; i++ {
		resp, err := c.httpClient.Do(req)
		if err != nil {
			// network or context error: retry if context not canceled
			if ctxErr := req.Context().Err(); ctxErr != nil {
				return nil, nil, ctxErr
			}
			lastErr = fmt.Errorf("http do: %w", err)
			sleep(req.Context(), backoff(i, c.baseDelay, c.maxDelay))
			continue
		}

		limitedReader := io.LimitReader(resp.Body, maxBodyBytes)
		body, readErr := io.ReadAll(limitedReader)
		if readErr != nil {
			resp.Body.Close()
			return resp, nil, fmt.Errorf("read body: %w", readErr)
		}

		// success
		if resp.StatusCode < 400 {
			return resp, body, nil
		}

		// 429 or 5xx: retryable
		if resp.StatusCode == http.StatusTooManyRequests || (resp.StatusCode >= 500 && resp.StatusCode <= 599) {
			// honor Retry-After
			if ra := parseRetryAfter(resp.Header.Get("Retry-After")); ra > 0 {
				resp.Body.Close()
				sleep(req.Context(), ra)
				lastErr = parseKakaoError(resp.StatusCode, body)
				continue
			}
			// otherwise exponential backoff
			resp.Body.Close()
			sleep(req.Context(), backoff(i, c.baseDelay, c.maxDelay))
			lastErr = parseKakaoError(resp.StatusCode, body)
			continue
		}

		// non-retryable
		return resp, body, parseKakaoError(resp.StatusCode, body)
	}
	if lastErr == nil {
		lastErr = errors.New("request failed without specific error")
	}
	return nil, nil, lastErr
}

// ---------- Utilities ----------

func parseRetryAfter(v string) time.Duration {
	if v == "" {
		return 0
	}
	// seconds
	if secs, err := strconv.Atoi(strings.TrimSpace(v)); err == nil && secs > 0 {
		return time.Duration(secs) * time.Second
	}
	// HTTP-date
	if t, err := http.ParseTime(v); err == nil {
		d := time.Until(t)
		if d > 0 {
			return d
		}
	}
	return 0
}

func backoff(attempt int, base, max time.Duration) time.Duration {
	if base <= 0 {
		base = 200 * time.Millisecond
	}
	if max <= 0 {
		max = 3 * time.Second
	}
	// expo: base * 2^attempt with cap
	delay := time.Duration(float64(base) * math.Pow(2, float64(attempt)))
	if delay > max {
		delay = max
	}
	// small jitter
	j := time.Duration(float64(delay) * 0.2)
	return delay - j/2 + time.Duration(randInt63n(int64(j)))
}

func sleep(ctx context.Context, d time.Duration) {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
	case <-t.C:
	}
}

// cheap rand without importing math/rand globally; you may replace with rand.New if needed.
var seed = time.Now().UnixNano()

func randInt63n(n int64) int64 {
	// xorshift
	seed ^= seed << 13
	seed ^= seed >> 7
	seed ^= seed << 17
	if seed < 0 {
		seed = -seed
	}
	if n <= 0 {
		return 0
	}
	return seed % n
}