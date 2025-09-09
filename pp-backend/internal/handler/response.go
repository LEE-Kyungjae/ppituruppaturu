// backend/internal/handler/response.go

package handler

import (
	"github.com/gin-gonic/gin"
)

// Response is a generic API response structure.
type Response struct {
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// respondJSON makes the response with payload as json format
func respondJSON(c *gin.Context, status int, payload interface{}) {
	c.JSON(status, payload)
}

// respondError makes the error response with payload as json format
func respondError(c *gin.Context, code int, message string) {
	respondJSON(c, code, Response{Error: message})
}