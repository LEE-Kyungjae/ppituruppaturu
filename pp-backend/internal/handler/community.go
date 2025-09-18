// backend/internal/handler/community.go
package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CommunityHandler handles community-related requests.
type CommunityHandler struct {
	communityService service.CommunityService
}

// NewCommunityHandler creates a new CommunityHandler.
func NewCommunityHandler(cs service.CommunityService) *CommunityHandler {
	return &CommunityHandler{communityService: cs}
}

// CreatePost handles creating a new post.
// @Summary      Create a new post
// @Description  Creates a new community post.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        post body CreatePostRequest true "Post details"
// @Success      201 {object} repository.Post
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /posts [post]
func (h *CommunityHandler) CreatePost(c *gin.Context) {
	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	post, err := h.communityService.CreatePost(authorUsername.(string), req.Title, req.Content)
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to create post")
		return
	}

	respondJSON(c, http.StatusCreated, post)
}

// GetPostByID handles retrieving a post by its ID.
// @Summary      Get post by ID
// @Description  Retrieves a single community post by its unique ID.
// @Tags         Community
// @Produce      json
// @Param        post_id path string true "Post ID"
// @Success      200 {object} repository.Post
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /posts/{post_id} [get]
func (h *CommunityHandler) GetPostByID(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("post_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid post ID")
		return
	}

	post, err := h.communityService.GetPostByID(postID)
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve post")
		return
	}

	respondJSON(c, http.StatusOK, post)
}

// ListPosts handles listing all posts.
// @Summary      List all posts
// @Description  Retrieves a list of all community posts.
// @Tags         Community
// @Produce      json
// @Param        limit query int false "Limit the number of posts returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.Post
// @Failure      500 {object} Response
// @Router       /posts [get]
func (h *CommunityHandler) ListPosts(c *gin.Context) {
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

	posts, err := h.communityService.ListPosts(limitInt, offsetInt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list posts")
		return
	}

	respondJSON(c, http.StatusOK, posts)
}

// UpdatePost handles updating an existing post.
// @Summary      Update a post
// @Description  Updates an existing community post by its ID. Only the author can update.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        post_id path string true "Post ID"
// @Param        post body UpdatePostRequest true "Updated post details"
// @Success      200 {object} repository.Post
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /posts/{post_id} [put]
func (h *CommunityHandler) UpdatePost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("post_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid post ID")
		return
	}

	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updatedPost, err := h.communityService.UpdatePost(postID, authorUsername.(string), req.Title, req.Content)
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to update post")
		return
	}

	respondJSON(c, http.StatusOK, updatedPost)
}

// DeletePost handles deleting a post.
// @Summary      Delete a post
// @Description  Deletes a community post by its ID. Only the author can delete.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        post_id path string true "Post ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /posts/{post_id} [delete]
func (h *CommunityHandler) DeletePost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("post_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid post ID")
		return
	}

	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	err = h.communityService.DeletePost(postID, authorUsername.(string))
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to delete post")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

// CreateComment handles creating a new comment on a post.
// @Summary      Create a new comment
// @Description  Creates a new comment on a specific community post.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        post_id path string true "Post ID"
// @Param        comment body CreateCommentRequest true "Comment details"
// @Success      201 {object} repository.Comment
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /posts/{post_id}/comments [post]
func (h *CommunityHandler) CreateComment(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("post_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid post ID")
		return
	}

	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	comment, err := h.communityService.CreateComment(postID, authorUsername.(string), req.Content)
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to create comment")
		return
	}

	respondJSON(c, http.StatusCreated, comment)
}

// GetCommentByID handles retrieving a comment by its ID.
// @Summary      Get comment by ID
// @Description  Retrieves a single community comment by its unique ID.
// @Tags         Community
// @Produce      json
// @Param        comment_id path string true "Comment ID"
// @Success      200 {object} repository.Comment
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /comments/{comment_id} [get]
func (h *CommunityHandler) GetCommentByID(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("comment_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid comment ID")
		return
	}

	comment, err := h.communityService.GetCommentByID(commentID)
	if err != nil {
		if errors.Is(err, service.ErrCommentNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to retrieve comment")
		return
	}

	respondJSON(c, http.StatusOK, comment)
}

// ListCommentsByPostID handles listing comments for a specific post.
// @Summary      List comments for a post
// @Description  Retrieves a list of comments for a specific community post.
// @Tags         Community
// @Produce      json
// @Param        post_id path string true "Post ID"
// @Param        limit query int false "Limit the number of comments returned"
// @Param        offset query int false "Offset for pagination"
// @Success      200 {array} repository.Comment
// @Failure      400 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Router       /posts/{post_id}/comments [get]
func (h *CommunityHandler) ListCommentsByPostID(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("post_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid post ID")
		return
	}

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

	comments, err := h.communityService.ListCommentsByPostID(postID, limitInt, offsetInt)
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to list comments")
		return
	}

	respondJSON(c, http.StatusOK, comments)
}

// UpdateComment handles updating an existing comment.
// @Summary      Update a comment
// @Description  Updates an existing community comment by its ID. Only the author can update.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        comment_id path string true "Comment ID"
// @Param        comment body UpdateCommentRequest true "Updated comment details"
// @Success      200 {object} repository.Comment
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /comments/{comment_id} [put]
func (h *CommunityHandler) UpdateComment(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("comment_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid comment ID")
		return
	}

	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updatedComment, err := h.communityService.UpdateComment(commentID, authorUsername.(string), req.Content)
	if err != nil {
		if errors.Is(err, service.ErrCommentNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to update comment")
		return
	}

	respondJSON(c, http.StatusOK, updatedComment)
}

// DeleteComment handles deleting a comment.
// @Summary      Delete a comment
// @Description  Deletes a community comment by its ID. Only the author can delete.
// @Tags         Community
// @Accept       json
// @Produce      json
// @Param        comment_id path string true "Comment ID"
// @Success      204 "No Content"
// @Failure      400 {object} Response
// @Failure      401 {object} Response
// @Failure      403 {object} Response
// @Failure      404 {object} Response
// @Failure      500 {object} Response
// @Security     BearerAuth
// @Router       /comments/{comment_id} [delete]
func (h *CommunityHandler) DeleteComment(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("comment_id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid comment ID")
		return
	}

	authorUsername, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusUnauthorized, "user not found in context")
		return
	}

	err = h.communityService.DeleteComment(commentID, authorUsername.(string))
	if err != nil {
		if errors.Is(err, service.ErrCommentNotFound) {
			respondError(c, http.StatusNotFound, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "failed to delete comment")
		return
	}

	respondJSON(c, http.StatusNoContent, nil)
}

type CreatePostRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type UpdatePostRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}
