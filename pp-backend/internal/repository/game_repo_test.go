// backend/internal/repository/game_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

func withGameRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.GameRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresGameRepository(tx)

	testFunc(repo)
}

func TestGameRepository_CreateGame(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Test success
		game, err := repo.CreateGame("Test Game", "A simple test game")
		require.NoError(t, err)
		assert.NotNil(t, game)
		assert.Equal(t, "Test Game", game.Name)
		assert.Equal(t, "A simple test game", game.Description.String)

		// Test duplicate name (should fail due to unique constraint)
		_, err = repo.CreateGame("Test Game", "Another description")
		assert.Error(t, err)
	})
}

func TestGameRepository_GetGameByID(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		game, err := repo.CreateGame("GameByID", "Description for GameByID")
		require.NoError(t, err)

		// Test success
		fetchedGame, err := repo.GetGameByID(game.ID)
		require.NoError(t, err)
		assert.Equal(t, game.ID, fetchedGame.ID)

		// Test not found
		_, err = repo.GetGameByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrGameNotFound)
	})
}

func TestGameRepository_GetGameByName(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		game, err := repo.CreateGame("GameByName", "Description for GameByName")
		require.NoError(t, err)

		// Test success
		fetchedGame, err := repo.GetGameByName("GameByName")
		require.NoError(t, err)
		assert.Equal(t, game.Name, fetchedGame.Name)

		// Test not found
		_, err = repo.GetGameByName("NonExistentGame")
		assert.ErrorIs(t, err, repository.ErrGameNotFound)
	})
}

func TestGameRepository_ListGames(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		_, err := repo.CreateGame("Game A", "Desc A")
		require.NoError(t, err)
		_, err = repo.CreateGame("Game B", "Desc B")
		require.NoError(t, err)

		// Test success
		games, err := repo.ListGames()
		require.NoError(t, err)
		assert.Len(t, games, 2)
		assert.Equal(t, "Game A", games[0].Name) // Ordered by name ASC
	})
}

func TestGameRepository_CreateGameSession(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_session", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Session Game", "Game for sessions")
		require.NoError(t, err)

		// Test success
		session, err := repo.CreateGameSession(game.ID, "player_session")
		require.NoError(t, err)
		assert.NotNil(t, session)
		assert.Equal(t, game.ID, session.GameID)
		assert.Equal(t, "player_session", session.PlayerUsername)
		assert.Equal(t, "in_progress", session.Status)
	})
}

func TestGameRepository_GetGameSessionByID(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_get_session", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Get Session Game", "Game for getting sessions")
		require.NoError(t, err)
		session, err := repo.CreateGameSession(game.ID, "player_get_session")
		require.NoError(t, err)

		// Test success
		fetchedSession, err := repo.GetGameSessionByID(session.ID)
		require.NoError(t, err)
		assert.Equal(t, session.ID, fetchedSession.ID)

		// Test not found
		_, err = repo.GetGameSessionByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrGameSessionNotFound)
	})
}

func TestGameRepository_UpdateGameSession(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_update_session", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Update Session Game", "Game for updating sessions")
		require.NoError(t, err)
		session, err := repo.CreateGameSession(game.ID, "player_update_session")
		require.NoError(t, err)

		// Test success
		session.Status = "completed"
		session.EndTime = sql.NullTime{Time: time.Now(), Valid: true}
		updatedSession, err := repo.UpdateGameSession(session)
		require.NoError(t, err)
		assert.NotNil(t, updatedSession)
		assert.Equal(t, "completed", updatedSession.Status)
		assert.True(t, updatedSession.EndTime.Valid)

		// Test not found
		session.ID = uuid.New()
		_, err = repo.UpdateGameSession(session)
		assert.ErrorIs(t, err, repository.ErrGameSessionNotFound)
	})
}

func TestGameRepository_CreateGameScore(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_score", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Score Game", "Game for scores")
		require.NoError(t, err)
		session, err := repo.CreateGameSession(game.ID, "player_score")
		require.NoError(t, err)

		// Test success
		score, err := repo.CreateGameScore(session.ID, "player_score", 100)
		require.NoError(t, err)
		assert.NotNil(t, score)
		assert.Equal(t, session.ID, score.SessionID)
		assert.Equal(t, "player_score", score.PlayerUsername)
		assert.Equal(t, 100, score.Score)

		// Test duplicate (should fail due to unique constraint)
		_, err = repo.CreateGameScore(session.ID, "player_score", 150)
		assert.Error(t, err)
	})
}

