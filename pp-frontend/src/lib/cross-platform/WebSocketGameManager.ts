interface GameMessage {
  type: GameEventType
  data: Record<string, any>
  timestamp: number
  from?: string
  to?: string
  roomId?: string
}

enum GameEventType {
  PLAYER_JOIN = 'playerJoin',
  PLAYER_LEAVE = 'playerLeave',
  GAME_STATE = 'gameState',
  PLAYER_ACTION = 'playerAction',
  SCORE_UPDATE = 'scoreUpdate',
  GAME_END = 'gameEnd',
  PING = 'ping',
  PONG = 'pong',
  ROOM_JOIN = 'roomJoin',
  ROOM_LEAVE = 'roomLeave',
  ROOM_UPDATE = 'roomUpdate'
}

enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

enum GamePlatform {
  MOBILE = 'mobile',
  WEB = 'web',
  DESKTOP = 'desktop'
}

interface PlayerState {
  username: string
  platform: GamePlatform
  position: { x: number; y: number }
  gameData: Record<string, any>
  score: number
  lastUpdate: number
  isActive: boolean
}

interface CrossPlatformGameState {
  gameId: string
  gameType: string
  players: Record<string, PlayerState>
  sharedGameData: Record<string, any>
  lastUpdate: number
  syncState: 'synced' | 'syncing' | 'outOfSync' | 'error'
}

export class WebSocketGameManager extends EventTarget {
  private ws: WebSocket | null = null
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private pingInterval = 30000

  private serverUrl: string = ''
  private username: string = ''
  private roomId: string | null = null
  private authToken: string | null = null

  private pingTimer: number | null = null
  private reconnectTimer: number | null = null
  private lastPingTime: number | null = null

  // Message handlers
  private messageHandlers: Map<GameEventType, ((msg: GameMessage) => void)[]> = new Map()

  // Performance metrics
  private messagesSent = 0
  private messagesReceived = 0
  private latency: number | null = null

  // Game state
  private currentGameState: CrossPlatformGameState | null = null
  private localPlayer: PlayerState | null = null

  constructor() {
    super()
  }

  async connect(config: {
    serverUrl: string
    username: string
    authToken?: string
    roomId?: string
  }): Promise<boolean> {
    if (this.connectionState === ConnectionState.CONNECTING ||
        this.connectionState === ConnectionState.CONNECTED) {
      return true
    }

    this.serverUrl = config.serverUrl
    this.username = config.username
    this.authToken = config.authToken || null
    this.roomId = config.roomId || null

    return this.attemptConnection()
  }

