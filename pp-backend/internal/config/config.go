// backend/internal/config/config.go

package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application.
// The values are read by viper from a config file and environment variables.
type Config struct {
	Port              string  `mapstructure:"PORT"`
	DSN               string  `mapstructure:"DSN"`
	KakaoClientID     string  `mapstructure:"KAKAO_CLIENT_ID"`
	KakaoClientSecret string  `mapstructure:"KAKAO_CLIENT_SECRET"`
	KakaoRedirectURI  string  `mapstructure:"KAKAO_REDIRECT_URI"`
	GoogleClientID    string  `mapstructure:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `mapstructure:"GOOGLE_CLIENT_SECRET"`
	AccessSecret      string  `mapstructure:"JWT_SECRET"`
	RefreshSecret     string  `mapstructure:"REFRESH_SECRET"`
	AccessTTLMin      int     `mapstructure:"ACCESS_TTL_MIN"`
	RefreshTTLDays    int     `mapstructure:"REFRESH_TTL_DAYS"`
	AllowedOrigins    string  `mapstructure:"CORS_ORIGINS"`
	RateRPS           float64 `mapstructure:"RATE_RPS"`
	RateBurst         int     `mapstructure:"RATE_BURST"`
	DBMaxOpenConns    int     `mapstructure:"DB_MAX_OPEN_CONNS"`
	DBMaxIdleConns    int     `mapstructure:"DB_MAX_IDLE_CONNS"`
	DBConnMaxIdleTime int     `mapstructure:"DB_CONN_MAX_IDLE_TIME_MIN"`
	DBConnMaxLifetime int     `mapstructure:"DB_CONN_MAX_LIFETIME_HOUR"`
	BcryptCost        int     `mapstructure:"BCRYPT_COST"`
	SMTPHost          string  `mapstructure:"SMTP_HOST"`
	SMTPPort          int     `mapstructure:"SMTP_PORT"`
	SMTPUser          string  `mapstructure:"SMTP_USER"`
	SMTPPass          string  `mapstructure:"SMTP_PASS"`
	SMTPSender        string  `mapstructure:"SMTP_SENDER"`
}

// LoadConfig reads configuration from file or environment variables.
func LoadConfig() (*Config, error) {
	v := viper.New()

	// Set default values
	v.SetDefault("PORT", "8080")
	v.SetDefault("ACCESS_TTL_MIN", 15)
	v.SetDefault("REFRESH_TTL_DAYS", 7)
	v.SetDefault("CORS_ORIGINS", "*")
	v.SetDefault("RATE_RPS", 10)
	v.SetDefault("RATE_BURST", 20)
	v.SetDefault("DB_MAX_OPEN_CONNS", 25)
	v.SetDefault("DB_MAX_IDLE_CONNS", 25)
	v.SetDefault("DB_CONN_MAX_IDLE_TIME_MIN", 5)
	v.SetDefault("DB_CONN_MAX_LIFETIME_HOUR", 2)
	v.SetDefault("BCRYPT_COST", 12)

	// Load from config file
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("/etc/app/")
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	// Load from environment variables
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	// HOTFIX: Viper가 환경변수를 읽지 못하는 문제 해결
	// 환경변수를 직접 읽어서 설정
	if dsn := os.Getenv("DSN"); dsn != "" {
		cfg.DSN = dsn
	}
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		cfg.AccessSecret = jwtSecret
	}
	if refreshSecret := os.Getenv("REFRESH_SECRET"); refreshSecret != "" {
		cfg.RefreshSecret = refreshSecret
	}
	if kakaoClientID := os.Getenv("KAKAO_CLIENT_ID"); kakaoClientID != "" {
		cfg.KakaoClientID = kakaoClientID
	}
	if kakaoClientSecret := os.Getenv("KAKAO_CLIENT_SECRET"); kakaoClientSecret != "" {
		cfg.KakaoClientSecret = kakaoClientSecret
	}

	return &cfg, nil
}
