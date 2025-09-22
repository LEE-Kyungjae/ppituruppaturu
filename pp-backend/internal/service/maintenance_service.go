// backend/internal/service/maintenance_service.go
package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/chat"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

type MaintenanceService interface {
	Schedule(startTime, endTime time.Time, message string) (*repository.MaintenanceSchedule, error)
	GetScheduled() (*repository.MaintenanceSchedule, error)
	Cancel(id uuid.UUID) error
	Start()
}

type maintenanceService struct {
	repo repository.MaintenanceRepository
	hub  *chat.Hub
}

func NewMaintenanceService(repo repository.MaintenanceRepository, hub *chat.Hub) MaintenanceService {
	return &maintenanceService{
		repo: repo,
		hub:  hub,
	}
}

func (s *maintenanceService) Schedule(startTime, endTime time.Time, message string) (*repository.MaintenanceSchedule, error) {
	return s.repo.Schedule(startTime, endTime, message)
}

func (s *maintenanceService) GetScheduled() (*repository.MaintenanceSchedule, error) {
	return s.repo.GetLatestScheduled()
}

func (s *maintenanceService) Cancel(id uuid.UUID) error {
	return s.repo.Delete(id)
}

func (s *maintenanceService) Start() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				sched, err := s.repo.GetLatestScheduled()
				if err != nil {
					continue // No scheduled maintenance
				}

				now := time.Now()
				diff := sched.Start.Sub(now)

				announcementIntervals := []time.Duration{
					10 * time.Minute,
					5 * time.Minute,
					4 * time.Minute,
					3 * time.Minute,
					2 * time.Minute,
					1 * time.Minute,
				}

				for _, interval := range announcementIntervals {
					if diff > interval-30*time.Second && diff < interval+30*time.Second {
						msg := fmt.Sprintf("System maintenance will begin in approximately %d minutes.", int(interval.Minutes()))
						s.broadcastAnnouncement(msg)
					}
				}

				if diff <= 0 && sched.Status == "scheduled" {
					s.repo.UpdateStatus(sched.ID, "in_progress")
					s.broadcastAnnouncement("System maintenance has begun.")
				}

				if now.After(sched.End) && sched.Status == "in_progress" {
					s.repo.UpdateStatus(sched.ID, "completed")
					s.broadcastAnnouncement("System maintenance has ended.")
				}
			}
		}
	}()
}

func (s *maintenanceService) broadcastAnnouncement(message string) {
	msg, _ := json.Marshal(map[string]string{"type": "maintenance", "message": message})
	s.hub.Broadcast(msg)
}
