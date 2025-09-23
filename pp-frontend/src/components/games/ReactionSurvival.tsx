// frontend/src/components/games/ReactionSurvival.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  username: string
  avatar: string
  score: number
  status: 'alive' | 'eliminated'
  stats: {
    averageReaction: number
    fastestReaction: number
    totalReactions: number
    accuracy: number
  }
}

interface GameState {
  phase: 'lobby' | 'round1' | 'round2' | 'round3' | 'results'
  timeLeft: number
  players: Player[]
  gameId: string
  currentChallenge: any
  eliminated: string[]
}

const REACTION_COLORS = {
  target: '#10B981', // green
  danger: '#EF4444', // red
  neutral: '#6B7280', // gray
  warning: '#F59E0B', // amber
  special: '#8B5CF6' // purple
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon']
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT']
const SOUNDS = ['BEEP', 'CLICK', 'BELL', 'BUZZ']

export const ReactionSurvival: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    timeLeft: 0,
    players: [],
    gameId: '',
    currentChallenge: null,
    eliminated: []
  })

  const [playerStats, setPlayerStats] = useState({
    totalReactions: 0,
    averageTime: 0,
    fastestTime: Infinity,
    accuracy: 100,
    survived: 0
  })

  // Round 1: Color Reaction Challenge
  const ColorReactionRound: React.FC = () => {
    const [currentColor, setCurrentColor] = useState(REACTION_COLORS.neutral)
    const [targetColor] = useState(REACTION_COLORS.target)
    const [isTargetActive, setIsTargetActive] = useState(false)
    const [reactionStartTime, setReactionStartTime] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [reactionTimes, setReactionTimes] = useState<number[]>([])
    const [missedReactions, setMissedReactions] = useState(0)
    const [level, setLevel] = useState(1)
    const [challengeCount, setChallengeCount] = useState(0)

    const generateChallenge = useCallback(() => {
      // Random delay between challenges
      const delay = Math.max(1000, 3000 - (level * 200)) + Math.random() * 2000
      
     setTimeout(() => {
       if (Math.random() < 0.7) { // 70% chance for target color
         setCurrentColor(targetColor)
         setIsTargetActive(true)
          setReactionStartTime(Date.now())
          setChallengeCount(prev => prev + 1)
          
          // Auto-miss after 2 seconds
          setTimeout(() => {
            if (isTargetActive) {
              setMissedReactions(prev => prev + 1)
              setIsTargetActive(false)
              setCurrentColor(REACTION_COLORS.neutral)
              generateChallenge()
            }
          }, Math.max(2000 - level * 100, 500))
        } else { // Show other colors (traps)
          const trapColors = [REACTION_COLORS.danger, REACTION_COLORS.warning, REACTION_COLORS.special]
          const trapColor = trapColors[Math.floor(Math.random() * trapColors.length)] ?? REACTION_COLORS.warning
          setCurrentColor(trapColor)
          
          setTimeout(() => {
            setCurrentColor(REACTION_COLORS.neutral)
            generateChallenge()
          }, 800)
        }
      }, delay)
   }, [level, targetColor, isTargetActive])

    useEffect(() => {
      generateChallenge()
    }, [])

    const handleReaction = () => {
      if (!isTargetActive || !reactionStartTime) {
        // Wrong reaction (clicked when not target color)
        setScore(prev => Math.max(0, prev - 20))
        return
      }

      const reactionTime = Date.now() - reactionStartTime
      setReactionTimes(prev => [...prev, reactionTime])
      setScore(prev => prev + Math.max(100 - reactionTime / 10, 10))
      setIsTargetActive(false)
      setCurrentColor(REACTION_COLORS.neutral)
      
      // Increase difficulty every 5 successful reactions
      if (reactionTimes.length % 5 === 4) {
        setLevel(prev => prev + 1)
      }
      
      generateChallenge()
    }

    const averageReactionTime = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0

    const accuracy = challengeCount > 0 
      ? Math.round((reactionTimes.length / challengeCount) * 100)
      : 100

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🎯 컬러 리액션 챌린지!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>레벨: {level}</span>
            <span>점수: {score}</span>
            <span>정확도: {accuracy}%</span>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="text-lg font-semibold mb-2">
              초록색이 나타나면 즉시 클릭하세요!
            </div>
            <div className="text-sm text-gray-600">
              다른 색깔을 클릭하면 점수가 차감됩니다
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReaction}
              className="w-64 h-64 rounded-full border-8 border-white shadow-2xl transition-all duration-200"
              style={{ 
                backgroundColor: currentColor,
                boxShadow: isTargetActive ? '0 0 30px rgba(16, 185, 129, 0.6)' : '0 0 20px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="card-game">
              <div className="text-2xl font-bold text-blue-400">{reactionTimes.length}</div>
              <div className="text-sm text-gray-300">성공</div>
            </div>
            <div className="card-game">
              <div className="text-2xl font-bold text-green-400">{averageReactionTime}ms</div>
              <div className="text-sm text-gray-300">평균</div>
            </div>
            <div className="card-game">
              <div className="text-2xl font-bold text-red-400">{missedReactions}</div>
              <div className="text-sm text-gray-300">실패</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Round 2: Pattern Breaker Challenge
  const PatternBreakerRound: React.FC = () => {
    const [currentSequence, setCurrentSequence] = useState<string[]>([])
    const [patternBroken, setPatternBroken] = useState(false)
    const [sequenceIndex, setSequenceIndex] = useState(0)
    const [reactionStartTime, setReactionStartTime] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [correctReactions, setCorrectReactions] = useState(0)
    const [wrongReactions, setWrongReactions] = useState(0)
    const [isShowingSequence, setIsShowingSequence] = useState(false)

    const generatePattern = useCallback(() => {
      // Create a pattern with 5-8 elements
      const patternLength = 5 + Math.floor(Math.random() * 4)
      const pattern: string[] = []
      
      // Choose pattern type
      const patternType = Math.random()
      
      if (patternType < 0.33) {
        // Shape pattern
        const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)] ?? 'circle'
        for (let i = 0; i < patternLength; i++) {
          pattern.push(Math.random() < 0.8 ? baseShape : SHAPES[Math.floor(Math.random() * SHAPES.length)] ?? baseShape)
        }
      } else if (patternType < 0.66) {
        // Direction pattern
        const baseDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] ?? 'up'
        for (let i = 0; i < patternLength; i++) {
          pattern.push(Math.random() < 0.8 ? baseDirection : DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] ?? baseDirection)
        }
      } else {
        // Color pattern
        const colorKeys = Object.keys(REACTION_COLORS)
        const baseColor = colorKeys[Math.floor(Math.random() * colorKeys.length)] ?? 'neutral'
        for (let i = 0; i < patternLength; i++) {
          const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)] ?? baseColor
          pattern.push(Math.random() < 0.8 ? baseColor : randomColor)
        }
      }

      setCurrentSequence(pattern)
      setSequenceIndex(0)
      setIsShowingSequence(true)
      setPatternBroken(false)
      
      // Show sequence with timing
      showSequence(pattern)
    }, [])

    const showSequence = (pattern: string[]) => {
      pattern.forEach((_, index) => {
        setTimeout(() => {
          setSequenceIndex(index)
          
          if (index === pattern.length - 1) {
            // Check if this element breaks the pattern
            const patternElement = pattern[0]
            if (!patternElement) {
              setTimeout(() => generatePattern(), 1000)
              return
            }
            const breakerExists = pattern.some((element, i) => i > 0 && element !== patternElement)
            
            if (breakerExists && pattern[index] !== patternElement) {
              setPatternBroken(true)
              setReactionStartTime(Date.now())
              
              // Auto-miss after 1.5 seconds
              setTimeout(() => {
                if (patternBroken) {
                  setWrongReactions(prev => prev + 1)
                  generatePattern()
                }
              }, 1500)
            } else {
              // No pattern breaker, continue to next pattern
              setTimeout(() => generatePattern(), 1000)
            }
          }
        }, index * 600)
      })
    }

    useEffect(() => {
      generatePattern()
    }, [])

    const handleClick = () => {
      if (!patternBroken || !reactionStartTime) {
        // Wrong click - no pattern breaker
        setWrongReactions(prev => prev + 1)
        setScore(prev => Math.max(0, prev - 30))
        return
      }

      const reactionTime = Date.now() - reactionStartTime
      setCorrectReactions(prev => prev + 1)
      setScore(prev => prev + Math.max(200 - reactionTime / 5, 50))
      setPatternBroken(false)
      
      generatePattern()
    }

    const getShapeComponent = (shape: string, color: string = '#6B7280') => {
      const baseClass = "w-16 h-16 mx-auto transition-all duration-300"
      
      switch (shape) {
        case 'circle':
          return <div className={`${baseClass} rounded-full`} style={{ backgroundColor: color }} />
        case 'square':
          return <div className={`${baseClass} rounded-lg`} style={{ backgroundColor: color }} />
        case 'triangle':
          return <div className={`${baseClass} rounded-lg transform rotate-45`} style={{ backgroundColor: color }} />
        default:
          return <div className={`${baseClass} rounded-full`} style={{ backgroundColor: color }} />
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🔀 패턴 브레이커!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>점수: {score}</span>
            <span>성공: {correctReactions}</span>
            <span>실패: {wrongReactions}</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-lg font-semibold mb-2">
              패턴이 깨지는 순간 즉시 클릭하세요!
            </div>
            <div className="text-sm text-gray-600">
              같은 패턴이 반복되다가 다른 것이 나타나면 반응하세요
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl mb-6">
            <div className="flex justify-center gap-4 mb-4">
              {currentSequence.map((element, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: index <= sequenceIndex ? 1 : 0.5,
                    opacity: index <= sequenceIndex ? 1 : 0.3,
                  }}
                  className={`p-4 rounded-lg ${
                    index === sequenceIndex ? 'bg-white shadow-lg' : 'bg-gray-100'
                  } ${
                    patternBroken && index === sequenceIndex ? 'ring-4 ring-red-500' : ''
                  }`}
                >
                  {SHAPES.includes(element) && getShapeComponent(element, 
                    patternBroken && index === sequenceIndex ? '#EF4444' : '#6B7280'
                  )}
                  {DIRECTIONS.includes(element) && (
                    <div className="text-2xl font-bold">{
                      element === 'UP' ? '↑' : 
                      element === 'DOWN' ? '↓' :
                      element === 'LEFT' ? '←' : '→'
                    }</div>
                  )}
                  {Object.keys(REACTION_COLORS).includes(element) && (
                    <div 
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: REACTION_COLORS[element as keyof typeof REACTION_COLORS] }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
              className={`px-12 py-6 text-2xl font-bold rounded-xl transition-all ${
                patternBroken 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {patternBroken ? '🚨 패턴 깨짐!' : '패턴 확인 중...'}
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // Round 3: Multitasking Survival
  const MultitaskingSurvival: React.FC = () => {
    const [challenges, setChallenges] = useState<Array<{
      id: string
      type: 'color' | 'direction' | 'shape' | 'count'
      active: boolean
      startTime: number
      challenge: any
    }>>([])
    const [score, setScore] = useState(0)
    const [completedChallenges, setCompletedChallenges] = useState(0)
    const [failedChallenges, setFailedChallenges] = useState(0)
    const [difficulty, setDifficulty] = useState(1)

    const generateChallenge = useCallback(() => {
      const challengeTypes = ['color', 'direction', 'shape', 'count']
      const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)] as any
      
      let challenge
      
      switch (type) {
        case 'color':
          challenge = {
            targetColor: Object.values(REACTION_COLORS)[Math.floor(Math.random() * Object.values(REACTION_COLORS).length)],
            instruction: 'Click the matching color!'
          }
          break
        case 'direction':
          challenge = {
            direction: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
            instruction: 'Click the arrow direction!'
          }
          break
        case 'shape':
          challenge = {
            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
            instruction: 'Click the matching shape!'
          }
          break
        case 'count':
          challenge = {
            count: Math.floor(Math.random() * 5) + 1,
            instruction: 'Count the items!'
          }
          break
      }

      const newChallenge = {
        id: Math.random().toString(),
        type,
        active: true,
        startTime: Date.now(),
        challenge
      }

      setChallenges(prev => [...prev, newChallenge])

      // Auto-remove challenge after timeout
      setTimeout(() => {
        setChallenges(prev => prev.filter(c => c.id !== newChallenge.id))
        setFailedChallenges(prev => prev + 1)
      }, Math.max(3000 - difficulty * 200, 1000))

    }, [difficulty])

    useEffect(() => {
      const interval = setInterval(() => {
        if (Math.random() < 0.3 + difficulty * 0.1) { // Increasing spawn rate
          generateChallenge()
        }
      }, Math.max(2000 - difficulty * 100, 500))

      return () => clearInterval(interval)
    }, [difficulty, generateChallenge])

    const handleChallengeClick = (challengeId: string, response: any) => {
      const challenge = challenges.find(c => c.id === challengeId)
      if (!challenge) return

      const reactionTime = Date.now() - challenge.startTime
      let isCorrect = false

      // Check if response is correct based on challenge type
      switch (challenge.type) {
        case 'color':
          isCorrect = response === challenge.challenge.targetColor
          break
        case 'direction':
          isCorrect = response === challenge.challenge.direction
          break
        case 'shape':
          isCorrect = response === challenge.challenge.shape
          break
        case 'count':
          isCorrect = response === challenge.challenge.count
          break
      }

      if (isCorrect) {
        setScore(prev => prev + Math.max(150 - reactionTime / 10, 25))
        setCompletedChallenges(prev => prev + 1)
        
        // Increase difficulty every 5 completed challenges
        if (completedChallenges % 5 === 4) {
          setDifficulty(prev => Math.min(prev + 1, 5))
        }
      } else {
        setFailedChallenges(prev => prev + 1)
        setScore(prev => Math.max(0, prev - 25))
      }

      setChallenges(prev => prev.filter(c => c.id !== challengeId))
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🎪 멀티태스킹 서바이벌!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>점수: {score}</span>
            <span>성공: {completedChallenges}</span>
            <span>실패: {failedChallenges}</span>
            <span>레벨: {difficulty}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-lg font-semibold mb-2">
              여러 도전을 동시에 처리하세요!
            </div>
            <div className="text-sm text-gray-600">
              시간 내에 모든 도전을 완료하지 못하면 실패됩니다
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-96">
            <AnimatePresence>
              {challenges.map(challenge => (
                <motion.div
                  key={challenge.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="card-game p-4"
                >
                  <div className="text-center mb-3">
                    <div className="text-sm font-semibold mb-2">
                      {challenge.challenge.instruction}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ 
                          duration: Math.max(3 - difficulty * 0.2, 1),
                          ease: 'linear' 
                        }}
                        className="h-2 bg-red-500 rounded-full"
                      />
                    </div>
                  </div>

                  {challenge.type === 'color' && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(REACTION_COLORS).slice(0, 4).map(([key, color]) => (
                        <button
                          key={key}
                          onClick={() => handleChallengeClick(challenge.id, color)}
                          className="h-12 rounded-lg transition-all hover:scale-105"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {challenge.type === 'direction' && (
                    <div className="grid grid-cols-2 gap-2">
                      {DIRECTIONS.map(direction => (
                        <button
                          key={direction}
                          onClick={() => handleChallengeClick(challenge.id, direction)}
                          className="h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xl"
                        >
                          {direction === 'UP' ? '↑' : direction === 'DOWN' ? '↓' : direction === 'LEFT' ? '←' : '→'}
                        </button>
                      ))}
                    </div>
                  )}

                  {challenge.type === 'count' && (
                    <div>
                      <div className="flex justify-center gap-1 mb-3 flex-wrap">
                        {Array.from({ length: challenge.challenge.count }, (_, i) => (
                          <div key={i} className="w-4 h-4 bg-purple-500 rounded-full" />
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <button
                            key={num}
                            onClick={() => handleChallengeClick(challenge.id, num)}
                            className="h-8 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4"
          >
            ⚡ 리액션 서바이벌
          </motion.h1>
          <div className="text-lg text-gray-300">
            8-10분 간의 반응속도 배틀! 색깔, 패턴, 멀티태스킹 챌린지!
          </div>
        </div>

        {/* Game Content */}
        <motion.div
          key={gameState.phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="card-game"
        >
          {gameState.phase === 'round1' && <ColorReactionRound />}
          {gameState.phase === 'round2' && <PatternBreakerRound />}
          {gameState.phase === 'round3' && <MultitaskingSurvival />}
          
          {gameState.phase === 'lobby' && (
            <div className="text-center space-y-6">
              <div className="text-xl">반응속도 서바이벌을 시작할 준비가 되었습니다!</div>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-red-400">{playerStats.totalReactions}</div>
            <div className="text-sm text-gray-300">총 반응</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-orange-400">{playerStats.averageTime}ms</div>
            <div className="text-sm text-gray-300">평균 시간</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-yellow-400">{playerStats.fastestTime === Infinity ? 0 : playerStats.fastestTime}ms</div>
            <div className="text-sm text-gray-300">최단 시간</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-green-400">{playerStats.accuracy}%</div>
            <div className="text-sm text-gray-300">정확도</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-blue-400">{playerStats.survived}</div>
            <div className="text-sm text-gray-300">서바이벌</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReactionSurvival
