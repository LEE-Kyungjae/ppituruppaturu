// backend/internal/handler/admin.go
package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// AdminHandler handles admin-related requests.
type AdminHandler struct{
	startTime time.Time
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(startTime time.Time) *AdminHandler {
	return &AdminHandler{startTime: startTime}
}

type statsResponse struct {
	Uptime string `json:"uptime" example:"1m2.345s"`
}

// Stats returns application statistics.
// @Summary      Get application statistics
// @Description  Retrieves application statistics, such as uptime. Requires admin privileges.
// @Tags         Admin
// @Produce      json
// @Success      200 {object} statsResponse
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Security     BearerAuth
// @Router       /admin/stats [get]
func (h *AdminHandler) Stats(c *gin.Context) {
	respondJSON(c, http.StatusOK, statsResponse{
		Uptime: time.Since(h.startTime).String(),
	})
}