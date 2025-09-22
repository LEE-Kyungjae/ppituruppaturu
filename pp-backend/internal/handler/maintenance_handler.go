// backend/internal/handler/maintenance_handler.go
package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/service"
)

type MaintenanceHandler struct {
	service service.MaintenanceService
}

func NewMaintenanceHandler(service service.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{service: service}
}

type ScheduleRequest struct {
	StartTime time.Time `json:"startTime" binding:"required"`
	EndTime   time.Time `json:"endTime" binding:"required"`
	Message   string    `json:"message"`
}

// ScheduleMaintenance schedules a new maintenance window.
// @Summary      Schedule maintenance
// @Description  Schedules a new maintenance window.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        schedule body ScheduleRequest true "Maintenance details"
// @Success      201 {object} repository.MaintenanceSchedule
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/maintenance [post]
func (h *MaintenanceHandler) ScheduleMaintenance(c *gin.Context) {
	var req ScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.StartTime.IsZero() || req.EndTime.IsZero() || req.EndTime.Before(req.StartTime) {
		respondError(c, http.StatusBadRequest, "Invalid start or end time")
		return
	}

	sched, err := h.service.Schedule(req.StartTime, req.EndTime, req.Message)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to schedule maintenance")
		return
	}

	respondJSON(c, http.StatusCreated, sched)
}

// GetMaintenance returns the currently scheduled maintenance.
// @Summary      Get scheduled maintenance
// @Description  Retrieves the currently scheduled maintenance.
// @Tags         Admin
// @Produce      json
// @Success      200 {object} repository.MaintenanceSchedule
// @Failure      404 {object} Response
// @Security     BearerAuth
// @Router       /admin/maintenance [get]
func (h *MaintenanceHandler) GetMaintenance(c *gin.Context) {
	sched, err := h.service.GetScheduled()
	if err != nil {
		respondError(c, http.StatusNotFound, "No scheduled maintenance found")
		return
	}
	respondJSON(c, http.StatusOK, sched)
}

// CancelMaintenance cancels a scheduled maintenance.
// @Summary      Cancel maintenance
// @Description  Cancels a scheduled maintenance by its ID.
// @Tags         Admin
// @Param        id path string true "Maintenance ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/maintenance/{id} [delete]
func (h *MaintenanceHandler) CancelMaintenance(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Invalid maintenance ID")
		return
	}

	if err := h.service.Cancel(id); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to cancel maintenance")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}
