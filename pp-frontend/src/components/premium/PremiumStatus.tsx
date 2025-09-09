// frontend/src/components/premium/PremiumStatus.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PremiumBenefit {
  id: string
  name: string
  description: string
  icon: string
  active: boolean
}

interface PremiumStatusProps {
  isPremium: boolean
  premiumType?: 'weekly' | 'monthly' | 'yearly'
  expiryDate?: Date
  onUpgrade?: () => void
  className?: string
}

const PremiumStatus: React.FC<PremiumStatusProps> = ({
  isPremium,
  premiumType,
  expiryDate,
  onUpgrade,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
  }>({ days: 0, hours: 0, minutes: 0 })

  const benefits: PremiumBenefit[] = [
    {
      id: 'points_multiplier',
      name: '포인트 획득량 증가',
      description: isPremium 
        ? `${premiumType === 'yearly' ? '5배' : premiumType === 'monthly' ? '3배' : '2배'} 포인트 획득`
        : '포인트 획득량 2-5배 증가',
      icon: '💰',
      active: isPremium
    },
    {
      id: 'no_ads',
      name: '광고 제거',
      description: '모든 광고 완전 제거',
      icon: '🚫',
      active: isPremium
    },
    {
      id: 'exclusive_content',
      name: '독점 콘텐츠',
      description: '프리미엄 전용 아바타 및 테마',
      icon: '👑',
      active: isPremium
    },
    {
      id: 'priority_support',
      name: '우선 지원',
      description: '24/7 우선 고객 지원',
      icon: '🎧',
      active: isPremium
    },
    {
      id: 'exclusive_games',
      name: '프리미엄 게임',
      description: '프리미엄 전용 게임 모드',
      icon: '🎮',
      active: isPremium && (premiumType === 'monthly' || premiumType === 'yearly')
    },
    {
      id: 'leaderboard',
      name: 'VIP 리더보드',
      description: '프리미엄 사용자 전용 리더보드',
      icon: '🏆',
      active: isPremium && premiumType === 'yearly'
    }
  ]

  // 남은 시간 계산
  useEffect(() => {
    if (!isPremium || !expiryDate) return

    const interval = setInterval(() => {
      const now = new Date()
      const timeDiff = expiryDate.getTime() - now.getTime()

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

        setTimeLeft({ days, hours, minutes })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 })
      }
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(interval)
  }, [isPremium, expiryDate])

  const getPremiumBadge = () => {
    if (!isPremium) return null

    const badgeConfig = {
      weekly: { color: 'from-blue-500 to-cyan-500', text: 'WEEKLY' },
      monthly: { color: 'from-purple-500 to-pink-500', text: 'MONTHLY' },
      yearly: { color: 'from-yellow-500 to-orange-500', text: 'YEARLY' }
    }

    const config = badgeConfig[premiumType || 'monthly']

    return (
      <motion.div
        className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.color} text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg`}
        animate={{ 
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 20px rgba(255,215,0,0.3)',
            '0 0 30px rgba(255,215,0,0.6)',
            '0 0 20px rgba(255,215,0,0.3)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>👑</span>
        <span>PREMIUM {config.text}</span>
      </motion.div>
    )
  }

  const getUpgradeMessage = () => {
    if (isPremium) return null

    return (
      <motion.div
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-xl font-bold text-white mb-2">프리미엄으로 업그레이드하세요!</h3>
        <p className="text-white/70 mb-4">더 많은 혜택과 특별한 기능을 경험해보세요</p>
        
        <motion.button
          onClick={onUpgrade}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          프리미엄 구매하기
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 프리미엄 상태 헤더 */}
      <div className="text-center">
        {isPremium ? (
          <div className="space-y-4">
            {getPremiumBadge()}
            
            {expiryDate && (
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-white/70 text-sm mb-2">프리미엄 만료까지</div>
                <div className="text-2xl font-bold text-white">
                  {timeLeft.days > 0 && `${timeLeft.days}일 `}
                  {timeLeft.hours}시간 {timeLeft.minutes}분
                </div>
                
                {timeLeft.days < 7 && (
                  <motion.div
                    className="mt-3 text-yellow-400 text-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⚠️ 프리미엄 만료가 임박했습니다
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-white">프리미엄 혜택</h2>
        )}
      </div>

      {/* 혜택 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.id}
            className={`
              bg-white/10 backdrop-blur-md rounded-xl p-4 border-2 transition-all
              ${benefit.active 
                ? 'border-green-500/50 bg-green-500/10' 
                : 'border-white/20 hover:border-white/30'
              }
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start gap-3">
              <div className={`
                text-2xl p-2 rounded-lg
                ${benefit.active 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
                }
              `}>
                {benefit.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">{benefit.name}</h4>
                  {benefit.active && (
                    <span className="text-green-400 text-sm font-medium">활성</span>
                  )}
                </div>
                <p className={`text-sm ${benefit.active ? 'text-white/80' : 'text-white/60'}`}>
                  {benefit.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 업그레이드 메시지 */}
      {getUpgradeMessage()}

      {/* 통계 (프리미엄 사용자용) */}
      {isPremium && (
        <motion.div
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📊 프리미엄 혜택 통계
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">+250%</div>
              <div className="text-white/70 text-sm">추가 포인트</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">47</div>
              <div className="text-white/70 text-sm">제거된 광고</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">12</div>
              <div className="text-white/70 text-sm">독점 아이템</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">24/7</div>
              <div className="text-white/70 text-sm">우선 지원</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PremiumStatus