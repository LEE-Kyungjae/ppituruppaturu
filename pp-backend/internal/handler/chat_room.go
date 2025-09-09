// backend/internal/handler/chat_room.go
package handler

import (
	"errors"
	"net/http"
	"strconv"

	serviceErrors "exit/internal/service/errors"
	service "exit/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ChatRoomHandler handles chat room related requests.
type ChatRoomHandler struct {
	chatRoomService service.ChatRoomService
}

// NewChatRoomHandler creates a new ChatRoomHandler.
func NewChatRoomHandler(crs service.ChatRoomService) *ChatRoomHandler {
	return &ChatRoomHandler{chatRoomService: crs}
}

// CreateChatRoom handles creating a new chat room.
// @Summary      Create a new chat room
// @Description  Creates a new chat room.
// @Tags         Chat Rooms
// @Accept       json
// @Produce      json
// @Param        room body CreateChatRoomRequest true "Chat room details"
// @Success      201 {object} repository.ChatRoom
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /chat-rooms [post]
func (h *ChatRoomHandler) CreateChatRoom(c *gin.Context) {
	creatorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req CreateChatRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	room, err := h.chatRoomService.CreateChatRoom(req.Name, req.Description, req.Type, creatorUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomExists) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to create chat room")
		return
	}

	respondJSON(c, http.StatusCreated, room)
}

// GetChatRoomByID handles retrieving a chat room by its ID.
// @Summary      Get chat room by ID
// @Description  Retrieves a single chat room by its unique ID.
// @Tags         Chat Rooms
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Success      200 {object} repository.ChatRoom
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /chat-rooms/{room_id} [get]
func (h *ChatRoomHandler) GetChatRoomByID(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	room, err := h.chatRoomService.GetChatRoomByID(roomID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve chat room")
		return
	}

	respondJSON(c, http.StatusOK, room)
}

// ListChatRooms handles listing all chat rooms.
// @Summary      List all chat rooms
// @Description  Retrieves a list of all chat rooms.
// @Tags         Chat Rooms
// @Produce      json
// @Param        limit query int false "Limit the number of rooms returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.ChatRoom
// @Failure      500 {object} Response
// @Router       /chat-rooms [get]
func (h *ChatRoomHandler) ListChatRooms(c *gin.Context) {
	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid limit parameter")
		return
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid offset parameter")
		return
	}

	rooms, err := h.chatRoomService.ListChatRooms(limitInt, offsetInt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list chat rooms")
		return
	}

	respondJSON(c, http.StatusOK, rooms)
}

// UpdateChatRoom handles updating an existing chat room.
// @Summary      Update a chat room
// @Description  Updates an existing chat room by its ID. Only members or admin can update.
// @Tags         Chat Rooms
// @Accept       json
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Param        room body UpdateChatRoomRequest true "Updated chat room details"
// @Success      200 {object} repository.ChatRoom
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /chat-rooms/{room_id} [put]
func (h *ChatRoomHandler) UpdateChatRoom(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	updaterUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req UpdateChatRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updatedRoom, err := h.chatRoomService.UpdateChatRoom(roomID, req.Name, req.Description, req.Type, updaterUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomNotFound) || errors.Is(err, serviceErrors.ErrChatRoomExists) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to update chat room")
		return
	}

	respondJSON(c, http.StatusOK, updatedRoom)
}

// DeleteChatRoom handles deleting a chat room.
// @Summary      Delete a chat room
// @Description  Deletes a chat room by its ID. Only members or admin can delete.
// @Tags         Chat Rooms
// @Accept       json
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /chat-rooms/{room_id} [delete]
func (h *ChatRoomHandler) DeleteChatRoom(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	deleterUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	err = h.chatRoomService.DeleteChatRoom(roomID, deleterUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to delete chat room")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// AddRoomMember handles adding a member to a chat room.
// @Summary      Add room member
// @Description  Adds a user as a member to a chat room.
// @Tags         Chat Rooms
// @Accept       json
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Param        member body AddRoomMemberRequest true "Member details"
// @Success      201 {object} repository.RoomMember
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /chat-rooms/{room_id}/members [post]
func (h *ChatRoomHandler) AddRoomMember(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	inviterUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req AddRoomMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	member, err := h.chatRoomService.AddRoomMember(roomID, req.MemberUsername, inviterUsername.(string))
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) || errors.Is(err, serviceErrors.ErrRoomMemberExists) {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to add room member")
		return
	}

	respondJSON(c, http.StatusCreated, member)
}

// RemoveRoomMember handles removing a member from a chat room.
// @Summary      Remove room member
// @Description  Removes a user from a chat room. Only the member themselves or admin can remove.
// @Tags         Chat Rooms
// @Accept       json
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Param        username path string true "Member username to remove"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /chat-rooms/{room_id}/members/{username} [delete]
func (h *ChatRoomHandler) RemoveRoomMember(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	removerUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}
	memberUsername := c.Param("username")

	err = h.chatRoomService.RemoveRoomMember(roomID, memberUsername, removerUsername.(string))
	if err != nil {
		if errors.Is(err, service.ErrChatRoomNotFound) || errors.Is(err, serviceErrors.ErrRoomMemberNotFound) || errors.Is(err, serviceErrors.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to remove room member")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// ListRoomMembers handles listing members of a chat room.
// @Summary      List room members
// @Description  Retrieves a list of members for a specific chat room.
// @Tags         Chat Rooms
// @Produce      json
// @Param        room_id path string true "Chat Room ID"
// @Success      200 {array} repository.User
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /chat-rooms/{room_id}/members [get]
func (h *ChatRoomHandler) ListRoomMembers(c *gin.Context) {
	roomID, err := uuid.Parse(c.Param("room_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	members, err := h.chatRoomService.ListRoomMembers(roomID)
	if err != nil {
		if errors.Is(err, serviceErrors.ErrChatRoomNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to list room members")
		return
	}

	respondJSON(c, http.StatusOK, members)
}

// ListUserChatRooms handles listing chat rooms a user is a member of.
// @Summary      List user chat rooms
// @Description  Retrieves a list of chat rooms the authenticated user is a member of.
// @Tags         Chat Rooms
// @Produce      json
// @Success      200 {array} repository.ChatRoom
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/chat-rooms [get]
func (h *ChatRoomHandler) ListUserChatRooms(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	rooms, err := h.chatRoomService.ListUserChatRooms(username.(string))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list user chat rooms")
		return
	}

	respondJSON(c, http.StatusOK, rooms)
}

type CreateChatRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required,oneof=public private group"`
}

type UpdateChatRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required,oneof=public private group"`
}

type AddRoomMemberRequest struct {
	MemberUsername string `json:"member_username" binding:"required"`
}
