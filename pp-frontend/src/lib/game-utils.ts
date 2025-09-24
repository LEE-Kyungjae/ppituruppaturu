import { GameType, GameScore, GameResult, GameStats } from './game-engine/types'

// 로컬 스토리지 키 상수
const STORAGE_KEYS = {
  USER_STATS: 'ppituru_user_stats',
  GAME_SCORES: 'ppituru_game_scores',
  GAME_SETTINGS: 'ppituru_game_settings',
  LEADERBOARD: 'ppituru_leaderboard'
} as const

// 사용자 통계 인터페이스
interface UserGameStats {
  userId?: string
  username: string
  totalGames: number
  totalWins: number
  totalScore: number
  bestScore: number
  currentStreak: number
  bestStreak: number
  level: number
  experience: number
  rank: string
  gameTypeStats: Record<GameType, {
    played: number
    won: number
    bestScore: number
    averageScore: number
    totalTime: number // seconds
  }>
  achievements: string[]
  lastPlayed: Date
}

// 리더보드 엔트리 인터페이스
interface LeaderboardEntry {
  username: string
  score: number
  gameType: GameType
  date: Date
  rank: number
}

// 게임 설정 인터페이스
interface GameSettings {
  volume: {
    master: number
    music: number
    sfx: number
  }
  graphics: {
    quality: 'low' | 'medium' | 'high'
    effects: boolean
    animations: boolean
  }
  gameplay: {
    showFPS: boolean
    showTimer: boolean
    pauseOnBlur: boolean
  }
  controls: Record<string, string>
}

// 기본 사용자 통계
const getDefaultUserStats = (): UserGameStats => ({
  username: '익명',
  totalGames: 0,
  totalWins: 0,
  totalScore: 0,
  bestScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  level: 1,
  experience: 0,
  rank: 'Bronze',
  gameTypeStats: {
    physics_battle_royale: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    team_strategy: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    puzzle_race: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    rhythm_action: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    physics_destruction: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    click_speed: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    memory_match: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 },
    number_guess: { played: 0, won: 0, bestScore: 0, averageScore: 0, totalTime: 0 }
  },
  achievements: [],
  lastPlayed: new Date()
})

// 기본 게임 설정
const getDefaultGameSettings = (): GameSettings => ({
  volume: {
    master: 0.7,
    music: 0.5,
    sfx: 0.8
  },
  graphics: {
    quality: 'medium',
    effects: true,
    animations: true
  },
  gameplay: {
    showFPS: false,
    showTimer: true,
    pauseOnBlur: true
  },
  controls: {
    moveUp: 'KeyW',
    moveDown: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    jump: 'Space',
    action: 'KeyE',
    pause: 'Escape'
  }
})

// 로컬 스토리지 유틸리티
class GameStorageManager {
  static getUserStats(): UserGameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS)
      if (stored) {
        const parsed = JSON.parse(stored)
        // 날짜 필드 복원
        parsed.lastPlayed = new Date(parsed.lastPlayed)
        return { ...getDefaultUserStats(), ...parsed }
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
    return getDefaultUserStats()
  }

  static saveUserStats(stats: UserGameStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats))
    } catch (error) {
      console.error('Failed to save user stats:', error)
    }
  }

  static getGameSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...getDefaultGameSettings(), ...parsed }
      }
    } catch (error) {
      console.error('Failed to load game settings:', error)
    }
    return getDefaultGameSettings()
  }

  static saveGameSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save game settings:', error)
    }
  }

  static getLeaderboard(gameType?: GameType, limit: number = 10): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD)
      if (stored) {
        let leaderboard: LeaderboardEntry[] = JSON.parse(stored)

        // 날짜 필드 복원
        leaderboard = leaderboard.map(entry => ({
          ...entry,
          date: new Date(entry.date)
        }))

        // 게임 타입별 필터링
        if (gameType) {
          leaderboard = leaderboard.filter(entry => entry.gameType === gameType)
        }

        // 점수순 정렬 및 순위 할당
        leaderboard.sort((a, b) => b.score - a.score)
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1
        })

        return leaderboard.slice(0, limit)
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
    return []
  }

  static saveScore(entry: Omit<LeaderboardEntry, 'rank'>): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD)
      let leaderboard: LeaderboardEntry[] = stored ? JSON.parse(stored) : []

      // 새 점수 추가
      leaderboard.push({ ...entry, rank: 0 })

      // 최대 1000개 항목 유지
      leaderboard = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 1000)

      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard))
    } catch (error) {
      console.error('Failed to save score:', error)
    }
  }
}

