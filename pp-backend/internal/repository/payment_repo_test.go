// backend/internal/repository/payment_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"exit/internal/repository"
)

func withItemRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.ItemRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresItemRepository(tx)

	testFunc(repo)
}

func withTransactionRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.TransactionRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresTransactionRepository(tx)

	testFunc(repo)
}

func TestItemRepository_CreateItem(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Test success
		item := &repository.Item{
			Name:        "Test Item",
			Description: sql.NullString{String: "A test item", Valid: true},
			Type:        "consumable",
			PriceCash:   sql.NullInt32{Int32: 1000, Valid: true},
			PricePoints: sql.NullInt32{Int32: 100, Valid: true},
			ImageURL:    sql.NullString{String: "http://example.com/item.png", Valid: true},
		}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)
		assert.NotNil(t, createdItem)
		assert.Equal(t, item.Name, createdItem.Name)

		// Test duplicate name (should fail due to unique constraint)
		_, err = repo.CreateItem(item)
		assert.Error(t, err)
	})
}

func TestItemRepository_GetItemByID(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		item := &repository.Item{Name: "Get Item", Type: "cosmetic"}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)

		// Test success
		fetchedItem, err := repo.GetItemByID(createdItem.ID)
		require.NoError(t, err)
		assert.Equal(t, createdItem.ID, fetchedItem.ID)

		// Test not found
		_, err = repo.GetItemByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrItemNotFound)
	})
}

func TestItemRepository_GetItemByName(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		item := &repository.Item{Name: "Get Item By Name", Type: "cosmetic"}
		_, err := repo.CreateItem(item)
		require.NoError(t, err)

		// Test success
		fetchedItem, err := repo.GetItemByName("Get Item By Name")
		require.NoError(t, err)
		assert.Equal(t, item.Name, fetchedItem.Name)

		// Test not found
		_, err = repo.GetItemByName("NonExistentItem")
		assert.ErrorIs(t, err, repository.ErrItemNotFound)
	})
}

func TestItemRepository_ListItems(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		_, err := repo.CreateItem(&repository.Item{Name: "Item A", Type: "cosmetic"})
		require.NoError(t, err)
		_, err = repo.CreateItem(&repository.Item{Name: "Item B", Type: "consumable"})
		require.NoError(t, err)

		// Test success
		items, err := repo.ListItems()
		require.NoError(t, err)
		assert.Len(t, items, 2)
		assert.Equal(t, "Item A", items[0].Name) // Ordered by name ASC
	})
}

func TestItemRepository_UpdateItem(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		item := &repository.Item{Name: "Update Item", Type: "cosmetic"}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)

		// Test success
		createdItem.Description = sql.NullString{String: "Updated Desc", Valid: true}
		createdItem.PriceCash = sql.NullInt32{Int32: 2000, Valid: true}
		updatedItem, err := repo.UpdateItem(createdItem)
		require.NoError(t, err)
		assert.NotNil(t, updatedItem)
		assert.Equal(t, "Updated Desc", updatedItem.Description.String)
		assert.Equal(t, int32(2000), updatedItem.PriceCash.Int32)

		// Test not found
		createdItem.ID = uuid.New()
		_, err = repo.UpdateItem(createdItem)
		assert.Error(t, err)
	})
}

func TestItemRepository_DeleteItem(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		item := &repository.Item{Name: "Delete Item", Type: "cosmetic"}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)

		// Test success
		err = repo.DeleteItem(createdItem.ID)
		require.NoError(t, err)

		// Verify deletion
		_, err = repo.GetItemByID(createdItem.ID)
		assert.ErrorIs(t, err, repository.ErrItemNotFound)
	})
}

func TestItemRepository_AddInventoryItem(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("inv_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		item := &repository.Item{Name: "Inv Item", Type: "consumable"}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)

		// Test success
		inv, err := repo.AddInventoryItem("inv_user", createdItem.ID, 1, sql.NullTime{})
		require.NoError(t, err)
		assert.NotNil(t, inv)
		assert.Equal(t, 1, inv.Quantity)

		// Test adding more quantity to existing item
		inv, err = repo.AddInventoryItem("inv_user", createdItem.ID, 2, sql.NullTime{})
		require.NoError(t, err)
		assert.Equal(t, 3, inv.Quantity)
	})
}

func TestItemRepository_GetUserInventory(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("inv_list_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		item1 := &repository.Item{Name: "Inv Item 1", Type: "consumable"}
		createdItem1, err := repo.CreateItem(item1)
		require.NoError(t, err)
		item2 := &repository.Item{Name: "Inv Item 2", Type: "cosmetic"}
		createdItem2, err := repo.CreateItem(item2)
		require.NoError(t, err)

		_, err = repo.AddInventoryItem("inv_list_user", createdItem1.ID, 1, sql.NullTime{})
		require.NoError(t, err)
		_, err = repo.AddInventoryItem("inv_list_user", createdItem2.ID, 1, sql.NullTime{})
		require.NoError(t, err)

		// Test success
		inventory, err := repo.GetUserInventory("inv_list_user")
		require.NoError(t, err)
		assert.Len(t, inventory, 2)
	})
}

