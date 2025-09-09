// backend/internal/repository/payment_session.go
package repository

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// PaymentSession represents a payment session in the database
type PaymentSession struct {
	ID            uuid.UUID      `db:"id" json:"id"`
	MerchantUID   string         `db:"merchant_uid" json:"merchant_uid"`
	UserID        string         `db:"user_id" json:"user_id"`
	ItemID        uuid.UUID      `db:"item_id" json:"item_id"`
	Quantity      int            `db:"quantity" json:"quantity"`
	Amount        int64          `db:"amount" json:"amount"`
	Currency      string         `db:"currency" json:"currency"`
	BuyerName     string         `db:"buyer_name" json:"buyer_name"`
	BuyerEmail    string         `db:"buyer_email" json:"buyer_email"`
	BuyerTel      string         `db:"buyer_tel" json:"buyer_tel"`
	BuyerAddr     sql.NullString `db:"buyer_addr" json:"buyer_addr"`
	BuyerPostcode sql.NullString `db:"buyer_postcode" json:"buyer_postcode"`
	Status        string         `db:"status" json:"status"`
	RedirectURL   string         `db:"redirect_url" json:"redirect_url"`
	CreatedAt     time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time      `db:"updated_at" json:"updated_at"`
}

// PaymentRepository interface for payment-related database operations
type PaymentRepository interface {
	// Payment Sessions
	CreatePaymentSession(session *PaymentSession) (*PaymentSession, error)
	GetPaymentSession(id uuid.UUID) (*PaymentSession, error)
	GetPaymentSessionByMerchantUID(merchantUID string) (*PaymentSession, error)
	UpdatePaymentSession(session *PaymentSession) error
	DeletePaymentSession(id uuid.UUID) error
	
	// Payment History
	GetPaymentSessionsByUser(userID string, limit, offset int) ([]*PaymentSession, error)
	GetPaymentSessionsByStatus(status string, limit, offset int) ([]*PaymentSession, error)
}