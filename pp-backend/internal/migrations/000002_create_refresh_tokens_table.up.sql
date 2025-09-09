-- backend/internal/migrations/000002_create_refresh_tokens_table.up.sql

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token TEXT PRIMARY KEY,
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);