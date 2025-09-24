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
  Music,
  Headphones,
  Star,
  Crown,
  Info,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Clock,
  Award,
  Activity,
  Disc3
} from 'lucide-react'

interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  gameMode: 'singleplayer' | 'multiplayer'
  maxPlayers: number
  songGenre: 'pop' | 'rock' | 'electronic' | 'classical' | 'mixed'
  noteSpeed: number
  enableVisualEffects: boolean
  enableAudio: boolean
  autoStart: boolean
}

export default function RhythmActionPage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    gameMode: 'singleplayer',
    maxPlayers: 4,
    songGenre: 'mixed',
    noteSpeed: 5,
    enableVisualEffects: true,
    enableAudio: true,
    autoStart: false
  })

  const gameConfig: Partial<GameConfig> = {
    width: 800,
    height: 600,
    autoStart: settings.autoStart,
    maxPlayers: settings.maxPlayers,
    gameMode: settings.gameMode,
    difficulty: settings.difficulty === 'expert' ? 'hard' : settings.difficulty,
    timeLimit: 180, // 3분 (곡 길이에 따라 동적 조정)
    enablePhysics: false, // 리듬 게임은 물리 엔진 불필요
    enableAudio: settings.enableAudio,
    enableParticles: settings.enableVisualEffects,
    customSettings: {
      rhythmAction: {
        songGenre: settings.songGenre,
        noteSpeed: settings.noteSpeed,
        visualEffects: settings.enableVisualEffects,
        perfectWindow: 50, // ms
        goodWindow: 100, // ms
        okWindow: 150, // ms
        comboSystem: true
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
    { key: 'D, F, J, K', action: '리듬 노트 입력 (메인 키)' },
    { key: 'S, G, H, L', action: '추가 리듬 노트 입력' },
    { key: 'Space', action: '특별 노트 / 긴 노트' },
    { key: 'Left/Right', action: '슬라이드 노트' },
    { key: 'Tab', action: '점수 및 콤보 확인' },
    { key: 'Enter', action: '곡 스킵 (연습 모드)' },
    { key: 'Esc', action: '일시정지' }
  ]

  const gameFeatures = [
    {
      icon: <Music className="w-6 h-6 text-pink-500" />,
      title: '다양한 음악 장르',
      description: 'Pop, Rock, Electronic, Classical 등 다양한 장르'
    },
    {
      icon: <Activity className="w-6 h-6 text-green-500" />,
      title: '실시간 판정 시스템',
      description: 'Perfect, Good, OK, Miss의 정밀한 판정'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: '콤보 시스템',
      description: '연속으로 노트를 맞히면 점수 배율 증가'
    },
    {
      icon: <Disc3 className="w-6 h-6 text-purple-500" />,
      title: '화려한 비주얼 이펙트',
      description: '음악과 동조하는 다이나믹한 시각 효과'
    }
  ]

  const songGenres = [
    { id: 'pop', name: 'Pop', icon: '🎤', description: '대중적이고 친근한 팝 음악' },
    { id: 'rock', name: 'Rock', icon: '🎸', description: '강렬하고 파워풀한 록 음악' },
    { id: 'electronic', name: 'Electronic', icon: '🎧', description: '신디사이저와 비트가 돋보이는 전자음악' },
    { id: 'classical', name: 'Classical', icon: '🎼', description: '우아하고 정교한 클래식 음악' },
    { id: 'mixed', name: 'Mixed', icon: '🎵', description: '모든 장르가 랜덤으로 등장' }
  ]

  const difficultySettings = {
    easy: { description: '초보자용 - 느린 속도, 간단한 패턴', color: 'text-green-600', speed: 3 },
    medium: { description: '중급자용 - 적당한 속도와 패턴', color: 'text-yellow-600', speed: 5 },
    hard: { description: '고급자용 - 빠른 속도, 복잡한 패턴', color: 'text-red-600', speed: 7 },
    expert: { description: '전문가용 - 최고 속도, 극한 패턴', color: 'text-purple-600', speed: 9 }
  }

  const getScoreGrade = (score: number) => {
    if (score >= 950000) return { grade: 'SSS', color: 'text-purple-600' }
    if (score >= 900000) return { grade: 'SS', color: 'text-blue-600' }
    if (score >= 850000) return { grade: 'S', color: 'text-green-600' }
    if (score >= 800000) return { grade: 'A', color: 'text-yellow-600' }
    if (score >= 700000) return { grade: 'B', color: 'text-orange-600' }
    if (score >= 600000) return { grade: 'C', color: 'text-red-600' }
    return { grade: 'D', color: 'text-gray-600' }
  }

  return (
    <>
      <Head>
        <title>리듬 액션 - 삐뚜루빠뚜루</title>
        <meta name="description" content="음악에 맞춰 리듬을 맞추는 액션 게임! 완벽한 타이밍을 노려보세요" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-4">
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
                  🎵 리듬 액션
                  <div className="flex gap-1">
                    <span className="text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full">
                      🔥 HOT
                    </span>
                    <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full">
                      ✨ NEW
                    </span>
                  </div>
                </h1>
                <p className="text-gray-600">리듬을 타고 완벽한 타이밍을 만들어보세요!</p>
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
                        gameType="rhythm_action"
                        gameConfig={gameConfig}
                        onGameEnd={handleGameEnd}
                        onError={handleGameError}
                        className="w-full aspect-[4/3]"
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        {/* 배경 음표 애니메이션 */}
                        <div className="absolute inset-0 opacity-10">
                          {[...Array(25)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-2xl md:text-4xl"
                              initial={{
                                opacity: 0,
                                x: Math.random() * 800,
                                y: Math.random() * 600,
                                rotate: Math.random() * 360
                              }}
                              animate={{
                                opacity: [0.1, 0.4, 0.1],
                                x: Math.random() * 800,
                                y: Math.random() * 600,
                                rotate: Math.random() * 360
                              }}
                              transition={{
                                duration: Math.random() * 6 + 3,
                                repeat: Infinity,
                                delay: Math.random() * 4
                              }}
                            >
                              {['♪', '♫', '♬', '🎵', '🎶', '🎼'][Math.floor(Math.random() * 6)]}
                            </motion.div>
                          ))}
                        </div>

                        {/* 리듬 파동 효과 */}
                        <motion.div
                          className="absolute inset-0"
                          initial={{ scale: 0, opacity: 0.5 }}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.3, 0.1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="w-full h-full border-4 border-pink-500 rounded-full"></div>
                        </motion.div>

                        <div className="text-center z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.8 }}
                            className="mb-6"
                          >
                            <motion.div
                              className="text-6xl mb-4"
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              🎵
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                              리듬 액션
                            </h2>
                            <p className="text-purple-200">리듬을 느끼고, 비트를 맞춰보세요!</p>
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
                              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg px-8 py-4 shadow-lg"
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
                        <Crown className="w-6 h-6 text-pink-500" />
                        연주 완료!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <div className={`text-4xl font-bold mb-2 ${getScoreGrade(gameScore).color}`}>
                          {getScoreGrade(gameScore).grade}
                        </div>
                        <div className="text-2xl font-bold text-pink-600 mb-2">
                          {gameScore.toLocaleString()}점
                        </div>
                        <p className="text-gray-600">최종 점수</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-green-600">Perfect</div>
                          <div className="text-gray-600">{Math.floor(Math.random() * 100) + 50}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600">Good</div>
                          <div className="text-gray-600">{Math.floor(Math.random() * 30) + 10}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">Max Combo</div>
                          <div className="text-gray-600">{Math.floor(Math.random() * 200) + 100}</div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-purple-600">정확도: {Math.floor(Math.random() * 20) + 80}%</div>
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
                        <div className="font-bold text-lg text-pink-500">{settings.maxPlayers}</div>
                        <div className="text-gray-600">최대 플레이어</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-purple-500">
                          속도 {settings.noteSpeed}
                        </div>
                        <div className="text-gray-600">노트 속도</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        settings.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        settings.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        settings.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {settings.difficulty === 'easy' ? '쉬움' :
                         settings.difficulty === 'medium' ? '보통' :
                         settings.difficulty === 'hard' ? '어려움' : '전문가'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {songGenres.find(g => g.id === settings.songGenre)?.icon}
                      </div>
                      <div className="text-xs text-gray-600">
                        {songGenres.find(g => g.id === settings.songGenre)?.name}
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
                        <div className="grid grid-cols-2 gap-2">
                          {['easy', 'medium', 'hard', 'expert'].map((diff) => (
                            <Button
                              key={diff}
                              size="sm"
                              variant={settings.difficulty === diff ? 'default' : 'outline'}
                              onClick={() => setSettings({...settings, difficulty: diff as any, noteSpeed: difficultySettings[diff as keyof typeof difficultySettings].speed})}
                              className="text-xs"
                            >
                              {diff === 'easy' ? '쉬움' :
                               diff === 'medium' ? '보통' :
                               diff === 'hard' ? '어려움' : '전문가'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">음악 장르</label>
                        <div className="grid grid-cols-1 gap-2">
                          {songGenres.map((genre) => (
                            <Button
                              key={genre.id}
                              size="sm"
                              variant={settings.songGenre === genre.id ? 'default' : 'outline'}
                              onClick={() => setSettings({...settings, songGenre: genre.id as any})}
                              leftIcon={<span className="text-sm">{genre.icon}</span>}
                              className="justify-start text-xs"
                            >
                              {genre.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">노트 속도: {settings.noteSpeed}</label>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettings({...settings, noteSpeed: Math.max(1, settings.noteSpeed - 1)})}
                          >
                            -
                          </Button>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full transition-all"
                              style={{ width: `${(settings.noteSpeed / 10) * 100}%` }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettings({...settings, noteSpeed: Math.min(10, settings.noteSpeed + 1)})}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">비주얼 이펙트</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSettings({...settings, enableVisualEffects: !settings.enableVisualEffects})}
                        >
                          {settings.enableVisualEffects ? '켜짐' : '꺼짐'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">사운드</span>
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
                        <div key={index} className="flex justify-between items-start">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {control.key}
                          </span>
                          <span className="text-gray-600 text-xs text-right flex-1 ml-2">
                            {control.action}
                          </span>
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