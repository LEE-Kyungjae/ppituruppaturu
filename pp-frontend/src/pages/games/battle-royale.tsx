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
  Shield,
  Sword,
  Star,
  Crown,
  Info,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw
} from 'lucide-react'

interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard'
  gameMode: 'singleplayer' | 'multiplayer'
  maxPlayers: number
  timeLimit: number
  enableAudio: boolean
  autoStart: boolean
}

export default function BattleRoyalePage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    gameMode: 'singleplayer',
    maxPlayers: 10,
    timeLimit: 300, // 5분
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
    enablePhysics: true,
    enableAudio: settings.enableAudio,
    enableParticles: true,
    customSettings: {
      battleRoyale: {
        shrinkingZone: true,
        weaponSpawn: true,
        destructibleTerrain: true,
        powerUps: true
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
    { key: 'W, A, S, D', action: '이동' },
    { key: 'Mouse', action: '조준 및 공격' },
    { key: 'Space', action: '점프' },
    { key: 'Shift', action: '달리기' },
    { key: 'E', action: '아이템 획득' },
    { key: 'R', action: '재장전' },
    { key: 'Tab', action: '점수판 보기' },
    { key: 'Esc', action: '일시정지' }
  ]

  const gameFeatures = [
    {
      icon: <Target className="w-6 h-6 text-red-500" />,
      title: '물리 기반 전투',
      description: '현실적인 물리 엔진으로 구현된 전투 시스템'
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: '축소되는 구역',
      description: '시간이 지날수록 플레이 가능 구역이 축소됩니다'
    },
    {
      icon: <Sword className="w-6 h-6 text-purple-500" />,
      title: '다양한 무기',
      description: '근접 무기부터 원거리 무기까지 다양한 선택지'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: '파워업 아이템',
      description: '게임을 유리하게 만들어주는 특별한 아이템들'
    }
  ]

  return (
    <>
      <Head>
        <title>물리 배틀로얄 - 삐뚜루빠뚜루</title>
        <meta name="description" content="물리 엔진을 활용한 실시간 배틀로얄 게임!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 p-4">
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
                  ⚔️ 물리 배틀로얄
                  <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full">
                    🔥 HOT
                  </span>
                </h1>
                <p className="text-gray-600">마지막까지 살아남는 자가 승리한다!</p>
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
                        gameType="physics_battle_royale"
                        gameConfig={gameConfig}
                        onGameEnd={handleGameEnd}
                        onError={handleGameError}
                        className="w-full aspect-[4/3]"
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* 배경 애니메이션 */}
                        <div className="absolute inset-0 opacity-20">
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full"
                              initial={{ opacity: 0, x: Math.random() * 800, y: Math.random() * 600 }}
                              animate={{
                                opacity: [0, 1, 0],
                                x: Math.random() * 800,
                                y: Math.random() * 600
                              }}
                              transition={{
                                duration: Math.random() * 3 + 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                              }}
                            />
                          ))}
                        </div>

                        <div className="text-center z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.8 }}
                            className="mb-6"
                          >
                            <div className="text-6xl mb-4">⚔️</div>
                            <h2 className="text-3xl font-bold mb-2">물리 배틀로얄</h2>
                            <p className="text-gray-300">준비되면 게임을 시작하세요!</p>
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
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg px-8 py-4"
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
                        <Crown className="w-6 h-6 text-yellow-500" />
                        게임 종료!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {gameScore.toLocaleString()}점
                        </div>
                        <p className="text-gray-600">최종 점수</p>
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
                        <div className="font-bold text-lg text-red-500">{settings.maxPlayers}</div>
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
                        <div className="flex gap-1">
                          {['easy', 'medium', 'hard'].map((diff) => (
                            <Button
                              key={diff}
                              size="sm"
                              variant={settings.difficulty === diff ? 'default' : 'outline'}
                              onClick={() => setSettings({...settings, difficulty: diff as any})}
                            >
                              {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
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
                            onClick={() => setSettings({...settings, maxPlayers: Math.max(2, settings.maxPlayers - 2)})}
                          >
                            -
                          </Button>
                          <span className="px-3 py-1 bg-gray-100 rounded">{settings.maxPlayers}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettings({...settings, maxPlayers: Math.min(20, settings.maxPlayers + 2)})}
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
                          <span className="text-gray-600">{control.action}</span>
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