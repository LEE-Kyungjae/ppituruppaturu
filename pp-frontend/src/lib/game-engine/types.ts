import Phaser from 'phaser'

export type GameType =
  | 'physics_battle_royale'
  | 'team_strategy'
  | 'puzzle_race'
  | 'rhythm_action'
  | 'physics_destruction'
  | 'click_speed'
  | 'memory_match'
  | 'number_guess'

export interface GameConfig {
  width: number
  height: number
  autoStart: boolean
  maxPlayers: number
  gameMode: 'singleplayer' | 'multiplayer' | 'coop'
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number // seconds
  enablePhysics: boolean
  enableAudio: boolean
  enableParticles: boolean
  customSettings?: Record<string, any>
}

export interface GamePlayer {
  id: string
  username: string
  avatar?: string
  score: number
  isReady: boolean
  isConnected: boolean
  position?: Phaser.Math.Vector2
  color?: string
}

export interface GameRoom {
  id: string
  name: string
  gameType: GameType
  maxPlayers: number
  currentPlayers: GamePlayer[]
  isPrivate: boolean
  password?: string
  host: GamePlayer
  status: 'waiting' | 'starting' | 'playing' | 'ended'
  config: GameConfig
  createdAt: Date
}

export interface GameEvent {
  type: string
  playerId: string
  data: any
  timestamp: number
}

export interface GameScore {
  playerId: string
  score: number
  rank: number
  achievements: string[]
  stats: Record<string, number>
}

export interface GameResult {
  gameId: string
  roomId: string
  gameType: GameType
  players: GameScore[]
  duration: number
  winner?: GamePlayer
  stats: Record<string, any>
  endedAt: Date
}

// Phaser Game Object 타입 확장
export interface ExtendedGameObject extends Phaser.GameObjects.GameObject {
  playerId?: string
  networkSync?: boolean
  lastUpdate?: number
}

// 물리 객체 인터페이스
export interface PhysicsBody {
  x: number
  y: number
  velocityX: number
  velocityY: number
  angle: number
  angularVelocity: number
}

// 네트워크 메시지 타입
export interface NetworkMessage {
  type: 'player_action' | 'game_update' | 'room_update' | 'system_message'
  roomId: string
  playerId?: string
  data: any
  timestamp: number
}

// 게임 상태 인터페이스
export interface GameState {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended'
  currentPlayers: GamePlayer[]
  gameObjects: Record<string, any>
  score: Record<string, number>
  timeRemaining?: number
  currentRound?: number
  maxRounds?: number
}

// 오디오 설정
export interface AudioConfig {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  enableSpatial: boolean
  enableDynamicAudio: boolean
}

// 입력 매핑
export interface InputMapping {
  move: {
    up: string[]
    down: string[]
    left: string[]
    right: string[]
  }
  action: {
    primary: string[]
    secondary: string[]
    special: string[]
    pause: string[]
  }
  ui: {
    menu: string[]
    chat: string[]
    scoreboard: string[]
  }
}

// 게임 통계
export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  bestScore: number
  totalPlayTime: number // seconds
  achievements: string[]
  ranking: {
    current: number
    peak: number
    points: number
  }
  gameTypeStats: Record<GameType, {
    played: number
    won: number
    bestScore: number
    averageScore: number
  }>
}

// 성취 시스템
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: {
    type: string
    target: number
    gameType?: GameType
  }
  reward: {
    points: number
    title?: string
    avatar?: string
  }
  unlockedAt?: Date
}