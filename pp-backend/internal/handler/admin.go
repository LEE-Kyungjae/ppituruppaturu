// backend/internal/handler/admin.go
package handler

import (
	"bufio"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"
)

// AdminHandler handles admin-related requests.
type AdminHandler struct {
	startTime       time.Time
	gameRepo        repository.GameRepository
	userRepo        repository.UserRepository
	transactionRepo repository.TransactionRepository
	logFilePath     string
	userService     service.UserService
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(startTime time.Time, gameRepo repository.GameRepository, userRepo repository.UserRepository, transactionRepo repository.TransactionRepository, logFilePath string, userService service.UserService) *AdminHandler {
	return &AdminHandler{
		startTime:       startTime,
		gameRepo:        gameRepo,
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
		logFilePath:     logFilePath,
		userService:     userService,
	}

// DashboardStatsResponse defines the structure for the dashboard statistics.
type DashboardStatsResponse struct {
	Uptime              string  `json:"uptime"`
	TotalUsers          int     `json:"totalUsers"`
	ActiveUsers24h      int     `json:"activeUsers24h"`
	NewUsers24h         int     `json:"newUsers24h"`
	TotalRevenue        float64 `json:"totalRevenue"`
	Revenue24h          float64 `json:"revenue24h"`
	TotalPayments       int     `json:"totalPayments"`
	SuccessfulPayments  int     `json:"successfulPayments"`
	FailedPayments      int     `json:"failedPayments"`
	PendingPayments     int     `json:"pendingPayments"`
	PaymentSuccessRate  float64 `json:"paymentSuccessRate"`
}

// Stats returns application statistics for the admin dashboard.
// @Summary      Get application statistics for dashboard
// @Description  Retrieves a comprehensive set of application statistics for the admin dashboard.
// @Tags         Admin
// @Produce      json
// @Success      200 {object} DashboardStatsResponse
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Security     BearerAuth
// @Router       /admin/stats [get]
func (h *AdminHandler) Stats(c *gin.Context) {
	time24hAgo := time.Now().Add(-24 * time.Hour)

	totalUsers, err := h.userRepo.CountTotalUsers()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get total users")
		return
	}

	activeUsers, err := h.userRepo.CountActiveUsers(time24hAgo)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get active users")
		return
	}

	newUsers, err := h.userRepo.CountNewUsers(time24hAgo)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get new users")
		return
	}

	totalRevenue, err := h.transactionRepo.GetTotalRevenue()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get total revenue")
		return
	}

	revenue24h, err := h.transactionRepo.GetRevenueSince(time24hAgo)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get recent revenue")
		return
	}

	totalPayments, err := h.transactionRepo.CountTotalPayments()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get total payments")
		return
	}

	successfulPayments, err := h.transactionRepo.CountPaymentsByStatus("completed")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get successful payments")
		return
	}

	failedPayments, err := h.transactionRepo.CountPaymentsByStatus("failed")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get failed payments")
		return
	}

	pendingPayments, err := h.transactionRepo.CountPaymentsByStatus("pending")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get pending payments")
		return
	}

	var paymentSuccessRate float64
	if totalPayments > 0 {
		paymentSuccessRate = (float64(successfulPayments) / float64(totalPayments)) * 100
	}

	stats := DashboardStatsResponse{
		Uptime:             time.Since(h.startTime).String(),
		TotalUsers:         totalUsers,
		ActiveUsers24h:     activeUsers,
		NewUsers24h:        newUsers,
		TotalRevenue:       totalRevenue,
		Revenue24h:         revenue24h,
		TotalPayments:      totalPayments,
		SuccessfulPayments: successfulPayments,
		FailedPayments:     failedPayments,
		PendingPayments:    pendingPayments,
		PaymentSuccessRate: paymentSuccessRate,
	}

	respondJSON(c, http.StatusOK, stats)
}

// GetLogs returns the last N lines of the log file.
// @Summary      Get system logs
// @Description  Retrieves the last N lines of the system log file.
// @Tags         Admin
// @Produce      json
// @Success      200 {array}  string
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/logs [get]
func (h *AdminHandler) GetLogs(c *gin.Context) {
	file, err := os.Open(h.logFilePath)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Log file not found or could not be opened")
		return
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Return the last 1000 lines
	start := 0
	if len(lines) > 1000 {
		start = len(lines) - 1000
	}

	respondJSON(c, http.StatusOK, lines[start:])
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

type UpdateGameDisplayOrderRequest {
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

// BanUser bans a user.
// @Summary      Ban a user
// @Description  Bans a user by their username.
// @Tags         Admin
// @Param        username path string true "Username"
// @Success      200 {object} Response
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/users/{username}/ban [post]
func (h *AdminHandler) BanUser(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		respondError(c, http.StatusBadRequest, "Username is required")
		return
	}

	if err := h.userService.BanUser(username); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "User not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to ban user")
		return
	}

	respondJSON(c, http.StatusOK, Response{Message: "User banned successfully"})
}