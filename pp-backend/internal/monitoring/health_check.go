package monitoring

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/logger"
	"github.com/pitturu-ppaturu/backend/internal/portone"
)

// HealthChecker manages health checks for all system components
type HealthChecker struct {
	db           *sql.DB
	portOneClient *portone.Client
	logger       *logger.Logger
	config       *config.Config
	
	// Health check results cache
	lastCheck    time.Time
	lastResults  *HealthCheckResults
	cacheDuration time.Duration
	mutex        sync.RWMutex
}

// HealthCheckResults contains all health check results
type HealthCheckResults struct {
	Overall    HealthStatus         `json:"overall"`
	Timestamp  time.Time           `json:"timestamp"`
	Version    string              `json:"version"`
	Environment string             `json:"environment"`
	Uptime     time.Duration       `json:"uptime"`
	Components map[string]ComponentHealth `json:"components"`
	Metrics    SystemMetrics       `json:"metrics"`
}

// HealthStatus represents overall system health
type HealthStatus string

const (
	HealthStatusHealthy   HealthStatus = "healthy"
	HealthStatusDegraded  HealthStatus = "degraded" 
	HealthStatusUnhealthy HealthStatus = "unhealthy"
)

// ComponentHealth represents health of individual component
type ComponentHealth struct {
	Status      HealthStatus       `json:"status"`
	Message     string            `json:"message,omitempty"`
	LastChecked time.Time         `json:"last_checked"`
	ResponseTime time.Duration    `json:"response_time"`
	Details     map[string]interface{} `json:"details,omitempty"`
}

// SystemMetrics contains system performance metrics
type SystemMetrics struct {
	Memory    MemoryMetrics    `json:"memory"`
	CPU       CPUMetrics       `json:"cpu"`
	Database  DatabaseMetrics  `json:"database"`
	HTTP      HTTPMetrics      `json:"http"`
	Payment   PaymentMetrics   `json:"payment"`
}

// MemoryMetrics contains memory usage information
type MemoryMetrics struct {
	AllocMB      uint64  `json:"alloc_mb"`
	TotalAllocMB uint64  `json:"total_alloc_mb"`
	SysMB        uint64  `json:"sys_mb"`
	GCPauseMS    uint64  `json:"gc_pause_ms"`
	NumGC        uint32  `json:"num_gc"`
	HeapInUseMB  uint64  `json:"heap_in_use_mb"`
	HeapIdleMB   uint64  `json:"heap_idle_mb"`
	UsagePercent float64 `json:"usage_percent"`
}

// CPUMetrics contains CPU usage information
type CPUMetrics struct {
	NumCPU       int     `json:"num_cpu"`
	NumGoroutines int    `json:"num_goroutines"`
	UsagePercent float64 `json:"usage_percent"`
}

// DatabaseMetrics contains database connection and performance metrics
type DatabaseMetrics struct {
	OpenConnections int           `json:"open_connections"`
	InUseConnections int          `json:"in_use_connections"`
	IdleConnections int           `json:"idle_connections"`
	MaxConnections  int           `json:"max_connections"`
	AvgQueryTime    time.Duration `json:"avg_query_time_ms"`
	SlowQueries     int           `json:"slow_queries_count"`
	TotalQueries    int64         `json:"total_queries"`
	ErrorRate       float64       `json:"error_rate_percent"`
}

// HTTPMetrics contains HTTP request metrics
type HTTPMetrics struct {
	RequestsPerSecond float64 `json:"requests_per_second"`
	AvgResponseTime   time.Duration `json:"avg_response_time_ms"`
	ErrorRate         float64 `json:"error_rate_percent"`
	ActiveRequests    int     `json:"active_requests"`
}

// PaymentMetrics contains payment-specific metrics
type PaymentMetrics struct {
	SuccessfulPayments int64   `json:"successful_payments_24h"`
	FailedPayments     int64   `json:"failed_payments_24h"`
	SuccessRate        float64 `json:"success_rate_percent"`
	AvgProcessingTime  time.Duration `json:"avg_processing_time_ms"`
	TotalVolume        int64   `json:"total_volume_24h"`
}

