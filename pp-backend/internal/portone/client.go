// backend/internal/portone/client.go
package portone

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/config"
)

// Client represents PortOne API client
type Client struct {
	apiKey     string
	apiSecret  string
	baseURL    string
	httpClient *http.Client
	storeID    string
}

// Config holds PortOne configuration
type Config struct {
	APIKey    string
	APISecret string
	StoreID   string
	BaseURL   string // defaults to production URL
}

// NewClient creates a new PortOne client
func NewClient(config Config) *Client {
	baseURL := config.BaseURL
	if baseURL == "" {
		baseURL = "https://api.portone.io"
	}

	return &Client{
		apiKey:    config.APIKey,
		apiSecret: config.APISecret,
		storeID:   config.StoreID,
		baseURL:   baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewClientFromConfig creates a new PortOne client using global config
func NewClientFromConfig() *Client {
	portOneConfig := config.GetPortOneConfig()
	
	return &Client{
		apiKey:    portOneConfig.APIKey,
		apiSecret: portOneConfig.APISecret,
		storeID:   portOneConfig.StoreID,
		baseURL:   portOneConfig.BaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// IsConfigured checks if the client is configured with real values
func (c *Client) IsConfigured() bool {
	portOneConfig := config.GetPortOneConfig()
	return portOneConfig.IsProductionReady()
}

// PreparePayment prepares a payment session
func (c *Client) PreparePayment(req PreparePaymentRequest) (*PreparePaymentResponse, error) {
	url := fmt.Sprintf("%s/payments/prepare", c.baseURL)
	
	reqBody := PreparePaymentBody{
		MerchantUID: req.MerchantUID,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Name:        req.Name,
		BuyerName:   req.BuyerName,
		BuyerEmail:  req.BuyerEmail,
		BuyerTel:    req.BuyerTel,
		BuyerAddr:   req.BuyerAddr,
		BuyerPostcode: req.BuyerPostcode,
		NoticeURL:   req.NoticeURL,
		ReturnURL:   req.ReturnURL,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var response PreparePaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &response, nil
}

// VerifyPayment verifies payment completion
func (c *Client) VerifyPayment(impUID string) (*VerifyPaymentResponse, error) {
	url := fmt.Sprintf("%s/payments/%s", c.baseURL, impUID)

	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var response VerifyPaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &response, nil
}

// CancelPayment cancels a payment
func (c *Client) CancelPayment(req CancelPaymentRequest) (*CancelPaymentResponse, error) {
	url := fmt.Sprintf("%s/payments/cancel", c.baseURL)

	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var response CancelPaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &response, nil
}

// GetPaymentHistory retrieves payment history
func (c *Client) GetPaymentHistory(req PaymentHistoryRequest) (*PaymentHistoryResponse, error) {
	url := fmt.Sprintf("%s/payments", c.baseURL)

	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add query parameters
	q := httpReq.URL.Query()
	if req.From != nil {
		q.Add("from", fmt.Sprintf("%d", req.From.Unix()))
	}
	if req.To != nil {
		q.Add("to", fmt.Sprintf("%d", req.To.Unix()))
	}
	if req.Page > 0 {
		q.Add("page", fmt.Sprintf("%d", req.Page))
	}
	if req.Limit > 0 {
		q.Add("limit", fmt.Sprintf("%d", req.Limit))
	}
	httpReq.URL.RawQuery = q.Encode()

	httpReq.Header.Set("Authorization", c.getAuthHeader())

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var response PaymentHistoryResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &response, nil
}

// getAuthHeader creates authorization header
func (c *Client) getAuthHeader() string {
	// PortOne uses API key and secret for authentication
	return fmt.Sprintf("PortOne apikey=%s, secret=%s", c.apiKey, c.apiSecret)
}