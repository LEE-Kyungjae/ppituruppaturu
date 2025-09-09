// frontend/src/pages/games/click-speed.tsx
import { useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import ClickSpeedGame from '../../components/games/ClickSpeedGame'
import SEOHead from '../../components/SEOHead'
import { generateSEO, gamesSEO, generateGameStructuredData, generateBreadcrumbStructuredData } from '../../utils/seo'

export default function ClickSpeedPage() {
  const [points, setPoints] = useState(1250) // 임시 포인트 상태

  const handlePointsEarned = (earnedPoints: number) => {
    setPoints(prev => prev + earnedPoints)
    // TODO: 실제 API 호출로 포인트 업데이트
  }

  const handleGameEnd = (score: number, stats: any) => {
    // TODO: 게임 결과를 서버에 저장
    console.log('Game ended:', { score, stats })
  }

  // SEO 설정
  const gameData = gamesSEO['click-speed']
  const seoProps = generateSEO({
    ...gameData,
    title: `${gameData.title} - 최고 기록에 도전하세요!`
  })

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: '홈', url: '/' },
    { name: '게임', url: '/games' },
    { name: '클릭 스피드', url: '/games/click-speed' }
  ])

  const gameStructuredData = generateGameStructuredData('click-speed')

  return (
    <>
      <SEOHead
        {...seoProps}
        breadcrumbs={breadcrumbData}
        structuredData={gameStructuredData}
      />

      <Navbar 
        isLoggedIn={true}
        username="DemoUser"
        points={points}
        onLogin={() => {}}
        onLogout={() => {}}
      />

      <ClickSpeedGame 
        onGameEnd={handleGameEnd}
        onPointsEarned={handlePointsEarned}
        gameDuration={10}
      />
    </>
  )
}