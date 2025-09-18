import { io, Socket } from 'socket.io-client'
import { GameType, NetworkMessage, GamePlayer, GameRoom } from './types'

export class NetworkManager {
  private socket: Socket | null = null
  private isConnected = false
  private currentRoom: GameRoom | null = null
  private playerId: string | null = null

  async initialize(): Promise<void> {
    try {
      // Socket.IO 연결 설정
      this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      // 이벤트 리스너 등록
      this.setupEventListeners()

      // 연결 대기
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('서버 연결 시간 초과'))
        }, 10000)

        this.socket!.on('connect', () => {
          clearTimeout(timeout)
          this.isConnected = true
          console.log('서버에 연결되었습니다')
          resolve()
        })

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout)
          reject(new Error(`연결 실패: ${error.message}`))
        })
      })

      // 플레이어 ID 요청
      await this.requestPlayerId()

    } catch (error) {
      console.error('NetworkManager 초기화 실패:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    // 연결 이벤트
    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('서버 연결됨')
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      console.log('서버 연결 끊김:', reason)
    })

    // 게임 관련 이벤트
    this.socket.on('player_joined', (player: GamePlayer) => {
      console.log('플레이어 참가:', player)
      this.onPlayerJoined?.(player)
    })

    this.socket.on('player_left', (playerId: string) => {
      console.log('플레이어 퇴장:', playerId)
      this.onPlayerLeft?.(playerId)
    })

    this.socket.on('game_started', (gameData: any) => {
      console.log('게임 시작:', gameData)
      this.onGameStarted?.(gameData)
    })

    this.socket.on('game_update', (update: any) => {
      this.onGameUpdate?.(update)
    })

    this.socket.on('game_ended', (result: any) => {
      console.log('게임 종료:', result)
      this.onGameEnded?.(result)
    })

    // 에러 처리
    this.socket.on('error', (error: any) => {
      console.error('서버 에러:', error)
      this.onError?.(new Error(error.message || '서버 에러'))
    })
  }

  private async requestPlayerId(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('소켓이 초기화되지 않았습니다'))
        return
      }

      this.socket.emit('request_player_id')

      this.socket.once('player_id_assigned', (playerId: string) => {
        this.playerId = playerId
        console.log('플레이어 ID 할당됨:', playerId)
        resolve()
      })

      setTimeout(() => {
        reject(new Error('플레이어 ID 할당 시간 초과'))
      }, 5000)
    })
  }

  async joinGame(gameType: GameType, roomId?: string): Promise<GameRoom> {
    if (!this.isConnected || !this.socket) {
      throw new Error('서버에 연결되지 않았습니다')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_game', { gameType, roomId })

      this.socket!.once('room_joined', (room: GameRoom) => {
        this.currentRoom = room
        console.log('방에 참가했습니다:', room)
        resolve(room)
      })

      this.socket!.once('join_failed', (error: string) => {
        reject(new Error(error))
      })

      setTimeout(() => {
        reject(new Error('방 참가 시간 초과'))
      }, 10000)
    })
  }

  async createRoom(gameType: GameType, roomName: string, maxPlayers: number, isPrivate = false): Promise<GameRoom> {
    if (!this.isConnected || !this.socket) {
      throw new Error('서버에 연결되지 않았습니다')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create_room', {
        gameType,
        roomName,
        maxPlayers,
        isPrivate
      })

      this.socket!.once('room_created', (room: GameRoom) => {
        this.currentRoom = room
        console.log('방이 생성되었습니다:', room)
        resolve(room)
      })

      this.socket!.once('create_failed', (error: string) => {
        reject(new Error(error))
      })

      setTimeout(() => {
        reject(new Error('방 생성 시간 초과'))
      }, 10000)
    })
  }

  leaveGame(): void {
    if (this.socket && this.currentRoom) {
      this.socket.emit('leave_room', { roomId: this.currentRoom.id })
      this.currentRoom = null
    }
  }

  sendGameAction(action: string, data: any): void {
    if (!this.isConnected || !this.socket || !this.currentRoom) {
      console.warn('게임 액션 전송 실패: 연결되지 않음')
      return
    }

    const message: NetworkMessage = {
      type: 'player_action',
      roomId: this.currentRoom.id,
      playerId: this.playerId!,
      data: { action, ...data },
      timestamp: Date.now()
    }

    this.socket.emit('game_action', message)
  }

  sendChatMessage(message: string): void {
    if (!this.isConnected || !this.socket || !this.currentRoom) {
      console.warn('채팅 메시지 전송 실패: 연결되지 않음')
      return
    }

    this.socket.emit('chat_message', {
      roomId: this.currentRoom.id,
      playerId: this.playerId,
      message,
      timestamp: Date.now()
    })
  }

  // 이벤트 콜백들 - 외부에서 설정
  onPlayerJoined?: (player: GamePlayer) => void
  onPlayerLeft?: (playerId: string) => void
  onGameStarted?: (gameData: any) => void
  onGameUpdate?: (update: any) => void
  onGameEnded?: (result: any) => void
  onChatMessage?: (message: any) => void
  onError?: (error: Error) => void

  // Getter 메서드들
  getPlayerId(): string | null {
    return this.playerId
  }

  getCurrentRoom(): GameRoom | null {
    return this.currentRoom
  }

  isGameConnected(): boolean {
    return this.isConnected && this.socket !== null
  }

  getRoomId(): string | null {
    return this.currentRoom?.id || null
  }

  // 연결 상태 확인
  async ping(): Promise<number> {
    if (!this.socket || !this.isConnected) {
      throw new Error('연결되지 않았습니다')
    }

    const start = Date.now()

    return new Promise((resolve, reject) => {
      this.socket!.emit('ping')

      this.socket!.once('pong', () => {
        const latency = Date.now() - start
        resolve(latency)
      })

      setTimeout(() => {
        reject(new Error('핑 시간 초과'))
      }, 5000)
    })
  }

  destroy(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnected = false
    this.currentRoom = null
    this.playerId = null
  }
}