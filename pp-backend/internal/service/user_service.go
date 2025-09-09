// backend/internal/service/user_service.go
package service

import (
	"database/sql"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"exit/internal/repository"
)

// UserService defines the interface for user related services.
type UserService interface {
	Register(username, password string, bcryptCost int) (*repository.User, error)
	Delete(username string) error
	UpdateRole(username string, role string) (*repository.User, error)
	UpdateProfile(user *repository.User) (*repository.User, error)
	ChangePassword(username, oldPassword, newPassword string, bcryptCost int) error
	List() ([]*repository.User, error)
	DeactivateUser(username string) error
	DeleteUser(username string) error
	Find(username string) (*repository.User, error)
	ValidatePassword(user *repository.User, password string) error
}

type userService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// Register creates a new user.
func (s *userService) Register(username, password string, bcryptCost int) (*repository.User, error) {
	// In a real app, you'd have more validation here (e.g., password strength)
	// For now, we'll just create a standard "user"
	return s.userRepo.Create(username, password, "user", bcryptCost, sql.NullString{})
}

// Delete removes a user.
func (s *userService) Delete(username string) error {
	return s.userRepo.Delete(username)
}

// UpdateRole updates a user's role.
func (s *userService) UpdateRole(username string, role string) (*repository.User, error) {
	user, err := s.userRepo.Find(username)
	if err != nil {
		return nil, err
	}

	user.Role = role
	return s.userRepo.Update(user)
}

// UpdateProfile updates a user's profile.
func (s *userService) UpdateProfile(user *repository.User) (*repository.User, error) {
	return s.userRepo.Update(user)
}

// ChangePassword changes a user's password.
func (s *userService) ChangePassword(username, oldPassword, newPassword string, bcryptCost int) error {
	user, err := s.userRepo.Find(username)
	if err != nil {
		return err
	}

	if err := s.userRepo.ValidatePassword(user, oldPassword); err != nil {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcryptCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	err = s.userRepo.UpdatePasswordHash(user.Username, string(hashedPassword))
	if err != nil {
		return fmt.Errorf("failed to update password in repository: %w", err)
	}

	return nil
}

// List returns all users.
func (s *userService) List() ([]*repository.User, error) {
	return s.userRepo.List()
}

// DeactivateUser deactivates a user account.
func (s *userService) DeactivateUser(username string) error {
	return s.userRepo.DeactivateUser(username)
}

// DeleteUser deletes a user account.
func (s *userService) DeleteUser(username string) error {
	return s.userRepo.DeleteUser(username)
}

// Find a user by username.
func (s *userService) Find(username string) (*repository.User, error) {
	return s.userRepo.Find(username)
}

// ValidatePassword validates a user's password.
func (s *userService) ValidatePassword(user *repository.User, password string) error {
	return s.userRepo.ValidatePassword(user, password)
}