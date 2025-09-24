import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Users, Trophy, Clock, Star, TrendingUp, GamepadIcon, Zap } from 'lucide-react'

interface GameData {
  id: string
  name: string
  description: string
  icon: string
  route: string
  players: number
  maxPlayers: number
  difficulty: 'easy' | 'medium' | 'hard'
  avgDuration: string
  rating: number
  isHot: boolean
  isNew: boolean
  category: 'physics' | 'puzzle' | 'rhythm' | 'strategy'
  features: string[]
}

interface PlayerStats {
  totalGames: number
  totalWins: number
  bestScore: number
  currentRank: number
  playTime: number // minutes
}

const gameData: GameData[] = [
  {
    id: 'physics_battle_royale',
    name: '물리 배틀로얄',
    description: '실시간 물리 시뮬레이션 기반 20명 생존 경쟁',
    icon: '💥',
    route: '/games/battle-royale',
    players: 12,
    maxPlayers: 20,
    difficulty: 'hard',
    avgDuration: '5-8분',
    rating: 4.8,
    isHot: true,
    isNew: false,
    category: 'physics',
    features: ['실시간 멀티플레이어', '물리 시뮬레이션', '축소 구역', '파워업']
  },
  {
    id: 'puzzle_race',
    name: '퍼즐 레이스',
    description: '시간 내에 퍼즐을 완성하는 스피드 경쟁',
    icon: '🧩',
    route: '/games/puzzle-race',
    players: 8,
    maxPlayers: 12,
    difficulty: 'medium',
    avgDuration: '3-5분',
    rating: 4.6,
    isHot: false,
    isNew: true,
    category: 'puzzle',
    features: ['레벨 시스템', '콤보 시스템', '동적 난이도', '타임 어택']
  },
  {
    id: 'rhythm_action',
    name: '리듬 액션',
    description: '음악에 맞춰 완벽한 타이밍을 맞추는 리듬 게임',
    icon: '🎵',
    route: '/games/rhythm-action',
    players: 4,
    maxPlayers: 8,
    difficulty: 'hard',
    avgDuration: '2-4분',
    rating: 4.9,
    isHot: true,
    isNew: true,
    category: 'rhythm',
    features: ['음악 동기화', '정확도 시스템', 'BPM 감지', '판정 시스템']
  }
]

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export default function GamesPage() {
  const router = useRouter()
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalGames: 127,
    totalWins: 89,
    bestScore: 15420,
    currentRank: 142,
    playTime: 2340
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredGames = selectedCategory === 'all'
    ? gameData
    : gameData.filter(game => game.category === selectedCategory)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'hard': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { text: '쉬움', color: 'bg-green-500/10 text-green-500' }
      case 'medium': return { text: '보통', color: 'bg-yellow-500/10 text-yellow-500' }
      case 'hard': return { text: '어려움', color: 'bg-red-500/10 text-red-500' }
      default: return { text: '알 수 없음', color: 'bg-gray-500/10 text-gray-500' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'physics': return '⚡'
      case 'puzzle': return '🧩'
      case 'rhythm': return '🎵'
      case 'strategy': return '🎯'
      default: return '🎮'
    }
  }

  const handlePlayGame = (route: string) => {
    router.push(route)
  }

  const winRate = Math.round((playerStats.totalWins / playerStats.totalGames) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              삐뚜루빠뚜루 게임
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            실시간 멀티플레이어 게임의 새로운 경험을 만나보세요
          </p>
        </motion.div>

        {/* 플레이어 통계 */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                내 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{playerStats.totalGames}</div>
                  <div className="text-sm text-gray-400">총 게임</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{playerStats.totalWins}</div>
                  <div className="text-sm text-gray-400">승리</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{winRate}%</div>
                  <div className="text-sm text-gray-400">승률</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">#{playerStats.currentRank}</div>
                  <div className="text-sm text-gray-400">랭킹</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{Math.round(playerStats.playTime / 60)}h</div>
                  <div className="text-sm text-gray-400">플레이 시간</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 카테고리 필터 */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { id: 'all', name: '전체', icon: '🎮' },
              { id: 'physics', name: '물리', icon: '⚡' },
              { id: 'puzzle', name: '퍼즐', icon: '🧩' },
              { id: 'rhythm', name: '리듬', icon: '🎵' },
              { id: 'strategy', name: '전략', icon: '🎯' }
            ].map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="text-sm"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* 게임 목록 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {filteredGames.map((game) => {
            const difficultyBadge = getDifficultyBadge(game.difficulty)

            return (
              <motion.div key={game.id} variants={itemVariants}>
                <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-all duration-300 h-full group">
                  {(game.isHot || game.isNew) && (
                    <div className="absolute top-3 right-3 z-10">
                      {game.isHot && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white">
                          🔥 HOT
                        </span>
                      )}
                      {game.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white ml-1">
                          ✨ NEW
                        </span>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{game.icon}</div>
                        <div>
                          <CardTitle className="text-white mb-1">
                            {game.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-gray-300 font-medium">{game.rating}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyBadge.color}`}>
                              {difficultyBadge.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-300 text-sm">
                      {game.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {/* 게임 정보 */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{game.players}/{game.maxPlayers}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{game.avgDuration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getCategoryIcon(game.category)}</span>
                      </div>
                    </div>

                    {/* 특징 태그 */}
                    <div className="flex flex-wrap gap-1">
                      {game.features.slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {game.features.length > 2 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          +{game.features.length - 2}
                        </span>
                      )}
                    </div>

                    {/* 플레이 버튼 */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => handlePlayGame(game.route)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        플레이
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* 추가 정보 */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-white mb-2">
                    더 많은 게임이 곧 출시됩니다!
                  </h3>
                  <p className="text-gray-400">
                    전략 게임, 어드벤처, RPG 등 다양한 장르의 게임들이 준비 중입니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  개발 로드맵 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
