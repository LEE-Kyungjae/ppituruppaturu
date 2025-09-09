// backend/internal/portone/types.go
package portone

import (
	"time"
)

// PaymentStatus represents payment status
type PaymentStatus string

const (
	PaymentStatusReady     PaymentStatus = "ready"
	PaymentStatusPaid      PaymentStatus = "paid"
	PaymentStatusCancelled PaymentStatus = "cancelled"
	PaymentStatusFailed    PaymentStatus = "failed"
)

// PaymentMethod represents payment method
type PaymentMethod string

const (
	PaymentMethodCard        PaymentMethod = "card"
	PaymentMethodVBank       PaymentMethod = "vbank"
	PaymentMethodTrans       PaymentMethod = "trans"
	PaymentMethodPhone       PaymentMethod = "phone"
	PaymentMethodCulture     PaymentMethod = "cultureland"
	PaymentMethodSmartculture PaymentMethod = "smartculture"
	PaymentMethodHappymoney  PaymentMethod = "happymoney"
	PaymentMethodBooknlife   PaymentMethod = "booknlife"
	PaymentMethodKakaopay    PaymentMethod = "kakaopay"
	PaymentMethodPayco       PaymentMethod = "payco"
	PaymentMethodLpay        PaymentMethod = "lpay"
	PaymentMethodSsgpay      PaymentMethod = "ssgpay"
	PaymentMethodTosspay     PaymentMethod = "tosspay"
	PaymentMethodNaverpay    PaymentMethod = "naverpay"
)

// PreparePaymentRequest represents payment preparation request
type PreparePaymentRequest struct {
	MerchantUID   string  `json:"merchant_uid"`
	Amount        int64   `json:"amount"`
	Currency      string  `json:"currency"`
	Name          string  `json:"name"`
	BuyerName     string  `json:"buyer_name"`
	BuyerEmail    string  `json:"buyer_email"`
	BuyerTel      string  `json:"buyer_tel"`
	BuyerAddr     string  `json:"buyer_addr"`
	BuyerPostcode string  `json:"buyer_postcode"`
	NoticeURL     string  `json:"notice_url"`
	ReturnURL     string  `json:"return_url"`
}

// PreparePaymentBody represents the request body for payment preparation
type PreparePaymentBody struct {
	MerchantUID   string `json:"merchant_uid"`
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	Name          string `json:"name"`
	BuyerName     string `json:"buyer_name"`
	BuyerEmail    string `json:"buyer_email"`
	BuyerTel      string `json:"buyer_tel"`
	BuyerAddr     string `json:"buyer_addr"`
	BuyerPostcode string `json:"buyer_postcode"`
	NoticeURL     string `json:"notice_url"`
	ReturnURL     string `json:"return_url"`
}

// PreparePaymentResponse represents payment preparation response
type PreparePaymentResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Response struct {
		MerchantUID string `json:"merchant_uid"`
		Amount      int64  `json:"amount"`
	} `json:"response"`
}

// VerifyPaymentResponse represents payment verification response
type VerifyPaymentResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Response struct {
		ImpUID        string        `json:"imp_uid"`
		MerchantUID   string        `json:"merchant_uid"`
		PayMethod     PaymentMethod `json:"pay_method"`
		PaidAmount    int64         `json:"paid_amount"`
		Status        PaymentStatus `json:"status"`
		Name          string        `json:"name"`
		PgProvider    string        `json:"pg_provider"`
		PgTid         string        `json:"pg_tid"`
		BuyerName     string        `json:"buyer_name"`
		BuyerEmail    string        `json:"buyer_email"`
		BuyerTel      string        `json:"buyer_tel"`
		BuyerAddr     string        `json:"buyer_addr"`
		BuyerPostcode string        `json:"buyer_postcode"`
		CustomData    string        `json:"custom_data"`
		PaidAt        int64         `json:"paid_at"`
		ReceiptURL    string        `json:"receipt_url"`
		CardName      string        `json:"card_name"`
		BankName      string        `json:"bank_name"`
		CardQuota     int           `json:"card_quota"`
		CardNumber    string        `json:"card_number"`
	} `json:"response"`
}

