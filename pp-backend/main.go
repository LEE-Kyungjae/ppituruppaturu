// backend/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	syscall "syscall"
	time "time"

	"github.com/gin-gonic/gin"
	"exit/internal/config"
	"exit/internal/container"
	"exit/internal/router"
)

func main() {
	// --- 1. Load Configuration ---
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// --- 2. Initialize Dependencies ---
	c := container.NewContainer(cfg)
	defer c.DBConn.Close()

	// --- 3. Setup Router ---
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	router.Setup(r, c)

	// --- 4. Start Server with Graceful Shutdown ---
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}