// backend/internal/service/payment_service_test.go
package service_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockItemRepository is a mock implementation of repository.ItemRepository
type MockItemRepository struct {
	mock.Mock
}

func (m *MockItemRepository) CreateItem(item *repository.Item) (*repository.Item, error) {
	args := m.Called(item)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockItemRepository) GetItemByID(id uuid.UUID) (*repository.Item, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockItemRepository) GetItemByName(name string) (*repository.Item, error) {
	args := m.Called(name)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockItemRepository) ListItems() ([]*repository.Item, error) {
	args := m.Called()
	return args.Get(0).([]*repository.Item), args.Error(1)
}

func (m *MockItemRepository) UpdateItem(item *repository.Item) (*repository.Item, error) {
	args := m.Called(item)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockItemRepository) DeleteItem(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockItemRepository) AddInventoryItem(userUsername string, itemID uuid.UUID, quantity int, expiresAt sql.NullTime) (*repository.UserInventory, error) {
	args := m.Called(userUsername, itemID, quantity, expiresAt)
	return args.Get(0).(*repository.UserInventory), args.Error(1)
}

func (m *MockItemRepository) GetUserInventory(userUsername string) ([]*repository.UserInventory, error) {
	args := m.Called(userUsername)
	return args.Get(0).([]*repository.UserInventory), args.Error(1)
}

func (m *MockItemRepository) RemoveInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error {
	args := m.Called(userUsername, itemID, quantity)
	return args.Error(0)
}

// MockTransactionRepository is a mock implementation of repository.TransactionRepository
type MockTransactionRepository struct {
	mock.Mock
}

func (m *MockTransactionRepository) CreateTransaction(tx *repository.Transaction) (*repository.Transaction, error) {
	args := m.Called(tx)
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) GetTransactionByID(id uuid.UUID) (*repository.Transaction, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) UpdateTransactionStatus(id uuid.UUID, status string, paymentGatewayID sql.NullString) error {
	args := m.Called(id, status, paymentGatewayID)
	return args.Error(0)
}

