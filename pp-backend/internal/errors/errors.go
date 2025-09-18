package errors

import (
	"fmt"
	"net/http"
	"runtime"
	"time"
)

// ErrorType represents the type of error
type ErrorType string

const (
	ErrorTypeValidation    ErrorType = "VALIDATION_ERROR"
	ErrorTypeAuthentication ErrorType = "AUTHENTICATION_ERROR"
	ErrorTypeAuthorization  ErrorType = "AUTHORIZATION_ERROR"
	ErrorTypeNotFound      ErrorType = "NOT_FOUND_ERROR"
	ErrorTypeConflict      ErrorType = "CONFLICT_ERROR"
	ErrorTypeInternal      ErrorType = "INTERNAL_ERROR"
	ErrorTypeExternal      ErrorType = "EXTERNAL_ERROR"
	ErrorTypePayment       ErrorType = "PAYMENT_ERROR"
	ErrorTypeRateLimit     ErrorType = "RATE_LIMIT_ERROR"
	ErrorTypeDatabase      ErrorType = "DATABASE_ERROR"
	ErrorTypeNetwork       ErrorType = "NETWORK_ERROR"
)

// AppError represents a structured application error
type AppError struct {
	Type           ErrorType              `json:"type"`
	Code           string                 `json:"code"`
	Message        string                 `json:"message"`
	Details        string                 `json:"details,omitempty"`
	HTTPStatusCode int                    `json:"http_status_code"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	Cause          error                  `json:"-"`
	StackTrace     string                 `json:"-"`
	RequestID      string                 `json:"request_id,omitempty"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("[%s] %s: %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// WithMetadata adds metadata to the error
func (e *AppError) WithMetadata(key string, value interface{}) *AppError {
	if e.Metadata == nil {
		e.Metadata = make(map[string]interface{})
	}
	e.Metadata[key] = value
	return e
}

// WithRequestID adds request ID to the error
func (e *AppError) WithRequestID(requestID string) *AppError {
	e.RequestID = requestID
	return e
}

// WithCause adds the underlying cause
func (e *AppError) WithCause(cause error) *AppError {
	e.Cause = cause
	return e
}

// Unwrap returns the underlying cause
func (e *AppError) Unwrap() error {
	return e.Cause
}

// NewAppError creates a new application error
func NewAppError(errorType ErrorType, code, message string, httpStatusCode int) *AppError {
	return &AppError{
		Type:           errorType,
		Code:           code,
		Message:        message,
		HTTPStatusCode: httpStatusCode,
		StackTrace:     captureStackTrace(),
	}
}

// Predefined error constructors
func NewValidationError(code, message, details string) *AppError {
	return &AppError{
		Type:           ErrorTypeValidation,
		Code:           code,
		Message:        message,
		Details:        details,
		HTTPStatusCode: http.StatusBadRequest,
		StackTrace:     captureStackTrace(),
	}
}

func NewAuthenticationError(message string) *AppError {
	return &AppError{
		Type:           ErrorTypeAuthentication,
		Code:           "AUTH_REQUIRED",
		Message:        message,
		HTTPStatusCode: http.StatusUnauthorized,
		StackTrace:     captureStackTrace(),
	}
}

func NewAuthorizationError(message string) *AppError {
	return &AppError{
		Type:           ErrorTypeAuthorization,
		Code:           "ACCESS_DENIED",
		Message:        message,
		HTTPStatusCode: http.StatusForbidden,
		StackTrace:     captureStackTrace(),
	}
}

func NewNotFoundError(resource, id string) *AppError {
	return &AppError{
		Type:           ErrorTypeNotFound,
		Code:           "RESOURCE_NOT_FOUND",
		Message:        fmt.Sprintf("%s not found", resource),
		Details:        fmt.Sprintf("ID: %s", id),
		HTTPStatusCode: http.StatusNotFound,
		StackTrace:     captureStackTrace(),
	}
}

func NewConflictError(message, details string) *AppError {
	return &AppError{
		Type:           ErrorTypeConflict,
		Code:           "RESOURCE_CONFLICT",
		Message:        message,
		Details:        details,
		HTTPStatusCode: http.StatusConflict,
		StackTrace:     captureStackTrace(),
	}
}

func NewInternalError(message string, cause error) *AppError {
	return &AppError{
		Type:           ErrorTypeInternal,
		Code:           "INTERNAL_ERROR",
		Message:        message,
		HTTPStatusCode: http.StatusInternalServerError,
		Cause:          cause,
		StackTrace:     captureStackTrace(),
	}
}

func NewExternalError(service, message string, cause error) *AppError {
	return &AppError{
		Type:           ErrorTypeExternal,
		Code:           "EXTERNAL_SERVICE_ERROR",
		Message:        fmt.Sprintf("%s service error: %s", service, message),
		HTTPStatusCode: http.StatusBadGateway,
		Cause:          cause,
		StackTrace:     captureStackTrace(),
	}
}

func NewPaymentError(code, message string, cause error) *AppError {
	statusCode := http.StatusPaymentRequired
	if code == "PAYMENT_TIMEOUT" {
		statusCode = http.StatusRequestTimeout
	} else if code == "PAYMENT_DECLINED" {
		statusCode = http.StatusPaymentRequired
	}
	
	return &AppError{
		Type:           ErrorTypePayment,
		Code:           code,
		Message:        message,
		HTTPStatusCode: statusCode,
		Cause:          cause,
		StackTrace:     captureStackTrace(),
	}
}

func NewRateLimitError(message string) *AppError {
	return &AppError{
		Type:           ErrorTypeRateLimit,
		Code:           "RATE_LIMIT_EXCEEDED",
		Message:        message,
		HTTPStatusCode: http.StatusTooManyRequests,
		StackTrace:     captureStackTrace(),
	}
}

func NewDatabaseError(operation, table string, cause error) *AppError {
	return &AppError{
		Type:           ErrorTypeDatabase,
		Code:           "DATABASE_ERROR",
		Message:        fmt.Sprintf("Database %s operation failed on %s", operation, table),
		HTTPStatusCode: http.StatusInternalServerError,
		Cause:          cause,
		StackTrace:     captureStackTrace(),
	}
}

func NewNetworkError(message string, cause error) *AppError {
	return &AppError{
		Type:           ErrorTypeNetwork,
		Code:           "NETWORK_ERROR",
		Message:        message,
		HTTPStatusCode: http.StatusServiceUnavailable,
		Cause:          cause,
		StackTrace:     captureStackTrace(),
	}
}

// Common validation errors
func NewRequiredFieldError(field string) *AppError {
	return NewValidationError(
		"REQUIRED_FIELD",
		"Required field is missing",
		fmt.Sprintf("Field '%s' is required", field),
	)
}

func NewInvalidFormatError(field, format string) *AppError {
	return NewValidationError(
		"INVALID_FORMAT",
		"Invalid field format",
		fmt.Sprintf("Field '%s' must be in %s format", field, format),
	)
}

func NewOutOfRangeError(field string, min, max interface{}) *AppError {
	return NewValidationError(
		"OUT_OF_RANGE",
		"Value out of acceptable range",
		fmt.Sprintf("Field '%s' must be between %v and %v", field, min, max),
	)
}

// Payment specific errors
func NewPaymentDeclinedError(reason string) *AppError {
	return NewPaymentError("PAYMENT_DECLINED", "Payment was declined", nil).
		WithMetadata("decline_reason", reason)
}

func NewPaymentTimeoutError() *AppError {
	return NewPaymentError("PAYMENT_TIMEOUT", "Payment processing timed out", nil)
}

func NewInsufficientFundsError() *AppError {
	return NewPaymentError("INSUFFICIENT_FUNDS", "Insufficient funds for transaction", nil)
}

func NewPaymentMethodError(method string) *AppError {
	return NewPaymentError("INVALID_PAYMENT_METHOD", "Invalid or unsupported payment method", nil).
		WithMetadata("payment_method", method)
}

// PortOne specific errors
func NewPortOneError(code, message string, cause error) *AppError {
	return NewExternalError("PortOne", message, cause).
		WithMetadata("portone_error_code", code)
}

// Wrap converts a standard error into an AppError
func Wrap(err error, message string) *AppError {
	if err == nil {
		return nil
	}
	
	// If it's already an AppError, return it
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}
	
	return NewInternalError(message, err)
}

// WrapWithType wraps an error with a specific type
func WrapWithType(err error, errorType ErrorType, code, message string, httpStatusCode int) *AppError {
	if err == nil {
		return nil
	}
	
	return &AppError{
		Type:           errorType,
		Code:           code,
		Message:        message,
		HTTPStatusCode: httpStatusCode,
		Cause:          err,
		StackTrace:     captureStackTrace(),
	}
}

// IsType checks if error is of specific type
func IsType(err error, errorType ErrorType) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == errorType
	}
	return false
}