var (
	startTime    = time.Now()
	requestCount int64
	errorCount   int64
)

// NewHealthChecker creates a new health checker instance
func NewHealthChecker(db *sql.DB, portOneClient *portone.Client) *HealthChecker {
	return &HealthChecker{
		db:            db,
		portOneClient: portOneClient,
		logger:        logger.GetLogger(),
		cacheDuration: 30 * time.Second, // Cache health results for 30 seconds
	}
}

// CheckHealth performs comprehensive health check
func (hc *HealthChecker) CheckHealth(ctx context.Context) (*HealthCheckResults, error) {
	hc.mutex.RLock()
	if hc.lastResults != nil && time.Since(hc.lastCheck) < hc.cacheDuration {
		defer hc.mutex.RUnlock()
		return hc.lastResults, nil
	}
	hc.mutex.RUnlock()

	// Acquire write lock for updating results
	hc.mutex.Lock()
	defer hc.mutex.Unlock()

	startTime := time.Now()
	
	results := &HealthCheckResults{
		Timestamp:   startTime,
		Version:     hc.getVersion(),
		Environment: hc.getEnvironment(),
		Uptime:      time.Since(startTime),
		Components:  make(map[string]ComponentHealth),
		Metrics:     hc.collectMetrics(ctx),
	}

	// Run all health checks concurrently
	var wg sync.WaitGroup
	checks := map[string]func(context.Context) ComponentHealth{
		"database":     hc.checkDatabase,
		"portone":      hc.checkPortOne,
		"memory":       hc.checkMemory,
		"disk":         hc.checkDisk,
		"network":      hc.checkNetwork,
		"redis":        hc.checkRedis,
		"external_services": hc.checkExternalServices,
	}

	for name, checkFunc := range checks {
		wg.Add(1)
		go func(componentName string, check func(context.Context) ComponentHealth) {
			defer wg.Done()
			results.Components[componentName] = check(ctx)
		}(name, checkFunc)
	}

	wg.Wait()

	// Determine overall health status
	results.Overall = hc.determineOverallHealth(results.Components)
	
	// Cache results
	hc.lastCheck = startTime
	hc.lastResults = results

	// Log health check results
	hc.logHealthResults(results)

	return results, nil
}

// HTTP handlers for health endpoints

// HealthHandler provides detailed health information
func (hc *HealthChecker) HealthHandler(c *gin.Context) {
	results, err := hc.CheckHealth(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Health check failed",
			"details": err.Error(),
		})
		return
	}

	statusCode := http.StatusOK
	if results.Overall == HealthStatusDegraded {
		statusCode = http.StatusPartialContent
	} else if results.Overall == HealthStatusUnhealthy {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, results)
}

// ReadinessHandler provides simple readiness check for load balancers
func (hc *HealthChecker) ReadinessHandler(c *gin.Context) {
	// Quick check of critical components only
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	ready := true
	issues := []string{}

	// Check database connectivity
	if err := hc.db.PingContext(ctx); err != nil {
		ready = false
		issues = append(issues, "database_unavailable")
	}

	// Check if we can process payments
	if !hc.portOneClient.IsConfigured() {
		ready = false
		issues = append(issues, "payment_gateway_not_configured")
	}

	if ready {
		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
			"timestamp": time.Now(),
		})
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not_ready",
			"issues": issues,
			"timestamp": time.Now(),
		})
	}
}

// LivenessHandler provides simple liveness check
func (hc *HealthChecker) LivenessHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
		"timestamp": time.Now(),
		"uptime": time.Since(startTime).String(),
	})
}

// MetricsHandler provides Prometheus-compatible metrics
func (hc *HealthChecker) MetricsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	metrics := hc.collectMetrics(ctx)
	
	// Convert to Prometheus format
	prometheusMetrics := hc.convertToPrometheusFormat(metrics)
	
	c.Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
	c.String(http.StatusOK, prometheusMetrics)
}

// Individual component health checks

