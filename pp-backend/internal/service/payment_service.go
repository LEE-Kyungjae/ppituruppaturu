// backend/internal/service/payment_service.go
package service

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"exit/internal/repository"
	serviceErrors "exit/internal/service/errors"
)

var (
	ErrItemNotFound        = serviceErrors.ErrItemNotFound
	ErrInsufficientPoints  = serviceErrors.ErrInsufficientPoints
	ErrInvalidPurchase     = serviceErrors.ErrInvalidPurchase
)

type PaymentService interface {
	// Item Management
	CreateItem(item *repository.Item) (*repository.Item, error)
	GetItemByID(id uuid.UUID) (*repository.Item, error)
	GetItemByName(name string) (*repository.Item, error)
	ListItems() ([]*repository.Item, error)

	// Purchase Flow (IAP integration placeholder)
	PurchaseItemWithCash(userUsername string, itemID uuid.UUID, amount float64, currency, paymentGatewayID string) (*repository.Transaction, error)
	PurchaseItemWithPoints(userUsername string, itemID uuid.UUID) (*repository.Transaction, error)

	// Inventory Management
	GetUserInventory(userUsername string) ([]*repository.UserInventory, error)
	UseInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error

	// Point Management
	AddPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error)
	SpendPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error)
	GetUserPoints(userUsername string) (int, error)
	ListPointTransactions(userUsername string, limit, offset int) ([]*repository.PointTransaction, error)
}

type paymentService struct {
	itemRepo        repository.ItemRepository
	userRepo        repository.UserRepository
	transactionRepo repository.TransactionRepository
}

func NewPaymentService(itemRepo repository.ItemRepository, userRepo repository.UserRepository, transactionRepo repository.TransactionRepository) PaymentService {
	return &paymentService{
		itemRepo:        itemRepo,
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
	}
}

// Item Management
func (s *paymentService) CreateItem(item *repository.Item) (*repository.Item, error) {
	createdItem, err := s.itemRepo.CreateItem(item)
	if err != nil {
		return nil, fmt.Errorf("failed to create item: %w", err)
	}
	return createdItem, nil
}

func (s *paymentService) GetItemByID(id uuid.UUID) (*repository.Item, error) {
	item, err := s.itemRepo.GetItemByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get item by ID: %w", err)
	}
	return item, nil
}

func (s *paymentService) GetItemByName(name string) (*repository.Item, error) {
	item, err := s.itemRepo.GetItemByName(name)
	if err != nil {
		return nil, fmt.Errorf("failed to get item by name: %w", err)
	}
	return item, nil
}

func (s *paymentService) ListItems() ([]*repository.Item, error) {
	items, err := s.itemRepo.ListItems()
	if err != nil {
		return nil, fmt.Errorf("failed to list items: %w", err)
	}
	return items, nil
}

// Purchase Flow
func (s *paymentService) PurchaseItemWithCash(userUsername string, itemID uuid.UUID, amount float64, currency, paymentGatewayID string) (*repository.Transaction, error) {
	// 1. Validate item and user
	item, err := s.itemRepo.GetItemByID(itemID)
	if err != nil {
		return nil, fmt.Errorf("item not found: %w", ErrItemNotFound)
	}
	_, err = s.userRepo.Find(userUsername)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", serviceErrors.ErrUserNotFound)
	}

	// 2. Check if item can be purchased with cash and amount matches
	if item.PriceCash.Valid && item.PriceCash.Int32 != int32(amount) {
		return nil, ErrInvalidPurchase
	}

	// 3. Create pending transaction (this would typically happen after payment gateway confirmation)
	// For IAP, this would be after receipt validation.
	tx := &repository.Transaction{
		UserUsername: userUsername,
		ItemID:       sql.Null[uuid.UUID]{V: itemID, Valid: true},
		Amount:       amount,
		Currency:     currency,
		Status:       "pending",
		PaymentGatewayID: sql.NullString{String: paymentGatewayID, Valid: true},
	}
	createdTx, err := s.transactionRepo.CreateTransaction(tx)
	if err != nil {
		return nil, fmt.Errorf("failed to create pending transaction: %w", err)
	}

	// 4. Add item to user inventory (this would typically happen after payment gateway confirmation)
	_, err = s.itemRepo.AddInventoryItem(userUsername, itemID, 1, sql.NullTime{}) // Assuming quantity 1 for now
	if err != nil {
		// Rollback transaction status to failed if inventory update fails
		s.transactionRepo.UpdateTransactionStatus(createdTx.ID, "failed", sql.NullString{String: "inventory_add_failed", Valid: true})
		return nil, fmt.Errorf("failed to add item to inventory: %w", err)
	}

	// 5. Update transaction status to completed (this would typically happen after payment gateway confirmation)
	s.transactionRepo.UpdateTransactionStatus(createdTx.ID, "completed", sql.NullString{String: paymentGatewayID, Valid: true})

	return createdTx, nil
}

