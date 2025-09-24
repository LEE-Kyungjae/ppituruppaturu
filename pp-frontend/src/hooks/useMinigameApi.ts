// frontend/src/hooks/useMinigameApi.ts
import { useState, useCallback, useRef } from 'react'
import { miniGameApi, handleApiError, GameSession, GameState, GameResult, GameAction, MiniGameLeaderboardEntry } from '@/services/api'

// 게임 상태 타입
export type GameStatus = 'idle' | 'starting' | 'playing' | 'ending' | 'completed' | 'error'

// 게임 통계 인터페이스
export interface GameStats {
  score: number
  timeLeft: number
  moves?: number
  streak?: number
  accuracy?: number
}


// 훅 반환 타입
export interface UseMinigameApiReturn {
  // 상태
  gameSession: GameSession | null
  gameState: GameState | null
  gameResult: GameResult | null
  status: GameStatus
  error: string | null
  isLoading: boolean

  // 게임 제어
  startGame: (gameType: string) => Promise<boolean>
  submitAction: (action: GameAction) => Promise<boolean>
  endGame: () => Promise<GameResult | null>
  resetGame: () => void

  // 헬퍼 메소드
  getTimeLeft: () => number
  getCurrentScore: () => number
  isGameActive: () => boolean
}

export const useMinigameApi = (): UseMinigameApiReturn => {
  // 상태 관리
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 타이머 참조
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const gameEndTimeout = useRef<NodeJS.Timeout | null>(null)

  // 에러 처리 헬퍼
  const handleError = useCallback((err: any) => {
    const apiError = handleApiError(err)
    setError(apiError.message)
    setStatus('error')
    console.error('Game API Error:', apiError)
    return false
  }, [])

  // 게임 시작
  const startGame = useCallback(async (gameType: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setStatus('starting')
      setError(null)

      const session = await miniGameApi.startGameSession(gameType)
      setGameSession(session)

      // 초기 게임 상태 설정
      const initialState: GameState = {
        sessionId: session.sessionId,
        gameType: session.gameType,
        currentScore: 0,
        status: 'in_progress',
        gameData: session.gameData,
        timeLeft: session.duration
      }
      setGameState(initialState)
      setStatus('playing')

      // 게임 시간 만료 타이머 설정
      if (gameEndTimeout.current) {
        clearTimeout(gameEndTimeout.current)
      }
      gameEndTimeout.current = setTimeout(async () => {
        await endGame()
      }, session.duration * 1000)

      return true
    } catch (err) {
      return handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  // 게임 액션 제출
  const submitAction = useCallback(async (action: GameAction): Promise<boolean> => {
    if (!gameSession || status !== 'playing') {
      setError('게임 세션이 활성화되지 않았습니다.')
      return false
    }

    try {
      const updatedState = await miniGameApi.submitGameAction(gameSession.sessionId, action)
      setGameState(updatedState)

      // 게임이 자동으로 완료되었는지 확인
      if (updatedState.status === 'completed') {
        await endGame()
      }

      return true
    } catch (err) {
      return handleError(err)
    }
  }, [gameSession, status, handleError])

  // 게임 종료
  const endGame = useCallback(async (): Promise<GameResult | null> => {
    if (!gameSession) {
      setError('게임 세션이 없습니다.')
      return null
    }

    try {
      setStatus('ending')
      setIsLoading(true)

      const result = await miniGameApi.endGameSession(gameSession.sessionId)
      setGameResult(result)
      setStatus('completed')

      // 타이머 정리
      if (gameEndTimeout.current) {
        clearTimeout(gameEndTimeout.current)
        gameEndTimeout.current = null
      }

      return result
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [gameSession, handleError])

  // 게임 리셋
  const resetGame = useCallback(() => {
    // 타이머 정리
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current)
      statusCheckInterval.current = null
    }
    if (gameEndTimeout.current) {
      clearTimeout(gameEndTimeout.current)
      gameEndTimeout.current = null
    }

    // 상태 초기화
    setGameSession(null)
    setGameState(null)
    setGameResult(null)
    setStatus('idle')
    setError(null)
    setIsLoading(false)
  }, [])

  // 남은 시간 계산
  const getTimeLeft = useCallback((): number => {
    if (!gameSession || !gameState) return 0
    return Math.max(0, gameState.timeLeft)
  }, [gameSession, gameState])

  // 현재 점수 조회
  const getCurrentScore = useCallback((): number => {
    return gameState?.currentScore || 0
  }, [gameState])

  // 게임 활성 상태 확인
  const isGameActive = useCallback((): boolean => {
    return status === 'playing' && gameState?.status === 'in_progress'
  }, [status, gameState])

  return {
    // 상태
    gameSession,
    gameState,
    gameResult,
    status,
    error,
    isLoading,

    // 게임 제어
    startGame,
    submitAction,
    endGame,
    resetGame,

    // 헬퍼 메소드
    getTimeLeft,
    getCurrentScore,
    isGameActive
  }
}

// 클릭 스피드 게임 전용 훅
export const useClickSpeedGame = () => {
  const api = useMinigameApi()

  const submitClick = useCallback(async () => {
    return await api.submitAction({
      type: 'click',
      data: {}
    })
  }, [api])

  return {
    ...api,
    submitClick
  }
}

// 메모리 매치 게임 전용 훅
export const useMemoryMatchGame = () => {
  const api = useMinigameApi()

  const submitMatch = useCallback(async (isMatch: boolean) => {
    return await api.submitAction({
      type: 'match_attempt',
      data: { isMatch }
    })
  }, [api])

  return {
    ...api,
    submitMatch
  }
}

// 숫자 맞추기 게임 전용 훅
export const useNumberGuessGame = () => {
  const api = useMinigameApi()

  const submitGuess = useCallback(async (number: number) => {
    return await api.submitAction({
      type: 'guess',
      data: { number }
    })
  }, [api])

  return {
    ...api,
    submitGuess
  }
}

// 게임 통계 추적 훅
export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    timeLeft: 0
  })

  const updateStats = useCallback((newStats: Partial<GameStats>) => {
    setStats(prev => ({ ...prev, ...newStats }))
  }, [])

  const resetStats = useCallback(() => {
    setStats({
      score: 0,
      timeLeft: 0
    })
  }, [])

  return {
    stats,
    updateStats,
    resetStats
  }
}

// 리더보드 데이터 훅
export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<MiniGameLeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchLeaderboard = useCallback(async (gameType: string) => {
    try {
      setIsLoading(true)
      const response = await miniGameApi.getLeaderboard(gameType, 10)

      let currentUsername: string | null = null
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('user')
          if (raw) {
            const parsed = JSON.parse(raw)
            currentUsername = parsed?.username || parsed?.user?.username || null
          }
        } catch (error) {
          console.warn('Failed to parse stored user info:', error)
        }
      }

      const entries = response.entries.map(entry => ({
        ...entry,
        isCurrentUser: currentUsername ? entry.username === currentUsername : false
      }))

      setLeaderboard(entries)
      setUserRank(response.userRank ?? null)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    leaderboard,
    userRank,
    isLoading,
    fetchLeaderboard
  }
}
