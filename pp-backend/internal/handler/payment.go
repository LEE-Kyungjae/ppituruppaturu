// backend/internal/handler/payment.go
package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"
	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PaymentHandler handles payment-related requests.
type PaymentHandler struct {
	paymentService service.PaymentService
}

// NewPaymentHandler creates a new PaymentHandler.
func NewPaymentHandler(ps service.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: ps}
}

// CreateItem handles creating a new item definition.
// @Summary      Create a new item
// @Description  Creates a new item definition for cash or points purchase.
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        item body CreateItemRequest true "Item details"
// @Success      201 {object} repository.Item
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /items [post]
func (h *PaymentHandler) CreateItem(c *gin.Context) {
	var req CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	item := &repository.Item{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		PriceCash:   req.PriceCash,
		PricePoints: req.PricePoints,
		ImageURL:    req.ImageURL,
	}

	createdItem, err := h.paymentService.CreateItem(item)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to create item")
		return
	}

	respondJSON(c, http.StatusCreated, createdItem)
}

// GetItemByID handles retrieving an item definition by its ID.
// @Summary      Get item by ID
// @Description  Retrieves a single item definition by its unique ID.
// @Tags         Payment
// @Produce      json
// @Param        item_id path string true "Item ID"
// @Success      200 {object} repository.Item
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /items/{item_id} [get]
func (h *PaymentHandler) GetItemByID(c *gin.Context) {
	itemID, err := uuid.Parse(c.Param("item_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid item ID")
		return
	}

	item, err := h.paymentService.GetItemByID(itemID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrItemNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve item")
		return
	}

	respondJSON(c, http.StatusOK, item)
}

// ListItems handles listing all item definitions.
// @Summary      List all items
// @Description  Retrieves a list of all item definitions.
// @Tags         Payment
// @Produce      json
// @Success      200 {array} repository.Item
// @Failure      500 {object} Response
// @Router       /items [get]
func (h *PaymentHandler) ListItems(c *gin.Context) {
	items, err := h.paymentService.ListItems()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list items")
		return
	}

	respondJSON(c, http.StatusOK, items)
}

// PurchaseItemWithCash handles purchasing an item with cash.
// @Summary      Purchase item with cash
// @Description  Initiates a purchase of an item using real money (IAP integration).
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        purchase body PurchaseItemWithCashRequest true "Purchase details"
// @Success      201 {object} repository.Transaction
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /purchase/cash [post]
func (h *PaymentHandler) PurchaseItemWithCash(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req PurchaseItemWithCashRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// In a real scenario, payment gateway interaction and receipt validation would happen here.
	// For now, we simulate a successful payment.
	paymentGatewayID := uuid.New().String() // Dummy ID

	transaction, err := h.paymentService.PurchaseItemWithCash(userUsername.(string), req.ItemID, req.Amount, req.Currency, paymentGatewayID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrItemNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) || errors.Is(err, serviceErrors.ErrInvalidPurchase) {
			respondError(c, http.StatusBadRequest, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to process cash purchase")
		return
	}

	respondJSON(c, http.StatusCreated, transaction)
}

// PurchaseItemWithPoints handles purchasing an item with points.
// @Summary      Purchase item with points
// @Description  Purchases an item using virtual points.
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        purchase body PurchaseItemWithPointsRequest true "Purchase details"
// @Success      201 {object} repository.Transaction
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /purchase/points [post]
func (h *PaymentHandler) PurchaseItemWithPoints(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req PurchaseItemWithPointsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	transaction, err := h.paymentService.PurchaseItemWithPoints(userUsername.(string), req.ItemID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrItemNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, serviceErrors.ErrInsufficientPoints) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to process points purchase")
		return
	}

	respondJSON(c, http.StatusCreated, transaction)
}

// GetUserInventory handles listing a user's inventory.
// @Summary      Get user inventory
// @Description  Retrieves the authenticated user's item inventory.
// @Tags         Payment
// @Produce      json
// @Success      200 {array} repository.UserInventory
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/inventory [get]
func (h *PaymentHandler) GetUserInventory(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	inventory, err := h.paymentService.GetUserInventory(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to retrieve inventory")
		return
	}

	respondJSON(c, http.StatusOK, inventory)
}

