// frontend/src/pages/shop.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PointsShop from '@/components/shop/PointsShop'
import EnhancedShop from '@/components/shop/EnhancedShop'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'
import Navbar from '@/components/layout/Navbar'
import { pointApi } from '@/services/api'
import { useRouter } from 'next/router'

interface ShopItem {
  id: string
  name: string
  description: string
  price?: number
  pointPrice?: number
  cashPrice?: number
  type: 'avatar' | 'theme' | 'powerup' | 'premium' | 'game_currency' | 'exclusive'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export default function Shop() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'shop' | 'subscription'>('shop')
  const [userPoints, setUserPoints] = useState(1250) // 임시 데이터
  const [userCash, setUserCash] = useState(15000) // 임시 데이터 (충전된 현금)
  const [isLoggedIn, setIsLoggedIn] = useState(true) // 임시 데이터
  const [username, setUsername] = useState('Player1') // 임시 데이터
  const [isPremium, setIsPremium] = useState(false) // 임시 데이터
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false)
  const [lastPurchasedItem, setLastPurchasedItem] = useState<ShopItem | null>(null)

  // 사용자 포인트 로드
  useEffect(() => {
    const loadUserPoints = async () => {
      try {
        // const balance = await pointApi.getBalance()
        // setUserPoints(balance.balance)
      } catch (error) {
        console.error('Failed to load user points:', error)
      }
    }

    if (isLoggedIn) {
      loadUserPoints()
    }
  }, [isLoggedIn])

  const handlePurchase = (item: ShopItem) => {
    setLastPurchasedItem(item)
    setShowPurchaseSuccess(true)
    
    // 3초 후 성공 메시지 숨김
    setTimeout(() => {
      setShowPurchaseSuccess(false)
    }, 3000)
  }

  const handlePointsChange = (newPoints: number) => {
    setUserPoints(newPoints)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navbar 
          isLoggedIn={isLoggedIn}
          username={username}
          points={userPoints}
        />
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-white mb-4">로그인이 필요합니다</h2>
            <p className="text-white/70 mb-6">상점을 이용하려면 로그인해주세요.</p>
            <motion.button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              로그인하기
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar 
        isLoggedIn={isLoggedIn}
        username={username}
        points={userPoints}
      />
      
      {/* 패딩으로 네비바 공간 확보 */}
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">🛒 게임 상점</h1>
            <p className="text-white/70">다양한 아이템과 프리미엄 혜택을 만나보세요!</p>
          </motion.div>

          {/* 탭 네비게이션 */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'shop'
                      ? 'bg-purple-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🛍️ 상점
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'subscription'
                      ? 'bg-purple-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  👑 구독 관리
                </button>
              </div>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'shop' ? (
              <EnhancedShop
                userPoints={userPoints}
                userCash={userCash}
                isPremium={isPremium}
                onPurchase={(item, method) => {
                  if (method === 'points') {
                    setUserPoints(prev => prev - (item.pointPrice || 0))
                  } else if (method === 'cash') {
                    setUserCash(prev => prev - (item.cashPrice || 0))
                  }
                  handlePurchase(item)
                }}
                onPointsChange={handlePointsChange}
              />
            ) : (
              <SubscriptionManager
                currentSubscription={isPremium ? {
                  id: 'sub_example',
                  type: 'monthly',
                  startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                  expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                  status: 'active',
                  autoRenew: true,
                  nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                  price: 9900,
                  paymentMethod: '신용카드'
                } : undefined}
                onSubscriptionChange={(subscription) => {
                  setIsPremium(!!subscription && subscription.status === 'active')
                }}
              />
            )}
          </motion.div>

          {/* 퀵 액세스 버튼들 */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
            <motion.button
              onClick={() => router.push('/payment/history')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="결제 내역"
            >
              📊
            </motion.button>
            <motion.button
              onClick={() => router.push('/settings')}
              className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="설정"
            >
              ⚙️
            </motion.button>
          </div>
        </div>
      </div>

      {/* 구매 성공 알림 */}
      {showPurchaseSuccess && lastPurchasedItem && (
        <motion.div
          className="fixed top-20 right-4 bg-green-500 text-white p-4 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{lastPurchasedItem.icon}</div>
            <div>
              <div className="font-bold">구매 완료!</div>
              <div className="text-sm opacity-90">{lastPurchasedItem.name}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 배경 파티클 효과 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}