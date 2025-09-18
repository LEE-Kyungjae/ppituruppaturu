// backend/internal/repository/game_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrGameNotFound        = errors.New("game not found")
	ErrGameSessionNotFound = errors.New("game session not found")
	ErrGameScoreNotFound   = errors.New("game score not found")
)

type Game struct {
	ID              uuid.UUID
	Name            string
	Description     sql.NullString
	IsActive        bool
	DisplayOrder    int
	Category        string
	IconEmoji       string
	MaxPlayers      int
	MinPlayers      int
	DifficultyLevel string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type GameSession struct {
	ID            uuid.UUID
	GameID        uuid.UUID
	PlayerUsername string
	StartTime     time.Time
	EndTime       sql.NullTime
	Status        string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type GameScore struct {
	ID            uuid.UUID
	SessionID     uuid.UUID
	PlayerUsername string
	Score         int
	RecordedAt    time.Time
}

type GameRepository interface {
	CreateGame(name, description string) (*Game, error)
	GetGameByID(id uuid.UUID) (*Game, error)
	GetGameByName(name string) (*Game, error)
	ListGames() ([]*Game, error)
	ListActiveGames() ([]*Game, error)
	
	// Admin methods
	ListAllGamesForAdmin() ([]*Game, error)
	UpdateGameVisibility(id uuid.UUID, isActive bool) error
	UpdateGameDisplayOrder(id uuid.UUID, displayOrder int) error

	CreateGameSession(gameID uuid.UUID, playerUsername string) (*GameSession, error)
	GetGameSessionByID(id uuid.UUID) (*GameSession, error)
	UpdateGameSession(session *GameSession) (*GameSession, error)

	CreateGameScore(sessionID uuid.UUID, playerUsername string, score int) (*GameScore, error)
	GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*GameScore, error)
	UpdateGameScore(score *GameScore) (*GameScore, error)
	ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*GameScore, error)
	ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*GameScore, error)
}

type postgresGameRepository struct {
	db DBTX
}

func NewPostgresGameRepository(db DBTX) GameRepository {
	return &postgresGameRepository{db: db}
}

func (r *postgresGameRepository) CreateGame(name, description string) (*Game, error) {
	query := `INSERT INTO games (name, description) VALUES ($1, $2) RETURNING id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at`
	var game Game
	err := r.db.QueryRow(query, name, description).Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}
	return &game, nil
}

func (r *postgresGameRepository) GetGameByID(id uuid.UUID) (*Game, error) {
	query := `SELECT id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at FROM games WHERE id = $1`
	var game Game
	err := r.db.QueryRow(query, id).Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameNotFound
		}
		return nil, fmt.Errorf("failed to get game by ID: %w", err)
	}
	return &game, nil
}

func (r *postgresGameRepository) GetGameByName(name string) (*Game, error) {
	query := `SELECT id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at FROM games WHERE name = $1`
	var game Game
	err := r.db.QueryRow(query, name).Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameNotFound
		}
		return nil, fmt.Errorf("failed to get game by name: %w", err)
	}
	return &game, nil
}

