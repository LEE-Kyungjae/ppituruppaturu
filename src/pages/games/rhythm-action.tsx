import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { GameCanvas } from '@/lib/game-engine/GameCanvas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play, Settings, Users, Trophy, Clock, Star, ArrowLeft,
  Music, Volume2, VolumeX, Headphones, Target, Zap, TrendingUp
} from 'lucide-react'

interface GameSettings {
  gameMode: 'singleplayer' | 'multiplayer'
  difficulty: 'easy' | 'medium' | 'hard'
  songSpeed: number
  keyBindings: 'DFJK' | 'ASDF' | 'custom'
  enableVisualEffects: boolean
  enableAudio: boolean
  judgeStrictness: 'lenient' | 'normal' | 'strict'
}

interface GameStats {
  gamesPlayed: number
  songsCleared: number
  perfectCount: number
  maxCombo: number
  accuracy: number
  totalNotes: number
  totalPlayTime: number // minutes
}

interface SongInfo {
  title: string
  artist: string
  bpm: number
  difficulty: number
  duration: string
  genre: string
}

const songList: SongInfo[] = [
  {
    title: "Electric Storm",
    artist: "PittuRu",
    bpm: 128,
    difficulty: 7,
    duration: "2:43",
    genre: "Electronic"
  },
  {
    title: "Neon Dreams",
    artist: "PittuRu",
    bpm: 140,
    difficulty: 8,
    duration: "3:12",
    genre: "Synthwave"
  },
  {
    title: "Digital Pulse",
    artist: "PittuRu",
    bpm: 160,
    difficulty: 9,
    duration: "2:58",
    genre: "Drum & Bass"
  }
]

const difficultySettings = {
  easy: { noteSpeed: 1.0, judgeWindow: 150, scrollSpeed: 1.0 },
  medium: { noteSpeed: 1.2, judgeWindow: 100, scrollSpeed: 1.3 },
  hard: { noteSpeed: 1.5, judgeWindow: 75, scrollSpeed: 1.6 }
}

const keyBindingOptions = {
  DFJK: ['D', 'F', 'J', 'K'],
  ASDF: ['A', 'S', 'D', 'F'],
  custom: ['사용자 정의']
}

