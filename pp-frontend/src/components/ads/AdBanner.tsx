// frontend/src/components/ads/AdBanner.tsx
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// TypeScript declaration for AdSense
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface AdBannerProps {
  adSlot?: string
  size?: 'banner' | 'leaderboard' | 'rectangle' | 'skyscraper'
  className?: string
  onClose?: () => void
  closeable?: boolean
  showRewardButton?: boolean
  onRewardClaimed?: (reward: number) => void
}

// 광고 사이즈 매핑
const AD_SIZES = {
  banner: { width: 320, height: 50 },
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  skyscraper: { width: 160, height: 600 }
}

const AdBanner: React.FC<AdBannerProps> = ({
  adSlot = 'demo-ad-slot',
  size = 'banner',
  className = '',
  onClose,
  closeable = false,
  showRewardButton = false,
  onRewardClaimed
}) => {
  const adRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardProgress, setRewardProgress] = useState(0)
  const [isWatchingAd, setIsWatchingAd] = useState(false)

  const adSize = AD_SIZES[size]

  // Google AdSense 초기화 (실제 구현 시)
  useEffect(() => {
    const initializeAds = async () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // AdSense 광고 로드
          (window.adsbygoogle = window.adsbygoogle || []).push({})
          setIsLoaded(true)
        } else {
          // 데모용 광고 표시
          setTimeout(() => {
            setIsLoaded(true)
          }, 1000)
        }
      } catch (error) {
        console.error('Ad loading failed:', error)
        setIsError(true)
      }
    }

    initializeAds()
  }, [])

  // 리워드 광고 시청
  const handleWatchRewardAd = () => {
    setIsWatchingAd(true)
    setShowRewardModal(true)
    
    // 광고 시청 시뮬레이션 (실제로는 광고 SDK 사용)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setRewardProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          handleRewardComplete()
        }, 500)
      }
    }, 300)
  }

  const handleRewardComplete = () => {
    const rewardAmount = Math.floor(Math.random() * 50) + 10 // 10-60 포인트
    onRewardClaimed?.(rewardAmount)
    setShowRewardModal(false)
    setIsWatchingAd(false)
    setRewardProgress(0)
  }

  const handleSkipAd = () => {
    setShowRewardModal(false)
    setIsWatchingAd(false)
    setRewardProgress(0)
  }

  if (isError) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-400 text-sm">
          광고를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        className={`relative bg-white/10 backdrop-blur-md rounded-lg overflow-hidden ${className}`}
        style={{ 
          width: adSize.width, 
          height: adSize.height,
          minWidth: adSize.width,
          minHeight: adSize.height
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isLoaded ? 1 : 0.5, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* 닫기 버튼 */}
        {closeable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-1 right-1 z-10 w-6 h-6 bg-black/50 text-white rounded-full text-xs hover:bg-black/70 transition-colors"
          >
            ×
          </button>
        )}

        {/* 로딩 상태 */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* 데모 광고 컨텐츠 */}
        {isLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="text-center p-2">
              <div className="font-bold text-sm mb-1">🎮 게임 추천</div>
              <div className="text-xs opacity-90">새로운 게임을 지금 플레이하세요!</div>
              <div className="text-xs mt-1 opacity-75">광고</div>
            </div>
          </div>
        )}

        {/* 실제 AdSense 광고 컨테이너 */}
        <div
          ref={adRef}
          className="w-full h-full"
          style={{ display: isLoaded ? 'block' : 'none' }}
        >
          <ins
            className="adsbygoogle"
            style={{
              display: 'inline-block',
              width: adSize.width,
              height: adSize.height
            }}
            data-ad-client="ca-pub-xxxxxxxxxxxxxxxxx" // 실제 AdSense 클라이언트 ID
            data-ad-slot={adSlot}
          />
        </div>

        {/* 리워드 광고 버튼 */}
        {showRewardButton && (
          <motion.button
            onClick={handleWatchRewardAd}
            className="absolute bottom-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-2 py-1 rounded font-bold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isWatchingAd}
          >
            📺 리워드
          </motion.button>
        )}
      </motion.div>

      {/* 리워드 광고 모달 */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-md mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                리워드 광고 시청
              </h3>
              
              {isWatchingAd ? (
                <div className="mb-6">
                  <div className="text-white/70 mb-4">
                    광고를 끝까지 시청하면 포인트를 획득합니다!
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${rewardProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <div className="text-yellow-400 font-bold">
                    {Math.round(rewardProgress)}% 완료
                  </div>
                  
                  {/* 광고 시뮬레이션 영역 */}
                  <div className="bg-blue-600 rounded-lg p-8 mt-4 mb-4">
                    <div className="text-white font-bold mb-2">🎯 새로운 게임!</div>
                    <div className="text-white/80 text-sm">
                      지금 바로 도전해보세요!
                    </div>
                  </div>
                  
                  {rewardProgress >= 30 && (
                    <button
                      onClick={handleSkipAd}
                      className="text-gray-400 hover:text-gray-300 text-sm underline"
                    >
                      건너뛰기
                    </button>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="text-6xl mb-4">📺</div>
                  <div className="text-white/70 mb-4">
                    30초 광고를 시청하고 포인트를 획득하세요!
                  </div>
                  <div className="text-yellow-400 font-bold">
                    예상 보상: 10~60 포인트
                  </div>
                </div>
              )}
              
              {!isWatchingAd && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRewardModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleWatchRewardAd}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black py-3 rounded-xl font-bold"
                  >
                    시청하기
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AdBanner