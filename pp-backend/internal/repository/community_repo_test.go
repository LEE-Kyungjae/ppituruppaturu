// backend/internal/repository/community_repo_test.go
package repository_test

import (
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/pitturu-ppaturu/backend/internal/repository"
)

func withPostRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.PostRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresPostRepository(tx)

	testFunc(repo)
}

func withCommentRepo(t *testing.T, db *sql.DB, testFunc func(repo repository.CommentRepository)) {
	tx, err := db.Begin()
	require.NoError(t, err)
	defer tx.Rollback()

	repo := repository.NewPostgresCommentRepository(tx)

	testFunc(repo)
}

func TestPostRepository_CreatePost(t *testing.T) {
	withPostRepo(t, testDB, func(repo repository.PostRepository) {
		// Setup: Create user
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("post_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)

		// Test success
		post, err := repo.CreatePost("post_author", "Test Title", "Test Content")
		require.NoError(t, err)
		assert.NotNil(t, post)
		assert.Equal(t, "post_author", post.AuthorUsername)
		assert.Equal(t, "Test Title", post.Title)
		assert.Equal(t, "Test Content", post.Content)
		assert.Nil(t, post.DeletedAt)
	})
}

func TestPostRepository_GetPostByID(t *testing.T) {
	withPostRepo(t, testDB, func(repo repository.PostRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("get_post_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		post, err := repo.CreatePost("get_post_author", "Get Title", "Get Content")
		require.NoError(t, err)

		// Test success
		fetchedPost, err := repo.GetPostByID(post.ID)
		require.NoError(t, err)
		assert.Equal(t, post.ID, fetchedPost.ID)

		// Test not found
		_, err = repo.GetPostByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrPostNotFound)
	})
}

func TestPostRepository_ListPosts(t *testing.T) {
	withPostRepo(t, testDB, func(repo repository.PostRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("list_post_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		_, err = repo.CreatePost("list_post_author", "Post 1", "Content 1")
		require.NoError(t, err)
		_, err = repo.CreatePost("list_post_author", "Post 2", "Content 2")
		require.NoError(t, err)

		// Test success
		posts, err := repo.ListPosts(10, 0)
		require.NoError(t, err)
		assert.Len(t, posts, 2)
		assert.Equal(t, "Post 2", posts[0].Title) // Ordered by created_at DESC
	})
}

func TestPostRepository_UpdatePost(t *testing.T) {
	withPostRepo(t, testDB, func(repo repository.PostRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("update_post_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		post, err := repo.CreatePost("update_post_author", "Original Title", "Original Content")
		require.NoError(t, err)

		// Test success
		post.Title = "Updated Title"
		post.Content = "Updated Content"
		updatedPost, err := repo.UpdatePost(post)
		require.NoError(t, err)
		assert.NotNil(t, updatedPost)
		assert.Equal(t, "Updated Title", updatedPost.Title)
		assert.Equal(t, "Updated Content", updatedPost.Content)

		// Test not found
		nonExistentPost := &repository.Post{ID: uuid.New(), Title: "NonExistent", Content: "NonExistent"}
		_, err = repo.UpdatePost(nonExistentPost)
		assert.ErrorIs(t, err, repository.ErrPostNotFound)
	})
}

func TestPostRepository_DeletePost(t *testing.T) {
	withPostRepo(t, testDB, func(repo repository.PostRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("delete_post_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		post, err := repo.CreatePost("delete_post_author", "Delete Title", "Delete Content")
		require.NoError(t, err)

		// Test success
		err = repo.DeletePost(post.ID)
		require.NoError(t, err)

		// Verify deletion (soft delete)
		_, err = repo.GetPostByID(post.ID)
		assert.ErrorIs(t, err, repository.ErrPostNotFound)
	})
}

func TestCommentRepository_CreateComment(t *testing.T) {
	withCommentRepo(t, testDB, func(repo repository.CommentRepository) {
		// Setup: Create user and post
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("comment_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		postRepo := repository.NewPostgresPostRepository(testDB)
		post, err := postRepo.CreatePost("comment_author", "Comment Post", "Post Content")
		require.NoError(t, err)

		// Test success
		comment, err := repo.CreateComment(post.ID, "comment_author", "Test Comment Content")
		require.NoError(t, err)
		assert.NotNil(t, comment)
		assert.Equal(t, post.ID, comment.PostID)
		assert.Equal(t, "comment_author", comment.AuthorUsername)
		assert.Equal(t, "Test Comment Content", comment.Content)
		assert.Nil(t, comment.DeletedAt)
	})
}

func TestCommentRepository_GetCommentByID(t *testing.T) {
	withCommentRepo(t, testDB, func(repo repository.CommentRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("get_comment_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		postRepo := repository.NewPostgresPostRepository(testDB)
		post, err := postRepo.CreatePost("get_comment_author", "Get Comment Post", "Post Content")
		require.NoError(t, err)
		comment, err := repo.CreateComment(post.ID, "get_comment_author", "Get Comment Content")
		require.NoError(t, err)

		// Test success
		fetchedComment, err := repo.GetCommentByID(comment.ID)
		require.NoError(t, err)
		assert.Equal(t, comment.ID, fetchedComment.ID)

		// Test not found
		_, err = repo.GetCommentByID(uuid.New())
		assert.ErrorIs(t, err, repository.ErrCommentNotFound)
	})
}

func TestCommentRepository_ListCommentsByPostID(t *testing.T) {
	withCommentRepo(t, testDB, func(repo repository.CommentRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("list_comment_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		postRepo := repository.NewPostgresPostRepository(testDB)
		post, err := postRepo.CreatePost("list_comment_author", "List Comment Post", "Post Content")
		require.NoError(t, err)

		_, err = repo.CreateComment(post.ID, "list_comment_author", "Comment 1")
		require.NoError(t, err)
		_, err = repo.CreateComment(post.ID, "list_comment_author", "Comment 2")
		require.NoError(t, err)

		// Test success
		comments, err := repo.ListCommentsByPostID(post.ID, 10, 0)
		require.NoError(t, err)
		assert.Len(t, comments, 2)
		assert.Equal(t, "Comment 1", comments[0].Content) // Ordered by created_at ASC

		// Test pagination
		paginatedComments, err := repo.ListCommentsByPostID(post.ID, 1, 1)
		require.NoError(t, err)
		assert.Len(t, paginatedComments, 1)
		assert.Equal(t, "Comment 2", paginatedComments[0].Content)
	})
}

func TestCommentRepository_UpdateComment(t *testing.T) {
	withCommentRepo(t, testDB, func(repo repository.CommentRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("update_comment_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		postRepo := repository.NewPostgresPostRepository(testDB)
		post, err := postRepo.CreatePost("update_comment_author", "Update Comment Post", "Post Content")
		require.NoError(t, err)
		comment, err := repo.CreateComment(post.ID, "update_comment_author", "Original Comment Content")
		require.NoError(t, err)

		// Test success
		comment.Content = "Updated Comment Content"
		updatedComment, err := repo.UpdateComment(comment)
		require.NoError(t, err)
		assert.NotNil(t, updatedComment)
		assert.Equal(t, "Updated Comment Content", updatedComment.Content)

		// Test not found
		nonExistentComment := &repository.Comment{ID: uuid.New(), Content: "NonExistent"}
		_, err = repo.UpdateComment(nonExistentComment)
		assert.ErrorIs(t, err, repository.ErrCommentNotFound)
	})
}

func TestCommentRepository_DeleteComment(t *testing.T) {
	withCommentRepo(t, testDB, func(repo repository.CommentRepository) {
		// Setup
		userRepo := repository.NewPostgresUserRepository(testDB)
		_, err := userRepo.Create("delete_comment_author", "pass", "user", 12, sql.NullString{})
		require.NoError(t, err)
		postRepo := repository.NewPostgresPostRepository(testDB)
		post, err := postRepo.CreatePost("delete_comment_author", "Delete Comment Post", "Post Content")
		require.NoError(t, err)
		comment, err := repo.CreateComment(post.ID, "delete_comment_author", "Delete Comment Content")
		require.NoError(t, err)

		// Test success
		err = repo.DeleteComment(comment.ID)
		require.NoError(t, err)

		// Verify deletion (soft delete)
		_, err = repo.GetCommentByID(comment.ID)
		assert.ErrorIs(t, err, repository.ErrCommentNotFound)
	})
}
