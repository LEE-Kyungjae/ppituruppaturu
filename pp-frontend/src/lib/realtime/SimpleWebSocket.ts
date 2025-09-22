/**
 * Simple WebSocket wrapper for real-time features
 * Handles connection, reconnection, and message routing
 */

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  userId?: string
}

export interface WebSocketOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export class SimpleWebSocket {
  private ws: WebSocket | null = null
  private options: Required<WebSocketOptions>
  private listeners: Map<string, ((data: any) => void)[]> = new Map()
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...options
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.options.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.isConnecting = false
          this.stopHeartbeat()
          this.scheduleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type: string, data: any, userId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return false
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      userId
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  on(type: string, listener: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  off(type: string, listener?: (data: any) => void) {
    if (!listener) {
      this.listeners.delete(type)
      return
    }

    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type) || []
    const allListeners = this.listeners.get('*') || []

    const allListenersCombined = listeners.concat(allListeners)
    allListenersCombined.forEach(listener => {
      try {
        listener(message.data)
      } catch (error) {
        console.error('Error in WebSocket listener:', error)
      }
    })
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`)
      this.connect().catch(() => {
        // Reconnection failed, will try again
      })
    }, this.options.reconnectInterval)
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', { timestamp: Date.now() })
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected'

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }
}

// 글로벌 WebSocket 인스턴스 (개발용)
let globalWebSocket: SimpleWebSocket | null = null

export function getGlobalWebSocket(): SimpleWebSocket {
  if (!globalWebSocket) {
    // 개발 환경에서는 localhost WebSocket 서버 시뮬레이션
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'

    globalWebSocket = new SimpleWebSocket({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    })

    // 개발용: 서버가 없으면 모의 메시지 생성
    setTimeout(() => {
      if (!globalWebSocket?.isConnected) {
        console.log('WebSocket server not available, using mock messages')
        startMockWebSocket()
      }
    }, 2000)
  }

  return globalWebSocket
}

// 개발용 모의 WebSocket 메시지
function startMockWebSocket() {
  if (!globalWebSocket) return

  // 모의 사용자들
  const mockUsers = [
    { id: 'user1', name: 'GamerBot', level: 15 },
    { id: 'user2', name: 'PaintMaster', level: 23 },
    { id: 'user3', name: 'PixelWarrior', level: 8 }
  ]

  const mockMessages = [
    'Anyone up for a paint battle?',
    'GG! That was a great match',
    'How do you move so fast?',
    'Nice paint job!',
    'Join room 123 for team match',
    'Looking for ranked partners'
  ]

  // 주기적으로 모의 채팅 메시지 생성
  setInterval(() => {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const message = mockMessages[Math.floor(Math.random() * mockMessages.length)]

    globalWebSocket?.handleMessage({
      type: 'chat_message',
      data: {
        id: Date.now().toString(),
        userId: user.id,
        username: user.name,
        message,
        timestamp: Date.now(),
        userLevel: user.level
      },
      timestamp: Date.now()
    } as any)
  }, 5000 + Math.random() * 10000) // 5-15초마다

  // 모의 사용자 접속/퇴장
  setInterval(() => {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const isJoining = Math.random() > 0.5

    globalWebSocket?.handleMessage({
      type: 'user_status',
      data: {
        userId: user.id,
        username: user.name,
        status: isJoining ? 'joined' : 'left',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    } as any)
  }, 15000 + Math.random() * 20000) // 15-35초마다
}