/**
 * Game AI Engine
 * 실시간 AI 게임 시스템 - 동적 균형 조정, 전략 분석, 지능형 봇
 */

import { gameAnalytics } from '../analytics/GameAnalyticsEngine'
import { performanceMonitor } from '../monitoring/PerformanceMonitor'
import { getMultiplayerManager } from '../multiplayer/MultiplayerManager'
import { getAchievementSystem } from '../game-engine/AchievementSystem'

// ... (rest of the file)

    const achievementSystem = getAchievementSystem();
    achievementSystem.on('achievement_unlocked', this.handleAchievementEvent.bind(this))

export interface AIPlayerBehavior {
  aggressiveness: number // 0-1
  creativity: number // 0-1
  teamwork: number // 0-1
  adaptability: number // 0-1
  skill_level: number // 0-1000
  preferred_strategies: StrategyType[]
  learning_rate: number // 0-1
  personality_traits: PersonalityTrait[]
}

export interface StrategyType {
  name: string
  priority: number
  conditions: ConditionSet[]
  actions: ActionSequence[]
  success_rate: number
  adaptations: StrategyAdaptation[]
}

export interface ConditionSet {
  type: 'game_state' | 'player_state' | 'environment' | 'social'
  parameters: { [key: string]: any }
  weight: number
}

export interface ActionSequence {
  type: 'movement' | 'painting' | 'combat' | 'social' | 'resource'
  target?: { x: number; y: number }
  duration: number
  intensity: number
  metadata: { [key: string]: any }
}

export interface StrategyAdaptation {
  trigger: string
  modification: string
  learning_weight: number
  confidence: number
}

export interface PersonalityTrait {
  name: string
  intensity: number
  influences: string[]
}

export interface GameBalance {
  skill_variance: number
  resource_distribution: number
  territory_fairness: number
  engagement_level: number
  predicted_winner_probability: number[]
  recommended_adjustments: BalanceAdjustment[]
}

export interface BalanceAdjustment {
  type: 'buff' | 'nerf' | 'environmental' | 'strategic'
  target: string
  intensity: number
  duration: number
  reason: string
  confidence: number
}

export interface AIDecision {
  action: string
  target?: any
  reasoning: string
  confidence: number
  alternatives: AlternativeAction[]
  learning_feedback?: LearningFeedback
}

export interface AlternativeAction {
  action: string
  score: number
  reasoning: string
}

export interface LearningFeedback {
  success: boolean
  actual_outcome: any
  expected_outcome: any
  adjustment_weight: number
}

export interface PredictiveModel {
  type: 'outcome' | 'behavior' | 'balance' | 'engagement'
  accuracy: number
  predictions: Prediction[]
  confidence_intervals: number[]
  last_updated: number
}

export interface Prediction {
  metric: string
  value: number
  probability: number
  time_horizon: number
  factors: PredictionFactor[]
}

export interface PredictionFactor {
  name: string
  impact: number
  confidence: number
}

class GameAIEngine {
  private isActive = false
  private aiPlayers: Map<string, AIPlayerBehavior> = new Map()
  private gameBalance: GameBalance | null = null
  private predictiveModels: Map<string, PredictiveModel> = new Map()
  private decisionHistory: AIDecision[] = []
  private learningData: Map<string, any[]> = new Map()

  // Neural network weights (simplified)
  private neuralWeights: Map<string, number[]> = new Map()
  private strategyClusters: StrategyCluster[] = []

  // Real-time analysis
  private analysisInterval: number | null = null
  private balanceInterval: number | null = null

  constructor() {
    this.initializeAI()
    this.setupEventListeners()
    this.startRealTimeAnalysis()
  }

  private initializeAI() {
    // Initialize predictive models
    this.initializePredictiveModels()

    // Initialize neural network weights
    this.initializeNeuralWeights()

    // Initialize strategy clusters
    this.initializeStrategyClusters()

    console.log('[AI Engine] Initialized with advanced capabilities')
  }

