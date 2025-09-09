// frontend/src/components/shop/EnhancedShop.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentService, formatPrice } from '@/services/payment'

interface ShopItem {
  id: string
  name: string
  description: string
  pointPrice?: number // 포인트로 구매 가능
  cashPrice?: number // 현금으로 구매 가능
  type: 'avatar' | 'theme' | 'powerup' | 'premium' | 'game_currency' | 'exclusive'
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  owned?: boolean
  discount?: number
  isPopular?: boolean
  isNew?: boolean
  isExclusive?: boolean // 현금 전용
  isPremiumOnly?: boolean // 프리미엄 전용
  category: 'points' | 'cash' | 'both'
}

interface EnhancedShopProps {
  userPoints: number
  userCash?: number // 사용자 현금 잔액 (충전된 금액)
  isPremium?: boolean
  onPurchase?: (item: ShopItem, paymentMethod: 'points' | 'cash') => void
  onPointsChange?: (newPoints: number) => void
}

const EnhancedShop: React.FC<EnhancedShopProps> = ({
  userPoints,
  userCash = 0,
  isPremium = false,
  onPurchase,
  onPointsChange
}) => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPaymentType, setSelectedPaymentType] = useState<'all' | 'points' | 'cash'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState<{
    item: ShopItem
    show: boolean
  }>({ item: null as any, show: false })

  const categories = [
    { id: 'all', name: '전체', icon: '🏪' },
    { id: 'avatar', name: '아바타', icon: '👤' },
    { id: 'theme', name: '테마', icon: '🎨' },
    { id: 'powerup', name: '부스터', icon: '⚡' },
    { id: 'exclusive', name: '독점 상품', icon: '💎' },
    { id: 'game_currency', name: '게임머니', icon: '🪙' }
  ]

  const paymentTypeFilters = [
    { id: 'all', name: '전체', icon: '💳' },
    { id: 'points', name: '포인트', icon: '🪙' },
    { id: 'cash', name: '현금', icon: '💰' }
  ]

  // 샵 아이템 초기 데이터
  useEffect(() => {
    const mockShopItems: ShopItem[] = [
      // 포인트 전용 아이템
      {
        id: 'avatar_basic_robot',
        name: '기본 로봇 아바타',
        description: '귀여운 로봇 아바타',
        pointPrice: 500,
        type: 'avatar',
        icon: '🤖',
        rarity: 'common',
        category: 'points'
      },
      {
        id: 'powerup_double_points',
        name: '포인트 2배 부스터',
        description: '30분간 포인트 획득량 2배',
        pointPrice: 200,
        type: 'powerup',
        icon: '⚡',
        rarity: 'common',
        category: 'points'
      },
      
      // 현금 전용 독점 아이템
      {
        id: 'avatar_premium_dragon',
        name: '드래곤 로드 아바타',
        description: '현금 전용 레전더리 아바타',
        cashPrice: 5900,
        type: 'exclusive',
        icon: '🐉',
        rarity: 'legendary',
        category: 'cash',
        isExclusive: true,
        isNew: true
      },
      {
        id: 'theme_premium_galaxy',
        name: '갤럭시 프리미엄 테마',
        description: '현금 전용 독점 테마',
        cashPrice: 3900,
        type: 'exclusive',
        icon: '🌌',
        rarity: 'epic',
        category: 'cash',
        isExclusive: true
      },
      
      // 현금과 포인트 모두 가능
      {
        id: 'avatar_ninja',
        name: '닌자 아바타',
        description: '멋진 닌자 아바타 (포인트/현금 구매 가능)',
        pointPrice: 1500,
        cashPrice: 1900,
        type: 'avatar',
        icon: '🥷',
        rarity: 'rare',
        category: 'both',
        isPopular: true
      },
      {
        id: 'theme_neon',
        name: '네온 시티 테마',
        description: '화려한 네온 테마 (포인트/현금 구매 가능)',
        pointPrice: 800,
        cashPrice: 1200,
        type: 'theme',
        icon: '🌃',
        rarity: 'rare',
        category: 'both'
      },
      
      // 프리미엄 전용
      {
        id: 'avatar_premium_crown',
        name: '황금 왕관 아바타',
        description: '프리미엄 회원 전용',
        pointPrice: 100,
        type: 'exclusive',
        icon: '👑',
        rarity: 'legendary',
        category: 'points',
        isPremiumOnly: true
      },
      
      // 게임 머니
      {
        id: 'currency_1000',
        name: '게임머니 1,000원',
        description: '게임 내 화폐 충전',
        cashPrice: 1000,
        type: 'game_currency',
        icon: '💰',
        rarity: 'common',
        category: 'cash'
      },
      {
        id: 'currency_5000',
        name: '게임머니 5,000원',
        description: '게임 내 화폐 충전 (5% 보너스)',
        cashPrice: 4750,
        type: 'game_currency',
        icon: '💎',
        rarity: 'common',
        category: 'cash',
        discount: 5
      }
    ]

    setShopItems(mockShopItems)
  }, [])

  // 필터링된 아이템
  const filteredItems = shopItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.type === selectedCategory
    const paymentMatch = selectedPaymentType === 'all' || 
      (selectedPaymentType === 'points' && item.pointPrice) ||
      (selectedPaymentType === 'cash' && item.cashPrice) ||
      item.category === selectedPaymentType
    
    const premiumMatch = !item.isPremiumOnly || isPremium
    
    return categoryMatch && paymentMatch && premiumMatch
  })

  // 구매 처리
  const handlePurchase = async (item: ShopItem, paymentMethod: 'points' | 'cash') => {
    if (paymentMethod === 'points' && (!item.pointPrice || userPoints < item.pointPrice)) {
      alert('포인트가 부족합니다!')
      return
    }
    
    if (paymentMethod === 'cash' && (!item.cashPrice || userCash < item.cashPrice)) {
      alert('현금 잔액이 부족합니다!')
      return
    }

    setIsLoading(true)
    setPurchaseAnimation(item.id)

    try {
      if (paymentMethod === 'cash' && item.cashPrice) {
        // 현금 결제 처리
        const success = await paymentService.processItemPurchase({
          itemId: item.id,
          itemName: item.name,
          amount: item.cashPrice,
          paymentMethod: 'card' // 또는 다른 결제 수단
        })
        
        if (!success) {
          throw new Error('결제 처리 실패')
        }
      }

      // 아이템 소유 상태 업데이트
      setShopItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, owned: true } : i
      ))

      onPurchase?.(item, paymentMethod)
      setShowPurchaseModal({ item: null as any, show: false })
      
      // 성공 애니메이션 표시
      setTimeout(() => {
        setPurchaseAnimation(null)
      }, 2000)

    } catch (error) {
      alert('구매에 실패했습니다. 다시 시도해 주세요.')
      setPurchaseAnimation(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 구매 가능 여부 확인
  const canPurchase = (item: ShopItem, method: 'points' | 'cash') => {
    if (item.owned) return false
    if (item.isPremiumOnly && !isPremium) return false
    
    if (method === 'points') {
      return item.pointPrice && userPoints >= item.pointPrice
    } else {
      return item.cashPrice && userCash >= item.cashPrice
    }
  }

  // 희귀도별 스타일
  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-500 bg-yellow-500/10 shadow-yellow-500/25'
      case 'epic':
        return 'border-purple-500 bg-purple-500/10 shadow-purple-500/25'
      case 'rare':
        return 'border-blue-500 bg-blue-500/10 shadow-blue-500/25'
      default:
        return 'border-gray-500 bg-gray-500/10 shadow-gray-500/25'
    }
  }

  return (
    <div className="space-y-6">
      {/* 잔액 표시 */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">내 잔액</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {userPoints.toLocaleString()}
            </div>
            <div className="text-white/70">포인트</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatPrice(userCash)}
            </div>
            <div className="text-white/70">현금 잔액</div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="space-y-4">
        {/* 카테고리 필터 */}
        <div>
          <h4 className="text-white font-medium mb-2">카테고리</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 결제 방식 필터 */}
        <div>
          <h4 className="text-white font-medium mb-2">결제 방식</h4>
          <div className="flex flex-wrap gap-2">
            {paymentTypeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedPaymentType(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedPaymentType === filter.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              className={`relative bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 shadow-lg ${getRarityStyle(item.rarity)} ${
                item.owned ? 'opacity-60' : ''
              } ${purchaseAnimation === item.id ? 'animate-pulse' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* 배지들 */}
              <div className="absolute -top-2 -right-2 flex gap-2">
                {item.isNew && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {item.isPopular && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    인기
                  </span>
                )}
                {item.isExclusive && (
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                    독점
                  </span>
                )}
                {item.isPremiumOnly && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    프리미엄
                  </span>
                )}
              </div>

              {item.owned && (
                <div className="absolute top-4 left-4">
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">
                    ✓ 보유중
                  </span>
                </div>
              )}

              {/* 아이템 정보 */}
              <div className="text-center mb-4 pt-8">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                <p className="text-white/70 text-sm">{item.description}</p>
                <div className="text-purple-400 text-xs mt-2 font-medium uppercase">
                  {item.rarity}
                </div>
              </div>

              {/* 가격 및 구매 버튼 */}
              <div className="space-y-3">
                {item.pointPrice && (
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-400 font-bold">
                      {item.pointPrice.toLocaleString()} 포인트
                    </div>
                    <button
                      onClick={() => !item.owned && handlePurchase(item, 'points')}
                      disabled={item.owned || !canPurchase(item, 'points') || isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        item.owned
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : canPurchase(item, 'points')
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {item.owned ? '보유중' : canPurchase(item, 'points') ? '구매' : '포인트 부족'}
                    </button>
                  </div>
                )}

                {item.cashPrice && (
                  <div className="flex items-center justify-between">
                    <div className="text-green-400 font-bold">
                      {formatPrice(item.cashPrice)}
                      {item.discount && (
                        <span className="ml-2 text-red-400 text-sm">
                          {item.discount}% 할인
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => !item.owned && setShowPurchaseModal({ item, show: true })}
                      disabled={item.owned || isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        item.owned
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {item.owned ? '보유중' : '현금 구매'}
                    </button>
                  </div>
                )}

                {!item.pointPrice && !item.cashPrice && (
                  <div className="text-center text-white/60">
                    가격 정보 없음
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 현금 결제 확인 모달 */}
      <AnimatePresence>
        {showPurchaseModal.show && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">현금 구매 확인</h3>
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{showPurchaseModal.item?.icon}</div>
                <div className="text-white font-medium">{showPurchaseModal.item?.name}</div>
                <div className="text-green-400 font-bold text-xl mt-2">
                  {showPurchaseModal.item?.cashPrice && formatPrice(showPurchaseModal.item.cashPrice)}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseModal({ item: null as any, show: false })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl"
                >
                  취소
                </button>
                <button
                  onClick={() => handlePurchase(showPurchaseModal.item, 'cash')}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
                >
                  {isLoading ? '처리중...' : '구매 확인'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-white/60">
          <div className="text-6xl mb-4">🛍️</div>
          <div>조건에 맞는 상품이 없습니다.</div>
        </div>
      )}
    </div>
  )
}

export default EnhancedShop