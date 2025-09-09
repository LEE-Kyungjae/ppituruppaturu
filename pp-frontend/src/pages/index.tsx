// frontend/src/pages/index.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/layout/Navbar'
import GameDashboard from '../components/dashboard/GameDashboard'
import SocialLogin from '../components/auth/SocialLogin'
import SEOHead from '../components/SEOHead'
import { generateSEO, generateBreadcrumbStructuredData } from '../utils/seo'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [points, setPoints] = useState(1250)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 임시 로그인 상태 (실제로는 JWT 토큰으로 관리)
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setIsLoggedIn(true)
      setUsername(userData.username)
      setPoints(userData.points || 1250)
    }
  }, [])

  const handleLogin = () => {
    setShowLoginModal(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUsername('')
    setPoints(0)
  }

  const handleDemoLogin = () => {
    const demoUser = {
      username: 'DemoUser',
      points: 1250
    }
    localStorage.setItem('user', JSON.stringify(demoUser))
    setIsLoggedIn(true)
    setUsername(demoUser.username)
    setPoints(demoUser.points)
    setShowLoginModal(false)
  }

  // SEO 설정
  const seoProps = generateSEO({
    title: 'PittuRu Gaming Platform - 무료 미니게임',
    description: '5종 미니게임을 플레이하고 포인트를 획득하세요! 클릭 스피드, 메모리 매치, 숫자 맞추기 등 다양한 게임을 무료로 즐기세요.',
    keywords: ['무료게임', '미니게임', '브라우저게임', '포인트게임'],
    url: '/'
  })

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: '홈', url: '/' }
  ])

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PittuRu Gaming Platform",
    "alternateName": "피투루",
    "description": "무료 미니게임 플랫폼",
    "url": "https://ppituruppaturu.com",
    "logo": "https://ppituruppaturu.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Korean"]
    },
    "sameAs": [
      "https://github.com/pitturu"
    ]
  }

  return (
    <>
      <SEOHead
        {...seoProps}
        breadcrumbs={breadcrumbData}
        structuredData={organizationStructuredData}
      />

      <Navbar 
        isLoggedIn={isLoggedIn}
        username={username}
        points={points}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {isLoggedIn ? (
        <GameDashboard />
      ) : (
        <main className="min-h-screen bg-gradient-to-br from-flutter-blue-50 via-flutter-purple-50 to-flutter-gray-50 pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-flutter-blue-600 to-flutter-purple-600">
              🎮 PittuRu Gaming
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-flutter-gray-700">
              5종 미니게임 • 포인트 획득 • 실시간 순위
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl border border-flutter-gray-200">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-2 text-flutter-gray-800">클릭 스피드</h3>
                <p className="text-flutter-gray-600">10초 안에 최대한 많이 클릭!</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl border border-flutter-gray-200">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold mb-2 text-flutter-gray-800">메모리 매치</h3>
                <p className="text-flutter-gray-600">카드 짝을 맞춰 점수 획득!</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl border border-flutter-gray-200">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2 text-flutter-gray-800">숫자 맞추기</h3>
                <p className="text-flutter-gray-600">적은 시도로 숫자를 맞혀라!</p>
              </div>
            </div>

            <div className="space-y-6">
              <button 
                onClick={handleLogin}
                className="inline-block bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 px-8 py-4 rounded-full text-lg font-semibold text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:from-flutter-blue-600 hover:to-flutter-purple-600"
              >
                🚀 게임 시작하기
              </button>
              
              <div className="flex justify-center gap-4">
                <button className="bg-white/70 px-6 py-3 rounded-full hover:bg-white/90 transition-all duration-300 backdrop-blur-sm text-flutter-gray-700 hover:text-flutter-gray-900 shadow-md hover:shadow-lg border border-flutter-gray-200">
                  📊 순위표
                </button>
                <button className="bg-white/70 px-6 py-3 rounded-full hover:bg-white/90 transition-all duration-300 backdrop-blur-sm text-flutter-gray-700 hover:text-flutter-gray-900 shadow-md hover:shadow-lg border border-flutter-gray-200">
                  💰 포인트 상점
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl border border-flutter-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-flutter-gray-800">로그인</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-flutter-gray-400 hover:text-flutter-gray-600 text-2xl transition-colors duration-200"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <SocialLogin />
            </div>

            <div className="border-t border-flutter-gray-200 pt-4">
              <button
                onClick={handleDemoLogin}
                className="w-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:from-flutter-blue-600 hover:to-flutter-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🎮 데모 계정으로 체험하기
              </button>
              <p className="text-sm text-flutter-gray-500 mt-2 text-center">
                소셜 로그인 설정 전 데모 체험 가능
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}