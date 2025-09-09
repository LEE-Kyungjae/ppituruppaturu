// backend/internal/handler/portone_handler.go
package handler

import (
	"net/http"
	"strconv"

	"exit/internal/portone"
	"exit/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PortOneHandler handles PortOne payment requests
type PortOneHandler struct {
	portoneService service.PortOnePaymentService
}

// NewPortOneHandler creates a new PortOneHandler
func NewPortOneHandler(ps service.PortOnePaymentService) *PortOneHandler {
	return &PortOneHandler{portoneService: ps}
}

// CreatePaymentSession creates a new payment session
// @Summary      Create payment session
// @Description  Creates a new payment session for PortOne PG integration
// @Tags         PortOne
// @Accept       json
// @Produce      json
// @Param        session body CreatePaymentSessionRequest true "Payment session details"
// @Success      201 {object} service.PaymentSessionResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /payments/sessions [post]
func (h *PortOneHandler) CreatePaymentSession(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req CreatePaymentSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Set user ID from context
	serviceReq := service.CreatePaymentSessionRequest{
		UserID:      userUsername.(string),
		ItemID:      req.ItemID,
		Quantity:    req.Quantity,
		BuyerInfo:   req.BuyerInfo,
		RedirectURL: req.RedirectURL,
	}

	session, err := h.portoneService.CreatePaymentSession(serviceReq)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to create payment session")
		return
	}

	respondJSON(c, http.StatusCreated, session)
}

// GetPaymentSession retrieves a payment session
// @Summary      Get payment session
// @Description  Retrieves a payment session by ID
// @Tags         PortOne
// @Produce      json
// @Param        session_id path string true "Session ID"
// @Success      200 {object} service.PaymentSessionResponse
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /payments/sessions/{session_id} [get]
func (h *PortOneHandler) GetPaymentSession(c *gin.Context) {
	sessionID := c.Param("session_id")

	session, err := h.portoneService.GetPaymentSession(sessionID)
	if err != nil {
		respondError(c, http.StatusNotFound, "payment session not found")
		return
	}

	respondJSON(c, http.StatusOK, session)
}

// PreparePayment prepares payment with PortOne
// @Summary      Prepare payment
// @Description  Prepares payment with PortOne PG
// @Tags         PortOne
// @Produce      json
// @Param        session_id path string true "Session ID"
// @Success      200 {object} service.PreparePaymentResponse
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /payments/sessions/{session_id}/prepare [post]
func (h *PortOneHandler) PreparePayment(c *gin.Context) {
	sessionID := c.Param("session_id")

	result, err := h.portoneService.PreparePayment(sessionID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to prepare payment")
		return
	}

	if !result.Success {
		respondError(c, http.StatusBadRequest, result.Message)
		return
	}

	respondJSON(c, http.StatusOK, result)
}

// VerifyPayment verifies payment completion
// @Summary      Verify payment
// @Description  Verifies payment completion with PortOne
// @Tags         PortOne
// @Accept       json
// @Produce      json
// @Param        verification body VerifyPaymentRequest true "Payment verification details"
// @Success      200 {object} service.VerifyPaymentResult
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /payments/verify [post]
func (h *PortOneHandler) VerifyPayment(c *gin.Context) {
	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.portoneService.VerifyPayment(req.ImpUID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to verify payment")
		return
	}

	respondJSON(c, http.StatusOK, result)
}

// HandleWebhook processes PortOne webhook notifications
// @Summary      Handle webhook
// @Description  Processes webhook notifications from PortOne
// @Tags         PortOne
// @Accept       json
// @Produce      json
// @Param        payload body portone.WebhookPayload true "Webhook payload"
// @Success      200 {object} Response
// @Failure      400 {object} Response
// @Failure      500 {object} Response
// @Router       /payments/webhook [post]
func (h *PortOneHandler) HandleWebhook(c *gin.Context) {
	var payload portone.WebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	err := h.portoneService.HandleWebhook(payload)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to process webhook")
		return
	}

	respondJSON(c, http.StatusOK, map[string]string{"status": "success"})
}

// CancelPayment cancels a payment
// @Summary      Cancel payment
// @Description  Cancels a payment transaction
// @Tags         PortOne
// @Accept       json
// @Produce      json
// @Param        payment_id path string true "Payment ID"
// @Param        cancel body CancelPaymentRequest true "Cancellation details"
// @Success      200 {object} service.CancelPaymentResult
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /payments/{payment_id}/cancel [post]
func (h *PortOneHandler) CancelPayment(c *gin.Context) {
	paymentID := c.Param("payment_id")

	var req CancelPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.portoneService.CancelPayment(paymentID, req.Reason)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to cancel payment")
		return
	}

	if !result.Success {
		respondError(c, http.StatusBadRequest, result.Message)
		return
	}

	respondJSON(c, http.StatusOK, result)
}

// GetPaymentHistory retrieves payment history for the authenticated user
// @Summary      Get payment history
// @Description  Retrieves payment history for the authenticated user
// @Tags         PortOne
// @Produce      json
// @Param        limit query int false "Limit the number of payments returned" default(20)
// @Param        offset query int false "Offset for pagination" default(0)
// @Success      200 {array} service.PaymentHistoryItem
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/payments [get]
func (h *PortOneHandler) GetPaymentHistory(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	limit := c.DefaultQuery("limit", "20")
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

	history, err := h.portoneService.GetPaymentHistory(userUsername.(string), limitInt, offsetInt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to retrieve payment history")
		return
	}

	respondJSON(c, http.StatusOK, history)
}

// Request types
type CreatePaymentSessionRequest struct {
	ItemID      uuid.UUID         `json:"item_id" binding:"required"`
	Quantity    int               `json:"quantity" binding:"required,min=1"`
	BuyerInfo   portone.BuyerInfo `json:"buyer_info" binding:"required"`
	RedirectURL string            `json:"redirect_url" binding:"required,url"`
}

type VerifyPaymentRequest struct {
	ImpUID string `json:"imp_uid" binding:"required"`
}

type CancelPaymentRequest struct {
	Reason string `json:"reason" binding:"required"`
}