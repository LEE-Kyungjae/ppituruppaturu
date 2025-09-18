// backend/internal/service/community_service_test.go
package service_test

import (
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestCommunityService_CreatePost(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	// Test success
	mockUserRepo.On("Find", "author1").Return(&repository.User{}, nil).Once()
	mockPostRepo.On("CreatePost", "author1", "Title", "Content").Return(&repository.Post{}, nil).Once()
	post, err := svc.CreatePost("author1", "Title", "Content")
	require.NoError(t, err)
	assert.NotNil(t, post)
	mockPostRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)

	// Test author not found
	mockUserRepo.On("Find", "nonexistent").Return(&repository.User{}, repository.ErrUserNotFound).Once()
	_, err = svc.CreatePost("nonexistent", "Title", "Content")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockUserRepo.AssertExpectations(t)
}

func TestCommunityService_GetPostByID(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	postID := uuid.New()
	// Test success
	mockPostRepo.On("GetPostByID", postID).Return(&repository.Post{}, nil).Once()
	post, err := svc.GetPostByID(postID)
	require.NoError(t, err)
	assert.NotNil(t, post)
	mockPostRepo.AssertExpectations(t)

	// Test post not found
	mockPostRepo.On("GetPostByID", postID).Return(nil, repository.ErrPostNotFound).Once()
	_, err = svc.GetPostByID(postID)
	assert.ErrorIs(t, err, repository.ErrPostNotFound)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_ListPosts(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	// Test success
	expectedPosts := []*repository.Post{{Title: "Post1"}, {Title: "Post2"}}
	mockPostRepo.On("ListPosts", 10, 0).Return(expectedPosts, nil).Once()
	posts, err := svc.ListPosts(10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedPosts, posts)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_UpdatePost(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	postID := uuid.New()
	// Test success
	existingPost := &repository.Post{ID: postID, AuthorUsername: "author_upd", Title: "Old Title", Content: "Old Content"}
	mockPostRepo.On("GetPostByID", postID).Return(existingPost, nil).Once()
	mockPostRepo.On("UpdatePost", mock.AnythingOfType("*repository.Post")).Return(&repository.Post{}, nil).Once()
	post, err := svc.UpdatePost(postID, "author_upd", "New Title", "New Content")
	require.NoError(t, err)
	assert.NotNil(t, post)
	mockPostRepo.AssertExpectations(t)

	// Test not author
	mockPostRepo.On("GetPostByID", postID).Return(existingPost, nil).Once()
	_, err = svc.UpdatePost(postID, "wrong_author", "New Title", "New Content")
	assert.Error(t, err)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_DeletePost(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	postID := uuid.New()
	// Test success
	existingPost := &repository.Post{ID: postID, AuthorUsername: "author_del"}
	mockPostRepo.On("GetPostByID", postID).Return(existingPost, nil).Once()
	mockPostRepo.On("DeletePost", postID).Return(nil).Once()
	err := svc.DeletePost(postID, "author_del")
	require.NoError(t, err)
	mockPostRepo.AssertExpectations(t)

	// Test not author
	mockPostRepo.On("GetPostByID", postID).Return(existingPost, nil).Once()
	err = svc.DeletePost(postID, "wrong_author")
	assert.Error(t, err)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_CreateComment(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	postID := uuid.New()
	// Test success
	mockPostRepo.On("GetPostByID", postID).Return(&repository.Post{}, nil).Once()
	mockUserRepo.On("Find", "comment_author").Return(&repository.User{}, nil).Once()
	mockCommentRepo.On("CreateComment", postID, "comment_author", "Content").Return(&repository.Comment{}, nil).Once()
	comment, err := svc.CreateComment(postID, "comment_author", "Content")
	require.NoError(t, err)
	assert.NotNil(t, comment)
	mockPostRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
	mockCommentRepo.AssertExpectations(t)

	// Test post not found
	mockPostRepo.On("GetPostByID", postID).Return(nil, repository.ErrPostNotFound).Once()
	_, err = svc.CreateComment(postID, "comment_author", "Content")
	assert.ErrorIs(t, err, repository.ErrPostNotFound)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_GetCommentByID(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	commentID := uuid.New()
	// Test success
	mockCommentRepo.On("GetCommentByID", commentID).Return(&repository.Comment{}, nil).Once()
	comment, err := svc.GetCommentByID(commentID)
	require.NoError(t, err)
	assert.NotNil(t, comment)
	mockCommentRepo.AssertExpectations(t)

	// Test comment not found
	mockCommentRepo.On("GetCommentByID", commentID).Return(nil, repository.ErrCommentNotFound).Once()
	_, err = svc.GetCommentByID(commentID)
	assert.ErrorIs(t, err, repository.ErrCommentNotFound)
	mockCommentRepo.AssertExpectations(t)
}

func TestCommunityService_ListCommentsByPostID(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	postID := uuid.New()
	// Test success
	mockPostRepo.On("GetPostByID", postID).Return(&repository.Post{}, nil).Once()
	expectedComments := []*repository.Comment{{Content: "Comment1"}, {Content: "Comment2"}}
	mockCommentRepo.On("ListCommentsByPostID", postID, 10, 0).Return(expectedComments, nil).Once()
	comments, err := svc.ListCommentsByPostID(postID, 10, 0)
	require.NoError(t, err)
	assert.Equal(t, expectedComments, comments)
	mockPostRepo.AssertExpectations(t)
	mockCommentRepo.AssertExpectations(t)

	// Test post not found
	mockPostRepo.On("GetPostByID", postID).Return(nil, repository.ErrPostNotFound).Once()
	_, err = svc.ListCommentsByPostID(postID, 10, 0)
	assert.ErrorIs(t, err, repository.ErrPostNotFound)
	mockPostRepo.AssertExpectations(t)
}

func TestCommunityService_UpdateComment(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	commentID := uuid.New()
	// Test success
	existingComment := &repository.Comment{ID: commentID, AuthorUsername: "author_upd", Content: "Old Content"}
	mockCommentRepo.On("GetCommentByID", commentID).Return(existingComment, nil).Once()
	mockCommentRepo.On("UpdateComment", mock.AnythingOfType("*repository.Comment")).Return(&repository.Comment{}, nil).Once()
	comment, err := svc.UpdateComment(commentID, "author_upd", "New Content")
	require.NoError(t, err)
	assert.NotNil(t, comment)
	mockCommentRepo.AssertExpectations(t)

	// Test not author
	mockCommentRepo.On("GetCommentByID", commentID).Return(existingComment, nil).Once()
	_, err = svc.UpdateComment(commentID, "wrong_author", "New Content")
	assert.Error(t, err)
	mockCommentRepo.AssertExpectations(t)
}

func TestCommunityService_DeleteComment(t *testing.T) {
	mockPostRepo := new(mocks.MockPostRepository)
	mockCommentRepo := new(mocks.MockCommentRepository)
	mockUserRepo := new(mocks.MockUserRepository)
	svc := service.NewCommunityService(mockPostRepo, mockCommentRepo, mockUserRepo)

	commentID := uuid.New()
	// Test success
	existingComment := &repository.Comment{ID: commentID, AuthorUsername: "author_del"}
	mockCommentRepo.On("GetCommentByID", commentID).Return(existingComment, nil).Once()
	mockCommentRepo.On("DeleteComment", commentID).Return(nil).Once()
	err := svc.DeleteComment(commentID, "author_del")
	require.NoError(t, err)
	mockCommentRepo.AssertExpectations(t)

	// Test not author
	mockCommentRepo.On("GetCommentByID", commentID).Return(existingComment, nil).Once()
	err = svc.DeleteComment(commentID, "wrong_author")
	assert.Error(t, err)
	mockCommentRepo.AssertExpectations(t)
}