  private initializePredictiveModels() {
    const models = [
      {
        type: 'outcome' as const,
        accuracy: 0.75,
        predictions: [],
        confidence_intervals: [0.6, 0.9],
        last_updated: Date.now()
      },
      {
        type: 'behavior' as const,
        accuracy: 0.68,
        predictions: [],
        confidence_intervals: [0.5, 0.85],
        last_updated: Date.now()
      },
      {
        type: 'balance' as const,
        accuracy: 0.82,
        predictions: [],
        confidence_intervals: [0.7, 0.95],
        last_updated: Date.now()
      },
      {
        type: 'engagement' as const,
        accuracy: 0.71,
        predictions: [],
        confidence_intervals: [0.6, 0.88],
        last_updated: Date.now()
      }
    ]

    models.forEach(model => {
      this.predictiveModels.set(model.type, model)
    })
  }

  private initializeNeuralWeights() {
    // Simplified neural network weights for different AI behaviors
    const weights = {
      'aggression_model': this.generateRandomWeights(15),
      'creativity_model': this.generateRandomWeights(12),
      'teamwork_model': this.generateRandomWeights(18),
      'adaptation_model': this.generateRandomWeights(20),
      'strategy_selection': this.generateRandomWeights(25),
      'balance_prediction': this.generateRandomWeights(30)
    }

    Object.entries(weights).forEach(([key, value]) => {
      this.neuralWeights.set(key, value)
    })
  }

  private generateRandomWeights(count: number): number[] {
    return Array.from({ length: count }, () => (Math.random() - 0.5) * 2)
  }

  private initializeStrategyClusters() {
    this.strategyClusters = [
      {
        name: 'Aggressive Rusher',
        centroid: [0.9, 0.3, 0.2, 0.7], // [aggression, creativity, teamwork, adaptability]
        strategies: this.generateRusherStrategies(),
        member_count: 0
      },
      {
        name: 'Creative Builder',
        centroid: [0.3, 0.9, 0.6, 0.8],
        strategies: this.generateBuilderStrategies(),
        member_count: 0
      },
      {
        name: 'Team Coordinator',
        centroid: [0.5, 0.6, 0.9, 0.7],
        strategies: this.generateCoordinatorStrategies(),
        member_count: 0
      },
      {
        name: 'Adaptive Opportunist',
        centroid: [0.6, 0.7, 0.4, 0.9],
        strategies: this.generateOpportunistStrategies(),
        member_count: 0
      }
    ]
  }

  private generateRusherStrategies(): StrategyType[] {
    return [
      {
        name: 'Territorial Blitz',
        priority: 0.9,
        conditions: [
          {
            type: 'game_state',
            parameters: { time_remaining: 0.7, enemy_territory: 0.4 },
            weight: 0.8
          }
        ],
        actions: [
          {
            type: 'movement',
            target: { x: 0, y: 0 }, // Will be calculated dynamically
            duration: 2000,
            intensity: 0.9,
            metadata: { speed_boost: true, ignore_obstacles: true }
          },
          {
            type: 'painting',
            duration: 1000,
            intensity: 1.0,
            metadata: { brush_size: 'large', rapid_fire: true }
          }
        ],
        success_rate: 0.65,
        adaptations: [
          {
            trigger: 'enemy_resistance',
            modification: 'increase_aggression',
            learning_weight: 0.3,
            confidence: 0.7
          }
        ]
      }
    ]
  }

  private generateBuilderStrategies(): StrategyType[] {
    return [
      {
        name: 'Methodical Expansion',
        priority: 0.8,
        conditions: [
          {
            type: 'game_state',
            parameters: { time_remaining: 0.8, territory_control: 0.3 },
            weight: 0.9
          }
        ],
        actions: [
          {
            type: 'painting',
            duration: 3000,
            intensity: 0.6,
            metadata: { precision: true, pattern: 'systematic' }
          }
        ],
        success_rate: 0.78,
        adaptations: []
      }
    ]
  }

  private generateCoordinatorStrategies(): StrategyType[] {
    return [
      {
        name: 'Team Synchronization',
        priority: 0.7,
        conditions: [
          {
            type: 'social',
            parameters: { team_size: 2, coordination_level: 0.5 },
            weight: 0.8
          }
        ],
        actions: [
          {
            type: 'social',
            duration: 1000,
            intensity: 0.7,
            metadata: { message_type: 'coordinate', target_action: 'group_attack' }
          }
        ],
        success_rate: 0.72,
        adaptations: []
      }
    ]
  }

