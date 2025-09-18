// backend/internal/service/game_service.go

package service

import (
	"database/sql"
	"fmt"
	"time"
	"errors"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
)

var (
	ErrGameNotFound        = serviceErrors.ErrGameNotFound
	ErrGameSessionNotFound = serviceErrors.ErrGameSessionNotFound
	ErrGameScoreNotFound   = serviceErrors.ErrGameScoreNotFound
)

type GameService interface {
	// Game Management
	CreateGame(name, description string) (*repository.Game, error)
	GetGameByID(id uuid.UUID) (*repository.Game, error)
	GetGameByName(name string) (*repository.Game, error)
	ListGames() ([]*repository.Game, error)

	// Game Session Management
	CreateGameSession(gameID uuid.UUID, playerUsername string) (*repository.GameSession, error)
	GetGameSessionByID(id uuid.UUID) (*repository.GameSession, error)
	EndGameSession(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameSession, error)

	// Game Score Management
	SubmitGameScore(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameScore, error)
	GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*repository.GameScore, error)
	ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*repository.GameScore, error)
	ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*repository.GameScore, error)
}

type gameService struct {
	gameRepo repository.GameRepository
	userRepo repository.UserRepository
}

func NewGameService(gameRepo repository.GameRepository, userRepo repository.UserRepository) GameService {
	return &gameService{
		gameRepo: gameRepo,
		userRepo: userRepo,
	}
}

// Game Management
func (s *gameService) CreateGame(name, description string) (*repository.Game, error) {
	game, err := s.gameRepo.CreateGame(name, description)
	if err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}
	return game, nil
}

func (s *gameService) GetGameByID(id uuid.UUID) (*repository.Game, error) {
	game, err := s.gameRepo.GetGameByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get game by ID: %w", err)
	}
	return game, nil
}

func (s *gameService) GetGameByName(name string) (*repository.Game, error) {
	game, err := s.gameRepo.GetGameByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to get game by name: %w", err)
	}
	return game, nil
}

func (s *gameService) ListGames() ([]*repository.Game, error) {
	games, err := s.gameRepo.ListGames()
	if err != nil {
		return nil, fmt.Errorf("failed to list games: %w", err)
	}
	return games, nil
}

// Game Session Management
func (s *gameService) CreateGameSession(gameID uuid.UUID, playerUsername string) (*repository.GameSession, error) {
	// Check if game exists
	_, err := s.gameRepo.GetGameByID(gameID)
	if err != nil {
		return nil, fmt.Errorf("game not found: %w", serviceErrors.ErrGameNotFound)
	}

	// Check if player exists
	_, err = s.userRepo.Find(playerUsername)
	if err != nil {
		return nil, fmt.Errorf("player user not found: %w", serviceErrors.ErrUserNotFound)
	}

	session, err := s.gameRepo.CreateGameSession(gameID, playerUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to create game session: %w", err)
	}
	return session, nil
}

func (s *gameService) GetGameSessionByID(id uuid.UUID) (*repository.GameSession, error) {
	session, err := s.gameRepo.GetGameSessionByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get game session by ID: %w", err)
	}
	return session, nil
}

func (s *gameService) EndGameSession(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameSession, error) {
	session, err := s.gameRepo.GetGameSessionByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get game session for ending: %w", err)
	}

	if session.PlayerUsername != playerUsername {
		return nil, fmt.Errorf("user is not the player of this session")
	}

	if session.Status != "in_progress" {
		return nil, fmt.Errorf("game session is not in progress")
	}

	session.EndTime = sql.NullTime{Time: time.Now(), Valid: true}
	session.Status = "completed"

	updatedSession, err := s.gameRepo.UpdateGameSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to update game session status: %w", err)
	}

	// Submit score
	_, err = s.SubmitGameScore(sessionID, playerUsername, score)
	if err != nil {
		return nil, fmt.Errorf("failed to submit score after ending session: %w", err)
	}

	return updatedSession, nil
}

// Game Score Management
func (s *gameService) SubmitGameScore(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameScore, error) {
	// Check if session exists and belongs to player
	session, err := s.gameRepo.GetGameSessionByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("game session not found for score submission: %w", serviceErrors.ErrGameSessionNotFound)
	}

	if session.PlayerUsername != playerUsername {
		return nil, fmt.Errorf("user is not the player of this session")
	}

	// Check if score already exists for this session and player
	existingScore, err := s.gameRepo.GetGameScoreBySessionAndPlayer(sessionID, playerUsername)
	if err != nil && !errors.Is(err, serviceErrors.ErrGameScoreNotFound) {
		return nil, fmt.Errorf("failed to check existing score: %w", err)
	}

	if existingScore != nil { // Update existing score
		existingScore.Score = score
		updatedScore, err := s.gameRepo.UpdateGameScore(existingScore)
		if err != nil {
			return nil, fmt.Errorf("failed to update existing game score: %w", err)
		}
		return updatedScore, nil
	} else { // Create new score
		newScore, err := s.gameRepo.CreateGameScore(sessionID, playerUsername, score)
		if err != nil {
			return nil, fmt.Errorf("failed to create new game score: %w", err)
		}
		return newScore, nil
	}
}

func (s *gameService) GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*repository.GameScore, error) {
	score, err := s.gameRepo.GetGameScoreBySessionAndPlayer(sessionID, playerUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to get game score: %w", err)
	}
	return score, nil
}

func (s *gameService) ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*repository.GameScore, error) {
	// Check if game exists
	_, err := s.gameRepo.GetGameByID(gameID)
	if err != nil {
		return nil, fmt.Errorf("game not found for score listing: %w", serviceErrors.ErrGameNotFound)
	}

	scores, err := s.gameRepo.ListGameScoresByGameID(gameID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list game scores by game ID: %w", err)
	}
	return scores, nil
}

func (s *gameService) ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*repository.GameScore, error) {
	// Check if player exists
	_, err := s.userRepo.Find(playerUsername)
	if err != nil {
		return nil, fmt.Errorf("player user not found: %w", serviceErrors.ErrUserNotFound)
	}

	scores, err := s.gameRepo.ListGameScoresByPlayerUsername(playerUsername, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list game scores by player username: %w", err)
	}
	return scores, nil
}