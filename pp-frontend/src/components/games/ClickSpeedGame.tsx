// frontend/src/components/games/ClickSpeedGame.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClickSpeedGame } from '@/hooks/useMinigameApi'

interface GameState {
  isPlaying: boolean
  isPaused: boolean
  timeLeft: number
  clicks: number
  gameStarted: boolean
  gameEnded: boolean
}

interface ClickSpeedGameProps {
  onGameEnd?: (score: number, stats: GameStats) => void
  gameDuration?: number
  onPointsEarned?: (points: number) => void
}

interface GameStats {
  totalClicks: number
  clicksPerSecond: number
  bestStreak: number
  accuracy: number
  pointsEarned?: number
  isValid?: boolean
}

const ClickSpeedGame: React.FC<ClickSpeedGameProps> = ({
  onGameEnd,
  gameDuration = 10,
  onPointsEarned
}) => {
  // API 훅 사용
  const {
    gameSession,
    gameState: apiGameState,
    gameResult,
    status,
    error,
    isLoading,
    startGame,
    submitClick,
    endGame,
    resetGame,
    getTimeLeft,
    getCurrentScore,
    isGameActive
  } = useClickSpeedGame()

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    timeLeft: gameDuration,
    clicks: 0,
    gameStarted: false,
    gameEnded: false
  })

  const [clickPositions, setClickPositions] = useState<Array<{x: number, y: number, id: number}>>([])
  const [bestStreak, setBestStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // API 상태 동기화
  useEffect(() => {
    if (apiGameState) {
      setGameState(prev => ({
        ...prev,
        timeLeft: getTimeLeft(),
        clicks: getCurrentScore(),
        isPlaying: isGameActive()
      }))
    }
  }, [apiGameState, getTimeLeft, getCurrentScore, isGameActive])

  // 게임 타이머
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        const timeLeft = getTimeLeft()
        setGameState(prev => ({
          ...prev,
          timeLeft,
          clicks: getCurrentScore()
        }))

        if (timeLeft <= 0) {
          handleEndGame()
        }
      }, 100)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.isPaused, getTimeLeft, getCurrentScore])

  // 게임 완료 처리
  useEffect(() => {
    if (gameResult) {
      const stats: GameStats = {
        totalClicks: gameResult.finalScore,
        clicksPerSecond: gameResult.finalScore / (gameResult.duration / 1000),
        bestStreak: bestStreak,
        accuracy: 100,
        pointsEarned: gameResult.pointsEarned,
        isValid: gameResult.isValid
      }

      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        gameEnded: true
      }))

      onGameEnd?.(gameResult.finalScore, stats)
      if (gameResult.pointsEarned > 0) {
        onPointsEarned?.(gameResult.pointsEarned)
      }
    }
  }, [gameResult, bestStreak, onGameEnd, onPointsEarned])

  const handleStartGame = async () => {
    const success = await startGame('click_speed')
    if (success) {
      setGameState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        gameStarted: true,
        gameEnded: false,
        clicks: 0
      }))
      setBestStreak(0)
      setCurrentStreak(0)
      setClickPositions([])
    }
  }

  const handleEndGame = async () => {
    if (gameSession) {
      await endGame()
    }
  }

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleResetGame = () => {
    resetGame()
    setGameState({
      isPlaying: false,
      isPaused: false,
      timeLeft: gameDuration,
      clicks: 0,
      gameStarted: false,
      gameEnded: false
    })
    setClickPositions([])
    setBestStreak(0)
    setCurrentStreak(0)
  }

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isGameActive()) return

    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 클릭 위치 저장 (애니메이션용)
    const clickId = Date.now() + Math.random()
    setClickPositions(prev => [...prev, { x, y, id: clickId }])

    // 클릭 위치 제거 (1초 후)
    setTimeout(() => {
      setClickPositions(prev => prev.filter(pos => pos.id !== clickId))
    }, 1000)

    // API로 클릭 전송
    await submitClick()

    // 연속 클릭 스트릭 계산
    const newStreak = currentStreak + 1
    setCurrentStreak(newStreak)
    if (newStreak > bestStreak) {
      setBestStreak(newStreak)
    }

    // 진동 효과 (모바일에서)
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const getClicksPerSecond = () => {
    const elapsed = gameDuration - gameState.timeLeft
    return elapsed > 0 ? (gameState.clicks / elapsed).toFixed(1) : '0.0'
  }

  const getProgressWidth = () => {
    return ((gameDuration - gameState.timeLeft) / gameDuration) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-flutter-blue-50 via-flutter-purple-50 to-flutter-orange-50 p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-flutter-gray-800 flex items-center gap-2">
          ⚡ 클릭 스피드
        </h1>
        <div className="flex gap-2">
          {gameState.isPlaying && (
            <motion.button
              onClick={pauseGame}
              className="bg-flutter-orange-500 hover:bg-flutter-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {gameState.isPaused ? '▶️ 계속' : '⏸️ 일시정지'}
            </motion.button>
          )}
          <motion.button
            onClick={handleResetGame}
            className="bg-flutter-gray-500 hover:bg-flutter-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 다시시작
          </motion.button>
        </div>
      </div>

      {/* 게임 상태 패널 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 text-center shadow-lg border border-flutter-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-flutter-blue-600">{gameState.timeLeft.toFixed(1)}</div>
          <div className="text-flutter-gray-600">초 남음</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 text-center shadow-lg border border-flutter-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-flutter-orange-500">{gameState.clicks}</div>
          <div className="text-flutter-gray-600">총 클릭</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 text-center shadow-lg border border-flutter-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-flutter-green-500">{getClicksPerSecond()}</div>
          <div className="text-flutter-gray-600">클릭/초</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 text-center shadow-lg border border-flutter-gray-200">
          <div className="text-2xl md:text-3xl font-bold text-flutter-purple-500">{bestStreak}</div>
          <div className="text-flutter-gray-600">최고 연속</div>
        </div>
      </div>

      {/* 진행률 바 */}
      {gameState.gameStarted && (
        <div className="mb-6">
          <div className="bg-white/40 rounded-full h-4 overflow-hidden border border-flutter-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-flutter-blue-400 to-flutter-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressWidth()}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* 게임 영역 */}
      <div className="flex-1 relative">
        {!gameState.gameStarted ? (
          /* 시작 화면 */
          <motion.div 
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-8xl mb-8"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ⚡
              </motion.div>
              <h2 className="text-4xl font-bold text-white mb-4">클릭 스피드 게임</h2>
              <p className="text-xl text-white/80 mb-8">
                {gameDuration}초 동안 최대한 빠르게 클릭하세요!
              </p>
              <motion.button
                onClick={handleStartGame}
                disabled={isLoading || status === 'starting'}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-xl text-xl font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(255,165,0,0.5)",
                    "0 0 40px rgba(255,165,0,0.8)",
                    "0 0 20px rgba(255,165,0,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isLoading || status === 'starting' ? (
                  <>
                    <motion.div
                      className="inline-block mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⚡
                    </motion.div>
                    게임 준비중...
                  </>
                ) : (
                  '🚀 게임 시작!'
                )}
              </motion.button>
              
              {/* 에러 메시지 */}
              {error && (
                <motion.div
                  className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : gameState.gameEnded ? (
          /* 결과 화면 */
          <motion.div 
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
              <motion.div
                className="text-6xl mb-6"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{ duration: 1 }}
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-6">게임 완료!</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white">
                  <span>총 클릭 수:</span>
                  <span className="font-bold text-yellow-400">{gameResult?.finalScore || gameState.clicks}회</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>게임 시간:</span>
                  <span className="font-bold text-blue-400">{gameResult ? (gameResult.duration / 1000).toFixed(1) : gameDuration}초</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>평균 속도:</span>
                  <span className="font-bold text-green-400">{getClicksPerSecond()} 클릭/초</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>최고 연속:</span>
                  <span className="font-bold text-purple-400">{bestStreak}회</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>획득 포인트:</span>
                  <span className="font-bold text-orange-400">+{gameResult?.pointsEarned || 0}</span>
                </div>
                {gameResult && !gameResult.isValid && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    ⚠️ {gameResult.reason}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleStartGame}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-3 rounded-xl font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🔄 다시 플레이
                </motion.button>
                <motion.button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📱 메뉴로
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 게임 플레이 화면 */
          <motion.div
            ref={gameAreaRef}
            onClick={handleClick}
            className={`h-full rounded-2xl cursor-pointer relative overflow-hidden ${
              gameState.isPaused 
                ? 'bg-white/5' 
                : 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm'
            }`}
            whileHover={{ scale: gameState.isPaused ? 1 : 1.01 }}
            animate={{
              backgroundColor: gameState.isPaused 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(255,255,255,0.1)'
            }}
          >
            {/* 중앙 메시지 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence>
                {gameState.isPaused ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-center"
                  >
                    <div className="text-6xl mb-4">⏸️</div>
                    <div className="text-2xl text-white font-bold">일시 정지</div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="text-4xl md:text-6xl text-white/50 font-bold mb-2">
                      여기를 클릭!
                    </div>
                    <div className="text-lg md:text-xl text-white/40">
                      빠르게 연속으로 클릭하세요
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 클릭 이펙트 */}
            <AnimatePresence>
              {clickPositions.map((pos) => (
                <motion.div
                  key={pos.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: pos.x - 25,
                    top: pos.y - 25,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [1, 0.8, 0] 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold">+1</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 파티클 효과 배경 */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
                  animate={{
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ClickSpeedGame