  private generateOpportunistStrategies(): StrategyType[] {
    return [
      {
        name: 'Dynamic Adaptation',
        priority: 0.6,
        conditions: [
          {
            type: 'environment',
            parameters: { opportunity_detected: true, risk_level: 0.4 },
            weight: 0.9
          }
        ],
        actions: [
          {
            type: 'movement',
            duration: 1500,
            intensity: 0.8,
            metadata: { opportunistic: true, risk_assessment: true }
          }
        ],
        success_rate: 0.69,
        adaptations: []
      }
    ]
  }

  private setupEventListeners() {
    // Listen to game events for AI learning
    if (typeof window !== 'undefined') {
      window.addEventListener('gameEvent', this.handleGameEvent.bind(this))
    }

    // Listen to performance metrics
    performanceMonitor.on('metrics_update', this.handlePerformanceUpdate.bind(this))

    // Listen to multiplayer events
    const multiplayerManager = getMultiplayerManager();
    multiplayerManager.on('*', this.handleMultiplayerEvent.bind(this))

    // Listen to achievement events for learning feedback
    achievementSystem.on('achievement_unlocked', this.handleAchievementEvent.bind(this))
  }

  private startRealTimeAnalysis() {
    // Real-time game balance analysis
    this.balanceInterval = window.setInterval(() => {
      this.analyzeGameBalance()
      this.updatePredictiveModels()
      this.optimizeAIBehaviors()
    }, 2000)

    // AI decision making
    this.analysisInterval = window.setInterval(() => {
      this.makeAIDecisions()
      this.learnFromOutcomes()
    }, 1000)
  }

  // AI Player Management
  public spawnAIPlayer(playerId: string, skillLevel: number = 500): AIPlayerBehavior {
    const behavior: AIPlayerBehavior = {
      aggressiveness: Math.random() * 0.6 + 0.2,
      creativity: Math.random() * 0.8 + 0.1,
      teamwork: Math.random() * 0.7 + 0.2,
      adaptability: Math.random() * 0.9 + 0.1,
      skill_level: skillLevel,
      preferred_strategies: this.selectStrategiesForBehavior(),
      learning_rate: 0.1 + Math.random() * 0.2,
      personality_traits: this.generatePersonalityTraits()
    }

    this.aiPlayers.set(playerId, behavior)
    this.classifyPlayerIntoCluster(playerId, behavior)

    console.log(`[AI Engine] Spawned AI player ${playerId} with skill level ${skillLevel}`)
    return behavior
  }

  private selectStrategiesForBehavior(): StrategyType[] {
    // Select strategies based on personality
    const selectedStrategies: StrategyType[] = []

    this.strategyClusters.forEach(cluster => {
      if (Math.random() < 0.6) { // 60% chance to include strategies from each cluster
        selectedStrategies.push(...cluster.strategies.slice(0, 2))
      }
    })

    return selectedStrategies
  }

  private generatePersonalityTraits(): PersonalityTrait[] {
    const traits = [
      { name: 'perfectionist', intensity: Math.random(), influences: ['precision', 'planning'] },
      { name: 'risk_taker', intensity: Math.random(), influences: ['aggression', 'adaptability'] },
      { name: 'social', intensity: Math.random(), influences: ['teamwork', 'communication'] },
      { name: 'innovative', intensity: Math.random(), influences: ['creativity', 'problem_solving'] },
      { name: 'competitive', intensity: Math.random(), influences: ['aggression', 'achievement'] }
    ]

    return traits.filter(trait => trait.intensity > 0.5) // Keep only strong traits
  }

