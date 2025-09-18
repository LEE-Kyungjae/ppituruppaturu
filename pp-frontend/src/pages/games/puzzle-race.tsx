import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameCanvas } from '@/lib/game-engine/GameCanvas'
import { GameConfig, GameType } from '@/lib/game-engine/types'
import {
  ArrowLeft,
  Play,
  Settings,
  Users,
  Trophy,
  Target,
  Timer,
  Zap,
  Puzzle,
  Brain,
  Star,
  Crown,
  Info,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Clock,
  Award
} from 'lucide-react'

interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard'
  gameMode: 'singleplayer' | 'multiplayer'
  maxPlayers: number
  timeLimit: number
  puzzleType: 'blocks' | 'matching' | 'sequences' | 'mixed'
  enableAudio: boolean
  autoStart: boolean
}

export default function PuzzleRacePage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    gameMode: 'singleplayer',
    maxPlayers: 6,
    timeLimit: 180, // 3분
    puzzleType: 'mixed',
    enableAudio: true,
    autoStart: false
  })

  const gameConfig: Partial<GameConfig> = {
    width: 800,
    height: 600,
    autoStart: settings.autoStart,
    maxPlayers: settings.maxPlayers,
    gameMode: settings.gameMode,
    difficulty: settings.difficulty,
    timeLimit: settings.timeLimit,
    enablePhysics: false, // 퍼즐 게임은 물리 엔진 불필요
    enableAudio: settings.enableAudio,
    enableParticles: true,
    customSettings: {
      puzzleRace: {
        puzzleType: settings.puzzleType,
        hintSystem: true,
        timedBonus: true,
        streakMultiplier: true
      }
    }
  }

  const handleGameStart = () => {
    setGameStarted(true)
    setGameEnded(false)
    setGameScore(0)
  }

  const handleGameEnd = (score: number) => {
    setGameEnded(true)
    setGameScore(score)
  }

  const handleGameError = (error: Error) => {
    console.error('Game error:', error)
    // 에러 처리 로직
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  const handleRestartGame = () => {
    setGameStarted(false)
    setGameEnded(false)
    setGameScore(0)
  }

  const controls = [
    { key: 'Mouse', action: '퍼즐 조각 클릭/드래그' },
    { key: 'Space', action: '힌트 보기 (제한적)' },
    { key: '1-4', action: '퍼즐 유형 빠른 전환' },
    { key: 'Tab', action: '순위판 보기' },
    { key: 'H', action: '도움말 보기' },
    { key: 'R', action: '퍼즐 초기화' },
    { key: 'Esc', action: '일시정지' }
  ]

  const gameFeatures = [
    {
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      title: '다양한 퍼즐 유형',
      description: '블록 맞추기, 패턴 매칭, 순서 맞추기 등 다양한 퍼즐'
    },
    {
      icon: <Timer className="w-6 h-6 text-blue-500" />,
      title: '시간 보너스',
      description: '빠르게 해결할수록 더 많은 점수 획득'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: '연속 해결 보너스',
      description: '연속으로 퍼즐을 해결하면 점수 배율 증가'
    },
    {
      icon: <Target className="w-6 h-6 text-red-500" />,
      title: '실시간 경쟁',
      description: '다른 플레이어와 실시간으로 경쟁하며 순위 확인'
    }
  ]

  const puzzleTypes = [
    { id: 'blocks', name: '블록 퍼즐', icon: '🟩', description: '테트리스와 유사한 블록 맞추기' },
    { id: 'matching', name: '매칭 게임', icon: '🎯', description: '같은 모양이나 색상 찾기' },
    { id: 'sequences', name: '순서 맞추기', icon: '🔢', description: '올바른 순서로 배열하기' },
    { id: 'mixed', name: '혼합 모드', icon: '🎲', description: '모든 퍼즐 유형이 랜덤 등장' }
  ]

  const difficultySettings = {
    easy: { description: '초보자용 - 힌트 많음, 시간 여유', color: 'text-green-600' },
    medium: { description: '중급자용 - 적절한 난이도', color: 'text-yellow-600' },
    hard: { description: '고수용 - 힌트 적음, 시간 촉박', color: 'text-red-600' }
  }

  return (
    <>
      <Head>
        <title>퍼즐 레이스 - PittuRu</title>
        <meta name="description" content="빠르게 퍼즐을 풀고 상대를 이기세요! 두뇌와 속도의 경쟁" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToGames}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                게임 목록
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  🧩 퍼즐 레이스
                  <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full">
                    ✨ NEW
                  </span>
                </h1>
                <p className="text-gray-600">두뇌와 속도의 완벽한 조합!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                leftIcon={<Settings className="w-4 h-4" />}
              >
                설정
              </Button>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>최대 {settings.maxPlayers}명</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* 메인 게임 영역 */}
            <div className="xl:col-span-3 space-y-6">
              {/* 게임 캔버스 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card variant="glass" className="overflow-hidden">
                  <CardContent noPadding>
                    {gameStarted ? (
                      <GameCanvas
                        gameType="puzzle_race" as GameType
                        gameConfig={gameConfig}
                        onGameEnd={handleGameEnd}
                        onError={handleGameError}
                        className="w-full aspect-[4/3]"
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* 배경 애니메이션 */}
                        <div className="absolute inset-0 opacity-10">
                          {[...Array(15)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-4xl"
                              initial={{ opacity: 0, x: Math.random() * 800, y: Math.random() * 600 }}
                              animate={{
                                opacity: [0.1, 0.3, 0.1],
                                x: Math.random() * 800,
                                y: Math.random() * 600,
                                rotate: [0, 360]
                              }}
                              transition={{
                                duration: Math.random() * 8 + 4,
                                repeat: Infinity,
                                delay: Math.random() * 3
                              }}
                            >
                              {['🧩', '🎯', '🔢', '🟩', '🟦', '🟪'][Math.floor(Math.random() * 6)]}
                            </motion.div>
                          ))}
                        </div>

                        <div className="text-center z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.8 }}
                            className="mb-6"
                          >
                            <div className="text-6xl mb-4">🧩</div>
                            <h2 className="text-3xl font-bold mb-2">퍼즐 레이스</h2>
                            <p className="text-purple-200">빠르게 퍼즐을 해결하고 1등을 차지하세요!</p>
                          </motion.div>

                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Button
                              size="lg"
                              onClick={handleGameStart}
                              leftIcon={<Play className="w-5 h-5" />}
                              className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg px-8 py-4"
                            >
                              게임 시작
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* 게임 결과 */}
              {gameEnded && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={handleRestartGame}
                >
                  <Card variant="glass" className="max-w-md mx-4">
                    <CardHeader className="text-center">
                      <CardTitle level={2} className="flex items-center justify-center gap-2">
                        <Crown className="w-6 h-6 text-purple-500" />
                        퍼즐 완료!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {gameScore.toLocaleString()}점
                        </div>
                        <p className="text-gray-600">최종 점수</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">#{Math.floor(Math.random() * 3) + 1}</div>
                          <div className="text-gray-600">순위</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">85%</div>
                          <div className="text-gray-600">정확도</div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleRestartGame} leftIcon={<RotateCcw className="w-4 h-4" />}>
                          다시 플레이
                        </Button>
                        <Button variant="outline" onClick={handleBackToGames}>
                          게임 목록
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 게임 정보 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle level={4} className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      게임 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg text-purple-500">{settings.maxPlayers}</div>
                        <div className="text-gray-600">최대 플레이어</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-blue-500">{settings.timeLimit / 60}분</div>
                        <div className="text-gray-600">제한 시간</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        settings.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        settings.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {settings.difficulty === 'easy' ? '쉬움' :
                         settings.difficulty === 'medium' ? '보통' : '어려움'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {puzzleTypes.find(t => t.id === settings.puzzleType)?.icon}
                      </div>
                      <div className="text-xs text-gray-600">
                        {puzzleTypes.find(t => t.id === settings.puzzleType)?.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 게임 설정 */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle level={4}>게임 설정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">난이도</label>
                        <div className="space-y-2">
                          {['easy', 'medium', 'hard'].map((diff) => (
                            <div key={diff} className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={settings.difficulty === diff ? 'default' : 'outline'}
                                onClick={() => setSettings({...settings, difficulty: diff as any})}
                                className="w-16"
                              >
                                {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
                              </Button>
                              <span className={`text-xs ${difficultySettings[diff as keyof typeof difficultySettings].color}`}>
                                {difficultySettings[diff as keyof typeof difficultySettings].description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">퍼즐 유형</label>
                        <div className="grid grid-cols-1 gap-2">
                          {puzzleTypes.map((type) => (
                            <Button
                              key={type.id}
                              size="sm"
                              variant={settings.puzzleType === type.id ? 'default' : 'outline'}
                              onClick={() => setSettings({...settings, puzzleType: type.id as any})}
                              leftIcon={<span className="text-sm">{type.icon}</span>}
                              className="justify-start"
                            >
                              <div className="text-left">
                                <div className="text-xs font-medium">{type.name}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">플레이어 수</label>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettings({...settings, maxPlayers: Math.max(2, settings.maxPlayers - 1)})}
                          >
                            -
                          </Button>
                          <span className="px-3 py-1 bg-gray-100 rounded">{settings.maxPlayers}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettings({...settings, maxPlayers: Math.min(10, settings.maxPlayers + 1)})}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">사운드 효과</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSettings({...settings, enableAudio: !settings.enableAudio})}
                          leftIcon={settings.enableAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        >
                          {settings.enableAudio ? '켜짐' : '꺼짐'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 조작법 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle level={4}>조작법</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {controls.map((control, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {control.key}
                          </span>
                          <span className="text-gray-600 text-xs">{control.action}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 게임 특징 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle level={4}>게임 특징</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gameFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          {feature.icon}
                          <div>
                            <div className="font-medium text-sm">{feature.title}</div>
                            <div className="text-xs text-gray-600">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}