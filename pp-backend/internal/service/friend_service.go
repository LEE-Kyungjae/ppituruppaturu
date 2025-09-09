// backend/internal/service/friend_service.go
package service

import (
	"fmt"

	"github.com/google/uuid"
	"exit/internal/repository"
	serviceErrors "exit/internal/service/errors"
)

var (
	ErrFriendRequestNotFound = serviceErrors.ErrFriendRequestNotFound
	ErrFriendRequestExists   = serviceErrors.ErrFriendRequestExists
	ErrFriendshipExists      = serviceErrors.ErrFriendshipExists
	ErrUserBlocked           = serviceErrors.ErrUserBlocked
)

type FriendService interface {
	SendFriendRequest(senderUsername, receiverUsername string) (*repository.FriendRequest, error)
	AcceptFriendRequest(requestID uuid.UUID, acceptorUsername string) error
	DeclineFriendRequest(requestID uuid.UUID, declinerUsername string) error
	CancelFriendRequest(requestID uuid.UUID, cancellerUsername string) error
	RemoveFriend(user1Username, user2Username string) error
	BlockUser(blockerUsername, blockedUsername string) (*repository.BlockedUser, error)
	UnblockUser(blockerUsername, blockedUsername string) error
	ListFriends(username string) ([]*repository.User, error)
	ListIncomingFriendRequests(username string) ([]*repository.FriendRequest, error)
	ListOutgoingFriendRequests(username string) ([]*repository.FriendRequest, error)
	ListBlockedUsers(username string) ([]*repository.BlockedUser, error)
}

type friendService struct {
	friendRepo repository.FriendRepository
	userRepo   repository.UserRepository
}

func NewFriendService(friendRepo repository.FriendRepository, userRepo repository.UserRepository) FriendService {
	return &friendService{
		friendRepo: friendRepo,
		userRepo:   userRepo,
	}
}

func (s *friendService) SendFriendRequest(senderUsername, receiverUsername string) (*repository.FriendRequest, error) {
	// Check if receiver exists
	_, err := s.userRepo.Find(receiverUsername)
	if err != nil {
		return nil, fmt.Errorf("receiver user not found: %w", serviceErrors.ErrUserNotFound)
	}

	// Check if sender is blocked by receiver
	isBlocked, err := s.friendRepo.IsBlocked(receiverUsername, senderUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return nil, serviceErrors.ErrUserBlocked
	}

	fr, err := s.friendRepo.CreateFriendRequest(senderUsername, receiverUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to send friend request: %w", err)
	}
	return fr, nil
}

func (s *friendService) AcceptFriendRequest(requestID uuid.UUID, acceptorUsername string) error {
	fr, err := s.friendRepo.GetFriendRequest(requestID)
	if err != nil {
		return fmt.Errorf("failed to get friend request: %w", err)
	}

	if fr.ReceiverUsername != acceptorUsername || fr.Status != "pending" {
		return fmt.Errorf("invalid friend request for acceptance")
	}

	// Create friendship
	_, err = s.friendRepo.CreateFriendship(fr.SenderUsername, fr.ReceiverUsername)
	if err != nil {
		return fmt.Errorf("failed to create friendship: %w", err)
	}

	// Update request status
	err = s.friendRepo.UpdateFriendRequestStatus(requestID, "accepted")
	if err != nil {
		return fmt.Errorf("failed to update friend request status: %w", err)
	}
	return nil
}

func (s *friendService) DeclineFriendRequest(requestID uuid.UUID, declinerUsername string) error {
	fr, err := s.friendRepo.GetFriendRequest(requestID)
	if err != nil {
		return fmt.Errorf("failed to get friend request: %w", err)
	}

	if fr.ReceiverUsername != declinerUsername || fr.Status != "pending" {
		return fmt.Errorf("invalid friend request for decline")
	}

	err = s.friendRepo.UpdateFriendRequestStatus(requestID, "declined")
	if err != nil {
		return fmt.Errorf("failed to update friend request status: %w", err)
	}
	return nil
}

func (s *friendService) CancelFriendRequest(requestID uuid.UUID, cancellerUsername string) error {
	fr, err := s.friendRepo.GetFriendRequest(requestID)
	if err != nil {
		return fmt.Errorf("failed to get friend request: %w", err)
	}

	if fr.SenderUsername != cancellerUsername || fr.Status != "pending" {
		return fmt.Errorf("invalid friend request for cancellation")
	}

	err = s.friendRepo.UpdateFriendRequestStatus(requestID, "cancelled")
	if err != nil {
		return fmt.Errorf("failed to update friend request status: %w", err)
	}
	return nil
}

func (s *friendService) RemoveFriend(user1Username, user2Username string) error {
	// Check if they are actually friends
	isFriends, err := s.friendRepo.IsFriends(user1Username, user2Username)
	if err != nil {
		return fmt.Errorf("failed to check friendship status: %w", err)
	}
	if !isFriends {
		return fmt.Errorf("users are not friends")
	}

	err = s.friendRepo.DeleteFriendship(user1Username, user2Username)
	if err != nil {
		return fmt.Errorf("failed to remove friendship: %w", err)
	}
	return nil
}

func (s *friendService) BlockUser(blockerUsername, blockedUsername string) (*repository.BlockedUser, error) {
	// Check if already blocked
	isBlocked, err := s.friendRepo.IsBlocked(blockerUsername, blockedUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return nil, serviceErrors.ErrUserBlocked
	}

	// Remove friendship if exists
	isFriends, err := s.friendRepo.IsFriends(blockerUsername, blockedUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to check friendship status: %w", err)
	}
	if isFriends {
		err = s.friendRepo.DeleteFriendship(blockerUsername, blockedUsername)
		if err != nil {
			return nil, fmt.Errorf("failed to remove friendship before blocking: %w", err)
		}
	}

	// Decline any pending friend requests from blocked user
	fr, err := s.friendRepo.GetPendingFriendRequest(blockedUsername, blockerUsername)
	if err == nil { // Request exists
		err = s.friendRepo.UpdateFriendRequestStatus(fr.ID, "declined")
		if err != nil {
			return nil, fmt.Errorf("failed to decline pending friend request before blocking: %w", err)
		}
	}

	bu, err := s.friendRepo.BlockUser(blockerUsername, blockedUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to block user: %w", err)
	}
	return bu, nil
}

func (s *friendService) UnblockUser(blockerUsername, blockedUsername string) error {
	isBlocked, err := s.friendRepo.IsBlocked(blockerUsername, blockedUsername)
	if err != nil {
		return fmt.Errorf("failed to check block status: %w", err)
	}
	if !isBlocked {
		return fmt.Errorf("user is not blocked")
	}

	err = s.friendRepo.UnblockUser(blockerUsername, blockedUsername)
	if err != nil {
		return fmt.Errorf("failed to unblock user: %w", err)
	}
	return nil
}

func (s *friendService) ListFriends(username string) ([]*repository.User, error) {
	return s.friendRepo.ListFriends(username)
}

func (s *friendService) ListIncomingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	return s.friendRepo.ListIncomingFriendRequests(username)
}

func (s *friendService) ListOutgoingFriendRequests(username string) ([]*repository.FriendRequest, error) {
	return s.friendRepo.ListOutgoingFriendRequests(username)
}

func (s *friendService) ListBlockedUsers(username string) ([]*repository.BlockedUser, error) {
	return s.friendRepo.ListBlockedUsers(username)
}