func (r *postgresGameRepository) ListGames() ([]*Game, error) {
	query := `SELECT id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at FROM games WHERE is_active = true ORDER BY display_order ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list games: %w", err)
	}
	defer rows.Close()

	var games []*Game
	for rows.Next() {
		var game Game
		if err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan game row: %w", err)
		}
		games = append(games, &game)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during game list iteration: %w", err)
	}

	return games, nil
}

func (r *postgresGameRepository) CreateGameSession(gameID uuid.UUID, playerUsername string) (*GameSession, error) {
	query := `INSERT INTO game_sessions (game_id, player_username) VALUES ($1, $2) RETURNING id, game_id, player_username, start_time, end_time, status, created_at, updated_at`
	var session GameSession
	err := r.db.QueryRow(query, gameID, playerUsername).Scan(&session.ID, &session.GameID, &session.PlayerUsername, &session.StartTime, &session.EndTime, &session.Status, &session.CreatedAt, &session.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create game session: %w", err)
	}
	return &session, nil
}

func (r *postgresGameRepository) GetGameSessionByID(id uuid.UUID) (*GameSession, error) {
	query := `SELECT id, game_id, player_username, start_time, end_time, status, created_at, updated_at FROM game_sessions WHERE id = $1`
	var session GameSession
	err := r.db.QueryRow(query, id).Scan(&session.ID, &session.GameID, &session.PlayerUsername, &session.StartTime, &session.EndTime, &session.Status, &session.CreatedAt, &session.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameSessionNotFound
		}
		return nil, fmt.Errorf("failed to get game session by ID: %w", err)
	}
	return &session, nil
}

func (r *postgresGameRepository) UpdateGameSession(session *GameSession) (*GameSession, error) {
	query := `UPDATE game_sessions SET end_time = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING id, game_id, player_username, start_time, end_time, status, created_at, updated_at`
	var updatedSession GameSession
	err := r.db.QueryRow(query, session.EndTime, session.Status, session.ID).Scan(&updatedSession.ID, &updatedSession.GameID, &updatedSession.PlayerUsername, &updatedSession.StartTime, &updatedSession.EndTime, &updatedSession.Status, &updatedSession.CreatedAt, &updatedSession.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameSessionNotFound
		}
		return nil, fmt.Errorf("failed to update game session: %w", err)
	}
	return &updatedSession, nil
}

func (r *postgresGameRepository) CreateGameScore(sessionID uuid.UUID, playerUsername string, score int) (*GameScore, error) {
	query := `INSERT INTO game_scores (session_id, player_username, score) VALUES ($1, $2, $3) RETURNING id, session_id, player_username, score, recorded_at`
	var gameScore GameScore
	err := r.db.QueryRow(query, sessionID, playerUsername, score).Scan(&gameScore.ID, &gameScore.SessionID, &gameScore.PlayerUsername, &gameScore.Score, &gameScore.RecordedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create game score: %w", err)
	}
	return &gameScore, nil
}

func (r *postgresGameRepository) GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*GameScore, error) {
	query := `SELECT id, session_id, player_username, score, recorded_at FROM game_scores WHERE session_id = $1 AND player_username = $2`
	var gameScore GameScore
	err := r.db.QueryRow(query, sessionID, playerUsername).Scan(&gameScore.ID, &gameScore.SessionID, &gameScore.PlayerUsername, &gameScore.Score, &gameScore.RecordedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameScoreNotFound
		}
		return nil, fmt.Errorf("failed to get game score: %w", err)
	}
	return &gameScore, nil
}

func (r *postgresGameRepository) UpdateGameScore(score *GameScore) (*GameScore, error) {
	query := `UPDATE game_scores SET score = $1, recorded_at = NOW() WHERE id = $2 RETURNING id, session_id, player_username, score, recorded_at`
	var updatedScore GameScore
	err := r.db.QueryRow(query, score.Score, score.ID).Scan(&updatedScore.ID, &updatedScore.SessionID, &updatedScore.PlayerUsername, &updatedScore.Score, &updatedScore.RecordedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGameScoreNotFound
		}
		return nil, fmt.Errorf("failed to update game score: %w", err)
	}
	return &updatedScore, nil
}

func (r *postgresGameRepository) ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*GameScore, error) {
	query := `SELECT gs.id, gs.session_id, gs.player_username, gs.score, gs.recorded_at FROM game_scores gs JOIN game_sessions gse ON gs.session_id = gse.id WHERE gse.game_id = $1 ORDER BY gs.score DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, gameID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list game scores by game ID: %w", err)
	}
	defer rows.Close()

	var scores []*GameScore
	for rows.Next() {
		var score GameScore
		if err := rows.Scan(&score.ID, &score.SessionID, &score.PlayerUsername, &score.Score, &score.RecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan game score row: %w", err)
		}
		scores = append(scores, &score)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during game score list iteration by game ID: %w", err)
	}

	return scores, nil
}

func (r *postgresGameRepository) ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*GameScore, error) {
	query := `SELECT id, session_id, player_username, score, recorded_at FROM game_scores WHERE player_username = $1 ORDER BY recorded_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, playerUsername, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list game scores by player username: %w", err)
	}
	defer rows.Close()

	var scores []*GameScore
	for rows.Next() {
		var score GameScore
		if err := rows.Scan(&score.ID, &score.SessionID, &score.PlayerUsername, &score.Score, &score.RecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan game score row: %w", err)
		}
		scores = append(scores, &score)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during game score list iteration by player username: %w", err)
	}

	return scores, nil
}

// ListActiveGames returns only active games ordered by display_order
func (r *postgresGameRepository) ListActiveGames() ([]*Game, error) {
	query := `SELECT id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at FROM games WHERE is_active = true ORDER BY display_order ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list active games: %w", err)
	}
	defer rows.Close()

	var games []*Game
	for rows.Next() {
		var game Game
		if err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan game row: %w", err)
		}
		games = append(games, &game)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during active game list iteration: %w", err)
	}

	return games, nil
}

// ListAllGamesForAdmin returns all games (active and inactive) ordered by display_order
func (r *postgresGameRepository) ListAllGamesForAdmin() ([]*Game, error) {
	query := `SELECT id, name, description, is_active, display_order, category, icon_emoji, max_players, min_players, difficulty_level, created_at, updated_at FROM games ORDER BY display_order ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list all games for admin: %w", err)
	}
	defer rows.Close()

	var games []*Game
	for rows.Next() {
		var game Game
		if err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.IsActive, &game.DisplayOrder, &game.Category, &game.IconEmoji, &game.MaxPlayers, &game.MinPlayers, &game.DifficultyLevel, &game.CreatedAt, &game.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan game row: %w", err)
		}
		games = append(games, &game)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during admin game list iteration: %w", err)
	}

	return games, nil
}

// UpdateGameVisibility updates the is_active status of a game
func (r *postgresGameRepository) UpdateGameVisibility(id uuid.UUID, isActive bool) error {
	query := `UPDATE games SET is_active = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.db.Exec(query, isActive, id)
	if err != nil {
		return fmt.Errorf("failed to update game visibility: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrGameNotFound
	}

	return nil
}

// UpdateGameDisplayOrder updates the display_order of a game
func (r *postgresGameRepository) UpdateGameDisplayOrder(id uuid.UUID, displayOrder int) error {
	query := `UPDATE games SET display_order = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.db.Exec(query, displayOrder, id)
	if err != nil {
		return fmt.Errorf("failed to update game display order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrGameNotFound
	}

	return nil
}
