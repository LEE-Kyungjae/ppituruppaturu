// backend/internal/repository/post_repo.go
package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrPostNotFound = errors.New("post not found")
)

type Post struct {
	ID           uuid.UUID
	AuthorUsername string
	Title        string
	Content      string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}

type PostRepository interface {
	CreatePost(authorUsername, title, content string) (*Post, error)
	GetPostByID(id uuid.UUID) (*Post, error)
	ListPosts(limit, offset int) ([]*Post, error)
	UpdatePost(post *Post) (*Post, error)
	DeletePost(id uuid.UUID) error
}

type postgresPostRepository struct {
	db DBTX
}

func NewPostgresPostRepository(db DBTX) PostRepository {
	return &postgresPostRepository{db: db}
}

func (r *postgresPostRepository) CreatePost(authorUsername, title, content string) (*Post, error) {
	query := `INSERT INTO posts (author_username, title, content) VALUES ($1, $2, $3) RETURNING id, author_username, title, content, created_at, updated_at, deleted_at`
	var post Post
	err := r.db.QueryRow(query, authorUsername, title, content).Scan(&post.ID, &post.AuthorUsername, &post.Title, &post.Content, &post.CreatedAt, &post.UpdatedAt, &post.DeletedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	return &post, nil
}

func (r *postgresPostRepository) GetPostByID(id uuid.UUID) (*Post, error) {
	query := `SELECT id, author_username, title, content, created_at, updated_at, deleted_at FROM posts WHERE id = $1 AND deleted_at IS NULL`
	var post Post
	err := r.db.QueryRow(query, id).Scan(&post.ID, &post.AuthorUsername, &post.Title, &post.Content, &post.CreatedAt, &post.UpdatedAt, &post.DeletedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrPostNotFound
		}
		return nil, fmt.Errorf("failed to get post by ID: %w", err)
	}
	return &post, nil
}

func (r *postgresPostRepository) ListPosts(limit, offset int) ([]*Post, error) {
	query := `SELECT id, author_username, title, content, created_at, updated_at, deleted_at FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts: %w", err)
	}
	defer rows.Close()

	var posts []*Post
	for rows.Next() {
		var post Post
		if err := rows.Scan(&post.ID, &post.AuthorUsername, &post.Title, &post.Content, &post.CreatedAt, &post.UpdatedAt, &post.DeletedAt); err != nil {
			return nil, fmt.Errorf("failed to scan post row: %w", err)
		}
		posts = append(posts, &post)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during post list iteration: %w", err)
	}

	return posts, nil
}

func (r *postgresPostRepository) UpdatePost(post *Post) (*Post, error) {
	query := `UPDATE posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL RETURNING id, author_username, title, content, created_at, updated_at, deleted_at`
	var updatedPost Post
	err := r.db.QueryRow(query, post.Title, post.Content, post.ID).Scan(&updatedPost.ID, &updatedPost.AuthorUsername, &updatedPost.Title, &updatedPost.Content, &updatedPost.CreatedAt, &updatedPost.UpdatedAt, &updatedPost.DeletedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrPostNotFound
		}
		return nil, fmt.Errorf("failed to update post: %w", err)
	}
	return &updatedPost, nil
}

func (r *postgresPostRepository) DeletePost(id uuid.UUID) error {
	query := `UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrPostNotFound
	}
	return nil
}
