// frontend/src/components/ui/Leaderboard.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeaderboard } from '@/hooks/useMinigameApi'

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  points: number
  recordedAt: string
  durationSeconds?: number
  gameType?: string
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  gameType?: string
  maxEntries?: number
  showUserRank?: boolean
  className?: string
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  gameType = 'click_speed',
  maxEntries = 10,
  showUserRank = true,
  className = ''
}) => {
  const { leaderboard, userRank, isLoading, fetchLeaderboard } = useLeaderboard()
  const [selectedGameType, setSelectedGameType] = useState(gameType)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // 게임 타입별 정보
  const gameTypes = {
    click_speed: { name: '⚡ 클릭 스피드', icon: '⚡', color: 'from-orange-500 to-red-500' },
    memory_match: { name: '🧠 메모리 매치', icon: '🧠', color: 'from-purple-500 to-pink-500' },
    number_guess: { name: '🎯 숫자 맞추기', icon: '🎯', color: 'from-blue-500 to-indigo-500' },
    word_scramble: { name: '🔤 단어 맞추기', icon: '🔤', color: 'from-green-500 to-emerald-500' },
    puzzle: { name: '🧩 퍼즐', icon: '🧩', color: 'from-yellow-500 to-amber-500' }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchLeaderboard(selectedGameType)
  }, [selectedGameType, fetchLeaderboard])

  // 실시간 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(selectedGameType)
    }, 30000)

    setRefreshInterval(interval)

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [selectedGameType, fetchLeaderboard])

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}분 전`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`
    } else {
      return `${Math.floor(diffInHours / 24)}일 전`
    }
  }

  const handleRefresh = () => {
    fetchLeaderboard(selectedGameType)
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🏆 리더보드
        </h2>
        <motion.button
          onClick={handleRefresh}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading}
        >
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
          >
            🔄
          </motion.div>
        </motion.button>
      </div>

      {/* 게임 타입 선택 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(gameTypes).map(([type, info]) => (
          <motion.button
            key={type}
            onClick={() => setSelectedGameType(type)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
              ${selectedGameType === type 
                ? `bg-gradient-to-r ${info.color} text-white shadow-lg` 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{info.icon}</span>
            <span className="hidden sm:inline">{info.name.split(' ')[1]}</span>
          </motion.button>
        ))}
      </div>

      {/* 현재 사용자 순위 (있을 경우) */}
      {showUserRank && userRank && (
        <motion.div
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              👤 <span className="font-medium">내 순위</span>
            </span>
            <span className="font-bold text-purple-400">{getRankIcon(userRank)}</span>
          </div>
        </motion.div>
      )}

      {/* 리더보드 목록 */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="flex items-center justify-center py-8 text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                ⚡
              </motion.div>
              로딩 중...
            </motion.div>
          ) : leaderboard.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-8 text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-4xl mb-2">🏆</div>
              <div>아직 기록이 없습니다.</div>
              <div className="text-sm">첫 번째 기록을 세워보세요!</div>
            </motion.div>
          ) : (
            leaderboard.slice(0, maxEntries).map((entry, index) => (
              <motion.div
                key={`${entry.username}-${entry.score}-${index}`}
                className={`
                  flex items-center justify-between p-4 rounded-lg transition-all
                  ${entry.isCurrentUser 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                  }
                  ${entry.rank <= 3 ? 'shadow-lg' : ''}
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center
                    ${entry.rank <= 3 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : 'bg-white/10 text-white/70'
                    }
                  `}>
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div>
                    <div className="font-medium text-white flex items-center gap-2">
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/60">
                      {formatTimestamp(entry.recordedAt)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60">포인트 {entry.points.toLocaleString()}</div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 하단 정보 */}
      {leaderboard.length > 0 && !isLoading && (
        <motion.div
          className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          실시간 업데이트 • 총 {leaderboard.length}명 참여
        </motion.div>
      )}
    </div>
  )
}

export default Leaderboard
