package db

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
)

// QueryOptimizer provides database query optimization features
type QueryOptimizer struct {
	db              *sqlx.DB
	queryCache      sync.Map // map[string]*CachedQuery
	statementCache  sync.Map // map[string]*sql.Stmt
	connectionPool  *ConnectionPool
	queryStats      sync.Map // map[string]*QueryStats
	slowQueryLogger func(query string, duration time.Duration, args ...interface{})
}

// CachedQuery represents a cached query result
type CachedQuery struct {
	Result    interface{}
	ExpiresAt time.Time
	Query     string
	Args      []interface{}
}

// QueryStats tracks query performance metrics
type QueryStats struct {
	QueryCount    int64
	TotalDuration time.Duration
	AvgDuration   time.Duration
	MaxDuration   time.Duration
	MinDuration   time.Duration
	ErrorCount    int64
	LastExecuted  time.Time
}

// ConnectionPool manages database connections efficiently
type ConnectionPool struct {
	db             *sqlx.DB
	maxConnections int
	connections    chan *sqlx.Conn
	activeConns    sync.Map
	connTimeout    time.Duration
}

// NewQueryOptimizer creates a new query optimizer
func NewQueryOptimizer(db *sqlx.DB, slowQueryLogger func(string, time.Duration, ...interface{})) *QueryOptimizer {
	optimizer := &QueryOptimizer{
		db:              db,
		slowQueryLogger: slowQueryLogger,
		connectionPool:  NewConnectionPool(db, 10, 30*time.Second),
	}

	// Start cleanup goroutine
	go optimizer.cleanupExpiredCache()

	return optimizer
}

// NewConnectionPool creates a new connection pool
func NewConnectionPool(db *sqlx.DB, maxConnections int, connTimeout time.Duration) *ConnectionPool {
	return &ConnectionPool{
		db:             db,
		maxConnections: maxConnections,
		connections:    make(chan *sqlx.Conn, maxConnections),
		connTimeout:    connTimeout,
	}
}

// CachedQueryContext executes a query with caching
func (qo *QueryOptimizer) CachedQueryContext(ctx context.Context, cacheDuration time.Duration, dest interface{}, query string, args ...interface{}) error {
	cacheKey := qo.generateCacheKey(query, args...)

	// Try to get from cache first
	if cached, ok := qo.queryCache.Load(cacheKey); ok {
		cachedQuery := cached.(*CachedQuery)
		if time.Now().Before(cachedQuery.ExpiresAt) {
			// Cache hit
			switch v := dest.(type) {
			case *[]interface{}:
				*v = cachedQuery.Result.([]interface{})
			case interface{}:
				dest = cachedQuery.Result
			}
			return nil
		}
		// Cache expired, remove it
		qo.queryCache.Delete(cacheKey)
	}

	// Execute query
	start := time.Now()
	err := qo.QueryContext(ctx, dest, query, args...)
	duration := time.Since(start)

	if err == nil {
		// Cache the result
		qo.queryCache.Store(cacheKey, &CachedQuery{
			Result:    dest,
			ExpiresAt: time.Now().Add(cacheDuration),
			Query:     query,
			Args:      args,
		})
	}

	qo.updateQueryStats(query, duration, err)
	return err
}

// QueryContext executes a query with performance tracking
func (qo *QueryOptimizer) QueryContext(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	start := time.Now()

	// Try to get prepared statement from cache
	var err error
	if _, ok := qo.statementCache.Load(query); ok {
		// For now, fallback to non-prepared statement
		// TODO: Implement proper prepared statement handling with sqlx
		err = qo.db.SelectContext(ctx, dest, query, args...)
	} else {
		// Execute and prepare statement for future use
		err = qo.db.SelectContext(ctx, dest, query, args...)

		// Prepare statement for caching (in background)
		go func() {
			if stmt, prepErr := qo.db.PrepareContext(context.Background(), query); prepErr == nil {
				qo.statementCache.Store(query, stmt)
			}
		}()
	}

	duration := time.Since(start)
	qo.updateQueryStats(query, duration, err)

	// Log slow queries
	if qo.slowQueryLogger != nil && duration > 100*time.Millisecond {
		qo.slowQueryLogger(query, duration, args...)
	}

	return err
}

// ExecContext executes a non-query statement with performance tracking
func (qo *QueryOptimizer) ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	start := time.Now()

	var result sql.Result
	var err error

	// Try to get prepared statement from cache
	if stmt, ok := qo.statementCache.Load(query); ok {
		preparedStmt := stmt.(*sql.Stmt)
		result, err = preparedStmt.ExecContext(ctx, args...)
	} else {
		// Execute and prepare statement for future use
		result, err = qo.db.ExecContext(ctx, query, args...)

		// Prepare statement for caching (in background)
		go func() {
			if stmt, prepErr := qo.db.PrepareContext(context.Background(), query); prepErr == nil {
				qo.statementCache.Store(query, stmt)
			}
		}()
	}

	duration := time.Since(start)
	qo.updateQueryStats(query, duration, err)

	// Log slow queries
	if qo.slowQueryLogger != nil && duration > 100*time.Millisecond {
		qo.slowQueryLogger(query, duration, args...)
	}

	return result, err
}

