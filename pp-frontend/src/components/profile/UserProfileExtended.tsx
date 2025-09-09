// frontend/src/components/profile/UserProfileExtended.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserProfile {
  id: string
  username: string
  email: string
  displayName: string
  level: number
  exp: number
  expToNext: number
  avatar: {
    image: string
    frame: string
    background: string
    effects: string[]
  }
  titles: {
    current: string
    unlocked: string[]
  }
  badges: Array<{
    id: string
    name: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    unlockedAt: Date
  }>
  stats: {
    totalGamesPlayed: number
    totalWins: number
    totalPoints: number
    winRate: number
    currentStreak: number
    bestStreak: number
    favoriteGame: string
    totalPlayTime: number
  }
  gameStats: {
    numberBattle: {
      gamesPlayed: number
      wins: number
      bestTime: number
      averageAccuracy: number
      highestStreak: number
    }
    wordBattle: {
      gamesPlayed: number
      wins: number
      averageWPM: number
      totalWordsTyped: number
      bestAccuracy: number
    }
    memoryChallenge: {
      gamesPlayed: number
      wins: number
      bestLevel: number
      averageReactionTime: number
      perfectGames: number
    }
    reactionSurvival: {
      gamesPlayed: number
      wins: number
      fastestReaction: number
      averageAccuracy: number
      multitaskingRecord: number
    }
  }
  social: {
    friends: string[]
    followers: string[]
    following: string[]
  }
  premium: {
    isActive: boolean
    tier: 'basic' | 'premium' | 'vip'
    expiresAt?: Date
  }
  customization: {
    unlockedAvatars: string[]
    unlockedFrames: string[]
    unlockedBackgrounds: string[]
    unlockedEffects: string[]
    unlockedTitles: string[]
  }
}

const AVATAR_FRAMES = [
  { id: 'default', name: '기본 프레임', cost: 0, rarity: 'common' },
  { id: 'gold', name: '골든 프레임', cost: 500, rarity: 'rare' },
  { id: 'diamond', name: '다이아몬드 프레임', cost: 1000, rarity: 'epic' },
  { id: 'rainbow', name: '레인보우 프레임', cost: 1500, rarity: 'legendary' },
  { id: 'fire', name: '파이어 프레임', cost: 800, rarity: 'epic' },
  { id: 'ice', name: '아이스 프레임', cost: 800, rarity: 'epic' }
]

const PROFILE_BACKGROUNDS = [
  { id: 'default', name: '기본 배경', cost: 0, rarity: 'common' },
  { id: 'galaxy', name: '갤럭시 배경', cost: 300, rarity: 'rare' },
  { id: 'neon', name: '네온 배경', cost: 600, rarity: 'epic' },
  { id: 'forest', name: '포레스트 배경', cost: 400, rarity: 'rare' },
  { id: 'cyber', name: '사이버 배경', cost: 1200, rarity: 'legendary' }
]

const TITLES = [
  { id: 'newbie', name: '뉴비', cost: 0, requirement: '첫 게임 완료' },
  { id: 'speedster', name: '스피드스터', cost: 200, requirement: '평균 반응속도 200ms 이하' },
  { id: 'wordmaster', name: '워드마스터', cost: 300, requirement: 'WPM 100 이상 달성' },
  { id: 'memory_king', name: '기억의 왕', cost: 400, requirement: '메모리 게임 레벨 20 달성' },
  { id: 'number_genius', name: '숫자 천재', cost: 350, requirement: '숫자 게임 연속 10승' },
  { id: 'champion', name: '챔피언', cost: 800, requirement: '총 100승 달성' },
  { id: 'legend', name: '레전드', cost: 1500, requirement: '모든 게임 마스터 달성' }
]

const SPECIAL_EFFECTS = [
  { id: 'sparkles', name: '반짝임 효과', cost: 150, rarity: 'rare' },
  { id: 'glow', name: '발광 효과', cost: 200, rarity: 'rare' },
  { id: 'particles', name: '파티클 효과', cost: 400, rarity: 'epic' },
  { id: 'lightning', name: '번개 효과', cost: 600, rarity: 'epic' },
  { id: 'aurora', name: '오로라 효과', cost: 1000, rarity: 'legendary' }
]