export default function RhythmActionPage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedSong, setSelectedSong] = useState<SongInfo>(songList[0])
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: 'singleplayer',
    difficulty: 'medium',
    songSpeed: 1.0,
    keyBindings: 'DFJK',
    enableVisualEffects: true,
    enableAudio: true,
    judgeStrictness: 'normal'
  })
  const [gameStats] = useState<GameStats>({
    gamesPlayed: 67,
    songsCleared: 54,
    perfectCount: 8,
    maxCombo: 342,
    accuracy: 92.4,
    totalNotes: 12847,
    totalPlayTime: 180
  })
  const [currentScore, setCurrentScore] = useState(0)
  const [currentCombo, setCurrentCombo] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(true)

  // 난이도 변경 시 속도 자동 조정
  useEffect(() => {
    const settings = difficultySettings[gameSettings.difficulty]
    setGameSettings(prev => ({ ...prev, songSpeed: settings.noteSpeed }))
  }, [gameSettings.difficulty])

  const handleGameStart = () => {
    setGameStarted(true)
  }

  const handleGameEnd = (finalScore: number) => {
    setCurrentScore(finalScore)
    setGameStarted(false)
    console.log(`리듬 액션 종료! 최종 점수: ${finalScore}`)
  }

  const handleGameError = (error: Error) => {
    console.error('게임 에러:', error)
    setGameStarted(false)
  }

  const handleBackToGames = () => {
    router.push('/games')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < level ? 'text-yellow-500 fill-current' : 'text-gray-600'}`}
      />
    ))
  }

  const clearRate = gameStats.gamesPlayed > 0
    ? Math.round((gameStats.songsCleared / gameStats.gamesPlayed) * 100)
    : 0

  const perfectRate = gameStats.gamesPlayed > 0
    ? Math.round((gameStats.perfectCount / gameStats.gamesPlayed) * 100)
    : 0

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* 게임 헤더 */}
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-bold">리듬 액션</h1>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {selectedSong.title}
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {selectedSong.bpm} BPM
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              점수: <span className="font-bold text-yellow-400">{currentScore}</span>
            </div>
            <div className="text-white text-sm">
              콤보: <span className="font-bold text-purple-400">{currentCombo}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGameStarted(false)}
              className="text-white border-gray-600"
            >
              나가기
            </Button>
          </div>
        </div>

        {/* 게임 캔버스 */}
        <div className="flex-1">
          <GameCanvas
            gameType="rhythm_action"
            gameConfig={{
              ...gameSettings,
              autoStart: true,
              customSettings: {
                selectedSong,
                bpm: selectedSong.bpm
              }
            }}
            onGameEnd={handleGameEnd}
            onError={handleGameError}
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* 뒤로 가기 버튼 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackToGames}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            게임 목록으로
          </Button>
        </motion.div>

        {/* 게임 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-4xl font-bold text-white mb-2">리듬 액션</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            음악에 맞춰 완벽한 타이밍을 맞추는 리듬 게임
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 게임 설정 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* 곡 선택 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  곡 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {songList.map((song, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSong.title === song.title
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedSong(song)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{song.title}</h3>
                          <p className="text-gray-400 text-sm">{song.artist} • {song.genre}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>{song.bpm} BPM</span>
                            <span>{song.duration}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-sm mb-1">난이도 {song.difficulty}</div>
                          <div className="flex gap-1">
                            {getDifficultyStars(song.difficulty)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 게임 모드 선택 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  게임 모드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={gameSettings.gameMode === 'singleplayer' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setGameSettings(prev => ({ ...prev, gameMode: 'singleplayer' }))}
                  >
                    <Target className="w-5 h-5 mb-1" />
                    <span>싱글플레이어</span>
                    <span className="text-xs opacity-75">개인 기록 도전</span>
                  </Button>
                  <Button
                    variant={gameSettings.gameMode === 'multiplayer' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setGameSettings(prev => ({ ...prev, gameMode: 'multiplayer' }))}
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span>멀티플레이어</span>
                    <span className="text-xs opacity-75">실시간 대전</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 게임 설정 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  게임 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 난이도 설정 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    플레이 난이도
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <Button
                        key={diff}
                        variant={gameSettings.difficulty === diff ? 'default' : 'outline'}
                        onClick={() => setGameSettings(prev => ({ ...prev, difficulty: diff }))}
                        className="h-12 flex flex-col items-center justify-center"
                      >
                        <div className={`w-2 h-2 rounded-full mb-1 ${getDifficultyColor(diff)}`} />
                        <span className="text-xs">
                          {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
                        </span>
                        <span className="text-xs opacity-60">
                          {difficultySettings[diff].noteSpeed}x
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 키 바인딩 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    키 바인딩
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['DFJK', 'ASDF', 'custom'] as const).map((binding) => (
                      <Button
                        key={binding}
                        variant={gameSettings.keyBindings === binding ? 'default' : 'outline'}
                        onClick={() => setGameSettings(prev => ({ ...prev, keyBindings: binding }))}
                        className="h-12 flex flex-col items-center justify-center"
                      >
                        <span className="text-sm font-mono">
                          {binding === 'custom' ? '사용자' : binding}
                        </span>
                        <span className="text-xs opacity-60">
                          {binding === 'custom' ? '정의' : '기본'}
                        </span>
                      </Button>
                    ))}
                  </div>
                  {gameSettings.keyBindings !== 'custom' && (
                    <div className="flex justify-center gap-2 mt-3">
                      {keyBindingOptions[gameSettings.keyBindings].map((key, index) => (
                        <div
                          key={index}
                          className="w-10 h-10 bg-gray-700 border border-gray-600 rounded flex items-center justify-center text-white font-mono text-sm"
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 노트 속도 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    노트 속도: {gameSettings.songSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={gameSettings.songSpeed}
                    onChange={(e) => setGameSettings(prev => ({
                      ...prev,
                      songSpeed: parseFloat(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* 판정 엄격도 */}
                <div>
                  <label className="text-white text-sm font-medium mb-3 block">
                    판정 엄격도
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['lenient', 'normal', 'strict'] as const).map((strictness) => (
                      <Button
                        key={strictness}
                        variant={gameSettings.judgeStrictness === strictness ? 'default' : 'outline'}
                        onClick={() => setGameSettings(prev => ({ ...prev, judgeStrictness: strictness }))}
                        className="h-10"
                      >
                        {strictness === 'lenient' ? '관대' : strictness === 'normal' ? '보통' : '엄격'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 게임 옵션 */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.enableVisualEffects}
                      onChange={(e) => setGameSettings(prev => ({
                        ...prev,
                        enableVisualEffects: e.target.checked
                      }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white text-sm">비주얼 이펙트</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.enableAudio && audioEnabled}
                      onChange={(e) => {
                        setAudioEnabled(e.target.checked)
                        setGameSettings(prev => ({
                          ...prev,
                          enableAudio: e.target.checked
                        }))
                      }}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white text-sm">사운드</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* 시작 버튼 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleGameStart}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Play className="w-6 h-6 mr-3" />
                리듬 시작
              </Button>
            </motion.div>
          </motion.div>

          {/* 사이드바 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* 선택된 곡 정보 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  선택된 곡
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">{selectedSong.title}</h3>
                  <p className="text-gray-400">{selectedSong.artist}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">장르</span>
                    <span className="text-white">{selectedSong.genre}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">BPM</span>
                    <span className="text-white">{selectedSong.bpm}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">길이</span>
                    <span className="text-white">{selectedSong.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">난이도</span>
                    <div className="flex gap-1">
                      {getDifficultyStars(selectedSong.difficulty)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내 통계 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  내 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{gameStats.gamesPlayed}</div>
                    <div className="text-xs text-gray-400">플레이</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{gameStats.songsCleared}</div>
                    <div className="text-xs text-gray-400">클리어</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{clearRate}%</div>
                    <div className="text-xs text-gray-400">클리어율</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{perfectRate}%</div>
                    <div className="text-xs text-gray-400">퍼펙트</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">최대 콤보</span>
                    <span className="text-white">{gameStats.maxCombo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">평균 정확도</span>
                    <span className="text-white">{gameStats.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">총 노트</span>
                    <span className="text-white">{gameStats.totalNotes.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">리듬 레벨</span>
                    <span className="text-white">프로</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* 조작법 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">조작법</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">레인 1-4</span>
                    <span className="text-white font-mono">{keyBindingOptions[gameSettings.keyBindings].join(' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">일시정지</span>
                    <span className="text-white">ESC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">다시 시작</span>
                    <span className="text-white">R</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 리듬 팁 */}
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  리듬 팁
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>• 음악에 집중하고 비트를 느끼세요</p>
                  <p>• 시각적 노트보다 음악을 따라가세요</p>
                  <p>• 콤보를 유지하면 점수가 배가됩니다</p>
                  <p>• 완벽한 타이밍보다 일정한 리듬이 중요합니다</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}