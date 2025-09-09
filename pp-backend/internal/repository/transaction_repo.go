// backend/internal/repository/transaction_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrTransactionNotFound = errors.New("transaction not found")
	ErrPointTransactionNotFound = errors.New("point transaction not found")
)

type Transaction struct {
	ID               uuid.UUID
	UserUsername     string
	ItemID           sql.Null[uuid.UUID]
	Amount           float64
	Currency         string
	Status           string
	PaymentGatewayID sql.NullString
	PurchasedAt      time.Time
	UpdatedAt        time.Time
}

type PointTransaction struct {
	ID            uuid.UUID
	UserUsername  string
	Type          string
	Amount        int
	Description   sql.NullString
	BalanceAfter  sql.NullInt32
	RecordedAt    time.Time
}

type TransactionRepository interface {
	CreateTransaction(tx *Transaction) (*Transaction, error)
	GetTransactionByID(id uuid.UUID) (*Transaction, error)
	UpdateTransactionStatus(id uuid.UUID, status string, paymentGatewayID sql.NullString) error
	ListTransactionsByUsername(username string, limit, offset int) ([]*Transaction, error)

	CreatePointTransaction(ptx *PointTransaction) (*PointTransaction, error)
	ListPointTransactionsByUsername(username string, limit, offset int) ([]*PointTransaction, error)
}

type postgresTransactionRepository struct {
	db DBTX
}

func NewPostgresTransactionRepository(db DBTX) TransactionRepository {
	return &postgresTransactionRepository{db: db}
}

func (r *postgresTransactionRepository) CreateTransaction(tx *Transaction) (*Transaction, error) {
	query := `INSERT INTO transactions (user_username, item_id, amount, currency, status, payment_gateway_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_username, item_id, amount, currency, status, payment_gateway_id, purchased_at, updated_at`
	var createdTx Transaction
	err := r.db.QueryRow(query, tx.UserUsername, tx.ItemID, tx.Amount, tx.Currency, tx.Status, tx.PaymentGatewayID).Scan(
		&createdTx.ID, &createdTx.UserUsername, &createdTx.ItemID, &createdTx.Amount, &createdTx.Currency, &createdTx.Status, &createdTx.PaymentGatewayID, &createdTx.PurchasedAt, &createdTx.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}
	return &createdTx, nil
}

func (r *postgresTransactionRepository) GetTransactionByID(id uuid.UUID) (*Transaction, error) {
	query := `SELECT id, user_username, item_id, amount, currency, status, payment_gateway_id, purchased_at, updated_at FROM transactions WHERE id = $1`
	var tx Transaction
	err := r.db.QueryRow(query, id).Scan(
		&tx.ID, &tx.UserUsername, &tx.ItemID, &tx.Amount, &tx.Currency, &tx.Status, &tx.PaymentGatewayID, &tx.PurchasedAt, &tx.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrTransactionNotFound
		}
		return nil, fmt.Errorf("failed to get transaction by ID: %w", err)
	}
	return &tx, nil
}

func (r *postgresTransactionRepository) UpdateTransactionStatus(id uuid.UUID, status string, paymentGatewayID sql.NullString) error {
	query := `UPDATE transactions SET status = $1, payment_gateway_id = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Exec(query, status, paymentGatewayID, id)
	if err != nil {
		return fmt.Errorf("failed to update transaction status: %w", err)
	}
	return nil
}

func (r *postgresTransactionRepository) ListTransactionsByUsername(username string, limit, offset int) ([]*Transaction, error) {
	query := `SELECT id, user_username, item_id, amount, currency, status, payment_gateway_id, purchased_at, updated_at FROM transactions WHERE user_username = $1 ORDER BY purchased_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, username, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list transactions: %w", err)
	}
	defer rows.Close()

	var transactions []*Transaction
	for rows.Next() {
		var tx Transaction
		if err := rows.Scan(&tx.ID, &tx.UserUsername, &tx.ItemID, &tx.Amount, &tx.Currency, &tx.Status, &tx.PaymentGatewayID, &tx.PurchasedAt, &tx.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan transaction row: %w", err)
		}
		transactions = append(transactions, &tx)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during transaction list iteration: %w", err)
	}

	return transactions, nil
}

func (r *postgresTransactionRepository) CreatePointTransaction(ptx *PointTransaction) (*PointTransaction, error) {
	query := `INSERT INTO point_transactions (user_username, type, amount, description, balance_after) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_username, type, amount, description, balance_after, recorded_at`
	var createdPtx PointTransaction
	err := r.db.QueryRow(query, ptx.UserUsername, ptx.Type, ptx.Amount, ptx.Description, ptx.BalanceAfter).Scan(
		&createdPtx.ID, &createdPtx.UserUsername, &createdPtx.Type, &createdPtx.Amount, &createdPtx.Description, &createdPtx.BalanceAfter, &createdPtx.RecordedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create point transaction: %w", err)
	}
	return &createdPtx, nil
}

func (r *postgresTransactionRepository) ListPointTransactionsByUsername(username string, limit, offset int) ([]*PointTransaction, error) {
	query := `SELECT id, user_username, type, amount, description, balance_after, recorded_at FROM point_transactions WHERE user_username = $1 ORDER BY recorded_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, username, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list point transactions: %w", err)
	}
	defer rows.Close()

	var pointTransactions []*PointTransaction
	for rows.Next() {
		var ptx PointTransaction
		if err := rows.Scan(&ptx.ID, &ptx.UserUsername, &ptx.Type, &ptx.Amount, &ptx.Description, &ptx.BalanceAfter, &ptx.RecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan point transaction row: %w", err)
		}
		pointTransactions = append(pointTransactions, &ptx)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during point transaction list iteration: %w", err)
	}

	return pointTransactions, nil
}
