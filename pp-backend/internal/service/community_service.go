// backend/internal/service/community_service.go

package service

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	serviceErrors "github.com/pitturu-ppaturu/backend/internal/service/errors"
)

var (
	ErrPostNotFound    = serviceErrors.ErrPostNotFound
	ErrCommentNotFound = serviceErrors.ErrCommentNotFound
)

type CommunityService interface {
	CreatePost(authorUsername, title, content string) (*repository.Post, error)
	GetPostByID(postID uuid.UUID) (*repository.Post, error)
	ListPosts(limit, offset int) ([]*repository.Post, error)
	UpdatePost(postID uuid.UUID, authorUsername, title, content string) (*repository.Post, error)
	DeletePost(postID uuid.UUID, authorUsername string) error

	CreateComment(postID uuid.UUID, authorUsername, content string) (*repository.Comment, error)
	GetCommentByID(commentID uuid.UUID) (*repository.Comment, error)
	ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*repository.Comment, error)
	UpdateComment(commentID uuid.UUID, authorUsername, content string) (*repository.Comment, error)
	DeleteComment(commentID uuid.UUID, authorUsername string) error
}

type communityService struct {
	postRepo    repository.PostRepository
	commentRepo repository.CommentRepository
	userRepo    repository.UserRepository
}

func NewCommunityService(postRepo repository.PostRepository, commentRepo repository.CommentRepository, userRepo repository.UserRepository) CommunityService {
	return &communityService{
		postRepo:    postRepo,
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

func (s *communityService) CreatePost(authorUsername, title, content string) (*repository.Post, error) {
	// Check if author exists
	_, err := s.userRepo.Find(authorUsername)
	if err != nil {
		return nil, fmt.Errorf("author user not found: %w", serviceErrors.ErrUserNotFound)
	}

	post, err := s.postRepo.CreatePost(authorUsername, title, content)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	return post, nil
}

func (s *communityService) GetPostByID(postID uuid.UUID) (*repository.Post, error) {
	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get post by ID: %w", err)
	}
	return post, nil
}

func (s *communityService) ListPosts(limit, offset int) ([]*repository.Post, error) {
	posts, err := s.postRepo.ListPosts(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts: %w", err)
	}
	return posts, nil
}

func (s *communityService) UpdatePost(postID uuid.UUID, authorUsername, title, content string) (*repository.Post, error) {
	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get post for update: %w", err)
	}

	if post.AuthorUsername != authorUsername {
		return nil, fmt.Errorf("user is not the author of the post")
	}

	post.Title = title
	post.Content = content

	updatedPost, err := s.postRepo.UpdatePost(post)
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}
	return updatedPost, nil
}

func (s *communityService) DeletePost(postID uuid.UUID, authorUsername string) error {
	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return fmt.Errorf("failed to get post for deletion: %w", err)
	}

	if post.AuthorUsername != authorUsername {
		return fmt.Errorf("user is not the author of the post")
	}

	err = s.postRepo.DeletePost(postID)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}
	return nil
}

func (s *communityService) CreateComment(postID uuid.UUID, authorUsername, content string) (*repository.Comment, error) {
	// Check if post exists
	_, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, fmt.Errorf("post not found for comment: %w", serviceErrors.ErrPostNotFound)
	}

	// Check if author exists
	_, err = s.userRepo.Find(authorUsername)
	if err != nil {
		return nil, fmt.Errorf("author user not found for comment: %w", serviceErrors.ErrUserNotFound)
	}

	comment, err := s.commentRepo.CreateComment(postID, authorUsername, content)
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}
	return comment, nil
}

func (s *communityService) GetCommentByID(commentID uuid.UUID) (*repository.Comment, error) {
	comment, err := s.commentRepo.GetCommentByID(commentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comment by ID: %w", err)
	}
	return comment, nil
}

func (s *communityService) ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*repository.Comment, error) {
	// Check if post exists
	_, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, fmt.Errorf("post not found for listing comments: %w", serviceErrors.ErrPostNotFound)
	}

	comments, err := s.commentRepo.ListCommentsByPostID(postID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list comments: %w", err)
	}
	return comments, nil
}

func (s *communityService) UpdateComment(commentID uuid.UUID, authorUsername, content string) (*repository.Comment, error) {
	comment, err := s.commentRepo.GetCommentByID(commentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comment for update: %w", err)
	}

	if comment.AuthorUsername != authorUsername {
		return nil, fmt.Errorf("user is not the author of the comment")
	}

	comment.Content = content

	updatedComment, err := s.commentRepo.UpdateComment(comment)
	if err != nil {
		return nil, fmt.Errorf("failed to update comment: %w", err)
	}
	return updatedComment, nil
}

func (s *communityService) DeleteComment(commentID uuid.UUID, authorUsername string) error {
	comment, err := s.commentRepo.GetCommentByID(commentID)
	if err != nil {
		return fmt.Errorf("failed to get comment for deletion: %w", err)
	}

	if comment.AuthorUsername != authorUsername {
		return fmt.Errorf("user is not the author of the comment")
	}

	err = s.commentRepo.DeleteComment(commentID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}
	return nil
}