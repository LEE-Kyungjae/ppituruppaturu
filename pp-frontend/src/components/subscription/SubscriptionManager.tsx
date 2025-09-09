// frontend/src/components/subscription/SubscriptionManager.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentService, PREMIUM_PACKAGES, formatPrice } from '@/services/payment'

interface Subscription {
  id: string
  type: 'weekly' | 'monthly' | 'yearly'
  startDate: Date
  expiryDate: Date
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  autoRenew: boolean
  nextBillingDate?: Date
  price: number
  paymentMethod: string
}

interface SubscriptionManagerProps {
  currentSubscription?: Subscription
  onSubscriptionChange?: (subscription: Subscription | null) => void
  className?: string
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  currentSubscription,
  onSubscriptionChange,
  className = ''
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(currentSubscription || null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 구독 상태 업데이트
  useEffect(() => {
    setSubscription(currentSubscription || null)
  }, [currentSubscription])

  // 남은 시간 계산
  const getTimeRemaining = () => {
    if (!subscription || subscription.status !== 'active') return null

    const now = new Date()
    const timeDiff = subscription.expiryDate.getTime() - now.getTime()
    
    if (timeDiff <= 0) return null

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return { days, hours }
  }

  // 구독 혜택 정보
  const getBenefits = (type: string) => {
    const packageInfo = PREMIUM_PACKAGES.find(pkg => pkg.type === type)
    return packageInfo?.features || []
  }

  // 구독 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10'
      case 'cancelled':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'expired':
        return 'text-red-400 bg-red-400/10'
      case 'pending':
        return 'text-blue-400 bg-blue-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'cancelled': return '해지됨'
      case 'expired': return '만료'
      case 'pending': return '대기중'
      default: return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'weekly': return '주간'
      case 'monthly': return '월간'
      case 'yearly': return '연간'
      default: return type
    }
  }

  // 구독 업그레이드/변경
  const handleSubscriptionChange = async (packageId: string) => {
    if (!packageId) return

    setIsLoading(true)
    try {
      const success = await paymentService.subscribePremium(packageId)
      if (success) {
        const packageInfo = PREMIUM_PACKAGES.find(pkg => pkg.id === packageId)
        if (packageInfo) {
          const newSubscription: Subscription = {
            id: `sub_${Date.now()}`,
            type: packageInfo.type,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + getSubscriptionDuration(packageInfo.type)),
            status: 'active',
            autoRenew: true,
            nextBillingDate: new Date(Date.now() + getSubscriptionDuration(packageInfo.type)),
            price: packageInfo.price,
            paymentMethod: '신용카드'
          }
          
          setSubscription(newSubscription)
          onSubscriptionChange?.(newSubscription)
        }
      }
      setShowUpgradeModal(false)
    } catch (error) {
      alert('구독 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 구독 기간 계산
  const getSubscriptionDuration = (type: string) => {
    switch (type) {
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      case 'yearly': return 365 * 24 * 60 * 60 * 1000
      default: return 30 * 24 * 60 * 60 * 1000
    }
  }

  // 자동 갱신 토글
  const toggleAutoRenew = async () => {
    if (!subscription) return

    setIsLoading(true)
    try {
      // API 호출로 자동 갱신 설정 변경
      const updatedSubscription = {
        ...subscription,
        autoRenew: !subscription.autoRenew
      }
      
      setSubscription(updatedSubscription)
      onSubscriptionChange?.(updatedSubscription)
    } catch (error) {
      alert('설정 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 구독 해지
  const handleCancelSubscription = async () => {
    if (!subscription) return

    setIsLoading(true)
    try {
      // API 호출로 구독 해지
      const updatedSubscription = {
        ...subscription,
        status: 'cancelled' as const,
        autoRenew: false
      }
      
      setSubscription(updatedSubscription)
      onSubscriptionChange?.(updatedSubscription)
      setShowCancelModal(false)
    } catch (error) {
      alert('구독 해지 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div className={`space-y-6 ${className}`}>
      {subscription ? (
        <>
          {/* 현재 구독 정보 */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  프리미엄 {getTypeText(subscription.type)} 구독
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                  {subscription.autoRenew && subscription.status === 'active' && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                      자동갱신
                    </span>
                  )}
                </div>
              </div>
              <div className="text-4xl">👑</div>
            </div>

            {/* 구독 기간 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-white/60 text-sm">구독 시작일</div>
                <div className="text-white font-medium">
                  {subscription.startDate.toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm">만료일</div>
                <div className="text-white font-medium">
                  {subscription.expiryDate.toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm">월 구독료</div>
                <div className="text-white font-medium">
                  {formatPrice(subscription.price)}
                </div>
              </div>
            </div>

            {/* 남은 시간 */}
            {timeRemaining && subscription.status === 'active' && (
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {timeRemaining.days > 0 && `${timeRemaining.days}일 `}
                    {timeRemaining.hours}시간
                  </div>
                  <div className="text-white/70">남음</div>
                  {timeRemaining.days < 7 && (
                    <div className="mt-2 text-yellow-400 text-sm">
                      ⚠️ 구독 만료가 임박했습니다
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 현재 혜택 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-white mb-3">현재 혜택</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getBenefits(subscription.type).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/80">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 구독 관리 버튼들 */}
            <div className="flex flex-wrap gap-3">
              {subscription.status === 'active' && (
                <>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    플랜 변경
                  </button>
                  
                  <button
                    onClick={toggleAutoRenew}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      subscription.autoRenew
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {subscription.autoRenew ? '자동갱신 끄기' : '자동갱신 켜기'}
                  </button>
                  
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    구독 해지
                  </button>
                </>
              )}
              
              {subscription.status === 'expired' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  구독 재시작
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* 구독 없음 */
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">💎</div>
          <h3 className="text-2xl font-bold text-white mb-4">프리미엄 구독이 없습니다</h3>
          <p className="text-white/70 mb-6">
            프리미엄 구독으로 더 많은 혜택을 누려보세요!
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-bold"
          >
            프리미엄 구독하기
          </button>
        </div>
      )}

      {/* 업그레이드/플랜 변경 모달 */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">프리미엄 플랜 선택</h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PREMIUM_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white/10 rounded-xl p-6 border-2 transition-all cursor-pointer ${
                      selectedPlan === pkg.id 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-white/20 hover:border-white/40'
                    } ${pkg.popular ? 'ring-2 ring-yellow-400' : ''}`}
                    onClick={() => setSelectedPlan(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="bg-yellow-400 text-black text-center py-1 rounded-lg mb-4 font-bold text-sm">
                        가장 인기 있는 플랜
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-white mb-2">{pkg.name}</h4>
                      <div className="text-3xl font-bold text-purple-400 mb-1">
                        {formatPrice(pkg.price)}
                      </div>
                      <div className="text-white/60 text-sm">{pkg.description}</div>
                    </div>

                    <div className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-white/80 text-sm">
                          <span className="text-green-400">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl"
                >
                  취소
                </button>
                <button
                  onClick={() => selectedPlan && handleSubscriptionChange(selectedPlan)}
                  disabled={!selectedPlan || isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 rounded-xl"
                >
                  {isLoading ? '처리중...' : '구독하기'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 구독 해지 확인 모달 */}
      <AnimatePresence>
        {showCancelModal && (
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
              <h3 className="text-xl font-bold text-white mb-4">구독 해지 확인</h3>
              
              <div className="mb-6 text-white/80">
                <p className="mb-2">정말로 프리미엄 구독을 해지하시겠습니까?</p>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-200 text-sm">
                  <p>• 구독 해지 후에도 현재 구독 기간이 끝날 때까지 혜택을 이용할 수 있습니다</p>
                  <p>• 언제든지 다시 구독을 시작할 수 있습니다</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl"
                >
                  취소
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl"
                >
                  {isLoading ? '처리중...' : '해지하기'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SubscriptionManager