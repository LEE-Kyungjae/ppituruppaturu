// pkg/logger/logger.go - 재사용 가능한 로깅 유틸리티
package logger

import (
	"io"
	"os"

	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

type Logger struct {
	*logrus.Logger
}

func New(level string, logFile string) *Logger {
	logger := logrus.New()

	// 로그 레벨 설정
	switch level {
	case "debug":
		logger.SetLevel(logrus.DebugLevel)
	case "info":
		logger.SetLevel(logrus.InfoLevel)
	case "warn":
		logger.SetLevel(logrus.WarnLevel)
	case "error":
		logger.SetLevel(logrus.ErrorLevel)
	default:
		logger.SetLevel(logrus.InfoLevel)
	}

	// JSON 포맷 설정
	logger.SetFormatter(&logrus.JSONFormatter{})

	// 파일 및 콘솔 동시 출력 설정
	var writers []io.Writer
	writers = append(writers, os.Stdout)

	if logFile != "" {
		writers = append(writers, &lumberjack.Logger{
			Filename:   logFile,
			MaxSize:    10, // MB
			MaxBackups: 5,
			MaxAge:     30, // days
			Compress:   true,
		})
	}

	logger.SetOutput(io.MultiWriter(writers...))

	return &Logger{logger}
}

// 컨텍스트가 있는 로거
func (l *Logger) WithField(key string, value interface{}) *logrus.Entry {
	return l.Logger.WithField(key, value)
}

func (l *Logger) WithFields(fields logrus.Fields) *logrus.Entry {
	return l.Logger.WithFields(fields)
}