import Phaser from 'phaser'
import { GameEngineManager } from '../GameEngineManager'
import { NetworkMessage } from '../types'

interface BeatNote {
  id: string
  lane: number // 0-3 (4개 레인)
  hitTime: number // 노래 시작으로부터 밀리초
  type: 'normal' | 'long' | 'special'
  duration?: number // long 노트의 경우
  isHit: boolean
  perfect: boolean
}

interface ScoreJudgement {
  type: 'perfect' | 'great' | 'good' | 'miss'
  points: number
  combo: boolean
}

export class RhythmActionScene extends Phaser.Scene {
  private gameManager: GameEngineManager
  private beatNotes: BeatNote[] = []
  private activeNotes: Map<string, Phaser.GameObjects.Container> = new Map()

  // 게임 상태
  private gameStarted = false
  private songTime = 0 // 현재 노래 시간 (ms)
  private bpm = 120 // 분당 비트 수
  private currentCombo = 0
  private maxCombo = 0
  private totalScore = 0
  private accuracy = 100

  // 판정 카운트
  private judgementCounts = {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0
  }

  // 게임 설정
  private readonly LANE_COUNT = 4
  private readonly FALL_TIME = 2000 // 노트가 떨어지는 시간 (ms)
  private readonly JUDGMENT_LINE_Y = 500
  private readonly PERFECT_WINDOW = 50 // ±50ms
  private readonly GREAT_WINDOW = 100 // ±100ms
  private readonly GOOD_WINDOW = 150 // ±150ms

  // UI 요소
  private laneGraphics: Phaser.GameObjects.Graphics[] = []
  private laneKeys: Phaser.GameObjects.Text[] = []
  private judgmentLine: Phaser.GameObjects.Graphics | null = null
  private scoreText: Phaser.GameObjects.Text | null = null
  private comboText: Phaser.GameObjects.Text | null = null
  private accuracyText: Phaser.GameObjects.Text | null = null
  private judgmentText: Phaser.GameObjects.Text | null = null

  constructor(gameManager: GameEngineManager) {
    super({ key: 'RhythmActionScene' })
    this.gameManager = gameManager
  }

  preload(): void {
    // 노트 텍스처 생성
    this.createNoteTextures()
    console.log('RhythmActionScene: 에셋 로딩 완료')
  }

  private createNoteTextures(): void {
    // 일반 노트 텍스처
    const normalNote = this.add.graphics()
    normalNote.fillStyle(0x00aaff)
    normalNote.fillRoundedRect(0, 0, 80, 20, 5)
    normalNote.lineStyle(2, 0xffffff, 1)
    normalNote.strokeRoundedRect(0, 0, 80, 20, 5)
    normalNote.generateTexture('normal_note', 80, 20)
    normalNote.destroy()

    // 롱 노트 시작
    const longNoteStart = this.add.graphics()
    longNoteStart.fillStyle(0xff6600)
    longNoteStart.fillRoundedRect(0, 0, 80, 20, 5)
    longNoteStart.lineStyle(2, 0xffffff, 1)
    longNoteStart.strokeRoundedRect(0, 0, 80, 20, 5)
    longNoteStart.generateTexture('long_note_start', 80, 20)
    longNoteStart.destroy()

    // 특수 노트 텍스처
    const specialNote = this.add.graphics()
    specialNote.fillStyle(0xff0088)
    specialNote.fillRoundedRect(0, 0, 80, 20, 5)
    specialNote.lineStyle(3, 0xffff00, 1)
    specialNote.strokeRoundedRect(0, 0, 80, 20, 5)
    specialNote.generateTexture('special_note', 80, 20)
    specialNote.destroy()
  }

  create(): void {
    // 배경 생성
    this.createBackground()

    // 게임 레인 생성
    this.createGameLanes()

    // UI 생성
    this.createUI()

    // 비트맵 생성 (테스트용 패턴)
    this.generateBeatmap()

    // 입력 처리 설정
    this.setupInput()

    console.log('RhythmActionScene: 씬 생성 완료')
  }

