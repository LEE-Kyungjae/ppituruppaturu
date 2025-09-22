/**
 * CrossPlatformBridge - Unified communication bridge for Next.js ↔ Flutter integration
 * Handles message passing, state synchronization, and cross-platform data exchange
 */

export interface CrossPlatformMessage {
  id: string
  type: 'GAME_STATE' | 'PLAYER_ACTION' | 'PERFORMANCE_DATA' | 'AI_UPDATE' | 'SYSTEM_EVENT'
  source: 'NEXTJS' | 'FLUTTER' | 'UNITY'
  target: 'NEXTJS' | 'FLUTTER' | 'UNITY' | 'BROADCAST'
  payload: any
  timestamp: number
  requiresResponse?: boolean
}

export interface GameState {
  gameId: string
  playerId: string
  status: 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED'
  score: number
  level: number
  timeRemaining: number
  paintedArea: number
  playerPosition: { x: number; y: number }
  achievements: string[]
}

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  networkLatency: number
  renderTime: number
  cpuUsage: number
  batteryLevel?: number
}

export interface PlayerAction {
  type: 'PAINT' | 'MOVE' | 'JUMP' | 'POWER_UP' | 'CHAT'
  data: any
  playerId: string
  timestamp: number
}

export class CrossPlatformBridge {
  private messageQueue: CrossPlatformMessage[] = []
  private listeners: Map<string, ((message: CrossPlatformMessage) => void)[]> = new Map()
  private isFlutterConnected = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private responseCallbacks: Map<string, (response: any) => void> = new Map()

  constructor() {
    this.initializeMessageListener()
    this.startHeartbeat()
  }

  private initializeMessageListener() {
    // Listen for messages from Flutter WebView
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin &&
          !event.origin.includes('localhost')) {
        return // Security check
      }

      try {
        const message: CrossPlatformMessage = JSON.parse(event.data)
        if (this.isValidMessage(message)) {
          this.handleIncomingMessage(message)
        }
      } catch (error) {
        console.warn('Failed to parse cross-platform message:', error)
      }
    })

    // Listen for Flutter connectivity
    window.addEventListener('flutter-ready', () => {
      this.isFlutterConnected = true
      console.log('✅ Flutter shell connected to Next.js core')
      this.flushMessageQueue()
    })
  }

  private isValidMessage(message: any): message is CrossPlatformMessage {
    return (
      typeof message === 'object' &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.source === 'string' &&
      typeof message.target === 'string' &&
      typeof message.timestamp === 'number'
    )
  }

  private handleIncomingMessage(message: CrossPlatformMessage) {
    console.log(`📨 Received ${message.type} from ${message.source}:`, message.payload)

    // Handle response messages
    if (message.id && this.responseCallbacks.has(message.id)) {
      const callback = this.responseCallbacks.get(message.id)!
      callback(message.payload)
      this.responseCallbacks.delete(message.id)
      return
    }

    // Distribute to listeners
    const typeListeners = this.listeners.get(message.type) || []
    const allListeners = this.listeners.get('*') || []

    [...typeListeners, ...allListeners].forEach(listener => {
      try {
        listener(message)
      } catch (error) {
        console.error('Error in message listener:', error)
      }
    })
  }

  public sendMessage(
    type: CrossPlatformMessage['type'],
    target: CrossPlatformMessage['target'],
    payload: any,
    requiresResponse = false
  ): Promise<any> {
    const message: CrossPlatformMessage = {
      id: this.generateMessageId(),
      type,
      source: 'NEXTJS',
      target,
      payload,
      timestamp: Date.now(),
      requiresResponse
    }

    return new Promise((resolve, reject) => {
      if (requiresResponse) {
        this.responseCallbacks.set(message.id, resolve)
        setTimeout(() => {
          if (this.responseCallbacks.has(message.id)) {
            this.responseCallbacks.delete(message.id)
            reject(new Error('Message timeout'))
          }
        }, 5000)
      } else {
        resolve(undefined)
      }

      this.deliverMessage(message)
    })
  }

  private deliverMessage(message: CrossPlatformMessage) {
    if (message.target === 'FLUTTER') {
      if (this.isFlutterConnected) {
        this.postToFlutter(message)
      } else {
        this.messageQueue.push(message)
        console.log('📤 Queued message for Flutter (not connected yet)')
      }
    } else if (message.target === 'BROADCAST') {
      this.postToFlutter(message)
      // Could also broadcast to Unity WebGL when available
    }
  }

  private postToFlutter(message: CrossPlatformMessage) {
    try {
      // Try different Flutter communication methods
      if (window.parent !== window) {
        // If running in iframe
        window.parent.postMessage(JSON.stringify(message), '*')
      }

      // Try Flutter JS interop
      if ((window as any).flutter_js) {
        (window as any).flutter_js.postMessage(JSON.stringify(message))
      }

      // Try direct Flutter web communication
      window.postMessage(JSON.stringify(message), '*')

      console.log(`📡 Sent ${message.type} to Flutter:`, message.payload)
    } catch (error) {
      console.error('Failed to send message to Flutter:', error)
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.postToFlutter(message)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage('SYSTEM_EVENT', 'FLUTTER', {
        type: 'HEARTBEAT',
        timestamp: Date.now(),
        nextjsStatus: 'HEALTHY'
      })
    }, 10000) // Every 10 seconds
  }

  public onMessage(
    type: string,
    listener: (message: CrossPlatformMessage) => void
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type) || []
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // High-level API methods
  public syncGameState(gameState: GameState) {
    return this.sendMessage('GAME_STATE', 'FLUTTER', gameState)
  }

  public sendPlayerAction(action: PlayerAction) {
    return this.sendMessage('PLAYER_ACTION', 'BROADCAST', action)
  }

  public reportPerformanceMetrics(metrics: PerformanceMetrics) {
    return this.sendMessage('PERFORMANCE_DATA', 'FLUTTER', metrics)
  }

  public sendAIUpdate(aiData: any) {
    return this.sendMessage('AI_UPDATE', 'BROADCAST', aiData)
  }

  public requestFlutterData(requestType: string): Promise<any> {
    return this.sendMessage('SYSTEM_EVENT', 'FLUTTER', {
      type: 'DATA_REQUEST',
      requestType
    }, true)
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public getConnectionStatus() {
    return {
      flutter: this.isFlutterConnected,
      queuedMessages: this.messageQueue.length,
      activeListeners: Array.from(this.listeners.keys()).length
    }
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.listeners.clear()
    this.responseCallbacks.clear()
    this.messageQueue = []
  }
}

// Singleton instance
export const crossPlatformBridge = new CrossPlatformBridge()

// Global availability for debugging
if (typeof window !== 'undefined') {
  (window as any).crossPlatformBridge = crossPlatformBridge
}