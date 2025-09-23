package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Logger levels
const (
	DebugLevel = "debug"
	InfoLevel  = "info"
	WarnLevel  = "warn"
	ErrorLevel = "error"
	FatalLevel = "fatal"
	PanicLevel = "panic"
)

// Logger is our application logger
type Logger struct {
	*logrus.Logger
	serviceName string
}

// Fields represents structured logging fields
type Fields map[string]interface{}

var (
	defaultLogger *Logger
)

// Config holds logger configuration
type Config struct {
	Level       string
	Format      string // json or text
	ServiceName string
	Environment string

	// File logging
	EnableFile bool
	FilePath   string
	MaxSize    int // megabytes
	MaxBackups int
	MaxAge     int // days

	// Console logging
	EnableConsole bool

	// Structured logging fields
	DefaultFields Fields
}

// Init initializes the global logger
func Init(config Config) error {
	logger := logrus.New()

	// Set log level
	level, err := logrus.ParseLevel(config.Level)
	if err != nil {
		return fmt.Errorf("invalid log level: %w", err)
	}
	logger.SetLevel(level)

	// Set formatter
	switch config.Format {
	case "json":
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
			FieldMap: logrus.FieldMap{
				logrus.FieldKeyTime:  "timestamp",
				logrus.FieldKeyLevel: "level",
				logrus.FieldKeyMsg:   "message",
				logrus.FieldKeyFunc:  "caller",
			},
		})
	default:
		logger.SetFormatter(&logrus.TextFormatter{
			TimestampFormat: time.RFC3339,
			FullTimestamp:   true,
		})
	}

	// Configure output
	if config.EnableFile && config.FilePath != "" {
		// Ensure directory exists
		if err := os.MkdirAll(filepath.Dir(config.FilePath), 0755); err != nil {
			return fmt.Errorf("failed to create log directory: %w", err)
		}

		// Setup file rotation
		fileWriter := &lumberjack.Logger{
			Filename:   config.FilePath,
			MaxSize:    config.MaxSize,
			MaxBackups: config.MaxBackups,
			MaxAge:     config.MaxAge,
			Compress:   true,
		}

		if config.EnableConsole {
			// Log to both file and console
			logger.SetOutput(os.Stdout)
			logger.AddHook(&FileHook{writer: fileWriter})
		} else {
			// Log to file only
			logger.SetOutput(fileWriter)
		}
	} else if config.EnableConsole {
		logger.SetOutput(os.Stdout)
	}

	// Set default fields
	defaultFields := logrus.Fields{
		"service":     config.ServiceName,
		"environment": config.Environment,
		"version":     os.Getenv("APP_VERSION"),
	}

	// Add custom default fields
	for k, v := range config.DefaultFields {
		defaultFields[k] = v
	}

	defaultLogger = &Logger{
		Logger:      logger,
		serviceName: config.ServiceName,
	}

	// Add default fields to all logs
	defaultLogger.Logger = defaultLogger.Logger.WithFields(defaultFields).Logger

	return nil
}

// GetLogger returns the default logger instance
func GetLogger() *Logger {
	if defaultLogger == nil {
		// Fallback logger
		if err := Init(Config{
			Level:         InfoLevel,
			Format:        "text",
			ServiceName:   "pitturu",
			Environment:   "development",
			EnableConsole: true,
		}); err != nil {
			log.Printf("failed to initialize fallback logger: %v", err)
		}
	}
	return defaultLogger
}

// WithFields creates a logger with additional fields
func (l *Logger) WithFields(fields Fields) *logrus.Entry {
	return l.Logger.WithFields(logrus.Fields(fields))
}

// WithContext creates a logger with context
func (l *Logger) WithContext(ctx context.Context) *logrus.Entry {
	entry := l.Logger.WithContext(ctx)

	// Extract common context values
	if requestID := ctx.Value("request_id"); requestID != nil {
		entry = entry.WithField("request_id", requestID)
	}
	if userID := ctx.Value("user_id"); userID != nil {
		entry = entry.WithField("user_id", userID)
	}
	if traceID := ctx.Value("trace_id"); traceID != nil {
		entry = entry.WithField("trace_id", traceID)
	}

	return entry
}