  private createBackground(): void {
    // 동적 배경 그라데이션
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x1a0033, 0x330066, 0x6600cc, 0x9933ff)
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)

    // 비주얼라이저 스타일 배경 패턴
    for (let i = 0; i < 20; i++) {
      const line = this.add.graphics()
      line.lineStyle(2, 0xffffff, 0.1)
      line.moveTo(0, i * 30)
      line.lineTo(this.cameras.main.width, i * 30)
      line.strokePath()

      // 펄스 애니메이션
      this.tweens.add({
        targets: line,
        alpha: 0.3,
        duration: 1000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      })
    }
  }

  private createGameLanes(): void {
    const laneWidth = 100
    const laneSpacing = 10
    const totalWidth = (laneWidth + laneSpacing) * this.LANE_COUNT - laneSpacing
    const startX = (this.cameras.main.width - totalWidth) / 2

    for (let i = 0; i < this.LANE_COUNT; i++) {
      const laneX = startX + i * (laneWidth + laneSpacing)

      // 레인 배경
      const laneGraphic = this.add.graphics()
      laneGraphic.fillStyle(0x000033, 0.5)
      laneGraphic.fillRoundedRect(laneX, 50, laneWidth, this.cameras.main.height - 100, 10)
      laneGraphic.lineStyle(2, 0x6666ff, 0.8)
      laneGraphic.strokeRoundedRect(laneX, 50, laneWidth, this.cameras.main.height - 100, 10)
      this.laneGraphics.push(laneGraphic)

      // 키 표시
      const keyLabels = ['D', 'F', 'J', 'K']
      const keyText = this.add.text(laneX + laneWidth / 2, this.JUDGMENT_LINE_Y + 40, keyLabels[i], {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5)

      this.laneKeys.push(keyText)
    }

    // 판정선 생성
    this.judgmentLine = this.add.graphics()
    this.judgmentLine.lineStyle(4, 0xffff00, 1)
    this.judgmentLine.moveTo(startX - 20, this.JUDGMENT_LINE_Y)
    this.judgmentLine.lineTo(startX + totalWidth + 20, this.JUDGMENT_LINE_Y)
    this.judgmentLine.strokePath()

    // 판정선 글로우 효과
    this.tweens.add({
      targets: this.judgmentLine,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  private createUI(): void {
    // 점수 표시
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 10 }
    })

    // 콤보 표시
    this.comboText = this.add.text(50, 100, 'Combo: 0', {
      fontSize: '28px',
      color: '#ffaa00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 10 }
    })

    // 정확도 표시
    this.accuracyText = this.add.text(50, 150, 'Accuracy: 100.0%', {
      fontSize: '24px',
      color: '#00ff88',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 10 }
    })

    // 판정 텍스트 (중앙)
    this.judgmentText = this.add.text(this.cameras.main.width / 2, 300, '', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // BPM 표시
    this.add.text(this.cameras.main.width - 50, 50, `BPM: ${this.bpm}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0)
  }

  private generateBeatmap(): void {
    // 테스트용 비트맵 생성 (실제로는 음악 파일과 동기화)
    const songLength = 120000 // 2분
    const beatInterval = 60000 / this.bpm // BPM을 밀리초로 변환

    this.beatNotes = []

    // 패턴 생성 (간단한 4/4 박자)
    for (let time = 2000; time < songLength; time += beatInterval) {
      // 기본 패턴 (매 박자마다 노트)
      if (Math.random() > 0.3) {
        const note: BeatNote = {
          id: `note_${time}_${Math.random()}`,
          lane: Math.floor(Math.random() * this.LANE_COUNT),
          hitTime: time,
          type: this.getRandomNoteType(),
          isHit: false,
          perfect: false
        }

        // 롱 노트의 경우 지속 시간 설정
        if (note.type === 'long') {
          note.duration = beatInterval * 2 + Math.random() * beatInterval * 2
        }

        this.beatNotes.push(note)
      }

      // 복잡한 패턴 (반박자)
      if (Math.random() > 0.7 && time + beatInterval / 2 < songLength) {
        const halfBeatNote: BeatNote = {
          id: `note_${time + beatInterval / 2}_${Math.random()}`,
          lane: Math.floor(Math.random() * this.LANE_COUNT),
          hitTime: time + beatInterval / 2,
          type: 'normal',
          isHit: false,
          perfect: false
        }

        this.beatNotes.push(halfBeatNote)
      }
    }

    // 시간순으로 정렬
    this.beatNotes.sort((a, b) => a.hitTime - b.hitTime)

    console.log(`비트맵 생성 완료: ${this.beatNotes.length}개 노트`)
  }

  private getRandomNoteType(): BeatNote['type'] {
    const rand = Math.random()
    if (rand < 0.7) return 'normal'
    if (rand < 0.9) return 'long'
    return 'special'
  }

  private spawnNote(note: BeatNote): void {
    const laneWidth = 100
    const laneSpacing = 10
    const totalWidth = (laneWidth + laneSpacing) * this.LANE_COUNT - laneSpacing
    const startX = (this.cameras.main.width - totalWidth) / 2
    const noteX = startX + note.lane * (laneWidth + laneSpacing) + laneWidth / 2

    const container = this.add.container(noteX, 50)

    // 노트 타입에 따른 스프라이트
    let noteSprite: Phaser.GameObjects.Sprite
    switch (note.type) {
      case 'long':
        noteSprite = this.add.sprite(0, 0, 'long_note_start')
        break
      case 'special':
        noteSprite = this.add.sprite(0, 0, 'special_note')
        break
      default:
        noteSprite = this.add.sprite(0, 0, 'normal_note')
    }

    // 글로우 효과
    const glow = this.add.graphics()
    const glowColor = note.type === 'special' ? 0xff0088 :
                     note.type === 'long' ? 0xff6600 : 0x00aaff
    glow.fillStyle(glowColor, 0.3)
    glow.fillCircle(0, 0, 50)

    container.add([glow, noteSprite])

    // 롱 노트의 경우 꼬리 생성
    if (note.type === 'long' && note.duration) {
      const tailHeight = (note.duration / this.FALL_TIME) * (this.JUDGMENT_LINE_Y - 50)
      const tail = this.add.graphics()
      tail.fillStyle(0xff6600, 0.6)
      tail.fillRect(-40, 10, 80, tailHeight)
      container.add(tail)
    }

    // 하강 애니메이션
    this.tweens.add({
      targets: container,
      y: this.JUDGMENT_LINE_Y,
      duration: this.FALL_TIME,
      ease: 'Linear',
      onComplete: () => {
        if (!note.isHit) {
          this.handleMiss(note)
        }
        container.destroy()
        this.activeNotes.delete(note.id)
      }
    })

    this.activeNotes.set(note.id, container)
    (container as any).noteData = note
  }

  private setupInput(): void {
    const inputManager = this.gameManager.getInputManager()
    const laneKeys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK']

    laneKeys.forEach((key, laneIndex) => {
      inputManager.on('keydown', (data: any) => {
        if (data.key === key) {
          this.handleLanePress(laneIndex)
          this.showLanePress(laneIndex)
        }
      })
    })
  }

  private handleLanePress(laneIndex: number): void {
    // 해당 레인의 가장 가까운 노트 찾기
    let closestNote: BeatNote | null = null
    let minTimeDiff = Infinity

    for (const note of this.beatNotes) {
      if (note.lane === laneIndex && !note.isHit) {
        const timeDiff = Math.abs(note.hitTime - this.songTime)
        if (timeDiff < minTimeDiff && timeDiff <= this.GOOD_WINDOW) {
          minTimeDiff = timeDiff
          closestNote = note
        }
      }
    }

    if (closestNote) {
      const judgment = this.getJudgment(minTimeDiff)
      this.handleNoteHit(closestNote, judgment)
    } else {
      // 빈 타이밍 - 콤보 중단
      this.breakCombo()
    }
  }

  private getJudgment(timeDiff: number): ScoreJudgement {
    if (timeDiff <= this.PERFECT_WINDOW) {
      return { type: 'perfect', points: 300, combo: true }
    } else if (timeDiff <= this.GREAT_WINDOW) {
      return { type: 'great', points: 200, combo: true }
    } else if (timeDiff <= this.GOOD_WINDOW) {
      return { type: 'good', points: 100, combo: true }
    } else {
      return { type: 'miss', points: 0, combo: false }
    }
  }

  private handleNoteHit(note: BeatNote, judgment: ScoreJudgement): void {
    note.isHit = true
    note.perfect = judgment.type === 'perfect'

    // 점수 추가
    this.addScore(judgment.points)

    // 콤보 처리
    if (judgment.combo) {
      this.currentCombo++
    } else {
      this.breakCombo()
    }

    // 판정 카운트 증가
    this.judgementCounts[judgment.type]++

    // 판정 표시
    this.showJudgment(judgment.type)

    // 히트 이펙트
    this.showHitEffect(note.lane, judgment.type)

    // 노트 제거
    const noteContainer = this.activeNotes.get(note.id)
    if (noteContainer) {
      noteContainer.destroy()
      this.activeNotes.delete(note.id)
    }

    // 정확도 업데이트
    this.updateAccuracy()

    console.log(`노트 히트: ${judgment.type} (${judgment.points}점)`)
  }

  private handleMiss(note: BeatNote): void {
    note.isHit = true
    this.judgementCounts.miss++
    this.breakCombo()
    this.showJudgment('miss')
    this.updateAccuracy()
  }

  private addScore(points: number): void {
    // 콤보 보너스
    let comboMultiplier = 1
    if (this.currentCombo >= 50) comboMultiplier = 2
    else if (this.currentCombo >= 20) comboMultiplier = 1.5
    else if (this.currentCombo >= 10) comboMultiplier = 1.2

    const finalPoints = Math.floor(points * comboMultiplier)
    this.totalScore += finalPoints

    this.scoreText?.setText(`Score: ${this.totalScore}`)

    // 스코어 상승 효과
    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true
      })
    }
  }

  private breakCombo(): void {
    this.maxCombo = Math.max(this.maxCombo, this.currentCombo)
    this.currentCombo = 0
    this.updateComboDisplay()
  }

  private updateComboDisplay(): void {
    this.comboText?.setText(`Combo: ${this.currentCombo}`)

    // 콤보에 따른 색상 변경
    if (this.comboText) {
      if (this.currentCombo >= 50) {
        this.comboText.setColor('#ff0066')
      } else if (this.currentCombo >= 20) {
        this.comboText.setColor('#ff6600')
      } else if (this.currentCombo >= 10) {
        this.comboText.setColor('#ffaa00')
      } else {
        this.comboText.setColor('#ffffff')
      }

      // 콤보 마일스톤 효과
      if (this.currentCombo > 0 && this.currentCombo % 10 === 0) {
        this.tweens.add({
          targets: this.comboText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          yoyo: true
        })
      }
    }
  }

  private updateAccuracy(): void {
    const totalNotes = Object.values(this.judgementCounts).reduce((a, b) => a + b, 0)
    if (totalNotes === 0) return

    const weightedScore =
      this.judgementCounts.perfect * 100 +
      this.judgementCounts.great * 80 +
      this.judgementCounts.good * 50 +
      this.judgementCounts.miss * 0

    this.accuracy = (weightedScore / (totalNotes * 100)) * 100

    this.accuracyText?.setText(`Accuracy: ${this.accuracy.toFixed(1)}%`)

    // 정확도에 따른 색상
    if (this.accuracyText) {
      if (this.accuracy >= 95) {
        this.accuracyText.setColor('#00ff88')
      } else if (this.accuracy >= 85) {
        this.accuracyText.setColor('#ffff00')
      } else if (this.accuracy >= 70) {
        this.accuracyText.setColor('#ff6600')
      } else {
        this.accuracyText.setColor('#ff0066')
      }
    }
  }

  private showJudgment(type: ScoreJudgement['type']): void {
    if (!this.judgmentText) return

    const colors = {
      perfect: '#ffff00',
      great: '#00ff88',
      good: '#0088ff',
      miss: '#ff0066'
    }

    const texts = {
      perfect: 'PERFECT!',
      great: 'GREAT!',
      good: 'GOOD',
      miss: 'MISS'
    }

    this.judgmentText.setText(texts[type])
    this.judgmentText.setColor(colors[type])
    this.judgmentText.setAlpha(1)
    this.judgmentText.setScale(1)

    // 애니메이션
    this.tweens.add({
      targets: this.judgmentText,
      scaleX: type === 'perfect' ? 1.5 : 1.2,
      scaleY: type === 'perfect' ? 1.5 : 1.2,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.judgmentText,
          alpha: 0,
          duration: 300
        })
      }
    })
  }

  private showHitEffect(lane: number, judgment: ScoreJudgement['type']): void {
    const laneWidth = 100
    const laneSpacing = 10
    const totalWidth = (laneWidth + laneSpacing) * this.LANE_COUNT - laneSpacing
    const startX = (this.cameras.main.width - totalWidth) / 2
    const effectX = startX + lane * (laneWidth + laneSpacing) + laneWidth / 2

    // 파티클 효과
    const colors = judgment === 'perfect' ? [0xffff00, 0xffffff] :
                  judgment === 'great' ? [0x00ff88, 0x00ffff] :
                  judgment === 'good' ? [0x0088ff, 0xffffff] : [0xff0066]

    const particles = this.add.particles(effectX, this.JUDGMENT_LINE_Y, 'normal_note', {
      scale: { start: 0.5, end: 0 },
      speed: { min: 50, max: 150 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: judgment === 'perfect' ? 20 : 10,
      tint: colors
    })

    this.time.delayedCall(500, () => {
      particles.destroy()
    })
  }

  private showLanePress(laneIndex: number): void {
    const laneKey = this.laneKeys[laneIndex]
    if (!laneKey) return

    // 키 눌림 효과
    this.tweens.add({
      targets: laneKey,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true
    })

    // 레인 하이라이트
    const laneGraphic = this.laneGraphics[laneIndex]
    if (laneGraphic) {
      this.tweens.add({
        targets: laneGraphic,
        alpha: 0.8,
        duration: 100,
        yoyo: true
      })
    }
  }

  // 외부 호출 메서드
  startGame(): void {
    this.gameStarted = true
    console.log('RhythmAction 게임 시작!')

    this.gameManager.getAudioManager().playMusic('music_game_battle')

    // 게임 타이머 시작
    this.time.addEvent({
      delay: 16, // ~60fps
      callback: () => {
        this.songTime += 16
        this.updateGame()
      },
      loop: true
    })
  }

  private updateGame(): void {
    if (!this.gameStarted) return

    // 다가오는 노트들 스폰
    for (const note of this.beatNotes) {
      if (!note.isHit &&
          note.hitTime - this.songTime <= this.FALL_TIME &&
          note.hitTime - this.songTime > this.FALL_TIME - 100 &&
          !this.activeNotes.has(note.id)) {
        this.spawnNote(note)
      }
    }

    // 콤보 표시 업데이트
    this.updateComboDisplay()

    // 게임 종료 체크 (모든 노트 처리 완료)
    const allNotesProcessed = this.beatNotes.every(note => note.isHit)
    if (allNotesProcessed && this.activeNotes.size === 0) {
      this.endGame()
    }
  }

  onNetworkMessage(message: NetworkMessage): void {
    console.log('RhythmAction 네트워크 메시지:', message)
  }

  private endGame(): void {
    this.gameStarted = false
    console.log('RhythmAction 게임 종료!')

    // 최종 통계
    const finalStats = {
      score: this.totalScore,
      maxCombo: this.maxCombo,
      accuracy: this.accuracy,
      judgments: { ...this.judgementCounts }
    }

    console.log('최종 통계:', finalStats)

    // 결과 표시
    this.showGameResults(finalStats)

    // 게임 매니저에 종료 알림
    this.time.delayedCall(3000, () => {
      this.gameManager.endGame(this.totalScore)
    })
  }

  private showGameResults(stats: any): void {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // 결과 배경
    const resultsBg = this.add.graphics()
    resultsBg.fillStyle(0x000000, 0.8)
    resultsBg.fillRoundedRect(centerX - 250, centerY - 150, 500, 300, 20)

    // 결과 텍스트들
    const resultsTexts = [
      `Final Score: ${stats.score}`,
      `Max Combo: ${stats.maxCombo}`,
      `Accuracy: ${stats.accuracy.toFixed(1)}%`,
      '',
      `Perfect: ${stats.judgments.perfect}`,
      `Great: ${stats.judgments.great}`,
      `Good: ${stats.judgments.good}`,
      `Miss: ${stats.judgments.miss}`
    ]

    resultsTexts.forEach((text, index) => {
      if (text) {
        const textObj = this.add.text(centerX, centerY - 120 + index * 30, text, {
          fontSize: '24px',
          color: index < 3 ? '#ffff00' : '#ffffff',
          fontFamily: 'Arial',
          fontStyle: index < 3 ? 'bold' : 'normal'
        }).setOrigin(0.5)

        // 순차적 등장 효과
        textObj.setAlpha(0)
        this.tweens.add({
          targets: textObj,
          alpha: 1,
          duration: 300,
          delay: index * 200
        })
      }
    })
  }

  update(time: number, delta: number): void {
    if (!this.gameStarted) return
    // 추가적인 업데이트 로직이 있다면 여기에
  }
}