// backend/internal/handler/payment_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/handler"
	"github.com/pitturu-ppaturu/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockPaymentService is a mock implementation of service.PaymentService
type MockPaymentService struct {
	mock.Mock
}

func (m *MockPaymentService) CreateItem(item *repository.Item) (*repository.Item, error) {
	args := m.Called(item)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockPaymentService) GetItemByID(id uuid.UUID) (*repository.Item, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockPaymentService) GetItemByName(name string) (*repository.Item, error) {
	args := m.Called(name)
	return args.Get(0).(*repository.Item), args.Error(1)
}

func (m *MockPaymentService) ListItems() ([]*repository.Item, error) {
	args := m.Called()
	return args.Get(0).([]*repository.Item), args.Error(1)
}

func (m *MockPaymentService) PurchaseItemWithCash(userUsername string, itemID uuid.UUID, amount float64, currency, paymentGatewayID string) (*repository.Transaction, error) {
	args := m.Called(userUsername, itemID, amount, currency, paymentGatewayID)
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockPaymentService) PurchaseItemWithPoints(userUsername string, itemID uuid.UUID) (*repository.Transaction, error) {
	args := m.Called(userUsername, itemID)
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockPaymentService) GetUserInventory(userUsername string) ([]*repository.UserInventory, error) {
	args := m.Called(userUsername)
	return args.Get(0).([]*repository.UserInventory), args.Error(1)
}

func (m *MockPaymentService) UseInventoryItem(userUsername string, itemID uuid.UUID, quantity int) error {
	args := m.Called(userUsername, itemID, quantity)
	return args.Error(0)
}

func (m *MockPaymentService) AddPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error) {
	args := m.Called(userUsername, amount, description)
	return args.Get(0).(*repository.PointTransaction), args.Error(1)
}

func (m *MockPaymentService) SpendPoints(userUsername string, amount int, description string) (*repository.PointTransaction, error) {
	args := m.Called(userUsername, amount, description)
	return args.Get(0).(*repository.PointTransaction), args.Error(1)
}

func (m *MockPaymentService) GetUserPoints(userUsername string) (int, error) {
	args := m.Called(userUsername)
	return args.Int(0), args.Error(1)
}

func (m *MockPaymentService) ListPointTransactions(userUsername string, limit, offset int) ([]*repository.PointTransaction, error) {
	args := m.Called(userUsername, limit, offset)
	return args.Get(0).([]*repository.PointTransaction), args.Error(1)
}

