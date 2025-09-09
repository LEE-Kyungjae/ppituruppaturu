-- backend/internal/migrations/000009_create_payment_tables.down.sql

ALTER TABLE users
DROP COLUMN points;

DROP TABLE IF EXISTS point_transactions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS user_inventory;
DROP TABLE IF EXISTS items;