  private classifyPlayerIntoCluster(playerId: string, behavior: AIPlayerBehavior) {
    const behaviorVector = [
      behavior.aggressiveness,
      behavior.creativity,
      behavior.teamwork,
      behavior.adaptability
    ]

    let closestCluster = this.strategyClusters[0]
    let minDistance = this.calculateEuclideanDistance(behaviorVector, closestCluster.centroid)

    this.strategyClusters.forEach(cluster => {
      const distance = this.calculateEuclideanDistance(behaviorVector, cluster.centroid)
      if (distance < minDistance) {
        minDistance = distance
        closestCluster = cluster
      }
    })

    closestCluster.member_count++
    console.log(`[AI Engine] Classified ${playerId} into cluster: ${closestCluster.name}`)
  }

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
  }

  // Real-time Analysis
  private analyzeGameBalance() {
    const currentRoom = multiplayerManager.currentRoomInfo
    if (!currentRoom) return

    const players = currentRoom.players
    const skillVariance = this.calculateSkillVariance(players)
    const resourceDistribution = this.calculateResourceDistribution()
    const territoryFairness = this.calculateTerritoryFairness()
    const engagementLevel = this.calculateEngagementLevel()

    this.gameBalance = {
      skill_variance: skillVariance,
      resource_distribution: resourceDistribution,
      territory_fairness: territoryFairness,
      engagement_level: engagementLevel,
      predicted_winner_probability: this.predictWinnerProbabilities(players),
      recommended_adjustments: this.generateBalanceAdjustments(skillVariance, territoryFairness)
    }

    // Apply dynamic balance adjustments if needed
    if (this.gameBalance.skill_variance > 0.7 || this.gameBalance.territory_fairness < 0.3) {
      this.applyDynamicBalancing()
    }
  }

  private calculateSkillVariance(players: any[]): number {
    if (players.length < 2) return 0

    const skills = players.map(p => p.score || 0)
    const mean = skills.reduce((a, b) => a + b) / skills.length
    const variance = skills.reduce((sum, skill) => sum + Math.pow(skill - mean, 2), 0) / skills.length

    return Math.min(1, variance / 10000) // Normalize to 0-1
  }

  private calculateResourceDistribution(): number {
    // Simulate resource distribution analysis
    return 0.5 + Math.random() * 0.3
  }

  private calculateTerritoryFairness(): number {
    // Simulate territory control fairness
    return 0.4 + Math.random() * 0.4
  }

  private calculateEngagementLevel(): number {
    const metrics = performanceMonitor.getCurrentMetrics()
    if (!metrics) return 0.5

    // Calculate engagement based on activity level
    const activityScore = Math.min(1, metrics.fps / 60) * 0.3 +
                         (1 - Math.min(1, metrics.networkLatency / 200)) * 0.3 +
                         Math.min(1, (Date.now() - metrics.timestamp) / 10000) * 0.4

    return Math.max(0, Math.min(1, activityScore))
  }

  private predictWinnerProbabilities(players: any[]): number[] {
    return players.map((player, index) => {
      const aiPlayer = this.aiPlayers.get(player.id)
      const baseProb = 1 / players.length

      if (aiPlayer) {
        // Adjust probability based on AI behavior and skill
        const skillFactor = aiPlayer.skill_level / 1000
        const adaptabilityFactor = aiPlayer.adaptability
        return baseProb * (1 + skillFactor * 0.5 + adaptabilityFactor * 0.3)
      }

      return baseProb
    })
  }

  private generateBalanceAdjustments(skillVariance: number, territoryFairness: number): BalanceAdjustment[] {
    const adjustments: BalanceAdjustment[] = []

    if (skillVariance > 0.6) {
      adjustments.push({
        type: 'buff',
        target: 'lower_skill_players',
        intensity: 0.3,
        duration: 30000,
        reason: 'High skill variance detected',
        confidence: 0.8
      })
    }

    if (territoryFairness < 0.4) {
      adjustments.push({
        type: 'environmental',
        target: 'power_up_spawn_rate',
        intensity: 0.5,
        duration: 45000,
        reason: 'Uneven territory distribution',
        confidence: 0.7
      })
    }

    return adjustments
  }

  private applyDynamicBalancing() {
    if (!this.gameBalance) return

    this.gameBalance.recommended_adjustments.forEach(adjustment => {
      if (adjustment.confidence > 0.7) {
        this.executeBalanceAdjustment(adjustment)
      }
    })
  }

  private executeBalanceAdjustment(adjustment: BalanceAdjustment) {
    console.log(`[AI Engine] Applying balance adjustment: ${adjustment.type} to ${adjustment.target}`)

    // Emit balance adjustment event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiBalanceAdjustment', {
        detail: adjustment
      }))
    }
  }

  // AI Decision Making
  private makeAIDecisions() {
    this.aiPlayers.forEach((behavior, playerId) => {
      const decision = this.calculateOptimalAction(playerId, behavior)
      if (decision.confidence > 0.6) {
        this.executeAIAction(playerId, decision)
      }
    })
  }

  private calculateOptimalAction(playerId: string, behavior: AIPlayerBehavior): AIDecision {
    const gameState = this.getCurrentGameState()
    const playerState = this.getPlayerState(playerId)

    // Use neural network to evaluate possible actions
    const possibleActions = this.generatePossibleActions(gameState, playerState)
    const actionScores = possibleActions.map(action => ({
      action,
      score: this.evaluateActionWithNeuralNetwork(action, behavior, gameState)
    }))

    actionScores.sort((a, b) => b.score - a.score)
    const bestAction = actionScores[0]

    return {
      action: bestAction.action.type,
      target: bestAction.action.target,
      reasoning: this.generateReasoning(bestAction.action, behavior),
      confidence: bestAction.score,
      alternatives: actionScores.slice(1, 4).map(a => ({
        action: a.action.type,
        score: a.score,
        reasoning: this.generateReasoning(a.action, behavior)
      }))
    }
  }

  private getCurrentGameState(): any {
    return {
      time_remaining: 0.6,
      player_count: multiplayerManager.currentRoomInfo?.players.length || 1,
      territory_distribution: [0.3, 0.4, 0.2, 0.1],
      power_ups_available: 2,
      intensity_level: this.gameBalance?.engagement_level || 0.5
    }
  }

  private getPlayerState(playerId: string): any {
    const player = multiplayerManager.currentRoomInfo?.players.find(p => p.id === playerId)
    return {
      position: player?.position || { x: 0, y: 0 },
      score: player?.score || 0,
      territory: player?.paintCoverage || 0,
      stamina: 1.0,
      resources: 1.0
    }
  }

  private generatePossibleActions(gameState: any, playerState: any): ActionSequence[] {
    return [
      {
        type: 'movement',
        target: { x: Math.random() * 800, y: Math.random() * 600 },
        duration: 2000,
        intensity: 0.7,
        metadata: { exploration: true }
      },
      {
        type: 'painting',
        duration: 1500,
        intensity: 0.8,
        metadata: { defensive: false }
      },
      {
        type: 'combat',
        duration: 1000,
        intensity: 0.9,
        metadata: { target_priority: 'high' }
      },
      {
        type: 'resource',
        duration: 800,
        intensity: 0.6,
        metadata: { collection: true }
      }
    ]
  }

  private evaluateActionWithNeuralNetwork(action: ActionSequence, behavior: AIPlayerBehavior, gameState: any): number {
    // Simplified neural network evaluation
    const inputs = [
      action.intensity,
      action.duration / 3000,
      behavior.aggressiveness,
      behavior.creativity,
      behavior.skill_level / 1000,
      gameState.time_remaining,
      gameState.intensity_level
    ]

    const weights = this.neuralWeights.get('strategy_selection') || []
    let score = 0

    for (let i = 0; i < Math.min(inputs.length, weights.length); i++) {
      score += inputs[i] * weights[i]
    }

    // Apply sigmoid activation
    return 1 / (1 + Math.exp(-score))
  }

  private generateReasoning(action: ActionSequence, behavior: AIPlayerBehavior): string {
    const reasons = [
      `High ${action.type} priority based on ${behavior.aggressiveness > 0.7 ? 'aggressive' : 'methodical'} personality`,
      `Optimal timing considering current game state and skill level ${behavior.skill_level}`,
      `Strategic decision influenced by ${behavior.creativity > 0.6 ? 'creative' : 'conservative'} approach`,
      `Team coordination factor: ${behavior.teamwork > 0.7 ? 'high' : 'individual'} priority`
    ]

    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  private executeAIAction(playerId: string, decision: AIDecision) {
    // Record decision for learning
    this.decisionHistory.push({
      ...decision,
      learning_feedback: undefined // Will be updated later
    })

    // Emit AI action event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiAction', {
        detail: { playerId, decision }
      }))
    }

    console.log(`[AI Engine] ${playerId} executing ${decision.action} (confidence: ${decision.confidence.toFixed(2)})`)
  }

  // Machine Learning & Adaptation
  private updatePredictiveModels() {
    this.predictiveModels.forEach((model, type) => {
      if (Date.now() - model.last_updated > 10000) { // Update every 10 seconds
        this.trainModel(type, model)
        model.last_updated = Date.now()
      }
    })
  }

  private trainModel(type: string, model: PredictiveModel) {
    // Simplified model training
    const trainingData = this.getLearningData(type)
    if (trainingData.length > 10) {
      // Update model accuracy based on recent performance
      const recentAccuracy = this.calculateModelAccuracy(trainingData.slice(-10))
      model.accuracy = model.accuracy * 0.9 + recentAccuracy * 0.1 // Exponential moving average

      // Update predictions
      model.predictions = this.generatePredictions(type, trainingData)
    }
  }

  private getLearningData(type: string): any[] {
    return this.learningData.get(type) || []
  }

  private calculateModelAccuracy(data: any[]): number {
    // Simplified accuracy calculation
    return 0.6 + Math.random() * 0.3
  }

  private generatePredictions(type: string, data: any[]): Prediction[] {
    return [
      {
        metric: `${type}_score`,
        value: Math.random() * 100,
        probability: 0.6 + Math.random() * 0.3,
        time_horizon: 30000,
        factors: [
          { name: 'player_skill', impact: 0.4, confidence: 0.8 },
          { name: 'game_balance', impact: 0.3, confidence: 0.7 },
          { name: 'team_coordination', impact: 0.3, confidence: 0.6 }
        ]
      }
    ]
  }

  private optimizeAIBehaviors() {
    this.aiPlayers.forEach((behavior, playerId) => {
      const performance = this.evaluateAIPerformance(playerId)
      if (performance.needs_optimization) {
        this.adaptAIBehavior(playerId, behavior, performance)
      }
    })
  }

  private evaluateAIPerformance(playerId: string): { needs_optimization: boolean; weak_areas: string[] } {
    // Simplified performance evaluation
    return {
      needs_optimization: Math.random() < 0.3,
      weak_areas: ['decision_speed', 'strategy_selection']
    }
  }

  private adaptAIBehavior(playerId: string, behavior: AIPlayerBehavior, performance: any) {
    // Adaptive learning
    performance.weak_areas.forEach((area: string) => {
      switch (area) {
        case 'decision_speed':
          behavior.adaptability += 0.05
          break
        case 'strategy_selection':
          behavior.creativity += 0.03
          break
      }
    })

    // Clamp values to valid ranges
    behavior.adaptability = Math.min(1, Math.max(0, behavior.adaptability))
    behavior.creativity = Math.min(1, Math.max(0, behavior.creativity))

    console.log(`[AI Engine] Adapted behavior for ${playerId}`)
  }

  private learnFromOutcomes() {
    // Learn from recent decisions
    this.decisionHistory.slice(-10).forEach(decision => {
      if (!decision.learning_feedback) {
        decision.learning_feedback = this.generateLearningFeedback(decision)
        this.updateNeuralWeights(decision)
      }
    })
  }

  private generateLearningFeedback(decision: AIDecision): LearningFeedback {
    return {
      success: Math.random() > 0.4, // 60% success rate
      actual_outcome: { score_change: Math.random() * 20 - 10 },
      expected_outcome: { score_change: Math.random() * 15 - 5 },
      adjustment_weight: 0.1
    }
  }

  private updateNeuralWeights(decision: AIDecision) {
    if (!decision.learning_feedback) return

    const weights = this.neuralWeights.get('strategy_selection')
    if (weights && decision.learning_feedback.success) {
      // Strengthen successful decision patterns
      for (let i = 0; i < weights.length; i++) {
        weights[i] += decision.learning_feedback.adjustment_weight * (Math.random() - 0.5) * 0.1
      }
    }
  }

  // Event Handlers
  private handleGameEvent(event: CustomEvent) {
    const { type, data } = event.detail

    // Store data for learning
    if (!this.learningData.has(type)) {
      this.learningData.set(type, [])
    }
    this.learningData.get(type)!.push({ ...data, timestamp: Date.now() })

    // Keep only recent data
    const dataArray = this.learningData.get(type)!
    if (dataArray.length > 100) {
      this.learningData.set(type, dataArray.slice(-100))
    }
  }

  private handlePerformanceUpdate(metrics: any) {
    // Update performance-based models
    this.updatePerformanceBasedPredictions(metrics)
  }

  private updatePerformanceBasedPredictions(metrics: any) {
    const performanceModel = this.predictiveModels.get('balance')
    if (performanceModel) {
      performanceModel.predictions.push({
        metric: 'system_performance',
        value: metrics.fps,
        probability: metrics.fps > 30 ? 0.8 : 0.4,
        time_horizon: 5000,
        factors: [
          { name: 'fps', impact: 0.6, confidence: 0.9 },
          { name: 'memory', impact: 0.4, confidence: 0.7 }
        ]
      })
    }
  }

  private handleMultiplayerEvent(event: any) {
    // Learn from multiplayer interactions
    this.updateSocialLearning(event)
  }

  private updateSocialLearning(event: any) {
    // Update AI understanding of social dynamics
    this.aiPlayers.forEach((behavior, playerId) => {
      if (event.type === 'player_joined' || event.type === 'player_left') {
        behavior.teamwork += Math.random() * 0.02 - 0.01 // Slight random adjustment
        behavior.teamwork = Math.max(0, Math.min(1, behavior.teamwork))
      }
    })
  }

  private handleAchievementEvent(achievement: any) {
    // Learn from achievement patterns
    this.updateAchievementLearning(achievement)
  }

  private updateAchievementLearning(achievement: any) {
    // Update AI goals based on achievement patterns
    console.log(`[AI Engine] Learning from achievement: ${achievement.title}`)
  }

  // Public API
  public getAIPlayer(playerId: string): AIPlayerBehavior | null {
    return this.aiPlayers.get(playerId) || null
  }

  public getGameBalance(): GameBalance | null {
    return this.gameBalance
  }

  public getPredictiveModel(type: string): PredictiveModel | null {
    return this.predictiveModels.get(type) || null
  }

  public getDecisionHistory(): AIDecision[] {
    return [...this.decisionHistory.slice(-50)] // Return last 50 decisions
  }

  public getStrategyClusters(): StrategyCluster[] {
    return [...this.strategyClusters]
  }

  public forceBalanceCheck(): void {
    this.analyzeGameBalance()
    if (this.gameBalance) {
      this.applyDynamicBalancing()
    }
  }

  public updateAISkillLevel(playerId: string, newSkillLevel: number): void {
    const aiPlayer = this.aiPlayers.get(playerId)
    if (aiPlayer) {
      aiPlayer.skill_level = newSkillLevel
      console.log(`[AI Engine] Updated ${playerId} skill level to ${newSkillLevel}`)
    }
  }

  public dispose() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    if (this.balanceInterval) {
      clearInterval(this.balanceInterval)
    }

    this.aiPlayers.clear()
    this.decisionHistory = []
    this.learningData.clear()
  }
}

