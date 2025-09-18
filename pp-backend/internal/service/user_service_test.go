// backend/internal/service/user_service_test.go

package service_test

import (
	"database/sql"
	"testing"

	"github.com/pitturu-ppaturu/backend/internal/mocks"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"github.com/pitturu-ppaturu/backend/internal/service"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestUserService_Register(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	expectedUser := &repository.User{Username: "newuser", Role: "user"}
	mockRepo.On("Create", "newuser", "password123", "user", 12, sql.NullString{}).Return(expectedUser, nil).Once()
	user, err := svc.Register("newuser", "password123", 12)
	require.NoError(t, err)
	assert.Equal(t, expectedUser, user)
	mockRepo.AssertExpectations(t)

	// Test user already exists
	mockRepo.On("Create", "existinguser", "password123", "user", 12, sql.NullString{}).Return(nil, repository.ErrUserAlreadyExists).Once()
	_, err = svc.Register("existinguser", "password123", 12)
	assert.ErrorIs(t, err, repository.ErrUserAlreadyExists)
	mockRepo.AssertExpectations(t)
}

func TestUserService_Delete(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	mockRepo.On("Delete", "user_to_delete").Return(nil).Once()
	err := svc.Delete("user_to_delete")
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)

	// Test user not found
	mockRepo.On("Delete", "nonexistent").Return(repository.ErrUserNotFound).Once()
	err = svc.Delete("nonexistent")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockRepo.AssertExpectations(t)
}

func TestUserService_UpdateRole(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	existingUser := &repository.User{Username: "user_to_update", Role: "user"}
	mockRepo.On("Find", "user_to_update").Return(existingUser, nil).Once()
	updatedUser := &repository.User{Username: "user_to_update", Role: "admin"}
	mockRepo.On("Update", updatedUser).Return(updatedUser, nil).Once()
	user, err := svc.UpdateRole("user_to_update", "admin")
	require.NoError(t, err)
	assert.Equal(t, "admin", user.Role)
	mockRepo.AssertExpectations(t)

	// Test user not found
	mockRepo.On("Find", "nonexistent").Return(nil, repository.ErrUserNotFound).Once()
	_, err = svc.UpdateRole("nonexistent", "admin")
	assert.ErrorIs(t, err, repository.ErrUserNotFound)
	mockRepo.AssertExpectations(t)
}

func TestUserService_UpdateProfile(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	nickname := "NewNick"
	userToUpdate := &repository.User{Username: "profile_user", Nickname: &nickname}
	updatedUser := &repository.User{Username: "profile_user", Nickname: &nickname}
	mockRepo.On("Update", userToUpdate).Return(updatedUser, nil).Once()
	user, err := svc.UpdateProfile(userToUpdate)
	require.NoError(t, err)
	assert.Equal(t, updatedUser, user)
	mockRepo.AssertExpectations(t)
}

func TestUserService_ChangePassword(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	existingUser := &repository.User{Username: "pass_user", PasswordHash: "hashed_old_pass"}
	mockRepo.On("Find", "pass_user").Return(existingUser, nil).Once()
	mockRepo.On("ValidatePassword", existingUser, "old_pass").Return(nil).Once()
	mockRepo.On("UpdatePasswordHash", "pass_user", mock.AnythingOfType("string")).Return(nil).Once()
	err := svc.ChangePassword("pass_user", "old_pass", "new_pass", 12)
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)

	// Test invalid old password
	mockRepo.On("Find", "pass_user_invalid").Return(existingUser, nil).Once()
	mockRepo.On("ValidatePassword", existingUser, "wrong_pass").Return(repository.ErrInvalidCredentials).Once()
	err = svc.ChangePassword("pass_user_invalid", "wrong_pass", "new_pass", 12)
	assert.ErrorIs(t, err, repository.ErrInvalidCredentials)
	mockRepo.AssertExpectations(t)
}

func TestUserService_List(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	expectedUsers := []*repository.User{{Username: "user1"}, {Username: "user2"}}
	mockRepo.On("List").Return(expectedUsers, nil).Once()
	users, err := svc.List()
	require.NoError(t, err)
	assert.Equal(t, expectedUsers, users)
	mockRepo.AssertExpectations(t)
}

func TestUserService_DeactivateUser(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	mockRepo.On("DeactivateUser", "user_to_deactivate").Return(nil).Once()
	err := svc.DeactivateUser("user_to_deactivate")
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestUserService_DeleteUser(t *testing.T) {
	mockRepo := new(mocks.MockUserRepository)
	svc := service.NewUserService(mockRepo)

	// Test success
	mockRepo.On("DeleteUser", "user_to_delete_hard").Return(nil).Once()
	err := svc.DeleteUser("user_to_delete_hard")
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}
