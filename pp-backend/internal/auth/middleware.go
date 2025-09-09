// backend/internal/auth/middleware.go

package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"exit/internal/service"
)

// contextKey is a custom type to avoid key collisions in context.
type contextKey string

const (
	userContextKey contextKey = "user"
	roleContextKey contextKey = "role"
)

// Middleware provides authentication and authorization middleware.
type Middleware struct {
	tokenSvc *service.TokenService
}

// NewMiddleware creates a new auth middleware.
func NewMiddleware(tokenSvc *service.TokenService) *Middleware {
	return &Middleware{tokenSvc: tokenSvc}
}

// BearerToken is a Gin middleware for validating JWT bearer tokens.
func (m *Middleware) BearerToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		const bearer = "Bearer "
		h := c.GetHeader("Authorization")
		if !strings.HasPrefix(h, bearer) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		raw := strings.TrimPrefix(h, bearer)

		claims, err := m.tokenSvc.ValidateToken(raw, false)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// Store user info in context for downstream handlers
		c.Set(string(userContextKey), claims["sub"])
		c.Set(string(roleContextKey), claims["role"])

		c.Next()
	}
}

// RequireRole is a Gin middleware to check for a specific user role.
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, _ := c.Get(string(roleContextKey))
		userRole, ok := val.(string)
		if !ok || userRole != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

// GetUserFromContext retrieves the user identifier (subject) from the Gin context.
func GetUserFromContext(ctx context.Context) (string, bool) {
	user, ok := ctx.Value(userContextKey).(string)
	return user, ok
}