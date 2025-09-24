-- backend/internal/migrations/000005_create_messages_table.up.sql

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    receiver_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);