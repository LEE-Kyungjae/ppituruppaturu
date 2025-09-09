// frontend/src/components/dashboard/GameDashboard.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Leaderboard from '@/components/ui/Leaderboard'
import GameStats from '@/components/ui/GameStats'
import AdBanner from '@/components/ads/AdBanner'
import PremiumStatus from '@/components/premium/PremiumStatus'
import { useAdIntegration } from '@/hooks/useAds'

interface GameStats {
  totalGames: number
  totalPoints: number
  bestScore: number
  rank: number
}

interface Game {
  id: string
  name: string
  description: string
  icon: string
  bestScore: number
  isLocked: boolean
}

const GameDashboard = () => {
  const [stats, setStats] = useState<GameStats>({
    totalGames: 12,
    totalPoints: 1250,
    bestScore: 89,
    rank: 42
  })

  // 광고 및 프리미엄 기능
  const ads = useAdIntegration()
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)

  const [games] = useState<Game[]>([
    {
      id: 'click-speed',
      name: '클릭 스피드',
      description: '10초 안에 최대한 많이 클릭하세요!',
      icon: '⚡',
      bestScore: 89,
      isLocked: false
    },
    {
      id: 'memory-match',
      name: '메모리 매치',
      description: '카드를 뒤집어 같은 그림을 찾으세요!',
      icon: '🧠',
      bestScore: 24,
      isLocked: false
    },
    {
      id: 'number-guess',
      name: '숫자 맞추기',
      description: '1-100 사이의 숫자를 최소 시도로 맞춰보세요!',
      icon: '🎯',
      bestScore: 6,
      isLocked: false
    },
    {
      id: 'word-puzzle',
      name: '단어 퍼즐',
      description: '주어진 글자로 단어를 만들어보세요!',
      icon: '📝',
      bestScore: 0,
      isLocked: true
    },
    {
      id: 'block-puzzle',
      name: '블록 퍼즐',
      description: '테트리스 스타일 블록 퍼즐 게임!',
      icon: '🧩',
      bestScore: 0,
      isLocked: true
    }
  ])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  // 리워드 광고 시청
  const handleWatchRewardAd = async () => {
    try {
      const reward = await ads.watchRewardedAd()
      setRewardPoints(reward)
      setStats(prev => ({ ...prev, totalPoints: prev.totalPoints + reward }))
    } catch (error) {
      console.error('Failed to watch rewarded ad:', error)
    }
  }

  // 프리미엄 업그레이드
  const handleUpgradePremium = () => {
    setShowPremiumModal(true)
  }

  // 게임 완료 처리
  const handleGameComplete = (points: number) => {
    ads.onGameComplete(points)
    setStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalPoints: prev.totalPoints + points
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 상단 배너 광고 */}
        {ads.shouldShowBannerAd() && (
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdBanner
              size="leaderboard"
              className="shadow-lg"
              closeable={true}
              onClose={() => ads.hideAd('banner_top')}
            />
          </motion.div>
        )}

        {/* 헤더 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            🎮 Gaming Platform
          </h1>
          <p className="text-xl text-gray-300">
            미니게임으로 포인트를 모으고 순위를 올려보세요!
          </p>
          
          {/* 프리미엄 사용자 배지 */}
          {ads.userSettings.isPremium && (
            <motion.div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-full font-bold mt-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👑 프리미엄 멤버
            </motion.div>
          )}
        </motion.div>

        {/* 통계 카드 */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">{stats.totalGames}</div>
            <div className="text-blue-200">총 게임 수</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-2xl text-white"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-green-200">총 포인트</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-2xl text-white"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">{stats.bestScore}</div>
            <div className="text-purple-200">최고 점수</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-2xl text-white"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-3xl font-bold">#{stats.rank}</div>
            <div className="text-orange-200">전체 순위</div>
          </motion.div>
        </motion.div>

        {/* 리워드 및 프리미엄 섹션 */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* 리워드 광고 카드 */}
          {ads.isRewardedAdAvailable() && !ads.userSettings.isPremium && (
            <motion.div 
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    📺 무료 포인트 획득
                  </h3>
                  <p className="text-white/70">광고 시청으로 10-60 포인트 획득</p>
                </div>
              </div>
              
              <motion.button
                onClick={handleWatchRewardAd}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black py-3 rounded-xl font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                광고 보고 포인트 받기
              </motion.button>
              
              {rewardPoints > 0 && (
                <motion.div
                  className="mt-3 text-center text-yellow-400 font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  🎉 +{rewardPoints} 포인트 획득!
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 프리미엄 업그레이드 카드 */}
          {!ads.userSettings.isPremium && (
            <motion.div 
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    👑 프리미엄 업그레이드
                  </h3>
                  <p className="text-white/70">광고 제거 + 포인트 3배 + 독점 혜택</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-green-400 font-bold">3x</div>
                  <div className="text-white/70">포인트</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-red-400 font-bold">No</div>
                  <div className="text-white/70">광고</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="text-purple-400 font-bold">VIP</div>
                  <div className="text-white/70">혜택</div>
                </div>
              </div>
              
              <motion.button
                onClick={handleUpgradePremium}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                프리미엄 구매하기
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* 게임 그리드 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {games.map((game) => (
            <motion.div
              key={game.id}
              className={`relative p-6 rounded-2xl transition-all duration-300 ${
                game.isLocked
                  ? 'bg-gray-800 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 cursor-pointer'
              }`}
              variants={itemVariants}
              whileHover={game.isLocked ? {} : { scale: 1.02, y: -5 }}
              whileTap={game.isLocked ? {} : { scale: 0.98 }}
              onClick={() => {
                if (!game.isLocked) {
                  const gameRoutes: { [key: string]: string } = {
                    'click-speed': '/games/click-speed',
                    'memory-match': '/games/memory-match', 
                    'number-guess': '/games/number-guess'
                  }
                  const route = gameRoutes[game.id]
                  if (route) {
                    window.location.href = route
                  }
                }
              }}
            >
              {game.isLocked && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    🔒
                  </div>
                </div>
              )}

              <div className="text-6xl mb-4 text-center">{game.icon}</div>
              
              <h3 className="text-xl font-bold text-white mb-2 text-center">
                {game.name}
              </h3>
              
              <p className="text-gray-400 text-sm mb-4 text-center">
                {game.description}
              </p>

              {!game.isLocked && (
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">최고 점수:</div>
                  <div className="text-lg font-bold text-yellow-400">{game.bestScore}</div>
                </div>
              )}

              <button
                disabled={game.isLocked}
                onClick={(e) => {
                  e.stopPropagation() // 부모 클릭 이벤트 방지
                  if (!game.isLocked) {
                    const gameRoutes: { [key: string]: string } = {
                      'click-speed': '/games/click-speed',
                      'memory-match': '/games/memory-match', 
                      'number-guess': '/games/number-guess'
                    }
                    const route = gameRoutes[game.id]
                    if (route) {
                      window.location.href = route
                    }
                  }
                }}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                  game.isLocked
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {game.isLocked ? '잠김' : '게임 시작'}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* 통계 및 리더보드 섹션 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 게임 통계 */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <GameStats
              stats={{
                totalGames: stats.totalGames,
                totalScore: stats.totalPoints,
                bestScore: stats.bestScore,
                favoriteGame: '클릭 스피드',
                totalPlayTime: 3600,
                winRate: 75,
                pointsEarned: stats.totalPoints,
                averageScore: stats.bestScore
              }}
            />
          </motion.div>

          {/* 리더보드 */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <Leaderboard
              gameType="click_speed"
              maxEntries={8}
              showUserRank={true}
            />
          </motion.div>
        </div>

        {/* 프리미엄 모달 */}
        {showPremiumModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">프리미엄 업그레이드</h2>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="text-gray-400 hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <PremiumStatus
                isPremium={ads.userSettings.isPremium}
                onUpgrade={() => {
                  setShowPremiumModal(false)
                  window.location.href = '/shop'
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* 광고 통계 (개발용 - 실제로는 숨김) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          >
            <div>게임 횟수: {ads.gameCount}</div>
            <div>총 리워드: {ads.totalRewardEarned}</div>
            <div>프리미엄: {ads.userSettings.isPremium ? 'YES' : 'NO'}</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default GameDashboard