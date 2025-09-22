/**
 * Game Analytics Engine
 * 실시간 게임 분석 및 대시보드 시스템 - 사이버펑크 테마
 */

import { performanceMonitor } from '../monitoring/PerformanceMonitor'
import { getMultiplayerManager } from '../multiplayer/MultiplayerManager'
import { getAchievementSystem } from '../game-engine/AchievementSystem'

export interface GameMetrics {
  gameId: string
  sessionId: string
  playerId: string
  timestamp: number
  gameMode: string
  duration: number
  playerCount: number
  averageFPS: number
  paintCoverage: number
  territoryControlled: number
  paintStrokes: number
  powerUpsCollected: number
  achievementsUnlocked: number
  socialInteractions: number
  gameResult: 'win' | 'lose' | 'draw' | 'disconnect'
  finalScore: number
  rank: number
  experienceGained: number
  skillRating?: number
}

export interface PerformanceMetrics {
  sessionId: string
  timestamp: number
  averageFPS: number
  minFPS: number
  maxFPS: number
  frameDrops: number
  memoryUsage: number
  networkLatency: number
  renderTime: number
  loadTime: number
  platform: string
  deviceInfo: DeviceInfo
  gameSettings: any
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  screenResolution: string
  colorDepth: number
  hardwareConcurrency: number
  deviceMemory?: number
  connectionType?: string
  effectiveType?: string
}

export interface PlayerBehaviorMetrics {
  playerId: string
  sessionId: string
  timestamp: number
  paintingStyle: PaintingStyle
  movementPatterns: MovementPattern[]
  strategyIndicators: StrategyIndicator[]
  socialBehavior: SocialBehavior
  skillProgression: SkillProgression
  preferredGameModes: string[]
  averageSessionLength: number
  retentionRate: number
  engagementScore: number
}

export interface PaintingStyle {
  averageBrushSize: number
  preferredColors: string[]
  strokeFrequency: number
  strokeLength: number
  accuracy: number
  precision: number
  creativityScore: number
  symmetryScore: number
}

export interface MovementPattern {
  type: 'aggressive' | 'defensive' | 'territorial' | 'exploratory'
  frequency: number
  hotspots: { x: number; y: number; frequency: number }[]
  pathEfficiency: number
  reactionTime: number
}

export interface StrategyIndicator {
  type: 'rusher' | 'builder' | 'defender' | 'opportunist' | 'collaborator'
  confidence: number
  adaptability: number
  riskTaking: number
  planningDepth: number
}

export interface SocialBehavior {
  chatFrequency: number
  positivityScore: number
  helpfulness: number
  toxicityReports: number
  friendConnections: number
  teamPlayScore: number
}

export interface SkillProgression {
  currentSkillLevel: number
  skillGrowthRate: number
  strongestSkills: string[]
  weakestSkills: string[]
  learningCurve: SkillDataPoint[]
  masteryLevel: number
}

export interface SkillDataPoint {
  timestamp: number
  skillLevel: number
  gameMode: string
  performance: number
}

export interface RealTimeAnalytics {
  timestamp: number
  activePlayers: number
  averageSkillLevel: number
  topPerformers: PlayerSummary[]
  gameDistribution: { [gameMode: string]: number }
  serverLoad: number
  connectionQuality: ConnectionQuality
  trendingStrategies: Strategy[]
  popularBrushes: BrushUsage[]
  hotZones: HeatmapPoint[]
}

export interface PlayerSummary {
  playerId: string
  username: string
  skillLevel: number
  winRate: number
  currentStreak: number
  favoriteStrategy: string
  isOnline: boolean
}

export interface ConnectionQuality {
  averageLatency: number
  packetLoss: number
  disconnectRate: number
  regionDistribution: { [region: string]: number }
}

export interface Strategy {
  name: string
  usage: number
  winRate: number
  avgDuration: number
  complexity: number
}

export interface BrushUsage {
  brushType: string
  usage: number
  skillLevel: number
  effectiveness: number
}

export interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  activity: 'painting' | 'movement' | 'combat' | 'powerup'
}

export interface AnalyticsEvent {
  type: string
  data: any
  timestamp: number
  sessionId: string
  playerId?: string
}