// UseInventoryItem handles using an item from a user's inventory.
// @Summary      Use inventory item
// @Description  Uses a specified quantity of an item from the authenticated user's inventory.
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        item_id path string true "Item ID"
// @Param        use_details body UseInventoryItemRequest true "Quantity to use"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/inventory/{item_id}/use [post]
func (h *PaymentHandler) UseInventoryItem(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	itemID, err := uuid.Parse(c.Param("item_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid item ID")
		return
	}

	var req UseInventoryItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.paymentService.UseInventoryItem(userUsername.(string), itemID, req.Quantity); err != nil {
		respondError(c, http.StatusInternalServerError, "failed to use item")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// AddPoints handles adding points to a user's balance (e.g., from game rewards).
// @Summary      Add points to user
// @Description  Adds points to a user's balance. (Admin or internal use).
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        username path string true "Username to add points to"
// @Param        points_details body AddPointsRequest true "Points and description"
// @Success      200 {object} repository.PointTransaction
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /users/{username}/points/add [post]
func (h *PaymentHandler) AddPoints(c *gin.Context) {
	// This endpoint might be restricted to admin users or internal services
	// For now, it's accessible via BearerAuth

	username := c.Param("username")
	var req AddPointsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	ptx, err := h.paymentService.AddPoints(username, req.Amount, req.Description)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to add points")
		return
	}

	respondJSON(c, http.StatusOK, ptx)
}

// SpendPoints handles spending points from a user's balance.
// @Summary      Spend points from user
// @Description  Spends points from a user's balance. (Admin or internal use).
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Param        username path string true "Username to spend points from"
// @Param        points_details body SpendPointsRequest true "Points and description"
// @Success      200 {object} repository.PointTransaction
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /users/{username}/points/spend [post]
func (h *PaymentHandler) SpendPoints(c *gin.Context) {
	// This endpoint might be restricted to admin users or internal services
	// For now, it's accessible via BearerAuth

	username := c.Param("username")
	var req SpendPointsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	ptx, err := h.paymentService.SpendPoints(username, req.Amount, req.Description)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrInsufficientPoints) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to spend points")
		return
	}

	respondJSON(c, http.StatusOK, ptx)
}

// GetUserPoints handles retrieving a user's current point balance.
// @Summary      Get user points
// @Description  Retrieves the authenticated user's current point balance.
// @Tags         Payment
// @Produce      json
// @Success      200 {object} int "User's point balance"
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/points [get]
func (h *PaymentHandler) GetUserPoints(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	points, err := h.paymentService.GetUserPoints(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to retrieve points")
		return
	}

	respondJSON(c, http.StatusOK, points)
}

// ListPointTransactions handles listing a user's point transaction history.
// @Summary      List point transactions
// @Description  Retrieves the authenticated user's point transaction history.
// @Tags         Payment
// @Produce      json
// @Param        limit query int false "Limit the number of transactions returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.PointTransaction
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/point-transactions [get]
func (h *PaymentHandler) ListPointTransactions(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid limit parameter")
		return
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid offset parameter")
		return
	}

	transactions, err := h.paymentService.ListPointTransactions(userUsername.(string), limitInt, offsetInt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to retrieve point transactions")
		return
	}

	respondJSON(c, http.StatusOK, transactions)
}

type CreateItemRequest struct {
	Name        string         `json:"name" binding:"required"`
	Description sql.NullString `json:"description"`
	Type        string         `json:"type" binding:"required"`
	PriceCash   sql.NullInt32  `json:"price_cash"`
	PricePoints sql.NullInt32  `json:"price_points"`
	ImageURL    sql.NullString `json:"image_url"`
}

type PurchaseItemWithCashRequest struct {
	ItemID   uuid.UUID `json:"item_id" binding:"required"`
	Amount   float64   `json:"amount" binding:"required"`
	Currency string    `json:"currency" binding:"required"`
}

type PurchaseItemWithPointsRequest struct {
	ItemID uuid.UUID `json:"item_id" binding:"required"`
}

type UseInventoryItemRequest struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type AddPointsRequest struct {
	Amount      int    `json:"amount" binding:"required,min=1"`
	Description string `json:"description"`
}

type SpendPointsRequest struct {
	Amount      int    `json:"amount" binding:"required,min=1"`
	Description string `json:"description"`
}
