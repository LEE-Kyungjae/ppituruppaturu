// frontend/src/components/games/WordBattleArena.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  username: string
  avatar: string
  score: number
  currentRound: {
    wordsFound: number
    accuracy: number
    wpm: number
    streak: number
  }
}

interface GameState {
  phase: 'lobby' | 'round1' | 'round2' | 'round3' | 'results'
  timeLeft: number
  players: Player[]
  gameId: string
  currentChallenge: any
}

const WORD_LISTS = {
  korean: {
    easy: ['사과', '바나나', '딸기', '포도', '수박', '참외', '복숭아', '배'],
    medium: ['컴퓨터', '프로그램', '인터넷', '스마트폰', '태블릿', '키보드', '마우스'],
    hard: ['프로그래밍', '알고리즘', '데이터베이스', '네트워크', '보안', '클라우드']
  },
  english: {
    easy: ['apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon'],
    medium: ['computer', 'program', 'internet', 'keyboard', 'monitor', 'software'],
    hard: ['programming', 'algorithm', 'database', 'framework', 'development']
  }
}

const SENTENCES = [
  "빠른 갈색 여우가 게으른 개를 뛰어넘습니다.",
  "안녕하세요! 오늘 날씨가 정말 좋습니다.",
  "프로그래밍은 창의적이고 논리적인 사고를 요구합니다.",
  "The quick brown fox jumps over the lazy dog.",
  "React is a JavaScript library for building user interfaces.",
  "TypeScript adds static typing to JavaScript."
]

