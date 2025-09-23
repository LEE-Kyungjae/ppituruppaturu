// backend/internal/handler/admin_test.go
package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/handler"
	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/stretchr/testify/mock"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAdminHandler_Stats(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 1. Instantiate mocks
	mockUserRepo := new(mocks.MockUserRepository)
	mockGameRepo := new(mocks.MockGameRepository)
	mockTransactionRepo := new(mocks.MockTransactionRepository)
	mockUserService := new(mocks.MockUserService)

	// 2. Setup mock expectations
	mockUserRepo.On("CountTotalUsers").Return(100, nil)
	mockUserRepo.On("CountActiveUsers", mock.Anything).Return(20, nil)
	mockUserRepo.On("CountNewUsers", mock.Anything).Return(5, nil)
	mockTransactionRepo.On("GetTotalRevenue").Return(10000.0, nil)
	mockTransactionRepo.On("GetRevenueSince", mock.Anything).Return(500.0, nil)
	mockTransactionRepo.On("CountTotalPayments").Return(50, nil)
	mockTransactionRepo.On("CountPaymentsByStatus", "completed").Return(45, nil)
	mockTransactionRepo.On("CountPaymentsByStatus", "failed").Return(3, nil)
	mockTransactionRepo.On("CountPaymentsByStatus", "pending").Return(2, nil)

	startTime := time.Now().Add(-5 * time.Minute)
	logFilePath := "/tmp/test.log" // Provide a dummy path

	// 3. Update NewAdminHandler call
	adminHandler := handler.NewAdminHandler(
		startTime,
		mockGameRepo,
		mockUserRepo,
		mockTransactionRepo,
		logFilePath,
		mockUserService,
	)

	r := gin.Default()
	r.GET("/stats", adminHandler.Stats)

	req, _ := http.NewRequest(http.MethodGet, "/stats", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "uptime")
	assert.Contains(t, w.Body.String(), "totalUsers")
	assert.Contains(t, w.Body.String(), "totalRevenue")

	// 4. Assert that mock expectations were met
	mockUserRepo.AssertExpectations(t)
	mockTransactionRepo.AssertExpectations(t)
}