class GameAnalyticsEngine {
  private currentSession: GameSession | null = null
  private metricsBuffer: AnalyticsEvent[] = []
  private performanceHistory: PerformanceMetrics[] = []
  private behaviorMetrics: Map<string, PlayerBehaviorMetrics> = new Map()
  private realTimeData: RealTimeAnalytics | null = null
  private heatmapData: HeatmapPoint[] = []

  private isTracking = false
  private flushInterval: number | null = null
  private updateInterval: number | null = null

  // Machine learning models (simplified)
  private strategyClassifier: StrategyClassifier
  private skillPredictor: SkillPredictor
  private churnPredictor: ChurnPredictor

  constructor() {
    this.strategyClassifier = new StrategyClassifier()
    this.skillPredictor = new SkillPredictor()
    this.churnPredictor = new ChurnPredictor()

    this.setupEventListeners()
    this.startPerformanceTracking()
  }

  private setupEventListeners() {
    // Game events
    if (typeof window !== 'undefined') {
      window.addEventListener('gameEvent', this.handleGameEvent.bind(this))
    }

    // Performance monitoring
    performanceMonitor.on('metrics_update', this.handlePerformanceUpdate.bind(this))

    // Multiplayer events
    const multiplayerManager = getMultiplayerManager();
    multiplayerManager.on('*', this.handleMultiplayerEvent.bind(this))

    const achievementSystem = getAchievementSystem();
    // Achievement events
    achievementSystem.on('achievement_unlocked', this.handleAchievementEvent.bind(this))
    achievementSystem.on('level_up', this.handleLevelUpEvent.bind(this))
  }

  private startPerformanceTracking() {
    this.updateInterval = window.setInterval(() => {
      this.updateRealTimeAnalytics()
      this.updateBehaviorMetrics()
      this.updateHeatmap()
    }, 1000)

    this.flushInterval = window.setInterval(() => {
      this.flushMetricsBuffer()
    }, 5000) // Flush every 5 seconds
  }

  // Session Management
  public startGameSession(gameMode: string, settings: any) {
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId: `game_${Date.now()}`,
      playerId: multiplayerManager.currentPlayerInfo?.id || 'anonymous',
      startTime: Date.now(),
      gameMode,
      settings,
      events: [],
      metrics: {
        paintStrokes: 0,
        paintCoverage: 0,
        powerUpsCollected: 0,
        socialInteractions: 0,
        territoryControlled: 0
      }
    }

    this.isTracking = true
    this.trackEvent('session_start', {
      gameMode,
      settings,
      playerCount: multiplayerManager.currentRoomInfo?.players.length || 1
    })

