// frontend/src/components/games/MemoryMatchGame.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemoryMatchGame } from '@/hooks/useMinigameApi'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
  position: number
}

interface GameState {
  cards: Card[]
  flippedCards: number[]
  matchedPairs: number
  moves: number
  timeElapsed: number
  isPlaying: boolean
  gameStarted: boolean
  gameEnded: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

interface MemoryMatchGameProps {
  onGameEnd?: (score: number, stats: GameStats) => void
  onPointsEarned?: (points: number) => void
}

interface GameStats {
  totalMoves: number
  timeElapsed: number
  accuracy: number
  perfectMatches: number
}

const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  onGameEnd,
  onPointsEarned
}) => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timeElapsed: 0,
    isPlaying: false,
    gameStarted: false,
    gameEnded: false,
    difficulty: 'medium'
  })

  const [showCards, setShowCards] = useState(false)
  const [previewTime, setPreviewTime] = useState(3)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 카드 이모지 세트
  const cardEmojis = {
    easy: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
    medium: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵'],
    hard: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐯', '🐷', '🐮', '🐙', '🦀']
  }

  const gridSizes = {
    easy: { cols: 3, rows: 4, total: 12 },
    medium: { cols: 4, rows: 5, total: 20 },
    hard: { cols: 4, rows: 8, total: 32 }
  }

  // 게임 타이머
  useEffect(() => {
    if (gameState.isPlaying && gameState.gameStarted && !gameState.gameEnded) {
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
  }, [gameState.isPlaying, gameState.gameStarted, gameState.gameEnded])

  // 카드 섞기 및 초기화
  const initializeCards = (difficulty: 'easy' | 'medium' | 'hard'): Card[] => {
    const gridSize = gridSizes[difficulty]
    const emojis = cardEmojis[difficulty].slice(0, gridSize.total / 2)
    const doubledEmojis = [...emojis, ...emojis]
    
    // Fisher-Yates 셔플
    for (let i = doubledEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubledEmojis[i], doubledEmojis[j]] = [doubledEmojis[j], doubledEmojis[i]]
    }

    return doubledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      position: index
    }))
  }

  // 게임 시작
  const startGame = (difficulty: 'easy' | 'medium' | 'hard' = gameState.difficulty) => {
    const newCards = initializeCards(difficulty)
    
    setGameState({
      cards: newCards,
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeElapsed: 0,
      isPlaying: false,
      gameStarted: true,
      gameEnded: false,
      difficulty
    })

    // 카드 미리보기
    setShowCards(true)
    setPreviewTime(3)
    
    const previewInterval = setInterval(() => {
      setPreviewTime(prev => {
        if (prev <= 1) {
          clearInterval(previewInterval)
          setShowCards(false)
          setGameState(prevState => ({ ...prevState, isPlaying: true }))
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 카드 클릭 처리
  const handleCardClick = (cardId: number) => {
    if (!gameState.isPlaying || gameState.gameEnded) return
    
    const card = gameState.cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || gameState.flippedCards.length >= 2) return

    const newFlippedCards = [...gameState.flippedCards, cardId]
    
    setGameState(prev => ({
      ...prev,
      cards: prev.cards.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      ),
      flippedCards: newFlippedCards
    }))

    // 두 개 카드가 뒤집혔을 때 체크
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      const firstCard = gameState.cards.find(c => c.id === firstId)
      const secondCard = gameState.cards.find(c => c.id === secondId)

      setGameState(prev => ({ ...prev, moves: prev.moves + 1 }))

      setTimeout(() => {
        if (firstCard?.emoji === secondCard?.emoji) {
          // 매치 성공
          setGameState(prev => {
            const newMatchedPairs = prev.matchedPairs + 1
            const totalPairs = gridSizes[prev.difficulty].total / 2
            const isGameComplete = newMatchedPairs === totalPairs

            return {
              ...prev,
              cards: prev.cards.map(c => 
                c.id === firstId || c.id === secondId 
                  ? { ...c, isMatched: true }
                  : c
              ),
              flippedCards: [],
              matchedPairs: newMatchedPairs,
              gameEnded: isGameComplete,
              isPlaying: !isGameComplete
            }
          })
        } else {
          // 매치 실패
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map(c => 
              c.id === firstId || c.id === secondId 
                ? { ...c, isFlipped: false }
                : c
            ),
            flippedCards: []
          }))
        }
      }, 1000)
    }
  }

  // 게임 종료 처리
  useEffect(() => {
    if (gameState.gameEnded) {
      const totalPairs = gridSizes[gameState.difficulty].total / 2
      const perfectMatches = gameState.matchedPairs
      const accuracy = (perfectMatches / gameState.moves) * 100
      
      const stats: GameStats = {
        totalMoves: gameState.moves,
        timeElapsed: gameState.timeElapsed,
        accuracy: Math.min(100, accuracy),
        perfectMatches
      }

      // 점수 계산 (시간과 이동 수 기반)
      const timeBonus = Math.max(0, 300 - Math.floor(gameState.timeElapsed))
      const moveBonus = Math.max(0, (totalPairs * 2 - gameState.moves) * 10)
      const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[gameState.difficulty]
      
      const finalScore = Math.floor((timeBonus + moveBonus) * difficultyMultiplier)
      const pointsEarned = finalScore * 5

      onGameEnd?.(finalScore, stats)
      onPointsEarned?.(pointsEarned)
    }
  }, [gameState.gameEnded, gameState.moves, gameState.timeElapsed, gameState.matchedPairs, gameState.difficulty, onGameEnd, onPointsEarned])

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      cards: [],
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timeElapsed: 0,
      isPlaying: false,
      gameStarted: false,
      gameEnded: false
    }))
    setShowCards(false)
    setPreviewTime(3)
  }

  const getGridClassName = () => {
    const { cols } = gridSizes[gameState.difficulty]
    return `grid gap-2 md:gap-4 grid-cols-${cols}`
  }

  const getAccuracy = () => {
    if (gameState.moves === 0) return 100
    return Math.round((gameState.matchedPairs / gameState.moves) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          🧠 메모리 매치
        </h1>
        <div className="flex gap-2">
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
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🧠
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">메모리 매치</h2>
            <p className="text-xl text-white/80 mb-8">
              같은 그림의 카드를 찾아 짝을 맞춰보세요!
            </p>

            <div className="space-y-4">
              <motion.button
                onClick={() => startGame('easy')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🟢 쉬움 (3x4 = 12장)
              </motion.button>
              
              <motion.button
                onClick={() => startGame('medium')}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🟡 보통 (4x5 = 20장)
              </motion.button>
              
              <motion.button
                onClick={() => startGame('hard')}
                className="w-full bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white py-4 rounded-xl font-bold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔴 어려움 (4x8 = 32장)
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
              <div className="text-2xl md:text-3xl font-bold text-yellow-400">{gameState.moves}</div>
              <div className="text-white/70">이동 횟수</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-400">{gameState.matchedPairs}</div>
              <div className="text-white/70">매치된 쌍</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-400">{getAccuracy()}%</div>
              <div className="text-white/70">정확도</div>
            </div>
          </div>

          {/* 미리보기 카운트다운 */}
          <AnimatePresence>
            {showCards && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-center"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                >
                  <motion.div
                    className="text-8xl md:text-9xl font-bold text-white mb-4"
                    key={previewTime}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {previewTime}
                  </motion.div>
                  <div className="text-2xl text-white/80">카드를 기억하세요!</div>
                </motion.div>
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
                    rotate: [0, 360, 0]
                  }}
                  transition={{ duration: 1 }}
                >
                  🏆
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-6">완료!</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-white">
                    <span>소요 시간:</span>
                    <span className="font-bold text-blue-400">{gameState.timeElapsed.toFixed(1)}초</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>총 이동:</span>
                    <span className="font-bold text-yellow-400">{gameState.moves}회</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>정확도:</span>
                    <span className="font-bold text-green-400">{getAccuracy()}%</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>난이도:</span>
                    <span className="font-bold text-purple-400">
                      {gameState.difficulty === 'easy' ? '쉬움' : 
                       gameState.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>획득 포인트:</span>
                    <span className="font-bold text-orange-400">
                      +{Math.floor((300 - gameState.timeElapsed + (gridSizes[gameState.difficulty].total - gameState.moves) * 10) * 
                        ({ easy: 1, medium: 1.5, hard: 2 }[gameState.difficulty]) * 5)}
                    </span>
                  </div>
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

          {/* 게임 보드 */}
          <div className="flex-1 flex items-center justify-center">
            <div className={`${getGridClassName()} max-w-4xl mx-auto`}>
              {gameState.cards.map((card) => (
                <motion.div
                  key={card.id}
                  className={`
                    aspect-square rounded-xl cursor-pointer relative overflow-hidden
                    ${card.isMatched ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleCardClick(card.id)}
                  whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
                  layout
                >
                  <motion.div
                    className="absolute inset-0 backface-hidden"
                    animate={{ 
                      rotateY: (card.isFlipped || card.isMatched || showCards) ? 180 : 0 
                    }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* 카드 뒷면 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center backface-hidden">
                      <div className="text-4xl md:text-6xl">❓</div>
                    </div>
                    
                    {/* 카드 앞면 */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center backface-hidden"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      <div className="text-4xl md:text-6xl">{card.emoji}</div>
                    </div>
                  </motion.div>
                  
                  {/* 매치된 카드 효과 */}
                  {card.isMatched && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/30 rounded-xl flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="text-3xl">✅</div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MemoryMatchGame