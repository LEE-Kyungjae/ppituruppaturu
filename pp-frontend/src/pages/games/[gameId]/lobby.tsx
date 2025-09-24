import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Head from 'next/head'
import { GameLobby } from '@/components/games/GameLobby'
import { GameType } from '@/lib/game-engine/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function GameLobbyPage() {
  const router = useRouter()
  const { gameId, roomId } = router.query

  // 게임 ID를 GameType으로 변환
  const getGameType = (id: string): GameType => {
    const gameTypeMap: Record<string, GameType> = {
      'battle-royale': 'physics_battle_royale',
      'puzzle-race': 'puzzle_race',
      'rhythm-action': 'rhythm_action',
      'click-speed': 'click_speed',
      'memory-match': 'memory_match',
      'number-guess': 'number_guess'
    }
    return gameTypeMap[id] || 'physics_battle_royale'
  }

  const getGameName = (id: string): string => {
    const gameNameMap: Record<string, string> = {
      'battle-royale': '물리 배틀로얄',
      'puzzle-race': '퍼즐 레이스',
      'rhythm-action': '리듬 액션',
      'click-speed': '클릭 스피드',
      'memory-match': '기억력 매치',
      'number-guess': '숫자 맞히기'
    }
    return gameNameMap[id] || '알 수 없는 게임'
  }

  const handleStartGame = () => {
    // 실제 게임 페이지로 이동
    router.push(`/games/${gameId}?multiplayer=true&roomId=${roomId || 'default'}`)
  }

  const handleLeaveRoom = () => {
    // 게임 목록으로 돌아가기
    router.push('/games')
  }

  const handleGameReady = () => {
    // 게임 준비 완료 처리
    console.log('Game is ready to start!')
  }

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">게임을 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/games')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            게임 목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const gameType = getGameType(gameId as string)
  const gameName = getGameName(gameId as string)

  return (
    <>
      <Head>
        <title>{gameName} 로비 - 삐뚜루빠뚜루</title>
        <meta name="description" content={`${gameName} 멀티플레이어 로비에서 다른 플레이어들과 함께 게임을 즐기세요!`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GameLobby
            gameType={gameType}
            roomId={roomId as string}
            isHost={!roomId} // roomId가 없으면 새 방을 만든 호스트
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onGameReady={handleGameReady}
          />
        </motion.div>
      </div>
    </>
  )
}