    console.log('[Analytics] Game session started:', this.currentSession.id)
  }

  public endGameSession(result: 'win' | 'lose' | 'draw' | 'disconnect', finalScore: number) {
    if (!this.currentSession) return

    const duration = Date.now() - this.currentSession.startTime
    const performanceMetrics = performanceMonitor.getStatistics()

    const gameMetrics: GameMetrics = {
      gameId: this.currentSession.gameId,
      sessionId: this.currentSession.id,
      playerId: this.currentSession.playerId,
      timestamp: Date.now(),
      gameMode: this.currentSession.gameMode,
      duration,
      playerCount: multiplayerManager.currentRoomInfo?.players.length || 1,
      averageFPS: performanceMetrics?.fps.avg || 60,
      paintCoverage: this.currentSession.metrics.paintCoverage,
      territoryControlled: this.currentSession.metrics.territoryControlled,
      paintStrokes: this.currentSession.metrics.paintStrokes,
      powerUpsCollected: this.currentSession.metrics.powerUpsCollected,
      achievementsUnlocked: 0, // Will be updated by achievement system
      socialInteractions: this.currentSession.metrics.socialInteractions,
      gameResult: result,
      finalScore,
      rank: this.calculatePlayerRank(),
      experienceGained: 0 // Will be updated by achievement system
    }

    this.trackEvent('session_end', gameMetrics)

    // Update behavior metrics
    this.updatePlayerBehavior(this.currentSession.playerId, gameMetrics)

    // ML predictions
    this.updateStrategyClassification(this.currentSession.playerId)
    this.updateSkillPrediction(this.currentSession.playerId, gameMetrics)
    this.updateChurnPrediction(this.currentSession.playerId)

    this.currentSession = null
    this.isTracking = false

    console.log('[Analytics] Game session ended:', gameMetrics)
  }

  // Event Tracking
  public trackEvent(eventType: string, data: any) {
    if (!this.isTracking && !eventType.includes('session')) return

    const event: AnalyticsEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'no_session',
      playerId: this.currentSession?.playerId
    }

    this.metricsBuffer.push(event)

    // Update session metrics
    if (this.currentSession) {
      this.currentSession.events.push(event)
      this.updateSessionMetrics(eventType, data)
    }
  }

  public trackPlayerAction(action: string, position?: { x: number; y: number }, metadata?: any) {
    this.trackEvent('player_action', {
      action,
      position,
      metadata,
      timestamp: Date.now()
    })

    // Update heatmap
    if (position) {
      this.addHeatmapPoint(position.x, position.y, this.getActionIntensity(action), action as any)
    }
  }

  public trackPaintStroke(startPos: { x: number; y: number }, endPos: { x: number; y: number }, brushType: string, color: string) {
    this.trackEvent('paint_stroke', {
      startPos,
      endPos,
      brushType,
      color,
      length: this.calculateDistance(startPos, endPos),
      timestamp: Date.now()
    })

    if (this.currentSession) {
      this.currentSession.metrics.paintStrokes++
    }

    // Add to heatmap
    this.addHeatmapPoint(startPos.x, startPos.y, 1.0, 'painting')
    this.addHeatmapPoint(endPos.x, endPos.y, 1.0, 'painting')
  }

  public trackPowerUpCollection(type: string, position: { x: number; y: number }, effect: string) {
    this.trackEvent('powerup_collected', {
      type,
      position,
      effect,
      timestamp: Date.now()
    })

    if (this.currentSession) {
      this.currentSession.metrics.powerUpsCollected++
    }

    this.addHeatmapPoint(position.x, position.y, 1.5, 'powerup')
  }

  public trackSocialInteraction(type: 'chat' | 'emote' | 'help' | 'friend_request', targetPlayer?: string, message?: string) {
    this.trackEvent('social_interaction', {
      type,
      targetPlayer,
      message,
      timestamp: Date.now()
    })

    if (this.currentSession) {
      this.currentSession.metrics.socialInteractions++
    }
  }

  // Event Handlers
  private handleGameEvent(event: CustomEvent) {
    const { type, data } = event.detail
    this.trackEvent(`game_${type}`, data)
  }

  private handlePerformanceUpdate(metrics: any) {
    if (!this.currentSession) return

    const performanceMetrics: PerformanceMetrics = {
      sessionId: this.currentSession.id,
      timestamp: Date.now(),
      averageFPS: metrics.fps,
      minFPS: metrics.fps, // Simplified - should track actual min/max
      maxFPS: metrics.fps,
      frameDrops: metrics.fps < 30 ? 1 : 0,
      memoryUsage: metrics.memoryUsage,
      networkLatency: metrics.networkLatency,
      renderTime: metrics.renderTime,
      loadTime: 0, // Should be tracked separately
      platform: navigator.platform,
      deviceInfo: this.collectDeviceInfo(),
      gameSettings: this.currentSession.settings
    }

    this.performanceHistory.push(performanceMetrics)

    // Keep only recent history
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000)
    }
  }

  private handleMultiplayerEvent(event: any) {
    this.trackEvent(`multiplayer_${event.type}`, event.data)
  }

  private handleAchievementEvent(achievement: any) {
    this.trackEvent('achievement_unlocked', {
      achievementId: achievement.id,
      title: achievement.title,
      tier: achievement.tier,
      category: achievement.category
    })
  }

  private handleLevelUpEvent(data: any) {
    this.trackEvent('level_up', {
      newLevel: data.newLevel,
      experienceGained: data.experienceToNext
    })
  }

  // Analytics Processing
  private updateSessionMetrics(eventType: string, data: any) {
    if (!this.currentSession) return

    switch (eventType) {
      case 'paint_coverage_update':
        this.currentSession.metrics.paintCoverage = data.coverage
        break
      case 'territory_update':
        this.currentSession.metrics.territoryControlled = data.territory
        break
    }
  }

  private updateRealTimeAnalytics() {
    const currentRoom = multiplayerManager.currentRoomInfo
    const performance = performanceMonitor.getCurrentMetrics()

    this.realTimeData = {
      timestamp: Date.now(),
      activePlayers: currentRoom?.players.length || 0,
      averageSkillLevel: this.calculateAverageSkillLevel(),
      topPerformers: this.getTopPerformers(),
      gameDistribution: this.getGameDistribution(),
      serverLoad: performance?.memoryUsage || 0,
      connectionQuality: this.calculateConnectionQuality(),
      trendingStrategies: this.getTrendingStrategies(),
      popularBrushes: this.getPopularBrushes(),
      hotZones: this.getHotZones()
    }
  }

  private updateBehaviorMetrics() {
    // Update behavior metrics for current player
    const playerId = this.currentSession?.playerId
    if (!playerId) return

    const existing = this.behaviorMetrics.get(playerId) || this.createEmptyBehaviorMetrics(playerId)

    // Update painting style
    this.updatePaintingStyle(existing)

    // Update movement patterns
    this.updateMovementPatterns(existing)

    // Update social behavior
    this.updateSocialBehavior(existing)

    this.behaviorMetrics.set(playerId, existing)
  }

  private updateHeatmap() {
    // Decay heatmap over time
    this.heatmapData.forEach(point => {
      point.intensity *= 0.99 // 1% decay per second
    })

    // Remove very low intensity points
    this.heatmapData = this.heatmapData.filter(point => point.intensity > 0.01)
  }

  // ML Models (Simplified implementations)
  private updateStrategyClassification(playerId: string) {
    const behavior = this.behaviorMetrics.get(playerId)
    if (!behavior) return

    const strategy = this.strategyClassifier.classify(behavior)
    // Update player's strategy indicators
  }

  private updateSkillPrediction(playerId: string, metrics: GameMetrics) {
    const skillLevel = this.skillPredictor.predict(metrics, this.behaviorMetrics.get(playerId))
    // Update player's skill progression
  }

  private updateChurnPrediction(playerId: string) {
    const churnRisk = this.churnPredictor.predict(this.behaviorMetrics.get(playerId))
    // Store churn prediction for player retention strategies
  }

  // Utility Methods
  private calculatePlayerRank(): number {
    // Simplified ranking calculation
    const room = multiplayerManager.currentRoomInfo
    if (!room) return 1

    const currentPlayer = multiplayerManager.currentPlayerInfo
    if (!currentPlayer) return room.players.length

    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
    return sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1
  }

  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  private collectDeviceInfo(): DeviceInfo {
    const nav = navigator as any
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: nav.deviceMemory,
      connectionType: nav.connection?.type,
      effectiveType: nav.connection?.effectiveType
    }
  }

  private addHeatmapPoint(x: number, y: number, intensity: number, activity: HeatmapPoint['activity']) {
    this.heatmapData.push({ x, y, intensity, activity })
  }

  private getActionIntensity(action: string): number {
    const intensityMap: { [key: string]: number } = {
      'paint': 1.0,
      'move': 0.3,
      'powerup': 1.5,
      'combat': 2.0,
      'chat': 0.5
    }
    return intensityMap[action] || 0.5
  }

  // Data Retrieval Methods
  public getCurrentMetrics(): GameMetrics | null {
    if (!this.currentSession) return null

    return {
      gameId: this.currentSession.gameId,
      sessionId: this.currentSession.id,
      playerId: this.currentSession.playerId,
      timestamp: Date.now(),
      gameMode: this.currentSession.gameMode,
      duration: Date.now() - this.currentSession.startTime,
      playerCount: multiplayerManager.currentRoomInfo?.players.length || 1,
      averageFPS: performanceMonitor.getCurrentMetrics()?.fps || 60,
      paintCoverage: this.currentSession.metrics.paintCoverage,
      territoryControlled: this.currentSession.metrics.territoryControlled,
      paintStrokes: this.currentSession.metrics.paintStrokes,
      powerUpsCollected: this.currentSession.metrics.powerUpsCollected,
      achievementsUnlocked: 0,
      socialInteractions: this.currentSession.metrics.socialInteractions,
      gameResult: 'win', // Placeholder
      finalScore: 0,
      rank: 0,
      experienceGained: 0
    }
  }

  public getRealTimeAnalytics(): RealTimeAnalytics | null {
    return this.realTimeData
  }

  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory]
  }

  public getPlayerBehavior(playerId: string): PlayerBehaviorMetrics | null {
    return this.behaviorMetrics.get(playerId) || null
  }

  public getHeatmapData(): HeatmapPoint[] {
    return [...this.heatmapData]
  }

  public getSessionHistory(): AnalyticsEvent[] {
    return this.currentSession?.events || []
  }

  // Data Export
  public exportAnalytics(): string {
    const data = {
      currentSession: this.currentSession,
      performanceHistory: this.performanceHistory.slice(-100), // Last 100 entries
      behaviorMetrics: Object.fromEntries(this.behaviorMetrics),
      heatmapData: this.heatmapData,
      realTimeData: this.realTimeData
    }

    return JSON.stringify(data, null, 2)
  }

  private flushMetricsBuffer() {
    if (this.metricsBuffer.length === 0) return

    // In a real implementation, this would send data to analytics backend
    console.log(`[Analytics] Flushing ${this.metricsBuffer.length} events`, this.metricsBuffer)

    // Clear buffer
    this.metricsBuffer = []
  }

  // Placeholder implementations for complex calculations
  private calculateAverageSkillLevel(): number { return 1500 }
  private getTopPerformers(): PlayerSummary[] { return [] }
  private getGameDistribution(): { [gameMode: string]: number } { return {} }
  private calculateConnectionQuality(): ConnectionQuality {
    return {
      averageLatency: 50,
      packetLoss: 0.1,
      disconnectRate: 0.05,
      regionDistribution: { 'global': 100 }
    }
  }
  private getTrendingStrategies(): Strategy[] { return [] }
  private getPopularBrushes(): BrushUsage[] { return [] }
  private getHotZones(): HeatmapPoint[] { return this.heatmapData.slice(0, 10) }
  private createEmptyBehaviorMetrics(playerId: string): PlayerBehaviorMetrics {
    return {
      playerId,
      sessionId: this.currentSession?.id || '',
      timestamp: Date.now(),
      paintingStyle: {
        averageBrushSize: 10,
        preferredColors: [],
        strokeFrequency: 0,
        strokeLength: 0,
        accuracy: 0,
        precision: 0,
        creativityScore: 0,
        symmetryScore: 0
      },
      movementPatterns: [],
      strategyIndicators: [],
      socialBehavior: {
        chatFrequency: 0,
        positivityScore: 0,
        helpfulness: 0,
        toxicityReports: 0,
        friendConnections: 0,
        teamPlayScore: 0
      },
      skillProgression: {
        currentSkillLevel: 1000,
        skillGrowthRate: 0,
        strongestSkills: [],
        weakestSkills: [],
        learningCurve: [],
        masteryLevel: 0
      },
      preferredGameModes: [],
      averageSessionLength: 0,
      retentionRate: 0,
      engagementScore: 0
    }
  }
  private updatePaintingStyle(metrics: PlayerBehaviorMetrics) {}
  private updateMovementPatterns(metrics: PlayerBehaviorMetrics) {}
  private updateSocialBehavior(metrics: PlayerBehaviorMetrics) {}
  private updatePlayerBehavior(playerId: string, gameMetrics: GameMetrics) {}

  public dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.metricsBuffer = []
    this.performanceHistory = []
    this.behaviorMetrics.clear()
    this.heatmapData = []
  }
}

// Machine Learning Models (Simplified)
class StrategyClassifier {
  classify(behavior: PlayerBehaviorMetrics): StrategyIndicator {
    // Simplified classification logic
    return {
      type: 'builder',
      confidence: 0.8,
      adaptability: 0.6,
      riskTaking: 0.4,
      planningDepth: 0.7
    }
  }
}

class SkillPredictor {
  predict(metrics: GameMetrics, behavior?: PlayerBehaviorMetrics): number {
    // Simplified skill prediction
    return 1200 + Math.random() * 400
  }
}

class ChurnPredictor {
  predict(behavior?: PlayerBehaviorMetrics): number {
    // Simplified churn prediction (0-1, where 1 is high churn risk)
    return Math.random() * 0.3 // Low churn risk for demo
  }
}

// Session interface
interface GameSession {
  id: string
  gameId: string
  playerId: string
  startTime: number
  gameMode: string
  settings: any
  events: AnalyticsEvent[]
  metrics: {
    paintStrokes: number
    paintCoverage: number
    powerUpsCollected: number
    socialInteractions: number
    territoryControlled: number
  }
}

// Singleton instance
export const gameAnalytics = new GameAnalyticsEngine()

export default gameAnalytics