// frontend/src/components/monetization/CustomizationShop.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShopItem {
  id: string
  name: string
  description: string
  type: 'avatar' | 'frame' | 'background' | 'effect' | 'title' | 'badge'
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  price: {
    points?: number
    cash?: number // in KRW
  }
  preview: string
  isLimited?: boolean
  limitedUntil?: Date
  requirements?: string[]
  bundle?: boolean
  bundleItems?: string[]
  discount?: number
}

interface GachaBox {
  id: string
  name: string
  description: string
  price: {
    points: number
    cash: number
  }
  preview: string
  items: Array<{
    item: ShopItem
    probability: number
  }>
  guaranteedRarity: 'rare' | 'epic' | 'legendary'
  guaranteedAfter: number
}

interface SeasonPass {
  id: string
  season: number
  name: string
  description: string
  price: {
    free: boolean
    premium: number
  }
  duration: {
    start: Date
    end: Date
  }
  levels: Array<{
    level: number
    expRequired: number
    freeReward?: ShopItem
    premiumReward?: ShopItem
  }>
  currentLevel: number
  currentExp: number
}

const SHOP_ITEMS: ShopItem[] = [
  // Avatar Frames
  {
    id: 'frame_neon_pulse',
    name: '네온 펄스 프레임',
    description: '살아있는듯 움직이는 네온 효과가 있는 프레임',
    type: 'frame',
    rarity: 'epic',
    price: { points: 800, cash: 4900 },
    preview: '🌈'
  },
  {
    id: 'frame_dragon_scale',
    name: '드래곤 스케일 프레임',
    description: '용의 비늘처럼 빛나는 신화급 프레임',
    type: 'frame',
    rarity: 'mythic',
    price: { cash: 12900 },
    preview: '🐉'
  },
  // Backgrounds
  {
    id: 'bg_space_odyssey',
    name: '스페이스 오디세이',
    description: '별들이 움직이는 우주 배경',
    type: 'background',
    rarity: 'legendary',
    price: { points: 1500, cash: 7900 },
    preview: '🌌'
  },
  // Special Effects
  {
    id: 'effect_lightning_storm',
    name: '번개 폭풍',
    description: '프로필 주위로 번개가 치는 효과',
    type: 'effect',
    rarity: 'legendary',
    price: { points: 1200, cash: 6900 },
    preview: '⚡'
  },
  // Limited Time Items
  {
    id: 'title_winter_champion',
    name: '윈터 챔피언',
    description: '겨울 시즌 한정 타이틀',
    type: 'title',
    rarity: 'legendary',
    price: { points: 2000, cash: 9900 },
    preview: '❄️',
    isLimited: true,
    limitedUntil: new Date('2024-12-31')
  },
  // Bundles
  {
    id: 'bundle_neon_set',
    name: '네온 컬렉션 번들',
    description: '네온 프레임, 배경, 효과가 포함된 세트',
    type: 'frame',
    rarity: 'epic',
    price: { points: 2000, cash: 9900 },
    preview: '🎆',
    bundle: true,
    bundleItems: ['frame_neon_pulse', 'bg_neon_city', 'effect_neon_glow'],
    discount: 30
  }
]

const resolveShopItem = (index: number): ShopItem => {
  const item = SHOP_ITEMS[index];
  if (!item) {
    const fallback = SHOP_ITEMS[0];
    if (!fallback) {
      throw new Error('No shop items available');
    }
    return fallback;
  }
  return item;
}

const GACHA_BOXES: GachaBox[] = [
  {
    id: 'mystery_box_basic',
    name: '미스터리 박스 (베이직)',
    description: '다양한 꾸미기 아이템이 들어있는 박스',
    price: { points: 300, cash: 1500 },
    preview: '📦',
    items: [
      { item: resolveShopItem(0), probability: 5 },
      { item: resolveShopItem(1), probability: 1 },
      { item: resolveShopItem(2), probability: 3 }
    ],
    guaranteedRarity: 'rare',
    guaranteedAfter: 10
  },
  {
    id: 'mystery_box_premium',
    name: '프리미엄 미스터리 박스',
    description: '높은 확률로 레어 아이템을 획득할 수 있는 박스',
    price: { points: 800, cash: 3900 },
    preview: '🎁',
    items: [
      { item: resolveShopItem(0), probability: 15 },
      { item: resolveShopItem(1), probability: 5 },
      { item: resolveShopItem(2), probability: 10 }
    ],
    guaranteedRarity: 'epic',
    guaranteedAfter: 5
  }
]

