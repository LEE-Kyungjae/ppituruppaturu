/**
 * Simple Bot Engine
 * AI 대신 사용하는 간단한 규칙 기반 봇 시스템
 * CPU 효율적이고 예측 가능한 봇 행동
 */

export interface BotPlayer {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  personality: BotPersonality
  position: { x: number; y: number }
  target: { x: number; y: number } | null
  lastAction: number
  paintCoverage: number
  score: number
  isActive: boolean
}

export interface BotPersonality {
  speed: number        // 0.5-1.5 (이동 속도 배율)
  aggression: number   // 0-1 (공격적 성향)
  precision: number    // 0-1 (정확도)
  teamwork: number     // 0-1 (협동 성향)
  patience: number     // 0-1 (인내심)
}

export interface GameState {
  canvasWidth: number
  canvasHeight: number
  players: BotPlayer[]
  timeRemaining: number
  powerUps: Array<{ x: number; y: number; type: string }>
  paintedAreas: Array<{ x: number; y: number; playerId: string }>
}

export interface BotAction {
  type: 'move' | 'paint' | 'powerup' | 'idle'
  target?: { x: number; y: number }
  duration: number
  metadata?: { [key: string]: any }
}

class SimpleBotEngine {
  private bots: Map<string, BotPlayer> = new Map()
  private gameState: GameState | null = null
  private actionInterval: number | null = null
  private running = false

  // 사전 정의된 성격 템플릿
  private personalityTemplates = {
    easy: {
      speed: 0.7,
      aggression: 0.3,
      precision: 0.5,
      teamwork: 0.4,
      patience: 0.8
    },
    medium: {
      speed: 0.9,
      aggression: 0.6,
      precision: 0.7,
      teamwork: 0.6,
      patience: 0.6
    },
    hard: {
      speed: 1.2,
      aggression: 0.8,
      precision: 0.9,
      teamwork: 0.8,
      patience: 0.4
    }
  }

  /**
   * 봇 플레이어 생성
   */
  public spawnBot(
    botId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    customPersonality?: Partial<BotPersonality>
  ): BotPlayer {
    const basePersonality = this.personalityTemplates[difficulty]
    const personality = { ...basePersonality, ...customPersonality }

    const bot: BotPlayer = {
      id: botId,
      name: `Bot ${botId.slice(-3)}`,
      difficulty,
      personality,
      position: this.getRandomSpawnPosition(),
      target: null,
      lastAction: Date.now(),
      paintCoverage: 0,
      score: 0,
      isActive: true
    }

    this.bots.set(botId, bot)
    console.log(`[BotEngine] Spawned ${difficulty} bot: ${botId}`)
    return bot
  }

  /**
   * 봇 제거
   */
  public removeBot(botId: string): void {
    this.bots.delete(botId)
    console.log(`[BotEngine] Removed bot: ${botId}`)
  }

  /**
   * 게임 상태 업데이트
   */
  public updateGameState(gameState: GameState): void {
    this.gameState = gameState
  }

  /**
   * 봇 시스템 시작
   */
  public start(): void {
    if (this.running) return

    this.running = true
    this.actionInterval = window.setInterval(() => {
      this.updateBots()
    }, 100) // 100ms마다 업데이트 (AI보다 훨씬 가벼움)

    console.log('[BotEngine] Started')
  }

  /**
   * 봇 시스템 중지
   */
  public stop(): void {
    if (this.actionInterval) {
      clearInterval(this.actionInterval)
      this.actionInterval = null
    }
    this.running = false
    console.log('[BotEngine] Stopped')
  }

  /**
   * 모든 봇 업데이트
   */
  private updateBots(): void {
    if (!this.gameState) return

    this.bots.forEach(bot => {
      if (!bot.isActive) return

      const action = this.decideBotAction(bot)
      this.executeBotAction(bot, action)
    })
  }

  /**
   * 봇 행동 결정 (규칙 기반)
   */
  private decideBotAction(bot: BotPlayer): BotAction {
    if (!this.gameState) {
      return { type: 'idle', duration: 1000 }
    }

    const now = Date.now()
    const timeSinceLastAction = now - bot.lastAction

    // 너무 빨리 행동하지 않도록 제한
    if (timeSinceLastAction < 200 / bot.personality.speed) {
      return { type: 'idle', duration: 100 }
    }

    // 1. 파워업이 가까이 있으면 우선 수집
    const nearbyPowerUp = this.findNearbyPowerUp(bot)
    if (nearbyPowerUp && Math.random() < 0.7) {
      return {
        type: 'powerup',
        target: nearbyPowerUp,
        duration: 500
      }
    }

    // 2. 상대방이 가까이 있고 공격적이면 방해
    if (bot.personality.aggression > 0.6) {
      const nearbyOpponent = this.findNearbyOpponent(bot)
      if (nearbyOpponent && Math.random() < bot.personality.aggression) {
        return {
          type: 'move',
          target: nearbyOpponent.position,
          duration: 300
        }
      }
    }

    // 3. 빈 공간 찾아서 페인팅
    const emptyArea = this.findEmptyArea(bot)
    if (emptyArea) {
      // 이동이 필요한지 확인
      const distance = this.getDistance(bot.position, emptyArea)
      if (distance > 50) {
        return {
          type: 'move',
          target: emptyArea,
          duration: distance * 10 / bot.personality.speed
        }
      } else {
        return {
          type: 'paint',
          target: emptyArea,
          duration: 500 + Math.random() * 1000
        }
      }
    }

    // 4. 기본 행동: 랜덤 이동
    return {
      type: 'move',
      target: this.getRandomPosition(),
      duration: 1000 + Math.random() * 1000
    }
  }

