// frontend/src/components/games/NumberBattleArena.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  username: string
  avatar: string
  score: number
  status: 'waiting' | 'ready' | 'playing' | 'finished'
  currentAnswer?: number
  streak: number
}

interface GameState {
  phase: 'lobby' | 'countdown' | 'round1' | 'round2' | 'round3' | 'results'
  round: number
  timeLeft: number
  currentChallenge: any
  players: Player[]
  gameId: string
}

const ROUND_CONFIG = {
  1: { name: '숫자 추론 배틀', duration: 180, color: 'from-blue-500 to-purple-600' },
  2: { name: '수식 계산 배틀', duration: 180, color: 'from-green-500 to-blue-600' },
  3: { name: '숫자 기억 배틀', duration: 240, color: 'from-purple-500 to-pink-600' }
}

export const NumberBattleArena: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    round: 0,
    timeLeft: 0,
    currentChallenge: null,
    players: [],
    gameId: ''
  })

  const [userAnswer, setUserAnswer] = useState('')
  const [playerStats, setPlayerStats] = useState({ correct: 0, streak: 0, bestTime: 0 })

  // Round 1: Number Guessing Battle
  const NumberGuessingRound: React.FC = () => {
    const [targetNumber, setTargetNumber] = useState(Math.floor(Math.random() * 100) + 1)
    const [guessHistory, setGuessHistory] = useState<Array<{guess: number, result: string, player: string}>>([])
    const [currentGuess, setCurrentGuess] = useState('')

    const submitGuess = () => {
      const guess = parseInt(currentGuess)
      if (isNaN(guess) || guess < 1 || guess > 100) return

      let result = ''
      let points = 0
      
      if (guess === targetNumber) {
        result = '🎯 정답!'
        points = Math.max(100 - guessHistory.length * 10, 10)
        // Generate new number for continuous play
        setTargetNumber(Math.floor(Math.random() * 100) + 1)
        setGuessHistory([])
      } else if (guess < targetNumber) {
        result = '⬆️ 더 큰 수!'
      } else {
        result = '⬇️ 더 작은 수!'
      }

      setGuessHistory(prev => [...prev, { guess, result, player: 'You' }])
      setCurrentGuess('')
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">1-100 사이의 숫자를 맞춰보세요!</h3>
          <div className="text-lg text-gray-600">빠르게 맞출수록 높은 점수!</div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
              placeholder="숫자 입력..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-xl font-bold focus:border-blue-500 focus:outline-none"
              min="1"
              max="100"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submitGuess}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              도전!
            </motion.button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {guessHistory.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  entry.result.includes('정답') ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                }`}
              >
                <span className="font-bold">{entry.guess}</span>
                <span>{entry.result}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Round 2: Math Battle
  const MathBattleRound: React.FC = () => {
    const [equation, setEquation] = useState({ question: '', answer: 0 })
    const [userAnswer, setUserAnswer] = useState('')
    const [solvedCount, setSolvedCount] = useState(0)

    const generateEquation = useCallback(() => {
      const operators = ['+', '-', '*']
      const op1 = operators[Math.floor(Math.random() * operators.length)]
      const op2 = operators[Math.floor(Math.random() * operators.length)]
      
      let a, b, c, result
      
      // Generate numbers based on operation complexity
      if (op1 === '*' || op2 === '*') {
        a = Math.floor(Math.random() * 12) + 1
        b = Math.floor(Math.random() * 12) + 1  
        c = Math.floor(Math.random() * 20) + 1
      } else {
        a = Math.floor(Math.random() * 50) + 1
        b = Math.floor(Math.random() * 50) + 1
        c = Math.floor(Math.random() * 50) + 1
      }

      const question = `${a} ${op1} ${b} ${op2} ${c}`
      
      // Calculate result with proper operator precedence
      try {
        result = eval(question)
      } catch {
        result = a + b + c // fallback
      }

      setEquation({ question, answer: result })
    }, [])

    useEffect(() => {
      generateEquation()
    }, [generateEquation])

    const checkAnswer = () => {
      const answer = parseFloat(userAnswer)
      if (answer === equation.answer) {
        setSolvedCount(prev => prev + 1)
        setUserAnswer('')
        generateEquation()
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">수식 계산 배틀!</h3>
          <div className="text-lg text-gray-600">해결한 문제: {solvedCount}개</div>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            key={equation.question}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-green-100 to-blue-100 p-8 rounded-2xl text-center mb-6"
          >
            <div className="text-3xl font-bold text-gray-800 mb-4">
              {equation.question} = ?
            </div>
          </motion.div>

          <div className="flex gap-2">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="답 입력..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-xl font-bold focus:border-green-500 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkAnswer}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              확인
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // Round 3: Memory Sequence Battle
  const MemoryBattleRound: React.FC = () => {
    const [sequence, setSequence] = useState<number[]>([])
    const [userSequence, setUserSequence] = useState<number[]>([])
    const [showingSequence, setShowingSequence] = useState(false)
    const [currentLevel, setCurrentLevel] = useState(3)
    const [gamePhase, setGamePhase] = useState<'waiting' | 'showing' | 'input'>('waiting')

    const startNewRound = useCallback(() => {
      const newSequence = Array.from({ length: currentLevel }, () => 
        Math.floor(Math.random() * 9) + 1
      )
      setSequence(newSequence)
      setUserSequence([])
      setGamePhase('showing')
      setShowingSequence(true)

      // Show sequence for 2 seconds per number
      setTimeout(() => {
        setShowingSequence(false)
        setGamePhase('input')
      }, newSequence.length * 1000)
    }, [currentLevel])

    const addToUserSequence = (num: number) => {
      if (gamePhase !== 'input') return
      
      const newUserSequence = [...userSequence, num]
      setUserSequence(newUserSequence)

      // Check if sequence is complete
      if (newUserSequence.length === sequence.length) {
        const isCorrect = newUserSequence.every((num, index) => num === sequence[index])
        if (isCorrect) {
          setCurrentLevel(prev => prev + 1)
          setTimeout(() => startNewRound(), 1000)
        } else {
          // Game over - restart
          setTimeout(() => {
            setCurrentLevel(3)
            startNewRound()
          }, 1500)
        }
      }
    }

    useEffect(() => {
      startNewRound()
    }, [])

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">숫자 시퀀스 기억 배틀!</h3>
          <div className="text-lg text-gray-600">레벨: {currentLevel}</div>
        </div>

        <div className="max-w-md mx-auto">
          {gamePhase === 'showing' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl text-center mb-6"
            >
              <div className="text-lg font-semibold mb-4">기억하세요!</div>
              <div className="flex justify-center gap-2">
                <AnimatePresence>
                  {sequence.map((num, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ delay: index * 1 }}
                      className="w-12 h-12 bg-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-xl"
                    >
                      {num}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {gamePhase === 'input' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">순서대로 입력하세요</div>
                <div className="flex justify-center gap-2 mb-4">
                  {userSequence.map((num, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToUserSequence(num)}
                    className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Game Timer Component
  const GameTimer: React.FC = () => {
    const currentRoundConfig = ROUND_CONFIG[gameState.round as keyof typeof ROUND_CONFIG]
    const progress = currentRoundConfig ? (gameState.timeLeft / currentRoundConfig.duration) * 100 : 0

    return (
      <div className="w-full max-w-md mx-auto mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">{currentRoundConfig?.name}</span>
          <span className="font-bold text-lg">
            {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            className={`h-3 rounded-full bg-gradient-to-r ${currentRoundConfig?.color || 'from-gray-400 to-gray-600'}`}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    )
  }

  // Player Scoreboard
  const PlayerScoreboard: React.FC = () => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6">
      <h4 className="font-bold text-lg mb-3 text-center">플레이어 순위</h4>
      <div className="space-y-2">
        {gameState.players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <div key={player.id} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-400 text-gray-900' :
                  index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold">{player.username}</div>
                  <div className="text-sm text-gray-300">연속 {player.streak}회</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">{player.score}</div>
                <div className="text-sm text-gray-300">점</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className="game-container min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
          >
            🔢 배틀 넘버 아레나
          </motion.h1>
          <div className="text-lg text-gray-300">
            8-10분 간의 숫자 배틀! 3라운드로 구성된 치열한 경쟁!
          </div>
        </div>

        <GameTimer />
        <PlayerScoreboard />

        {/* Game Content */}
        <motion.div
          key={gameState.phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="card-game"
        >
          {gameState.phase === 'round1' && <NumberGuessingRound />}
          {gameState.phase === 'round2' && <MathBattleRound />}
          {gameState.phase === 'round3' && <MemoryBattleRound />}
          
          {gameState.phase === 'lobby' && (
            <div className="text-center space-y-6">
              <div className="text-xl">게임을 시작할 준비가 되었습니다!</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4 text-xl"
              >
                게임 시작!
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Player Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-green-400">{playerStats.correct}</div>
            <div className="text-sm text-gray-300">정답 수</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-purple-400">{playerStats.streak}</div>
            <div className="text-sm text-gray-300">최고 연속</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-blue-400">{playerStats.bestTime}s</div>
            <div className="text-sm text-gray-300">최단 시간</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NumberBattleArena