func TestPaymentHandler_CreateItem(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/items", h.CreateItem)

	// Test success
	createReq := handler.CreateItemRequest{Name: "New Item", Type: "cosmetic"}
	jsonValue, _ := json.Marshal(createReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req, _ := http.NewRequest(http.MethodPost, "/items", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("CreateItem", mock.AnythingOfType("*repository.Item")).Return(&repository.Item{}, nil).Once()

	h.CreateItem(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_GetItemByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.GET("/items/:item_id", h.GetItemByID)

	itemID := uuid.New()
	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "item_id", Value: itemID.String()}}
	req, _ := http.NewRequest(http.MethodGet, "/items/"+itemID.String(), nil)
	c.Request = req

	mockPaymentService.On("GetItemByID", itemID).Return(&repository.Item{}, nil).Once()

	h.GetItemByID(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_ListItems(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.GET("/items", h.ListItems)

	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/items", nil)
	r.ServeHTTP(w, req)

	expectedItems := []*repository.Item{{Name: "Item1"}, {Name: "Item2"}}
	mockPaymentService.On("ListItems").Return(expectedItems, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_PurchaseItemWithCash(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/purchase/cash", h.PurchaseItemWithCash)

	itemID := uuid.New()
	// Test success
	purchaseReq := handler.PurchaseItemWithCashRequest{ItemID: itemID, Amount: 100.0, Currency: "USD"}
	jsonValue, _ := json.Marshal(purchaseReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "buyer1")
	req, _ := http.NewRequest(http.MethodPost, "/purchase/cash", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("PurchaseItemWithCash", "buyer1", itemID, 100.0, "USD", mock.AnythingOfType("string")).Return(&repository.Transaction{}, nil).Once()

	h.PurchaseItemWithCash(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_PurchaseItemWithPoints(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/purchase/points", h.PurchaseItemWithPoints)

	itemID := uuid.New()
	// Test success
	purchaseReq := handler.PurchaseItemWithPointsRequest{ItemID: itemID}
	jsonValue, _ := json.Marshal(purchaseReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "point_buyer1")
	req, _ := http.NewRequest(http.MethodPost, "/purchase/points", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("PurchaseItemWithPoints", "point_buyer1", itemID).Return(&repository.Transaction{}, nil).Once()

	h.PurchaseItemWithPoints(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_GetUserInventory(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.GET("/me/inventory", h.GetUserInventory)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "user1")
	req, _ := http.NewRequest(http.MethodGet, "/me/inventory", nil)
	c.Request = req

	expectedInventory := []*repository.UserInventory{{UserUsername: "user1"}}
	mockPaymentService.On("GetUserInventory", "user1").Return(expectedInventory, nil).Once()

	h.GetUserInventory(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_UseInventoryItem(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/me/inventory/:item_id/use", h.UseInventoryItem)

	itemID := uuid.New()
	// Test success
	useReq := handler.UseInventoryItemRequest{Quantity: 1}
	jsonValue, _ := json.Marshal(useReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "user1")
	c.Params = gin.Params{{Key: "item_id", Value: itemID.String()}}
	req, _ := http.NewRequest(http.MethodPost, "/me/inventory/"+itemID.String()+"/use", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("UseInventoryItem", "user1", itemID, 1).Return(nil).Once()

	h.UseInventoryItem(c)

	assert.Equal(t, http.StatusNoContent, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_AddPoints(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/users/:username/points/add", h.AddPoints)

	// Test success
	addReq := handler.AddPointsRequest{Amount: 100, Description: "Game Reward"}
	jsonValue, _ := json.Marshal(addReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "admin_user") // Assuming admin user for this endpoint
	c.Params = gin.Params{{Key: "username", Value: "target_user"}}
	req, _ := http.NewRequest(http.MethodPost, "/users/target_user/points/add", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("AddPoints", "target_user", 100, "Game Reward").Return(&repository.PointTransaction{}, nil).Once()

	h.AddPoints(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_SpendPoints(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.POST("/users/:username/points/spend", h.SpendPoints)

	// Test success
	spendReq := handler.SpendPointsRequest{Amount: 50, Description: "Item Purchase"}
	jsonValue, _ := json.Marshal(spendReq)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "user1")
	c.Params = gin.Params{{Key: "username", Value: "user1"}}
	req, _ := http.NewRequest(http.MethodPost, "/users/user1/points/spend", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	mockPaymentService.On("SpendPoints", "user1", 50, "Item Purchase").Return(&repository.PointTransaction{}, nil).Once()

	h.SpendPoints(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_GetUserPoints(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.GET("/me/points", h.GetUserPoints)

	// Test success
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user", "user1")
	req, _ := http.NewRequest(http.MethodGet, "/me/points", nil)
	c.Request = req

	mockPaymentService.On("GetUserPoints", "user1").Return(100, nil).Once()

	h.GetUserPoints(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "100")
	mockPaymentService.AssertExpectations(t)
}

func TestPaymentHandler_ListPointTransactions(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockPaymentService := new(MockPaymentService)
	h := handler.NewPaymentHandler(mockPaymentService)

	r := gin.Default()
	r.GET("/me/point-transactions", h.ListPointTransactions)

	// Test success
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/me/point-transactions?limit=5&offset=0", nil)
	r.ServeHTTP(w, req)

	expectedPtxs := []*repository.PointTransaction{{Amount: 10}, {Amount: 20}}
	mockPaymentService.On("ListPointTransactions", "user1", 5, 0).Return(expectedPtxs, nil).Once()

	assert.Equal(t, http.StatusOK, w.Code)
	mockPaymentService.AssertExpectations(t)
}
