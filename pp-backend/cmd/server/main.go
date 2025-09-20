// @title           PittuRu API
// @version         1.0
// @description     PittuRu 게임 플랫폼 REST API 서버
// @termsOfService  http://swagger.io/terms/
// @contact.name    PittuRu Team
// @contact.url     https://pitturu.com
// @contact.email   support@pitturu.com
// @license.name    Apache 2.0
// @license.url     http://www.apache.org/licenses/LICENSE-2.0.html
// @host            localhost:8080
// @BasePath        /api/v1
// @schemes         http https
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Bearer {token}

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/container"
	"github.com/pitturu-ppaturu/backend/internal/router"
	"github.com/pitturu-ppaturu/backend/pkg/logger"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	
	// Swagger docs - 임시 비활성화
	// _ "github.com/pitturu-ppaturu/backend/docs"
)

var (
	// Prometheus metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)
	
	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "http_request_duration_seconds",
			Help: "HTTP request duration in seconds",
		},
		[]string{"method", "endpoint"},
	)

	healthCheckFlag = flag.Bool("healthcheck", false, "Run health check and exit")
	startTime       = time.Now()
)

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
}

func main() {
	flag.Parse()

	// Handle health check flag
	if *healthCheckFlag {
		if err := healthCheck(); err != nil {
			log.Fatal("Health check failed:", err)
		}
		fmt.Println("Health check passed")
		os.Exit(0)
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Initialize logger
	logger := logger.New("info", "")

	// Set Gin mode based on environment
	if cfg.GoEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize container with all dependencies
	container, err := container.New(cfg)
	if err != nil {
		log.Fatal("Failed to initialize container:", err)
	}

	// Setup router
	router := setupRouter(cfg, logger, container)

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start game server in a separate goroutine (if enabled)
	if container.GameServer != nil {
		go func() {
			logger.Info("Starting Game Server...")
			if err := container.GameServer.Start(); err != nil {
				logger.Error("Failed to start game server:", err)
			}
		}()
	} else {
		logger.Info("Game Server is disabled (GAME_SERVER_ENABLED=false)")
	}

	// Start main HTTP server in a goroutine
	go func() {
		logger.Info(fmt.Sprintf("Main Server starting on port %s (env: %s)", cfg.Port, cfg.GoEnv))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown game server first (if enabled)
	if container.GameServer != nil {
		if err := container.GameServer.Stop(); err != nil {
			logger.Error("Failed to shutdown game server gracefully:", err)
		}
	}

	// Shutdown main HTTP server
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	logger.Info("All servers exited gracefully")
}

func setupRouter(cfg *config.Config, log *logger.Logger, appContainer *container.Container) *gin.Engine {
	r := gin.New()

	// Basic middleware
	r.Use(loggerMiddleware(log))
	r.Use(gin.Recovery())
	r.Use(prometheusMiddleware())

	// Health check endpoints
	r.GET("/health", healthHandler)
	r.HEAD("/health", healthHandler)
	r.GET("/ready", readyHandler)

	// Metrics endpoint for Prometheus
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Setup application routes
	router.Setup(r, appContainer)

	return r
}

func healthHandler(c *gin.Context) {
	health := map[string]interface{}{
		"status":      "healthy",
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"uptime":      time.Since(startTime).Seconds(),
		"version":     getVersion(),
		"environment": os.Getenv("GO_ENV"),
	}
	
	c.JSON(http.StatusOK, health)
}

func readyHandler(c *gin.Context) {
	ready := map[string]interface{}{
		"status":    "ready",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"services": map[string]string{
			"database": "healthy",
			"cache":    "healthy",
		},
	}
	
	c.JSON(http.StatusOK, ready)
}

func apiHealthHandler(c *gin.Context) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"api":       "operational",
	}
	
	c.JSON(http.StatusOK, health)
}

func databaseHealthHandler(c *gin.Context) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"database":  "connected",
	}
	
	c.JSON(http.StatusOK, health)
}

func corsMiddleware(origins string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", origins)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Length, Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func loggerMiddleware(log *logger.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

func prometheusMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		start := time.Now()
		
		c.Next()
		
		duration := time.Since(start).Seconds()
		status := fmt.Sprintf("%d", c.Writer.Status())
		
		httpRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)
	})
}

func healthCheck() error {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://localhost:8080/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func getVersion() string {
	if version := os.Getenv("APP_VERSION"); version != "" {
		return version
	}
	return "1.0.0"
}