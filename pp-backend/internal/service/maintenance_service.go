// backend/internal/service/maintenance_service.go
package service

import (
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
					if err := s.repo.UpdateStatus(sched.ID, "in_progress"); err != nil {
						continue
					}
					s.broadcastAnnouncement("System maintenance has begun.")
				}

				if now.After(sched.End) && sched.Status == "in_progress" {
					if err := s.repo.UpdateStatus(sched.ID, "completed"); err != nil {
						continue
					}
					s.broadcastAnnouncement("System maintenance has ended.")
				}
			}
		}
	}()
}

func (s *maintenanceService) broadcastAnnouncement(message string) {
	// 임시로 주석 처리 - 실제 브로드캐스트 로직 구현 필요
	// msgData, _ := json.Marshal(map[string]string{"type": "maintenance", "message": message})
	// TODO: 실제 브로드캐스트 구현
}
