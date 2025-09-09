// backend/internal/service/game_service_test.go

package service_test

import (
	"testing"

	"exit/internal/mocks"
	"exit/internal/repository"
	"exit/internal/service"
	serviceErrors "exit/internal/service/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestGameService_CreateGame(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	// Test success
	mockGameRepo.On("CreateGame", "New Game", "Description").Return(&repository.Game{}, nil).Once()
	game, err := svc.CreateGame("New Game", "Description")
	require.NoError(t, err)
	assert.NotNil(t, game)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_GetGameByID(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	gameID := uuid.New()
	// Test success
	mockGameRepo.On("GetGameByID", gameID).Return(&repository.Game{}, nil).Once()
	game, err := svc.GetGameByID(gameID)
	require.NoError(t, err)
	assert.NotNil(t, game)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_GetGameByName(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	// Test success
	mockGameRepo.On("GetGameByName", "Game Name").Return(&repository.Game{}, nil).Once()
	game, err := svc.GetGameByName("Game Name")
	require.NoError(t, err)
	assert.NotNil(t, game)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_ListGames(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	// Test success
	expectedGames := []*repository.Game{{Name: "Game1"}, {Name: "Game2"}}
	mockGameRepo.On("ListGames").Return(expectedGames, nil).Once()
	games, err := svc.ListGames()
	require.NoError(t, err)
	assert.Equal(t, expectedGames, games)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_CreateGameSession(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	gameID := uuid.New()
	// Test success
	mockGameRepo.On("GetGameByID", gameID).Return(&repository.Game{}, nil).Once()
	mockUserRepo.On("Find", "player1").Return(&repository.User{}, nil).Once()
	mockGameRepo.On("CreateGameSession", gameID, "player1").Return(&repository.GameSession{}, nil).Once()
	session, err := svc.CreateGameSession(gameID, "player1")
	require.NoError(t, err)
	assert.NotNil(t, session)
	mockGameRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test game not found
	mockGameRepo.On("GetGameByID", gameID).Return(nil, repository.ErrGameNotFound).Once()
	_, err = svc.CreateGameSession(gameID, "player1")
	assert.ErrorIs(t, err, serviceErrors.ErrGameNotFound)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_EndGameSession(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	sessionID := uuid.New()
	// Test success
	existingSession := &repository.GameSession{ID: sessionID, PlayerUsername: "player_end", Status: "in_progress"}
	mockGameRepo.On("GetGameSessionByID", sessionID).Return(existingSession, nil).Once()
	mockGameRepo.On("UpdateGameSession", mock.AnythingOfType("*repository.GameSession")).Return(&repository.GameSession{}, nil).Once()
	mockGameRepo.On("CreateGameScore", sessionID, "player_end", 100).Return(&repository.GameScore{}, nil).Once()
	session, err := svc.EndGameSession(sessionID, "player_end", 100)
	require.NoError(t, err)
	assert.NotNil(t, session)
	mockGameRepo.AssertExpectations(t)

	// Test session not in progress
	existingSession.Status = "completed"
	mockGameRepo.On("GetGameSessionByID", sessionID).Return(existingSession, nil).Once()
	_, err = svc.EndGameSession(sessionID, "player_end", 100)
	assert.Error(t, err)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_SubmitGameScore(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	sessionID := uuid.New()
	// Test success (create new score)
	existingScore := &repository.GameScore{ID: uuid.New(), SessionID: sessionID, PlayerUsername: "player_submit", Score: 50}
	mockGameRepo.On("GetGameScoreBySessionAndPlayer", sessionID, "player_submit").Return(nil, repository.ErrGameScoreNotFound).Once()
	mockGameRepo.On("CreateGameScore", sessionID, "player_submit", 100).Return(existingScore, nil).Once()
	score, err := svc.SubmitGameScore(sessionID, "player_submit", 100)
	require.NoError(t, err)
	assert.NotNil(t, score)
	mockGameRepo.AssertExpectations(t)

	// Test success (update existing score)
	mockGameRepo.On("GetGameScoreBySessionAndPlayer", sessionID, "player_submit").Return(existingScore, nil).Once()
	mockGameRepo.On("UpdateGameScore", mock.AnythingOfType("*repository.GameScore")).Return(&repository.GameScore{}, nil).Once()
	score, err = svc.SubmitGameScore(sessionID, "player_submit", 150)
	require.NoError(t, err)
	assert.NotNil(t, score)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_GetGameScoreBySessionAndPlayer(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	sessionID := uuid.New()
	// Test success
	mockGameRepo.On("GetGameScoreBySessionAndPlayer", sessionID, "player_get_score").Return(&repository.GameScore{}, nil).Once()
	score, err := svc.GetGameScoreBySessionAndPlayer(sessionID, "player_get_score")
	require.NoError(t, err)
	assert.NotNil(t, score)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_ListGameScoresByGameID(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	gameID := uuid.New()
	// Test success
	mockGameRepo.On("GetGameByID", gameID).Return(&repository.Game{}, nil).Once()
	expectedScores := []*repository.GameScore{{Score: 100}, {Score: 200}}
	mockGameRepo.On("ListGameScoresByGameID", gameID, 10, 0).Return(expectedScores, nil).Once()
	scores, err := svc.ListGameScoresByGameID(gameID, 10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedScores, scores)
	mockGameRepo.AssertExpectations(t)

	// Test game not found
	mockGameRepo.On("GetGameByID", gameID).Return(nil, repository.ErrGameNotFound).Once()
	_, err = svc.ListGameScoresByGameID(gameID, 10, 0)
	assert.ErrorIs(t, err, serviceErrors.ErrGameNotFound)
	mockGameRepo.AssertExpectations(t)
}

func TestGameService_ListGameScoresByPlayerUsername(t *testing.T) {
	mockGameRepo := new(mocks.MockGameRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewGameService(mockGameRepo, mockUserRepo)

	// Test success
	mockUserRepo.On("Find", "player_list").Return(&repository.User{}, nil).Once()
	expectedScores := []*repository.GameScore{{Score: 100}, {Score: 200}}
	mockGameRepo.On("ListGameScoresByPlayerUsername", "player_list", 10, 0).Return(expectedScores, nil).Once()
	scores, err := svc.ListGameScoresByPlayerUsername("player_list", 10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedScores, scores)
	mockGameRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test player not found
	mockUserRepo.On("Find", "nonexistent_player").Return(nil, repository.ErrUserNotFound).Once()
	_, err = svc.ListGameScoresByPlayerUsername("nonexistent_player", 10, 0)
	assert.ErrorIs(t, err, serviceErrors.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)
}
