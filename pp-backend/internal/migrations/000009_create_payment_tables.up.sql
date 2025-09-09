-- backend/internal/migrations/000009_create_payment_tables.up.sql

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- e.g., "cosmetic", "consumable", "currency"
    price_cash INT, -- Price in real money (e.g., KRW)
    price_points INT, -- Price in virtual points
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For consumable items
    UNIQUE (user_username, item_id)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL, -- Can be null for direct currency purchases
    amount DECIMAL(10, 2) NOT NULL, -- Amount in real money
    currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_gateway_id VARCHAR(255), -- Transaction ID from payment gateway
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_username VARCHAR(255) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- earn, spend
    amount INT NOT NULL,
    description TEXT,
    balance_after INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add points column to users table
ALTER TABLE users
ADD COLUMN points INT DEFAULT 0;