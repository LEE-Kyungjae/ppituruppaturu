-- backend/internal/migrations/000010_create_chat_room_tables.down.sql

ALTER TABLE messages
DROP COLUMN room_id;

ALTER TABLE messages
ALTER COLUMN receiver_username SET NOT NULL;

DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS chat_rooms;