-- backend/internal/migrations/000013_create_logs_tables.up.sql

-- System logs table for general application logging
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL, -- debug, info, warn, error, fatal
    category VARCHAR(50) NOT NULL, -- auth, payment, user, system, api, database, game
    message TEXT NOT NULL,
    details TEXT, -- JSON or additional details
    user_id VARCHAR(255), -- References users(username), nullable for system logs
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255), -- For tracing requests
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs table for tracking user actions
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- References users(username)
    action VARCHAR(100) NOT NULL, -- login, logout, register, update_profile, etc.
    resource VARCHAR(100) NOT NULL, -- what was acted upon
    details TEXT, -- JSON or additional context
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment logs table for detailed payment tracking
CREATE TABLE payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- References users(username)
    payment_id VARCHAR(255), -- References payment_history(payment_id)
    session_id VARCHAR(255), -- References payment_sessions(session_id)
    merchant_uid VARCHAR(255), -- PortOne merchant UID
    action VARCHAR(50) NOT NULL, -- create, prepare, execute, verify, cancel, refund
    status VARCHAR(50) NOT NULL, -- created, prepared, paid, failed, cancelled
    amount INTEGER, -- Payment amount in KRW
    error_code VARCHAR(100), -- Error code from PortOne or our system
    error_message TEXT, -- Error message
    portone_data TEXT, -- JSON response from PortOne API
    ip_address INET NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
-- System logs indexes
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_request_id ON system_logs(request_id);

-- User activity logs indexes
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_user_activity_logs_success ON user_activity_logs(success);

-- Payment logs indexes
CREATE INDEX idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_session_id ON payment_logs(session_id);
CREATE INDEX idx_payment_logs_merchant_uid ON payment_logs(merchant_uid);
CREATE INDEX idx_payment_logs_action ON payment_logs(action);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_system_logs_level_category_created_at ON system_logs(level, category, created_at);
CREATE INDEX idx_user_activity_logs_user_id_created_at ON user_activity_logs(user_id, created_at);
CREATE INDEX idx_payment_logs_user_id_created_at ON payment_logs(user_id, created_at);

-- Create function to automatically clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
    -- Keep only last 90 days of system logs (except errors)
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days' 
    AND level NOT IN ('error', 'fatal');
    
    -- Keep only last 180 days of error logs
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '180 days' 
    AND level IN ('error', 'fatal');
    
    -- Keep only last 180 days of user activity logs
    DELETE FROM user_activity_logs 
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Keep payment logs forever (for compliance)
    -- DELETE FROM payment_logs WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure for logging user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id VARCHAR(255),
    p_action VARCHAR(100),
    p_resource VARCHAR(100),
    p_details TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_logs (
        user_id, action, resource, details, ip_address, user_agent, success
    ) VALUES (
        p_user_id, p_action, p_resource, p_details, p_ip_address, p_user_agent, p_success
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure for logging system events
CREATE OR REPLACE FUNCTION log_system_event(
    p_level VARCHAR(20),
    p_category VARCHAR(50),
    p_message TEXT,
    p_details TEXT DEFAULT NULL,
    p_user_id VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO system_logs (
        level, category, message, details, user_id, ip_address, user_agent, request_id
    ) VALUES (
        p_level, p_category, p_message, p_details, p_user_id, p_ip_address, p_user_agent, p_request_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure for logging payment events
CREATE OR REPLACE FUNCTION log_payment_event(
    p_user_id VARCHAR(255),
    p_payment_id VARCHAR(255) DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_merchant_uid VARCHAR(255) DEFAULT NULL,
    p_action VARCHAR(50),
    p_status VARCHAR(50),
    p_amount INTEGER DEFAULT NULL,
    p_error_code VARCHAR(100) DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_portone_data TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO payment_logs (
        user_id, payment_id, session_id, merchant_uid, action, status, amount, 
        error_code, error_message, portone_data, ip_address
    ) VALUES (
        p_user_id, p_payment_id, p_session_id, p_merchant_uid, p_action, p_status, p_amount,
        p_error_code, p_error_message, p_portone_data, p_ip_address
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;