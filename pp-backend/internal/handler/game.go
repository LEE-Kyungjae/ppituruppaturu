// backend/internal/handler/game.go
package handler

import (
	"errors"
	"net/http"
	"strconv"

	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GameHandler handles game-related requests.
type GameHandler struct {
	gameService service.GameService
}

// NewGameHandler creates a new GameHandler.
func NewGameHandler(gs service.GameService) *GameHandler {
	return &GameHandler{gameService: gs}
}

// CreateGame handles creating a new game definition.
// @Summary      Create a new game
// @Description  Creates a new game definition (e.g., OX Quiz, Puzzle Game).
// @Tags         Game
// @Accept       json
// @Produce      json
// @Param        game body CreateGameRequest true "Game details"
// @Success      201 {object} repository.Game
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /games [post]
func (h *GameHandler) CreateGame(c *gin.Context) {
	var req CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	game, err := h.gameService.CreateGame(req.Name, req.Description)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to create game")
		return
	}

	respondJSON(c, http.StatusCreated, game)
}

// GetGameByID handles retrieving a game definition by its ID.
// @Summary      Get game by ID
// @Description  Retrieves a single game definition by its unique ID.
// @Tags         Game
// @Produce      json
// @Param        game_id path string true "Game ID"
// @Success      200 {object} repository.Game
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /games/{game_id} [get]
func (h *GameHandler) GetGameByID(c *gin.Context) {
	gameID, err := uuid.Parse(c.Param("game_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid game ID")
		return
	}

	game, err := h.gameService.GetGameByID(gameID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrGameNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve game")
		return
	}

	respondJSON(c, http.StatusOK, game)
}

// ListGames handles listing all game definitions.
// @Summary      List all games
// @Description  Retrieves a list of all game definitions.
// @Tags         Game
// @Produce      json
// @Success      200 {array} repository.Game
// @Failure      500 {object} Response
// @Router       /games [get]
func (h *GameHandler) ListGames(c *gin.Context) {
	games, err := h.gameService.ListGames()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list games")
		return
	}

	respondJSON(c, http.StatusOK, games)
}

// CreateGameSession handles creating a new game session.
// @Summary      Create a new game session
// @Description  Creates a new session for a specific game.
// @Tags         Game
// @Accept       json
// @Produce      json
// @Param        game_id path string true "Game ID"
// @Success      201 {object} repository.GameSession
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /games/{game_id}/sessions [post]
func (h *GameHandler) CreateGameSession(c *gin.Context) {
	gameID, err := uuid.Parse(c.Param("game_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid game ID")
		return
	}

	playerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	session, err := h.gameService.CreateGameSession(gameID, playerUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrGameNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to create game session")
		return
	}

	respondJSON(c, http.StatusCreated, session)
}

// EndGameSession handles ending a game session and submitting a score.
// @Summary      End a game session
// @Description  Ends an active game session and submits the player's score.
// @Tags         Game
// @Accept       json
// @Produce      json
// @Param        session_id path string true "Game Session ID"
// @Param        score body EndGameSessionRequest true "Score details"
// @Success      200 {object} repository.GameSession
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /game-sessions/{session_id}/end [put]
func (h *GameHandler) EndGameSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("session_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid session ID")
		return
	}

	playerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req EndGameSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updatedSession, err := h.gameService.EndGameSession(sessionID, playerUsername.(string), req.Score)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrGameSessionNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to end game session")
		return
	}

	respondJSON(c, http.StatusOK, updatedSession)
}

// ListGameScoresByGameID handles listing game scores for a specific game.
// @Summary      List game scores by game ID
// @Description  Retrieves a list of game scores for a specific game, ordered by score.
// @Tags         Game
// @Produce      json
// @Param        game_id path string true "Game ID"
// @Param        limit query int false "Limit the number of scores returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.GameScore
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /games/{game_id}/scores [get]
func (h *GameHandler) ListGameScoresByGameID(c *gin.Context) {
	gameID, err := uuid.Parse(c.Param("game_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid game ID")
		return
	}

	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid limit parameter")
		return
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid offset parameter")
		return
	}

	scores, err := h.gameService.ListGameScoresByGameID(gameID, limitInt, offsetInt)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrGameNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to list game scores")
		return
	}

	respondJSON(c, http.StatusOK, scores)
}

// ListGameScoresByPlayerUsername handles listing game scores for a specific player.
// @Summary      List game scores by player
// @Description  Retrieves a list of game scores for a specific player, ordered by recorded time.
// @Tags         Game
// @Produce      json
// @Param        username path string true "Player username"
// @Param        limit query int false "Limit the number of scores returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.GameScore
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /users/{username}/scores [get]
func (h *GameHandler) ListGameScoresByPlayerUsername(c *gin.Context) {
	playerUsername := c.Param("username")

	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid limit parameter")
		return
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid offset parameter")
		return
	}

	scores, err := h.gameService.ListGameScoresByPlayerUsername(playerUsername, limitInt, offsetInt)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to list game scores")
		return
	}

	respondJSON(c, http.StatusOK, scores)
}

type CreateGameRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type EndGameSessionRequest struct {
	Score int `json:"score" binding:"required"`
}
