// backend/internal/handler/user.go
package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pitturu-ppaturu/backend/internal/config"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"
)

// UserHandler handles user-related requests.
type UserHandler struct {
	userService service.UserService
	cfg         *config.Config
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(s service.UserService, cfg *config.Config) *UserHandler {
	return &UserHandler{userService: s, cfg: cfg}
}

type meResponse struct {
	User string `json:"user" example:"alice"`
	Role string `json:"role" example:"user"`
}

// Me returns the currently authenticated user's information.
// @Summary      Get current user info
// @Description  Retrieves the authenticated user's profile information from the JWT.
// @Tags         User
// @Produce      json
// @Success      200 {object} meResponse
// @Failure      401 {object} Response
// @Security     BearerAuth
// @Router       /me [get]
func (h *UserHandler) Me(c *gin.Context) {
	// The user and role are set in the context by the auth middleware.
	user, _ := c.Get("user")
	role, _ := c.Get("role")

	respondJSON(c, http.StatusOK, meResponse{
		User: user.(string),
		Role: role.(string),
	})
}

// GetMyProfile returns the current user's full profile information.
// @Summary      Get current user profile
// @Description  Retrieves the authenticated user's full profile details.
// @Tags         User
// @Produce      json
// @Success      200 {object} UserResponse
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Security     BearerAuth
// @Router       /me/profile [get]
func (h *UserHandler) GetMyProfile(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	user, err := h.userService.Find(username.(string))
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "user profile not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve user profile")
		return
	}

	respondJSON(c, http.StatusOK, user)
}

// UpdateMyProfile updates the current user's profile information.
// @Summary      Update current user profile
// @Description  Updates the authenticated user's profile details.
// @Tags         User
// @Accept       json
// @Produce      json
// @Param        profile body repository.User true "User Profile Info"
// @Success      200 {object} UserResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/profile [put]
func (h *UserHandler) UpdateMyProfile(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req repository.User
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Ensure the username from the token is used, not from the request body
	req.Username = username.(string)

	updatedUser, err := h.userService.UpdateProfile(&req)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to update user profile")
		return
	}

	respondJSON(c, http.StatusOK, updatedUser)
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=72"`
}

// ChangeMyPassword allows a user to change their password.
// @Summary      Change user password
// @Description  Allows an authenticated user to change their password.
// @Tags         User
// @Accept       json
// @Produce      json
// @Param        password_change body changePasswordRequest true "Old and new passwords"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/password [put]
func (h *UserHandler) ChangeMyPassword(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userService.ChangePassword(username.(string), req.OldPassword, req.NewPassword, h.cfg.BcryptCost); err != nil {
		respondError(c, http.StatusInternalServerError, "failed to change password")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// DeactivateMyAccount deactivates the current user's account.
// @Summary      Deactivate user account
// @Description  Deactivates the authenticated user's account.
// @Tags         User
// @Accept       json
// @Produce      json
// @Success      204 "No Content"
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me/deactivate [post]
func (h *UserHandler) DeactivateMyAccount(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	if err := h.userService.DeactivateUser(username.(string)); err != nil {
		respondError(c, http.StatusInternalServerError, "failed to deactivate account")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// DeleteMyAccount deletes the current user's account.
// @Summary      Delete user account
// @Description  Deletes the authenticated user's account permanently.
// @Tags         User
// @Accept       json
// @Produce      json
// @Success      204 "No Content"
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /me [delete]
func (h *UserHandler) DeleteMyAccount(c *gin.Context) {
	username, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	if err := h.userService.DeleteUser(username.(string)); err != nil {
		respondError(c, http.StatusInternalServerError, "failed to delete account")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

type publicUserProfileResponse struct {
	Username          string `json:"username"`
	Nickname          string `json:"nickname,omitempty"`
	ProfilePictureURL string `json:"profile_picture_url,omitempty"`
	StatusMessage     string `json:"status_message,omitempty"`
}

// GetUserProfile returns a user's public profile.
// @Summary      Get user's public profile
// @Description  Retrieves a user's public profile information.
// @Tags         User
// @Produce      json
// @Param        username path string true "Username"
// @Success      200 {object} publicUserProfileResponse
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /users/{username}/profile [get]
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userService.Find(username)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "user not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to get user profile")
		return
	}

	// Return a subset of the user data for public profiles
	publicProfile := publicUserProfileResponse{
		Username: user.Username,
	}
	if user.Nickname != nil {
		publicProfile.Nickname = *user.Nickname
	}
	if user.ProfilePictureURL != nil {
		publicProfile.ProfilePictureURL = *user.ProfilePictureURL
	}
	if user.StatusMessage != nil {
		publicProfile.StatusMessage = *user.StatusMessage
	}

	respondJSON(c, http.StatusOK, publicProfile)
}

type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=32" example:"newuser"`
	Password string `json:"password" binding:"required,min=8,max=72" example:"password123"`
}

type userResponse struct {
	Username string `json:"username" example:"newuser"`
	Role     string `json:"role" example:"user"`
}

// Register handles new user registration.
// @Summary      Register a new user
// @Description  Creates a new user with a username and password.
// @Tags         User Management
// @Accept       json
// @Produce      json
// @Param        user body registerRequest true "User Registration Info"
// @Success      201 {object} userResponse
// @Failure      400 {object} Response
// @Failure      409 {object} Response
// @Failure      500 {object} Response
// @Router       /users [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.Register(req.Username, req.Password, h.cfg.BcryptCost)
	if err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			respondError(c, http.StatusConflict, "username already exists")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to register user")
		return
	}

	respondJSON(c, http.StatusCreated, userResponse{
		Username: user.Username,
		Role:     user.Role,
	})
}

type updateUserRequest struct {
	Role string `json:"role" binding:"required,oneof=user admin" example:"admin"`
}

// Update handles updating a user's role.
// @Summary      Update a user's role
// @Description  Updates a user's role. Requires admin privileges.
// @Tags         User Management
// @Accept       json
// @Produce      json
// @Param        username path string true "Username to update"
// @Param        role body updateUserRequest true "New role for the user"
// @Success      200 {object} userResponse
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/users/{username} [put]
func (h *UserHandler) Update(c *gin.Context) {
	username := c.Param("username")
	var req updateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.UpdateRole(username, req.Role)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "user not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to update user")
		return
	}

	respondJSON(c, http.StatusOK, userResponse{
		Username: user.Username,
		Role:     user.Role,
	})
}

// Delete handles user deletion.
// @Summary      Delete a user
// @Description  Deletes a user by their username. Requires admin privileges.
// @Tags         User Management
// @Produce      json
// @Param        username path string true "Username to delete"
// @Success      204 "No Content"
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/users/{username} [delete]
func (h *UserHandler) Delete(c *gin.Context) {
	username := c.Param("username")

	if err := h.userService.Delete(username); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "user not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to delete user")
		return
	}

	c.Status(http.StatusNoContent)
}

// List handles listing all users.
// @Summary      List all users
// @Description  Retrieves a list of all users. Requires admin privileges.
// @Tags         User Management
// @Produce      json
// @Success      200 {array} userResponse
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /admin/users [get]
func (h *UserHandler) List(c *gin.Context) {
	users, err := h.userService.List()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list users")
		return
	}

	// Convert repository.User to userResponse to avoid exposing password hash
	userResponses := make([]userResponse, len(users))
	for i, u := range users {
		userResponses[i] = userResponse{
			Username: u.Username,
			Role:     u.Role,
		}
	}

	respondJSON(c, http.StatusOK, userResponses)
}