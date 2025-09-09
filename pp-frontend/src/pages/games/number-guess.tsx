// frontend/src/pages/games/number-guess.tsx
import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../../components/layout/Navbar'
import NumberGuessGame from '../../components/games/NumberGuessGame'

export default function NumberGuessPage() {
  const [points, setPoints] = useState(1250) // 임시 포인트 상태

  const handlePointsEarned = (earnedPoints: number) => {
    setPoints(prev => prev + earnedPoints)
    // TODO: 실제 API 호출로 포인트 업데이트
  }

  const handleGameEnd = (score: number, stats: any) => {
    // TODO: 게임 결과를 서버에 저장
    console.log('Game ended:', { score, stats })
  }

  return (
    <>
      <Head>
        <title>숫자 맞추기 게임 - Gaming Platform</title>
        <meta name="description" content="컴퓨터가 생각한 숫자를 최소한의 시도로 맞춰보세요!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar 
        isLoggedIn={true}
        username="DemoUser"
        points={points}
        onLogin={() => {}}
        onLogout={() => {}}
      />

      <NumberGuessGame 
        onGameEnd={handleGameEnd}
        onPointsEarned={handlePointsEarned}
      />
    </>
  )
}