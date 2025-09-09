-- backend/internal/migrations/000012_create_payment_sessions_table.down.sql

-- Drop indexes first
DROP INDEX IF EXISTS idx_payment_history_created_at;
DROP INDEX IF EXISTS idx_payment_history_status;
DROP INDEX IF EXISTS idx_payment_history_user_username;
DROP INDEX IF EXISTS idx_payment_history_merchant_uid;
DROP INDEX IF EXISTS idx_payment_history_imp_uid;
DROP INDEX IF EXISTS idx_payment_history_payment_id;

DROP INDEX IF EXISTS idx_payment_sessions_created_at;
DROP INDEX IF EXISTS idx_payment_sessions_imp_uid;
DROP INDEX IF EXISTS idx_payment_sessions_status;
DROP INDEX IF EXISTS idx_payment_sessions_user_username;
DROP INDEX IF EXISTS idx_payment_sessions_merchant_uid;
DROP INDEX IF EXISTS idx_payment_sessions_session_id;

-- Drop tables
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS payment_sessions;