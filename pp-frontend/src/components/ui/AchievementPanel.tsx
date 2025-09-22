/**
 * Achievement Panel - Cyberpunk UI
 * 도전과제 및 진행상황 표시 패널
 */

import React, { useState, useEffect } from 'react'
import { useAchievements } from '../../lib/game-engine/AchievementSystem'
import { Achievement, AchievementCategory, AchievementTier, UnlockNotification } from '../../lib/game-engine/AchievementSystem'

interface AchievementPanelProps {
  isOpen: boolean
  onClose: () => void
}

const AchievementPanel: React.FC<AchievementPanelProps> = ({ isOpen, onClose }) => {
  const {
    progress,
    achievements,
    notifications,
    markNotificationDisplayed,
    getCompletionPercentage,
    getUnlockedItems
  } = useAchievements()

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null)

  // Show achievement notifications
  useEffect(() => {
    notifications.forEach(notification => {
      setTimeout(() => {
        markNotificationDisplayed(notification.achievement.id)
      }, 5000) // Auto-dismiss after 5 seconds
    })
  }, [notifications, markNotificationDisplayed])

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false
    }
    if (showOnlyUnlocked && !achievement.isUnlocked) {
      return false
    }
    return true
  })

  const getTierColor = (tier: AchievementTier): string => {
    switch (tier) {
      case AchievementTier.BRONZE: return '#cd7f32'
      case AchievementTier.SILVER: return '#c0c0c0'
      case AchievementTier.GOLD: return '#ffd700'
      case AchievementTier.PLATINUM: return '#e5e4e2'
      case AchievementTier.LEGENDARY: return '#ff0040'
      default: return '#888888'
    }
  }

  const getTierGlow = (tier: AchievementTier): string => {
    const color = getTierColor(tier)
    return `0 0 20px ${color}40, 0 0 40px ${color}20`
  }

  const getLevelProgress = () => {
    const percent = (progress.experience / progress.experienceToNext) * 100
    return Math.min(100, Math.max(0, percent))
  }

  const renderPlayerCard = () => (
    <div className="player-card bg-gray-900 border border-cyber-blue rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-cyber-blue">LEVEL {progress.level}</h2>
          <p className="text-sm text-gray-400">Combat Engineer</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyber-pink">{getCompletionPercentage()}%</div>
          <p className="text-xs text-gray-400">COMPLETION</p>
        </div>
      </div>

      {/* Experience Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>EXP</span>
          <span>{progress.experience} / {progress.experienceToNext}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
          <div
            className="h-full bg-gradient-to-r from-cyber-blue to-cyber-pink transition-all duration-500"
            style={{
              width: `${getLevelProgress()}%`,
              boxShadow: '0 0 10px rgba(64, 128, 255, 0.5)'
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="stat-item">
          <div className="text-cyber-green font-mono">{progress.gamesWon}</div>
          <div className="text-gray-400">WINS</div>
        </div>
        <div className="stat-item">
          <div className="text-cyber-pink font-mono">{progress.currentStreak}</div>
          <div className="text-gray-400">STREAK</div>
        </div>
        <div className="stat-item">
          <div className="text-cyber-blue font-mono">{progress.territoryCaptures}</div>
          <div className="text-gray-400">TERRITORY</div>
        </div>
        <div className="stat-item">
          <div className="text-yellow-400 font-mono">{Math.floor(progress.totalPlayTime / 60)}m</div>
          <div className="text-gray-400">PLAYTIME</div>
        </div>
      </div>
    </div>
  )

  const renderCategoryTabs = () => (
    <div className="category-tabs flex flex-wrap gap-2 mb-4">
      {['all', ...Object.values(AchievementCategory)].map(category => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category as any)}
          className={`
            px-3 py-1 text-xs font-mono rounded border transition-all duration-200
            ${selectedCategory === category
              ? 'bg-cyber-blue text-black border-cyber-blue shadow-cyber-blue'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
            }
          `}
        >
          {category.toUpperCase()}
        </button>
      ))}
    </div>
  )

  const renderAchievementCard = (achievement: Achievement) => (
    <div
      key={achievement.id}
      className={`
        achievement-card bg-gray-900 border rounded-lg p-4 transition-all duration-300
        ${achievement.isUnlocked
          ? 'border-cyber-blue shadow-cyber-blue'
          : 'border-gray-600 opacity-70'
        }
        ${hoveredAchievement === achievement.id ? 'scale-105' : ''}
      `}
      style={{
        boxShadow: achievement.isUnlocked ? getTierGlow(achievement.tier) : undefined
      }}
      onMouseEnter={() => setHoveredAchievement(achievement.id)}
      onMouseLeave={() => setHoveredAchievement(null)}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className={`
            achievement-icon w-12 h-12 rounded-lg flex items-center justify-center text-2xl
            border transition-all duration-300
            ${achievement.isUnlocked
              ? 'border-cyber-blue bg-cyber-blue bg-opacity-20'
              : 'border-gray-600 bg-gray-800'
            }
          `}
          style={{
            borderColor: achievement.isUnlocked ? getTierColor(achievement.tier) : undefined,
            backgroundColor: achievement.isUnlocked ? `${getTierColor(achievement.tier)}20` : undefined
          }}
        >
          {achievement.isSecret && !achievement.isUnlocked ? '❓' : achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-bold ${achievement.isUnlocked ? 'text-white' : 'text-gray-400'}`}>
              {achievement.isSecret && !achievement.isUnlocked ? 'Secret Achievement' : achievement.title}
            </h4>
            <div
              className="tier-badge px-2 py-1 rounded text-xs font-mono"
              style={{
                backgroundColor: `${getTierColor(achievement.tier)}20`,
                color: getTierColor(achievement.tier),
                border: `1px solid ${getTierColor(achievement.tier)}`
              }}
            >
              {achievement.tier.toUpperCase()}
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-3">
            {achievement.isSecret && !achievement.isUnlocked ? 'Complete hidden requirements to unlock' : achievement.description}
          </p>

          {/* Progress Bar */}
          {!achievement.isUnlocked && achievement.maxProgress > 1 && (
            <div className="progress-container mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{achievement.progress} / {achievement.maxProgress}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyber-blue transition-all duration-500"
                  style={{
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Rewards */}
          {achievement.isUnlocked && (
            <div className="rewards">
              <div className="text-xs text-gray-400 mb-1">REWARDS</div>
              <div className="flex flex-wrap gap-1">
                {achievement.rewards.map((reward, index) => (
                  <span
                    key={index}
                    className="reward-badge px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-600 rounded"
                  >
                    {reward.type === 'experience' ? `+${reward.value} EXP` :
                     reward.type === 'paint_credits' ? `+${reward.value} Credits` :
                     reward.item || reward.type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unlock timestamp */}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <div className="text-xs text-gray-500 mt-2">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className="achievement-notifications fixed top-4 right-4 z-50 space-y-2">
      {notifications.filter(n => !n.displayed).map(notification => (
        <div
          key={notification.achievement.id}
          className="achievement-notification bg-black border border-cyber-blue rounded-lg p-4 shadow-cyber-blue animate-slide-in-right"
          style={{
            boxShadow: getTierGlow(notification.achievement.tier)
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{notification.achievement.icon}</div>
            <div>
              <div className="text-cyber-blue font-bold text-sm">ACHIEVEMENT UNLOCKED!</div>
              <div className="text-white font-bold">{notification.achievement.title}</div>
              <div className="text-gray-400 text-xs">{notification.achievement.description}</div>
            </div>
            <button
              onClick={() => markNotificationDisplayed(notification.achievement.id)}
              className="text-gray-400 hover:text-white ml-auto"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  if (!isOpen) return renderNotifications()

  return (
    <>
      {renderNotifications()}

      <div className="achievement-panel fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center p-4">
        <div className="panel-content bg-black border border-cyber-blue rounded-lg w-full max-w-4xl h-full max-h-[80vh] overflow-hidden shadow-cyber-blue">
          {/* Header */}
          <div className="panel-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-cyber-blue font-mono">ACHIEVEMENTS</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="panel-body p-4 overflow-y-auto h-full">
            {renderPlayerCard()}

            {/* Filters */}
            <div className="filters mb-6">
              {renderCategoryTabs()}

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={showOnlyUnlocked}
                    onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
                    className="form-checkbox text-cyber-blue"
                  />
                  <span>Show only unlocked</span>
                </label>

                <div className="text-xs text-gray-500">
                  Showing {filteredAchievements.length} of {achievements.length} achievements
                </div>
              </div>
            </div>

            {/* Achievement Grid */}
            <div className="achievement-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map(renderAchievementCard)}
            </div>

            {filteredAchievements.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🏆</div>
                <div>No achievements match your current filters</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .achievement-panel {
          font-family: 'JetBrains Mono', monospace;
        }

        .shadow-cyber-blue {
          box-shadow: 0 0 20px rgba(64, 128, 255, 0.3);
        }

        .text-cyber-blue {
          color: #4080ff;
        }

        .text-cyber-green {
          color: #00ff80;
        }

        .text-cyber-pink {
          color: #ff0040;
        }

        .bg-cyber-blue {
          background-color: #4080ff;
        }

        .border-cyber-blue {
          border-color: #4080ff;
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }

        .achievement-card:hover {
          transform: translateY(-2px);
        }

        .panel-body {
          max-height: calc(80vh - 80px);
        }

        /* Custom scrollbar */
        .panel-body::-webkit-scrollbar {
          width: 8px;
        }

        .panel-body::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .panel-body::-webkit-scrollbar-thumb {
          background: #4080ff;
          border-radius: 4px;
        }

        .panel-body::-webkit-scrollbar-thumb:hover {
          background: #5090ff;
        }
      `}</style>
    </>
  )
}

export default AchievementPanel