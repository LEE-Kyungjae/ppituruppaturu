// backend/internal/mocks/mocks.go

package mocks

import (
	"database/sql"
	"github.com/pitturu-ppaturu/backend/internal/chat"
	"github.com/pitturu-ppaturu/backend/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// MockChatRoomRepository is a mock implementation of repository.ChatRoomRepository
type MockChatRoomRepository struct {
	mock.Mock
}

func (m *MockChatRoomRepository) CreateChatRoom(name, description, roomType string) (*repository.ChatRoom, error) {
	args := m.Called(name, description, roomType)
	return args.Get(0).(*repository.ChatRoom), args.Error(1)
}

func (m *MockChatRoomRepository) GetChatRoomByID(id uuid.UUID) (*repository.ChatRoom, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.ChatRoom), args.Error(1)
}

func (m *MockChatRoomRepository) GetChatRoomByName(name string) (*repository.ChatRoom, error) {
	args := m.Called(name)
	return args.Get(0).(*repository.ChatRoom), args.Error(1)
}

func (m *MockChatRoomRepository) ListChatRooms(limit, offset int) ([]*repository.ChatRoom, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]*repository.ChatRoom), args.Error(1)
}

func (m *MockChatRoomRepository) UpdateChatRoom(room *repository.ChatRoom) (*repository.ChatRoom, error) {
	args := m.Called(room)
	return args.Get(0).(*repository.ChatRoom), args.Error(1)
}

func (m *MockChatRoomRepository) DeleteChatRoom(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockChatRoomRepository) AddRoomMember(roomID uuid.UUID, memberUsername string) (*repository.RoomMember, error) {
	args := m.Called(roomID, memberUsername)
	return args.Get(0).(*repository.RoomMember), args.Error(1)
}

func (m *MockChatRoomRepository) RemoveRoomMember(roomID uuid.UUID, memberUsername string) error {
	args := m.Called(roomID, memberUsername)
	return args.Error(0)
}

func (m *MockChatRoomRepository) IsRoomMember(roomID uuid.UUID, memberUsername string) (bool, error) {
	args := m.Called(roomID, memberUsername)
	return args.Bool(0), args.Error(1)
}

func (m *MockChatRoomRepository) ListRoomMembers(roomID uuid.UUID) ([]*repository.User, error) {
	args := m.Called(roomID)
	return args.Get(0).([]*repository.User), args.Error(1)
}

func (m *MockChatRoomRepository) ListUserChatRooms(username string) ([]*repository.ChatRoom, error) {
	args := m.Called(username)
	return args.Get(0).([]*repository.ChatRoom), args.Error(1)
}

// MockUserRepository is a mock implementation of repository.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Find(username string) (*repository.User, error) {
	args := m.Called(username)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserRepository) ValidatePassword(user *repository.User, password string) error {
	args := m.Called(user, password)
	return args.Error(0)
}

func (m *MockUserRepository) Create(username, password, role string, bcryptCost int, kakaoID sql.NullString) (*repository.User, error) {
	args := m.Called(username, password, role, bcryptCost, kakaoID)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserRepository) Delete(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserRepository) Update(user *repository.User) (*repository.User, error) {
	args := m.Called(user)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserRepository) List() ([]*repository.User, error) {
	args := m.Called()
	return args.Get(0).([]*repository.User), args.Error(1)
}

func (m *MockUserRepository) CountTotalUsers() (int, error) {
	args := m.Called()
	return args.Int(0), args.Error(1)
}

func (m *MockUserRepository) CountActiveUsers(since time.Time) (int, error) {
	args := m.Called(since)
	return args.Int(0), args.Error(1)
}

func (m *MockUserRepository) CountNewUsers(since time.Time) (int, error) {
	args := m.Called(since)
	return args.Int(0), args.Error(1)
}

func (m *MockUserRepository) UpdatePasswordHash(username, newPasswordHash string) error {
	args := m.Called(username, newPasswordHash)
	return args.Error(0)
}

func (m *MockUserRepository) DeactivateUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserRepository) DeleteUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserRepository) BanUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

