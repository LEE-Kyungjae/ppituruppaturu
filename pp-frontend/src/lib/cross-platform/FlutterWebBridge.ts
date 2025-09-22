/**
 * Flutter Web Bridge
 * 웹 프론트엔드와 Flutter 웹 간의 메시지 패싱을 처리합니다.
 */

export interface FlutterMessage {
  type: string
  data: any
  timestamp: number
  sessionId?: string
}

export interface GameState {
  score: number
  gameTime: number
  playerName: string
  paintCoverage: number
  state: string
}

export interface GameResult {
  score: number
  gameTime: number
  victory: boolean
  stats: Record<string, any>
  sessionId: string
}

export type MessageHandler = (message: FlutterMessage) => void

class FlutterWebBridge {
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private isConnected = false
  private flutter: any = null
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeBridge()
  }

  private initializeBridge() {
    // Flutter 웹 앱과의 연결을 설정
    if (typeof window !== 'undefined') {
      // PostMessage API를 사용한 통신 설정
      window.addEventListener('message', this.handleMessage.bind(this))

      // Flutter 앱이 로드될 때까지 대기
      this.waitForFlutterApp()
    }
  }

  private async waitForFlutterApp() {
    const maxAttempts = 30 // 30초 대기
    let attempts = 0

    const checkFlutter = () => {
      // Flutter 앱이 postMessage로 준비 신호를 보낼 때까지 대기
      if (this.isFlutterReady()) {
        this.onFlutterReady()
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(checkFlutter, 1000)
      } else {
        console.warn('Flutter app connection timeout')
      }
    }

    checkFlutter()
  }

  private isFlutterReady(): boolean {
    // Flutter 앱이 iframe이나 다른 origin에서 실행될 때를 대비
    try {
      // Flutter에서 전송한 ready 메시지를 확인
      return this.isConnected
    } catch (e) {
      return false
    }
  }

  private onFlutterReady() {
    console.log('Flutter Web Bridge connected')
    this.isConnected = true
    this.startHeartbeat()

    // 연결 확인 메시지 전송
    this.sendToFlutter({
      type: 'web_bridge_ready',
      data: { timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendToFlutter({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        })
      }
    }, 5000) // 5초마다 heartbeat
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: FlutterMessage = event.data

      // Flutter에서 온 메시지인지 확인
      if (this.isValidFlutterMessage(message)) {
        // 특별한 시스템 메시지 처리
        if (message.type === 'flutter_ready') {
          this.isConnected = true
          this.onFlutterReady()
          return
        }

        if (message.type === 'flutter_disconnected') {
          this.isConnected = false
          this.stopHeartbeat()
          return
        }

        // 일반 메시지 핸들러 호출
        const handlers = this.messageHandlers.get(message.type) || []
        handlers.forEach(handler => {
          try {
            handler(message)
          } catch (e) {
            console.error('Error in message handler:', e)
          }
        })

        // 전체 메시지 핸들러 호출
        const allHandlers = this.messageHandlers.get('*') || []
        allHandlers.forEach(handler => {
          try {
            handler(message)
          } catch (e) {
            console.error('Error in global message handler:', e)
          }
        })
      }
    } catch (e) {
      console.warn('Invalid message received:', event.data)
    }
  }

  private isValidFlutterMessage(data: any): data is FlutterMessage {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.timestamp === 'number'
    )
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Public API

  /**
   * Flutter로 메시지 전송
   */
  sendToFlutter(message: Omit<FlutterMessage, 'timestamp'>): boolean {
    if (!this.isConnected) {
      console.warn('Flutter bridge not connected')
      return false
    }

    try {
      const fullMessage: FlutterMessage = {
        ...message,
        timestamp: Date.now()
      }

      // PostMessage를 사용하여 Flutter 앱으로 전송
      // Flutter 앱이 다른 iframe이나 origin에 있는 경우
      const flutterFrame = document.getElementById('flutter-app') as HTMLIFrameElement
      if (flutterFrame && flutterFrame.contentWindow) {
        flutterFrame.contentWindow.postMessage(fullMessage, '*')
      } else {
        // 같은 도메인에 있는 경우
        window.postMessage(fullMessage, '*')
      }

      return true
    } catch (e) {
      console.error('Failed to send message to Flutter:', e)
      return false
    }
  }

  /**
   * 메시지 핸들러 등록
   */
  on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }

  /**
   * 메시지 핸들러 제거
   */
  off(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 게임 관련 메시지 전송 메서드들
   */

  // 게임 시작 알림
  notifyGameStarted(sessionId: string, playerName: string): void {
    this.sendToFlutter({
      type: 'game_started',
      data: { sessionId, playerName },
      sessionId
    })
  }

  // 게임 상태 업데이트
  updateGameState(gameState: GameState): void {
    this.sendToFlutter({
      type: 'game_state_update',
      data: gameState
    })
  }

  // 게임 결과 전송
  submitGameResult(result: GameResult): void {
    this.sendToFlutter({
      type: 'game_result',
      data: result,
      sessionId: result.sessionId
    })
  }

  // 플레이어 입력 전송
  sendPlayerInput(input: any): void {
    this.sendToFlutter({
      type: 'player_input',
      data: input
    })
  }

  // 멀티플레이어 이벤트
  sendMultiplayerEvent(eventType: string, eventData: any): void {
    this.sendToFlutter({
      type: 'multiplayer_event',
      data: { eventType, eventData }
    })
  }

  // 연결 상태 확인
  isConnectedToFlutter(): boolean {
    return this.isConnected
  }

  // 브리지 정리
  destroy(): void {
    this.stopHeartbeat()
    this.isConnected = false
    this.messageHandlers.clear()

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage.bind(this))
    }
  }
}

// 싱글톤 인스턴스
export const flutterBridge = new FlutterWebBridge()

// React Hook
export function useFlutterBridge() {
  const [isConnected, setIsConnected] = React.useState(flutterBridge.isConnectedToFlutter())

  React.useEffect(() => {
    const handleConnection = () => setIsConnected(true)
    const handleDisconnection = () => setIsConnected(false)

    flutterBridge.on('flutter_ready', handleConnection)
    flutterBridge.on('flutter_disconnected', handleDisconnection)

    return () => {
      flutterBridge.off('flutter_ready', handleConnection)
      flutterBridge.off('flutter_disconnected', handleDisconnection)
    }
  }, [])

  return {
    isConnected,
    sendToFlutter: flutterBridge.sendToFlutter.bind(flutterBridge),
    on: flutterBridge.on.bind(flutterBridge),
    off: flutterBridge.off.bind(flutterBridge),
    notifyGameStarted: flutterBridge.notifyGameStarted.bind(flutterBridge),
    updateGameState: flutterBridge.updateGameState.bind(flutterBridge),
    submitGameResult: flutterBridge.submitGameResult.bind(flutterBridge),
    sendPlayerInput: flutterBridge.sendPlayerInput.bind(flutterBridge),
    sendMultiplayerEvent: flutterBridge.sendMultiplayerEvent.bind(flutterBridge)
  }
}

// TypeScript에서 React import
import React from 'react'

export default flutterBridge