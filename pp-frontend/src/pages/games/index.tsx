import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameGrid } from '@/components/games/GameGrid'
import { UserStats } from '@/components/dashboard/UserStats'
import {
  Play,
  Users,
  Trophy,
  Clock,
  Star,
  TrendingUp,
  Gamepad2,
  Zap,
  Target,
  Timer,
  Heart,
  Crown,
  Medal,
  Award
} from 'lucide-react'

interface GameData {
  id: string
  name: string
  description: string
  icon: string
  category: 'action' | 'puzzle' | 'strategy' | 'rhythm'
  players: number
  maxPlayers: number
  difficulty: 'easy' | 'medium' | 'hard'
  duration: string
  rating: number
  isHot: boolean
  isNew: boolean
  thumbnail?: string
  route: string
}

const gameData: GameData[] = [
  {
    id: 'battle-royale',
    name: '물리 배틀로얄',
    description: '물리 엔진을 활용한 실시간 배틀 게임! 마지막까지 살아남으세요!',
    icon: '⚔️',
    category: 'action',
    players: 12,
    maxPlayers: 20,
    difficulty: 'hard',
    duration: '5-10분',
    rating: 4.8,
    isHot: true,
    isNew: false,
    route: '/games/battle-royale'
  },
  {
    id: 'puzzle-race',
    name: '퍼즐 레이스',
    description: '빠르게 퍼즐을 풀고 상대를 이기세요! 두뇌와 속도의 경쟁',
    icon: '🧩',
    category: 'puzzle',
    players: 6,
    maxPlayers: 10,
    difficulty: 'medium',
    duration: '3-7분',
    rating: 4.6,
    isHot: true,
    isNew: true,
    route: '/games/puzzle-race'
  },
  {
    id: 'rhythm-action',
    name: '리듬 액션',
    description: '음악에 맞춰 리듬을 맞추는 액션 게임! 완벽한 타이밍을 노려보세요',
    icon: '🎵',
    category: 'rhythm',
    players: 4,
    maxPlayers: 8,
    difficulty: 'hard',
    duration: '3-5분',
    rating: 4.9,
    isHot: true,
    isNew: true,
    route: '/games/rhythm-action'
  },
  // 기존 게임들도 포함
  {
    id: 'click-speed',
    name: '클릭 스피드',
    description: '빠른 클릭으로 상대를 이기세요!',
    icon: '🖱️',
    category: 'action',
    players: 8,
    maxPlayers: 16,
    difficulty: 'easy',
    duration: '1-3분',
    rating: 4.3,
    isHot: false,
    isNew: false,
    route: '/games/click-speed'
  },
  {
    id: 'memory-match',
    name: '기억력 매치',
    description: '카드를 뒤집어 같은 그림을 찾으세요!',
    icon: '🃏',
    category: 'puzzle',
    players: 4,
    maxPlayers: 8,
    difficulty: 'medium',
    duration: '5-8분',
    rating: 4.5,
    isHot: false,
    isNew: false,
    route: '/games/memory-match'
  },
  {
    id: 'number-guess',
    name: '숫자 맞히기',
    description: '상대방보다 빠르게 숫자를 맞혀보세요!',
    icon: '🔢',
    category: 'puzzle',
    players: 6,
    maxPlayers: 12,
    difficulty: 'medium',
    duration: '3-6분',
    rating: 4.2,
    isHot: false,
    isNew: false,
    route: '/games/number-guess'
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
    case 'action': return <Zap className="w-4 h-4" />
    case 'puzzle': return <Target className="w-4 h-4" />
    case 'strategy': return <Crown className="w-4 h-4" />
    case 'rhythm': return <Heart className="w-4 h-4" />
    default: return <Gamepad2 className="w-4 h-4" />
  }
}

