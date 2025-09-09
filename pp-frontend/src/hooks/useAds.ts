// frontend/src/hooks/useAds.ts
import { useState, useEffect, useCallback } from 'react'

// 광고 타입 정의
export interface AdConfig {
  id: string
  type: 'banner' | 'interstitial' | 'rewarded' | 'native'
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  frequency: number // 몇 번째 게임마다 표시할지
  minInterval: number // 최소 간격 (ms)
  enabled: boolean
}

// 광고 상태
interface AdState {
  isLoaded: boolean
  isShowing: boolean
  lastShown: number
  showCount: number
}

// 사용자 광고 설정
interface UserAdSettings {
  isPremium: boolean
  adFrequency: 'high' | 'medium' | 'low' | 'off'
  allowRewardedAds: boolean
  allowInterstitialAds: boolean
}

export const useAds = (userSettings?: UserAdSettings) => {
  const [adConfigs, setAdConfigs] = useState<AdConfig[]>([
    {
      id: 'banner_top',
      type: 'banner',
      position: 'top',
      frequency: 1,
      minInterval: 0,
      enabled: !userSettings?.isPremium
    },
    {
      id: 'interstitial_game_end',
      type: 'interstitial',
      position: 'center',
      frequency: 3, // 3게임마다
      minInterval: 60000, // 1분
      enabled: !userSettings?.isPremium && userSettings?.allowInterstitialAds !== false
    },
    {
      id: 'rewarded_points',
      type: 'rewarded',
      position: 'center',
      frequency: 1,
      minInterval: 30000, // 30초
      enabled: userSettings?.allowRewardedAds !== false
    }
  ])

  const [adStates, setAdStates] = useState<Record<string, AdState>>({})
  const [totalRewardEarned, setTotalRewardEarned] = useState(0)

  // 광고 상태 초기화
  useEffect(() => {
    const initialStates: Record<string, AdState> = {}
    adConfigs.forEach(config => {
      initialStates[config.id] = {
        isLoaded: false,
        isShowing: false,
        lastShown: 0,
        showCount: 0
      }
    })
    setAdStates(initialStates)
  }, [adConfigs])

  // 사용자 설정 변경 시 광고 설정 업데이트
  useEffect(() => {
    setAdConfigs(prev => prev.map(config => ({
      ...config,
      enabled: userSettings?.isPremium ? false : 
        config.type === 'interstitial' ? userSettings?.allowInterstitialAds !== false :
        config.type === 'rewarded' ? userSettings?.allowRewardedAds !== false :
        true
    })))
  }, [userSettings])

  // 광고 표시 가능 여부 확인
  const canShowAd = useCallback((adId: string, gameCount?: number): boolean => {
    const config = adConfigs.find(c => c.id === adId)
    const state = adStates[adId]

    if (!config || !state || !config.enabled) return false
    if (userSettings?.isPremium && config.type !== 'rewarded') return false

    // 빈도 확인
    if (gameCount && gameCount % config.frequency !== 0) return false

    // 최소 간격 확인
    const timeSinceLastShown = Date.now() - state.lastShown
    if (timeSinceLastShown < config.minInterval) return false

    // 광고 빈도 설정 확인
    const frequencyMultiplier = getFrequencyMultiplier(userSettings?.adFrequency)
    if (config.minInterval * frequencyMultiplier > timeSinceLastShown) return false

    return true
  }, [adConfigs, adStates, userSettings])

  // 광고 빈도 배수 계산
  const getFrequencyMultiplier = (frequency?: string): number => {
    switch (frequency) {
      case 'high': return 0.5
      case 'medium': return 1
      case 'low': return 2
      case 'off': return Infinity
      default: return 1
    }
  }

  // 광고 표시
  const showAd = useCallback(async (adId: string): Promise<boolean> => {
    if (!canShowAd(adId)) return false

    try {
      // 광고 상태 업데이트
      setAdStates(prev => ({
        ...prev,
        [adId]: {
          ...prev[adId],
          isShowing: true,
          lastShown: Date.now(),
          showCount: prev[adId].showCount + 1
        }
      }))

      // 실제 광고 SDK 호출 (여기서는 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error('Failed to show ad:', error)
      return false
    }
  }, [canShowAd])

  // 광고 종료 처리
  const hideAd = useCallback((adId: string, completed: boolean = false) => {
    setAdStates(prev => ({
      ...prev,
      [adId]: {
        ...prev[adId],
        isShowing: false
      }
    }))

    // 광고 완료 이벤트 (분석용)
    if (completed) {
      console.log(`Ad ${adId} completed`)
    }
  }, [])

  // 리워드 광고 보상 처리
  const handleRewardedAd = useCallback((adId: string, reward: number) => {
    setTotalRewardEarned(prev => prev + reward)
    hideAd(adId, true)
    
    // 실제로는 백엔드에 보상 적립 요청
    console.log(`Rewarded ad completed: +${reward} points`)
  }, [hideAd])

  // 게임 종료 시 전면 광고 표시 여부 확인
  const shouldShowInterstitialAfterGame = useCallback((gameCount: number): boolean => {
    return canShowAd('interstitial_game_end', gameCount)
  }, [canShowAd])

  // 리워드 광고 사용 가능 여부
  const isRewardedAdAvailable = useCallback((): boolean => {
    return canShowAd('rewarded_points')
  }, [canShowAd])

  // 배너 광고 표시 여부
  const shouldShowBannerAd = useCallback((): boolean => {
    return canShowAd('banner_top')
  }, [canShowAd])

  // 광고 통계
  const getAdStats = useCallback(() => {
    const totalShown = Object.values(adStates).reduce((sum, state) => sum + state.showCount, 0)
    const activeAds = Object.values(adStates).filter(state => state.isShowing).length

    return {
      totalAdsShown: totalShown,
      activeAds,
      totalRewardEarned,
      isPremium: userSettings?.isPremium || false
    }
  }, [adStates, totalRewardEarned, userSettings?.isPremium])

  // 프리미엄 업그레이드 권장
  const shouldRecommendPremium = useCallback((): boolean => {
    const stats = getAdStats()
    return stats.totalAdsShown > 20 && !stats.isPremium
  }, [getAdStats])

  return {
    // 상태
    adConfigs,
    adStates,
    totalRewardEarned,

    // 메서드
    canShowAd,
    showAd,
    hideAd,
    handleRewardedAd,

    // 헬퍼
    shouldShowInterstitialAfterGame,
    isRewardedAdAvailable,
    shouldShowBannerAd,
    shouldRecommendPremium,
    getAdStats
  }
}

