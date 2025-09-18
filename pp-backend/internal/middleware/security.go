package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/time/rate"
	
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/errors"
	"github.com/pitturu-ppaturu/backend/internal/logger"
)

// SecurityMiddleware contains security-related middleware
type SecurityMiddleware struct {
	config *config.SecurityConfig
	logger *logger.Logger
	
	// Rate limiters per IP
	rateLimiters map[string]*rate.Limiter
	
	// Failed login attempts tracking
	loginAttempts map[string]*LoginAttemptTracker
}

// LoginAttemptTracker tracks failed login attempts
type LoginAttemptTracker struct {
	Count       int
	LastAttempt time.Time
	LockedUntil time.Time
}

// NewSecurityMiddleware creates a new security middleware
func NewSecurityMiddleware() (*SecurityMiddleware, error) {
	securityConfig, err := config.GetSecurityConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get security config: %w", err)
	}
	
	return &SecurityMiddleware{
		config:        securityConfig,
		logger:        logger.GetLogger(),
		rateLimiters:  make(map[string]*rate.Limiter),
		loginAttempts: make(map[string]*LoginAttemptTracker),
	}, nil
}

// RequestID adds unique request ID to context
func (sm *SecurityMiddleware) RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// CORS handles Cross-Origin Resource Sharing
func (sm *SecurityMiddleware) CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		
		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range sm.config.AllowedOrigins {
			if origin == allowedOrigin || allowedOrigin == "*" {
				allowed = true
				break
			}
		}
		
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Request-ID")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	}
}

// SecurityHeaders adds security headers
func (sm *SecurityMiddleware) SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HTTPS enforcement
		if sm.config.RequireHTTPS && c.GetHeader("X-Forwarded-Proto") != "https" {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}
		
		// Content security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'")
		
		// Remove server identification
		c.Header("Server", "")
		c.Header("X-Powered-By", "")
		
		c.Next()
	}
}

// RateLimit implements rate limiting per IP
func (sm *SecurityMiddleware) RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		
		// Get or create rate limiter for this IP
		limiter, exists := sm.rateLimiters[ip]
		if !exists {
			limiter = rate.NewLimiter(
				rate.Limit(sm.config.RateLimitRPS),
				sm.config.RateLimitBurst,
			)
			sm.rateLimiters[ip] = limiter
		}
		
		// Check if request is allowed
		if !limiter.Allow() {
			sm.logger.LogSecurityEvent("rate_limit_exceeded", "", ip, logger.Fields{
				"endpoint": c.Request.URL.Path,
				"method":   c.Request.Method,
			})
			
			appErr := errors.NewRateLimitError("Too many requests. Please try again later.")
			c.JSON(appErr.HTTPStatusCode, appErr.ToResponse())
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// LoginAttemptLimit tracks and limits failed login attempts
func (sm *SecurityMiddleware) LoginAttemptLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only apply to login endpoints
		if !strings.Contains(c.Request.URL.Path, "/login") {
			c.Next()
			return
		}
		
		ip := c.ClientIP()
		now := time.Now()
		
		// Get or create tracker for this IP
		tracker, exists := sm.loginAttempts[ip]
		if !exists {
			tracker = &LoginAttemptTracker{}
			sm.loginAttempts[ip] = tracker
		}
		
		// Check if IP is currently locked out
		if now.Before(tracker.LockedUntil) {
			remainingTime := tracker.LockedUntil.Sub(now)
			sm.logger.LogSecurityEvent("login_attempt_during_lockout", "", ip, logger.Fields{
				"remaining_lockout": remainingTime.String(),
			})
			
			appErr := errors.NewAuthenticationError(
				fmt.Sprintf("Account temporarily locked. Try again in %v", remainingTime.Round(time.Minute)),
			)
			c.JSON(appErr.HTTPStatusCode, appErr.ToResponse())
			c.Abort()
			return
		}
		
		// Reset count if last attempt was more than lockout duration ago
		if now.Sub(tracker.LastAttempt) > sm.config.LockoutDuration {
			tracker.Count = 0
		}
		
		c.Next()
		
		// Check if login failed (after processing)
		if c.Writer.Status() == http.StatusUnauthorized {
			tracker.Count++
			tracker.LastAttempt = now
			
			if tracker.Count >= sm.config.MaxLoginAttempts {
				tracker.LockedUntil = now.Add(sm.config.LockoutDuration)
				sm.logger.LogSecurityEvent("ip_locked_out", "", ip, logger.Fields{
					"failed_attempts": tracker.Count,
					"lockout_until":   tracker.LockedUntil,
				})
			}
		} else if c.Writer.Status() == http.StatusOK {
			// Reset on successful login
			tracker.Count = 0
		}
	}
}