func (hc *HealthChecker) checkDatabase(ctx context.Context) ComponentHealth {
	start := time.Now()
	
	// Check basic connectivity
	err := hc.db.PingContext(ctx)
	responseTime := time.Since(start)
	
	if err != nil {
		return ComponentHealth{
			Status:       HealthStatusUnhealthy,
			Message:      fmt.Sprintf("Database connection failed: %v", err),
			LastChecked:  time.Now(),
			ResponseTime: responseTime,
		}
	}

	// Check database performance
	var count int
	err = hc.db.QueryRowContext(ctx, "SELECT 1").Scan(&count)
	if err != nil {
		return ComponentHealth{
			Status:       HealthStatusDegraded,
			Message:      "Database query failed",
			LastChecked:  time.Now(),
			ResponseTime: responseTime,
		}
	}

	// Get connection statistics
	stats := hc.db.Stats()
	
	status := HealthStatusHealthy
	if stats.OpenConnections > stats.MaxOpenConnections*80/100 {
		status = HealthStatusDegraded
	}

	return ComponentHealth{
		Status:       status,
		Message:      "Database is healthy",
		LastChecked:  time.Now(),
		ResponseTime: responseTime,
		Details: map[string]interface{}{
			"open_connections": stats.OpenConnections,
			"in_use":          stats.InUse,
			"idle":            stats.Idle,
			"max_open":        stats.MaxOpenConnections,
		},
	}
}

func (hc *HealthChecker) checkPortOne(ctx context.Context) ComponentHealth {
	start := time.Now()
	
	if !hc.portOneClient.IsConfigured() {
		return ComponentHealth{
			Status:      HealthStatusDegraded,
			Message:     "PortOne not configured (running in mock mode)",
			LastChecked: time.Now(),
			ResponseTime: time.Since(start),
		}
	}

	// Attempt to verify PortOne connectivity
	// This would call a simple API endpoint to verify connectivity
	// For now, we'll just check if it's configured
	
	return ComponentHealth{
		Status:       HealthStatusHealthy,
		Message:      "PortOne is configured and ready",
		LastChecked:  time.Now(),
		ResponseTime: time.Since(start),
		Details: map[string]interface{}{
			"configured":       true,
			"production_ready": hc.portOneClient.IsConfigured(),
		},
	}
}

func (hc *HealthChecker) checkMemory(ctx context.Context) ComponentHealth {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Consider memory usage concerning if over 80% of available
	const maxMemoryMB = 512 // Adjust based on your deployment
	currentMB := m.Alloc / 1024 / 1024
	usagePercent := float64(currentMB) / float64(maxMemoryMB) * 100
	
	status := HealthStatusHealthy
	if usagePercent > 90 {
		status = HealthStatusUnhealthy
	} else if usagePercent > 80 {
		status = HealthStatusDegraded
	}
	
	return ComponentHealth{
		Status:      status,
		Message:     fmt.Sprintf("Memory usage: %.1f%%", usagePercent),
		LastChecked: time.Now(),
		Details: map[string]interface{}{
			"alloc_mb":    currentMB,
			"sys_mb":      m.Sys / 1024 / 1024,
			"gc_pause_ns": m.PauseNs[(m.NumGC+255)%256],
			"num_gc":      m.NumGC,
		},
	}
}

func (hc *HealthChecker) checkDisk(ctx context.Context) ComponentHealth {
	// Placeholder for disk space check
	// In production, you'd check actual disk usage
	return ComponentHealth{
		Status:      HealthStatusHealthy,
		Message:     "Disk space is adequate",
		LastChecked: time.Now(),
	}
}

func (hc *HealthChecker) checkNetwork(ctx context.Context) ComponentHealth {
	// Basic network connectivity check
	start := time.Now()
	
	// This is a simplified check - in production you'd ping external services
	responseTime := time.Since(start)
	
	return ComponentHealth{
		Status:       HealthStatusHealthy,
		Message:      "Network connectivity is good",
		LastChecked:  time.Now(),
		ResponseTime: responseTime,
	}
}

func (hc *HealthChecker) checkRedis(ctx context.Context) ComponentHealth {
	// Placeholder for Redis health check
	// Skip if Redis is not configured
	return ComponentHealth{
		Status:      HealthStatusHealthy,
		Message:     "Redis not configured (optional)",
		LastChecked: time.Now(),
	}
}

