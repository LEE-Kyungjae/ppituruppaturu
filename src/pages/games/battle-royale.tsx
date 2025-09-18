import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { SimpleGameCanvas } from '@/lib/game-engine/SimpleGameCanvas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play, Settings, Users, Trophy, Clock, Star, ArrowLeft,
  Gamepad2, Wifi, WifiOff, Shield, Zap, Target
} from 'lucide-react'

interface GameSettings {
  gameMode: 'singleplayer' | 'multiplayer'
  difficulty: 'easy' | 'medium' | 'hard'
  maxPlayers: number
  timeLimit: number
  enablePhysics: boolean
  enableAudio: boolean
}

interface GameStats {
  gamesPlayed: number
  wins: number
  bestScore: number
  averageScore: number
  totalPlayTime: number // minutes
}

export default function BattleRoyalePage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: 'singleplayer',
    difficulty: 'medium',
    maxPlayers: 20,
    timeLimit: 300, // 5 minutes
    enablePhysics: true,
    enableAudio: true
  })
  const [gameStats] = useState<GameStats>({
    gamesPlayed: 23,
    wins: 8,
    bestScore: 2340,
    averageScore: 1240,
    totalPlayTime: 115
  })
  const [isConnected, setIsConnected] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)

  useEffect(() => {
    // 네트워크 상태 시뮬레이션
    if (gameSettings.gameMode === 'multiplayer') {
      setTimeout(() => setIsConnected(true), 1000)
    }
  }, [gameSettings.gameMode])

  const handleGameStart = () => {
    setGameStarted(true)
  }

  const handleGameEnd = (finalScore: number) => {
    setCurrentScore(finalScore)
    setGameStarted(false)
    console.log(`게임 종료! 최종 점수: ${finalScore}`)
  }

  const handleGameError = (error: Error) => {
    console.error('게임 에러:', error)
    setGameStarted(false)
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const winRate = gameStats.gamesPlayed > 0
    ? Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)
    : 0

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* 게임 헤더 */}
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-bold">물리 배틀로얄</h1>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {gameSettings.gameMode === 'multiplayer' ? '멀티플레이어' : '싱글플레이어'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              점수: <span className="font-bold text-yellow-400">{currentScore}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGameStarted(false)}
              className="text-white border-gray-600"
            >
              나가기
            </Button>
          </div>
        </div>

        {/* 게임 캔버스 */}
        <div className="flex-1">
          <SimpleGameCanvas
            gameType="physics_battle_royale"
            onGameEnd={handleGameEnd}
            onError={handleGameError}
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 뒤로 가기 버튼 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackToGames}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            게임 목록으로
          </Button>
        </motion.div>

        {/* 게임 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-4xl font-bold text-white mb-2">물리 배틀로얄</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            실시간 물리 시뮬레이션 기반 20명 생존 경쟁 게임
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 게임 설정 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* 게임 모드 선택 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  게임 모드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={gameSettings.gameMode === 'singleplayer' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setGameSettings(prev => ({ ...prev, gameMode: 'singleplayer' }))}
                  >
                    <Shield className="w-5 h-5 mb-1" />
                    <span>싱글플레이어</span>
                    <span className="text-xs opacity-75">AI와 대전</span>
                  </Button>
                  <Button
                    variant={gameSettings.gameMode === 'multiplayer' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setGameSettings(prev => ({ ...prev, gameMode: 'multiplayer' }))}
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span>멀티플레이어</span>
                    <span className="text-xs opacity-75">실시간 대전</span>
                  </Button>
                </div>

                {gameSettings.gameMode === 'multiplayer' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {isConnected ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-500" />
                          <span className="text-green-400 text-sm">서버에 연결됨</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-400 text-sm">서버 연결 중...</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      최대 {gameSettings.maxPlayers}명까지 함께 플레이할 수 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 게임 설정 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  게임 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 난이도 설정 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    난이도
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <Button
                        key={diff}
                        variant={gameSettings.difficulty === diff ? 'default' : 'outline'}
                        onClick={() => setGameSettings(prev => ({ ...prev, difficulty: diff }))}
                        className="h-12"
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${getDifficultyColor(diff)}`} />
                        {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 시간 제한 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    시간 제한: {Math.floor(gameSettings.timeLimit / 60)}분 {gameSettings.timeLimit % 60}초
                  </label>
                  <input
                    type="range"
                    min="180"
                    max="600"
                    step="30"
                    value={gameSettings.timeLimit}
                    onChange={(e) => setGameSettings(prev => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>3분</span>
                    <span>10분</span>
                  </div>
                </div>

                {/* 고급 설정 */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.enablePhysics}
                      onChange={(e) => setGameSettings(prev => ({
                        ...prev,
                        enablePhysics: e.target.checked
                      }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white text-sm">물리 시뮬레이션</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.enableAudio}
                      onChange={(e) => setGameSettings(prev => ({
                        ...prev,
                        enableAudio: e.target.checked
                      }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white text-sm">사운드</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* 시작 버튼 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleGameStart}
                disabled={gameSettings.gameMode === 'multiplayer' && !isConnected}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                <Play className="w-6 h-6 mr-3" />
                게임 시작
              </Button>
            </motion.div>
          </motion.div>

          {/* 사이드바 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* 게임 정보 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  게임 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">장르</span>
                    <span className="text-white">물리 액션</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">플레이어</span>
                    <span className="text-white">1-20명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평균 시간</span>
                    <span className="text-white">5-8분</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평점</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-white">4.8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내 통계 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  내 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{gameStats.gamesPlayed}</div>
                    <div className="text-xs text-gray-400">플레이</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{gameStats.wins}</div>
                    <div className="text-xs text-gray-400">승리</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{winRate}%</div>
                    <div className="text-xs text-gray-400">승률</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{gameStats.bestScore}</div>
                    <div className="text-xs text-gray-400">최고 점수</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">실력 레벨</span>
                    <span className="text-white">중급자</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* 조작법 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">조작법</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">이동</span>
                    <span className="text-white">WASD / 화살표</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">액션</span>
                    <span className="text-white">스페이스바</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">특수 능력</span>
                    <span className="text-white">E / F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">일시정지</span>
                    <span className="text-white">ESC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}