// HTTP request logging
func (l *Logger) LogHTTPRequest(method, path string, statusCode int, duration time.Duration, userID string) {
	fields := Fields{
		"method":      method,
		"path":        path,
		"status_code": statusCode,
		"duration_ms": duration.Milliseconds(),
		"user_id":     userID,
		"type":        "http_request",
	}

	entry := l.WithFields(fields)

	message := fmt.Sprintf("%s %s - %d (%dms)", method, path, statusCode, duration.Milliseconds())

	if statusCode >= 500 {
		entry.Error(message)
	} else if statusCode >= 400 {
		entry.Warn(message)
	} else {
		entry.Info(message)
	}
}

// Database operation logging
func (l *Logger) LogDBOperation(operation, table string, duration time.Duration, err error) {
	fields := Fields{
		"operation":   operation,
		"table":       table,
		"duration_ms": duration.Milliseconds(),
		"type":        "db_operation",
	}

	entry := l.WithFields(fields)

	if err != nil {
		entry.WithError(err).Error(fmt.Sprintf("DB %s on %s failed", operation, table))
	} else {
		entry.Debug(fmt.Sprintf("DB %s on %s completed", operation, table))
	}
}

// Payment operation logging
func (l *Logger) LogPaymentOperation(operation, paymentID, userID string, amount int64, err error) {
	fields := Fields{
		"operation":  operation,
		"payment_id": paymentID,
		"user_id":    userID,
		"amount":     amount,
		"type":       "payment_operation",
	}

	entry := l.WithFields(fields)

	if err != nil {
		entry.WithError(err).Error(fmt.Sprintf("Payment %s failed", operation))
	} else {
		entry.Info(fmt.Sprintf("Payment %s successful", operation))
	}
}

// Security event logging
func (l *Logger) LogSecurityEvent(event, userID, clientIP string, details Fields) {
	fields := Fields{
		"event":     event,
		"user_id":   userID,
		"client_ip": clientIP,
		"type":      "security_event",
	}

	for k, v := range details {
		fields[k] = v
	}

	l.WithFields(fields).Warn(fmt.Sprintf("Security event: %s", event))
}

// Business logic logging
func (l *Logger) LogBusinessEvent(event string, userID string, details Fields) {
	fields := Fields{
		"event":   event,
		"user_id": userID,
		"type":    "business_event",
	}

	for k, v := range details {
		fields[k] = v
	}

	l.WithFields(fields).Info(fmt.Sprintf("Business event: %s", event))
}

// Performance logging
func (l *Logger) LogPerformance(operation string, duration time.Duration, details Fields) {
	fields := Fields{
		"operation":   operation,
		"duration_ms": duration.Milliseconds(),
		"type":        "performance",
	}

	for k, v := range details {
		fields[k] = v
	}

	entry := l.WithFields(fields)

	// Performance thresholds
	if duration > 5*time.Second {
		entry.Error(fmt.Sprintf("Slow operation detected: %s", operation))
	} else if duration > 1*time.Second {
		entry.Warn(fmt.Sprintf("Operation taking longer than expected: %s", operation))
	} else {
		entry.Debug(fmt.Sprintf("Operation completed: %s", operation))
	}
}

// FileHook sends logs to file
type FileHook struct {
	writer *lumberjack.Logger
}

func (hook *FileHook) Fire(entry *logrus.Entry) error {
	line, err := entry.Bytes()
	if err != nil {
		return err
	}
	_, err = hook.writer.Write(line)
	return err
}

func (hook *FileHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

// Structured logging helpers
func Debug(msg string, fields ...Fields) {
	entry := GetLogger().Logger.WithFields(mergeFields(fields...))
	entry.Debug(msg)
}

func Info(msg string, fields ...Fields) {
	entry := GetLogger().Logger.WithFields(mergeFields(fields...))
	entry.Info(msg)
}

func Warn(msg string, fields ...Fields) {
	entry := GetLogger().Logger.WithFields(mergeFields(fields...))
	entry.Warn(msg)
}

func Error(msg string, err error, fields ...Fields) {
	entry := GetLogger().Logger.WithFields(mergeFields(fields...))
	if err != nil {
		entry = entry.WithError(err)
	}
	entry.Error(msg)
}

func Fatal(msg string, err error, fields ...Fields) {
	entry := GetLogger().Logger.WithFields(mergeFields(fields...))
	if err != nil {
		entry = entry.WithError(err)
	}
	entry.Fatal(msg)
}

func mergeFields(fieldSlices ...Fields) logrus.Fields {
	result := make(logrus.Fields)
	for _, fields := range fieldSlices {
		for k, v := range fields {
			result[k] = v
		}
	}
	return result
}