// MockMessageRepository is a mock implementation of repository.MessageRepository
type MockMessageRepository struct {
	mock.Mock
}

func (m *MockMessageRepository) CreateMessage(sender string, receiver sql.NullString, roomID sql.Null[uuid.UUID], content string) (*repository.Message, error) {
	args := m.Called(sender, receiver, roomID, content)
	return args.Get(0).(*repository.Message), args.Error(1)
}

func (m *MockMessageRepository) GetMessagesBetweenUsers(user1, user2 string, limit, offset int) ([]*repository.Message, error) {
	args := m.Called(user1, user2, limit, offset)
	return args.Get(0).([]*repository.Message), args.Error(1)
}

func (m *MockMessageRepository) GetRoomMessages(roomID uuid.UUID, limit, offset int) ([]*repository.Message, error) {
	args := m.Called(roomID, limit, offset)
	return args.Get(0).([]*repository.Message), args.Error(1)
}

func (m *MockMessageRepository) MarkMessagesAsRead(sender sql.NullString, receiver sql.NullString, roomID sql.Null[uuid.UUID]) error {
	args := m.Called(sender, receiver, roomID)
	return args.Error(0)
}

// MockChatHub is a mock implementation of chat.Hub (for testing purposes)
type MockChatHub struct {
	mock.Mock
}

func (m *MockChatHub) Run() {
	m.Called()
}

func (m *MockChatHub) GetClientOnlineStatus(username string) bool {
	args := m.Called(username)
	return args.Bool(0)
}

func (m *MockChatHub) SendPrivateMessage(msg *chat.Message) {
	m.Called(msg)
}

func (m *MockChatHub) SendRoomMessage(roomID uuid.UUID, message *chat.Message) {
	m.Called(roomID, message)
}

func (m *MockChatHub) Register() chan<- *chat.Client {
	args := m.Called()
	return args.Get(0).(chan<- *chat.Client)
}

func (m *MockChatHub) Unregister() chan<- *chat.Client {
	args := m.Called()
	return args.Get(0).(chan<- *chat.Client)
}

var _ chat.HubInterface = (*MockChatHub)(nil)

// MockUserService is a mock implementation of service.UserService
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) Register(username, password string, bcryptCost int) (*repository.User, error) {
	args := m.Called(username, password, bcryptCost)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserService) Delete(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserService) UpdateRole(username string, role string) (*repository.User, error) {
	args := m.Called(username, role)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserService) UpdateProfile(user *repository.User) (*repository.User, error) {
	args := m.Called(user)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserService) ChangePassword(username, oldPassword, newPassword string, bcryptCost int) error {
	args := m.Called(username, oldPassword, newPassword, bcryptCost)
	return args.Error(0)
}

func (m *MockUserService) List() ([]*repository.User, error) {
	args := m.Called()
	return args.Get(0).([]*repository.User), args.Error(1)
}

func (m *MockUserService) DeactivateUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserService) DeleteUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserService) Find(username string) (*repository.User, error) {
	args := m.Called(username)
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserService) ValidatePassword(user *repository.User, password string) error {
	args := m.Called(user, password)
	return args.Error(0)
}

