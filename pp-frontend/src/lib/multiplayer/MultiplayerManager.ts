/**
 * Real-time Multiplayer Manager
 * WebSocket 기반 실시간 멀티플레이어 게임 관리
 */

import { io, Socket } from 'socket.io-client'

export interface Player {
  id: string
  username: string
  position: { x: number; y: number }
  score: number
  paintCoverage: number
  isActive: boolean
  platform: GamePlatform
  lastUpdate: number
}

export interface GameRoom {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  gameMode: GameMode
  status: RoomStatus
  settings: GameSettings
  hostId: string
  createdAt: number
}

export interface GameSettings {
  timeLimit: number
  maxPlayers: number
  paintTarget: number
  powerUpsEnabled: boolean
  friendlyFire: boolean
  gameMode: GameMode
}

export enum GamePlatform {
  WEB = 'web',
  FLUTTER = 'flutter',
  UNITY_WEBGL = 'unity_webgl',
  UNITY_MOBILE = 'unity_mobile'
}

export enum GameMode {
  PAINT_BATTLE = 'paint_battle',
  TERRITORY_CONTROL = 'territory_control',
  PAINT_RACE = 'paint_race',
  TEAM_DEATHMATCH = 'team_deathmatch'
}

export enum RoomStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export interface MultiplayerEvent {
  type: string
  data: any
  playerId?: string
  roomId?: string
  timestamp: number
}

export type EventHandler = (event: MultiplayerEvent) => void

