-- backend/internal/migrations/000003_add_user_profile_fields.up.sql

ALTER TABLE users
ADD COLUMN nickname VARCHAR(255) UNIQUE,
ADD COLUMN profile_picture_url VARCHAR(255),
ADD COLUMN status_message VARCHAR(255),
ADD COLUMN last_online_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;