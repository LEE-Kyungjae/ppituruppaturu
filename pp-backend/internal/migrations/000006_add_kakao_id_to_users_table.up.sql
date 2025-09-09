-- backend/internal/migrations/000006_add_kakao_id_to_users_table.up.sql

ALTER TABLE users
ADD COLUMN kakao_id VARCHAR(255) UNIQUE;