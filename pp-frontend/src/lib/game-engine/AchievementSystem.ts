/**
 * Achievement System & Progression Mechanics
 * 게임 도전과제와 진행 시스템 - 사이버펑크 테마
 */

import { performanceMonitor } from '../monitoring/PerformanceMonitor'

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  icon: string
  requirements: AchievementRequirement[]
  rewards: AchievementReward[]
  isUnlocked: boolean
  unlockedAt?: number
  progress: number
  maxProgress: number
  isSecret: boolean
  prerequisiteIds?: string[]
}

export interface AchievementRequirement {
  type: RequirementType
  value: number
  operator: 'eq' | 'gte' | 'lte' | 'gt' | 'lt'
  statKey: string
}

export interface AchievementReward {
  type: RewardType
  value: number
  item?: string
}

export enum AchievementCategory {
  PAINTING = 'painting',
  COMBAT = 'combat',
  SOCIAL = 'social',
  EXPLORATION = 'exploration',
  MASTERY = 'mastery',
  SPECIAL = 'special'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  LEGENDARY = 'legendary'
}

export enum RequirementType {
  TOTAL_PAINT_COVERAGE = 'total_paint_coverage',
  GAMES_PLAYED = 'games_played',
  GAMES_WON = 'games_won',
  CONSECUTIVE_WINS = 'consecutive_wins',
  TERRITORY_CAPTURED = 'territory_captured',
  PAINT_STROKES = 'paint_strokes',
  MULTIPLAYER_KILLS = 'multiplayer_kills',
  TIME_PLAYED = 'time_played',
  PERFECT_GAMES = 'perfect_games',
  COMEBACK_WINS = 'comeback_wins',
  SOCIAL_INTERACTIONS = 'social_interactions',
  CUSTOM_STAT = 'custom_stat'
}

export enum RewardType {
  EXPERIENCE = 'experience',
  PAINT_CREDITS = 'paint_credits',
  BRUSH_UNLOCK = 'brush_unlock',
  COLOR_UNLOCK = 'color_unlock',
  EFFECT_UNLOCK = 'effect_unlock',
  TITLE_UNLOCK = 'title_unlock',
  AVATAR_UNLOCK = 'avatar_unlock'
}

export interface PlayerProgress {
  level: number
  experience: number
  experienceToNext: number
  totalPaintCoverage: number
  gamesPlayed: number
  gamesWon: number
  consecutiveWins: number
  currentStreak: number
  bestStreak: number
  territoryCaptures: number
  paintStrokes: number
  totalPlayTime: number
  perfectGames: number
  comebackWins: number
  socialInteractions: number
  customStats: Map<string, number>
}

export interface UnlockNotification {
  achievement: Achievement
  timestamp: number
  displayed: boolean
}

