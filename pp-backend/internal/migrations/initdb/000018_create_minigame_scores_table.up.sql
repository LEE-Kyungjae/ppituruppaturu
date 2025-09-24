-- Create table for persistent mini-game leaderboard scores

CREATE TABLE IF NOT EXISTS mini_game_scores (
    game_type VARCHAR(64) NOT NULL,
    player_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    best_score INT NOT NULL,
    best_points INT NOT NULL,
    best_duration_seconds INT,
    best_recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (game_type, player_username)
);

CREATE INDEX IF NOT EXISTS idx_mini_game_scores_game_type_score
    ON mini_game_scores (game_type, best_score DESC, best_recorded_at ASC);

CREATE INDEX IF NOT EXISTS idx_mini_game_scores_player
    ON mini_game_scores (player_username);
