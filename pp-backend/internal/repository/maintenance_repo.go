// backend/internal/repository/maintenance_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var ErrMaintenanceNotFound = errors.New("maintenance schedule not found")

type MaintenanceSchedule struct {
	ID        uuid.UUID
	Start     time.Time
	End       time.Time
	Message   string
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type MaintenanceRepository interface {
	Schedule(startTime, endTime time.Time, message string) (*MaintenanceSchedule, error)
	GetLatestScheduled() (*MaintenanceSchedule, error)
	UpdateStatus(id uuid.UUID, status string) error
	Delete(id uuid.UUID) error
}

type postgresMaintenanceRepository struct {
	db DBTX
}

func NewPostgresMaintenanceRepository(db DBTX) MaintenanceRepository {
	return &postgresMaintenanceRepository{db: db}
}

func (r *postgresMaintenanceRepository) Schedule(startTime, endTime time.Time, message string) (*MaintenanceSchedule, error) {
	query := `INSERT INTO maintenance_schedule (start_time, end_time, message) VALUES ($1, $2, $3) RETURNING id, start_time, end_time, message, status, created_at, updated_at`
	var sched MaintenanceSchedule
	err := r.db.QueryRow(query, startTime, endTime, message).Scan(&sched.ID, &sched.Start, &sched.End, &sched.Message, &sched.Status, &sched.CreatedAt, &sched.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to schedule maintenance: %w", err)
	}
	return &sched, nil
}

func (r *postgresMaintenanceRepository) GetLatestScheduled() (*MaintenanceSchedule, error) {
	query := `SELECT id, start_time, end_time, message, status, created_at, updated_at FROM maintenance_schedule WHERE status = 'scheduled' ORDER BY start_time DESC LIMIT 1`
	var sched MaintenanceSchedule
	err := r.db.QueryRow(query).Scan(&sched.ID, &sched.Start, &sched.End, &sched.Message, &sched.Status, &sched.CreatedAt, &sched.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrMaintenanceNotFound
		}
		return nil, fmt.Errorf("failed to get latest scheduled maintenance: %w", err)
	}
	return &sched, nil
}

func (r *postgresMaintenanceRepository) UpdateStatus(id uuid.UUID, status string) error {
	query := `UPDATE maintenance_schedule SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update maintenance status: %w", err)
	}
	return nil
}

func (r *postgresMaintenanceRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM maintenance_schedule WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete maintenance schedule: %w", err)
	}
	return nil
}