export const UserProfileExtended: React.FC<{ userId: string; isOwner: boolean }> = ({ userId, isOwner }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'social' | 'customize'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock profile data - in real implementation, fetch from API
    const mockProfile: UserProfile = {
      id: userId,
      username: 'GameMaster2024',
      email: 'user@example.com',
      displayName: 'Game Master',
      level: 42,
      exp: 8750,
      expToNext: 1250,
      avatar: {
        image: '🎮',
        frame: 'gold',
        background: 'galaxy',
        effects: ['sparkles', 'glow']
      },
      titles: {
        current: 'champion',
        unlocked: ['newbie', 'speedster', 'wordmaster', 'champion']
      },
      badges: [
        { id: '1', name: '첫 승리', icon: '🏆', rarity: 'common', unlockedAt: new Date('2024-01-15') },
        { id: '2', name: '연속 승리', icon: '🔥', rarity: 'rare', unlockedAt: new Date('2024-02-20') },
        { id: '3', name: '완벽한 게임', icon: '💎', rarity: 'epic', unlockedAt: new Date('2024-03-10') },
        { id: '4', name: '스피드 마스터', icon: '⚡', rarity: 'legendary', unlockedAt: new Date('2024-04-01') }
      ],
      stats: {
        totalGamesPlayed: 247,
        totalWins: 156,
        totalPoints: 45230,
        winRate: 63.2,
        currentStreak: 5,
        bestStreak: 12,
        favoriteGame: 'Word Battle Arena',
        totalPlayTime: 3420 // minutes
      },
      gameStats: {
        numberBattle: {
          gamesPlayed: 65,
          wins: 42,
          bestTime: 145,
          averageAccuracy: 89.5,
          highestStreak: 8
        },
        wordBattle: {
          gamesPlayed: 82,
          wins: 53,
          averageWPM: 85,
          totalWordsTyped: 12450,
          bestAccuracy: 98.2
        },
        memoryChallenge: {
          gamesPlayed: 56,
          wins: 34,
          bestLevel: 18,
          averageReactionTime: 280,
          perfectGames: 7
        },
        reactionSurvival: {
          gamesPlayed: 44,
          wins: 27,
          fastestReaction: 125,
          averageAccuracy: 91.3,
          multitaskingRecord: 15
        }
      },
      social: {
        friends: ['friend1', 'friend2', 'friend3'],
        followers: ['user1', 'user2'],
        following: ['pro1', 'pro2', 'pro3', 'pro4']
      },
      premium: {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2024-12-31')
      },
      customization: {
        unlockedAvatars: ['🎮', '🎯', '🎪', '🏆'],
        unlockedFrames: ['default', 'gold', 'diamond'],
        unlockedBackgrounds: ['default', 'galaxy', 'neon'],
        unlockedEffects: ['sparkles', 'glow'],
        unlockedTitles: ['newbie', 'speedster', 'wordmaster', 'champion']
      }
    }

    setTimeout(() => {
      setProfile(mockProfile)
      setLoading(false)
    }, 1000)
  }, [userId])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400'
      case 'rare': return 'text-blue-400 border-blue-400'
      case 'epic': return 'text-purple-400 border-purple-400'
      case 'legendary': return 'text-yellow-400 border-yellow-400'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const OverviewTab: React.FC = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-24 h-24 text-4xl bg-white/20 rounded-full flex items-center justify-center border-4 ${
              profile?.avatar.frame === 'gold' ? 'border-yellow-400' :
              profile?.avatar.frame === 'diamond' ? 'border-blue-400' :
              profile?.avatar.frame === 'rainbow' ? 'border-gradient-to-r from-red-400 to-purple-400' : 'border-white'
            }`}>
              {profile?.avatar.image}
            </div>
            {profile?.avatar.effects.includes('sparkles') && (
              <div className="absolute inset-0 animate-pulse">
                <div className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2">✨</div>
                <div className="w-4 h-4 text-yellow-200 absolute -bottom-1 -left-1">⭐</div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
              <h2 className="text-2xl font-bold">{profile?.displayName}</h2>
              {profile?.premium.isActive && (
                <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-bold text-black">
                  {profile.premium.tier.toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-lg opacity-80 mb-2">@{profile?.username}</div>
            <div className="text-sm opacity-70 mb-4">
              {TITLES.find(t => t.id === profile?.titles.current)?.name || '뉴비'}
            </div>
            
            {/* Level Progress */}
            <div className="bg-white/20 rounded-full h-3 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile ? (profile.exp / (profile.exp + profile.expToNext)) * 100 : 0}%` }}
                className="bg-gradient-to-r from-yellow-300 to-orange-300 h-3 rounded-full"
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            <div className="text-sm opacity-80">
              레벨 {profile?.level} • {profile?.exp.toLocaleString()} / {profile ? (profile.exp + profile.expToNext).toLocaleString() : 0} XP
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-game text-center"
        >
          <div className="text-2xl font-bold text-blue-400">{profile?.stats.totalGamesPlayed}</div>
          <div className="text-sm text-gray-300">총 게임</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-game text-center"
        >
          <div className="text-2xl font-bold text-green-400">{profile?.stats.totalWins}</div>
          <div className="text-sm text-gray-300">승리</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-game text-center"
        >
          <div className="text-2xl font-bold text-purple-400">{profile?.stats.winRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-300">승률</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-game text-center"
        >
          <div className="text-2xl font-bold text-yellow-400">{profile?.stats.currentStreak}</div>
          <div className="text-sm text-gray-300">현재 연승</div>
        </motion.div>
      </div>

      {/* Recent Badges */}
      <div className="card-game">
        <h3 className="text-xl font-bold mb-4">🏆 최근 획득 뱃지</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile?.badges.slice(0, 4).map(badge => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-xl border-2 ${getRarityColor(badge.rarity)} bg-white/5`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-semibold text-sm">{badge.name}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(badge.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const StatsTab: React.FC = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Number Battle Stats */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="card-game"
        >
          <h3 className="text-xl font-bold mb-4">🔢 배틀 넘버 아레나</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>플레이 횟수:</span>
              <span className="font-bold">{profile?.gameStats.numberBattle.gamesPlayed}회</span>
            </div>
            <div className="flex justify-between">
              <span>승리:</span>
              <span className="font-bold text-green-400">{profile?.gameStats.numberBattle.wins}회</span>
            </div>
            <div className="flex justify-between">
              <span>최단 시간:</span>
              <span className="font-bold text-blue-400">{profile?.gameStats.numberBattle.bestTime}초</span>
            </div>
            <div className="flex justify-between">
              <span>평균 정확도:</span>
              <span className="font-bold text-purple-400">{profile?.gameStats.numberBattle.averageAccuracy}%</span>
            </div>
          </div>
        </motion.div>

        {/* Word Battle Stats */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="card-game"
        >
          <h3 className="text-xl font-bold mb-4">📝 워드 배틀 아레나</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>플레이 횟수:</span>
              <span className="font-bold">{profile?.gameStats.wordBattle.gamesPlayed}회</span>
            </div>
            <div className="flex justify-between">
              <span>승리:</span>
              <span className="font-bold text-green-400">{profile?.gameStats.wordBattle.wins}회</span>
            </div>
            <div className="flex justify-between">
              <span>평균 WPM:</span>
              <span className="font-bold text-blue-400">{profile?.gameStats.wordBattle.averageWPM}</span>
            </div>
            <div className="flex justify-between">
              <span>총 타이핑 단어:</span>
              <span className="font-bold text-purple-400">{profile?.gameStats.wordBattle.totalWordsTyped.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Memory Challenge Stats */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card-game"
        >
          <h3 className="text-xl font-bold mb-4">🧠 스피드 메모리 챌린지</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>플레이 횟수:</span>
              <span className="font-bold">{profile?.gameStats.memoryChallenge.gamesPlayed}회</span>
            </div>
            <div className="flex justify-between">
              <span>승리:</span>
              <span className="font-bold text-green-400">{profile?.gameStats.memoryChallenge.wins}회</span>
            </div>
            <div className="flex justify-between">
              <span>최고 레벨:</span>
              <span className="font-bold text-blue-400">{profile?.gameStats.memoryChallenge.bestLevel}</span>
            </div>
            <div className="flex justify-between">
              <span>완벽한 게임:</span>
              <span className="font-bold text-yellow-400">{profile?.gameStats.memoryChallenge.perfectGames}회</span>
            </div>
          </div>
        </motion.div>

        {/* Reaction Survival Stats */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card-game"
        >
          <h3 className="text-xl font-bold mb-4">⚡ 리액션 서바이벌</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>플레이 횟수:</span>
              <span className="font-bold">{profile?.gameStats.reactionSurvival.gamesPlayed}회</span>
            </div>
            <div className="flex justify-between">
              <span>승리:</span>
              <span className="font-bold text-green-400">{profile?.gameStats.reactionSurvival.wins}회</span>
            </div>
            <div className="flex justify-between">
              <span>최단 반응시간:</span>
              <span className="font-bold text-blue-400">{profile?.gameStats.reactionSurvival.fastestReaction}ms</span>
            </div>
            <div className="flex justify-between">
              <span>멀티태스킹 기록:</span>
              <span className="font-bold text-purple-400">{profile?.gameStats.reactionSurvival.multitaskingRecord}개</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overall Performance Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card-game"
      >
        <h3 className="text-xl font-bold mb-4">📊 게임별 승률</h3>
        <div className="space-y-4">
          {[
            { name: '배틀 넘버', rate: (profile?.gameStats.numberBattle.wins || 0) / (profile?.gameStats.numberBattle.gamesPlayed || 1) * 100, color: 'blue' },
            { name: '워드 배틀', rate: (profile?.gameStats.wordBattle.wins || 0) / (profile?.gameStats.wordBattle.gamesPlayed || 1) * 100, color: 'green' },
            { name: '메모리 챌린지', rate: (profile?.gameStats.memoryChallenge.wins || 0) / (profile?.gameStats.memoryChallenge.gamesPlayed || 1) * 100, color: 'purple' },
            { name: '리액션 서바이벌', rate: (profile?.gameStats.reactionSurvival.wins || 0) / (profile?.gameStats.reactionSurvival.gamesPlayed || 1) * 100, color: 'orange' }
          ].map(game => (
            <div key={game.name} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">{game.name}</span>
                <span className="text-sm">{game.rate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${game.rate}%` }}
                  className={`h-2 rounded-full bg-${game.color}-500`}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  const CustomizeTab: React.FC = () => (
    <div className="space-y-6">
      {/* Avatar Frames */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card-game"
      >
        <h3 className="text-xl font-bold mb-4">🖼️ 아바타 프레임</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {AVATAR_FRAMES.map(frame => {
            const isUnlocked = profile?.customization.unlockedFrames.includes(frame.id)
            const isCurrent = profile?.avatar.frame === frame.id
            
            return (
              <motion.div
                key={frame.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isCurrent ? 'border-yellow-400 bg-yellow-400/10' :
                  isUnlocked ? 'border-gray-400 hover:border-white' :
                  'border-gray-600 opacity-50'
                } ${getRarityColor(frame.rarity)}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div className="font-semibold text-sm">{frame.name}</div>
                  {!isUnlocked && (
                    <div className="text-xs mt-1">
                      <div className="text-yellow-400">{frame.cost} 포인트</div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="text-xs text-yellow-400 font-bold mt-1">사용 중</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Titles */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card-game"
      >
        <h3 className="text-xl font-bold mb-4">🏷️ 타이틀</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TITLES.map(title => {
            const isUnlocked = profile?.customization.unlockedTitles.includes(title.id)
            const isCurrent = profile?.titles.current === title.id
            
            return (
              <motion.div
                key={title.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isCurrent ? 'border-yellow-400 bg-yellow-400/10' :
                  isUnlocked ? 'border-gray-400 hover:border-white' :
                  'border-gray-600 opacity-50'
                }`}
              >
                <div className="font-semibold">{title.name}</div>
                <div className="text-sm text-gray-300 mt-1">{title.requirement}</div>
                {!isUnlocked && (
                  <div className="text-xs text-yellow-400 mt-2">{title.cost} 포인트</div>
                )}
                {isCurrent && (
                  <div className="text-xs text-yellow-400 font-bold mt-2">사용 중</div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Special Effects */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card-game"
      >
        <h3 className="text-xl font-bold mb-4">✨ 특수 효과</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SPECIAL_EFFECTS.map(effect => {
            const isUnlocked = profile?.customization.unlockedEffects.includes(effect.id)
            const isActive = profile?.avatar.effects.includes(effect.id)
            
            return (
              <motion.div
                key={effect.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isActive ? 'border-yellow-400 bg-yellow-400/10' :
                  isUnlocked ? 'border-gray-400 hover:border-white' :
                  'border-gray-600 opacity-50'
                } ${getRarityColor(effect.rarity)}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {effect.id === 'sparkles' ? '✨' :
                     effect.id === 'glow' ? '🌟' :
                     effect.id === 'particles' ? '🎆' :
                     effect.id === 'lightning' ? '⚡' : '🌈'}
                  </div>
                  <div className="font-semibold text-sm">{effect.name}</div>
                  {!isUnlocked && (
                    <div className="text-xs text-yellow-400 mt-1">{effect.cost} 포인트</div>
                  )}
                  {isActive && (
                    <div className="text-xs text-yellow-400 font-bold mt-1">활성화</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'overview', name: '개요', icon: '👤' },
            { id: 'stats', name: '통계', icon: '📊' },
            { id: 'achievements', name: '업적', icon: '🏆' },
            { id: 'social', name: '소셜', icon: '👥' },
            { id: 'customize', name: '커스터마이징', icon: '🎨' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.name}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'stats' && <StatsTab />}
            {activeTab === 'customize' && <CustomizeTab />}
            {activeTab === 'achievements' && (
              <div className="text-center">
                <div className="text-2xl mb-4">🏆 업적 시스템</div>
                <div className="text-gray-400">곧 추가될 예정입니다!</div>
              </div>
            )}
            {activeTab === 'social' && (
              <div className="text-center">
                <div className="text-2xl mb-4">👥 소셜 시스템</div>
                <div className="text-gray-400">친구 추가, 팔로우 기능이 곧 추가될 예정입니다!</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UserProfileExtended