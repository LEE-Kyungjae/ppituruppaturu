// frontend/src/components/shop/PointsShop.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pointApi, authApi } from '@/services/api'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  type: 'avatar' | 'theme' | 'powerup' | 'premium' | 'game_currency'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  owned?: boolean
  discount?: number
  isPopular?: boolean
  isNew?: boolean
}

interface PointsShopProps {
  userPoints: number
  onPurchase?: (item: ShopItem) => void
  onPointsChange?: (newPoints: number) => void
}

const PointsShop: React.FC<PointsShopProps> = ({
  userPoints,
  onPurchase,
  onPointsChange
}) => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: '전체', icon: '🏪' },
    { id: 'avatar', name: '아바타', icon: '👤' },
    { id: 'theme', name: '테마', icon: '🎨' },
    { id: 'powerup', name: '부스터', icon: '⚡' },
    { id: 'premium', name: '프리미엄', icon: '💎' },
    { id: 'game_currency', name: '게임머니', icon: '🪙' }
  ]

  // 샵 아이템 초기 데이터
  useEffect(() => {
    const mockShopItems: ShopItem[] = [
      // 아바타 아이템
      {
        id: 'avatar_robot',
        name: '로봇 아바타',
        description: '미래형 로봇 아바타로 게임을 즐겨보세요!',
        price: 500,
        type: 'avatar',
        icon: '🤖',
        rarity: 'common'
      },
      {
        id: 'avatar_ninja',
        name: '닌자 아바타',
        description: '신비로운 닌자 아바타입니다.',
        price: 800,
        type: 'avatar',
        icon: '🥷',
        rarity: 'rare',
        isPopular: true
      },
      {
        id: 'avatar_wizard',
        name: '마법사 아바타',
        description: '강력한 마법사 아바타로 특별함을 느껴보세요!',
        price: 1200,
        type: 'avatar',
        icon: '🧙‍♂️',
        rarity: 'epic'
      },

      // 테마 아이템
      {
        id: 'theme_dark',
        name: '다크 테마',
        description: '세련된 다크 모드 테마입니다.',
        price: 300,
        type: 'theme',
        icon: '🌙',
        rarity: 'common'
      },
      {
        id: 'theme_neon',
        name: '네온 테마',
        description: '화려한 네온 스타일 테마입니다.',
        price: 600,
        type: 'theme',
        icon: '🌈',
        rarity: 'rare',
        isNew: true
      },
      {
        id: 'theme_galaxy',
        name: '갤럭시 테마',
        description: '우주를 테마로 한 환상적인 테마입니다.',
        price: 1000,
        type: 'theme',
        icon: '🌌',
        rarity: 'epic'
      },

      // 부스터 아이템
      {
        id: 'powerup_2x_points',
        name: '2배 포인트 부스터',
        description: '30분간 획득 포인트가 2배가 됩니다.',
        price: 100,
        type: 'powerup',
        icon: '⚡',
        rarity: 'common',
        isPopular: true
      },
      {
        id: 'powerup_time_freeze',
        name: '시간 정지',
        description: '게임 시간을 5초간 정지시킵니다.',
        price: 150,
        type: 'powerup',
        icon: '⏰',
        rarity: 'rare'
      },
      {
        id: 'powerup_perfect_accuracy',
        name: '완벽한 정확도',
        description: '한 게임 동안 모든 클릭이 완벽해집니다.',
        price: 200,
        type: 'powerup',
        icon: '🎯',
        rarity: 'rare'
      },

      // 프리미엄 아이템
      {
        id: 'premium_monthly',
        name: '프리미엄 월간',
        description: '30일간 모든 혜택을 누리세요!',
        price: 2000,
        type: 'premium',
        icon: '👑',
        rarity: 'legendary',
        discount: 20
      },
      {
        id: 'premium_weekly',
        name: '프리미엄 주간',
        description: '7일간 프리미엄 혜택을 경험해보세요.',
        price: 600,
        type: 'premium',
        icon: '💎',
        rarity: 'epic'
      },

      // 게임 머니
      {
        id: 'currency_1000',
        name: '포인트 1,000개',
        description: '추가 포인트를 구매하세요.',
        price: 990, // 실제로는 현금 결제
        type: 'game_currency',
        icon: '🪙',
        rarity: 'common'
      },
      {
        id: 'currency_5000',
        name: '포인트 5,000개',
        description: '더 많은 포인트로 더 많은 혜택을!',
        price: 4900, // 할인된 가격
        type: 'game_currency',
        icon: '💰',
        rarity: 'rare',
        discount: 2
      }
    ]

    setShopItems(mockShopItems)
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'rare': return 'from-blue-500 to-blue-600'
      case 'epic': return 'from-purple-500 to-purple-600'
      case 'legendary': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500'
      case 'rare': return 'border-blue-500 shadow-blue-500/20'
      case 'epic': return 'border-purple-500 shadow-purple-500/20'
      case 'legendary': return 'border-yellow-500 shadow-yellow-500/30'
      default: return 'border-gray-500'
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.type === selectedCategory)

  const handlePurchase = async (item: ShopItem) => {
    if (userPoints < item.price && item.type !== 'game_currency') {
      // 포인트 부족
      return
    }

    setIsLoading(true)
    setPurchaseAnimation(item.id)

    try {
      // API 호출 (실제 구현 시)
      // await pointApi.purchaseItem(item.id)
      
      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (item.type === 'game_currency') {
        // 게임 머니는 실제 결제 처리
        // 실제로는 토스페이먼츠 API 호출
        console.log('Initiating payment for:', item.name)
      } else {
        // 포인트 아이템은 포인트 차감
        const newPoints = userPoints - item.price
        onPointsChange?.(newPoints)
        
        // 아이템 소유 상태 업데이트
        setShopItems(prev => prev.map(shopItem => 
          shopItem.id === item.id 
            ? { ...shopItem, owned: true }
            : shopItem
        ))
      }

      onPurchase?.(item)

    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setIsLoading(false)
      setPurchaseAnimation(null)
    }
  }

  const canPurchase = (item: ShopItem) => {
    if (item.owned) return false
    if (item.type === 'game_currency') return true // 현금 결제
    return userPoints >= item.price
  }

  const getPurchaseButtonText = (item: ShopItem) => {
    if (item.owned) return '보유중'
    if (item.type === 'game_currency') return '구매하기'
    if (userPoints < item.price) return '포인트 부족'
    return `${item.price.toLocaleString()}P 구매`
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <motion.h1
          className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🏪 포인트 상점
        </motion.h1>
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-2xl font-bold text-yellow-400">
            💰 {userPoints.toLocaleString()} 포인트
          </div>
          <div className="text-sm text-white/70">보유 포인트</div>
        </motion.div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
              ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: selectedCategory === category.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </motion.button>
        ))}
      </div>

      {/* 상품 그리드 */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        layout
      >
        <AnimatePresence mode="wait">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={`
                relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 transition-all duration-300
                ${getRarityBorder(item.rarity)} hover:shadow-2xl hover:scale-105
                ${item.owned ? 'opacity-75' : ''}
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              {/* 뱃지들 */}
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                {item.isNew && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    NEW
                  </div>
                )}
                {item.isPopular && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    HOT
                  </div>
                )}
                {item.discount && (
                  <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    -{item.discount}%
                  </div>
                )}
              </div>

              {/* 아이템 아이콘 */}
              <div className="text-center mb-4">
                <div className={`
                  w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${getRarityColor(item.rarity)}
                  flex items-center justify-center text-4xl mb-3 shadow-lg
                `}>
                  {item.icon}
                </div>
                <div className={`
                  inline-block px-3 py-1 rounded-full text-xs font-bold text-white
                  bg-gradient-to-r ${getRarityColor(item.rarity)}
                `}>
                  {item.rarity.toUpperCase()}
                </div>
              </div>

              {/* 아이템 정보 */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                <p className="text-sm text-white/70 mb-4">{item.description}</p>
                
                <div className="text-2xl font-bold text-yellow-400">
                  {item.type === 'game_currency' ? (
                    <span>₩{(item.price / 100).toLocaleString()}</span>
                  ) : (
                    <span>{item.price.toLocaleString()}P</span>
                  )}
                </div>
              </div>

              {/* 구매 버튼 */}
              <motion.button
                onClick={() => handlePurchase(item)}
                disabled={!canPurchase(item) || isLoading}
                className={`
                  w-full py-3 rounded-xl font-bold transition-all
                  ${item.owned
                    ? 'bg-green-600 text-white cursor-default'
                    : canPurchase(item)
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
                whileHover={canPurchase(item) && !item.owned ? { scale: 1.02 } : {}}
                whileTap={canPurchase(item) && !item.owned ? { scale: 0.98 } : {}}
                animate={purchaseAnimation === item.id ? { scale: [1, 1.1, 1] } : {}}
              >
                {isLoading && purchaseAnimation === item.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    처리중...
                  </div>
                ) : (
                  getPurchaseButtonText(item)
                )}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 빈 상태 */}
      {filteredItems.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🛒</div>
          <div className="text-xl text-white/60 mb-2">해당 카테고리에 상품이 없습니다</div>
          <div className="text-sm text-white/40">다른 카테고리를 선택해보세요!</div>
        </motion.div>
      )}
    </div>
  )
}

export default PointsShop