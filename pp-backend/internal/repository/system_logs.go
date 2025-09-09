// backend/internal/repository/system_logs.go
package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// LogLevel represents the severity of a log entry
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
	LogLevelFatal LogLevel = "fatal"
)

// LogCategory represents the category of log entry
type LogCategory string

const (
	LogCategoryAuth     LogCategory = "auth"
	LogCategoryPayment  LogCategory = "payment"
	LogCategoryUser     LogCategory = "user"
	LogCategorySystem   LogCategory = "system"
	LogCategoryAPI      LogCategory = "api"
	LogCategoryDatabase LogCategory = "database"
	LogCategoryGame     LogCategory = "game"
)

// SystemLog represents a system log entry
type SystemLog struct {
	ID        uuid.UUID   `db:"id" json:"id"`
	Level     LogLevel    `db:"level" json:"level"`
	Category  LogCategory `db:"category" json:"category"`
	Message   string      `db:"message" json:"message"`
	Details   string      `db:"details" json:"details"`
	UserID    *string     `db:"user_id" json:"user_id,omitempty"`
	IPAddress *string     `db:"ip_address" json:"ip_address,omitempty"`
	UserAgent *string     `db:"user_agent" json:"user_agent,omitempty"`
	RequestID *string     `db:"request_id" json:"request_id,omitempty"`
	CreatedAt time.Time   `db:"created_at" json:"created_at"`
}

