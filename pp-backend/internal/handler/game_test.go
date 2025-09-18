// backend/internal/handler/game_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/handler"
	"github.com/pitturu-ppaturu/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockGameService is a mock implementation of service.GameService
type MockGameService struct {
	mock.Mock
}

func (m *MockGameService) CreateGame(name, description string) (*repository.Game, error) {
	args := m.Called(name, description)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameService) GetGameByID(id uuid.UUID) (*repository.Game, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameService) GetGameByName(name string) (*repository.Game, error) {
	args := m.Called(name)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameService) ListGames() ([]*repository.Game, error) {
	args := m.Called()
	return args.Get(0).([]*repository.Game), args.Error(1)
}

func (m *MockGameService) CreateGameSession(gameID uuid.UUID, playerUsername string) (*repository.GameSession, error) {
	args := m.Called(gameID, playerUsername)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameService) GetGameSessionByID(id uuid.UUID) (*repository.GameSession, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameService) EndGameSession(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameSession, error) {
	args := m.Called(sessionID, playerUsername, score)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameService) SubmitGameScore(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameScore, error) {
	args := m.Called(sessionID, playerUsername, score)
	return args.Get(0).(*repository.GameScore), args.Error(1)
}

func (m *MockGameService) GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*repository.GameScore, error) {
	args := m.Called(sessionID, playerUsername)
	return args.Get(0).(*repository.GameScore), args.Error(1)
}

func (m *MockGameService) ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*repository.GameScore, error) {
	args := m.Called(gameID, limit, offset)
	return args.Get(0).([]*repository.GameScore), args.Error(1)
}

func (m *MockGameService) ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*repository.GameScore, error) {
	args := m.Called(playerUsername, limit, offset)
	return args.Get(0).([]*repository.GameScore), args.Error(1)
}

func TestGameHandler_CreateGame(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.POST("/games", h.CreateGame)

	// Test success
	createReq := handler.CreateGameRequest{Name: "New Game", Description: "A new game"}
	jsonValue, _ := json.Marshal(createReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req, _ := http.NewRequest(http.MethodPost, "/games", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockGameService.On("CreateGame", "New Game", "A new game").Return(&repository.Game{}, nil).Once()

	h.CreateGame(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_GetGameByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.GET("/games/:game_id", h.GetGameByID)

	gameID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "game_id", Value: gameID.String()}}
	req, _ := http.NewRequest(http.MethodGet, "/games/"+gameID.String(), nil)
	c.Request = req

	mockGameService.On("GetGameByID", gameID).Return(&repository.Game{}, nil).Once()

	h.GetGameByID(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_ListGames(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.GET("/games", h.ListGames)

	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/games", nil)
	r.ServeHTTP(w, req)

	expectedGames := []*repository.Game{{Name: "Game1"}, {Name: "Game2"}}
	mockGameService.On("ListGames").Return(expectedGames, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_CreateGameSession(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.POST("/games/:game_id/sessions", h.CreateGameSession)

	gameID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "player1")
	c.Params = gin.Params{{Key: "game_id", Value: gameID.String()}}
	req, _ := http.NewRequest(http.MethodPost, "/games/"+gameID.String()+"/sessions", nil)
	c.Request = req

	mockGameService.On("CreateGameSession", gameID, "player1").Return(&repository.GameSession{}, nil).Once()

	h.CreateGameSession(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_EndGameSession(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.PUT("/game-sessions/:session_id/end", h.EndGameSession)

	sessionID := uuid.New()
	// Test success
	endReq := handler.EndGameSessionRequest{Score: 100}
	jsonValue, _ := json.Marshal(endReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "player1")
	c.Params = gin.Params{{Key: "session_id", Value: sessionID.String()}}
	req, _ := http.NewRequest(http.MethodPut, "/game-sessions/"+sessionID.String()+"/end", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockGameService.On("EndGameSession", sessionID, "player1", 100).Return(&repository.GameSession{}, nil).Once()

	h.EndGameSession(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_ListGameScoresByGameID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.GET("/games/:game_id/scores", h.ListGameScoresByGameID)

	gameID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/games/"+gameID.String()+"/scores?limit=5&offset=0", nil)
	r.ServeHTTP(w, req)

	expectedScores := []*repository.GameScore{{Score: 100}, {Score: 200}}
	mockGameService.On("ListGameScoresByGameID", gameID, 5, 0).Return(expectedScores, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockGameService.AssertExpectations(t)
}

func TestGameHandler_ListGameScoresByPlayerUsername(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGameService := new(MockGameService)
	h := handler.NewGameHandler(mockGameService)

	r := gin.Default()
	r.GET("/users/:username/scores", h.ListGameScoresByPlayerUsername)

	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/users/testuser/scores?limit=5&offset=0", nil)
	r.ServeHTTP(w, req)

	expectedScores := []*repository.GameScore{{Score: 100}, {Score: 200}}
	mockGameService.On("ListGameScoresByPlayerUsername", "testuser", 5, 0).Return(expectedScores, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockGameService.AssertExpectations(t)
}
