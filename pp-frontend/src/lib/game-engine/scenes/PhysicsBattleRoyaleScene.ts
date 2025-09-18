import Phaser from 'phaser'
import { GameEngineManager } from '../GameEngineManager'
import { GamePlayer, NetworkMessage } from '../types'

export class PhysicsBattleRoyaleScene extends Phaser.Scene {
  private gameManager: GameEngineManager
  private players: Map<string, Phaser.GameObjects.GameObject> = new Map()
  private obstacles: Phaser.GameObjects.Group | null = null
  private powerUps: Phaser.GameObjects.Group | null = null
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

  // 게임 상태
  private gameStarted = false
  private gameTimer = 0
  private maxGameTime = 300 // 5분
  private shrinkingZone: Phaser.GameObjects.Graphics | null = null
  private currentZoneRadius = 800
  private maxZoneRadius = 800
  private minZoneRadius = 100

  // UI 요소
  private scoreText: Phaser.GameObjects.Text | null = null
  private timerText: Phaser.GameObjects.Text | null = null
  private playerCountText: Phaser.GameObjects.Text | null = null
  private miniMap: Phaser.GameObjects.Graphics | null = null

  constructor(gameManager: GameEngineManager) {
    super({ key: 'PhysicsBattleRoyaleScene' })
    this.gameManager = gameManager
  }

  preload(): void {
    // 기본 색상으로 임시 텍스처 생성
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    this.load.image('obstacle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    this.load.image('powerup', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')

    console.log('PhysicsBattleRoyaleScene: 에셋 로딩 완료')
  }

  create(): void {
    // 월드 경계 설정
    this.matter.world.setBounds(0, 0, 1600, 1200, 32, true, true, false, true)

    // 배경 생성
    this.createBackground()

    // 장애물 생성
    this.createObstacles()

    // 파워업 시스템 생성
    this.createPowerUpSystem()

    // UI 생성
    this.createUI()

    // 축소 구역 시스템 생성
    this.createShrinkingZone()

    // 파티클 시스템 생성
    this.createParticleSystem()

    // 입력 처리
    this.setupInput()

    // 카메라 설정
    this.setupCamera()

    console.log('PhysicsBattleRoyaleScene: 씬 생성 완료')
  }

  private createBackground(): void {
    // 그라데이션 배경
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483)
    graphics.fillRect(0, 0, 1600, 1200)

