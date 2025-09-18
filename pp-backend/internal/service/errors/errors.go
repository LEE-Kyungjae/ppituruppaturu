// backend/internal/service/errors/errors.go

package errors

import (
	"errors"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

var (
	ErrUserNotFound       = repository.ErrUserNotFound
	ErrInvalidCredentials = repository.ErrInvalidCredentials
	ErrUserAlreadyExists  = repository.ErrUserAlreadyExists

	ErrChatRoomNotFound   = repository.ErrChatRoomNotFound
	ErrChatRoomExists     = repository.ErrChatRoomExists
	ErrRoomMemberNotFound = repository.ErrRoomMemberNotFound
	ErrRoomMemberExists   = repository.ErrRoomMemberExists

	ErrFriendRequestNotFound = repository.ErrFriendRequestNotFound
	ErrFriendRequestExists   = repository.ErrFriendRequestExists
	ErrFriendshipExists      = repository.ErrFriendshipExists
	ErrUserBlocked           = repository.ErrUserBlocked

	ErrGameNotFound        = repository.ErrGameNotFound
	ErrGameSessionNotFound = repository.ErrGameSessionNotFound
	ErrGameScoreNotFound   = repository.ErrGameScoreNotFound

	ErrItemNotFound        = repository.ErrItemNotFound
	ErrInsufficientPoints  = errors.New("insufficient points")
	ErrInvalidPurchase     = errors.New("invalid purchase")

	ErrPostNotFound    = repository.ErrPostNotFound
	ErrCommentNotFound = repository.ErrCommentNotFound
)