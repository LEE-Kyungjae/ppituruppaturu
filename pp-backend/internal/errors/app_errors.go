package errors

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

// ErrorCode represents application-specific error codes
type ErrorCode string

const (
	ErrCodeInternal     ErrorCode = "INTERNAL_ERROR"
	ErrCodeValidation   ErrorCode = "VALIDATION_ERROR"
	ErrCodeNotFound     ErrorCode = "NOT_FOUND"
	ErrCodeUnauthorized ErrorCode = "UNAUTHORIZED"
	ErrCodeForbidden    ErrorCode = "FORBIDDEN"
	ErrCodeConflict     ErrorCode = "CONFLICT"
	ErrCodeRateLimit    ErrorCode = "RATE_LIMIT"
	ErrCodeTimeout      ErrorCode = "TIMEOUT"
	ErrCodeGameLogic    ErrorCode = "GAME_LOGIC_ERROR"
	ErrCodeNetwork      ErrorCode = "NETWORK_ERROR"
)

// AppError represents a structured application error
type AppError struct {
	Code      ErrorCode              `json:"code"`
	Message   string                 `json:"message"`
	Details   string                 `json:"details,omitempty"`
	Cause     error                  `json:"-"`
	Timestamp time.Time              `json:"timestamp"`
	Context   map[string]interface{} `json:"context,omitempty"`
	Stack     []string               `json:"stack,omitempty"`
	RequestID string                 `json:"request_id,omitempty"`
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s (caused by: %v)", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

// HTTPStatus returns the appropriate HTTP status code for the error
func (e *AppError) HTTPStatus() int {
	switch e.Code {
	case ErrCodeValidation:
		return 400
	case ErrCodeUnauthorized:
		return 401
	case ErrCodeForbidden:
		return 403
	case ErrCodeNotFound:
		return 404
	case ErrCodeConflict:
		return 409
	case ErrCodeRateLimit:
		return 429
	case ErrCodeTimeout:
		return 408
	default:
		return 500
	}
}

// NewAppError creates a new application error
func NewAppError(code ErrorCode, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Timestamp: time.Now(),
		Stack:     captureStack(2),
	}
}

// WrapError wraps an existing error with application context
func WrapError(err error, code ErrorCode, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Cause:     err,
		Timestamp: time.Now(),
		Stack:     captureStack(2),
	}
}

// WithContext adds context information to the error
func (e *AppError) WithContext(key string, value interface{}) *AppError {
	if e.Context == nil {
		e.Context = make(map[string]interface{})
	}
	e.Context[key] = value
	return e
}

// WithRequestID adds request ID to the error
func (e *AppError) WithRequestID(requestID string) *AppError {
	e.RequestID = requestID
	return e
}

// captureStack captures the current call stack
func captureStack(skip int) []string {
	var stack []string
	for i := skip; i < skip+10; i++ { // Capture up to 10 stack frames
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		fn := runtime.FuncForPC(pc)
		if fn == nil {
			continue
		}
		stack = append(stack, fmt.Sprintf("%s:%d %s", file, line, fn.Name()))
	}
	return stack
}

// ErrorHandler provides centralized error handling
type ErrorHandler struct {
	logger func(err error, ctx context.Context)
}

// NewErrorHandler creates a new error handler
func NewErrorHandler(logger func(err error, ctx context.Context)) *ErrorHandler {
	return &ErrorHandler{logger: logger}
}

// Handle processes an error and returns an appropriate response
func (h *ErrorHandler) Handle(err error, ctx context.Context) *AppError {
	if appErr, ok := err.(*AppError); ok {
		// Add request ID from context if available
		if requestID := ctx.Value("request_id"); requestID != nil {
			if id, ok := requestID.(string); ok {
				appErr.RequestID = id
			}
		}

		if h.logger != nil {
			h.logger(appErr, ctx)
		}
		return appErr
	}

	// Convert unknown errors to internal errors
	appErr := WrapError(err, ErrCodeInternal, "Internal server error")
	if requestID := ctx.Value("request_id"); requestID != nil {
		if id, ok := requestID.(string); ok {
			appErr.RequestID = id
		}
	}

	if h.logger != nil {
		h.logger(appErr, ctx)
	}
	return appErr
}

// Common error constructors
func NotFound(message string) *AppError {
	return NewAppError(ErrCodeNotFound, message)
}

func Validation(message string) *AppError {
	return NewAppError(ErrCodeValidation, message)
}

func Unauthorized(message string) *AppError {
	return NewAppError(ErrCodeUnauthorized, message)
}

func Forbidden(message string) *AppError {
	return NewAppError(ErrCodeForbidden, message)
}

func Conflict(message string) *AppError {
	return NewAppError(ErrCodeConflict, message)
}

func RateLimit(message string) *AppError {
	return NewAppError(ErrCodeRateLimit, message)
}

func Timeout(message string) *AppError {
	return NewAppError(ErrCodeTimeout, message)
}

func GameLogic(message string) *AppError {
	return NewAppError(ErrCodeGameLogic, message)
}

func Network(message string) *AppError {
	return NewAppError(ErrCodeNetwork, message)
}

func Internal(message string) *AppError {
	return NewAppError(ErrCodeInternal, message)
}