// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// API 클라이언트 생성
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 요청 인터셉터 - JWT 토큰 자동 추가
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 응답 인터셉터 - 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 토큰 만료 시 로그아웃 처리
          this.clearAuthToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  public clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  public setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient()

// 타입 정의
export interface GameType {
  type: string
  name: string
  description: string
  duration: number
  maxScore: number
  difficulty: number
  pointsPerScore: number
}

export interface GameSession {
  sessionId: string
  gameType: string
  duration: number
  startTime: string
  gameData: Record<string, any>
  instructions: string
}

export interface GameState {
  sessionId: string
  gameType: string
  currentScore: number
  status: string
  gameData: Record<string, any>
  timeLeft: number
}

export interface GameResult {
  sessionId: string
  finalScore: number
  duration: number
  pointsEarned: number
  isValid: boolean
  reason?: string
  leaderboard: boolean
}

export interface MiniGameLeaderboardEntry {
  rank: number
  username: string
  score: number
  points: number
  durationSeconds?: number
  recordedAt: string
  isCurrentUser?: boolean
}

export interface MiniGameLeaderboardResponse {
  gameType: string
  entries: MiniGameLeaderboardEntry[]
  userRank?: number | null
}

export interface GameAction {
  type: string
  data?: Record<string, any>
}

// 미니게임 API 서비스
export class MiniGameApiService {
  private client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  // 게임 타입 목록 조회
  async getGameTypes(): Promise<{ games: GameType[] }> {
    return this.client.get('/api/v1/minigames/types')
  }

  // 게임 세션 시작
  async startGameSession(gameType: string): Promise<GameSession> {
    return this.client.post('/api/v1/minigames/start', {
      gameType
    })
  }

  // 게임 액션 제출
  async submitGameAction(sessionId: string, action: GameAction): Promise<GameState> {
    return this.client.post(`/api/v1/minigames/sessions/${sessionId}/action`, action)
  }

  // 게임 세션 종료
  async endGameSession(sessionId: string): Promise<GameResult> {
    return this.client.post(`/api/v1/minigames/sessions/${sessionId}/end`)
  }

  // 게임 상태 조회
  async getGameStatus(sessionId: string): Promise<GameState> {
    return this.client.get(`/api/v1/minigames/sessions/${sessionId}`)
  }

  // 미니게임 리더보드 조회
  async getLeaderboard(gameType: string, limit?: number): Promise<MiniGameLeaderboardResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const query = params.toString()
    const suffix = query ? `?${query}` : ''
    return this.client.get(`/api/v1/minigames/${gameType}/leaderboard${suffix}`)
  }
}

// 인증 API 서비스
export class AuthApiService {
  private client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  // 소셜 로그인 (구글)
  async loginWithGoogle(token: string): Promise<{ token: string; user: any }> {
    return this.client.post('/api/v1/auth/google', { token })
  }

  // 소셜 로그인 (카카오)
  async loginWithKakao(token: string): Promise<{ token: string; user: any }> {
    return this.client.post('/api/v1/auth/kakao', { token })
  }

  // 소셜 로그인 (네이버)
  async loginWithNaver(token: string): Promise<{ token: string; user: any }> {
    return this.client.post('/api/v1/auth/naver', { token })
  }

  // 데모 로그인
  async loginDemo(): Promise<{ token: string; user: any }> {
    return this.client.post('/api/v1/auth/demo')
  }

  // 로그아웃
  async logout(): Promise<void> {
    await this.client.post('/api/v1/auth/logout')
    this.client.clearAuthToken()
  }

  // 사용자 정보 조회
  async getCurrentUser(): Promise<any> {
    return this.client.get('/api/v1/auth/me')
  }
}

// 포인트 API 서비스
export class PointApiService {
  private client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  // 포인트 잔액 조회
  async getBalance(): Promise<{ balance: number }> {
    return this.client.get('/api/v1/points/balance')
  }

  // 포인트 거래 내역
  async getTransactions(limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    
    return this.client.get(`/api/v1/points/transactions?${params.toString()}`)
  }
}

// 리더보드 API 서비스
export class LeaderboardApiService {
  private client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  // 게임별 리더보드
  async getGameLeaderboard(gameId: string, limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    
    return this.client.get(`/api/v1/games/${gameId}/scores?${params.toString()}`)
  }

  // 사용자 점수 내역
  async getUserScores(username: string, limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    
    return this.client.get(`/api/v1/users/${username}/scores?${params.toString()}`)
  }
}

// API 서비스 인스턴스들
export const miniGameApi = new MiniGameApiService(apiClient)
export const authApi = new AuthApiService(apiClient)
export const pointApi = new PointApiService(apiClient)
export const leaderboardApi = new LeaderboardApiService(apiClient)

// 에러 처리 헬퍼
export class ApiError extends Error {
  public status: number
  public code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = 'ApiError'
  }
}

// API 호출 헬퍼 함수
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return new ApiError(
      error.response.data?.message || 'API 요청에 실패했습니다.',
      error.response.status,
      error.response.data?.code
    )
  } else if (error.request) {
    return new ApiError('서버에 연결할 수 없습니다.', 0)
  } else {
    return new ApiError('요청 중 오류가 발생했습니다.', 0)
  }
}

// 재시도 헬퍼
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}