// 광고 통합 컴포넌트용 훅
export const useAdIntegration = () => {
  const [gameCount, setGameCount] = useState(0)
  const [userSettings, setUserSettings] = useState<UserAdSettings>({
    isPremium: false,
    adFrequency: 'medium',
    allowRewardedAds: true,
    allowInterstitialAds: true
  })

  const ads = useAds(userSettings)

  // 게임 완료 시 호출
  const onGameComplete = useCallback(async (earnedPoints: number) => {
    const newGameCount = gameCount + 1
    setGameCount(newGameCount)

    // 전면 광고 표시 확인
    if (ads.shouldShowInterstitialAfterGame(newGameCount)) {
      await ads.showAd('interstitial_game_end')
    }

    // 프리미엄 권장
    if (ads.shouldRecommendPremium()) {
      console.log('Recommend premium upgrade')
    }
  }, [gameCount, ads])

  // 리워드 광고 시청
  const watchRewardedAd = useCallback(async (): Promise<number> => {
    if (!ads.isRewardedAdAvailable()) {
      throw new Error('Rewarded ad not available')
    }

    const success = await ads.showAd('rewarded_points')
    if (success) {
      const reward = Math.floor(Math.random() * 50) + 10 // 10-60 포인트
      ads.handleRewardedAd('rewarded_points', reward)
      return reward
    }

    throw new Error('Failed to show rewarded ad')
  }, [ads])

  // 프리미엄 구매 처리
  const purchasePremium = useCallback(() => {
    setUserSettings(prev => ({ ...prev, isPremium: true }))
  }, [])

  return {
    ...ads,
    gameCount,
    userSettings,
    onGameComplete,
    watchRewardedAd,
    purchasePremium,
    setUserSettings
  }
}