export const WordBattleArena: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    timeLeft: 0,
    players: [],
    gameId: '',
    currentChallenge: null
  })

  const [playerStats, setPlayerStats] = useState({
    totalWords: 0,
    averageWPM: 0,
    accuracy: 100,
    streak: 0
  })

  // Round 1: Speed Typing
  const SpeedTypingRound: React.FC = () => {
    const [currentSentence, setCurrentSentence] = useState('')
    const [userInput, setUserInput] = useState('')
    const [completedSentences, setCompletedSentences] = useState(0)
    const [errors, setErrors] = useState(0)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [wpm, setWpm] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const generateNewSentence = useCallback(() => {
      const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
      setCurrentSentence(sentence)
      setUserInput('')
      if (!startTime) setStartTime(Date.now())
    }, [startTime])

    useEffect(() => {
      generateNewSentence()
    }, [])

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, [currentSentence])

    const handleInputChange = (value: string) => {
      setUserInput(value)
      
      // Check for completion
      if (value === currentSentence) {
        setCompletedSentences(prev => prev + 1)
        
        // Calculate WPM
        if (startTime) {
          const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
          const wordsTyped = currentSentence.split(' ').length
          const currentWPM = Math.round(wordsTyped / timeElapsed)
          setWpm(currentWPM)
        }
        
        generateNewSentence()
      } else {
        // Count errors
        let errorCount = 0
        for (let i = 0; i < Math.min(value.length, currentSentence.length); i++) {
          if (value[i] !== currentSentence[i]) {
            errorCount++
          }
        }
        setErrors(errorCount)
      }
    }

    const getCharacterStatus = (index: number) => {
      if (index >= userInput.length) return 'pending'
      return userInput[index] === currentSentence[index] ? 'correct' : 'error'
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">⚡ 스피드 타이핑 배틀!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>완료: {completedSentences}문장</span>
            <span>WPM: {wpm}</span>
            <span className={errors > 0 ? 'text-red-400' : 'text-green-400'}>
              오류: {errors}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            key={currentSentence}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-2xl mb-6"
          >
            <div className="text-2xl leading-relaxed font-mono text-center">
              {currentSentence.split('').map((char, index) => {
                const status = getCharacterStatus(index)
                return (
                  <span
                    key={index}
                    className={`${
                      status === 'correct' ? 'bg-green-200 text-green-800' :
                      status === 'error' ? 'bg-red-200 text-red-800' :
                      index === userInput.length ? 'bg-blue-400 text-white animate-pulse' : ''
                    }`}
                  >
                    {char}
                  </span>
                )
              })}
            </div>
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
            placeholder="여기에 타이핑하세요..."
          />

          <div className="mt-4 text-center text-gray-600">
            <div className="text-sm">정확도: {Math.round(((userInput.length - errors) / Math.max(userInput.length, 1)) * 100)}%</div>
          </div>
        </div>
      </div>
    )
  }

  // Round 2: Word Formation Battle
  const WordFormationRound: React.FC = () => {
    const [availableLetters, setAvailableLetters] = useState<string[]>([])
    const [foundWords, setFoundWords] = useState<string[]>([])
    const [currentWord, setCurrentWord] = useState('')
    const [score, setScore] = useState(0)

    const generateLetters = useCallback(() => {
      // Generate a mix of vowels and consonants
      const vowels = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅑ', 'ㅕ']
      const consonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
      
      const letters: string[] = []
      // Add some vowels
      for (let i = 0; i < 4; i++) {
        letters.push(vowels[Math.floor(Math.random() * vowels.length)])
      }
      // Add some consonants
      for (let i = 0; i < 6; i++) {
        letters.push(consonants[Math.floor(Math.random() * consonants.length)])
      }
      
      // For simplicity, let's use English letters instead
      const englishLetters = ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'L', 'N']
      const finalLetters: string[] = []
      
      for (let i = 0; i < 8; i++) {
        finalLetters.push(englishLetters[Math.floor(Math.random() * englishLetters.length)])
      }
      
      setAvailableLetters(finalLetters)
    }, [])

    useEffect(() => {
      generateLetters()
    }, [])

    const addLetterToWord = (letter: string, index: number) => {
      setCurrentWord(prev => prev + letter)
    }

    const removeLetterFromWord = () => {
      setCurrentWord(prev => prev.slice(0, -1))
    }

    const submitWord = () => {
      if (currentWord.length >= 3 && !foundWords.includes(currentWord)) {
        // In a real implementation, validate against dictionary
        const wordScore = currentWord.length * 10
        setFoundWords(prev => [...prev, currentWord])
        setScore(prev => prev + wordScore)
        setCurrentWord('')
      }
    }

    const clearWord = () => {
      setCurrentWord('')
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🔤 단어 조합 배틀!</h3>
          <div className="text-lg text-gray-600">
            주어진 글자로 단어를 만드세요! 점수: {score}점
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Available Letters */}
          <div className="mb-6">
            <div className="text-lg font-semibold mb-3 text-center">사용 가능한 글자</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {availableLetters.map((letter, index) => (
                <motion.button
                  key={`${letter}-${index}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addLetterToWord(letter, index)}
                  className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-bold text-lg hover:from-green-500 hover:to-blue-600 transition-all"
                >
                  {letter}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Current Word */}
          <div className="mb-6">
            <div className="text-lg font-semibold mb-3 text-center">만들고 있는 단어</div>
            <div className="bg-gray-100 rounded-xl p-4 text-center min-h-16 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">
                {currentWord || '글자를 선택해보세요'}
              </span>
            </div>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={removeLetterFromWord}
                disabled={!currentWord}
                className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-600 transition-colors"
              >
                ⌫ 지우기
              </button>
              <button
                onClick={clearWord}
                disabled={!currentWord}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={submitWord}
                disabled={currentWord.length < 3}
                className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-600 transition-colors"
              >
                완성!
              </button>
            </div>
          </div>

          {/* Found Words */}
          <div>
            <div className="text-lg font-semibold mb-3 text-center">
              만든 단어 ({foundWords.length}개)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {foundWords.map((word, index) => (
                <motion.div
                  key={word}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-lg text-center font-semibold"
                >
                  <span className="text-gray-800">{word}</span>
                  <span className="text-xs text-gray-600 ml-2">+{word.length * 10}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Round 3: Word Quiz Battle
  const WordQuizRound: React.FC = () => {
    const [currentQuiz, setCurrentQuiz] = useState<{
      type: 'meaning' | 'translation'
      question: string
      answer: string
      options: string[]
    } | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState('')
    const [quizScore, setQuizScore] = useState(0)
    const [streakCount, setStreakCount] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)

    const QUIZ_DATA = {
      meaning: [
        { word: '알고리즘', meaning: '문제를 해결하기 위한 절차나 방법', options: ['컴퓨터 부품', '문제 해결 방법', '프로그래밍 언어', '데이터 저장소'] },
        { word: '인터페이스', meaning: '서로 다른 시스템을 연결하는 접점', options: ['화면 디자인', '시스템 접점', '키보드', '마우스'] },
        { word: '데이터베이스', meaning: '체계적으로 정리된 데이터의 집합', options: ['웹사이트', '데이터 집합', '소프트웨어', '하드웨어'] }
      ],
      translation: [
        { korean: '사과', english: 'Apple', options: ['Apple', 'Orange', 'Banana', 'Grape'] },
        { korean: '컴퓨터', english: 'Computer', options: ['Computer', 'Monitor', 'Keyboard', 'Mouse'] },
        { korean: '프로그램', english: 'Program', options: ['Program', 'Software', 'Hardware', 'System'] }
      ]
    }

    const generateQuiz = useCallback(() => {
      const quizType = Math.random() > 0.5 ? 'meaning' : 'translation'
      
      if (quizType === 'meaning') {
        const quiz = QUIZ_DATA.meaning[Math.floor(Math.random() * QUIZ_DATA.meaning.length)]
        setCurrentQuiz({
          type: 'meaning',
          question: `"${quiz.word}"의 뜻은?`,
          answer: quiz.options[1], // Second option is always correct in our setup
          options: quiz.options
        })
      } else {
        const quiz = QUIZ_DATA.translation[Math.floor(Math.random() * QUIZ_DATA.translation.length)]
        setCurrentQuiz({
          type: 'translation',
          question: `"${quiz.korean}"의 영어는?`,
          answer: quiz.options[0], // First option is always correct in our setup
          options: quiz.options
        })
      }
      setSelectedAnswer('')
    }, [])

    useEffect(() => {
      generateQuiz()
    }, [])

    const selectAnswer = (answer: string) => {
      setSelectedAnswer(answer)
      
      if (answer === currentQuiz?.answer) {
        const points = 50 + (streakCount * 10)
        setQuizScore(prev => prev + points)
        setStreakCount(prev => prev + 1)
        setCorrectAnswers(prev => prev + 1)
      } else {
        setStreakCount(0)
      }

      // Generate new quiz after 1 second
      setTimeout(() => {
        generateQuiz()
      }, 1000)
    }

    if (!currentQuiz) return null

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🧠 단어 퀴즈 배틀!</h3>
          <div className="flex justify-center gap-6 text-lg">
            <span>점수: {quizScore}</span>
            <span>정답: {correctAnswers}</span>
            <span className="text-purple-400">연속: {streakCount}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            key={currentQuiz.question}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl text-center mb-8"
          >
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {currentQuiz.question}
            </div>
            <div className="text-sm text-gray-600">
              {currentQuiz.type === 'meaning' ? '뜻을 선택하세요' : '올바른 번역을 선택하세요'}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuiz.options.map((option, index) => (
              <motion.button
                key={option}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAnswer(option)}
                disabled={!!selectedAnswer}
                className={`p-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedAnswer === option
                    ? option === currentQuiz.answer
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : selectedAnswer && option === currentQuiz.answer
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white border-2 border-white/30'
                }`}
              >
                {option}
              </motion.button>
            ))}
          </div>

          {selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6"
            >
              {selectedAnswer === currentQuiz.answer ? (
                <div className="text-green-400 text-xl font-bold">
                  🎉 정답! +{50 + (streakCount * 10)}점
                </div>
              ) : (
                <div className="text-red-400 text-xl font-bold">
                  ❌ 틀렸습니다. 정답은 "{currentQuiz.answer}"
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Game Timer Component
  const GameTimer: React.FC = () => {
    const getRoundName = () => {
      switch (gameState.phase) {
        case 'round1': return '스피드 타이핑'
        case 'round2': return '단어 조합 배틀'
        case 'round3': return '단어 퀴즈 대결'
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
            className="h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
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
            className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4"
          >
            📝 워드 배틀 아레나
          </motion.h1>
          <div className="text-lg text-gray-300">
            7-9분 간의 단어 배틀! 타이핑, 조합, 퀴즈로 구성된 치열한 경쟁!
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
          {gameState.phase === 'round1' && <SpeedTypingRound />}
          {gameState.phase === 'round2' && <WordFormationRound />}
          {gameState.phase === 'round3' && <WordQuizRound />}
          
          {gameState.phase === 'lobby' && (
            <div className="text-center space-y-6">
              <div className="text-xl">워드 배틀을 시작할 준비가 되었습니다!</div>
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
            <div className="text-2xl font-bold text-green-400">{playerStats.totalWords}</div>
            <div className="text-sm text-gray-300">완성한 단어</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-blue-400">{playerStats.averageWPM}</div>
            <div className="text-sm text-gray-300">평균 WPM</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-purple-400">{playerStats.accuracy}%</div>
            <div className="text-sm text-gray-300">정확도</div>
          </div>
          <div className="card-game text-center">
            <div className="text-2xl font-bold text-yellow-400">{playerStats.streak}</div>
            <div className="text-sm text-gray-300">최고 연속</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WordBattleArena