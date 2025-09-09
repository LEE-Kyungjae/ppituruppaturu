// backend/internal/router/router.go

package router

import (
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"
	"exit/internal/auth"
	"exit/internal/container"
	"exit/internal/middleware"
)

// Setup configures the application's routes.
func Setup(r *gin.Engine, c *container.Container) {
	// CORS Middleware
	corsConfig := cors.DefaultConfig()
	if c.Config.AllowedOrigins == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = strings.Split(c.Config.AllowedOrigins, ",")
	}
	corsConfig.AllowHeaders = []string{"Authorization", "Content-Type"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	// Rate Limiting Middleware
	r.Use(middleware.NewRateLimiter(middleware.RateLimitOptions{
		Enabled: true,
		RPS:     c.Config.RateRPS,
		Burst:   c.Config.RateBurst,
	}))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.GET("/ws/chat", c.AuthMiddleware.BearerToken(), c.ChatHandler.HandleWebSocketConnection)

	// Health Check
	r.GET("/healthz", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// API Routes
	api := r.Group("/api/v1")
	{
		// Public routes
		api.POST("/users", c.UserHandler.Register)

		authAPI := api.Group("/auth")
		{
			authAPI.POST("/login", c.AuthHandler.Login)
			authAPI.POST("/refresh", c.AuthHandler.Refresh)
			authAPI.POST("/logout", c.AuthHandler.Logout)
			authAPI.POST("/forgot-password", c.AuthHandler.ForgotPassword)
			authAPI.POST("/reset-password", c.AuthHandler.ResetPassword)
			authAPI.GET("/kakao/callback", c.AuthHandler.KakaoLogin)
		}

		// Authenticated routes
		protected := api.Group("/")
		protected.Use(c.AuthMiddleware.BearerToken())
		{
			protected.GET("/me", c.UserHandler.Me)
			protected.GET("/me/profile", c.UserHandler.GetMyProfile)
			protected.GET("/users/:username/profile", c.UserHandler.GetUserProfile)
			protected.PUT("/me/profile", c.UserHandler.UpdateMyProfile)
			protected.PUT("/me/password", c.UserHandler.ChangeMyPassword)
			protected.POST("/me/deactivate", c.UserHandler.DeactivateMyAccount)
			protected.DELETE("/me", c.UserHandler.DeleteMyAccount)

			// Friend and Block routes
			protected.POST("/users/:username/friend-request", c.FriendHandler.SendFriendRequest)
			protected.PUT("/me/friend-requests/:request_id/accept", c.FriendHandler.AcceptFriendRequest)
			protected.PUT("/me/friend-requests/:request_id/decline", c.FriendHandler.DeclineFriendRequest)
			protected.DELETE("/me/friend-requests/:request_id", c.FriendHandler.CancelFriendRequest)
			protected.DELETE("/me/friends/:username", c.FriendHandler.RemoveFriend)
			protected.POST("/users/:username/block", c.FriendHandler.BlockUser)
			protected.DELETE("/users/:username/unblock", c.FriendHandler.UnblockUser)
			protected.GET("/me/friends", c.FriendHandler.ListFriends)
			protected.GET("/me/friend-requests/incoming", c.FriendHandler.ListIncomingFriendRequests)
			protected.GET("/me/friend-requests/outgoing", c.FriendHandler.ListOutgoingFriendRequests)
			protected.GET("/me/blocked-users", c.FriendHandler.ListBlockedUsers)

			// Community routes
			protected.POST("/posts", c.CommunityHandler.CreatePost)
			protected.GET("/posts", c.CommunityHandler.ListPosts)
			protected.GET("/posts/:post_id", c.CommunityHandler.GetPostByID)
			protected.PUT("/posts/:post_id", c.CommunityHandler.UpdatePost)
			protected.DELETE("/posts/:post_id", c.CommunityHandler.DeletePost)
			protected.POST("/posts/:post_id/comments", c.CommunityHandler.CreateComment)
			protected.GET("/posts/:post_id/comments", c.CommunityHandler.ListCommentsByPostID)
			protected.GET("/comments/:comment_id", c.CommunityHandler.GetCommentByID)
			protected.PUT("/comments/:comment_id", c.CommunityHandler.UpdateComment)
			protected.DELETE("/comments/:comment_id", c.CommunityHandler.DeleteComment)

			// Game routes
			protected.POST("/games", c.GameHandler.CreateGame)
			protected.GET("/games", c.GameHandler.ListGames)
			protected.GET("/games/:game_id", c.GameHandler.GetGameByID)
			protected.POST("/games/:game_id/sessions", c.GameHandler.CreateGameSession)
			protected.PUT("/game-sessions/:session_id/end", c.GameHandler.EndGameSession)
			protected.GET("/games/:game_id/scores", c.GameHandler.ListGameScoresByGameID)
			protected.GET("/users/:username/scores", c.GameHandler.ListGameScoresByPlayerUsername)

			// Payment routes
			protected.POST("/items", c.PaymentHandler.CreateItem)
			protected.GET("/items", c.PaymentHandler.ListItems)
			protected.GET("/items/:item_id", c.PaymentHandler.GetItemByID)
			protected.POST("/purchase/cash", c.PaymentHandler.PurchaseItemWithCash)
			protected.POST("/purchase/points", c.PaymentHandler.PurchaseItemWithPoints)
			protected.GET("/me/inventory", c.PaymentHandler.GetUserInventory)
			protected.POST("/me/inventory/:item_id/use", c.PaymentHandler.UseInventoryItem)
			protected.POST("/users/:username/points/add", c.PaymentHandler.AddPoints)
			protected.POST("/users/:username/points/spend", c.PaymentHandler.SpendPoints)
			protected.GET("/me/points", c.PaymentHandler.GetUserPoints)
			protected.GET("/me/point-transactions", c.PaymentHandler.ListPointTransactions)

			// Chat Room routes
			protected.POST("/chat-rooms", c.ChatRoomHandler.CreateChatRoom)
			protected.GET("/chat-rooms", c.ChatRoomHandler.ListChatRooms)
			protected.GET("/chat-rooms/:room_id", c.ChatRoomHandler.GetChatRoomByID)
			protected.PUT("/chat-rooms/:room_id", c.ChatRoomHandler.UpdateChatRoom)
			protected.DELETE("/chat-rooms/:room_id", c.ChatRoomHandler.DeleteChatRoom)
			protected.POST("/chat-rooms/:room_id/members", c.ChatRoomHandler.AddRoomMember)
			protected.DELETE("/chat-rooms/:room_id/members/:username", c.ChatRoomHandler.RemoveRoomMember)
			protected.GET("/chat-rooms/:room_id/members", c.ChatRoomHandler.ListRoomMembers)
			protected.GET("/me/chat-rooms", c.ChatRoomHandler.ListUserChatRooms)

			// Mini Games
			protected.GET("/minigames/types", c.MiniGameHandler.ListGameTypes)
			protected.POST("/minigames/start", c.MiniGameHandler.StartGame)
			protected.GET("/minigames/sessions/:sessionId", c.MiniGameHandler.GetGameStatus)
			protected.POST("/minigames/sessions/:sessionId/action", c.MiniGameHandler.SubmitGameAction)
			protected.POST("/minigames/sessions/:sessionId/end", c.MiniGameHandler.EndGame)

			admin := protected.Group("/admin")
			admin.Use(auth.RequireRole("admin"))
			{
				admin.GET("/stats", c.AdminHandler.Stats)
			}
		}
	}
}