// CancelPaymentRequest represents payment cancellation request
type CancelPaymentRequest struct {
	ImpUID       string `json:"imp_uid,omitempty"`
	MerchantUID  string `json:"merchant_uid,omitempty"`
	Amount       int64  `json:"amount,omitempty"`
	TaxFree      int64  `json:"tax_free,omitempty"`
	CheckSum     int64  `json:"checksum,omitempty"`
	Reason       string `json:"reason"`
	RefundHolder string `json:"refund_holder,omitempty"`
	RefundBank   string `json:"refund_bank,omitempty"`
	RefundAccount string `json:"refund_account,omitempty"`
}

// CancelPaymentResponse represents payment cancellation response
type CancelPaymentResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Response struct {
		ImpUID        string        `json:"imp_uid"`
		MerchantUID   string        `json:"merchant_uid"`
		PayMethod     PaymentMethod `json:"pay_method"`
		PaidAmount    int64         `json:"paid_amount"`
		CancelAmount  int64         `json:"cancel_amount"`
		CancelReason  string        `json:"cancel_reason"`
		Status        PaymentStatus `json:"status"`
		CancelledAt   int64         `json:"cancelled_at"`
		CancelHistory []struct {
			PgTid        string `json:"pg_tid"`
			Amount       int64  `json:"amount"`
			CancelledAt  int64  `json:"cancelled_at"`
			Reason       string `json:"reason"`
			ReceiptURL   string `json:"receipt_url"`
		} `json:"cancel_history"`
	} `json:"response"`
}

// PaymentHistoryRequest represents payment history request
type PaymentHistoryRequest struct {
	From  *time.Time `json:"from,omitempty"`
	To    *time.Time `json:"to,omitempty"`
	Page  int        `json:"page,omitempty"`
	Limit int        `json:"limit,omitempty"`
}

// PaymentHistoryResponse represents payment history response
type PaymentHistoryResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Response struct {
		Total int `json:"total"`
		Page  int `json:"page"`
		List  []struct {
			ImpUID        string        `json:"imp_uid"`
			MerchantUID   string        `json:"merchant_uid"`
			PayMethod     PaymentMethod `json:"pay_method"`
			PaidAmount    int64         `json:"paid_amount"`
			Status        PaymentStatus `json:"status"`
			Name          string        `json:"name"`
			PgProvider    string        `json:"pg_provider"`
			BuyerName     string        `json:"buyer_name"`
			BuyerEmail    string        `json:"buyer_email"`
			PaidAt        int64         `json:"paid_at"`
		} `json:"list"`
	} `json:"response"`
}

// WebhookPayload represents webhook notification payload
type WebhookPayload struct {
	ImpUID      string        `json:"imp_uid"`
	MerchantUID string        `json:"merchant_uid"`
	Status      PaymentStatus `json:"status"`
}

// PaymentItem represents an item for purchase
type PaymentItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Amount      int64  `json:"amount"`
	Currency    string `json:"currency"`
	ImageURL    string `json:"image_url"`
}

// CreatePaymentSessionRequest represents payment session creation request
type CreatePaymentSessionRequest struct {
	UserID      string       `json:"user_id"`
	Item        PaymentItem  `json:"item"`
	BuyerInfo   BuyerInfo    `json:"buyer_info"`
	RedirectURL string       `json:"redirect_url"`
	WebhookURL  string       `json:"webhook_url"`
}

// BuyerInfo represents buyer information
type BuyerInfo struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Tel      string `json:"tel"`
	Addr     string `json:"addr"`
	Postcode string `json:"postcode"`
}

// PaymentSession represents a payment session
type PaymentSession struct {
	ID          string      `json:"id"`
	MerchantUID string      `json:"merchant_uid"`
	UserID      string      `json:"user_id"`
	Item        PaymentItem `json:"item"`
	BuyerInfo   BuyerInfo   `json:"buyer_info"`
	Status      PaymentStatus `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}