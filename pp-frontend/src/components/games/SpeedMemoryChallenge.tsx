// frontend/src/components/games/SpeedMemoryChallenge.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  username: string
  avatar: string
  score: number
  currentRound: {
    level: number
    streak: number
    mistakes: number
    timeBonus: number
  }
}

interface GameState {
  phase: 'lobby' | 'round1' | 'round2' | 'round3' | 'results'
  timeLeft: number
  players: Player[]
  gameId: string
  currentLevel: number
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']
const CARD_EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎸', '🎺', '🎻', '🎭', '🎪', '🎊', '🎈', '🏆', '⭐', '💎', '🔥']

interface MemoryCard {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
  position: number
}

export const SpeedMemoryChallenge: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    timeLeft: 0,
    players: [],
    gameId: '',
    currentLevel: 1
  })

  const [playerStats, setPlayerStats] = useState({
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageTime: 0
  })

  // Round 1: Color Pattern Memory
  const ColorPatternRound: React.FC = () => {
    const [pattern, setPattern] = useState<string[]>([])
    const [userPattern, setUserPattern] = useState<string[]>([])
    const [showingPattern, setShowingPattern] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [gamePhase, setGamePhase] = useState<'generate' | 'show' | 'input' | 'result'>('generate')
    const [level, setLevel] = useState(3)
    const [score, setScore] = useState(0)
    const [mistakes, setMistakes] = useState(0)

    const generatePattern = useCallback(() => {
      const newPattern = Array.from({ length: level }, () => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0] ?? 'red'
        return color
      })
      setPattern(newPattern)
      setUserPattern([])
      setCurrentStep(0)
      setGamePhase('show')
      setShowingPattern(true)

      // Show pattern step by step
      newPattern.forEach((_, index) => {
        setTimeout(() => {
          setCurrentStep(index + 1)
        }, (index + 1) * 800)
      })

      // Hide pattern and allow input
      setTimeout(() => {
        setShowingPattern(false)
        setGamePhase('input')
      }, (newPattern.length + 1) * 800)
    }, [level])

    useEffect(() => {
      generatePattern()
    }, [level])

    const selectColor = (color: string) => {
      if (gamePhase !== 'input') return

      const newUserPattern = [...userPattern, color]
      setUserPattern(newUserPattern)

      // Check if the selection is correct
      const isCorrect = newUserPattern.every((userColor, index) => 
        userColor === pattern[index]
      )

      if (!isCorrect) {
        setMistakes(prev => prev + 1)
        setGamePhase('result')
        setTimeout(() => {
          setLevel(Math.max(3, level - 1))
          generatePattern()
        }, 1500)
        return
      }

      // Check if pattern is complete
      if (newUserPattern.length === pattern.length) {
        const levelScore = level * 20 + Math.max(100 - mistakes * 10, 20)
        setScore(prev => prev + levelScore)
        setLevel(prev => prev + 1)
        setGamePhase('result')
        
        setTimeout(() => {
          generatePattern()
        }, 1500)
      }
    }

    const getColorStyle = (color: string) => ({
      red: 'bg-red-500 hover:bg-red-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      pink: 'bg-pink-500 hover:bg-pink-600',
      cyan: 'bg-cyan-500 hover:bg-cyan-600',
    }[color] || 'bg-gray-500')

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🎨 컬러 패턴 기억!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>레벨: {level}</span>
            <span>점수: {score}</span>
            <span className="text-red-400">실수: {mistakes}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Pattern Display */}
          <div className="mb-8">
            <div className="text-center mb-4">
              {gamePhase === 'show' && <div className="text-lg font-semibold">패턴을 기억하세요!</div>}
              {gamePhase === 'input' && <div className="text-lg font-semibold">순서대로 선택하세요!</div>}
              {gamePhase === 'result' && (
                <div className={`text-lg font-semibold ${
                  userPattern.every((color, index) => color === pattern[index]) 
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  {userPattern.every((color, index) => color === pattern[index]) 
                    ? '🎉 정답!' : '❌ 틀렸습니다!'}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 mb-6 min-h-16">
              {pattern.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: showingPattern && index < currentStep ? 1 : gamePhase === 'input' || gamePhase === 'result' ? 1 : 0,
                    opacity: showingPattern && index < currentStep ? 1 : gamePhase === 'input' || gamePhase === 'result' ? 0.3 : 0
                  }}
                  className={`w-12 h-12 rounded-lg ${getColorStyle(color)} transition-all`}
                />
              ))}
            </div>

            {/* User's Pattern */}
            {gamePhase === 'input' && (
              <div className="flex justify-center gap-2 mb-6">
                {userPattern.map((color, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-10 h-10 rounded-lg ${getColorStyle(color)} border-2 border-white`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div className="grid grid-cols-4 gap-4">
            {COLORS.slice(0, 6).map(color => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectColor(color)}
                disabled={gamePhase !== 'input'}
                className={`h-16 rounded-xl ${getColorStyle(color)} disabled:opacity-50 transition-all transform`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Round 2: Card Matching Game
  const CardMatchingRound: React.FC = () => {
    const [cards, setCards] = useState<MemoryCard[]>([])
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [matchedPairs, setMatchedPairs] = useState(0)
    const [moves, setMoves] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [gameStarted, setGameStarted] = useState(false)

    const initializeCards = useCallback(() => {
      const selectedEmojis = CARD_EMOJIS.slice(0, 8)
      const cardPairs = [...selectedEmojis, ...selectedEmojis]
      
      const shuffledCards = cardPairs
        .sort(() => Math.random() - 0.5)
        .map((emoji, index) => ({
          id: index,
          emoji,
          isFlipped: false,
          isMatched: false,
          position: index
        }))
      
      setCards(shuffledCards)
      setFlippedCards([])
      setMatchedPairs(0)
      setMoves(0)
      setTimeElapsed(0)
      setGameStarted(true)
    }, [])

    useEffect(() => {
      initializeCards()
    }, [])

    useEffect(() => {
      let interval: NodeJS.Timeout
      if (gameStarted && matchedPairs < 8) {
        interval = setInterval(() => {
          setTimeElapsed(prev => prev + 1)
        }, 1000)
      }
      return () => clearInterval(interval)
    }, [gameStarted, matchedPairs])

    const flipCard = (cardId: number) => {
      if (flippedCards.length >= 2 || flippedCards.includes(cardId)) return
      const targetCard = cards[cardId]
      if (!targetCard || targetCard.isMatched) return

      const newFlippedCards = [...flippedCards, cardId]
      setFlippedCards(newFlippedCards)
      setMoves(prev => prev + 1)

      // Update card state
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, isFlipped: true } : card
      ))

      // Check for match when 2 cards are flipped
      if (newFlippedCards.length === 2) {
        const [firstId, secondId] = newFlippedCards
        if (firstId === undefined || secondId === undefined) {
          setTimeout(() => setFlippedCards([]), 500)
          return
        }

        const firstCard = cards[firstId]
        const secondCard = cards[secondId]
        if (!firstCard || !secondCard) {
          setTimeout(() => setFlippedCards([]), 500)
          return
        }

        if (firstCard.emoji === secondCard.emoji) {
          // Match found
          setTimeout(() => {
            setCards(prev => prev.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isMatched: true } 
                : card
            ))
            setMatchedPairs(prev => prev + 1)
            setFlippedCards([])
          }, 500)
        } else {
          // No match - flip cards back
          setTimeout(() => {
            setCards(prev => prev.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isFlipped: false } 
                : card
            ))
            setFlippedCards([])
          }, 1000)
        }
      }
    }

    const isCardVisible = (card: MemoryCard) => {
      return card.isFlipped || card.isMatched || flippedCards.includes(card.id)
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🃏 카드 매칭 게임!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>시간: {timeElapsed}초</span>
            <span>이동: {moves}</span>
            <span>매칭: {matchedPairs}/8</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-4 gap-4">
            {cards.map(card => (
              <motion.button
                key={card.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => flipCard(card.id)}
                className={`h-20 rounded-xl font-bold text-2xl transition-all ${
                  isCardVisible(card)
                    ? card.isMatched
                      ? 'bg-green-200 text-green-800'
                      : 'bg-blue-200 text-blue-800'
                    : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500'
                }`}
              >
                {isCardVisible(card) ? card.emoji : '?'}
              </motion.button>
            ))}
          </div>

          {matchedPairs === 8 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mt-6 p-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl text-white"
            >
              <div className="text-2xl font-bold mb-2">🎉 완료!</div>
              <div>시간: {timeElapsed}초, 이동: {moves}번</div>
              <div className="text-lg">점수: {Math.max(1000 - timeElapsed * 10 - moves * 5, 100)}</div>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Round 3: Position Memory Battle
  const PositionMemoryRound: React.FC = () => {
    const [gridSize] = useState(5)
    const [targetPositions, setTargetPositions] = useState<number[]>([])
    const [userSelections, setUserSelections] = useState<number[]>([])
    const [showingTargets, setShowingTargets] = useState(false)
    const [currentLevel, setCurrentLevel] = useState(3)
    const [gamePhase, setGamePhase] = useState<'prepare' | 'show' | 'input' | 'result'>('prepare')
    const [score, setScore] = useState(0)
    const [round, setRound] = useState(1)

    const startNewRound = useCallback(() => {
      const numTargets = currentLevel
      const positions: number[] = []
      
      while (positions.length < numTargets) {
        const pos = Math.floor(Math.random() * (gridSize * gridSize))
        if (!positions.includes(pos)) {
          positions.push(pos)
        }
      }
      
      setTargetPositions(positions)
      setUserSelections([])
      setGamePhase('show')
      setShowingTargets(true)
      
      // Show targets for 2 seconds
      setTimeout(() => {
        setShowingTargets(false)
        setGamePhase('input')
      }, Math.max(2000, positions.length * 500))
    }, [currentLevel, gridSize])

    useEffect(() => {
      startNewRound()
    }, [startNewRound])

    const selectPosition = (position: number) => {
      if (gamePhase !== 'input') return
      if (userSelections.includes(position)) return

      const newSelections = [...userSelections, position]
      setUserSelections(newSelections)

      // Check if all positions are selected
      if (newSelections.length === targetPositions.length) {
        const isCorrect = targetPositions.every(pos => newSelections.includes(pos))
        
        if (isCorrect) {
          const roundScore = currentLevel * 50 + Math.max(200 - newSelections.length * 10, 50)
          setScore(prev => prev + roundScore)
          setCurrentLevel(prev => prev + 1)
        } else {
          setCurrentLevel(Math.max(3, currentLevel - 1))
        }
        
        setGamePhase('result')
        setTimeout(() => {
          setRound(prev => prev + 1)
          startNewRound()
        }, 2000)
      }
    }

    const getCellClass = (index: number) => {
      const isTarget = targetPositions.includes(index)
      const isSelected = userSelections.includes(index)
      const isShowing = showingTargets && isTarget
      
      if (gamePhase === 'result') {
        if (isTarget && isSelected) return 'bg-green-500' // Correct
        if (isTarget && !isSelected) return 'bg-red-500' // Missed target
        if (!isTarget && isSelected) return 'bg-orange-500' // Wrong selection
      }
      
      if (isShowing) return 'bg-blue-500 animate-pulse'
      if (isSelected) return 'bg-purple-500'
      
      return 'bg-gray-300 hover:bg-gray-400'
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">📍 위치 기억 배틀!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>라운드: {round}</span>
            <span>레벨: {currentLevel}</span>
            <span>점수: {score}</span>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="mb-4 text-center">
            {gamePhase === 'show' && <div className="text-lg font-semibold">파란색 위치를 기억하세요!</div>}
            {gamePhase === 'input' && <div className="text-lg font-semibold">기억한 위치를 클릭하세요!</div>}
            {gamePhase === 'result' && (
              <div className={`text-lg font-semibold ${
                targetPositions.every(pos => userSelections.includes(pos)) && 
                userSelections.every(pos => targetPositions.includes(pos))
                  ? 'text-green-400' : 'text-red-400'
              }`}>
                {targetPositions.every(pos => userSelections.includes(pos)) && 
                 userSelections.every(pos => targetPositions.includes(pos))
                  ? '🎯 완벽!' : '❌ 다시 시도!'}
              </div>
            )}
          </div>

          <div className={`grid gap-2 mx-auto`} style={{ 
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: '300px'
          }}>
            {Array.from({ length: gridSize * gridSize }, (_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => selectPosition(index)}
                disabled={gamePhase !== 'input'}
                className={`h-12 w-12 rounded-lg transition-all ${getCellClass(index)} disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {gamePhase === 'input' && (
              <div>선택한 개수: {userSelections.length}/{targetPositions.length}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Game Timer Component
  const GameTimer: React.FC = () => {
    const getRoundName = () => {
      switch (gameState.phase) {
        case 'round1': return '컬러 패턴 기억'
        case 'round2': return '카드 매칭'
        case 'round3': return '위치 기억 배틀'
        default: return '게임 준비'
      }
    }

    return (
      <div className="w-full max-w-md mx-auto mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">{getRoundName()}</span>
          <span className="font-bold text-lg">
            {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"
            style={{ width: `${(gameState.timeLeft / 180) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="game-container min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
          >
            🧠 스피드 메모리 챌린지
          </motion.h1>
          <div className="text-lg text-gray-300">
            6-8분 간의 기억력 배틀! 패턴, 매칭, 위치 기억으로 구성된 도전!
          </div>
        </div>

        <GameTimer />

        {/* Game Content */}
        <motion.div
          key={gameState.phase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="card-game"
        >
          {gameState.phase === 'round1' && <ColorPatternRound />}
          {gameState.phase === 'round2' && <CardMatchingRound />}
          {gameState.phase === 'round3' && <PositionMemoryRound />}
          
          {gameState.phase === 'lobby' && (
            <div className="text-center space-y-6">
              <div className="text-xl">메모리 챌린지를 시작할 준비가 되었습니다!</div>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-purple-400">{playerStats.totalCorrect}</div>
            <div className="text-sm text-gray-300">정답 수</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-pink-400">{playerStats.currentStreak}</div>
            <div className="text-sm text-gray-300">현재 연속</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-blue-400">{playerStats.bestStreak}</div>
            <div className="text-sm text-gray-300">최고 연속</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-green-400">{playerStats.averageTime}s</div>
            <div className="text-sm text-gray-300">평균 시간</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpeedMemoryChallenge
