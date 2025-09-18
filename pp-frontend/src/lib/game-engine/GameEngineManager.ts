import Phaser from 'phaser'
import { GameConfig, GameType, GameState, GamePlayer, NetworkMessage } from './types'
import { PhysicsBattleRoyaleScene } from './scenes/PhysicsBattleRoyaleScene'
import { PuzzleRaceScene } from './scenes/PuzzleRaceScene'
import { RhythmActionScene } from './scenes/RhythmActionScene'
import { NetworkManager } from './NetworkManager'
import { AudioManager } from './AudioManager'
import { InputManager } from './InputManager'

interface GameEngineManagerConfig {
  parent: HTMLElement
  gameType: GameType
  config: Partial<GameConfig>
  onGameEnd?: (score: number) => void
  onError?: (error: Error) => void
}

export class GameEngineManager {
  private game: Phaser.Game | null = null
  private networkManager: NetworkManager
  private audioManager: AudioManager
  private inputManager: InputManager
  private gameState: GameState
  private config: GameConfig

  constructor(private managerConfig: GameEngineManagerConfig) {
    // 기본 게임 설정 with 사용자 설정 오버라이드
    this.config = {
      width: 800,
      height: 600,
      autoStart: false,
      maxPlayers: 4,
      gameMode: 'singleplayer',
      difficulty: 'medium',
      enablePhysics: true,
      enableAudio: true,
      enableParticles: true,
      ...managerConfig.config
    }

    // 매니저들 초기화
    this.networkManager = new NetworkManager()
    this.audioManager = new AudioManager()
    this.inputManager = new InputManager()

    // 초기 게임 상태
    this.gameState = {
      status: 'idle',
      currentPlayers: [],
      gameObjects: {},
      score: {}
    }
  }

  async initialize(): Promise<void> {
    try {
      // 매니저들 초기화
      await this.audioManager.initialize()
      await this.inputManager.initialize()

      if (this.config.gameMode === 'multiplayer') {
        await this.networkManager.initialize()
      }

      // Phaser 게임 설정
      const phaserConfig: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: this.config.width,
        height: this.config.height,
        parent: this.managerConfig.parent,
        backgroundColor: '#1a1a2e',
        physics: this.config.enablePhysics ? {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 0.8 },
            debug: process.env.NODE_ENV === 'development'
          }
        } : undefined,
        scene: this.createGameScenes(),
        callbacks: {
          postBoot: this.onGameReady.bind(this)
        }
      }

      // Phaser 게임 인스턴스 생성
      this.game = new Phaser.Game(phaserConfig)
      this.gameState.status = 'loading'

    } catch (error) {
      this.handleError(new Error(`게임 초기화 실패: ${error}`))
    }
  }

  private createGameScenes(): Phaser.Types.Scenes.CreateSceneFromObjectConfig[] {
    const scenes = []

    switch (this.managerConfig.gameType) {
      case 'physics_battle_royale':
        scenes.push(new PhysicsBattleRoyaleScene(this))
        break
      case 'puzzle_race':
        scenes.push(new PuzzleRaceScene(this))
        break
      case 'rhythm_action':
        scenes.push(new RhythmActionScene(this))
        break
      default:
        // 기본 게임 씬
        scenes.push(new PhysicsBattleRoyaleScene(this))
    }

    return scenes
  }

  private onGameReady(): void {
    this.gameState.status = 'ready'
    console.log(`게임 준비 완료: ${this.managerConfig.gameType}`)
  }

  async startGame(): Promise<void> {
    if (this.gameState.status !== 'ready') {
      throw new Error('게임이 준비되지 않았습니다')
    }

    try {
      this.gameState.status = 'playing'

      if (this.config.gameMode === 'multiplayer') {
        await this.networkManager.joinGame(this.managerConfig.gameType)
      }

      // 현재 활성 씬에 게임 시작 신호
      const currentScene = this.game?.scene.getScenes(true)[0]
      if (currentScene && 'startGame' in currentScene) {
        (currentScene as any).startGame()
      }

      console.log('게임 시작!')
    } catch (error) {
      this.handleError(new Error(`게임 시작 실패: ${error}`))
    }
  }

  pauseGame(): void {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused'
      this.game?.scene.pause()
      this.audioManager.pause()
    }
  }

  resumeGame(): void {
    if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing'
      this.game?.scene.resume()
      this.audioManager.resume()
    }
  }

  restartGame(): void {
    this.gameState.status = 'ready'
    this.gameState.score = {}
    this.gameState.gameObjects = {}

    // 현재 씬 재시작
    const currentScene = this.game?.scene.getScenes(true)[0]
    if (currentScene) {
      currentScene.scene.restart()
    }
  }

  endGame(finalScore: number): void {
    this.gameState.status = 'ended'
    this.audioManager.stop()

    if (this.config.gameMode === 'multiplayer') {
      this.networkManager.leaveGame()
    }

    this.managerConfig.onGameEnd?.(finalScore)
  }

  destroy(): void {
    this.audioManager.destroy()
    this.inputManager.destroy()
    this.networkManager.destroy()

    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }

  // Getter 메서드들
  getGameState(): GameState {
    return { ...this.gameState }
  }

  getConfig(): GameConfig {
    return { ...this.config }
  }

  getGame(): Phaser.Game | null {
    return this.game
  }

  getNetworkManager(): NetworkManager {
    return this.networkManager
  }

  getAudioManager(): AudioManager {
    return this.audioManager
  }

  getInputManager(): InputManager {
    return this.inputManager
  }

  // 네트워크 메시지 처리
  handleNetworkMessage(message: NetworkMessage): void {
    const currentScene = this.game?.scene.getScenes(true)[0]
    if (currentScene && 'onNetworkMessage' in currentScene) {
      (currentScene as any).onNetworkMessage(message)
    }
  }

  // 플레이어 관리
  addPlayer(player: GamePlayer): void {
    this.gameState.currentPlayers.push(player)
  }

  removePlayer(playerId: string): void {
    this.gameState.currentPlayers = this.gameState.currentPlayers.filter(
      p => p.id !== playerId
    )
  }

  updatePlayerScore(playerId: string, score: number): void {
    this.gameState.score[playerId] = score
    const player = this.gameState.currentPlayers.find(p => p.id === playerId)
    if (player) {
      player.score = score
    }
  }

  private handleError(error: Error): void {
    console.error('GameEngineManager Error:', error)
    this.managerConfig.onError?.(error)
  }
}