// 게임 통계 관리자
class GameStatsManager {
  static updateGameResult(gameType: GameType, score: number, won: boolean, duration: number): void {
    const stats = GameStorageManager.getUserStats()

    // 전체 통계 업데이트
    stats.totalGames += 1
    stats.totalScore += score
    stats.bestScore = Math.max(stats.bestScore, score)
    stats.lastPlayed = new Date()

    if (won) {
      stats.totalWins += 1
      stats.currentStreak += 1
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
    } else {
      stats.currentStreak = 0
    }

    // 게임 타입별 통계 업데이트
    if (stats.gameTypeStats[gameType]) {
      const typeStats = stats.gameTypeStats[gameType]
      typeStats.played += 1
      typeStats.totalTime += duration
      typeStats.bestScore = Math.max(typeStats.bestScore, score)

      if (won) {
        typeStats.won += 1
      }

      // 평균 점수 계산
      typeStats.averageScore = Math.round((typeStats.averageScore * (typeStats.played - 1) + score) / typeStats.played)
    }

    // 레벨 및 경험치 업데이트
    const experienceGained = Math.floor(score / 100) + (won ? 50 : 10)
    stats.experience += experienceGained

    // 레벨업 체크
    const requiredExp = stats.level * 1000
    if (stats.experience >= requiredExp) {
      stats.level += 1
      stats.experience -= requiredExp
    }

    // 랭크 업데이트
    stats.rank = calculateRank(stats.level, stats.totalWins, stats.bestScore)

    // 업적 체크
    checkAchievements(stats)

    // 저장
    GameStorageManager.saveUserStats(stats)

    // 리더보드에 점수 저장
    GameStorageManager.saveScore({
      username: stats.username,
      score,
      gameType,
      date: new Date()
    })
  }

  static getWinRate(): number {
    const stats = GameStorageManager.getUserStats()
    return stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0
  }

  static getRankProgress(): { current: number; required: number; percentage: number } {
    const stats = GameStorageManager.getUserStats()
    const required = stats.level * 1000
    return {
      current: stats.experience,
      required,
      percentage: Math.round((stats.experience / required) * 100)
    }
  }
}

// 랭크 계산 함수
function calculateRank(level: number, wins: number, bestScore: number): string {
  const totalPoints = level * 10 + wins * 5 + Math.floor(bestScore / 10000)

  if (totalPoints >= 1000) return 'Champion'
  if (totalPoints >= 800) return 'Master'
  if (totalPoints >= 600) return 'Diamond'
  if (totalPoints >= 400) return 'Platinum'
  if (totalPoints >= 200) return 'Gold'
  if (totalPoints >= 100) return 'Silver'
  return 'Bronze'
}

// 업적 체크 함수
function checkAchievements(stats: UserGameStats): void {
  const newAchievements: string[] = []

  // 첫 게임 업적
  if (stats.totalGames === 1 && !stats.achievements.includes('first_game')) {
    newAchievements.push('first_game')
  }

  // 첫 승리 업적
  if (stats.totalWins === 1 && !stats.achievements.includes('first_win')) {
    newAchievements.push('first_win')
  }

  // 연승 업적
  if (stats.currentStreak >= 5 && !stats.achievements.includes('winning_streak')) {
    newAchievements.push('winning_streak')
  }

  // 레벨 업적
  if (stats.level >= 10 && !stats.achievements.includes('level_10')) {
    newAchievements.push('level_10')
  }

  // 점수 업적
  if (stats.bestScore >= 100000 && !stats.achievements.includes('high_score')) {
    newAchievements.push('high_score')
  }

  // 새 업적 추가
  stats.achievements.push(...newAchievements)

  // 업적 알림 (실제 구현에서는 toast 등으로 표시)
  if (newAchievements.length > 0) {
    console.log('New achievements unlocked:', newAchievements)
  }
}

// 게임 유틸리티 함수들
export const GameUtils = {
  // 점수 포맷팅
  formatScore: (score: number): string => {
    return score.toLocaleString()
  },

  // 시간 포맷팅 (초를 MM:SS 형식으로)
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  // 랭크 색상 가져오기
  getRankColor: (rank: string): string => {
    const colors: Record<string, string> = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Platinum': '#E5E4E2',
      'Diamond': '#B9F2FF',
      'Master': '#9966CC',
      'Champion': '#FF1493'
    }
    return colors[rank] || colors.Bronze
  },

  // 난이도별 점수 배율
  getDifficultyMultiplier: (difficulty: string): number => {
    const multipliers: Record<string, number> = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.3,
      'expert': 1.6
    }
    return multipliers[difficulty] || 1.0
  },

  // 게임 타입별 아이콘
  getGameTypeIcon: (gameType: GameType): string => {
    const icons: Record<GameType, string> = {
      'physics_battle_royale': '⚔️',
      'team_strategy': '🏰',
      'puzzle_race': '🧩',
      'rhythm_action': '🎵',
      'physics_destruction': '💥',
      'click_speed': '🖱️',
      'memory_match': '🃏',
      'number_guess': '🔢'
    }
    return icons[gameType] || '🎮'
  }
}

export {
  GameStorageManager,
  GameStatsManager,
  type UserGameStats,
  type LeaderboardEntry,
  type GameSettings
}