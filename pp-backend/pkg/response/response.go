// pkg/response/response.go - 표준화된 API 응답 형식
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse 표준 응답 구조체
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   *Error      `json:"error,omitempty"`
}

// Error 에러 정보 구조체
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Success 성공 응답
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMessage 메시지가 있는 성공 응답
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// BadRequest 400 에러 응답
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error: &Error{
			Code:    "BAD_REQUEST",
			Message: message,
		},
	})
}

// Unauthorized 401 에러 응답
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, APIResponse{
		Success: false,
		Error: &Error{
			Code:    "UNAUTHORIZED",
			Message: message,
		},
	})
}

// Forbidden 403 에러 응답
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, APIResponse{
		Success: false,
		Error: &Error{
			Code:    "FORBIDDEN",
			Message: message,
		},
	})
}

// NotFound 404 에러 응답
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error: &Error{
			Code:    "NOT_FOUND",
			Message: message,
		},
	})
}

// InternalServerError 500 에러 응답
func InternalServerError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error: &Error{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: message,
		},
	})
}

// CustomError 커스텀 에러 응답
func CustomError(c *gin.Context, statusCode int, code string, message string, details string) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Error: &Error{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}