func TestGameRepository_GetGameScoreBySessionAndPlayer(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_get_score", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Get Score Game", "Game for getting scores")
		require.NoError(t, err)
		session, err := repo.CreateGameSession(game.ID, "player_get_score")
		require.NoError(t, err)
		score, err := repo.CreateGameScore(session.ID, "player_get_score", 200)
		require.NoError(t, err)

		// Test success
		fetchedScore, err := repo.GetGameScoreBySessionAndPlayer(session.ID, "player_get_score")
		require.NoError(t, err)
		assert.Equal(t, score.ID, fetchedScore.ID)

		// Test not found
		_, err = repo.GetGameScoreBySessionAndPlayer(uuid.New(), "nonexistent")
		assert.ErrorIs(t, err, repository.ErrGameScoreNotFound)
	})
}

func TestGameRepository_UpdateGameScore(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_update_score", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game, err := repo.CreateGame("Update Score Game", "Game for updating scores")
		require.NoError(t, err)
		session, err := repo.CreateGameSession(game.ID, "player_update_score")
		require.NoError(t, err)
		score, err := repo.CreateGameScore(session.ID, "player_update_score", 300)
		require.NoError(t, err)

		// Test success
		score.Score = 350
		updatedScore, err := repo.UpdateGameScore(score)
		require.NoError(t, err)
		assert.NotNil(t, updatedScore)
		assert.Equal(t, 350, updatedScore.Score)

		// Test not found
		score.ID = uuid.New()
		_, err = repo.UpdateGameScore(score)
		assert.ErrorIs(t, err, repository.ErrGameScoreNotFound)
	})
}

func TestGameRepository_ListGameScoresByGameID(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_list_game_score", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game1, err := repo.CreateGame("List Game 1", "Desc 1")
		require.NoError(t, err)
		game2, err := repo.CreateGame("List Game 2", "Desc 2")
		require.NoError(t, err)

		session1, err := repo.CreateGameSession(game1.ID, "player_list_game_score")
		require.NoError(t, err)
		session2, err := repo.CreateGameSession(game1.ID, "player_list_game_score")
		require.NoError(t, err)
		session3, err := repo.CreateGameSession(game2.ID, "player_list_game_score")
		require.NoError(t, err)

		_, err = repo.CreateGameScore(session1.ID, "player_list_game_score", 100)
		require.NoError(t, err)
		_, err = repo.CreateGameScore(session2.ID, "player_list_game_score", 200)
		require.NoError(t, err)
		_, err = repo.CreateGameScore(session3.ID, "player_list_game_score", 50)
		require.NoError(t, err)

		// Test success
		scores, err := repo.ListGameScoresByGameID(game1.ID, 10, 0)
		require.NoError(t, err)
		assert.Len(t, scores, 2)
		assert.Equal(t, 200, scores[0].Score) // Ordered by score DESC
		assert.Equal(t, 100, scores[1].Score)
	})
}

func TestGameRepository_ListGameScoresByPlayerUsername(t *testing.T) {
	withGameRepo(t, testDB, func(repo repository.GameRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("player_list_score_by_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		game1, err := repo.CreateGame("User Score Game 1", "Desc 1")
		require.NoError(t, err)
		game2, err := repo.CreateGame("User Score Game 2", "Desc 2")
		require.NoError(t, err)

		session1, err := repo.CreateGameSession(game1.ID, "player_list_score_by_user")
		require.NoError(t, err)
		session2, err := repo.CreateGameSession(game2.ID, "player_list_score_by_user")
		require.NoError(t, err)

		_, err = repo.CreateGameScore(session1.ID, "player_list_score_by_user", 100)
		require.NoError(t, err)
		_, err = repo.CreateGameScore(session2.ID, "player_list_score_by_user", 200)
		require.NoError(t, err)

		// Test success
		scores, err := repo.ListGameScoresByPlayerUsername("player_list_score_by_user", 10, 0)
		require.NoError(t, err)
		assert.Len(t, scores, 2)
		assert.Equal(t, 200, scores[0].Score) // Ordered by recorded_at DESC
		assert.Equal(t, 100, scores[1].Score)
	})
}