func (m *MockTransactionRepository) ListTransactionsByUsername(username string, limit, offset int) ([]*repository.Transaction, error) {
	args := m.Called(username, limit, offset)
	return args.Get(0).([]*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) CreatePointTransaction(ptx *repository.PointTransaction) (*repository.PointTransaction, error) {
	args := m.Called(ptx)
	return args.Get(0).(*repository.PointTransaction), args.Error(1)
}

func (m *MockTransactionRepository) ListPointTransactionsByUsername(username string, limit, offset int) ([]*repository.PointTransaction, error) {
	args := m.Called(username, limit, offset)
	return args.Get(0).([]*repository.PointTransaction), args.Error(1)
}

func (m *MockTransactionRepository) GetTotalRevenue() (float64, error) {
	args := m.Called()
	return args.Get(0).(float64), args.Error(1)
}

func (m *MockTransactionRepository) GetRevenueSince(since time.Time) (float64, error) {
	args := m.Called(since)
	return args.Get(0).(float64), args.Error(1)
}

func (m *MockTransactionRepository) CountTotalPayments() (int, error) {
	args := m.Called()
	return args.Int(0), args.Error(1)
}

func (m *MockTransactionRepository) CountPaymentsByStatus(status string) (int, error) {
	args := m.Called(status)
	return args.Int(0), args.Error(1)
}

func TestPaymentService_CreateItem(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	item := &repository.Item{Name: "Test Item", Type: "consumable"}
	mockItemRepo.On("CreateItem", item).Return(&repository.Item{}, nil).Once()
	createdItem, err := svc.CreateItem(item)
	require.NoError(t, err)
	assert.NotNil(t, createdItem)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_GetItemByID(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	itemID := uuid.New()
	// Test success
	mockItemRepo.On("GetItemByID", itemID).Return(&repository.Item{}, nil).Once()
	item, err := svc.GetItemByID(itemID)
	require.NoError(t, err)
	assert.NotNil(t, item)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_GetItemByName(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	mockItemRepo.On("GetItemByName", "Item Name").Return(&repository.Item{}, nil).Once()
	item, err := svc.GetItemByName("Item Name")
	require.NoError(t, err)
	assert.NotNil(t, item)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_ListItems(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	expectedItems := []*repository.Item{{Name: "Item1"}, {Name: "Item2"}}
	mockItemRepo.On("ListItems").Return(expectedItems, nil).Once()
	items, err := svc.ListItems()
	require.NoError(t, err)
	assert.Equal(t, expectedItems, items)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_PurchaseItemWithCash(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	itemID := uuid.New()
	// Test success
	item := &repository.Item{ID: itemID, Name: "Cash Item", Type: "consumable", PriceCash: sql.NullInt32{Int32: 100, Valid: true}}
	mockItemRepo.On("GetItemByID", itemID).Return(item, nil).Once()
	mockUserRepo.On("Find", "buyer").Return(&repository.User{}, nil).Once()
	mockTransactionRepo.On("CreateTransaction", mock.AnythingOfType("*repository.Transaction")).Return(&repository.Transaction{}, nil).Once()
	mockItemRepo.On("AddInventoryItem", "buyer", itemID, 1, mock.AnythingOfType("sql.NullTime")).Return(&repository.UserInventory{}, nil).Once()
	mockTransactionRepo.On("UpdateTransactionStatus", mock.AnythingOfType("uuid.UUID"), "completed", mock.AnythingOfType("sql.NullString")).Return(nil).Once()

	tx, err := svc.PurchaseItemWithCash("buyer", itemID, 100, "USD", "pg_id_123")
	require.NoError(t, err)
	assert.NotNil(t, tx)
	mockItemRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
	mockTransactionRepo.AssertExpectations(t)

	// Test item not found
	mockItemRepo.On("GetItemByID", itemID).Return(&repository.Item{}, repository.ErrItemNotFound).Once()
	_, err = svc.PurchaseItemWithCash("buyer", itemID, 100, "USD", "pg_id_123")
	assert.ErrorIs(t, err, service.ErrItemNotFound)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_PurchaseItemWithPoints(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	itemID := uuid.New()
	// Test success
	item := &repository.Item{ID: itemID, Name: "Point Item", Type: "consumable", PricePoints: sql.NullInt32{Int32: 50, Valid: true}}
	user := &repository.User{Username: "point_buyer", Points: 100}
	mockItemRepo.On("GetItemByID", itemID).Return(item, nil).Once()
	mockUserRepo.On("Find", "point_buyer").Return(user, nil).Once()
	mockTransactionRepo.On("CreatePointTransaction", mock.AnythingOfType("*repository.PointTransaction")).Return(&repository.PointTransaction{}, nil).Once()
	mockUserRepo.On("Update", mock.AnythingOfType("*repository.User")).Return(&repository.User{}, nil).Once()
	mockItemRepo.On("AddInventoryItem", "point_buyer", itemID, 1, mock.AnythingOfType("sql.NullTime")).Return(&repository.UserInventory{}, nil).Once()
	mockTransactionRepo.On("CreateTransaction", mock.AnythingOfType("*repository.Transaction")).Return(&repository.Transaction{}, nil).Once()

	tx, err := svc.PurchaseItemWithPoints("point_buyer", itemID)
	require.NoError(t, err)
	assert.NotNil(t, tx)
	mockItemRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
	mockTransactionRepo.AssertExpectations(t)

	// Test insufficient points
	user.Points = 10
	mockItemRepo.On("GetItemByID", itemID).Return(item, nil).Once()
	mockUserRepo.On("Find", "point_buyer").Return(user, nil).Once()
	_, err = svc.PurchaseItemWithPoints("point_buyer", itemID)
	assert.ErrorIs(t, err, service.ErrInsufficientPoints)
	mockItemRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
}

func TestPaymentService_GetUserInventory(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	expectedInventory := []*repository.UserInventory{{UserUsername: "user1"}}
	mockItemRepo.On("GetUserInventory", "user1").Return(expectedInventory, nil).Once()
	inventory, err := svc.GetUserInventory("user1")
	require.NoError(t, err)
	assert.Equal(t, expectedInventory, inventory)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_UseInventoryItem(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	itemID := uuid.New()
	// Test success
	mockItemRepo.On("RemoveInventoryItem", "user1", itemID, 1).Return(nil).Once()
	err := svc.UseInventoryItem("user1", itemID, 1)
	require.NoError(t, err)
	mockItemRepo.AssertExpectations(t)
}

func TestPaymentService_AddPoints(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	user := &repository.User{Username: "user_add", Points: 50}
	mockUserRepo.On("Find", "user_add").Return(user, nil).Once()
	mockTransactionRepo.On("CreatePointTransaction", mock.AnythingOfType("*repository.PointTransaction")).Return(&repository.PointTransaction{}, nil).Once()
	mockUserRepo.On("Update", mock.AnythingOfType("*repository.User")).Return(&repository.User{}, nil).Once()
	ptx, err := svc.AddPoints("user_add", 100, "Game Reward")
	require.NoError(t, err)
	assert.NotNil(t, ptx)
	mockUserRepo.AssertExpectations(t)
	mockTransactionRepo.AssertExpectations(t)
}

func TestPaymentService_SpendPoints(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	user := &repository.User{Username: "user_spend", Points: 100}
	mockUserRepo.On("Find", "user_spend").Return(user, nil).Once()
	mockTransactionRepo.On("CreatePointTransaction", mock.AnythingOfType("*repository.PointTransaction")).Return(&repository.PointTransaction{}, nil).Once()
	mockUserRepo.On("Update", mock.AnythingOfType("*repository.User")).Return(&repository.User{}, nil).Once()
	ptx, err := svc.SpendPoints("user_spend", 50, "Item Purchase")
	require.NoError(t, err)
	assert.NotNil(t, ptx)
	mockUserRepo.AssertExpectations(t)
	mockTransactionRepo.AssertExpectations(t)

	// Test insufficient points
	user.Points = 10
	mockUserRepo.On("Find", "user_spend_fail").Return(user, nil).Once()
	_, err = svc.SpendPoints("user_spend_fail", 50, "Item Purchase")
	assert.ErrorIs(t, err, service.ErrInsufficientPoints)
	mockUserRepo.AssertExpectations(t)
}

func TestPaymentService_GetUserPoints(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	user := &repository.User{Username: "user_get_points", Points: 200}
	mockUserRepo.On("Find", "user_get_points").Return(user, nil).Once()
	points, err := svc.GetUserPoints("user_get_points")
	require.NoError(t, err)
	assert.Equal(t, 200, points)
	mockUserRepo.AssertExpectations(t)
}

func TestPaymentService_ListPointTransactions(t *testing.T) {
	mockItemRepo := new(MockItemRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	mockTransactionRepo := new(MockTransactionRepository)
	svc := service.NewPaymentService(mockItemRepo, mockUserRepo, mockTransactionRepo)

	// Test success
	expectedPtxs := []*repository.PointTransaction{{Amount: 10}, {Amount: 20}}
	mockTransactionRepo.On("ListPointTransactionsByUsername", "user_list_ptx", 10, 0).Return(expectedPtxs, nil).Once()
	ptxs, err := svc.ListPointTransactions("user_list_ptx", 10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedPtxs, ptxs)
	mockTransactionRepo.AssertExpectations(t)
}
