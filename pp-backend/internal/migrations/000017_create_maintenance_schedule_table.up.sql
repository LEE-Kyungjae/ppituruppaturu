CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);