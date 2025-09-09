package config

import (
	"os"
	"strconv"
)

// PortOneConfig holds all PortOne-related configuration
type PortOneConfig struct {
	StoreID         string `json:"store_id"`
	APIKey          string `json:"api_key"`
	APISecret       string `json:"api_secret"`
	BaseURL         string `json:"base_url"`
	WebhookEndpoint string `json:"webhook_endpoint"`
	MockMode        bool   `json:"mock_mode"`
}

// Mock configuration for development/testing
var mockConfig = PortOneConfig{
	StoreID:         "imp00000000", // Mock Store ID - replace with actual
	APIKey:          "mock_api_key_replace_with_actual", // Mock API Key - replace with actual
	APISecret:       "mock_api_secret_replace_with_actual", // Mock API Secret - replace with actual
	BaseURL:         "https://api.iamport.kr",
	WebhookEndpoint: "/api/portone/webhook",
	MockMode:        true,
}

// GetPortOneConfig returns PortOne configuration
// Falls back to mock values if environment variables are not set
func GetPortOneConfig() PortOneConfig {
	config := PortOneConfig{
		StoreID:         getEnvOrDefault("PORTONE_STORE_ID", mockConfig.StoreID),
		APIKey:          getEnvOrDefault("PORTONE_API_KEY", mockConfig.APIKey),
		APISecret:       getEnvOrDefault("PORTONE_API_SECRET", mockConfig.APISecret),
		BaseURL:         getEnvOrDefault("PORTONE_BASE_URL", mockConfig.BaseURL),
		WebhookEndpoint: getEnvOrDefault("PORTONE_WEBHOOK_ENDPOINT", mockConfig.WebhookEndpoint),
	}

	// Determine if we're in mock mode
	config.MockMode = config.StoreID == mockConfig.StoreID ||
		config.APIKey == mockConfig.APIKey ||
		config.APISecret == mockConfig.APISecret

	return config
}

// IsProductionReady checks if the configuration has real values
func (c PortOneConfig) IsProductionReady() bool {
	return !c.MockMode &&
		c.StoreID != mockConfig.StoreID &&
		c.APIKey != mockConfig.APIKey &&
		c.APISecret != mockConfig.APISecret
}

// GetClientSafeConfig returns configuration safe for client-side exposure
func (c PortOneConfig) GetClientSafeConfig() map[string]interface{} {
	return map[string]interface{}{
		"store_id":           c.StoreID,
		"base_url":           c.BaseURL,
		"webhook_endpoint":   c.WebhookEndpoint,
		"is_production_ready": c.IsProductionReady(),
		"mock_mode":          c.MockMode,
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBoolOrDefault(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}