    // 격자 패턴
    graphics.lineStyle(1, 0x333366, 0.3)
    for (let x = 0; x < 1600; x += 50) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, 1200)
    }
    for (let y = 0; y < 1200; y += 50) {
      graphics.moveTo(0, y)
      graphics.lineTo(1600, y)
    }
    graphics.strokePath()
  }

  private createObstacles(): void {
    this.obstacles = this.add.group()

    // 다양한 크기와 모양의 장애물 생성
    const obstacleConfigs = [
      { x: 200, y: 200, width: 100, height: 20 }, // 플랫폼
      { x: 400, y: 300, width: 80, height: 80 }, // 정사각형 블록
      { x: 600, y: 400, width: 120, height: 30 }, // 긴 플랫폼
      { x: 800, y: 250, width: 60, height: 60 }, // 작은 블록
      { x: 1000, y: 350, width: 140, height: 25 }, // 점프대
      { x: 1200, y: 300, width: 90, height: 90 }, // 큰 블록
      { x: 300, y: 600, width: 100, height: 100 }, // 중앙 장애물
      { x: 700, y: 700, width: 80, height: 40 }, // 엄폐물
      { x: 1100, y: 800, width: 120, height: 20 }, // 다리
      { x: 500, y: 900, width: 160, height: 30 } // 긴 벽
    ]

    obstacleConfigs.forEach((config, index) => {
      const obstacle = this.matter.add.rectangle(
        config.x, config.y, config.width, config.height,
        { isStatic: true, label: `obstacle_${index}` }
      )

      // 시각적 표현
      const graphics = this.add.graphics()
      graphics.fillStyle(0x666699)
      graphics.fillRoundedRect(
        config.x - config.width / 2,
        config.y - config.height / 2,
        config.width, config.height, 8
      )
      graphics.lineStyle(2, 0x9999cc, 1)
      graphics.strokeRoundedRect(
        config.x - config.width / 2,
        config.y - config.height / 2,
        config.width, config.height, 8
      )

      this.obstacles!.add(graphics)
    })
  }

  private createPowerUpSystem(): void {
    this.powerUps = this.add.group()

    // 파워업 스폰 위치들
    const spawnPoints = [
      { x: 300, y: 150 }, { x: 500, y: 200 }, { x: 700, y: 180 },
      { x: 900, y: 220 }, { x: 1100, y: 160 }, { x: 350, y: 500 },
      { x: 650, y: 550 }, { x: 950, y: 480 }, { x: 1250, y: 520 }
    ]

    // 초기 파워업 생성
    this.spawnPowerUps(spawnPoints)

    // 주기적 파워업 스폰
    this.time.addEvent({
      delay: 15000, // 15초마다
      callback: () => this.spawnPowerUps(spawnPoints),
      loop: true
    })
  }

  private spawnPowerUps(spawnPoints: Array<{ x: number, y: number }>): void {
    if (!this.powerUps) return

    // 기존 파워업 제거
    this.powerUps.clear(true, true)

    const powerUpTypes = ['speed', 'shield', 'jump', 'damage']

    spawnPoints.forEach(point => {
      if (Math.random() < 0.6) { // 60% 확률로 스폰
        const type = Phaser.Utils.Array.GetRandom(powerUpTypes)
        const powerUp = this.createPowerUp(point.x, point.y, type)
        this.powerUps!.add(powerUp)
      }
    })
  }

  private createPowerUp(x: number, y: number, type: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    // 파워업 색상 매핑
    const colors = {
      speed: 0x00ff00,   // 초록 - 스피드
      shield: 0x0088ff,  // 파랑 - 보호막
      jump: 0xffaa00,    // 주황 - 점프
      damage: 0xff0066   // 분홍 - 데미지
    }

    // 파워업 시각적 효과
    const glow = this.add.graphics()
    glow.fillStyle(colors[type as keyof typeof colors], 0.3)
    glow.fillCircle(0, 0, 25)

    const core = this.add.graphics()
    core.fillStyle(colors[type as keyof typeof colors])
    core.fillCircle(0, 0, 15)

    container.add([glow, core])

    // 회전 애니메이션
    this.tweens.add({
      targets: container,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    })

    // 맥박 효과
    this.tweens.add({
      targets: glow,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 메타데이터 저장
    (container as any).powerUpType = type

    return container
  }

  private createShrinkingZone(): void {
    this.shrinkingZone = this.add.graphics()
    this.updateShrinkingZone()

    // 5초 후부터 축소 시작, 30초마다 축소
    this.time.delayedCall(5000, () => {
      this.time.addEvent({
        delay: 30000, // 30초마다
        callback: () => this.shrinkZone(),
        repeat: 8 // 최대 8번 축소
      })
    })
  }

  private updateShrinkingZone(): void {
    if (!this.shrinkingZone) return

    this.shrinkingZone.clear()

    // 안전 구역 (초록)
    this.shrinkingZone.fillStyle(0x00ff00, 0.1)
    this.shrinkingZone.fillCircle(800, 600, this.currentZoneRadius)

    // 경고 구역 경계선 (빨강)
    this.shrinkingZone.lineStyle(4, 0xff0000, 0.8)
    this.shrinkingZone.strokeCircle(800, 600, this.currentZoneRadius)
  }

  private shrinkZone(): void {
    if (this.currentZoneRadius <= this.minZoneRadius) return

    const newRadius = Math.max(
      this.minZoneRadius,
      this.currentZoneRadius - (this.maxZoneRadius - this.minZoneRadius) / 8
    )

    // 축소 애니메이션
    this.tweens.add({
      targets: this,
      currentZoneRadius: newRadius,
      duration: 5000,
      ease: 'Power2.easeInOut',
      onUpdate: () => {
        this.updateShrinkingZone()
        this.checkPlayersInZone()
      }
    })

    // 축소 경고 표시
    this.showZoneShrinkWarning()
  }

  private checkPlayersInZone(): void {
    this.players.forEach((playerObj, playerId) => {
      const distance = Phaser.Math.Distance.Between(
        (playerObj as any).x, (playerObj as any).y, 800, 600
      )

      if (distance > this.currentZoneRadius) {
        // 구역 밖 플레이어에게 데미지
        this.dealZoneDamage(playerId, playerObj)
      }
    })
  }

  private dealZoneDamage(playerId: string, playerObj: Phaser.GameObjects.GameObject): void {
    // 데미지 이펙트
    if (this.particles) {
      this.particles.emitParticleAt((playerObj as any).x, (playerObj as any).y, 10)
    }

    // 플레이어 체력 감소 (실제 구현 시 플레이어 상태에 따라)
    console.log(`플레이어 ${playerId}가 구역 밖에서 데미지를 받았습니다`)
  }

  private showZoneShrinkWarning(): void {
    const warningText = this.add.text(800, 100, '⚠️ 구역이 축소됩니다!', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 깜빡임 효과
    this.tweens.add({
      targets: warningText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: 5,
      onComplete: () => warningText.destroy()
    })
  }

  private createParticleSystem(): void {
    // 환경 파티클 (먼지, 스파크 등)
    this.particles = this.add.particles(0, 0, 'player', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1000,
      tint: 0xff6600
    })
  }

  private createUI(): void {
    // 점수 표시
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 5 }
    })

    // 타이머 표시
    this.timerText = this.add.text(20, 60, 'Time: 5:00', {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 5 }
    })

    // 플레이어 수 표시
    this.playerCountText = this.add.text(20, 100, 'Players: 1/20', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 5 }
    })

    // 미니맵
    this.createMiniMap()
  }

  private createMiniMap(): void {
    const mapSize = 150
    const mapX = this.cameras.main.width - mapSize - 20
    const mapY = 20

    // 미니맵 배경
    this.miniMap = this.add.graphics()
    this.miniMap.fillStyle(0x000000, 0.5)
    this.miniMap.fillRoundedRect(mapX, mapY, mapSize, mapSize, 8)
    this.miniMap.lineStyle(2, 0xffffff, 0.8)
    this.miniMap.strokeRoundedRect(mapX, mapY, mapSize, mapSize, 8)

    // 미니맵 업데이트를 위한 컨테이너
    this.miniMap.setScrollFactor(0) // UI 고정
  }

  private setupInput(): void {
    const inputManager = this.gameManager.getInputManager()

    // 움직임 입력 처리
    inputManager.on('move_up', (data: any) => {
      if (data.pressed) this.handlePlayerMove('up')
    })

    inputManager.on('move_down', (data: any) => {
      if (data.pressed) this.handlePlayerMove('down')
    })

    inputManager.on('move_left', (data: any) => {
      if (data.pressed) this.handlePlayerMove('left')
    })

    inputManager.on('move_right', (data: any) => {
      if (data.pressed) this.handlePlayerMove('right')
    })

    // 액션 입력 처리
    inputManager.on('action_primary', (data: any) => {
      if (data.pressed) this.handlePlayerAction('primary')
    })
  }

  private handlePlayerMove(direction: string): void {
    // 로컬 플레이어 이동 처리
    const networkManager = this.gameManager.getNetworkManager()

    if (networkManager.isGameConnected()) {
      networkManager.sendGameAction('move', { direction })
    } else {
      // 싱글플레이어 모드
      this.moveLocalPlayer(direction)
    }
  }

  private handlePlayerAction(action: string): void {
    console.log(`플레이어 액션: ${action}`)

    const networkManager = this.gameManager.getNetworkManager()

    if (networkManager.isGameConnected()) {
      networkManager.sendGameAction('action', { action })
    }
  }

  private moveLocalPlayer(direction: string): void {
    // 로컬 플레이어 이동 로직 (데모용)
    console.log(`로컬 플레이어 이동: ${direction}`)
  }

  private setupCamera(): void {
    // 카메라 스무스 팔로우 설정
    this.cameras.main.setLerp(0.05, 0.05)
    this.cameras.main.setZoom(1)
  }

  // 외부에서 호출되는 메서드들
  startGame(): void {
    this.gameStarted = true
    console.log('PhysicsBattleRoyale 게임 시작!')

    // 게임 시작 사운드
    this.gameManager.getAudioManager().playSound('game_start')

    // 타이머 시작
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTimer++
        this.updateTimer()
      },
      loop: true
    })
  }

  onNetworkMessage(message: NetworkMessage): void {
    switch (message.data.action) {
      case 'move':
        this.handleNetworkPlayerMove(message.playerId!, message.data.direction)
        break
      case 'action':
        this.handleNetworkPlayerAction(message.playerId!, message.data.action)
        break
      default:
        console.log('알 수 없는 네트워크 메시지:', message)
    }
  }

  private handleNetworkPlayerMove(playerId: string, direction: string): void {
    console.log(`네트워크 플레이어 ${playerId} 이동: ${direction}`)
    // 실제 플레이어 오브젝트 이동 로직
  }

  private handleNetworkPlayerAction(playerId: string, action: string): void {
    console.log(`네트워크 플레이어 ${playerId} 액션: ${action}`)
  }

  private updateTimer(): void {
    if (!this.timerText) return

    const minutes = Math.floor((this.maxGameTime - this.gameTimer) / 60)
    const seconds = (this.maxGameTime - this.gameTimer) % 60

    this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`)

    if (this.gameTimer >= this.maxGameTime) {
      this.endGame()
    }
  }

  private endGame(): void {
    this.gameStarted = false
    console.log('게임 종료!')

    // 게임 종료 처리
    this.gameManager.endGame(100) // 임시 점수
  }

  update(time: number, delta: number): void {
    if (!this.gameStarted) return

    // 게임 로직 업데이트
    this.updateMiniMap()
  }

  private updateMiniMap(): void {
    if (!this.miniMap) return

    // 미니맵 갱신 로직
    // 플레이어 위치, 구역 상태 등을 미니맵에 표시
  }
}