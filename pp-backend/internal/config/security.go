package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// SecurityConfig holds all security-related configuration
type SecurityConfig struct {
	JWTSecret          string
	RefreshSecret      string
	JWTExpiry          time.Duration
	RefreshExpiry      time.Duration
	BCryptCost         int
	RateLimitRPS       int
	RateLimitBurst     int
	AllowedOrigins     []string
	RequireHTTPS       bool
	CSRFTokenLength    int
	SessionTimeout     time.Duration
	MaxLoginAttempts   int
	LockoutDuration    time.Duration
}

// ProductionSecurityValidation validates security config for production
type ProductionSecurityValidation struct {
	MinJWTSecretLength    int
	MinRefreshSecretLength int
	MinBCryptCost         int
	MaxSessionTimeout     time.Duration
}

var productionValidation = ProductionSecurityValidation{
	MinJWTSecretLength:    64, // 32 bytes hex = 64 chars
	MinRefreshSecretLength: 64,
	MinBCryptCost:         12,
	MaxSessionTimeout:     24 * time.Hour,
}

// GetSecurityConfig returns security configuration with validation
func GetSecurityConfig() (*SecurityConfig, error) {
	config := &SecurityConfig{}
	
	// JWT Configuration
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		if isProduction() {
			return nil, errors.New("JWT_SECRET is required in production")
		}
		jwtSecret = generateSecureSecret(32) // 32 bytes = 256 bits
	}
	
	refreshSecret := os.Getenv("REFRESH_SECRET")
	if refreshSecret == "" {
		if isProduction() {
			return nil, errors.New("REFRESH_SECRET is required in production")
		}
		refreshSecret = generateSecureSecret(32)
	}
	
	// Validate secret length in production
	if isProduction() {
		if len(jwtSecret) < productionValidation.MinJWTSecretLength {
			return nil, fmt.Errorf("JWT_SECRET must be at least %d characters in production", productionValidation.MinJWTSecretLength)
		}
		if len(refreshSecret) < productionValidation.MinRefreshSecretLength {
			return nil, fmt.Errorf("REFRESH_SECRET must be at least %d characters in production", productionValidation.MinRefreshSecretLength)
		}
		
		// Check for weak secrets
		if isWeakSecret(jwtSecret) {
			return nil, errors.New("JWT_SECRET appears to be weak (common patterns detected)")
		}
		if isWeakSecret(refreshSecret) {
			return nil, errors.New("REFRESH_SECRET appears to be weak (common patterns detected)")
		}
	}
	
	config.JWTSecret = jwtSecret
	config.RefreshSecret = refreshSecret
	
	// Token expiry
	jwtExpiryMinutes := getEnvInt("ACCESS_TTL_MIN", 15)
	refreshExpiryDays := getEnvInt("REFRESH_TTL_DAYS", 7)
	
	config.JWTExpiry = time.Duration(jwtExpiryMinutes) * time.Minute
	config.RefreshExpiry = time.Duration(refreshExpiryDays) * 24 * time.Hour
	
	// BCrypt cost
	config.BCryptCost = getEnvInt("BCRYPT_COST", 12)
	if isProduction() && config.BCryptCost < productionValidation.MinBCryptCost {
		return nil, fmt.Errorf("BCRYPT_COST must be at least %d in production", productionValidation.MinBCryptCost)
	}
	
	// Rate limiting
	config.RateLimitRPS = getEnvInt("RATE_RPS", 10)
	config.RateLimitBurst = getEnvInt("RATE_BURST", 20)
	
	// CORS origins
	originsStr := getEnvOrDefault("CORS_ORIGINS", "http://localhost:3000")
	config.AllowedOrigins = strings.Split(originsStr, ",")
	
	// HTTPS requirement
	config.RequireHTTPS = getEnvBool("REQUIRE_HTTPS", isProduction())
	
	// CSRF protection
	config.CSRFTokenLength = getEnvInt("CSRF_TOKEN_LENGTH", 32)
	
	// Session configuration
	sessionTimeoutHours := getEnvInt("SESSION_TIMEOUT_HOURS", 24)
	config.SessionTimeout = time.Duration(sessionTimeoutHours) * time.Hour
	
	if isProduction() && config.SessionTimeout > productionValidation.MaxSessionTimeout {
		return nil, fmt.Errorf("SESSION_TIMEOUT cannot exceed %v in production", productionValidation.MaxSessionTimeout)
	}
	
	// Login attempt limiting
	config.MaxLoginAttempts = getEnvInt("MAX_LOGIN_ATTEMPTS", 5)
	lockoutMinutes := getEnvInt("LOCKOUT_DURATION_MIN", 15)
	config.LockoutDuration = time.Duration(lockoutMinutes) * time.Minute
	
	return config, nil
}

// generateSecureSecret generates a cryptographically secure random secret
func generateSecureSecret(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Sprintf("Failed to generate secure secret: %v", err))
	}
	return hex.EncodeToString(bytes)
}

// isWeakSecret checks for common weak secret patterns
func isWeakSecret(secret string) bool {
	weakPatterns := []string{
		"secret",
		"password",
		"12345",
		"qwerty",
		"admin",
		"test",
		"demo",
		"your-secret",
		"change-me",
	}
	
	lowerSecret := strings.ToLower(secret)
	for _, pattern := range weakPatterns {
		if strings.Contains(lowerSecret, pattern) {
			return true
		}
	}
	
	// Check for repeated characters
	if len(secret) > 0 {
		repeatCount := 0
		lastChar := rune(secret[0])
		for _, char := range secret {
			if char == lastChar {
				repeatCount++
				if repeatCount > 3 {
					return true
				}
			} else {
				repeatCount = 1
				lastChar = char
			}
		}
	}
	
	return false
}

// isProduction checks if we're running in production environment
func isProduction() bool {
	env := strings.ToLower(os.Getenv("APP_ENV"))
	ginMode := strings.ToLower(os.Getenv("GIN_MODE"))
	return env == "production" || ginMode == "release"
}

// getEnvInt gets integer environment variable with default
func getEnvInt(key string, defaultValue int) int {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

// getEnvBool gets boolean environment variable with default
func getEnvBool(key string, defaultValue bool) bool {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

// GenerateSecrets generates secure secrets for initial setup
func GenerateSecrets() map[string]string {
	return map[string]string{
		"JWT_SECRET":     generateSecureSecret(32),
		"REFRESH_SECRET": generateSecureSecret(32),
		"CSRF_SECRET":    generateSecureSecret(16),
		"ENCRYPTION_KEY": generateSecureSecret(32),
	}
}