// Additional interfaces
interface StrategyCluster {
  name: string
  centroid: number[]
  strategies: StrategyType[]
  member_count: number
}

// Singleton instance
export const gameAI = new GameAIEngine()

// React Hook
export function useGameAI() {
  const [aiPlayers, setAIPlayers] = React.useState<Map<string, AIPlayerBehavior>>(new Map())
  const [gameBalance, setGameBalance] = React.useState<GameBalance | null>(null)
  const [predictions, setPredictions] = React.useState<Map<string, PredictiveModel>>(new Map())

  React.useEffect(() => {
    const updateAIData = () => {
      setGameBalance(gameAI.getGameBalance())

      // Update predictions
      const newPredictions = new Map()
      ;['outcome', 'behavior', 'balance', 'engagement'].forEach(type => {
        const model = gameAI.getPredictiveModel(type)
        if (model) newPredictions.set(type, model)
      })
      setPredictions(newPredictions)
    }

    const interval = setInterval(updateAIData, 2000)
    updateAIData() // Initial update

    return () => clearInterval(interval)
  }, [])

  return {
    gameBalance,
    predictions,
    aiPlayers,
    spawnAIPlayer: gameAI.spawnAIPlayer.bind(gameAI),
    getDecisionHistory: gameAI.getDecisionHistory.bind(gameAI),
    getStrategyClusters: gameAI.getStrategyClusters.bind(gameAI),
    forceBalanceCheck: gameAI.forceBalanceCheck.bind(gameAI),
    updateAISkillLevel: gameAI.updateAISkillLevel.bind(gameAI)
  }
}

// React import
import React from 'react'

export default gameAI