// backend/internal/repository/db.go

package repository

import "database/sql"

// DBTX is an interface for sql.DB and sql.Tx
type DBTX interface {
	Exec(query string, args ...interface{}) (sql.Result, error)
	QueryRow(query string, args ...interface{}) *sql.Row
	Query(query string, args ...interface{}) (*sql.Rows, error)
}