  /**
   * 봇 행동 실행
   */
  private executeBotAction(bot: BotPlayer, action: BotAction): void {
    bot.lastAction = Date.now()

    // 게임 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('botAction', {
        detail: { botId: bot.id, action }
      }))
    }

    switch (action.type) {
      case 'move':
        if (action.target) {
          this.moveBot(bot, action.target)
        }
        break
      case 'paint':
        this.paintBot(bot, action.target)
        break
      case 'powerup':
        if (action.target) {
          this.moveBot(bot, action.target)
        }
        break
    }
  }

  /**
   * 봇 이동
   */
  private moveBot(bot: BotPlayer, target: { x: number; y: number }): void {
    const speed = bot.personality.speed * 2 // 픽셀/프레임
    const dx = target.x - bot.position.x
    const dy = target.y - bot.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > speed) {
      bot.position.x += (dx / distance) * speed
      bot.position.y += (dy / distance) * speed
    } else {
      bot.position.x = target.x
      bot.position.y = target.y
    }

    bot.target = target
  }

  /**
   * 봇 페인팅
   */
  private paintBot(bot: BotPlayer, target?: { x: number; y: number }): void {
    const paintPosition = target || bot.position

    // 정확도에 따라 페인팅 위치 조정
    const accuracy = bot.personality.precision
    const offset = (1 - accuracy) * 20
    const actualX = paintPosition.x + (Math.random() - 0.5) * offset
    const actualY = paintPosition.y + (Math.random() - 0.5) * offset

    // 페인팅 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('botPaint', {
        detail: {
          botId: bot.id,
          x: actualX,
          y: actualY,
          size: 5 + bot.personality.precision * 10
        }
      }))
    }
  }

  /**
   * 유틸리티 함수들
   */
  private getRandomSpawnPosition(): { x: number; y: number } {
    return {
      x: 50 + Math.random() * 700,
      y: 50 + Math.random() * 500
    }
  }

  private getRandomPosition(): { x: number; y: number } {
    if (!this.gameState) return this.getRandomSpawnPosition()

    return {
      x: Math.random() * this.gameState.canvasWidth,
      y: Math.random() * this.gameState.canvasHeight
    }
  }

  private getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private findNearbyPowerUp(bot: BotPlayer): { x: number; y: number } | null {
    if (!this.gameState) return null

    const maxDistance = 100
    for (const powerUp of this.gameState.powerUps) {
      if (this.getDistance(bot.position, powerUp) < maxDistance) {
        return powerUp
      }
    }
    return null
  }

  private findNearbyOpponent(bot: BotPlayer): BotPlayer | null {
    if (!this.gameState) return null

    const maxDistance = 80
    for (const player of this.gameState.players) {
      if (player.id !== bot.id && this.getDistance(bot.position, player.position) < maxDistance) {
        return player
      }
    }
    return null
  }

  private findEmptyArea(bot: BotPlayer): { x: number; y: number } | null {
    if (!this.gameState) return null

    // 간단한 빈 공간 찾기 (실제 구현에서는 페인트된 영역 체크)
    const attempts = 10
    for (let i = 0; i < attempts; i++) {
      const candidate = {
        x: Math.random() * this.gameState.canvasWidth,
        y: Math.random() * this.gameState.canvasHeight
      }

      // 다른 플레이어와 너무 가까우면 제외
      const tooClose = this.gameState.players.some(player =>
        player.id !== bot.id && this.getDistance(candidate, player.position) < 30
      )

      if (!tooClose) {
        return candidate
      }
    }

    return this.getRandomPosition()
  }

  /**
   * Public API
   */
  public getAllBots(): BotPlayer[] {
    return Array.from(this.bots.values())
  }

  public getBot(botId: string): BotPlayer | null {
    return this.bots.get(botId) || null
  }

  public updateBotScore(botId: string, score: number): void {
    const bot = this.bots.get(botId)
    if (bot) {
      bot.score = score
    }
  }

  public setBotActive(botId: string, active: boolean): void {
    const bot = this.bots.get(botId)
    if (bot) {
      bot.isActive = active
    }
  }

  public isRunning(): boolean {
    return this.running
  }

  public dispose(): void {
    this.stop()
    this.bots.clear()
    console.log('[BotEngine] Disposed')
  }
}

// 싱글톤 인스턴스
export const simpleBotEngine = new SimpleBotEngine()

// React Hook
import * as React from 'react'

export function useSimpleBot() {
  const [bots, setBots] = React.useState<BotPlayer[]>([])
  const [isRunning, setIsRunning] = React.useState(false)

  React.useEffect(() => {
    const updateBots = () => {
      setBots(simpleBotEngine.getAllBots())
      setIsRunning(simpleBotEngine.isRunning())
    }

    const interval = setInterval(updateBots, 500) // 0.5초마다 UI 업데이트
    updateBots() // 초기 업데이트

    return () => clearInterval(interval)
  }, [])

  return {
    bots,
    isRunning,
    spawnBot: simpleBotEngine.spawnBot.bind(simpleBotEngine),
    removeBot: simpleBotEngine.removeBot.bind(simpleBotEngine),
    updateGameState: simpleBotEngine.updateGameState.bind(simpleBotEngine),
    start: simpleBotEngine.start.bind(simpleBotEngine),
    stop: simpleBotEngine.stop.bind(simpleBotEngine),
    setBotActive: simpleBotEngine.setBotActive.bind(simpleBotEngine),
    updateBotScore: simpleBotEngine.updateBotScore.bind(simpleBotEngine)
  }
}

export default simpleBotEngine