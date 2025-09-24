-- backend/internal/migrations/000012_create_payment_sessions_table.up.sql

CREATE TABLE payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    merchant_uid VARCHAR(255) NOT NULL UNIQUE,
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, prepared, paid, failed, cancelled
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_tel VARCHAR(255) NOT NULL,
    buyer_addr VARCHAR(500),
    buyer_postcode VARCHAR(20),
    redirect_url VARCHAR(500),
    imp_uid VARCHAR(255), -- PortOne transaction ID
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_sessions_session_id ON payment_sessions(session_id);
CREATE INDEX idx_payment_sessions_merchant_uid ON payment_sessions(merchant_uid);
CREATE INDEX idx_payment_sessions_user_username ON payment_sessions(user_username);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_imp_uid ON payment_sessions(imp_uid);
CREATE INDEX idx_payment_sessions_created_at ON payment_sessions(created_at);

-- Create payment_history table for tracking all payments
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(255) NOT NULL UNIQUE,
    imp_uid VARCHAR(255) NOT NULL,
    merchant_uid VARCHAR(255) NOT NULL,
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- ready, paid, cancelled, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payment history
CREATE INDEX idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX idx_payment_history_imp_uid ON payment_history(imp_uid);
CREATE INDEX idx_payment_history_merchant_uid ON payment_history(merchant_uid);
CREATE INDEX idx_payment_history_user_username ON payment_history(user_username);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at);