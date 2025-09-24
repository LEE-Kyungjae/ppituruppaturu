// backend/internal/handler/friend.go
package handler

import (
	"errors"
	"net/http"

	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FriendHandler handles friend-related requests.
type FriendHandler struct {
	friendService service.FriendService
}

// NewFriendHandler creates a new FriendHandler.
func NewFriendHandler(fs service.FriendService) *FriendHandler {
	return &FriendHandler{friendService: fs}
}

// SendFriendRequest handles sending a friend request.
// @Summary      Send friend request
// @Description  Sends a friend request to another user.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        username path string true "Receiver username"
// @Success      201 {object} FriendRequestResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /users/{username}/friend-request [post]
func (h *FriendHandler) SendFriendRequest(c *gin.Context) {
	senderUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}
	receiverUsername := c.Param("username")

	if senderUsername.(string) == receiverUsername {
		respondError(c, http.StatusBadRequest, "cannot send friend request to self")
		return
	}

	fr, err := h.friendService.SendFriendRequest(senderUsername.(string), receiverUsername)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrFriendRequestExists) || errors.Is(err, serviceErrors.ErrFriendshipExists) || errors.Is(err, serviceErrors.ErrUserBlocked) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to send friend request")
		return
	}

	respondJSON(c, http.StatusCreated, fr)
}

// AcceptFriendRequest handles accepting a friend request.
// @Summary      Accept friend request
// @Description  Accepts a pending friend request.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        request_id path string true "Friend request ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friend-requests/{request_id}/accept [put]
func (h *FriendHandler) AcceptFriendRequest(c *gin.Context) {
	acceptorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	requestID, err := uuid.Parse(c.Param("request_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid request ID")
		return
	}

	err = h.friendService.AcceptFriendRequest(requestID, acceptorUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrFriendRequestNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to accept friend request")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// DeclineFriendRequest handles declining a friend request.
// @Summary      Decline friend request
// @Description  Declines a pending friend request.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        request_id path string true "Friend request ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friend-requests/{request_id}/decline [put]
func (h *FriendHandler) DeclineFriendRequest(c *gin.Context) {
	declinerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	requestID, err := uuid.Parse(c.Param("request_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid request ID")
		return
	}

	err = h.friendService.DeclineFriendRequest(requestID, declinerUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrFriendRequestNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to decline friend request")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// CancelFriendRequest handles canceling an outgoing friend request.
// @Summary      Cancel friend request
// @Description  Cancels a pending outgoing friend request.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        request_id path string true "Friend request ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friend-requests/{request_id} [delete]
func (h *FriendHandler) CancelFriendRequest(c *gin.Context) {
	cancellerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	requestID, err := uuid.Parse(c.Param("request_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid request ID")
		return
	}

	err = h.friendService.CancelFriendRequest(requestID, cancellerUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrFriendRequestNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to cancel friend request")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// RemoveFriend handles removing an existing friend.
// @Summary      Remove friend
// @Description  Removes an existing friend from the user's friend list.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        username path string true "Friend username to remove"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friends/{username} [delete]
func (h *FriendHandler) RemoveFriend(c *gin.Context) {
	user1Username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}
	user2Username := c.Param("username")

	if user1Username.(string) == user2Username {
		respondError(c, http.StatusBadRequest, "cannot remove self as friend")
		return
	}

	err := h.friendService.RemoveFriend(user1Username.(string), user2Username)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrFriendshipExists) { // This error name is misleading here, should be ErrFriendshipNotFound
			respondError(c, http.StatusNotFound, "friendship not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to remove friend")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// BlockUser handles blocking another user.
// @Summary      Block user
// @Description  Blocks another user, preventing communication and hiding activities.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        username path string true "Username to block"
// @Success      201 {object} BlockedUserResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /users/{username}/block [post]
func (h *FriendHandler) BlockUser(c *gin.Context) {
	blockerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}
	blockedUsername := c.Param("username")

	if blockerUsername.(string) == blockedUsername {
		respondError(c, http.StatusBadRequest, "cannot block self")
		return
	}

	bu, err := h.friendService.BlockUser(blockerUsername.(string), blockedUsername)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrUserBlocked) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to block user")
		return
	}

	respondJSON(c, http.StatusCreated, bu)
}

// UnblockUser handles unblocking a user.
// @Summary      Unblock user
// @Description  Unblocks a previously blocked user.
// @Tags         Friend
// @Accept       json
// @Produce      json
// @Param        username path string true "Username to unblock"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /users/{username}/unblock [delete]
func (h *FriendHandler) UnblockUser(c *gin.Context) {
	unblockerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}
	blockedUsername := c.Param("username")

	err := h.friendService.UnblockUser(unblockerUsername.(string), blockedUsername)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrUserBlocked) { // This error name is misleading here, should be ErrUserNotBlocked
			respondError(c, http.StatusNotFound, "user not blocked")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to unblock user")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// ListFriends handles listing the current user's friends.
// @Summary      List friends
// @Description  Retrieves a list of the authenticated user's friends.
// @Tags         Friend
// @Produce      json
// @Success      200 {array} UserResponse
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friends [get]
func (h *FriendHandler) ListFriends(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	friends, err := h.friendService.ListFriends(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list friends")
		return
	}

	respondJSON(c, http.StatusOK, friends)
}

// ListIncomingFriendRequests handles listing incoming friend requests.
// @Summary      List incoming friend requests
// @Description  Retrieves a list of pending friend requests received by the authenticated user.
// @Tags         Friend
// @Produce      json
// @Success      200 {array} FriendRequestResponse
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friend-requests/incoming [get]
func (h *FriendHandler) ListIncomingFriendRequests(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	requests, err := h.friendService.ListIncomingFriendRequests(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list incoming friend requests")
		return
	}

	respondJSON(c, http.StatusOK, requests)
}

// ListOutgoingFriendRequests handles listing outgoing friend requests.
// @Summary      List outgoing friend requests
// @Description  Retrieves a list of pending friend requests sent by the authenticated user.
// @Tags         Friend
// @Produce      json
// @Success      200 {array} FriendRequestResponse
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/friend-requests/outgoing [get]
func (h *FriendHandler) ListOutgoingFriendRequests(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	requests, err := h.friendService.ListOutgoingFriendRequests(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list outgoing friend requests")
		return
	}

	respondJSON(c, http.StatusOK, requests)
}

// ListBlockedUsers handles listing blocked users.
// @Summary      List blocked users
// @Description  Retrieves a list of users blocked by the authenticated user.
// @Tags         Friend
// @Produce      json
// @Success      200 {array} BlockedUserResponse
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/blocked-users [get]
func (h *FriendHandler) ListBlockedUsers(c *gin.Context) {
	userUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	blockedUsers, err := h.friendService.ListBlockedUsers(userUsername.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list blocked users")
		return
	}

	respondJSON(c, http.StatusOK, blockedUsers)
}
