import Phaser from 'phaser'
import { GameEngineManager } from '../GameEngineManager'
import { NetworkMessage } from '../types'

interface PuzzlePiece {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  color: number
  shape: 'square' | 'circle' | 'triangle'
  isPlaced: boolean
}

export class PuzzleRaceScene extends Phaser.Scene {
  private gameManager: GameEngineManager
  private puzzlePieces: Map<string, Phaser.GameObjects.Container> = new Map()
  private puzzleData: PuzzlePiece[] = []
  private targetSlots: Phaser.GameObjects.Graphics[] = []

  // 게임 상태
  private gameStarted = false
  private gameTimer = 0
  private maxGameTime = 180 // 3분
  private currentLevel = 1
  private totalScore = 0
  private combo = 0
  private maxCombo = 0

  // UI 요소
  private scoreText: Phaser.GameObjects.Text | null = null
  private timerText: Phaser.GameObjects.Text | null = null
  private levelText: Phaser.GameObjects.Text | null = null
  private comboText: Phaser.GameObjects.Text | null = null
  private progressBar: Phaser.GameObjects.Graphics | null = null

  // 인터랙션
  private selectedPiece: Phaser.GameObjects.Container | null = null
  private dragData: { startX: number, startY: number } | null = null

  constructor(gameManager: GameEngineManager) {
    super({ key: 'PuzzleRaceScene' })
    this.gameManager = gameManager
  }

  preload(): void {
    // 기본 도형들을 코드로 생성
    this.createShapeTextures()
    console.log('PuzzleRaceScene: 에셋 로딩 완료')
  }

  private createShapeTextures(): void {
    // 정사각형 텍스처 생성
    const squareGraphics = this.add.graphics()
    squareGraphics.fillStyle(0xffffff)
    squareGraphics.fillRect(0, 0, 50, 50)
    squareGraphics.generateTexture('square', 50, 50)
    squareGraphics.destroy()

    // 원형 텍스처 생성
    const circleGraphics = this.add.graphics()
    circleGraphics.fillStyle(0xffffff)
    circleGraphics.fillCircle(25, 25, 25)
    circleGraphics.generateTexture('circle', 50, 50)
    circleGraphics.destroy()

    // 삼각형 텍스처 생성
    const triangleGraphics = this.add.graphics()
    triangleGraphics.fillStyle(0xffffff)
    triangleGraphics.fillTriangle(25, 5, 5, 45, 45, 45)
    triangleGraphics.generateTexture('triangle', 50, 50)
    triangleGraphics.destroy()
  }

  create(): void {
    // 배경 생성
    this.createBackground()

    // UI 생성
    this.createUI()

    // 퍼즐 영역 생성
    this.createPuzzleArea()

    // 첫 번째 레벨 시작
    this.generateLevel(this.currentLevel)

    // 입력 처리 설정
    this.setupInput()

    console.log('PuzzleRaceScene: 씬 생성 완료')
  }

