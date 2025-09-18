import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { GameCanvas } from '@/lib/game-engine/GameCanvas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play, Settings, Users, Trophy, Clock, Star, ArrowLeft,
  Puzzle, Timer, Zap, Target, Brain, TrendingUp
} from 'lucide-react'

interface GameSettings {
  gameMode: 'singleplayer' | 'multiplayer'
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  puzzleSize: 'small' | 'medium' | 'large'
  enableHints: boolean
  enableAudio: boolean
}

interface GameStats {
  gamesPlayed: number
  wins: number
  bestTime: number // seconds
  averageTime: number
  perfectSolves: number
  totalPlayTime: number // minutes
}

const difficultySettings = {
  easy: { timeLimit: 180, puzzleComplexity: 1, hintsAllowed: 3 },
  medium: { timeLimit: 120, puzzleComplexity: 2, hintsAllowed: 2 },
  hard: { timeLimit: 90, puzzleComplexity: 3, hintsAllowed: 1 }
}

const puzzleSizeSettings = {
  small: { pieces: 9, gridSize: '3x3' },
  medium: { pieces: 16, gridSize: '4x4' },
  large: { pieces: 25, gridSize: '5x5' }
}

export default function PuzzleRacePage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: 'singleplayer',
    difficulty: 'medium',
    timeLimit: 120,
    puzzleSize: 'medium',
    enableHints: true,
    enableAudio: true
  })
  const [gameStats] = useState<GameStats>({
    gamesPlayed: 45,
    wins: 32,
    bestTime: 67, // seconds
    averageTime: 98,
    perfectSolves: 12,
    totalPlayTime: 380
  })
  const [currentScore, setCurrentScore] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)

  // 난이도 변경 시 시간 제한 자동 조정
  useEffect(() => {
    const settings = difficultySettings[gameSettings.difficulty]
    setGameSettings(prev => ({ ...prev, timeLimit: settings.timeLimit }))
  }, [gameSettings.difficulty])

  const handleGameStart = () => {
    setGameStarted(true)
  }

  const handleGameEnd = (finalScore: number) => {
    setCurrentScore(finalScore)
    setGameStarted(false)
    console.log(`퍼즐 레이스 종료! 최종 점수: ${finalScore}`)
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

  const getPuzzleSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-blue-500'
      case 'medium': return 'bg-purple-500'
      case 'large': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const winRate = gameStats.gamesPlayed > 0
    ? Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)
    : 0

  const perfectRate = gameStats.gamesPlayed > 0
    ? Math.round((gameStats.perfectSolves / gameStats.gamesPlayed) * 100)
    : 0

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* 게임 헤더 */}
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-bold">퍼즐 레이스</h1>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              레벨 {currentLevel}
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {puzzleSizeSettings[gameSettings.puzzleSize].gridSize}
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
          <GameCanvas
            gameType="puzzle_race"
            gameConfig={{
              ...gameSettings,
              autoStart: true
            }}
            onGameEnd={handleGameEnd}
            onError={handleGameError}
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
          <div className="text-6xl mb-4">🧩</div>
          <h1 className="text-4xl font-bold text-white mb-2">퍼즐 레이스</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            시간 내에 퍼즐을 완성하는 스피드 경쟁 게임
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
                  <Puzzle className="w-5 h-5" />
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
                    <Brain className="w-5 h-5 mb-1" />
                    <span>싱글플레이어</span>
                    <span className="text-xs opacity-75">개인 기록 도전</span>
                  </Button>
                  <Button
                    variant={gameSettings.gameMode === 'multiplayer' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setGameSettings(prev => ({ ...prev, gameMode: 'multiplayer' }))}
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span>멀티플레이어</span>
                    <span className="text-xs opacity-75">실시간 경쟁</span>
                  </Button>
                </div>

                {gameSettings.gameMode === 'multiplayer' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-400 text-sm">최대 12명까지 동시 경쟁</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      가장 빨리 퍼즐을 완성하는 플레이어가 승리합니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 퍼즐 설정 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  퍼즐 설정
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
                        className="h-12 flex flex-col items-center justify-center"
                      >
                        <div className={`w-2 h-2 rounded-full mb-1 ${getDifficultyColor(diff)}`} />
                        <span className="text-xs">
                          {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
                        </span>
                        <span className="text-xs opacity-60">
                          {difficultySettings[diff].timeLimit}초
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 퍼즐 크기 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    퍼즐 크기
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <Button
                        key={size}
                        variant={gameSettings.puzzleSize === size ? 'default' : 'outline'}
                        onClick={() => setGameSettings(prev => ({ ...prev, puzzleSize: size }))}
                        className="h-12 flex flex-col items-center justify-center"
                      >
                        <div className={`w-2 h-2 rounded-full mb-1 ${getPuzzleSizeColor(size)}`} />
                        <span className="text-xs">
                          {size === 'small' ? '작음' : size === 'medium' ? '보통' : '큼'}
                        </span>
                        <span className="text-xs opacity-60">
                          {puzzleSizeSettings[size].gridSize} ({puzzleSizeSettings[size].pieces}조각)
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 시간 제한 표시 */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-400 text-sm font-medium">
                      시간 제한: {Math.floor(gameSettings.timeLimit / 60)}분 {gameSettings.timeLimit % 60}초
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    힌트 사용 가능: {difficultySettings[gameSettings.difficulty].hintsAllowed}회
                  </div>
                </div>

                {/* 게임 옵션 */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.enableHints}
                      onChange={(e) => setGameSettings(prev => ({
                        ...prev,
                        enableHints: e.target.checked
                      }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white text-sm">힌트 사용</span>
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
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Play className="w-6 h-6 mr-3" />
                퍼즐 시작
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
                    <span className="text-white">퍼즐</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">플레이어</span>
                    <span className="text-white">1-12명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평균 시간</span>
                    <span className="text-white">3-5분</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평점</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-white">4.6</span>
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
                    <div className="text-xs text-gray-400">완료</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{winRate}%</div>
                    <div className="text-xs text-gray-400">완료율</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{perfectRate}%</div>
                    <div className="text-xs text-gray-400">완벽 해결</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">최고 기록</span>
                    <span className="text-white">{gameStats.bestTime}초</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평균 시간</span>
                    <span className="text-white">{gameStats.averageTime}초</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">퍼즐 레벨</span>
                    <span className="text-white">고수</span>
                  </div>
                  <Progress value={78} className="h-2" />
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
                    <span className="text-gray-400">퍼즐 선택</span>
                    <span className="text-white">클릭</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">드래그</span>
                    <span className="text-white">마우스 드래그</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">힌트</span>
                    <span className="text-white">H 키</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">다시 시작</span>
                    <span className="text-white">R 키</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 팁 */}
            <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  프로 팁
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>• 모서리와 테두리 조각부터 시작하세요</p>
                  <p>• 색깔과 패턴을 먼저 매치하세요</p>
                  <p>• 힌트는 막힐 때만 사용하세요</p>
                  <p>• 콤보를 유지하면 더 높은 점수를 받습니다</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}