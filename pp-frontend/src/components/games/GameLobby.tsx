'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameType, GamePlayer, GameRoom } from '@/lib/game-engine/types'
import { GameUtils } from '@/lib/game-utils'
import {
  Users,
  Settings,
  Play,
  Crown,
  User,
  Clock,
  Lock,
  Unlock,
  Copy,
  Check,
  X,
  UserPlus,
  MessageCircle,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react'

interface GameLobbyProps {
  gameType: GameType
  roomId?: string
  isHost?: boolean
  onStartGame?: () => void
  onLeaveRoom?: () => void
  onGameReady?: (room: GameRoom) => void
}

export function GameLobby({
  gameType,
  roomId,
  isHost = false,
  onStartGame,
  onLeaveRoom,
  onGameReady
}: GameLobbyProps) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    username: string
    message: string
    timestamp: Date
    isSystem?: boolean
  }>>([])

  // 더미 데이터로 시작 (실제로는 WebSocket 연결을 통해 받아올 것)
  useEffect(() => {
    // 가짜 룸 데이터 생성
    const mockRoom: GameRoom = {
      id: roomId || 'room_' + Math.random().toString(36).substr(2, 9),
      name: `${GameUtils.getGameTypeIcon(gameType)} ${getGameTypeName(gameType)} 게임`,
      gameType,
      maxPlayers: getMaxPlayers(gameType),
      currentPlayers: [
        {
          id: 'player_1',
          username: '나',
          score: 0,
          isReady: false,
          isConnected: true,
          color: '#FF6B6B'
        }
      ],
      isPrivate: false,
      host: {
        id: 'player_1',
        username: '나',
        score: 0,
        isReady: true,
        isConnected: true,
        color: '#FF6B6B'
      },
      status: 'waiting',
      config: {
        width: 800,
        height: 600,
        autoStart: false,
        maxPlayers: getMaxPlayers(gameType),
        gameMode: 'multiplayer',
        difficulty: 'medium',
        enablePhysics: gameType === 'physics_battle_royale' || gameType === 'physics_destruction',
        enableAudio: true,
        enableParticles: true
      },
      createdAt: new Date()
    }

    setRoom(mockRoom)
    setIsConnected(true)

    // 가짜 플레이어들 추가 (시뮬레이션)
    const addFakePlayers = () => {
      const fakeNames = ['김철수', '이영희', '박민수', '최지은', '정상훈']
      const colors = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

      setTimeout(() => {
        if (Math.random() > 0.3) {
          const newPlayer: GamePlayer = {
            id: 'player_' + Math.random().toString(36).substr(2, 9),
            username: fakeNames[Math.floor(Math.random() * fakeNames.length)],
            score: 0,
            isReady: Math.random() > 0.5,
            isConnected: true,
            color: colors[Math.floor(Math.random() * colors.length)]
          }

          setRoom(prev => prev ? {
            ...prev,
            currentPlayers: [...prev.currentPlayers, newPlayer]
          } : null)

          // 채팅 메시지 추가
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(36),
            username: 'System',
            message: `${newPlayer.username}님이 입장했습니다.`,
            timestamp: new Date(),
            isSystem: true
          }])
        }
      }, Math.random() * 5000 + 2000)
    }

    // 여러 명의 가짜 플레이어 추가
    for (let i = 0; i < 3; i++) {
      setTimeout(addFakePlayers, i * 3000)
    }

    return () => {
      // 클린업
    }
  }, [gameType, roomId])

  const getGameTypeName = (type: GameType): string => {
    const names: Record<GameType, string> = {
      'physics_battle_royale': '물리 배틀로얄',
      'team_strategy': '팀 전략',
      'puzzle_race': '퍼즐 레이스',
      'rhythm_action': '리듬 액션',
      'physics_destruction': '물리 파괴',
      'click_speed': '클릭 스피드',
      'memory_match': '기억력 매치',
      'number_guess': '숫자 맞히기'
    }
    return names[type] || '알 수 없는 게임'
  }

  const getMaxPlayers = (type: GameType): number => {
    const maxPlayers: Record<GameType, number> = {
      'physics_battle_royale': 20,
      'team_strategy': 12,
      'puzzle_race': 10,
      'rhythm_action': 8,
      'physics_destruction': 16,
      'click_speed': 16,
      'memory_match': 8,
      'number_guess': 12
    }
    return maxPlayers[type] || 8
  }

  const handleCopyRoomId = () => {
    if (room) {
      navigator.clipboard.writeText(room.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleReady = () => {
    if (room) {
      setRoom({
        ...room,
        currentPlayers: room.currentPlayers.map(player =>
          player.id === 'player_1' ? { ...player, isReady: !player.isReady } : player
        )
      })
    }
  }

  const handleStartGame = () => {
    if (room && isHost && room.currentPlayers.length >= 2) {
      onStartGame?.()
      onGameReady?.(room)
    }
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(36),
        username: '나',
        message: chatMessage,
        timestamp: new Date()
      }])
      setChatMessage('')
    }
  }

  const readyPlayersCount = room?.currentPlayers.filter(p => p.isReady).length || 0
  const canStartGame = isHost && readyPlayersCount >= 2 && room?.currentPlayers.length && readyPlayersCount === room.currentPlayers.length

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {GameUtils.getGameTypeIcon(gameType)} {room.name}
            {room.isPrivate && <Lock className="w-5 h-5 text-yellow-500" />}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span>{isConnected ? '연결됨' : '연결 끊김'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{room.currentPlayers.length}/{room.maxPlayers}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>대기 중</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoomId}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? '복사됨!' : '방 ID 복사'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLeaveRoom}
            leftIcon={<X className="w-4 h-4" />}
          >
            나가기
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 플레이어 목록 */}
        <div className="lg:col-span-2">
          <Card variant="glass">
            <CardHeader>
              <CardTitle level={4} className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                플레이어 ({room.currentPlayers.length}/{room.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {room.currentPlayers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        variant={player.isReady ? 'glass' : 'outlined'}
                        className={`relative ${
                          player.isReady ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{player.username}</span>
                                {player.id === room.host.id && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                {player.isConnected ? (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                ) : (
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                                {player.isReady ? '준비 완료' : '대기 중'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* 빈 슬롯들 */}
                {Array.from({ length: room.maxPlayers - room.currentPlayers.length }).map((_, index) => (
                  <motion.div
                    key={`empty-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (room.currentPlayers.length + index) * 0.1 }}
                  >
                    <Card variant="ghost" className="border-dashed border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center h-12 text-gray-400">
                          <UserPlus className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* 게임 시작 버튼 */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isHost && (
                    <Button
                      onClick={handleToggleReady}
                      variant={room.currentPlayers.find(p => p.id === 'player_1')?.isReady ? 'default' : 'outline'}
                      leftIcon={room.currentPlayers.find(p => p.id === 'player_1')?.isReady ?
                        <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    >
                      {room.currentPlayers.find(p => p.id === 'player_1')?.isReady ? '준비 완료' : '준비하기'}
                    </Button>
                  )}
                </div>

                {isHost && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">
                      {readyPlayersCount}/{room.currentPlayers.length} 준비됨
                    </div>
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame}
                      size="lg"
                      leftIcon={<Play className="w-5 h-5" />}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400"
                    >
                      게임 시작
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 채팅 및 설정 */}
        <div className="space-y-6">
          {/* 채팅 */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle level={5} className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                채팅
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 채팅 메시지 */}
                <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-sm ${
                          msg.isSystem ? 'text-gray-500 italic' : ''
                        }`}
                      >
                        {msg.isSystem ? (
                          <span>{msg.message}</span>
                        ) : (
                          <div>
                            <span className="font-medium text-blue-600">{msg.username}:</span>
                            <span className="ml-2">{msg.message}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* 채팅 입력 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    전송
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 방 설정 */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle level={5} className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                게임 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>난이도:</span>
                <span className="font-medium capitalize">{room.config.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span>제한 시간:</span>
                <span className="font-medium">{room.config.timeLimit ? `${room.config.timeLimit}초` : '없음'}</span>
              </div>
              <div className="flex justify-between">
                <span>물리 엔진:</span>
                <span className="font-medium">{room.config.enablePhysics ? '활성화' : '비활성화'}</span>
              </div>
              <div className="flex justify-between">
                <span>파티클 효과:</span>
                <span className="font-medium">{room.config.enableParticles ? '활성화' : '비활성화'}</span>
              </div>
              <div className="flex justify-between">
                <span>사운드:</span>
                <span className="font-medium">{room.config.enableAudio ? '활성화' : '비활성화'}</span>
              </div>
            </CardContent>
          </Card>

          {/* 방 정보 */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle level={5}>방 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>방 ID:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {room.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>생성 시간:</span>
                <span>{room.createdAt.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>방장:</span>
                <span className="font-medium">{room.host.username}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}