func TestItemRepository_RemoveInventoryItem(t *testing.T) {
	withItemRepo(t, testDB, func(repo repository.ItemRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("inv_remove_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		item := &repository.Item{Name: "Remove Item", Type: "consumable"}
		createdItem, err := repo.CreateItem(item)
		require.NoError(t, err)
		_, err = repo.AddInventoryItem("inv_remove_user", createdItem.ID, 5, sql.NullTime{})
		require.NoError(t, err)

		// Test success
		err = repo.RemoveInventoryItem("inv_remove_user", createdItem.ID, 2)
		require.NoError(t, err)
		inventory, err := repo.GetUserInventory("inv_remove_user")
		require.NoError(t, err)
		assert.Len(t, inventory, 1)
		assert.Equal(t, 3, inventory[0].Quantity)

		// Test removing more than available
		err = repo.RemoveInventoryItem("inv_remove_user", createdItem.ID, 5)
		assert.Error(t, err)
	})
}

func TestTransactionRepository_CreateTransaction(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("tx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		tx := &repository.Transaction{
			UserUsername: "tx_user",
			Amount:       10.00,
			Currency:     "USD",
			Status:       "completed",
		}
		createdTx, err := repo.CreateTransaction(tx)
		require.NoError(t, err)
		assert.NotNil(t, createdTx)
		assert.Equal(t, tx.UserUsername, createdTx.UserUsername)
	})
}

func TestTransactionRepository_GetTransactionByID(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("get_tx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		tx := &repository.Transaction{UserUsername: "get_tx_user", Amount: 20.00, Currency: "USD", Status: "pending"}
		createdTx, err := repo.CreateTransaction(tx)
		require.NoError(t, err)

		// Test success
		fetchedTx, err := repo.GetTransactionByID(createdTx.ID)
		require.NoError(t, err)
		assert.Equal(t, createdTx.ID, fetchedTx.ID)

		// Test not found
		_, err = repo.GetTransactionByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrTransactionNotFound)
	})
}

func TestTransactionRepository_UpdateTransactionStatus(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("update_tx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		tx := &repository.Transaction{UserUsername: "update_tx_user", Amount: 30.00, Currency: "USD", Status: "pending"}
		createdTx, err := repo.CreateTransaction(tx)
		require.NoError(t, err)

		// Test success
		err = repo.UpdateTransactionStatus(createdTx.ID, "completed", sql.NullString{String: "pg_123", Valid: true})
		require.NoError(t, err)
		fetchedTx, err := repo.GetTransactionByID(createdTx.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", fetchedTx.Status)
		assert.Equal(t, "pg_123", fetchedTx.PaymentGatewayID.String)
	})
}

func TestTransactionRepository_ListTransactionsByUsername(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("list_tx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.CreateTransaction(&repository.Transaction{UserUsername: "list_tx_user", Amount: 1.00, Currency: "USD", Status: "completed"})
		require.NoError(t, err)
		_, err = repo.CreateTransaction(&repository.Transaction{UserUsername: "list_tx_user", Amount: 2.00, Currency: "USD", Status: "completed"})
		require.NoError(t, err)

		// Test success
		transactions, err := repo.ListTransactionsByUsername("list_tx_user", 10, 0)
		require.NoError(t, err)
		assert.Len(t, transactions, 2)
		assert.Equal(t, 2.00, transactions[0].Amount) // Ordered by purchased_at DESC
	})
}

func TestTransactionRepository_CreatePointTransaction(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("ptx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		ptx := &repository.PointTransaction{
			UserUsername: "ptx_user",
			Type:         "earn",
			Amount:       100,
			Description:  sql.NullString{String: "Game Reward", Valid: true},
			BalanceAfter: sql.NullInt32{Int32: 100, Valid: true},
		}
		createdPtx, err := repo.CreatePointTransaction(ptx)
		require.NoError(t, err)
		assert.NotNil(t, createdPtx)
		assert.Equal(t, ptx.UserUsername, createdPtx.UserUsername)
	})
}

func TestTransactionRepository_ListPointTransactionsByUsername(t *testing.T) {
	withTransactionRepo(t, testDB, func(repo repository.TransactionRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("list_ptx_user", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		_, err = repo.CreatePointTransaction(&repository.PointTransaction{UserUsername: "list_ptx_user", Type: "earn", Amount: 50, BalanceAfter: sql.NullInt32{Int32: 50, Valid: true}})
		require.NoError(t, err)
		_, err = repo.CreatePointTransaction(&repository.PointTransaction{UserUsername: "list_ptx_user", Type: "spend", Amount: 20, BalanceAfter: sql.NullInt32{Int32: 30, Valid: true}})
		require.NoError(t, err)

		// Test success
		pointTransactions, err := repo.ListPointTransactionsByUsername("list_ptx_user", 10, 0)
		require.NoError(t, err)
		assert.Len(t, pointTransactions, 2)
		assert.Equal(t, 20, pointTransactions[0].Amount) // Ordered by recorded_at DESC
		assert.Equal(t, "spend", pointTransactions[0].Type)
	})
}