func (s *paymentService) PurchaseItemWithPoints(userUsername string, itemID uuid.UUID) (*repository.Transaction, error) {
	// 1. Validate item and user
	item, err := s.itemRepo.GetItemByID(itemID)
	if err != nil {
		return nil, fmt.Errorf("item not found: %w", ErrItemNotFound)
	}
	user, err := s.userRepo.Find(userUsername)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", serviceErrors.ErrUserNotFound)
	}

	// 2. Check if item can be purchased with points and user has enough points
	if !item.PricePoints.Valid || user.Points < int(item.PricePoints.Int32) {
		return nil, ErrInsufficientPoints
	}

	// 3. Deduct points
	_, err = s.SpendPoints(userUsername, int(item.PricePoints.Int32), fmt.Sprintf("Purchase of %s", item.Name))
	if err != nil {
		return nil, fmt.Errorf("failed to deduct points: %w", err)
	}

	// 4. Add item to user inventory
	_, err = s.itemRepo.AddInventoryItem(userUsername, itemID, 1, sql.NullTime{}) // Assuming quantity 1 for now
	if err != nil {
		// Need to implement transaction rollback to restore user points if inventory update fails
		return nil, fmt.Errorf("failed to add item to inventory: %w", err)
	}

	// 5. Create transaction record (optional for point purchases, but good for history)
	tx := &repository.Transaction{
		UserUsername: userUsername,
		ItemID:       sql.Null[uuid.UUID]{V: itemID, Valid: true},
		Amount:       float64(item.PricePoints.Int32), // Record points as amount for consistency
		Currency:     "POINTS",
		Status:       "completed",
	}
	createdTx, err := s.transactionRepo.CreateTransaction(tx)
	if err != nil {
		return nil, fmt.Errorf("failed to record point purchase transaction: %w", err)
	}

	return createdTx, nil
}

// Inventory Management
func (s *paymentService) GetUserInventory(userUsername string) ([]*repository.UserInventory, error) {
	inventory, err := s.itemRepo.GetUserInventory(userUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to get user inventory: %w", err)
	}
	return inventory, nil
}

func (s *paymentService) UseInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error {
	// Check if user has item and enough quantity
	// This would involve fetching inventory and checking

	err := s.itemRepo.RemoveInventoryItem(userUsername, itemID, quantity)
	if err != nil {
		return fmt.Errorf("failed to use inventory item: %w", err)
	}
	return nil
}

// Point Management
func (s *paymentService) AddPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error) {
	user, err := s.userRepo.Find(userUsername)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", serviceErrors.ErrUserNotFound)
	}

	newBalance := user.Points + amount

	ptx := &repository.PointTransaction{
		UserUsername: userUsername,
		Type:         "earn",
		Amount:       amount,
		Description:  sql.NullString{String: description, Valid: true},
		BalanceAfter: sql.NullInt32{Int32: int32(newBalance), Valid: true},
	}
	createdPtx, err := s.transactionRepo.CreatePointTransaction(ptx)
	if err != nil {
		return nil, fmt.Errorf("failed to record point earning: %w", err)
	}

	// Update user's total points
	user.Points = newBalance
	_, err = s.userRepo.Update(user) // Assuming Update handles points update
	if err != nil {
		return nil, fmt.Errorf("failed to update user points: %w", err)
	}

	return createdPtx, nil
}

func (s *paymentService) SpendPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error) {
	user, err := s.userRepo.Find(userUsername)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", serviceErrors.ErrUserNotFound)
	}

	if user.Points < amount {
		return nil, ErrInsufficientPoints
	}

	newBalance := user.Points - amount

	ptx := &repository.PointTransaction{
		UserUsername: userUsername,
		Type:         "spend",
		Amount:       amount,
		Description:  sql.NullString{String: description, Valid: true},
		BalanceAfter: sql.NullInt32{Int32: int32(newBalance), Valid: true},
	}
	createdPtx, err := s.transactionRepo.CreatePointTransaction(ptx)
	if err != nil {
		return nil, fmt.Errorf("failed to record point spending: %w", err)
	}

	// Update user's total points
	user.Points = newBalance
	_, err = s.userRepo.Update(user) // Assuming Update handles points update
	if err != nil {
		return nil, fmt.Errorf("failed to update user points: %w", err)
	}

	return createdPtx, nil
}

func (s *paymentService) GetUserPoints(userUsername string) (int, error) {
	user, err := s.userRepo.Find(userUsername)
	if err != nil {
		return 0, fmt.Errorf("user not found: %w", serviceErrors.ErrUserNotFound)
	}
	return user.Points, nil
}

func (s *paymentService) ListPointTransactions(userUsername string, limit, offset int) ([]*repository.PointTransaction, error) {
	transactions, err := s.transactionRepo.ListPointTransactionsByUsername(userUsername, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list point transactions: %w", err)
	}
	return transactions, nil
}