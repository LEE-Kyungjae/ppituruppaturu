-- backend/internal/migrations/000013_create_logs_tables.down.sql

-- Drop stored procedures
DROP FUNCTION IF EXISTS log_payment_event(VARCHAR(255), VARCHAR(255), VARCHAR(255), VARCHAR(255), VARCHAR(50), VARCHAR(50), INTEGER, VARCHAR(100), TEXT, TEXT, INET);
DROP FUNCTION IF EXISTS log_system_event(VARCHAR(20), VARCHAR(50), TEXT, TEXT, VARCHAR(255), INET, TEXT, VARCHAR(255));
DROP FUNCTION IF EXISTS log_user_activity(VARCHAR(255), VARCHAR(100), VARCHAR(100), TEXT, INET, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS cleanup_old_logs();

-- Drop indexes
DROP INDEX IF EXISTS idx_payment_logs_user_id_created_at;
DROP INDEX IF EXISTS idx_user_activity_logs_user_id_created_at;
DROP INDEX IF EXISTS idx_system_logs_level_category_created_at;

DROP INDEX IF EXISTS idx_payment_logs_created_at;
DROP INDEX IF EXISTS idx_payment_logs_status;
DROP INDEX IF EXISTS idx_payment_logs_action;
DROP INDEX IF EXISTS idx_payment_logs_merchant_uid;
DROP INDEX IF EXISTS idx_payment_logs_session_id;
DROP INDEX IF EXISTS idx_payment_logs_payment_id;
DROP INDEX IF EXISTS idx_payment_logs_user_id;

DROP INDEX IF EXISTS idx_user_activity_logs_success;
DROP INDEX IF EXISTS idx_user_activity_logs_created_at;
DROP INDEX IF EXISTS idx_user_activity_logs_action;
DROP INDEX IF EXISTS idx_user_activity_logs_user_id;

DROP INDEX IF EXISTS idx_system_logs_request_id;
DROP INDEX IF EXISTS idx_system_logs_created_at;
DROP INDEX IF EXISTS idx_system_logs_user_id;
DROP INDEX IF EXISTS idx_system_logs_category;
DROP INDEX IF EXISTS idx_system_logs_level;

-- Drop tables
DROP TABLE IF EXISTS payment_logs;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS system_logs;