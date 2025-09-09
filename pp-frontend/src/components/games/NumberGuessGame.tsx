// frontend/src/components/games/NumberGuessGame.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameState {
  targetNumber: number
  currentGuess: string
  attempts: number
  maxAttempts: number
  gameStarted: boolean
  gameEnded: boolean
  isWon: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  range: { min: number; max: number }
  hints: string[]
  timeElapsed: number
  isPlaying: boolean
}

interface NumberGuessGameProps {
  onGameEnd?: (score: number, stats: GameStats) => void
  onPointsEarned?: (points: number) => void
}

interface GameStats {
  totalAttempts: number
  timeElapsed: number
  efficiency: number
  hintsUsed: number
}

const NumberGuessGame: React.FC<NumberGuessGameProps> = ({
  onGameEnd,
  onPointsEarned
}) => {
  const [gameState, setGameState] = useState<GameState>({
    targetNumber: 0,
    currentGuess: '',
    attempts: 0,
    maxAttempts: 7,
    gameStarted: false,
    gameEnded: false,
    isWon: false,
    difficulty: 'medium',
    range: { min: 1, max: 100 },
    hints: [],
    timeElapsed: 0,
    isPlaying: false
  })

  const [feedback, setFeedback] = useState<{
    message: string
    type: 'higher' | 'lower' | 'correct' | 'invalid' | 'hint'
    number?: number
  } | null>(null)

  const [showHint, setShowHint] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const difficulties = {
    easy: { min: 1, max: 50, attempts: 8, name: '쉬움 (1-50)' },
    medium: { min: 1, max: 100, attempts: 7, name: '보통 (1-100)' },
    hard: { min: 1, max: 1000, attempts: 10, name: '어려움 (1-1000)' }
  }

  // 게임 타이머
  useEffect(() => {
    if (gameState.isPlaying && !gameState.gameEnded) {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 0.1
        }))
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
  }, [gameState.isPlaying, gameState.gameEnded])

  // 새 게임 시작
  const startGame = (difficulty: 'easy' | 'medium' | 'hard' = gameState.difficulty) => {
    const config = difficulties[difficulty]
    const targetNumber = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min

    setGameState({
      targetNumber,
      currentGuess: '',
      attempts: 0,
      maxAttempts: config.attempts,
      gameStarted: true,
      gameEnded: false,
      isWon: false,
      difficulty,
      range: { min: config.min, max: config.max },
      hints: [],
      timeElapsed: 0,
      isPlaying: true
    })

    setFeedback(null)
    setShowHint(false)
    
    // 입력 필드에 포커스
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // 추측 제출
  const submitGuess = () => {
    const guess = parseInt(gameState.currentGuess)
    
    // 유효성 검사
    if (isNaN(guess) || guess < gameState.range.min || guess > gameState.range.max) {
      setFeedback({
        message: `${gameState.range.min}과 ${gameState.range.max} 사이의 숫자를 입력하세요!`,
        type: 'invalid'
      })
      return
    }

    const newAttempts = gameState.attempts + 1
    const isCorrect = guess === gameState.targetNumber
    const isGameOver = newAttempts >= gameState.maxAttempts && !isCorrect

    // 피드백 설정
    if (isCorrect) {
      setFeedback({
        message: '🎉 정답입니다!',
        type: 'correct',
        number: guess
      })
    } else if (guess < gameState.targetNumber) {
      setFeedback({
        message: `${guess}보다 더 큰 수입니다!`,
        type: 'higher',
        number: guess
      })
    } else {
      setFeedback({
        message: `${guess}보다 더 작은 수입니다!`,
        type: 'lower',
        number: guess
      })
    }

    // 게임 상태 업데이트
    setGameState(prev => ({
      ...prev,
      currentGuess: '',
      attempts: newAttempts,
      gameEnded: isCorrect || isGameOver,
      isWon: isCorrect,
      isPlaying: !(isCorrect || isGameOver),
      hints: isCorrect ? prev.hints : [
        ...prev.hints,
        `시도 ${newAttempts}: ${guess} - ${
          guess < prev.targetNumber ? '더 큰 수' : 
          guess > prev.targetNumber ? '더 작은 수' : '정답!'
        }`
      ]
    }))

    // 게임 종료 처리
    if (isCorrect || isGameOver) {
      const efficiency = isCorrect ? ((gameState.maxAttempts - newAttempts + 1) / gameState.maxAttempts) * 100 : 0
      
      const stats: GameStats = {
        totalAttempts: newAttempts,
        timeElapsed: gameState.timeElapsed,
        efficiency,
        hintsUsed: gameState.hints.length
      }

      // 점수 계산
      const baseScore = isCorrect ? 1000 : 0
      const attemptBonus = isCorrect ? Math.max(0, (gameState.maxAttempts - newAttempts) * 100) : 0
      const timeBonus = isCorrect ? Math.max(0, 300 - Math.floor(gameState.timeElapsed * 10)) : 0
      const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[gameState.difficulty]
      
      const finalScore = Math.floor((baseScore + attemptBonus + timeBonus) * difficultyMultiplier)
      const pointsEarned = finalScore * 2

      setTimeout(() => {
        onGameEnd?.(finalScore, stats)
        onPointsEarned?.(pointsEarned)
      }, 1000)
    }
  }

  // 힌트 제공
  const getHint = () => {
    if (gameState.hints.length === 0) return

    const target = gameState.targetNumber
    const lastAttempts = gameState.hints.slice(-3).map(hint => {
      const match = hint.match(/시도 \d+: (\d+)/)
      return match ? parseInt(match[1]) : 0
    })

    let hintMessage = ''
    
    if (lastAttempts.length >= 2) {
      const trend = lastAttempts.every(attempt => attempt < target) ? '계속 더 큰 수를 시도해보세요' :
                   lastAttempts.every(attempt => attempt > target) ? '계속 더 작은 수를 시도해보세요' :
                   '올바른 방향으로 가고 있습니다'
      hintMessage = trend
    } else {
      // 범위 힌트
      if (target <= gameState.range.max * 0.25) {
        hintMessage = '답은 범위의 하위 25% 구간에 있습니다'
      } else if (target <= gameState.range.max * 0.5) {
        hintMessage = '답은 범위의 하위 50% 구간에 있습니다'
      } else if (target <= gameState.range.max * 0.75) {
        hintMessage = '답은 범위의 상위 50% 구간에 있습니다'
      } else {
        hintMessage = '답은 범위의 상위 25% 구간에 있습니다'
      }
    }

    setFeedback({
      message: `💡 힌트: ${hintMessage}`,
      type: 'hint'
    })

    setShowHint(true)
    setTimeout(() => setShowHint(false), 3000)
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      targetNumber: 0,
      currentGuess: '',
      attempts: 0,
      gameStarted: false,
      gameEnded: false,
      isWon: false,
      hints: [],
      timeElapsed: 0,
      isPlaying: false
    }))
    setFeedback(null)
    setShowHint(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.currentGuess) {
      submitGuess()
    }
  }

  const getRemainingAttempts = () => gameState.maxAttempts - gameState.attempts

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          🎯 숫자 맞추기
        </h1>
        <div className="flex gap-2">
          {gameState.gameStarted && gameState.hints.length > 0 && (
            <motion.button
              onClick={getHint}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💡 힌트
            </motion.button>
          )}
          <motion.button
            onClick={resetGame}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 다시시작
          </motion.button>
        </div>
      </div>

      {!gameState.gameStarted ? (
        /* 난이도 선택 화면 */
        <motion.div 
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center max-w-md mx-auto">
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
              🎯
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">숫자 맞추기</h2>
            <p className="text-xl text-white/80 mb-8">
              컴퓨터가 생각한 숫자를 최소한의 시도로 맞춰보세요!
            </p>

            <div className="space-y-4">
              <motion.button
                onClick={() => startGame('easy')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🟢 쉬움 (1-50, 8번 시도)
              </motion.button>
              
              <motion.button
                onClick={() => startGame('medium')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔵 보통 (1-100, 7번 시도)
              </motion.button>
              
              <motion.button
                onClick={() => startGame('hard')}
                className="w-full bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔴 어려움 (1-1000, 10번 시도)
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* 게임 상태 패널 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{gameState.timeElapsed.toFixed(1)}</div>
              <div className="text-white/70">시간 (초)</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-400">{gameState.attempts}</div>
              <div className="text-white/70">시도 횟수</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-400">{getRemainingAttempts()}</div>
              <div className="text-white/70">남은 기회</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-purple-400">
                {gameState.range.min}-{gameState.range.max}
              </div>
              <div className="text-white/70">범위</div>
            </div>
          </div>

          {/* 피드백 메시지 */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                className={`mb-6 p-4 rounded-xl text-center font-bold text-lg ${
                  feedback.type === 'correct' ? 'bg-green-500/20 text-green-300' :
                  feedback.type === 'higher' ? 'bg-orange-500/20 text-orange-300' :
                  feedback.type === 'lower' ? 'bg-blue-500/20 text-blue-300' :
                  feedback.type === 'hint' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 게임 종료 화면 */}
          {gameState.gameEnded && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, gameState.isWon ? 360 : 0, 0]
                  }}
                  transition={{ duration: 1 }}
                >
                  {gameState.isWon ? '🏆' : '😅'}
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  {gameState.isWon ? '성공!' : '실패!'}
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-white">
                    <span>정답:</span>
                    <span className="font-bold text-green-400">{gameState.targetNumber}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>총 시도:</span>
                    <span className="font-bold text-yellow-400">{gameState.attempts}회</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>소요 시간:</span>
                    <span className="font-bold text-blue-400">{gameState.timeElapsed.toFixed(1)}초</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>난이도:</span>
                    <span className="font-bold text-purple-400">
                      {gameState.difficulty === 'easy' ? '쉬움' : 
                       gameState.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  </div>
                  {gameState.isWon && (
                    <div className="flex justify-between text-white">
                      <span>획득 포인트:</span>
                      <span className="font-bold text-orange-400">
                        +{Math.floor((1000 + (gameState.maxAttempts - gameState.attempts) * 100 + 
                          Math.max(0, 300 - Math.floor(gameState.timeElapsed * 10))) * 
                          ({ easy: 1, medium: 1.5, hard: 2 }[gameState.difficulty]) * 2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => startGame(gameState.difficulty)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-3 rounded-xl font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🔄 다시 플레이
                  </motion.button>
                  <motion.button
                    onClick={resetGame}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    📱 메뉴로
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 게임 플레이 영역 */}
          {!gameState.gameEnded && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md mx-auto">
                {/* 입력 영역 */}
                <motion.div
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {gameState.range.min}과 {gameState.range.max} 사이의 숫자를 입력하세요
                    </h3>
                    <p className="text-white/70">
                      {getRemainingAttempts()}번의 기회가 남았습니다
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      ref={inputRef}
                      type="number"
                      min={gameState.range.min}
                      max={gameState.range.max}
                      value={gameState.currentGuess}
                      onChange={(e) => setGameState(prev => ({
                        ...prev,
                        currentGuess: e.target.value
                      }))}
                      onKeyPress={handleKeyPress}
                      className="w-full p-4 text-2xl text-center bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/70 focus:bg-white/30"
                      placeholder="숫자 입력..."
                      disabled={gameState.gameEnded}
                    />
                    
                    <motion.button
                      onClick={submitGuess}
                      disabled={!gameState.currentGuess || gameState.gameEnded}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
                      whileHover={gameState.currentGuess ? { scale: 1.02 } : {}}
                      whileTap={gameState.currentGuess ? { scale: 0.98 } : {}}
                    >
                      🎯 추측하기!
                    </motion.button>
                  </div>
                </motion.div>

                {/* 이전 시도 기록 */}
                {gameState.hints.length > 0 && (
                  <motion.div
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h4 className="text-white font-bold mb-3">📝 시도 기록</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {gameState.hints.slice(-5).map((hint, index) => (
                        <motion.div
                          key={index}
                          className="text-sm text-white/70"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {hint}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NumberGuessGame