-- backend/internal/migrations/000010_create_chat_room_tables.up.sql

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'public', -- public, private, group
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE room_members (
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    member_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (room_id, member_username)
);

-- Add room_id to messages table
ALTER TABLE messages
ADD COLUMN room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Make receiver_username nullable in messages table
ALTER TABLE messages
ALTER COLUMN receiver_username DROP NOT NULL;