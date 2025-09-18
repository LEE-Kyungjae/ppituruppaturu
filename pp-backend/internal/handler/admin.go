// backend/internal/handler/admin.go
package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

// AdminHandler handles admin-related requests.
type AdminHandler struct{
	startTime time.Time
	gameRepo  repository.GameRepository
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(startTime time.Time, gameRepo repository.GameRepository) *AdminHandler {
	return &AdminHandler{
		startTime: startTime,
		gameRepo:  gameRepo,
	}
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

// AdminGameInfo represents game information for admin management
type AdminGameInfo struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	IsActive        bool   `json:"isActive"`
	DisplayOrder    int    `json:"displayOrder"`
	Category        string `json:"category"`
	IconEmoji       string `json:"iconEmoji"`
	MaxPlayers      int    `json:"maxPlayers"`
	MinPlayers      int    `json:"minPlayers"`
	DifficultyLevel string `json:"difficultyLevel"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}

type AdminGamesListResponse struct {
	Games []AdminGameInfo `json:"games"`
}

type UpdateGameVisibilityRequest struct {
	IsActive bool `json:"isActive"`
}

type UpdateGameDisplayOrderRequest struct {
	DisplayOrder int `json:"displayOrder"`
}

// @Summary List all games for admin management
// @Description Get all games (active and inactive) for admin management
// @Tags Admin
// @Accept json
// @Produce json
// @Success 200 {object} AdminGamesListResponse
// @Failure 401 {object} Response
// @Failure 403 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /admin/games [get]
func (h *AdminHandler) ListAllGames(c *gin.Context) {
	games, err := h.gameRepo.ListAllGamesForAdmin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to retrieve games")
		return
	}

	var adminGames []AdminGameInfo
	for _, game := range games {
		description := ""
		if game.Description.Valid {
			description = game.Description.String
		}
		
		adminGames = append(adminGames, AdminGameInfo{
			ID:              game.ID.String(),
			Name:            game.Name,
			Description:     description,
			IsActive:        game.IsActive,
			DisplayOrder:    game.DisplayOrder,
			Category:        game.Category,
			IconEmoji:       game.IconEmoji,
			MaxPlayers:      game.MaxPlayers,
			MinPlayers:      game.MinPlayers,
			DifficultyLevel: game.DifficultyLevel,
			CreatedAt:       game.CreatedAt.Format(time.RFC3339),
			UpdatedAt:       game.UpdatedAt.Format(time.RFC3339),
		})
	}

	respondJSON(c, http.StatusOK, AdminGamesListResponse{Games: adminGames})
}

// @Summary Update game visibility
// @Description Update the active status of a game
// @Tags Admin
// @Accept json
// @Produce json
// @Param gameId path string true "Game ID"
// @Param request body UpdateGameVisibilityRequest true "Visibility update request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 403 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /admin/games/{gameId}/visibility [patch]
func (h *AdminHandler) UpdateGameVisibility(c *gin.Context) {
	gameIDStr := c.Param("gameId")
	gameID, err := uuid.Parse(gameIDStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Invalid game ID")
		return
	}

	var req UpdateGameVisibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	err = h.gameRepo.UpdateGameVisibility(gameID, req.IsActive)
	if err != nil {
		if err == repository.ErrGameNotFound {
			respondError(c, http.StatusNotFound, "Game not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to update game visibility")
		return
	}

	status := "activated"
	if !req.IsActive {
		status = "deactivated"
	}

	respondJSON(c, http.StatusOK, Response{
		Message: "Game " + status + " successfully",
	})
}

// @Summary Update game display order
// @Description Update the display order of a game
// @Tags Admin
// @Accept json
// @Produce json
// @Param gameId path string true "Game ID"
// @Param request body UpdateGameDisplayOrderRequest true "Display order update request"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 403 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Security BearerAuth
// @Router /admin/games/{gameId}/order [patch]
func (h *AdminHandler) UpdateGameDisplayOrder(c *gin.Context) {
	gameIDStr := c.Param("gameId")
	gameID, err := uuid.Parse(gameIDStr)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Invalid game ID")
		return
	}

	var req UpdateGameDisplayOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.DisplayOrder < 1 {
		respondError(c, http.StatusBadRequest, "Display order must be greater than 0")
		return
	}

	err = h.gameRepo.UpdateGameDisplayOrder(gameID, req.DisplayOrder)
	if err != nil {
		if err == repository.ErrGameNotFound {
			respondError(c, http.StatusNotFound, "Game not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to update game display order")
		return
	}

	respondJSON(c, http.StatusOK, Response{
		Message: "Game display order updated successfully",
	})
}