  private createBackground(): void {
    // 그라데이션 배경
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x2D1B69, 0x11998E, 0x38EF7D, 0xFFE066)
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)

    // 패턴 배경
    const patternSize = 40
    graphics.lineStyle(1, 0xffffff, 0.1)
    for (let x = 0; x < this.cameras.main.width; x += patternSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, this.cameras.main.height)
    }
    for (let y = 0; y < this.cameras.main.height; y += patternSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(this.cameras.main.width, y)
    }
    graphics.strokePath()
  }

  private createUI(): void {
    // 점수 표시
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 15, y: 8 }
    })

    // 타이머 표시
    this.timerText = this.add.text(20, 70, 'Time: 3:00', {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 15, y: 8 }
    })

    // 레벨 표시
    this.levelText = this.add.text(20, 120, 'Level: 1', {
      fontSize: '22px',
      color: '#00ff00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 15, y: 8 }
    })

    // 콤보 표시
    this.comboText = this.add.text(20, 170, 'Combo: 0', {
      fontSize: '20px',
      color: '#ff6600',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 15, y: 8 }
    })

    // 진행도 바
    this.createProgressBar()
  }

  private createProgressBar(): void {
    const barWidth = 300
    const barHeight = 20
    const barX = this.cameras.main.width - barWidth - 20
    const barY = 20

    this.progressBar = this.add.graphics()

    // 배경
    this.progressBar.fillStyle(0x333333, 0.8)
    this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 10)

    // 테두리
    this.progressBar.lineStyle(2, 0xffffff, 0.8)
    this.progressBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 10)

    this.updateProgressBar(0)
  }

  private updateProgressBar(progress: number): void {
    if (!this.progressBar) return

    const barWidth = 300
    const barHeight = 20
    const barX = this.cameras.main.width - barWidth - 20
    const barY = 20

    // 기존 진행도 바 지우기
    this.progressBar.clear()

    // 배경
    this.progressBar.fillStyle(0x333333, 0.8)
    this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 10)

    // 진행도 (0-1 사이 값)
    const fillWidth = barWidth * Math.min(1, Math.max(0, progress))
    if (fillWidth > 0) {
      const color = progress < 0.3 ? 0xff0000 : progress < 0.7 ? 0xffaa00 : 0x00ff00
      this.progressBar.fillStyle(color, 0.8)
      this.progressBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 10)
    }

    // 테두리
    this.progressBar.lineStyle(2, 0xffffff, 0.8)
    this.progressBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 10)
  }

  private createPuzzleArea(): void {
    // 퍼즐 완성 영역 (상단 중앙)
    const puzzleAreaX = this.cameras.main.width / 2
    const puzzleAreaY = 200

    const areaGraphics = this.add.graphics()
    areaGraphics.lineStyle(4, 0xffffff, 0.8)
    areaGraphics.fillStyle(0x000000, 0.3)
    areaGraphics.fillRoundedRect(puzzleAreaX - 150, puzzleAreaY - 100, 300, 200, 15)
    areaGraphics.strokeRoundedRect(puzzleAreaX - 150, puzzleAreaY - 100, 300, 200, 15)

    const areaLabel = this.add.text(puzzleAreaX, puzzleAreaY - 130, 'PUZZLE AREA', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  private generateLevel(level: number): void {
    // 기존 퍼즐 정리
    this.clearPuzzle()

    // 레벨에 따른 퍼즐 복잡도 결정
    const pieceCount = Math.min(4 + level, 12) // 최소 5개, 최대 12개
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080]
    const shapes: Array<'square' | 'circle' | 'triangle'> = ['square', 'circle', 'triangle']

    this.puzzleData = []

    // 목표 슬롯 생성
    this.createTargetSlots(pieceCount)

    // 퍼즐 조각들 생성
    for (let i = 0; i < pieceCount; i++) {
      const piece: PuzzlePiece = {
        id: `piece_${i}`,
        x: 100 + Math.random() * (this.cameras.main.width - 200),
        y: 450 + Math.random() * 150,
        targetX: this.targetSlots[i].x,
        targetY: this.targetSlots[i].y,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
        isPlaced: false
      }

      this.puzzleData.push(piece)
      this.createPuzzlePiece(piece)
    }

    // 레벨 정보 업데이트
    this.levelText?.setText(`Level: ${level}`)
    console.log(`레벨 ${level} 생성 완료: ${pieceCount}개 조각`)
  }

  private createTargetSlots(count: number): void {
    this.targetSlots = []

    const centerX = this.cameras.main.width / 2
    const centerY = 200
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const spacing = 60

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      const x = centerX - (cols - 1) * spacing / 2 + col * spacing
      const y = centerY - (rows - 1) * spacing / 2 + row * spacing

      const slotGraphics = this.add.graphics()
      slotGraphics.x = x
      slotGraphics.y = y
      slotGraphics.lineStyle(3, 0x666666, 0.8)
      slotGraphics.strokeRoundedRect(-25, -25, 50, 50, 8)
      slotGraphics.fillStyle(0x333333, 0.3)
      slotGraphics.fillRoundedRect(-25, -25, 50, 50, 8)

      this.targetSlots.push(slotGraphics)
    }
  }

  private createPuzzlePiece(piece: PuzzlePiece): void {
    const container = this.add.container(piece.x, piece.y)

    // 도형 스프라이트
    const shape = this.add.sprite(0, 0, piece.shape)
    shape.setTint(piece.color)
    shape.setScale(0.8)

    // 글로우 효과
    const glow = this.add.graphics()
    glow.fillStyle(piece.color, 0.3)
    glow.fillCircle(0, 0, 30)

    // 테두리
    const border = this.add.graphics()
    border.lineStyle(2, 0xffffff, 0.8)
    if (piece.shape === 'square') {
      border.strokeRect(-20, -20, 40, 40)
    } else if (piece.shape === 'circle') {
      border.strokeCircle(0, 0, 20)
    } else if (piece.shape === 'triangle') {
      border.strokeTriangle(-20, 15, 20, 15, 0, -15)
    }

    container.add([glow, shape, border])
    container.setSize(50, 50)
    container.setInteractive({ draggable: true })

    // 드래그 이벤트
    container.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      this.selectedPiece = container
      this.dragData = { startX: container.x, startY: container.y }

      // 선택 효과
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200
      })
    })

    container.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      container.x = dragX
      container.y = dragY
    })

    container.on('dragend', (pointer: Phaser.Input.Pointer) => {
      this.handlePieceDrop(container, piece)
      this.selectedPiece = null
      this.dragData = null

      // 크기 복원
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 200
      })
    })

    // 호버 효과
    container.on('pointerover', () => {
      if (this.selectedPiece !== container) {
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150
        })
      }
    })

    container.on('pointerout', () => {
      if (this.selectedPiece !== container) {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150
        })
      }
    })

    this.puzzlePieces.set(piece.id, container)
    (container as any).pieceData = piece
  }

  private handlePieceDrop(container: Phaser.GameObjects.Container, piece: PuzzlePiece): void {
    let closestSlot: Phaser.GameObjects.Graphics | null = null
    let minDistance = Infinity
    const snapDistance = 50

    // 가장 가까운 슬롯 찾기
    for (const slot of this.targetSlots) {
      const distance = Phaser.Math.Distance.Between(
        container.x, container.y, slot.x, slot.y
      )

      if (distance < minDistance && distance < snapDistance) {
        minDistance = distance
        closestSlot = slot
      }
    }

    if (closestSlot && !piece.isPlaced) {
      // 올바른 슬롯 확인 (이 예제에서는 모든 슬롯이 유효)
      const targetIndex = this.targetSlots.indexOf(closestSlot)
      const isCorrect = targetIndex >= 0

      if (isCorrect) {
        // 정확한 배치
        piece.isPlaced = true
        piece.targetX = closestSlot.x
        piece.targetY = closestSlot.y

        // 스냅 애니메이션
        this.tweens.add({
          targets: container,
          x: closestSlot.x,
          y: closestSlot.y,
          duration: 300,
          ease: 'Back.easeOut'
        })

        // 성공 효과
        this.showSuccessEffect(closestSlot.x, closestSlot.y)
        this.gameManager.getAudioManager().playSound('point_scored')

        // 점수 추가
        this.addScore(100 + this.combo * 25)
        this.combo++

        // 퍼즐 완성 확인
        this.checkPuzzleCompletion()

      } else {
        // 잘못된 배치 - 원래 위치로 복원
        this.returnToOriginalPosition(container)
        this.resetCombo()
      }
    } else {
      // 슬롯 범위 밖 - 원래 위치로 복원
      this.returnToOriginalPosition(container)
    }
  }

  private returnToOriginalPosition(container: Phaser.GameObjects.Container): void {
    if (!this.dragData) return

    this.tweens.add({
      targets: container,
      x: this.dragData.startX,
      y: this.dragData.startY,
      duration: 300,
      ease: 'Back.easeOut'
    })
  }

  private showSuccessEffect(x: number, y: number): void {
    // 파티클 효과
    const particles = this.add.particles(x, y, 'circle', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: [0xffff00, 0xff6600, 0xff0066]
    })

    this.time.delayedCall(500, () => {
      particles.destroy()
    })

    // 점수 텍스트 효과
    const scoreText = this.add.text(x, y - 30, `+${100 + this.combo * 25}`, {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: scoreText,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => scoreText.destroy()
    })
  }

  private addScore(points: number): void {
    this.totalScore += points
    this.scoreText?.setText(`Score: ${this.totalScore}`)

    // 스코어 업데이트 효과
    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true
      })
    }
  }

  private resetCombo(): void {
    this.combo = 0
    this.comboText?.setText(`Combo: ${this.combo}`)
  }

  private updateCombo(): void {
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.comboText?.setText(`Combo: ${this.combo}`)

    if (this.combo > 5) {
      // 높은 콤보 효과
      this.comboText?.setColor('#ff0066')
    } else if (this.combo > 2) {
      this.comboText?.setColor('#ff6600')
    } else {
      this.comboText?.setColor('#ffff00')
    }
  }

  private checkPuzzleCompletion(): void {
    const completedPieces = this.puzzleData.filter(piece => piece.isPlaced).length
    const totalPieces = this.puzzleData.length

    // 진행도 업데이트
    this.updateProgressBar(completedPieces / totalPieces)

    if (completedPieces === totalPieces) {
      // 레벨 완료!
      this.completeLevel()
    }
  }

  private completeLevel(): void {
    console.log(`레벨 ${this.currentLevel} 완료!`)

    // 레벨 완료 보너스
    const timeBonus = Math.max(0, (this.maxGameTime - this.gameTimer) * 10)
    const comboBonus = this.maxCombo * 50
    const levelBonus = this.currentLevel * 200

    const totalBonus = timeBonus + comboBonus + levelBonus
    this.addScore(totalBonus)

    // 완료 효과
    this.showLevelCompleteEffect()

    // 다음 레벨 준비
    this.time.delayedCall(2000, () => {
      this.currentLevel++
      this.generateLevel(this.currentLevel)
    })
  }

  private showLevelCompleteEffect(): void {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // 완료 텍스트
    const completeText = this.add.text(centerX, centerY, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // 애니메이션
    completeText.setScale(0)
    this.tweens.add({
      targets: completeText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: completeText,
            alpha: 0,
            duration: 500,
            onComplete: () => completeText.destroy()
          })
        })
      }
    })

    // 파티클 폭발 효과
    const particles = this.add.particles(centerX, centerY, 'circle', {
      scale: { start: 0.5, end: 0 },
      speed: { min: 100, max: 300 },
      alpha: { start: 1, end: 0 },
      lifespan: 2000,
      quantity: 50,
      tint: [0xffff00, 0xff6600, 0xff0066, 0x00ff00, 0x0066ff]
    })

    this.time.delayedCall(2000, () => {
      particles.destroy()
    })
  }

  private clearPuzzle(): void {
    this.puzzlePieces.forEach(piece => piece.destroy())
    this.puzzlePieces.clear()
    this.puzzleData = []

    this.targetSlots.forEach(slot => slot.destroy())
    this.targetSlots = []

    this.combo = 0
    this.updateCombo()
  }

  private setupInput(): void {
    const inputManager = this.gameManager.getInputManager()

    // 키보드 단축키
    inputManager.on('keydown', (data: any) => {
      if (data.key === 'KeyR') {
        // R키로 퍼즐 리셋
        this.generateLevel(this.currentLevel)
      }
    })
  }

  // 외부 호출 메서드
  startGame(): void {
    this.gameStarted = true
    console.log('PuzzleRace 게임 시작!')

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
    // 멀티플레이어용 네트워크 메시지 처리
    console.log('PuzzleRace 네트워크 메시지:', message)
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
    console.log('PuzzleRace 게임 종료!')

    // 최종 점수 계산
    const finalScore = this.totalScore + this.maxCombo * 100
    this.gameManager.endGame(finalScore)
  }

  update(time: number, delta: number): void {
    if (!this.gameStarted) return

    // 콤보 업데이트
    this.updateCombo()
  }
}