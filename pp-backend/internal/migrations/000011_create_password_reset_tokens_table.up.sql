-- backend/internal/migrations/000011_create_password_reset_tokens_table.up.sql

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);