// backend/internal/service/minigame_leaderboard_service.go

package service

import (
	"fmt"
	"time"

	"github.com/pitturu-ppaturu/backend/internal/repository"
)

// MiniGameLeaderboardService exposes operations related to persistent mini-game leaderboards.
type MiniGameLeaderboardService interface {
	RecordResult(gameType, username string, score, points, durationSeconds int) (bool, error)
	GetLeaderboard(gameType string, limit int) ([]LeaderboardEntry, error)
	GetUserRank(gameType, username string) (int, error)
}

// LeaderboardEntry represents a simplified DTO for leaderboard consumers.
type LeaderboardEntry struct {
	Username        string
	Score           int
	Points          int
	DurationSeconds *int
	RecordedAt      string
}

type miniGameLeaderboardService struct {
	repo repository.MiniGameScoreRepository
}

// NewMiniGameLeaderboardService constructs a leaderboard service backed by the provided repository.
func NewMiniGameLeaderboardService(repo repository.MiniGameScoreRepository) MiniGameLeaderboardService {
	return &miniGameLeaderboardService{repo: repo}
}

// RecordResult persists the result to the leaderboard, updating the player's best score if improved.
func (s *miniGameLeaderboardService) RecordResult(gameType, username string, score, points, durationSeconds int) (bool, error) {
	if gameType == "" || username == "" {
		return false, fmt.Errorf("gameType and username are required")
	}

	stored, updated, err := s.repo.UpsertBestScore(gameType, username, score, points, durationSeconds)
	if err != nil {
		return false, err
	}

	// Treat initial insert as update as well.
	if stored != nil && stored.BestScore == score {
		updated = true
	}

	return updated, nil
}

// GetLeaderboard fetches the top leaderboard entries for a game type.
func (s *miniGameLeaderboardService) GetLeaderboard(gameType string, limit int) ([]LeaderboardEntry, error) {
	scores, err := s.repo.ListTopScores(gameType, limit)
	if err != nil {
		return nil, err
	}

	entries := make([]LeaderboardEntry, 0, len(scores))
	for _, score := range scores {
		entry := LeaderboardEntry{
			Username:   score.PlayerUsername,
			Score:      score.BestScore,
			Points:     score.BestPoints,
			RecordedAt: score.BestRecordedAt.Format(time.RFC3339),
		}
		if score.BestDurationSeconds.Valid {
			d := int(score.BestDurationSeconds.Int32)
			entry.DurationSeconds = &d
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

// GetUserRank calculates the user's rank for a specific game type.
func (s *miniGameLeaderboardService) GetUserRank(gameType, username string) (int, error) {
	return s.repo.GetPlayerRank(gameType, username)
}