// ValidateContentType ensures proper content type for POST/PUT requests
func (sm *SecurityMiddleware) ValidateContentType() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			contentType := c.GetHeader("Content-Type")
			
			// Allow specific content types
			validTypes := []string{
				"application/json",
				"application/x-www-form-urlencoded",
				"multipart/form-data",
			}
			
			valid := false
			for _, validType := range validTypes {
				if strings.HasPrefix(contentType, validType) {
					valid = true
					break
				}
			}
			
			if !valid {
				appErr := errors.NewValidationError(
					"INVALID_CONTENT_TYPE",
					"Invalid content type",
					fmt.Sprintf("Content-Type must be one of: %s", strings.Join(validTypes, ", ")),
				)
				c.JSON(appErr.HTTPStatusCode, appErr.ToResponse())
				c.Abort()
				return
			}
		}
		
		c.Next()
	}
}

// RequestLogging logs all HTTP requests
func (sm *SecurityMiddleware) RequestLogging() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		requestID := c.GetString("request_id")
		
		c.Next()
		
		// Log the request
		duration := time.Since(start)
		statusCode := c.Writer.Status()
		
		fields := logger.Fields{
			"request_id":  requestID,
			"method":      method,
			"path":        path,
			"status_code": statusCode,
			"duration_ms": duration.Milliseconds(),
			"client_ip":   clientIP,
			"user_agent":  userAgent,
			"bytes_in":    c.Request.ContentLength,
			"bytes_out":   c.Writer.Size(),
		}
		
		// Add user ID if available
		if userID, exists := c.Get("user_id"); exists {
			fields["user_id"] = userID
		}
		
		sm.logger.WithFields(fields).Info("HTTP Request")
		
		// Log suspicious activities
		if statusCode >= 400 {
			sm.logSuspiciousActivity(c, fields)
		}
	}
}

// InputSanitization sanitizes common input fields
func (sm *SecurityMiddleware) InputSanitization() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Sanitize query parameters
		for key, values := range c.Request.URL.Query() {
			for i, value := range values {
				c.Request.URL.Query()[key][i] = sanitizeInput(value)
			}
		}
		
		c.Next()
	}
}

// TimeoutMiddleware adds request timeout
func (sm *SecurityMiddleware) TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()
		
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// Helper functions
func (sm *SecurityMiddleware) logSuspiciousActivity(c *gin.Context, fields logger.Fields) {
	statusCode := c.Writer.Status()
	path := c.Request.URL.Path
	
	suspicious := false
	reason := ""
	
	switch {
	case statusCode == 401:
		suspicious = true
		reason = "unauthorized_access_attempt"
	case statusCode == 403:
		suspicious = true
		reason = "forbidden_access_attempt"
	case statusCode == 404 && isSensitivePath(path):
		suspicious = true
		reason = "sensitive_path_probe"
	case statusCode >= 500:
		suspicious = true
		reason = "server_error"
	}
	
	if suspicious {
		sm.logger.LogSecurityEvent(reason, fields["user_id"].(string), c.ClientIP(), fields)
	}
}

func isSensitivePath(path string) bool {
	sensitivePaths := []string{
		"/admin",
		"/api/admin",
		"/.env",
		"/config",
		"/wp-admin",
		"/phpmyadmin",
	}
	
	for _, sensitivePath := range sensitivePaths {
		if strings.Contains(path, sensitivePath) {
			return true
		}
	}
	return false
}

func sanitizeInput(input string) string {
	// Basic input sanitization
	replacements := map[string]string{
		"<script>": "",
		"</script>": "",
		"javascript:": "",
		"vbscript:": "",
		"onload=": "",
		"onerror=": "",
		"onclick=": "",
	}
	
	result := input
	for pattern, replacement := range replacements {
		result = strings.ReplaceAll(strings.ToLower(result), pattern, replacement)
	}
	
	return result
}

// CleanupMiddleware periodically cleans up old data
func (sm *SecurityMiddleware) StartCleanupRoutine() {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				sm.cleanupOldData()
			}
		}
	}()
}

func (sm *SecurityMiddleware) cleanupOldData() {
	now := time.Now()
	cutoff := now.Add(-24 * time.Hour)
	
	// Clean up old rate limiters
	for ip, limiter := range sm.rateLimiters {
		if limiter.Limit() == 0 { // Not used recently
			delete(sm.rateLimiters, ip)
		}
	}
	
	// Clean up old login attempt trackers
	for ip, tracker := range sm.loginAttempts {
		if tracker.LastAttempt.Before(cutoff) && now.After(tracker.LockedUntil) {
			delete(sm.loginAttempts, ip)
		}
	}
	
	sm.logger.Debug("Completed security middleware cleanup")
}