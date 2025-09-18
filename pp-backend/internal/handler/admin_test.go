// backend/internal/handler/admin_test.go
package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/handler"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAdminHandler_Stats(t *testing.T) {
	gin.SetMode(gin.TestMode)

	startTime := time.Now().Add(-5 * time.Minute)
	adminHandler := handler.NewAdminHandler(startTime)

	r := gin.Default()
	r.GET("/stats", adminHandler.Stats)

	req, _ := http.NewRequest(http.MethodGet, "/stats", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "uptime")
}
