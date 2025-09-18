// ================================
// 기본 타입 정의
// ================================

export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  avatar?: string
  bio?: string
  level: number
  experience: number
  points: number
  premiumUntil?: Date
  createdAt: Date
  updatedAt: Date
  lastActiveAt: Date
  isOnline: boolean
  status: 'active' | 'inactive' | 'banned'
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  notifications: {
    email: boolean
    push: boolean
    chat: boolean
    games: boolean
    friends: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowFriendRequests: boolean
    showProfile: 'public' | 'friends' | 'private'
  }
}

// ================================
// 게임 관련 타입
// ================================

export interface Game {
  id: string
  name: string
  description: string
  thumbnail: string
  category: GameCategory
  difficulty: 'easy' | 'medium' | 'hard'
  maxPlayers: number
  averagePlayTime: number
  rating: number
  playCount: number
  isActive: boolean
  isPremium: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type GameCategory = 
  | 'action'
  | 'puzzle' 
  | 'strategy'
  | 'casual'
  | 'multiplayer'
  | 'arcade'

export interface GameSession {
  id: string
  gameId: string
  playerId: string
  score: number
  duration: number
  completedAt?: Date
  data?: Record<string, any>
  isCompleted: boolean
  rank?: number
}

export interface Leaderboard {
  gameId: string
  entries: LeaderboardEntry[]
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
  updatedAt: Date
}

export interface LeaderboardEntry {
  rank: number
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
  score: number
  playCount: number
  lastPlayedAt: Date
}

// ================================
// 채팅 관련 타입
// ================================

export interface ChatRoom {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'game'
  maxMembers: number
  memberCount: number
  createdBy: string
  createdAt: Date
  lastActivity: Date
  isActive: boolean
  settings: ChatRoomSettings
}

export interface ChatRoomSettings {
  allowGuests: boolean
  requireApproval: boolean
  slowMode: number // seconds
  allowFiles: boolean
  allowImages: boolean
  moderationLevel: 'none' | 'basic' | 'strict'
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
  content: string
  type: 'text' | 'image' | 'file' | 'system' | 'game'
  metadata?: Record<string, any>
  replyTo?: string
  editedAt?: Date
  deletedAt?: Date
  createdAt: Date
  reactions: ChatReaction[]
}

export interface ChatReaction {
  emoji: string
  count: number
  users: string[]
}

// ================================
// 결제 관련 타입
// ================================

export interface PaymentSession {
  id: string
  userId: string
  amount: number
  currency: 'KRW' | 'USD'
  type: 'points' | 'premium' | 'item'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentMethod?: string
  paymentKey?: string
  orderId: string
  orderName: string
  metadata?: Record<string, any>
  createdAt: Date
  completedAt?: Date
  failureReason?: string
}

export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: 'earn' | 'spend' | 'refund' | 'bonus'
  source: 'game' | 'purchase' | 'daily' | 'achievement' | 'admin'
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

// ================================
// 소셜 관련 타입
// ================================

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: Date
  acceptedAt?: Date
}

export interface Friend {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'isOnline' | 'lastActiveAt'>
  friendship: Friendship
  mutualFriends: number
}

// ================================
// 알림 관련 타입
// ================================

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
}

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'achievement'
  | 'payment'
  | 'system'
  | 'chat_mention'

// ================================
// API 관련 타입
// ================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: string
  field?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SearchFilters {
  query?: string
  category?: string
  tags?: string[]
  sortBy?: 'name' | 'popularity' | 'rating' | 'newest'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// ================================
// 이벤트 타입
// ================================

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface GameEvent {
  type: 'game_start' | 'game_end' | 'score_update' | 'player_join' | 'player_leave'
  gameId: string
  sessionId?: string
  playerId: string
  data: any
  timestamp: number
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'user_join' | 'user_leave' | 'room_update'
  roomId: string
  userId: string
  data: any
  timestamp: number
}

// ================================
// 컴포넌트 Props 타입
// ================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// ================================
// 유틸리티 타입
// ================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}