class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map()
  private playerProgress: PlayerProgress
  private pendingNotifications: UnlockNotification[] = []
  private gameSession: GameSessionData | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.playerProgress = {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      totalPaintCoverage: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      consecutiveWins: 0,
      currentStreak: 0,
      bestStreak: 0,
      territoryCaptures: 0,
      paintStrokes: 0,
      totalPlayTime: 0,
      perfectGames: 0,
      comebackWins: 0,
      socialInteractions: 0,
      customStats: new Map()
    };
    this.initializeAchievements()
    this.setupEventListeners()
  }

  public initialize() {
    this.playerProgress = this.loadPlayerProgress();
    this.updateAllProgress();
  }

  private loadPlayerProgress(): PlayerProgress {
    const saved = localStorage.getItem('pp_player_progress')
    if (saved) {
      const data = JSON.parse(saved)
      return {
        ...data,
        customStats: new Map(data.customStats || [])
      }
    }

    return {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      totalPaintCoverage: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      consecutiveWins: 0,
      currentStreak: 0,
      bestStreak: 0,
      territoryCaptures: 0,
      paintStrokes: 0,
      totalPlayTime: 0,
      perfectGames: 0,
      comebackWins: 0,
      socialInteractions: 0,
      customStats: new Map()
    }
  }

  private savePlayerProgress() {
    const data = {
      ...this.playerProgress,
      customStats: Array.from(this.playerProgress.customStats.entries())
    }
    localStorage.setItem('pp_player_progress', JSON.stringify(data))
  }

  private initializeAchievements() {
    const achievements: Achievement[] = [
      // Painting Achievements
      {
        id: 'first_stroke',
        title: 'First Stroke',
        description: 'Paint your first stroke on the canvas',
        category: AchievementCategory.PAINTING,
        tier: AchievementTier.BRONZE,
        icon: '🎨',
        requirements: [
          { type: RequirementType.PAINT_STROKES, value: 1, operator: 'gte', statKey: 'paintStrokes' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 50 },
          { type: RewardType.PAINT_CREDITS, value: 100 }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        isSecret: false
      },

      {
        id: 'paint_master',
        title: 'Paint Master',
        description: 'Paint 10,000 strokes across all games',
        category: AchievementCategory.PAINTING,
        tier: AchievementTier.GOLD,
        icon: '🖌️',
        requirements: [
          { type: RequirementType.PAINT_STROKES, value: 10000, operator: 'gte', statKey: 'paintStrokes' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 1000 },
          { type: RewardType.BRUSH_UNLOCK, value: 1, item: 'cyberpunk_brush' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 10000,
        isSecret: false
      },

      {
        id: 'territory_dominator',
        title: 'Territory Dominator',
        description: 'Capture 75% of the canvas in a single game',
        category: AchievementCategory.COMBAT,
        tier: AchievementTier.SILVER,
        icon: '🏴',
        requirements: [
          { type: RequirementType.CUSTOM_STAT, value: 75, operator: 'gte', statKey: 'max_territory_percentage' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 300 },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'Dominator' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 75,
        isSecret: false
      },

      // Combat Achievements
      {
        id: 'first_victory',
        title: 'First Victory',
        description: 'Win your first multiplayer game',
        category: AchievementCategory.COMBAT,
        tier: AchievementTier.BRONZE,
        icon: '🏆',
        requirements: [
          { type: RequirementType.GAMES_WON, value: 1, operator: 'gte', statKey: 'gamesWon' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 100 },
          { type: RewardType.COLOR_UNLOCK, value: 1, item: 'victory_gold' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        isSecret: false
      },

      {
        id: 'unstoppable',
        title: 'Unstoppable',
        description: 'Win 10 consecutive games',
        category: AchievementCategory.COMBAT,
        tier: AchievementTier.PLATINUM,
        icon: '⚡',
        requirements: [
          { type: RequirementType.CONSECUTIVE_WINS, value: 10, operator: 'gte', statKey: 'currentStreak' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 2000 },
          { type: RewardType.EFFECT_UNLOCK, value: 1, item: 'lightning_effect' },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'Unstoppable' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 10,
        isSecret: false
      },

      {
        id: 'comeback_king',
        title: 'Comeback King',
        description: 'Win a game after being behind by 50% territory',
        category: AchievementCategory.COMBAT,
        tier: AchievementTier.GOLD,
        icon: '👑',
        requirements: [
          { type: RequirementType.COMEBACK_WINS, value: 1, operator: 'gte', statKey: 'comebackWins' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 500 },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'Comeback King' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        isSecret: false
      },

      // Social Achievements
      {
        id: 'social_butterfly',
        title: 'Social Butterfly',
        description: 'Play with 100 different players',
        category: AchievementCategory.SOCIAL,
        tier: AchievementTier.SILVER,
        icon: '🦋',
        requirements: [
          { type: RequirementType.CUSTOM_STAT, value: 100, operator: 'gte', statKey: 'unique_players_met' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 400 },
          { type: RewardType.AVATAR_UNLOCK, value: 1, item: 'social_avatar' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 100,
        isSecret: false
      },

      // Mastery Achievements
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Win a game with 100% territory control',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.PLATINUM,
        icon: '💎',
        requirements: [
          { type: RequirementType.PERFECT_GAMES, value: 1, operator: 'gte', statKey: 'perfectGames' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 1500 },
          { type: RewardType.EFFECT_UNLOCK, value: 1, item: 'perfect_aura' },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'Perfectionist' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        isSecret: false
      },

      // Secret Achievements
      {
        id: 'glitch_master',
        title: '01000111 01001100 01001001',
        description: '???',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.LEGENDARY,
        icon: '⚡',
        requirements: [
          { type: RequirementType.CUSTOM_STAT, value: 1, operator: 'gte', statKey: 'glitch_mode_wins' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 5000 },
          { type: RewardType.BRUSH_UNLOCK, value: 1, item: 'glitch_brush' },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'Glitch Master' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        isSecret: true
      },

      {
        id: 'matrix_awakening',
        title: 'Matrix Awakening',
        description: 'There is no spoon',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.LEGENDARY,
        icon: '🔴',
        requirements: [
          { type: RequirementType.CUSTOM_STAT, value: 1337, operator: 'eq', statKey: 'paint_strokes_exact' }
        ],
        rewards: [
          { type: RewardType.EXPERIENCE, value: 10000 },
          { type: RewardType.EFFECT_UNLOCK, value: 1, item: 'matrix_rain' },
          { type: RewardType.TITLE_UNLOCK, value: 1, item: 'The One' }
        ],
        isUnlocked: false,
        progress: 0,
        maxProgress: 1337,
        isSecret: true
      }
    ]

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })

    this.updateAllProgress()
  }

  private setupEventListeners() {
    // Set up event listeners for game events that trigger achievements
    if (typeof window !== 'undefined') {
      window.addEventListener('gameEvent', this.handleGameEvent.bind(this))
    }
  }

  private handleGameEvent(event: CustomEvent) {
    const { type, data } = event.detail

    switch (type) {
      case 'paint_stroke':
        this.incrementStat('paintStrokes', 1)
        this.incrementStat('paint_strokes_exact', 1)
        break

      case 'territory_captured':
        this.incrementStat('territoryCaptures', 1)
        break

      case 'game_won':
        this.incrementStat('gamesWon', 1)
        this.incrementStat('currentStreak', 1)
        if (this.playerProgress.currentStreak > this.playerProgress.bestStreak) {
          this.playerProgress.bestStreak = this.playerProgress.currentStreak
        }
        if (data?.isPerfect) {
          this.incrementStat('perfectGames', 1)
        }
        if (data?.isComeback) {
          this.incrementStat('comebackWins', 1)
        }
        if (data?.glitchMode) {
          this.incrementStat('glitch_mode_wins', 1)
        }
        break

      case 'game_lost':
        this.playerProgress.currentStreak = 0
        break

      case 'game_finished':
        this.incrementStat('gamesPlayed', 1)
        if (data?.territoryPercentage) {
          const maxTerritory = this.getCustomStat('max_territory_percentage')
          if (data.territoryPercentage > maxTerritory) {
            this.setCustomStat('max_territory_percentage', data.territoryPercentage)
          }
        }
        break

      case 'player_interaction':
        this.incrementStat('socialInteractions', 1)
        if (data?.newPlayer) {
          this.incrementCustomStat('unique_players_met', 1)
        }
        break
    }

    this.updateAllProgress()
    this.savePlayerProgress()
  }

  // Public API
  public trackPaintStroke() {
    this.dispatchGameEvent('paint_stroke', {})
  }

  public trackTerritoryCapture() {
    this.dispatchGameEvent('territory_captured', {})
  }

  public trackGameResult(won: boolean, data: any = {}) {
    if (won) {
      this.dispatchGameEvent('game_won', data)
    } else {
      this.dispatchGameEvent('game_lost', data)
    }
    this.dispatchGameEvent('game_finished', data)
  }

  public trackPlayerInteraction(isNewPlayer: boolean = false) {
    this.dispatchGameEvent('player_interaction', { newPlayer: isNewPlayer })
  }

  private dispatchGameEvent(type: string, data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: { type, data }
      }))
    }
  }

  private updateAllProgress() {
    this.achievements.forEach(achievement => {
      this.updateAchievementProgress(achievement)
    })
  }

  private updateAchievementProgress(achievement: Achievement) {
    if (achievement.isUnlocked) return

    // Check prerequisites
    if (achievement.prerequisiteIds) {
      const prerequisitesMet = achievement.prerequisiteIds.every(id => {
        const prereq = this.achievements.get(id)
        return prereq?.isUnlocked
      })
      if (!prerequisitesMet) return
    }

    let currentProgress = 0
    let requirementsMet = true

    achievement.requirements.forEach(req => {
      const statValue = this.getStatValue(req.statKey)
      let isMetValue = false

      switch (req.operator) {
        case 'eq': isMetValue = statValue === req.value; break
        case 'gte': isMetValue = statValue >= req.value; break
        case 'lte': isMetValue = statValue <= req.value; break
        case 'gt': isMetValue = statValue > req.value; break
        case 'lt': isMetValue = statValue < req.value; break
      }

      if (!isMetValue) {
        requirementsMet = false
      }

      // Calculate progress for progress tracking
      if (req.operator === 'gte' || req.operator === 'gt') {
        currentProgress = Math.min(statValue, req.value)
      } else if (req.operator === 'eq') {
        currentProgress = statValue === req.value ? req.value : statValue
      }
    })

    achievement.progress = currentProgress

    if (requirementsMet && !achievement.isUnlocked) {
      this.unlockAchievement(achievement)
    }
  }

  private unlockAchievement(achievement: Achievement) {
    achievement.isUnlocked = true
    achievement.unlockedAt = Date.now()

    // Apply rewards
    achievement.rewards.forEach(reward => {
      this.applyReward(reward)
    })

    // Add notification
    this.pendingNotifications.push({
      achievement,
      timestamp: Date.now(),
      displayed: false
    })

    // Emit achievement unlocked event
    this.emit('achievement_unlocked', achievement)

    console.log(`🏆 Achievement Unlocked: ${achievement.title}`)

    // Check for level up
    this.checkLevelUp()
  }

  private applyReward(reward: AchievementReward) {
    switch (reward.type) {
      case RewardType.EXPERIENCE:
        this.addExperience(reward.value)
        break

      case RewardType.PAINT_CREDITS:
        this.incrementCustomStat('paint_credits', reward.value)
        break

      case RewardType.BRUSH_UNLOCK:
      case RewardType.COLOR_UNLOCK:
      case RewardType.EFFECT_UNLOCK:
      case RewardType.TITLE_UNLOCK:
      case RewardType.AVATAR_UNLOCK:
        this.unlockItem(reward.type, reward.item!)
        break
    }
  }

  private addExperience(amount: number) {
    this.playerProgress.experience += amount

    // Performance monitoring
    performanceMonitor.addCustomMetric('experience_gained', amount)
  }

  private checkLevelUp() {
    while (this.playerProgress.experience >= this.playerProgress.experienceToNext) {
      this.playerProgress.experience -= this.playerProgress.experienceToNext
      this.playerProgress.level++
      this.playerProgress.experienceToNext = this.calculateExperienceRequired(this.playerProgress.level + 1)

      this.emit('level_up', {
        newLevel: this.playerProgress.level,
        experienceToNext: this.playerProgress.experienceToNext
      })

      console.log(`🆙 Level Up! You are now level ${this.playerProgress.level}`)
    }
  }

  private calculateExperienceRequired(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  private unlockItem(type: RewardType, item: string) {
    const unlockedItems = this.getCustomStat('unlocked_items') as any || {}
    if (!unlockedItems[type]) {
      unlockedItems[type] = []
    }
    if (!unlockedItems[type].includes(item)) {
      unlockedItems[type].push(item)
      this.setCustomStat('unlocked_items', unlockedItems)
    }
  }

  // Utility methods
  private getStatValue(statKey: string): number {
    if (statKey in this.playerProgress) {
      return (this.playerProgress as any)[statKey]
    }
    return this.getCustomStat(statKey)
  }

  private incrementStat(statKey: string, amount: number) {
    if (statKey in this.playerProgress) {
      (this.playerProgress as any)[statKey] += amount
    } else {
      this.incrementCustomStat(statKey, amount)
    }
  }

  private getCustomStat(key: string): number {
    return this.playerProgress.customStats.get(key) || 0
  }

  private setCustomStat(key: string, value: number) {
    this.playerProgress.customStats.set(key, value)
  }

  private incrementCustomStat(key: string, amount: number) {
    const current = this.getCustomStat(key)
    this.setCustomStat(key, current + amount)
  }

  // Event system
  private emit(eventType: string, data: any) {
    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('Error in achievement event listener:', error)
      }
    })
  }

  public on(eventType: string, listener: Function) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  public off(eventType: string, listener: Function) {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Public getters
  public getPlayerProgress(): PlayerProgress {
    return { ...this.playerProgress }
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.isUnlocked)
  }

  public getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter(a => a.category === category)
  }

  public getPendingNotifications(): UnlockNotification[] {
    return this.pendingNotifications.filter(n => !n.displayed)
  }

  public markNotificationDisplayed(achievementId: string) {
    const notification = this.pendingNotifications.find(n => n.achievement.id === achievementId)
    if (notification) {
      notification.displayed = true
    }
  }

  public getCompletionPercentage(): number {
    const total = this.achievements.size
    const unlocked = this.getUnlockedAchievements().length
    return Math.round((unlocked / total) * 100)
  }

  public getUnlockedItems(): any {
    return this.getCustomStat('unlocked_items') || {}
  }
}

// Session data interface
interface GameSessionData {
  startTime: number
  paintStrokes: number
  territoryPercentage: number
  wasWinning: boolean
  glitchMode: boolean
}

// Singleton instance
let achievementSystemInstance: AchievementSystem | null = null;

export const getAchievementSystem = (): AchievementSystem => {
  if (typeof window === 'undefined') {
    // Return a mock/dummy version on the server
    return {
      on: () => {},
      off: () => {},
      initialize: () => {},
      getPlayerProgress: () => ({
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalPaintCoverage: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        consecutiveWins: 0,
        currentStreak: 0,
        bestStreak: 0,
        territoryCaptures: 0,
        paintStrokes: 0,
        totalPlayTime: 0,
        perfectGames: 0,
        comebackWins: 0,
        socialInteractions: 0,
        customStats: new Map(),
      }),
      getAllAchievements: () => [],
      getPendingNotifications: () => [],
    } as any;
  }
  if (!achievementSystemInstance) {
    achievementSystemInstance = new AchievementSystem();
  }
  return achievementSystemInstance;
};

// React Hook
export function useAchievements() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const achievementSystem = getAchievementSystem();

  const [progress, setProgress] = React.useState(achievementSystem.getPlayerProgress())
  const [achievements, setAchievements] = React.useState(achievementSystem.getAllAchievements())
  const [notifications, setNotifications] = React.useState(achievementSystem.getPendingNotifications())

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      achievementSystem.initialize();
      setIsInitialized(true);

      const updateProgress = () => {
        setProgress(achievementSystem.getPlayerProgress())
        setAchievements(achievementSystem.getAllAchievements())
        setNotifications(achievementSystem.getPendingNotifications())
      }

      achievementSystem.on('achievement_unlocked', updateProgress)
      achievementSystem.on('level_up', updateProgress)

      return () => {
        achievementSystem.off('achievement_unlocked', updateProgress)
        achievementSystem.off('level_up', updateProgress)
      }
    }
  }, [achievementSystem])

  if (!isInitialized) {
    return {
      progress,
      achievements,
      notifications,
      markNotificationDisplayed: () => {},
      trackPaintStroke: () => {},
      trackTerritoryCapture: () => {},
      trackGameResult: () => {},
      trackPlayerInteraction: () => {},
      getCompletionPercentage: () => 0,
      getUnlockedItems: () => ({}),
    }
  }

  return {
    progress,
    achievements,
    notifications,
    markNotificationDisplayed: achievementSystem.markNotificationDisplayed.bind(achievementSystem),
    trackPaintStroke: achievementSystem.trackPaintStroke.bind(achievementSystem),
    trackTerritoryCapture: achievementSystem.trackTerritoryCapture.bind(achievementSystem),
    trackGameResult: achievementSystem.trackGameResult.bind(achievementSystem),
    trackPlayerInteraction: achievementSystem.trackPlayerInteraction.bind(achievementSystem),
    getCompletionPercentage: achievementSystem.getCompletionPercentage.bind(achievementSystem),
    getUnlockedItems: achievementSystem.getUnlockedItems.bind(achievementSystem)
  }
}

// React import
import React from 'react'