class MultiplayerManager {
  private socket: Socket | null = null
  private eventHandlers: Map<string, EventHandler[]> = new Map()
  private currentRoom: GameRoom | null = null
  private currentPlayer: Player | null = null
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeSocket()
  }

  private initializeSocket() {
    // 환경에 따라 서버 URL 결정
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'wss://ppituruppaturu.com'
      : 'ws://localhost:8000'

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    if (!this.socket) return

    // 연결 이벤트
    this.socket.on('connect', () => {
      console.log('[Multiplayer] Connected to server')
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      this.emit('connection_established', {})
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Multiplayer] Disconnected:', reason)
      this.connectionState = 'disconnected'
      this.emit('connection_lost', { reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Multiplayer] Connection error:', error)
      this.connectionState = 'error'
      this.emit('connection_error', { error: error.message })
    })

    // 게임 이벤트 리스너
    this.socket.on('room_joined', (data) => {
      this.currentRoom = data.room
      this.currentPlayer = data.player
      this.emit('room_joined', data)
    })

    this.socket.on('room_left', (data) => {
      this.currentRoom = null
      this.emit('room_left', data)
    })

    this.socket.on('player_joined', (data) => {
      if (this.currentRoom) {
        this.currentRoom.players.push(data.player)
        this.emit('player_joined', data)
      }
    })

    this.socket.on('player_left', (data) => {
      if (this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter(
          p => p.id !== data.playerId
        )
        this.emit('player_left', data)
      }
    })

    this.socket.on('game_started', (data) => {
      if (this.currentRoom) {
        this.currentRoom.status = RoomStatus.IN_PROGRESS
        this.emit('game_started', data)
      }
    })

    this.socket.on('game_ended', (data) => {
      if (this.currentRoom) {
        this.currentRoom.status = RoomStatus.FINISHED
        this.emit('game_ended', data)
      }
    })

    this.socket.on('player_update', (data) => {
      this.updatePlayerState(data.playerId, data.state)
      this.emit('player_update', data)
    })

    this.socket.on('paint_update', (data) => {
      this.emit('paint_update', data)
    })

    this.socket.on('powerup_spawned', (data) => {
      this.emit('powerup_spawned', data)
    })

    this.socket.on('powerup_collected', (data) => {
      this.emit('powerup_collected', data)
    })

    // 채팅 이벤트
    this.socket.on('chat_message', (data) => {
      this.emit('chat_message', data)
    })

    // 에러 이벤트
    this.socket.on('error', (data) => {
      console.error('[Multiplayer] Server error:', data)
      this.emit('server_error', data)
    })
  }

  // Public API

  /**
   * 서버에 연결
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'))
        return
      }

      if (this.connectionState === 'connected') {
        resolve()
        return
      }

      this.connectionState = 'connecting'

      const onConnect = () => {
        this.socket!.off('connect', onConnect)
        this.socket!.off('connect_error', onError)
        resolve()
      }

      const onError = (error: Error) => {
        this.socket!.off('connect', onConnect)
        this.socket!.off('connect_error', onError)
        reject(error)
      }

      this.socket.on('connect', onConnect)
      this.socket.on('connect_error', onError)
      this.socket.connect()
    })
  }

  /**
   * 서버 연결 해제
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.connectionState = 'disconnected'
      this.currentRoom = null
      this.currentPlayer = null
    }
  }

  /**
   * 게임 방 생성
   */
  createRoom(settings: GameSettings): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.connectionState !== 'connected') {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('create_room', settings, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room
          resolve(response.room)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 게임 방 참가
   */
  joinRoom(roomId: string, playerName: string, platform: GamePlatform): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.connectionState !== 'connected') {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('join_room', { roomId, playerName, platform }, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room
          this.currentPlayer = response.player
          resolve(response.room)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 게임 방 나가기
   */
  leaveRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentRoom) {
        resolve()
        return
      }

      this.socket.emit('leave_room', {}, (response: any) => {
        if (response.success) {
          this.currentRoom = null
          this.currentPlayer = null
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 사용 가능한 방 목록 조회
   */
  getRoomList(): Promise<GameRoom[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.connectionState !== 'connected') {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('get_rooms', {}, (response: any) => {
        if (response.success) {
          resolve(response.rooms)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 게임 시작 (호스트만)
   */
  startGame(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentRoom) {
        reject(new Error('Not in a room'))
        return
      }

      this.socket.emit('start_game', {}, (response: any) => {
        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  /**
   * 플레이어 상태 업데이트 전송
   */
  updatePlayerState(position: { x: number; y: number }, paintCoverage: number, score: number) {
    if (!this.socket || !this.currentPlayer) return

    const state = {
      position,
      paintCoverage,
      score,
      timestamp: Date.now()
    }

    this.socket.emit('player_update', state)

    // 로컬 플레이어 상태 업데이트
    if (this.currentPlayer) {
      this.currentPlayer.position = position
      this.currentPlayer.paintCoverage = paintCoverage
      this.currentPlayer.score = score
      this.currentPlayer.lastUpdate = Date.now()
    }
  }

  /**
   * 페인트 액션 전송
   */
  sendPaintAction(startPos: { x: number; y: number }, endPos: { x: number; y: number }, color: string) {
    if (!this.socket) return

    this.socket.emit('paint_action', {
      startPos,
      endPos,
      color,
      timestamp: Date.now()
    })
  }

  /**
   * 파워업 수집 알림
   */
  collectPowerup(powerupId: string, type: string) {
    if (!this.socket) return

    this.socket.emit('collect_powerup', {
      powerupId,
      type,
      timestamp: Date.now()
    })
  }

  /**
   * 채팅 메시지 전송
   */
  sendChatMessage(message: string) {
    if (!this.socket) return

    this.socket.emit('chat_message', {
      message,
      timestamp: Date.now()
    })
  }

  /**
   * 이벤트 핸들러 등록
   */
  on(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * 이벤트 핸들러 제거
   */
  off(eventType: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 이벤트 발생
   */
  private emit(eventType: string, data: any) {
    const event: MultiplayerEvent = {
      type: eventType,
      data,
      playerId: this.currentPlayer?.id,
      roomId: this.currentRoom?.id,
      timestamp: Date.now()
    }

    const handlers = this.eventHandlers.get(eventType) || []
    handlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('Error in event handler:', error)
      }
    })

    // 전체 이벤트 핸들러도 호출
    const allHandlers = this.eventHandlers.get('*') || []
    allHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('Error in global event handler:', error)
      }
    })
  }

  /**
   * 플레이어 상태 업데이트 (내부용)
   */
  private updatePlayerState(playerId: string, state: any) {
    if (!this.currentRoom) return

    const player = this.currentRoom.players.find(p => p.id === playerId)
    if (player) {
      Object.assign(player, state)
      player.lastUpdate = Date.now()
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.connectionState === 'connected'
  }

  get currentRoomInfo(): GameRoom | null {
    return this.currentRoom
  }

  get currentPlayerInfo(): Player | null {
    return this.currentPlayer
  }

  get connectionStatus(): string {
    return this.connectionState
  }
}

// 싱글톤 인스턴스
let multiplayerManagerInstance: MultiplayerManager | null = null;

export const getMultiplayerManager = (): MultiplayerManager => {
  if (typeof window === 'undefined') {
    return {
      on: () => {},
      off: () => {},
      connect: () => Promise.resolve(),
      disconnect: () => {},
      createRoom: () => Promise.reject(new Error('Server-side')),
      joinRoom: () => Promise.reject(new Error('Server-side')),
      leaveRoom: () => Promise.resolve(),
      getRoomList: () => Promise.resolve([]),
      startGame: () => Promise.reject(new Error('Server-side')),
      updatePlayerState: () => {},
      sendPaintAction: () => {},
      collectPowerup: () => {},
      sendChatMessage: () => {},
      isConnected: false,
      currentRoomInfo: null,
      currentPlayerInfo: null,
      connectionStatus: 'disconnected',
    } as any;
  }
  if (!multiplayerManagerInstance) {
    multiplayerManagerInstance = new MultiplayerManager();
  }
  return multiplayerManagerInstance;
};

// React Hook
export function useMultiplayer() {
  const multiplayerManager = getMultiplayerManager();
  const [isConnected, setIsConnected] = React.useState(multiplayerManager.isConnected)
  const [currentRoom, setCurrentRoom] = React.useState(multiplayerManager.currentRoomInfo)
  const [currentPlayer, setCurrentPlayer] = React.useState(multiplayerManager.currentPlayerInfo)

  React.useEffect(() => {
    const handleConnectionChange = () => {
      setIsConnected(multiplayerManager.isConnected)
    }

    const handleRoomChange = () => {
      setCurrentRoom(multiplayerManager.currentRoomInfo)
      setCurrentPlayer(multiplayerManager.currentPlayerInfo)
    }

    multiplayerManager.on('connection_established', handleConnectionChange)
    multiplayerManager.on('connection_lost', handleConnectionChange)
    multiplayerManager.on('room_joined', handleRoomChange)
    multiplayerManager.on('room_left', handleRoomChange)

    return () => {
      multiplayerManager.off('connection_established', handleConnectionChange)
      multiplayerManager.off('connection_lost', handleConnectionChange)
      multiplayerManager.off('room_joined', handleRoomChange)
      multiplayerManager.off('room_left', handleRoomChange)
    }
  }, [multiplayerManager])

  return {
    isConnected,
    currentRoom,
    currentPlayer,
    connect: multiplayerManager.connect.bind(multiplayerManager),
    disconnect: multiplayerManager.disconnect.bind(multiplayerManager),
    createRoom: multiplayerManager.createRoom.bind(multiplayerManager),
    joinRoom: multiplayerManager.joinRoom.bind(multiplayerManager),
    leaveRoom: multiplayerManager.leaveRoom.bind(multiplayerManager),
    getRoomList: multiplayerManager.getRoomList.bind(multiplayerManager),
    startGame: multiplayerManager.startGame.bind(multiplayerManager),
    updatePlayerState: multiplayerManager.updatePlayerState.bind(multiplayerManager),
    sendPaintAction: multiplayerManager.sendPaintAction.bind(multiplayerManager),
    collectPowerup: multiplayerManager.collectPowerup.bind(multiplayerManager),
    sendChatMessage: multiplayerManager.sendChatMessage.bind(multiplayerManager),
    on: multiplayerManager.on.bind(multiplayerManager),
    off: multiplayerManager.off.bind(multiplayerManager)
  }
}

// React import for TypeScript
import React from 'react'

export default multiplayerManager