  private async attemptConnection(): Promise<boolean> {
    try {
      this.setConnectionState(ConnectionState.CONNECTING)

      // Build WebSocket URL
      const url = new URL(this.serverUrl)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      url.pathname = '/ws'

      const params = new URLSearchParams({
        username: this.username,
        ...(this.authToken && { token: this.authToken }),
        ...(this.roomId && { room: this.roomId })
      })
      url.search = params.toString()

      console.log('Connecting to WebSocket:', url.toString())

      this.ws = new WebSocket(url.toString())

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.setConnectionState(ConnectionState.CONNECTED)
        this.startPing()
        this.reconnectAttempts = 0

        // Send initial connection message
        this.sendMessage({
          type: GameEventType.PLAYER_JOIN,
          data: {
            username: this.username,
            platform: GamePlatform.WEB,
            version: '1.0.0'
          },
          timestamp: Date.now()
        })
      }

      this.ws.onmessage = (event) => {
        this.onMessage(event.data)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.setConnectionState(ConnectionState.ERROR)
        this.scheduleReconnect()
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.setConnectionState(ConnectionState.DISCONNECTED)
        this.stopPing()
        this.scheduleReconnect()
      }

      return true
    } catch (error) {
      console.error('Connection failed:', error)
      this.setConnectionState(ConnectionState.ERROR)
      this.scheduleReconnect()
      return false
    }
  }

  private onMessage(data: string) {
    try {
      this.messagesReceived++
      const message: GameMessage = JSON.parse(data)

      // Handle ping/pong for latency
      if (message.type === GameEventType.PONG && this.lastPingTime) {
        this.latency = Date.now() - this.lastPingTime
        this.lastPingTime = null
      }

      // Notify handlers
      const handlers = this.messageHandlers.get(message.type) || []
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('Message handler error:', error)
        }
      })

      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('message', { detail: message }))
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state
      this.dispatchEvent(new CustomEvent('connectionChange', { detail: state }))
    }
  }

  private startPing() {
    this.stopPing()
    this.pingTimer = window.setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.lastPingTime = Date.now()
        this.sendMessage({
          type: GameEventType.PING,
          data: { timestamp: this.lastPingTime },
          timestamp: this.lastPingTime
        })
      }
    }, this.pingInterval)
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = window.setTimeout(() => {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        this.reconnectAttempts++
        this.setConnectionState(ConnectionState.RECONNECTING)
        console.log(`Reconnection attempt ${this.reconnectAttempts}`)
        this.attemptConnection()
      }
    }, this.reconnectDelay)
  }

  private sendMessage(message: GameMessage) {
    if (!this.ws || this.connectionState !== ConnectionState.CONNECTED) {
      console.warn('Cannot send message: not connected')
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
      this.messagesSent++
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Public methods
  sendPlayerAction(action: string, actionData: Record<string, any>) {
    this.sendMessage({
      type: GameEventType.PLAYER_ACTION,
      data: {
        action,
        actionData,
        username: this.username
      },
      timestamp: Date.now(),
      from: this.username,
      roomId: this.roomId || undefined
    })
  }

  sendGameState(gameState: Record<string, any>) {
    this.sendMessage({
      type: GameEventType.GAME_STATE,
      data: gameState,
      timestamp: Date.now(),
      from: this.username,
      roomId: this.roomId || undefined
    })
  }

  sendScoreUpdate(score: number) {
    this.sendMessage({
      type: GameEventType.SCORE_UPDATE,
      data: {
        score,
        username: this.username
      },
      timestamp: Date.now(),
      from: this.username,
      roomId: this.roomId || undefined
    })
  }

  async joinRoom(roomId: string) {
    this.roomId = roomId
    this.sendMessage({
      type: GameEventType.ROOM_JOIN,
      data: {
        roomId,
        username: this.username
      },
      timestamp: Date.now(),
      from: this.username
    })
  }

  async leaveRoom() {
    if (this.roomId) {
      this.sendMessage({
        type: GameEventType.ROOM_LEAVE,
        data: {
          roomId: this.roomId,
          username: this.username
        },
        timestamp: Date.now(),
        from: this.username
      })
      this.roomId = null
    }
  }

  // Cross-platform game management
  async joinCrossPlatformGame(gameId: string, gameType: string, initialGameData?: Record<string, any>): Promise<boolean> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      console.warn('Cannot join cross-platform game: not connected')
      return false
    }

    this.localPlayer = {
      username: this.username,
      platform: GamePlatform.WEB,
      position: { x: 0, y: 0 },
      gameData: initialGameData || {},
      score: 0,
      lastUpdate: Date.now(),
      isActive: true
    }

    await this.joinRoom(gameId)

    this.sendGameState({
      action: 'join_cross_platform',
      gameId,
      gameType,
      playerState: this.localPlayer,
      platform: 'web'
    })

    return true
  }

  updateLocalPlayerState(position?: { x: number; y: number }, gameData?: Record<string, any>, score?: number) {
    if (!this.localPlayer) return

    this.localPlayer = {
      ...this.localPlayer,
      ...(position && { position }),
      gameData: { ...this.localPlayer.gameData, ...gameData },
      ...(score !== undefined && { score }),
      lastUpdate: Date.now()
    }

    // Send state update
    this.sendGameState({
      action: 'state_update',
      gameId: this.roomId,
      playerState: this.localPlayer,
      platform: 'web'
    })
  }

  // Message handler management
  addMessageHandler(type: GameEventType, handler: (msg: GameMessage) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)
  }

  removeMessageHandler(type: GameEventType, handler: (msg: GameMessage) => void) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED
  }

  get connectionState_(): ConnectionState {
    return this.connectionState
  }

  get currentPlayer(): PlayerState | null {
    return this.localPlayer
  }

  get gameState(): CrossPlatformGameState | null {
    return this.currentGameState
  }

  getMetrics() {
    return {
      connectionState: this.connectionState,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      latency: this.latency,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // Cleanup
  disconnect() {
    this.stopPing()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.sendMessage({
          type: GameEventType.PLAYER_LEAVE,
          data: {
            username: this.username,
            reason: 'user_disconnect'
          },
          timestamp: Date.now(),
          from: this.username
        })
      }

      this.ws.close()
      this.ws = null
    }

    this.setConnectionState(ConnectionState.DISCONNECTED)
    this.messageHandlers.clear()
  }
}

export { GameEventType, ConnectionState, GamePlatform }
export type { GameMessage, PlayerState, CrossPlatformGameState }