const CURRENT_SEASON: SeasonPass = {
  id: 'season_4_neon_nights',
  season: 4,
  name: '네온 나이트 시즌',
  description: '미래 도시를 배경으로 한 사이버펑크 시즌',
  price: { free: true, premium: 4900 },
  duration: {
    start: new Date('2024-09-01'),
    end: new Date('2024-11-30')
  },
  levels: Array.from({ length: 50 }, (_, i) => ({
    level: i + 1,
    expRequired: (i + 1) * 1000,
    freeReward: i % 5 === 0 ? resolveShopItem(0) : undefined,
    premiumReward: i % 3 === 0 ? resolveShopItem(1) : undefined
  })),
  currentLevel: 12,
  currentExp: 8500
}

export const CustomizationShop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shop' | 'gacha' | 'seasonpass' | 'vip'>('shop')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'frame' | 'background' | 'effect' | 'title'>('all')
  const [userPoints, setUserPoints] = useState(15420)
  const [userPremium, setUserPremium] = useState(false)
  const [ownedItems, setOwnedItems] = useState<string[]>(['frame_basic'])
  const [cartItems, setCartItems] = useState<string[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState<ShopItem | null>(null)
  const [showGachaResult, setShowGachaResult] = useState<ShopItem | null>(null)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return { bg: 'from-gray-400 to-gray-600', text: 'text-gray-300', border: 'border-gray-400' }
      case 'rare': return { bg: 'from-blue-400 to-blue-600', text: 'text-blue-300', border: 'border-blue-400' }
      case 'epic': return { bg: 'from-purple-400 to-purple-600', text: 'text-purple-300', border: 'border-purple-400' }
      case 'legendary': return { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-300', border: 'border-yellow-400' }
      case 'mythic': return { bg: 'from-pink-400 to-red-500', text: 'text-pink-300', border: 'border-pink-400' }
      default: return { bg: 'from-gray-400 to-gray-600', text: 'text-gray-300', border: 'border-gray-400' }
    }
  }

  const filteredItems = SHOP_ITEMS.filter(item => 
    selectedCategory === 'all' || item.type === selectedCategory
  )

  const purchaseItem = (item: ShopItem, paymentMethod: 'points' | 'cash') => {
    if (paymentMethod === 'points') {
      const pointCost = item.price.points
      if (typeof pointCost === 'number' && userPoints >= pointCost) {
        setUserPoints(prev => prev - pointCost)
        setOwnedItems(prev => [...prev, item.id])
      }
    }
    setShowPurchaseModal(null)
  }

  const openGachaBox = (gachaBox: GachaBox, paymentMethod: 'points' | 'cash') => {
    if (paymentMethod === 'points') {
      const pointsCost = gachaBox.price.points
      if (typeof pointsCost === 'number' && userPoints >= pointsCost) {
        setUserPoints(prev => prev - pointsCost)
        
        // Simulate gacha result
        const selectedEntry = gachaBox.items[Math.floor(Math.random() * gachaBox.items.length)]
        const randomItem = selectedEntry?.item ?? resolveShopItem(0)
        setOwnedItems(prev => [...prev, randomItem.id])
        setShowGachaResult(randomItem)
        
        setTimeout(() => setShowGachaResult(null), 3000)
      }
    }
  }

  // Shop Tab
  const ShopTab: React.FC = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'all', name: '전체', icon: '🛍️' },
          { id: 'frame', name: '프레임', icon: '🖼️' },
          { id: 'background', name: '배경', icon: '🌅' },
          { id: 'effect', name: '효과', icon: '✨' },
          { id: 'title', name: '타이틀', icon: '🏷️' }
        ].map(category => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id as any)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {category.icon} {category.name}
          </motion.button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => {
          const rarity = getRarityColor(item.rarity)
          const isOwned = ownedItems.includes(item.id)
          const isLimited = item.isLimited && item.limitedUntil && new Date() < item.limitedUntil
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`card-game relative overflow-hidden border-2 ${rarity.border} ${
                isOwned ? 'opacity-75' : ''
              }`}
            >
              {isLimited && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  한정
                </div>
              )}
              
              {item.bundle && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-bold">
                  번들 -{item.discount}%
                </div>
              )}

              <div className="text-center p-4">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${rarity.bg} rounded-full flex items-center justify-center text-3xl`}>
                  {item.preview}
                </div>
                
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${rarity.text} bg-white/10`}>
                  {item.rarity.toUpperCase()}
                </div>

                {isOwned ? (
                  <div className="text-green-400 font-bold">보유 중</div>
                ) : (
                  <div className="space-y-2">
                    {item.price.points && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPurchaseModal(item)}
                        className="w-full btn-primary text-sm py-2"
                        disabled={userPoints < item.price.points}
                      >
                        💎 {item.price.points.toLocaleString()} 포인트
                      </motion.button>
                    )}
                    
                    {item.price.cash && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPurchaseModal(item)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl text-sm"
                      >
                        💳 ₩{item.price.cash.toLocaleString()}
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  // Gacha Tab
  const GachaTab: React.FC = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">🎰 미스터리 박스</h2>
        <p className="text-gray-400">행운을 시험해보세요! 레어한 아이템을 획득할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {GACHA_BOXES.map(gachaBox => (
          <motion.div
            key={gachaBox.id}
            whileHover={{ scale: 1.02 }}
            className="card-game border-2 border-purple-500"
          >
            <div className="text-center p-6">
              <div className="text-6xl mb-4">{gachaBox.preview}</div>
              <h3 className="text-xl font-bold mb-2">{gachaBox.name}</h3>
              <p className="text-gray-400 mb-4">{gachaBox.description}</p>
              
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">포함 아이템</h4>
                <div className="space-y-1 text-sm">
                  {gachaBox.items.map((gachaItem, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{gachaItem.item.name}</span>
                      <span className="text-yellow-400">{gachaItem.probability}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-green-400">
                  {gachaBox.guaranteedAfter}번째마다 {gachaBox.guaranteedRarity.toUpperCase()} 등급 이상 보장
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openGachaBox(gachaBox, 'points')}
                  className="w-full btn-primary"
                  disabled={userPoints < gachaBox.price.points}
                >
                  💎 {gachaBox.price.points} 포인트로 열기
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openGachaBox(gachaBox, 'cash')}
                  className="w-full btn-success"
                >
                  💳 ₩{gachaBox.price.cash.toLocaleString()}로 열기
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Season Pass Tab
  const SeasonPassTab: React.FC = () => {
    const progressPercent = (CURRENT_SEASON.currentExp / (CURRENT_SEASON.currentLevel * 1000)) * 100
    
    return (
      <div className="space-y-6">
        <div className="card-game">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">🌆</div>
            <div>
              <h2 className="text-2xl font-bold">{CURRENT_SEASON.name}</h2>
              <p className="text-gray-400">{CURRENT_SEASON.description}</p>
              <p className="text-sm text-gray-500">
                {CURRENT_SEASON.duration.end.toLocaleDateString()}까지
              </p>
            </div>
            {!userPremium && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-auto btn-success px-6 py-3"
              >
                프리미엄 구매 ₩{CURRENT_SEASON.price.premium.toLocaleString()}
              </motion.button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">레벨 {CURRENT_SEASON.currentLevel}</span>
              <span className="text-sm text-gray-400">
                {CURRENT_SEASON.currentExp.toLocaleString()} / {(CURRENT_SEASON.currentLevel * 1000).toLocaleString()} XP
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                transition={{ duration: 1.5 }}
              />
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {CURRENT_SEASON.levels.slice(0, 20).map(level => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: level.level * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  level.level <= CURRENT_SEASON.currentLevel 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-600 bg-gray-600/10'
                }`}
              >
                <div className="text-center min-w-16">
                  <div className="font-bold text-lg">{level.level}</div>
                  <div className="text-xs text-gray-400">레벨</div>
                </div>

                {/* Free Reward */}
                <div className="flex-1 text-center">
                  {level.freeReward ? (
                    <div className={`p-3 rounded-lg ${level.level <= CURRENT_SEASON.currentLevel ? 'bg-green-500/20' : 'bg-gray-600/20'}`}>
                      <div className="text-2xl mb-1">{level.freeReward.preview}</div>
                      <div className="text-sm font-semibold">{level.freeReward.name}</div>
                      <div className="text-xs text-gray-400">무료</div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-gray-600/20">
                      <div className="text-gray-500 text-sm">보상 없음</div>
                    </div>
                  )}
                </div>

                {/* Premium Reward */}
                <div className="flex-1 text-center">
                  {level.premiumReward ? (
                    <div className={`p-3 rounded-lg border-2 border-yellow-400 ${
                      level.level <= CURRENT_SEASON.currentLevel && userPremium 
                        ? 'bg-yellow-400/20' 
                        : 'bg-gray-600/20'
                    }`}>
                      <div className="text-2xl mb-1">{level.premiumReward.preview}</div>
                      <div className="text-sm font-semibold">{level.premiumReward.name}</div>
                      <div className="text-xs text-yellow-400">프리미엄</div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-gray-600/20">
                      <div className="text-gray-500 text-sm">보상 없음</div>
                    </div>
                  )}
                </div>

                {level.level <= CURRENT_SEASON.currentLevel && (
                  <div className="text-green-400 font-bold">✓</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // VIP Tab
  const VipTab: React.FC = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
          👑 VIP 멤버십
        </h2>
        <p className="text-gray-400">특별한 혜택과 독점 콘텐츠를 누려보세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VIP Tiers */}
        {[
          {
            tier: 'Silver',
            price: 4900,
            color: 'from-gray-400 to-gray-600',
            benefits: ['일일 포인트 +50%', '상점 할인 10%', '실버 배지', '우선 채팅']
          },
          {
            tier: 'Gold',
            price: 9900,
            color: 'from-yellow-400 to-yellow-600',
            benefits: ['일일 포인트 +100%', '상점 할인 20%', '골드 배지', '독점 아바타', '우선 매칭']
          },
          {
            tier: 'Diamond',
            price: 19900,
            color: 'from-blue-400 to-blue-600',
            benefits: ['일일 포인트 +200%', '상점 할인 30%', '다이아 배지', '독점 콘텐츠', '개인 통계', 'VIP 채널']
          }
        ].map(vip => (
          <motion.div
            key={vip.tier}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`card-game border-2 border-transparent bg-gradient-to-br ${vip.color} p-1`}
          >
            <div className="bg-gray-900 rounded-xl p-6 h-full">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{vip.tier} VIP</h3>
                <div className="text-3xl font-bold text-white">
                  ₩{vip.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">월 구독</div>
              </div>

              <div className="space-y-3 mb-8">
                {vip.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-green-400">✓</div>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full bg-gradient-to-r ${vip.color} hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all`}
              >
                구독하기
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="game-container min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Points */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🛍️ 커스터마이징 상점
          </h1>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-xl font-bold">
              💎 {userPoints.toLocaleString()} 포인트
            </div>
            {userPremium && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-2 rounded-xl font-bold">
                👑 VIP
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'shop', name: '상점', icon: '🛍️' },
            { id: 'gacha', name: '미스터리 박스', icon: '🎰' },
            { id: 'seasonpass', name: '시즌 패스', icon: '🎫' },
            { id: 'vip', name: 'VIP', icon: '👑' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.name}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'shop' && <ShopTab />}
            {activeTab === 'gacha' && <GachaTab />}
            {activeTab === 'seasonpass' && <SeasonPassTab />}
            {activeTab === 'vip' && <VipTab />}
          </motion.div>
        </AnimatePresence>

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowPurchaseModal(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="card-game max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center p-6">
                  <div className="text-4xl mb-4">{showPurchaseModal.preview}</div>
                  <h3 className="text-xl font-bold mb-2">{showPurchaseModal.name}</h3>
                  <p className="text-gray-400 mb-6">{showPurchaseModal.description}</p>
                  
                  <div className="space-y-3">
                    {showPurchaseModal.price.points && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => purchaseItem(showPurchaseModal, 'points')}
                        className="w-full btn-primary"
                        disabled={userPoints < showPurchaseModal.price.points}
                      >
                        💎 {showPurchaseModal.price.points.toLocaleString()} 포인트로 구매
                      </motion.button>
                    )}
                    
                    {showPurchaseModal.price.cash && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => purchaseItem(showPurchaseModal, 'cash')}
                        className="w-full btn-success"
                      >
                        💳 ₩{showPurchaseModal.price.cash.toLocaleString()}로 구매
                      </motion.button>
                    )}
                    
                    <button
                      onClick={() => setShowPurchaseModal(null)}
                      className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-xl transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gacha Result Modal */}
        <AnimatePresence>
          {showGachaResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="card-game max-w-md w-full mx-4"
              >
                <div className="text-center p-6">
                  <div className="text-6xl mb-4 animate-bounce">{showGachaResult.preview}</div>
                  <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold mb-4 ${
                    getRarityColor(showGachaResult.rarity).text
                  } bg-white/10`}>
                    {showGachaResult.rarity.toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{showGachaResult.name}</h3>
                  <p className="text-gray-400">축하합니다! 새로운 아이템을 획득했습니다!</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CustomizationShop
