// backend/internal/repository/minigame_score_repo.go

package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// MiniGameScore represents the persisted best score for a player in a mini-game.
type MiniGameScore struct {
	GameType            string
	PlayerUsername      string
	BestScore           int
	BestPoints          int
	BestDurationSeconds sql.NullInt32
	BestRecordedAt      time.Time
}

// MiniGameScoreRepository provides persistence for mini-game leaderboards.
type MiniGameScoreRepository interface {
	UpsertBestScore(gameType, username string, score, points, durationSeconds int) (*MiniGameScore, bool, error)
	ListTopScores(gameType string, limit int) ([]*MiniGameScore, error)
	GetPlayerRank(gameType, username string) (int, error)
}

type miniGameScoreRepository struct {
	db DBTX
}

// NewMiniGameScoreRepository creates a new repository backed by Postgres.
func NewMiniGameScoreRepository(db DBTX) MiniGameScoreRepository {
	return &miniGameScoreRepository{db: db}
}

// UpsertBestScore inserts or updates the best score for a player. Returns the stored record and
// whether the score was updated (true when the new score beats the existing best).
func (r *miniGameScoreRepository) UpsertBestScore(gameType, username string, score, points, durationSeconds int) (*MiniGameScore, bool, error) {
	query := `
		INSERT INTO mini_game_scores (game_type, player_username, best_score, best_points, best_duration_seconds, best_recorded_at)
		VALUES ($1, $2, $3, $4, NULLIF($5, 0), NOW())
		ON CONFLICT (game_type, player_username) DO UPDATE
		SET 
			best_score = CASE WHEN EXCLUDED.best_score > mini_game_scores.best_score THEN EXCLUDED.best_score ELSE mini_game_scores.best_score END,
			best_points = CASE WHEN EXCLUDED.best_score > mini_game_scores.best_score THEN EXCLUDED.best_points ELSE mini_game_scores.best_points END,
			best_duration_seconds = CASE WHEN EXCLUDED.best_score > mini_game_scores.best_score THEN EXCLUDED.best_duration_seconds ELSE mini_game_scores.best_duration_seconds END,
			best_recorded_at = CASE WHEN EXCLUDED.best_score > mini_game_scores.best_score THEN EXCLUDED.best_recorded_at ELSE mini_game_scores.best_recorded_at END
		RETURNING game_type, player_username, best_score, best_points, best_duration_seconds, best_recorded_at,
			(EXCLUDED.best_score > mini_game_scores.best_score) AS updated
	`

	var scoreRow MiniGameScore
	var updated bool
	err := r.db.QueryRow(query, gameType, username, score, points, durationSeconds).Scan(
		&scoreRow.GameType,
		&scoreRow.PlayerUsername,
		&scoreRow.BestScore,
		&scoreRow.BestPoints,
		&scoreRow.BestDurationSeconds,
		&scoreRow.BestRecordedAt,
		&updated,
	)
	if err != nil {
		return nil, false, fmt.Errorf("failed to upsert mini game score: %w", err)
	}

	return &scoreRow, updated, nil
}

// ListTopScores returns the top scores for a specific mini-game ordered by best_score DESC.
func (r *miniGameScoreRepository) ListTopScores(gameType string, limit int) ([]*MiniGameScore, error) {
	query := `
		SELECT game_type, player_username, best_score, best_points, best_duration_seconds, best_recorded_at
		FROM mini_game_scores
		WHERE game_type = $1
		ORDER BY best_score DESC, best_recorded_at ASC
		LIMIT $2
	`

	rows, err := r.db.Query(query, gameType, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list mini game scores: %w", err)
	}
	defer rows.Close()

	var scores []*MiniGameScore
	for rows.Next() {
		var score MiniGameScore
		if err := rows.Scan(&score.GameType, &score.PlayerUsername, &score.BestScore, &score.BestPoints, &score.BestDurationSeconds, &score.BestRecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan mini game score row: %w", err)
		}
		scores = append(scores, &score)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating mini game scores: %w", err)
	}

	return scores, nil
}

// GetPlayerRank calculates the 1-based rank for the given player. Returns 0 when the player has no recorded score.
func (r *miniGameScoreRepository) GetPlayerRank(gameType, username string) (int, error) {
	query := `
		SELECT position FROM (
			SELECT player_username,
			       RANK() OVER (PARTITION BY game_type ORDER BY best_score DESC, best_recorded_at ASC) AS position
			FROM mini_game_scores
			WHERE game_type = $1
		) ranked
		WHERE player_username = $2
	`

	var rank sql.NullInt64
	err := r.db.QueryRow(query, gameType, username).Scan(&rank)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to compute mini game rank: %w", err)
	}

	if !rank.Valid {
		return 0, nil
	}

	return int(rank.Int64), nil
}
