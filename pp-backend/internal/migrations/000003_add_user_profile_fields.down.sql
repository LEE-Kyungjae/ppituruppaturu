-- backend/internal/migrations/000003_add_user_profile_fields.down.sql

ALTER TABLE users
DROP COLUMN nickname,
DROP COLUMN profile_picture_url,
DROP COLUMN status_message,
DROP COLUMN last_online_at,
DROP COLUMN is_active,
DROP COLUMN deleted_at;