// UserActivityLog represents user activity tracking
type UserActivityLog struct {
	ID        uuid.UUID `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	Action    string    `db:"action" json:"action"`
	Resource  string    `db:"resource" json:"resource"`
	Details   string    `db:"details" json:"details"`
	IPAddress string    `db:"ip_address" json:"ip_address"`
	UserAgent string    `db:"user_agent" json:"user_agent"`
	Success   bool      `db:"success" json:"success"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// PaymentLog represents payment-specific logging
type PaymentLog struct {
	ID            uuid.UUID `db:"id" json:"id"`
	UserID        string    `db:"user_id" json:"user_id"`
	PaymentID     *string   `db:"payment_id" json:"payment_id,omitempty"`
	SessionID     *string   `db:"session_id" json:"session_id,omitempty"`
	MerchantUID   *string   `db:"merchant_uid" json:"merchant_uid,omitempty"`
	Action        string    `db:"action" json:"action"` // create, prepare, execute, verify, cancel
	Status        string    `db:"status" json:"status"`
	Amount        *int      `db:"amount" json:"amount,omitempty"`
	ErrorCode     *string   `db:"error_code" json:"error_code,omitempty"`
	ErrorMessage  *string   `db:"error_message" json:"error_message,omitempty"`
	PortOneData   *string   `db:"portone_data" json:"portone_data,omitempty"`
	IPAddress     string    `db:"ip_address" json:"ip_address"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}

// SystemLogsRepository interface
type SystemLogsRepository interface {
	// System logs
	CreateSystemLog(log SystemLog) error
	GetSystemLogs(limit, offset int, level *LogLevel, category *LogCategory, startTime, endTime *time.Time) ([]SystemLog, error)
	GetSystemLogStats(startTime, endTime time.Time) (map[LogLevel]int, error)
	
	// User activity logs
	CreateUserActivityLog(log UserActivityLog) error
	GetUserActivityLogs(userID string, limit, offset int, startTime, endTime *time.Time) ([]UserActivityLog, error)
	GetUserActivityStats(userID string, startTime, endTime time.Time) (map[string]int, error)
	
	// Payment logs
	CreatePaymentLog(log PaymentLog) error
	GetPaymentLogs(userID *string, limit, offset int, startTime, endTime *time.Time) ([]PaymentLog, error)
	GetPaymentLogsBySession(sessionID string) ([]PaymentLog, error)
	GetPaymentErrorStats(startTime, endTime time.Time) (map[string]int, error)
}

// systemLogsRepository implements SystemLogsRepository
type systemLogsRepository struct {
	db *sql.DB
}

// NewSystemLogsRepository creates a new system logs repository
func NewSystemLogsRepository(db *sql.DB) SystemLogsRepository {
	return &systemLogsRepository{db: db}
}

// CreateSystemLog creates a new system log entry
func (r *systemLogsRepository) CreateSystemLog(log SystemLog) error {
	query := `
		INSERT INTO system_logs (id, level, category, message, details, user_id, ip_address, user_agent, request_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	
	_, err := r.db.Exec(query, log.ID, log.Level, log.Category, log.Message, log.Details,
		log.UserID, log.IPAddress, log.UserAgent, log.RequestID, log.CreatedAt)
	return err
}

// GetSystemLogs retrieves system logs with filtering
func (r *systemLogsRepository) GetSystemLogs(limit, offset int, level *LogLevel, category *LogCategory, startTime, endTime *time.Time) ([]SystemLog, error) {
	query := `
		SELECT id, level, category, message, details, user_id, ip_address, user_agent, request_id, created_at
		FROM system_logs
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 0
	
	if level != nil {
		argIndex++
		query += ` AND level = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *level)
	}
	
	if category != nil {
		argIndex++
		query += ` AND category = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *category)
	}
	
	if startTime != nil {
		argIndex++
		query += ` AND created_at >= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *startTime)
	}
	
	if endTime != nil {
		argIndex++
		query += ` AND created_at <= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *endTime)
	}
	
	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argIndex+1) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+2)
	args = append(args, limit, offset)
	
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var logs []SystemLog
	for rows.Next() {
		var log SystemLog
		err := rows.Scan(&log.ID, &log.Level, &log.Category, &log.Message, &log.Details,
			&log.UserID, &log.IPAddress, &log.UserAgent, &log.RequestID, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	
	return logs, nil
}

// GetSystemLogStats returns log statistics by level
func (r *systemLogsRepository) GetSystemLogStats(startTime, endTime time.Time) (map[LogLevel]int, error) {
	query := `
		SELECT level, COUNT(*) as count
		FROM system_logs
		WHERE created_at BETWEEN $1 AND $2
		GROUP BY level
	`
	
	rows, err := r.db.Query(query, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	stats := make(map[LogLevel]int)
	for rows.Next() {
		var level LogLevel
		var count int
		err := rows.Scan(&level, &count)
		if err != nil {
			return nil, err
		}
		stats[level] = count
	}
	
	return stats, nil
}

// CreateUserActivityLog creates a new user activity log
func (r *systemLogsRepository) CreateUserActivityLog(log UserActivityLog) error {
	query := `
		INSERT INTO user_activity_logs (id, user_id, action, resource, details, ip_address, user_agent, success, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	
	_, err := r.db.Exec(query, log.ID, log.UserID, log.Action, log.Resource, log.Details,
		log.IPAddress, log.UserAgent, log.Success, log.CreatedAt)
	return err
}

// GetUserActivityLogs retrieves user activity logs
func (r *systemLogsRepository) GetUserActivityLogs(userID string, limit, offset int, startTime, endTime *time.Time) ([]UserActivityLog, error) {
	query := `
		SELECT id, user_id, action, resource, details, ip_address, user_agent, success, created_at
		FROM user_activity_logs
		WHERE user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 1
	
	if startTime != nil {
		argIndex++
		query += ` AND created_at >= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *startTime)
	}
	
	if endTime != nil {
		argIndex++
		query += ` AND created_at <= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *endTime)
	}
	
	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argIndex+1) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+2)
	args = append(args, limit, offset)
	
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var logs []UserActivityLog
	for rows.Next() {
		var log UserActivityLog
		err := rows.Scan(&log.ID, &log.UserID, &log.Action, &log.Resource, &log.Details,
			&log.IPAddress, &log.UserAgent, &log.Success, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	
	return logs, nil
}

// GetUserActivityStats returns user activity statistics
func (r *systemLogsRepository) GetUserActivityStats(userID string, startTime, endTime time.Time) (map[string]int, error) {
	query := `
		SELECT action, COUNT(*) as count
		FROM user_activity_logs
		WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
		GROUP BY action
	`
	
	rows, err := r.db.Query(query, userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	stats := make(map[string]int)
	for rows.Next() {
		var action string
		var count int
		err := rows.Scan(&action, &count)
		if err != nil {
			return nil, err
		}
		stats[action] = count
	}
	
	return stats, nil
}

// CreatePaymentLog creates a new payment log entry
func (r *systemLogsRepository) CreatePaymentLog(log PaymentLog) error {
	query := `
		INSERT INTO payment_logs (id, user_id, payment_id, session_id, merchant_uid, action, status, amount, error_code, error_message, portone_data, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	
	_, err := r.db.Exec(query, log.ID, log.UserID, log.PaymentID, log.SessionID, log.MerchantUID,
		log.Action, log.Status, log.Amount, log.ErrorCode, log.ErrorMessage, log.PortOneData, log.IPAddress, log.CreatedAt)
	return err
}

// GetPaymentLogs retrieves payment logs
func (r *systemLogsRepository) GetPaymentLogs(userID *string, limit, offset int, startTime, endTime *time.Time) ([]PaymentLog, error) {
	query := `
		SELECT id, user_id, payment_id, session_id, merchant_uid, action, status, amount, error_code, error_message, portone_data, ip_address, created_at
		FROM payment_logs
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 0
	
	if userID != nil {
		argIndex++
		query += ` AND user_id = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *userID)
	}
	
	if startTime != nil {
		argIndex++
		query += ` AND created_at >= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *startTime)
	}
	
	if endTime != nil {
		argIndex++
		query += ` AND created_at <= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, *endTime)
	}
	
	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argIndex+1) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+2)
	args = append(args, limit, offset)
	
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var logs []PaymentLog
	for rows.Next() {
		var log PaymentLog
		err := rows.Scan(&log.ID, &log.UserID, &log.PaymentID, &log.SessionID, &log.MerchantUID,
			&log.Action, &log.Status, &log.Amount, &log.ErrorCode, &log.ErrorMessage, &log.PortOneData, &log.IPAddress, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	
	return logs, nil
}

// GetPaymentLogsBySession retrieves payment logs for a specific session
func (r *systemLogsRepository) GetPaymentLogsBySession(sessionID string) ([]PaymentLog, error) {
	query := `
		SELECT id, user_id, payment_id, session_id, merchant_uid, action, status, amount, error_code, error_message, portone_data, ip_address, created_at
		FROM payment_logs
		WHERE session_id = $1
		ORDER BY created_at ASC
	`
	
	rows, err := r.db.Query(query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var logs []PaymentLog
	for rows.Next() {
		var log PaymentLog
		err := rows.Scan(&log.ID, &log.UserID, &log.PaymentID, &log.SessionID, &log.MerchantUID,
			&log.Action, &log.Status, &log.Amount, &log.ErrorCode, &log.ErrorMessage, &log.PortOneData, &log.IPAddress, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	
	return logs, nil
}

// GetPaymentErrorStats returns payment error statistics
func (r *systemLogsRepository) GetPaymentErrorStats(startTime, endTime time.Time) (map[string]int, error) {
	query := `
		SELECT error_code, COUNT(*) as count
		FROM payment_logs
		WHERE error_code IS NOT NULL AND created_at BETWEEN $1 AND $2
		GROUP BY error_code
	`
	
	rows, err := r.db.Query(query, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	stats := make(map[string]int)
	for rows.Next() {
		var errorCode string
		var count int
		err := rows.Scan(&errorCode, &count)
		if err != nil {
			return nil, err
		}
		stats[errorCode] = count
	}
	
	return stats, nil
}