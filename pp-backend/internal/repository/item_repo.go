// backend/internal/repository/item_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrItemNotFound = errors.New("item not found")
)

type Item struct {
	ID          uuid.UUID
	Name        string
	Description sql.NullString
	Type        string
	PriceCash   sql.NullInt32
	PricePoints sql.NullInt32
	ImageURL    sql.NullString
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type UserInventory struct {
	ID           uuid.UUID
	UserUsername string
	ItemID       uuid.UUID
	Quantity     int
	PurchasedAt  time.Time
	ExpiresAt    sql.NullTime
}

type ItemRepository interface {
	CreateItem(item *Item) (*Item, error)
	GetItemByID(id uuid.UUID) (*Item, error)
	GetItemByName(name string) (*Item, error)
	ListItems() ([]*Item, error)
	UpdateItem(item *Item) (*Item, error)
	DeleteItem(id uuid.UUID) error

	AddInventoryItem(userUsername string, itemID uuid.UUID, quantity int, expiresAt sql.NullTime) (*UserInventory, error)
	GetUserInventory(userUsername string) ([]*UserInventory, error)
	RemoveInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error
}

type postgresItemRepository struct {
	db DBTX
}

func NewPostgresItemRepository(db DBTX) ItemRepository {
	return &postgresItemRepository{db: db}
}

func (r *postgresItemRepository) CreateItem(item *Item) (*Item, error) {
	query := `INSERT INTO items (name, description, type, price_cash, price_points, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, type, price_cash, price_points, image_url, created_at, updated_at`
	var createdItem Item
	err := r.db.QueryRow(query, item.Name, item.Description, item.Type, item.PriceCash, item.PricePoints, item.ImageURL).Scan(
		&createdItem.ID, &createdItem.Name, &createdItem.Description, &createdItem.Type, &createdItem.PriceCash, &createdItem.PricePoints, &createdItem.ImageURL, &createdItem.CreatedAt, &createdItem.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create item: %w", err)
	}
	return &createdItem, nil
}

func (r *postgresItemRepository) GetItemByID(id uuid.UUID) (*Item, error) {
	query := `SELECT id, name, description, type, price_cash, price_points, image_url, created_at, updated_at FROM items WHERE id = $1`
	var item Item
	err := r.db.QueryRow(query, id).Scan(&item.ID, &item.Name, &item.Description, &item.Type, &item.PriceCash, &item.PricePoints, &item.ImageURL, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrItemNotFound
		}
		return nil, fmt.Errorf("failed to get item by ID: %w", err)
	}
	return &item, nil
}

func (r *postgresItemRepository) GetItemByName(name string) (*Item, error) {
	query := `SELECT id, name, description, type, price_cash, price_points, image_url, created_at, updated_at FROM items WHERE name = $1`
	var item Item
	err := r.db.QueryRow(query, name).Scan(&item.ID, &item.Name, &item.Description, &item.Type, &item.PriceCash, &item.PricePoints, &item.ImageURL, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrItemNotFound
		}
		return nil, fmt.Errorf("failed to get item by name: %w", err)
	}
	return &item, nil
}

func (r *postgresItemRepository) ListItems() ([]*Item, error) {
	query := `SELECT id, name, description, type, price_cash, price_points, image_url, created_at, updated_at FROM items ORDER BY name ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list items: %w", err)
	}
	defer rows.Close()

	var items []*Item
	for rows.Next() {
		var item Item
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.Type, &item.PriceCash, &item.PricePoints, &item.ImageURL, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan item row: %w", err)
		}
		items = append(items, &item)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during item list iteration: %w", err)
	}

	return items, nil
}

func (r *postgresItemRepository) UpdateItem(item *Item) (*Item, error) {
	query := `UPDATE items SET name = $1, description = $2, type = $3, price_cash = $4, price_points = $5, image_url = $6, updated_at = NOW() WHERE id = $7 RETURNING id, name, description, type, price_cash, price_points, image_url, created_at, updated_at`
	var updatedItem Item
	err := r.db.QueryRow(query, item.Name, item.Description, item.Type, item.PriceCash, item.PricePoints, item.ImageURL, item.ID).Scan(
		&updatedItem.ID, &updatedItem.Name, &updatedItem.Description, &updatedItem.Type, &updatedItem.PriceCash, &updatedItem.PricePoints, &updatedItem.ImageURL, &updatedItem.CreatedAt, &updatedItem.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to update item: %w", err)
	}
	return &updatedItem, nil
}

func (r *postgresItemRepository) DeleteItem(id uuid.UUID) error {
	query := `DELETE FROM items WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrItemNotFound
	}
	return nil
}

func (r *postgresItemRepository) AddInventoryItem(userUsername string, itemID uuid.UUID, quantity int, expiresAt sql.NullTime) (*UserInventory, error) {
	query := `INSERT INTO user_inventory (user_username, item_id, quantity, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_username, item_id) DO UPDATE SET quantity = user_inventory.quantity + EXCLUDED.quantity, purchased_at = NOW(), expires_at = EXCLUDED.expires_at RETURNING id, user_username, item_id, quantity, purchased_at, expires_at`
	var inventoryItem UserInventory
	err := r.db.QueryRow(query, userUsername, itemID, quantity, expiresAt).Scan(
		&inventoryItem.ID, &inventoryItem.UserUsername, &inventoryItem.ItemID, &inventoryItem.Quantity, &inventoryItem.PurchasedAt, &inventoryItem.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to add item to inventory: %w", err)
	}
	return &inventoryItem, nil
}

func (r *postgresItemRepository) GetUserInventory(userUsername string) ([]*UserInventory, error) {
	query := `SELECT id, user_username, item_id, quantity, purchased_at, expires_at FROM user_inventory WHERE user_username = $1`
	rows, err := r.db.Query(query, userUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to get user inventory: %w", err)
	}
	defer rows.Close()

	var inventory []*UserInventory
	for rows.Next() {
		var item UserInventory
		if err := rows.Scan(&item.ID, &item.UserUsername, &item.ItemID, &item.Quantity, &item.PurchasedAt, &item.ExpiresAt); err != nil {
			return nil, fmt.Errorf("failed to scan inventory item: %w", err)
		}
		inventory = append(inventory, &item)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during user inventory iteration: %w", err)
	}

	return inventory, nil
}

func (r *postgresItemRepository) RemoveInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error {
	query := `UPDATE user_inventory SET quantity = quantity - $1 WHERE user_username = $2 AND item_id = $3 AND quantity >= $1`
	result, err := r.db.Exec(query, quantity, userUsername, itemID)
	if err != nil {
		return fmt.Errorf("failed to remove item from inventory: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return errors.New("not enough items in inventory or item not found")
	}
	return nil
}
