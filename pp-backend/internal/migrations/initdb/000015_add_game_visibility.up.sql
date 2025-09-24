-- Add visibility and priority fields to games table for admin management
ALTER TABLE games 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN display_order INTEGER DEFAULT 999,
ADD COLUMN category VARCHAR(100) DEFAULT 'general',
ADD COLUMN icon_emoji VARCHAR(10) DEFAULT '🎮',
ADD COLUMN max_players INTEGER DEFAULT 1,
ADD COLUMN min_players INTEGER DEFAULT 1,
ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'easy'; -- easy, medium, hard

-- Create index for better performance on active games queries
CREATE INDEX idx_games_active_display_order ON games(is_active, display_order);