// TransactionContext executes a function within a database transaction
func (qo *QueryOptimizer) TransactionContext(ctx context.Context, fn func(*sqlx.Tx) error) error {
	start := time.Now()

	tx, err := qo.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		} else if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}

		duration := time.Since(start)
		qo.updateQueryStats("TRANSACTION", duration, err)
	}()

	err = fn(tx)
	return err
}

// BatchInsert performs optimized batch insert operations
func (qo *QueryOptimizer) BatchInsert(ctx context.Context, table string, columns []string, values [][]interface{}, batchSize int) error {
	if len(values) == 0 {
		return nil
	}

	start := time.Now()

	// Build query
	placeholders := make([]string, len(columns))
	for i := range placeholders {
		placeholders[i] = "?"
	}
	valueClause := "(" + fmt.Sprintf("%s", placeholders) + ")"

	err := qo.TransactionContext(ctx, func(tx *sqlx.Tx) error {
		for i := 0; i < len(values); i += batchSize {
			end := i + batchSize
			if end > len(values) {
				end = len(values)
			}

			batch := values[i:end]
			batchValues := make([]string, len(batch))
			args := make([]interface{}, 0, len(batch)*len(columns))

			for j, row := range batch {
				batchValues[j] = valueClause
				args = append(args, row...)
			}

			query := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s",
				table,
				fmt.Sprintf("%s", columns),
				fmt.Sprintf("%s", batchValues))

			_, err := tx.ExecContext(ctx, query, args...)
			if err != nil {
				return err
			}
		}
		return nil
	})

	duration := time.Since(start)
	qo.updateQueryStats("BATCH_INSERT", duration, err)

	return err
}

// generateCacheKey creates a cache key from query and arguments
func (qo *QueryOptimizer) generateCacheKey(query string, args ...interface{}) string {
	key := query
	for _, arg := range args {
		key += fmt.Sprintf("_%v", arg)
	}
	return key
}

// updateQueryStats updates performance statistics for a query
func (qo *QueryOptimizer) updateQueryStats(query string, duration time.Duration, err error) {
	statsInterface, _ := qo.queryStats.LoadOrStore(query, &QueryStats{
		MinDuration: duration,
	})
	stats := statsInterface.(*QueryStats)

	stats.QueryCount++
	stats.TotalDuration += duration
	stats.AvgDuration = stats.TotalDuration / time.Duration(stats.QueryCount)
	stats.LastExecuted = time.Now()

	if duration > stats.MaxDuration {
		stats.MaxDuration = duration
	}
	if duration < stats.MinDuration || stats.MinDuration == 0 {
		stats.MinDuration = duration
	}

	if err != nil {
		stats.ErrorCount++
	}
}

// cleanupExpiredCache removes expired cache entries
func (qo *QueryOptimizer) cleanupExpiredCache() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		qo.queryCache.Range(func(key, value interface{}) bool {
			cached := value.(*CachedQuery)
			if now.After(cached.ExpiresAt) {
				qo.queryCache.Delete(key)
			}
			return true
		})
	}
}

// GetQueryStats returns performance statistics for all queries
func (qo *QueryOptimizer) GetQueryStats() map[string]*QueryStats {
	stats := make(map[string]*QueryStats)
	qo.queryStats.Range(func(key, value interface{}) bool {
		stats[key.(string)] = value.(*QueryStats)
		return true
	})
	return stats
}

// ClearCache removes all cached queries
func (qo *QueryOptimizer) ClearCache() {
	qo.queryCache.Range(func(key, value interface{}) bool {
		qo.queryCache.Delete(key)
		return true
	})
}

// Close closes the query optimizer and cleans up resources
func (qo *QueryOptimizer) Close() error {
	// Close all prepared statements
	qo.statementCache.Range(func(key, value interface{}) bool {
		stmt := value.(*sql.Stmt)
		stmt.Close()
		return true
	})

	qo.ClearCache()
	return nil
}

// OptimizedRepository provides a base repository with query optimization
type OptimizedRepository struct {
	optimizer *QueryOptimizer
}

// NewOptimizedRepository creates a new optimized repository
func NewOptimizedRepository(db *sqlx.DB) *OptimizedRepository {
	return &OptimizedRepository{
		optimizer: NewQueryOptimizer(db, func(query string, duration time.Duration, args ...interface{}) {
			// Default slow query logger - can be customized
			fmt.Printf("SLOW QUERY (%v): %s with args: %v\n", duration, query, args)
		}),
	}
}

// GetOptimizer returns the query optimizer instance
func (r *OptimizedRepository) GetOptimizer() *QueryOptimizer {
	return r.optimizer
}

// Close closes the repository and cleans up resources
func (r *OptimizedRepository) Close() error {
	return r.optimizer.Close()
}