export default function GamesPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filteredGames, setFilteredGames] = useState(gameData)

  // 사용자 통계 (실제로는 API에서 가져올 데이터)
  const userStats = {
    gamesPlayed: 156,
    wins: 89,
    winRate: 57,
    rank: 'Gold',
    points: 2340,
    level: 12
  }

  const recentGames = [
    { name: '물리 배틀로얄', score: 1250, result: 'win', time: '5분 전' },
    { name: '퍼즐 레이스', score: 890, result: 'loss', time: '1시간 전' },
    { name: '리듬 액션', score: 2100, result: 'win', time: '3시간 전' }
  ]

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredGames(gameData)
    } else {
      setFilteredGames(gameData.filter(game => game.category === selectedCategory))
    }
  }, [selectedCategory])

  const handlePlayGame = (gameId: string, gameRoute: string) => {
    router.push(gameRoute)
  }

  const handleMultiplayerGame = (gameId: string) => {
    // 멀티플레이어 로비로 이동
    router.push(`/games/${gameId}/lobby`)
  }

  return (
    <>
      <Head>
        <title>게임 센터 - 삐뚜루빠뚜루</title>
        <meta name="description" content="다양한 멀티플레이어 게임을 즐겨보세요!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* 헤더 섹션 */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🎮 게임 센터
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              실시간 멀티플레이어 게임을 통해 친구들과 함께 즐거운 시간을 보내세요!
            </p>
          </motion.div>

          {/* 사용자 통계 및 최근 게임 */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 사용자 통계 */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle level={3} className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  게임 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userStats.gamesPlayed}</div>
                    <div className="text-sm text-gray-600">총 게임</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userStats.wins}</div>
                    <div className="text-sm text-gray-600">승리</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userStats.winRate}%</div>
                    <div className="text-sm text-gray-600">승률</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Medal className="w-5 h-5 text-yellow-500" />
                      <div className="text-lg font-bold text-yellow-600">{userStats.rank}</div>
                    </div>
                    <div className="text-sm text-gray-600">랭크</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 최근 게임 기록 */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle level={4} className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  최근 게임
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGames.map((game, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{game.name}</div>
                      <div className="text-xs text-gray-500">{game.time}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      game.result === 'win'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {game.result === 'win' ? '승리' : '패배'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* 카테고리 필터 */}
          <motion.div variants={itemVariants}>
            <Card variant="glass">
              <CardContent className="flex flex-wrap gap-2 justify-center">
                {[
                  { id: 'all', name: '전체', icon: <Gamepad2 className="w-4 h-4" /> },
                  { id: 'action', name: '액션', icon: <Zap className="w-4 h-4" /> },
                  { id: 'puzzle', name: '퍼즐', icon: <Target className="w-4 h-4" /> },
                  { id: 'strategy', name: '전략', icon: <Crown className="w-4 h-4" /> },
                  { id: 'rhythm', name: '리듬', icon: <Heart className="w-4 h-4" /> }
                ].map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    leftIcon={category.icon}
                    className="transition-all"
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* 게임 그리드 */}
          <motion.div variants={itemVariants}>
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredGames.map((game, index) => {
                const difficultyBadge = getDifficultyBadge(game.difficulty)

                return (
                  <motion.div key={game.id} variants={itemVariants}>
                    <Card
                      variant="game"
                      interactive="hover"
                      animate
                      className="relative overflow-hidden group h-full"
                    >
                      {(game.isHot || game.isNew) && (
                        <div className="absolute top-3 right-3 z-10 flex gap-1">
                          {game.isHot && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white">
                              🔥 HOT
                            </span>
                          )}
                          {game.isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                              ✨ NEW
                            </span>
                          )}
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{game.icon}</div>
                            <div>
                              <CardTitle level={4} className="mb-1">
                                {game.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="font-medium">{game.rating}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyBadge.color}`}>
                                  {difficultyBadge.text}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  {getCategoryIcon(game.category)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-2 text-xs">
                          {game.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{game.players}/{game.maxPlayers}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <span>{game.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>경쟁</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePlayGame(game.id, game.route)}
                            leftIcon={<Play className="w-3 h-3" />}
                          >
                            플레이
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMultiplayerGame(game.id)}
                            leftIcon={<Users className="w-3 h-3" />}
                          >
                            멀티
                          </Button>
                        </div>
                      </CardContent>

                      {/* 호버 효과 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* 더 많은 게임 버튼 */}
          <motion.div variants={itemVariants} className="text-center">
            <Button
              variant="outline"
              size="lg"
              leftIcon={<TrendingUp className="w-4 h-4" />}
              className="hover:shadow-lg transition-all"
            >
              더 많은 게임 보기
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}