func (m *MockUserService) BanUser(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

// MockAuthService is a mock implementation of service.AuthService
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Login(username, password string) (string, string, error) {
	args := m.Called(username, password)
	return args.String(0), args.String(1), args.Error(2)
}

func (m *MockAuthService) Refresh(refreshToken string) (string, error) {
	args := m.Called(refreshToken)
	return args.String(0), args.Error(1)
}

func (m *MockAuthService) Logout(refreshToken string) error {
	args := m.Called(refreshToken)
	return args.Error(0)
}

func (m *MockAuthService) ForgotPassword(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockAuthService) ResetPassword(token, newPassword string) error {
	args := m.Called(token, newPassword)
	return args.Error(0)
}

// MockKakaoAuthService is a mock implementation of service.KakaoAuthService
type MockKakaoAuthService struct {
	mock.Mock
}

func (m *MockKakaoAuthService) LoginOrRegister(authCode string) (*repository.User, string, string, error) {
	args := m.Called(authCode)
	return args.Get(0).(*repository.User), args.String(1), args.String(2), args.Error(3)
}

func (m *MockKakaoAuthService) SocialLoginOrRegister(kakaoID, nickname, email, profileImage, accessToken string) (*repository.User, string, string, error) {
	args := m.Called(kakaoID, nickname, email, profileImage, accessToken)
	return args.Get(0).(*repository.User), args.String(1), args.String(2), args.Error(3)
}

// MockPostRepository is a mock implementation of repository.PostRepository
type MockPostRepository struct {
	mock.Mock
}

func (m *MockPostRepository) CreatePost(authorUsername, title, content string) (*repository.Post, error) {
	args := m.Called(authorUsername, title, content)
	var post *repository.Post
	if v := args.Get(0); v != nil {
		post = v.(*repository.Post)
	}
	return post, args.Error(1)
}

func (m *MockPostRepository) GetPostByID(id uuid.UUID) (*repository.Post, error) {
	args := m.Called(id)
	var post *repository.Post
	if v := args.Get(0); v != nil {
		post = v.(*repository.Post)
	}
	return post, args.Error(1)
}

func (m *MockPostRepository) ListPosts(limit, offset int) ([]*repository.Post, error) {
	args := m.Called(limit, offset)
	var posts []*repository.Post
	if v := args.Get(0); v != nil {
		posts = v.([]*repository.Post)
	}
	return posts, args.Error(1)
}

func (m *MockPostRepository) UpdatePost(post *repository.Post) (*repository.Post, error) {
	args := m.Called(post)
	var out *repository.Post
	if v := args.Get(0); v != nil {
		out = v.(*repository.Post)
	}
	return out, args.Error(1)
}

func (m *MockPostRepository) DeletePost(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockCommentRepository is a mock implementation of repository.CommentRepository
type MockCommentRepository struct {
	mock.Mock
}

func (m *MockCommentRepository) CreateComment(postID uuid.UUID, authorUsername, content string) (*repository.Comment, error) {
	args := m.Called(postID, authorUsername, content)
	var cmt *repository.Comment
	if v := args.Get(0); v != nil {
		cmt = v.(*repository.Comment)
	}
	return cmt, args.Error(1)
}

func (m *MockCommentRepository) GetCommentByID(id uuid.UUID) (*repository.Comment, error) {
	args := m.Called(id)
	var cmt *repository.Comment
	if v := args.Get(0); v != nil {
		cmt = v.(*repository.Comment)
	}
	return cmt, args.Error(1)
}

func (m *MockCommentRepository) ListCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*repository.Comment, error) {
	args := m.Called(postID, limit, offset)
	var list []*repository.Comment
	if v := args.Get(0); v != nil {
		list = v.([]*repository.Comment)
	}
	return list, args.Error(1)
}

func (m *MockCommentRepository) UpdateComment(comment *repository.Comment) (*repository.Comment, error) {
	args := m.Called(comment)
	var out *repository.Comment
	if v := args.Get(0); v != nil {
		out = v.(*repository.Comment)
	}
	return out, args.Error(1)
}

func (m *MockCommentRepository) DeleteComment(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockGameRepository is a mock implementation of repository.GameRepository
type MockGameRepository struct {
	mock.Mock
}

func (m *MockGameRepository) CreateGame(name, description string) (*repository.Game, error) {
	args := m.Called(name, description)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameRepository) GetGameByID(id uuid.UUID) (*repository.Game, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameRepository) GetGameByName(name string) (*repository.Game, error) {
	args := m.Called(name)
	return args.Get(0).(*repository.Game), args.Error(1)
}

func (m *MockGameRepository) ListGames() ([]*repository.Game, error) {
	args := m.Called()
	return args.Get(0).([]*repository.Game), args.Error(1)
}

func (m *MockGameRepository) ListActiveGames() ([]*repository.Game, error) {
	args := m.Called()
	if v := args.Get(0); v != nil {
		return v.([]*repository.Game), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockGameRepository) ListAllGamesForAdmin() ([]*repository.Game, error) {
	args := m.Called()
	if v := args.Get(0); v != nil {
		return v.([]*repository.Game), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockGameRepository) UpdateGameVisibility(id uuid.UUID, isActive bool) error {
	args := m.Called(id, isActive)
	return args.Error(0)
}

func (m *MockGameRepository) UpdateGameDisplayOrder(id uuid.UUID, displayOrder int) error {
	args := m.Called(id, displayOrder)
	return args.Error(0)
}

func (m *MockGameRepository) CreateGameSession(gameID uuid.UUID, playerUsername string) (*repository.GameSession, error) {
	args := m.Called(gameID, playerUsername)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameRepository) GetGameSessionByID(id uuid.UUID) (*repository.GameSession, error) {
	args := m.Called(id)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameRepository) UpdateGameSession(session *repository.GameSession) (*repository.GameSession, error) {
	args := m.Called(session)
	return args.Get(0).(*repository.GameSession), args.Error(1)
}

func (m *MockGameRepository) CreateGameScore(sessionID uuid.UUID, playerUsername string, score int) (*repository.GameScore, error) {
	args := m.Called(sessionID, playerUsername, score)
	return args.Get(0).(*repository.GameScore), args.Error(1)
}

func (m *MockGameRepository) GetGameScoreBySessionAndPlayer(sessionID uuid.UUID, playerUsername string) (*repository.GameScore, error) {
	args := m.Called(sessionID, playerUsername)
	return args.Get(0).(*repository.GameScore), args.Error(1)
}

func (m *MockGameRepository) UpdateGameScore(score *repository.GameScore) (*repository.GameScore, error) {
	args := m.Called(score)
	return args.Get(0).(*repository.GameScore), args.Error(1)
}

func (m *MockGameRepository) ListGameScoresByGameID(gameID uuid.UUID, limit, offset int) ([]*repository.GameScore, error) {
	args := m.Called(gameID, limit, offset)
	return args.Get(0).([]*repository.GameScore), args.Error(1)
}

func (m *MockGameRepository) ListGameScoresByPlayerUsername(playerUsername string, limit, offset int) ([]*repository.GameScore, error) {
	args := m.Called(playerUsername, limit, offset)
	return args.Get(0).([]*repository.GameScore), args.Error(1)
}

// MockTransactionRepository is a mock for TransactionRepository
type MockTransactionRepository struct {
	mock.Mock
}

func (m *MockTransactionRepository) CreateTransaction(tx *repository.Transaction) (*repository.Transaction, error) {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) GetTransactionByID(id uuid.UUID) (*repository.Transaction, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) UpdateTransactionStatus(id uuid.UUID, status string, paymentGatewayID sql.NullString) error {
	args := m.Called(id, status, paymentGatewayID)
	return args.Error(0)
}

func (m *MockTransactionRepository) ListTransactionsByUsername(username string, limit, offset int) ([]*repository.Transaction, error) {
	args := m.Called(username, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) CreatePointTransaction(ptx *repository.PointTransaction) (*repository.PointTransaction, error) {
	args := m.Called(ptx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PointTransaction), args.Error(1)
}

func (m *MockTransactionRepository) ListPointTransactionsByUsername(username string, limit, offset int) ([]*repository.PointTransaction, error) {
	args := m.Called(username, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.PointTransaction), args.Error(1)
}

func (m *MockTransactionRepository) GetTotalRevenue() (float64, error) {
	args := m.Called()
	return args.Get(0).(float64), args.Error(1)
}

func (m *MockTransactionRepository) GetRevenueSince(since time.Time) (float64, error) {
	args := m.Called(since)
	return args.Get(0).(float64), args.Error(1)
}

func (m *MockTransactionRepository) CountTotalPayments() (int, error) {
	args := m.Called()
	return args.Int(0), args.Error(1)
}

func (m *MockTransactionRepository) CountPaymentsByStatus(status string) (int, error) {
	args := m.Called(status)
	return args.Int(0), args.Error(1)
}
