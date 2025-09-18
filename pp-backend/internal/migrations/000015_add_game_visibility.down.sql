-- Rollback game visibility and management fields
DROP INDEX IF EXISTS idx_games_active_display_order;

ALTER TABLE games 
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS display_order,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS icon_emoji,
DROP COLUMN IF EXISTS max_players,
DROP COLUMN IF EXISTS min_players,
DROP COLUMN IF EXISTS difficulty_level;