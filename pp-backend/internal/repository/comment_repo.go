// backend/internal/repository/comment_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCommentNotFound = errors.New("comment not found")
)

type Comment struct {
	ID           uuid.UUID
	PostID       uuid.UUID
	AuthorUsername string
	Content      string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    sql.NullTime
}

type CommentRepository interface {
	CreateComment(postID uuid.UUID, authorUsername, content string) (*Comment, error)
	GetCommentByID(id uuid.UUID) (*Comment, error)
	ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*Comment, error)
	UpdateComment(comment *Comment) (*Comment, error)
	DeleteComment(id uuid.UUID) error
}

type postgresCommentRepository struct {
	db DBTX
}

func NewPostgresCommentRepository(db DBTX) CommentRepository {
	return &postgresCommentRepository{db: db}
}

func (r *postgresCommentRepository) CreateComment(postID uuid.UUID, authorUsername, content string) (*Comment, error) {
	query := `INSERT INTO comments (post_id, author_username, content) VALUES ($1, $2, $3) RETURNING id, post_id, author_username, content, created_at, updated_at, deleted_at`
	var comment Comment
	err := r.db.QueryRow(query, postID, authorUsername, content).Scan(&comment.ID, &comment.PostID, &comment.AuthorUsername, &comment.Content, &comment.CreatedAt, &comment.UpdatedAt, &comment.DeletedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}
	return &comment, nil
}

func (r *postgresCommentRepository) GetCommentByID(id uuid.UUID) (*Comment, error) {
	query := `SELECT id, post_id, author_username, content, created_at, updated_at, deleted_at FROM comments WHERE id = $1 AND deleted_at IS NULL`
	var comment Comment
	err := r.db.QueryRow(query, id).Scan(&comment.ID, &comment.PostID, &comment.AuthorUsername, &comment.Content, &comment.CreatedAt, &comment.UpdatedAt, &comment.DeletedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCommentNotFound
		}
		return nil, fmt.Errorf("failed to get comment by ID: %w", err)
	}
	return &comment, nil
}

func (r *postgresCommentRepository) ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*Comment, error) {
	query := `SELECT id, post_id, author_username, content, created_at, updated_at, deleted_at FROM comments WHERE post_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT $2 OFFSET $3`
	rows, err := r.db.Query(query, postID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list comments: %w", err)
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		var comment Comment
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.AuthorUsername, &comment.Content, &comment.CreatedAt, &comment.UpdatedAt, &comment.DeletedAt); err != nil {
			return nil, fmt.Errorf("failed to scan comment row: %w", err)
		}
		comments = append(comments, &comment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during comment list iteration: %w", err)
	}

	return comments, nil
}

func (r *postgresCommentRepository) UpdateComment(comment *Comment) (*Comment, error) {
	query := `UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id, post_id, author_username, content, created_at, updated_at, deleted_at`
	var updatedComment Comment
	err := r.db.QueryRow(query, comment.Content, comment.ID).Scan(&updatedComment.ID, &updatedComment.PostID, &updatedComment.AuthorUsername, &updatedComment.Content, &updatedComment.CreatedAt, &updatedComment.UpdatedAt, &updatedComment.DeletedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCommentNotFound
		}
		return nil, fmt.Errorf("failed to update comment: %w", err)
	}
	return &updatedComment, nil
}

func (r *postgresCommentRepository) DeleteComment(id uuid.UUID) error {
	query := `UPDATE comments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrCommentNotFound
	}
	return nil
}
