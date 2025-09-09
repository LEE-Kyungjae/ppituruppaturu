-- backend/internal/migrations/000004_create_friend_and_block_tables.down.sql

DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS friend_requests;