// HasCode checks if error has specific code
func HasCode(err error, code string) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == code
	}
	return false
}

// captureStackTrace captures the current stack trace
func captureStackTrace() string {
	const depth = 32
	var pcs [depth]uintptr
	n := runtime.Callers(3, pcs[:])
	frames := runtime.CallersFrames(pcs[:n])
	
	var stackTrace string
	for {
		frame, more := frames.Next()
		stackTrace += fmt.Sprintf("%s:%d %s\n", frame.File, frame.Line, frame.Function)
		if !more {
			break
		}
	}
	return stackTrace
}

// ErrorResponse represents the JSON error response
type ErrorResponse struct {
	Error struct {
		Type      ErrorType              `json:"type"`
		Code      string                 `json:"code"`
		Message   string                 `json:"message"`
		Details   string                 `json:"details,omitempty"`
		Metadata  map[string]interface{} `json:"metadata,omitempty"`
		RequestID string                 `json:"request_id,omitempty"`
		Timestamp string                 `json:"timestamp"`
	} `json:"error"`
}

// ToResponse converts AppError to ErrorResponse
func (e *AppError) ToResponse() ErrorResponse {
	resp := ErrorResponse{}
	resp.Error.Type = e.Type
	resp.Error.Code = e.Code
	resp.Error.Message = e.Message
	resp.Error.Details = e.Details
	resp.Error.Metadata = e.Metadata
	resp.Error.RequestID = e.RequestID
	resp.Error.Timestamp = fmt.Sprintf("%d", time.Now().UnixNano())
	
	return resp
}