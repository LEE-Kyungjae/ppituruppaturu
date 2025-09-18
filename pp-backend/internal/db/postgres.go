// backend/internal/db/postgres.go

package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/config"

	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver
)

// NewConnection creates and returns a new database connection pool.
func NewConnection(cfg *config.Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("could not open database connection: %w", err)
	}

	db.SetMaxOpenConns(cfg.DBMaxOpenConns)
	db.SetMaxIdleConns(cfg.DBMaxIdleConns)
	db.SetConnMaxIdleTime(time.Duration(cfg.DBConnMaxIdleTime) * time.Minute)
	db.SetConnMaxLifetime(time.Duration(cfg.DBConnMaxLifetime) * time.Hour)

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("could not ping database: %w", err)
	}

	return db, nil
}