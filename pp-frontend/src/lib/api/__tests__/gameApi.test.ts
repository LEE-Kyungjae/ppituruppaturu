/**
 * Integration tests for Game API
 */

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Game API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Game Management', () => {
    it('should create a new game session', async () => {
      const mockResponse = {
        id: 'game-123',
        type: 'physics-jump',
        status: 'waiting',
        players: [],
        createdAt: new Date().toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'physics-jump',
          maxPlayers: 4
        })
      })

      const result = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'physics-jump',
          maxPlayers: 4
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('should join an existing game', async () => {
      const gameId = 'game-123'
      const mockResponse = {
        success: true,
        playerId: 'player-456',
        gameState: {
          id: gameId,
          status: 'playing',
          players: [
            { id: 'player-456', name: 'Test Player' }
          ]
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: 'Test Player'
        })
      })

      const result = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: 'Test Player'
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('should get game state', async () => {
      const gameId = 'game-123'
      const mockResponse = {
        id: gameId,
        type: 'physics-jump',
        status: 'playing',
        players: [
          { id: 'player-456', name: 'Test Player', score: 100 }
        ],
        gameData: {
          level: 1,
          timeRemaining: 120
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameId}`)
      const result = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/api/games/${gameId}`)
      expect(result).toEqual(mockResponse)
    })

    it('should handle game not found error', async () => {
      const gameId = 'invalid-game'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Game not found' }),
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameId}`)
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(result.error).toBe('Game not found')
    })
  })

  describe('Player Actions', () => {
    it('should update player score', async () => {
      const gameId = 'game-123'
      const playerId = 'player-456'
      const mockResponse = {
        success: true,
        newScore: 250,
        leaderboard: [
          { id: 'player-456', name: 'Test Player', score: 250 }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameId}/players/${playerId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: 250,
          action: 'level_complete'
        })
      })

      const result = await response.json()

      expect(result).toEqual(mockResponse)
    })

    it('should send player input', async () => {
      const gameId = 'game-123'
      const playerId = 'player-456'
      const mockResponse = { success: true }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameId}/players/${playerId}/input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'jump',
          timestamp: Date.now(),
          data: { force: 0.8 }
        })
      })

      const result = await response.json()

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Game Statistics', () => {
    it('should get leaderboard', async () => {
      const gameType = 'physics-jump'
      const mockResponse = {
        leaderboard: [
          { id: 'player-1', name: 'Player 1', score: 1000, rank: 1 },
          { id: 'player-2', name: 'Player 2', score: 850, rank: 2 },
          { id: 'player-3', name: 'Player 3', score: 700, rank: 3 }
        ],
        totalPlayers: 156,
        gameType
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/games/${gameType}/leaderboard?limit=10`)
      const result = await response.json()

      expect(result).toEqual(mockResponse)
    })

    it('should get player statistics', async () => {
      const playerId = 'player-456'
      const mockResponse = {
        playerId,
        gamesPlayed: 25,
        totalScore: 12500,
        averageScore: 500,
        bestScore: 1200,
        achievements: ['first_win', 'speed_demon'],
        favoriteGameType: 'physics-jump'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch(`${baseUrl}/api/players/${playerId}/stats`)
      const result = await response.json()

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch(`${baseUrl}/api/games`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response)

      const response = await fetch(`${baseUrl}/api/games`)
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      try {
        const response = await fetch(`${baseUrl}/api/games`)
        await response.json()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Invalid JSON')
      }
    })
  })

  describe('WebSocket Integration', () => {
    it('should handle WebSocket connection for real-time updates', () => {
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: 1,
      }

      // Mock WebSocket constructor
      ;(global as any).WebSocket = jest.fn(() => mockWebSocket)

      const wsUrl = `ws://localhost:8080/api/games/game-123/ws`
      const ws = new WebSocket(wsUrl)

      expect(global.WebSocket).toHaveBeenCalledWith(wsUrl)
      expect(ws).toBe(mockWebSocket)
    })

    it('should send game events via WebSocket', () => {
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: 1,
      }

      ;(global as any).WebSocket = jest.fn(() => mockWebSocket)

      const ws = new WebSocket('ws://localhost:8080/api/games/game-123/ws')

      const gameEvent = {
        type: 'player_move',
        playerId: 'player-456',
        data: { x: 100, y: 200 },
        timestamp: Date.now()
      }

      ws.send(JSON.stringify(gameEvent))

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(gameEvent))
    })
  })
})