// frontend/src/components/ui/GameStats.tsx
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface GameStatsData {
  totalGames: number
  totalScore: number
  averageScore: number
  bestScore: number
  totalPlayTime: number // in seconds
  favoriteGame: string
  winRate: number
  pointsEarned: number
}

interface GameStatsProps {
  stats?: Partial<GameStatsData>
  isLoading?: boolean
  className?: string
}

const GameStats: React.FC<GameStatsProps> = ({
  stats = {},
  isLoading = false,
  className = ''
}) => {
  const [animatedStats, setAnimatedStats] = useState<GameStatsData>({
    totalGames: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    favoriteGame: '클릭 스피드',
    winRate: 0,
    pointsEarned: 0
  })

  const defaultStats: GameStatsData = {
    totalGames: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    favoriteGame: '클릭 스피드',
    winRate: 0,
    pointsEarned: 0,
    ...stats
  }

  // 숫자 애니메이션
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const current = start + (end - start) * progress
        return Math.floor(current)
      }

      const interval = setInterval(() => {
        const current = animate()
        setAnimatedStats(prev => ({
          ...prev,
          totalGames: current === defaultStats.totalGames ? defaultStats.totalGames : current,
          totalScore: current === defaultStats.totalScore ? defaultStats.totalScore : current,
          bestScore: current === defaultStats.bestScore ? defaultStats.bestScore : current,
          pointsEarned: current === defaultStats.pointsEarned ? defaultStats.pointsEarned : current
        }))

        if (current >= Math.max(defaultStats.totalGames, defaultStats.totalScore, defaultStats.bestScore, defaultStats.pointsEarned)) {
          clearInterval(interval)
        }
      }, 30)

      return interval
    }

    if (!isLoading) {
      const interval = animateValue(0, Math.max(
        defaultStats.totalGames,
        defaultStats.totalScore,
        defaultStats.bestScore,
        defaultStats.pointsEarned
      ), 1000)

      return () => clearInterval(interval)
    }

    return undefined
  }, [stats, isLoading])

  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    } else {
      return `${minutes}분`
    }
  }

  const getGameIcon = (gameName: string): string => {
    const gameIcons: Record<string, string> = {
      '클릭 스피드': '⚡',
      '메모리 매치': '🧠',
      '숫자 맞추기': '🎯',
      '단어 맞추기': '🔤',
      '퍼즐': '🧩'
    }
    return gameIcons[gameName] || '🎮'
  }

  const statsItems = [
    {
      icon: '🎮',
      label: '총 게임 수',
      value: animatedStats.totalGames,
      color: 'from-blue-500 to-indigo-500',
      suffix: '게임'
    },
    {
      icon: '⭐',
      label: '누적 점수',
      value: animatedStats.totalScore,
      color: 'from-yellow-500 to-orange-500',
      suffix: '점'
    },
    {
      icon: '📊',
      label: '평균 점수',
      value: defaultStats.averageScore,
      color: 'from-green-500 to-emerald-500',
      suffix: '점'
    },
    {
      icon: '🏆',
      label: '최고 점수',
      value: animatedStats.bestScore,
      color: 'from-purple-500 to-pink-500',
      suffix: '점'
    },
    {
      icon: '⏰',
      label: '총 플레이 시간',
      value: formatPlayTime(defaultStats.totalPlayTime),
      color: 'from-cyan-500 to-blue-500',
      suffix: ''
    },
    {
      icon: getGameIcon(defaultStats.favoriteGame),
      label: '선호 게임',
      value: defaultStats.favoriteGame,
      color: 'from-rose-500 to-red-500',
      suffix: ''
    },
    {
      icon: '💎',
      label: '획득 포인트',
      value: animatedStats.pointsEarned,
      color: 'from-amber-500 to-yellow-500',
      suffix: 'P'
    },
    {
      icon: '🎯',
      label: '승률',
      value: `${defaultStats.winRate}%`,
      color: 'from-teal-500 to-green-500',
      suffix: ''
    }
  ]

  if (isLoading) {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            📊
          </motion.div>
          <h2 className="text-2xl font-bold text-white">게임 통계</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-white/10 rounded-full mb-3"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-6 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📊 게임 통계
        </h2>
        <motion.div
          className="text-sm text-white/60 bg-white/10 rounded-full px-3 py-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          실시간 업데이트
        </motion.div>
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`
                w-10 h-10 rounded-full bg-gradient-to-r ${item.color} 
                flex items-center justify-center text-white font-bold shadow-lg
              `}>
                {item.icon}
              </div>
              <div className="text-sm text-white/70 font-medium">
                {item.label}
              </div>
            </div>
            
            <div className="text-xl font-bold text-white">
              {typeof item.value === 'number' && item.value > 0
                ? item.value.toLocaleString()
                : item.value
              }
              {item.suffix && <span className="text-sm text-white/60 ml-1">{item.suffix}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 하단 정보 */}
      <motion.div
        className="mt-6 pt-4 border-t border-white/10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-sm text-white/60">
          마지막 업데이트: {new Date().toLocaleTimeString()}
        </div>
      </motion.div>

      {/* 성취 뱃지 (예시) */}
      {defaultStats.totalGames >= 10 && (
        <motion.div
          className="mt-4 flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
            🏅 베테랑 플레이어
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default GameStats