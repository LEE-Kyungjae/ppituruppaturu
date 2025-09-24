-- backend/internal/migrations/000004_create_friend_and_block_tables.up.sql

CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    receiver_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (sender_username, receiver_username)
);

CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_username_1 VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    user_username_2 VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_username_1, user_username_2)
);

CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    blocked_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (blocker_username, blocked_username)
);