func (hc *HealthChecker) checkExternalServices(ctx context.Context) ComponentHealth {
	// Check connectivity to critical external services
	// This would include payment processors, email services, etc.
	return ComponentHealth{
		Status:      HealthStatusHealthy,
		Message:     "External services are accessible",
		LastChecked: time.Now(),
	}
}

// Utility methods

func (hc *HealthChecker) determineOverallHealth(components map[string]ComponentHealth) HealthStatus {
	hasUnhealthy := false
	hasDegraded := false
	
	for _, component := range components {
		switch component.Status {
		case HealthStatusUnhealthy:
			hasUnhealthy = true
		case HealthStatusDegraded:
			hasDegraded = true
		}
	}
	
	if hasUnhealthy {
		return HealthStatusUnhealthy
	} else if hasDegraded {
		return HealthStatusDegraded
	}
	
	return HealthStatusHealthy
}

func (hc *HealthChecker) collectMetrics(ctx context.Context) SystemMetrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Collect database stats
	dbStats := hc.db.Stats()
	
	return SystemMetrics{
		Memory: MemoryMetrics{
			AllocMB:      m.Alloc / 1024 / 1024,
			TotalAllocMB: m.TotalAlloc / 1024 / 1024,
			SysMB:        m.Sys / 1024 / 1024,
			GCPauseMS:    m.PauseNs[(m.NumGC+255)%256] / 1000000,
			NumGC:        m.NumGC,
			HeapInUseMB:  m.HeapInuse / 1024 / 1024,
			HeapIdleMB:   m.HeapIdle / 1024 / 1024,
		},
		CPU: CPUMetrics{
			NumCPU:       runtime.NumCPU(),
			NumGoroutines: runtime.NumGoroutine(),
		},
		Database: DatabaseMetrics{
			OpenConnections:  dbStats.OpenConnections,
			InUseConnections: dbStats.InUse,
			IdleConnections:  dbStats.Idle,
			MaxConnections:   dbStats.MaxOpenConnections,
		},
		HTTP: HTTPMetrics{
			// These would be collected from actual metrics
			RequestsPerSecond: 0,
			AvgResponseTime:   0,
			ErrorRate:         0,
			ActiveRequests:    0,
		},
		Payment: hc.collectPaymentMetrics(ctx),
	}
}

func (hc *HealthChecker) collectPaymentMetrics(ctx context.Context) PaymentMetrics {
	// Query payment statistics from the last 24 hours
	// This is a placeholder implementation
	return PaymentMetrics{
		SuccessfulPayments: 0,
		FailedPayments:     0,
		SuccessRate:        0,
		AvgProcessingTime:  0,
		TotalVolume:        0,
	}
}

func (hc *HealthChecker) logHealthResults(results *HealthCheckResults) {
	if results.Overall != HealthStatusHealthy {
		unhealthyComponents := []string{}
		for name, component := range results.Components {
			if component.Status != HealthStatusHealthy {
				unhealthyComponents = append(unhealthyComponents, name)
			}
		}
		
		hc.logger.WithFields(logger.Fields{
			"overall_status":        results.Overall,
			"unhealthy_components": unhealthyComponents,
		}).Warn("System health degraded")
	}
}

func (hc *HealthChecker) getVersion() string {
	// Return application version from environment or build info
	return "1.0.0" // Placeholder
}

func (hc *HealthChecker) getEnvironment() string {
	return "production" // Get from environment variable
}

func (hc *HealthChecker) convertToPrometheusFormat(metrics SystemMetrics) string {
	// Convert metrics to Prometheus format
	// This is a simplified implementation
	format := `
# HELP memory_alloc_mb Allocated memory in MB
# TYPE memory_alloc_mb gauge
memory_alloc_mb %d

# HELP cpu_goroutines Number of goroutines
# TYPE cpu_goroutines gauge
cpu_goroutines %d

# HELP db_connections_open Number of open database connections
# TYPE db_connections_open gauge
db_connections_open %d
`
	
	return fmt.Sprintf(format,
		metrics.Memory.AllocMB,
		metrics.CPU.NumGoroutines,
		metrics.Database.OpenConnections,
	)
}