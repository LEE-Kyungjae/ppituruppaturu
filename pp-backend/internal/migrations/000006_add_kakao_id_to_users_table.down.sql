-- backend/internal/migrations/000006_add_kakao_id_to_users_table.down.sql

ALTER TABLE users
DROP COLUMN kakao_id;