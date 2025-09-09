// frontend/src/pages/settings.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'

interface UserSettings {
  darkMode: boolean
  notifications: {
    game: boolean
    marketing: boolean
    payment: boolean
  }
  privacy: {
    showProfile: boolean
    showStats: boolean
    allowMessages: boolean
  }
  adPreferences: {
    frequency: 'high' | 'medium' | 'low' | 'off'
    allowRewardedAds: boolean
    allowInterstitialAds: boolean
  }
  language: 'ko' | 'en'
  soundEffects: boolean
  backgroundMusic: boolean
}

interface UserAccount {
  username: string
  email: string
  joinDate: Date
  totalPoints: number
  availableBalance: number // 사용 가능한 포인트
  isPremium: boolean
  premiumType?: 'weekly' | 'monthly' | 'yearly'
  premiumExpiry?: Date
}

export default function Settings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'privacy' | 'terms'>('account')
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: true,
    notifications: {
      game: true,
      marketing: false,
      payment: true
    },
    privacy: {
      showProfile: true,
      showStats: true,
      allowMessages: true
    },
    adPreferences: {
      frequency: 'medium',
      allowRewardedAds: true,
      allowInterstitialAds: true
    },
    language: 'ko',
    soundEffects: true,
    backgroundMusic: false
  })

  const [userAccount, setUserAccount] = useState<UserAccount>({
    username: '플레이어123',
    email: 'player123@example.com',
    joinDate: new Date('2024-01-15'),
    totalPoints: 15420,
    availableBalance: 12750, // 사용하지 않은 포인트
    isPremium: false
  })

  const [paymentHistory, setPaymentHistory] = useState([
    {
      id: 'pay_001',
      date: new Date('2024-03-01'),
      amount: 9900,
      type: '포인트 패키지',
      item: '포인트 5,000개',
      status: '완료',
      pointsAdded: 5000
    },
    {
      id: 'pay_002',
      date: new Date('2024-02-15'),
      amount: 9900,
      type: '프리미엄 구독',
      item: '월간 프리미엄',
      status: '완료',
      pointsAdded: 0
    }
  ])

  // 설정 저장
  const saveSettings = () => {
    // 실제로는 API 호출
    console.log('Settings saved:', settings)
    // 성공 알림 표시
  }

  // 계정 삭제
  const handleDeleteAccount = () => {
    if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 계정 삭제 API 호출
      console.log('Account deletion requested')
    }
  }

  // 로그아웃
  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      // 로그아웃 처리
      router.push('/auth/login')
    }
  }

  const tabs = [
    { id: 'account', name: '계정', icon: '👤' },
    { id: 'preferences', name: '환경설정', icon: '⚙️' },
    { id: 'privacy', name: '개인정보', icon: '🔒' },
    { id: 'terms', name: '약관', icon: '📋' }
  ]

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* 사용자 정보 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">계정 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-1">사용자명</label>
            <input
              type="text"
              value={userAccount.username}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1">이메일</label>
            <input
              type="email"
              value={userAccount.email}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>
        <div className="mt-4 text-white/60 text-sm">
          가입일: {userAccount.joinDate.toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 포인트 및 잔액 */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">포인트 & 잔액</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{userAccount.totalPoints.toLocaleString()}</div>
            <div className="text-white/70 text-sm">총 획득 포인트</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{userAccount.availableBalance.toLocaleString()}</div>
            <div className="text-white/70 text-sm">사용 가능 포인트</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{(userAccount.totalPoints - userAccount.availableBalance).toLocaleString()}</div>
            <div className="text-white/70 text-sm">사용한 포인트</div>
          </div>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">최근 결제 내역</h3>
        <div className="space-y-3">
          {paymentHistory.slice(0, 5).map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
            >
              <div>
                <div className="text-white font-medium">{payment.item}</div>
                <div className="text-white/60 text-sm">
                  {payment.date.toLocaleDateString('ko-KR')} • {payment.type}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  {payment.amount.toLocaleString()}원
                </div>
                <div className={`text-sm ${
                  payment.status === '완료' ? 'text-green-400' : 
                  payment.status === '대기' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {payment.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/payment/history')}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
        >
          전체 내역 보기
        </button>
      </div>
    </div>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {/* 화면 설정 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">화면 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white">다크 모드</label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div>
            <label className="block text-white mb-2">언어</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                language: e.target.value as 'ko' | 'en' 
              }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* 사운드 설정 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">사운드 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white">효과음</label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEffects: !prev.soundEffects }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.soundEffects ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">배경 음악</label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, backgroundMusic: !prev.backgroundMusic }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.backgroundMusic ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.backgroundMusic ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 광고 설정 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">광고 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">광고 빈도</label>
            <select
              value={settings.adPreferences.frequency}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                adPreferences: { 
                  ...prev.adPreferences, 
                  frequency: e.target.value as any 
                }
              }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="high">높음 (더 많은 포인트)</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
              <option value="off">표시 안함</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">리워드 광고 허용</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                adPreferences: { 
                  ...prev.adPreferences, 
                  allowRewardedAds: !prev.adPreferences.allowRewardedAds 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.adPreferences.allowRewardedAds ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.adPreferences.allowRewardedAds ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      {/* 알림 설정 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">알림 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white">게임 알림</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                notifications: { 
                  ...prev.notifications, 
                  game: !prev.notifications.game 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.game ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.notifications.game ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">마케팅 알림</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                notifications: { 
                  ...prev.notifications, 
                  marketing: !prev.notifications.marketing 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.marketing ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.notifications.marketing ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">결제 알림</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                notifications: { 
                  ...prev.notifications, 
                  payment: !prev.notifications.payment 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.payment ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.notifications.payment ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 공개 설정 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">프로필 공개 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white">프로필 공개</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                privacy: { 
                  ...prev.privacy, 
                  showProfile: !prev.privacy.showProfile 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.privacy.showProfile ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.privacy.showProfile ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">게임 통계 공개</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                privacy: { 
                  ...prev.privacy, 
                  showStats: !prev.privacy.showStats 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.privacy.showStats ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.privacy.showStats ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">메시지 수신 허용</label>
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                privacy: { 
                  ...prev.privacy, 
                  allowMessages: !prev.privacy.allowMessages 
                }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.privacy.allowMessages ? 'bg-purple-600' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.privacy.allowMessages ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTermsTab = () => (
    <div className="space-y-6">
      {/* 서비스 약관 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">서비스 약관</h3>
        <div className="max-h-60 overflow-y-auto text-white/80 text-sm space-y-4">
          <div>
            <h4 className="font-bold mb-2">제1조 (목적)</h4>
            <p>이 약관은 게임 플랫폼 서비스 이용에 관한 조건과 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">제2조 (정의)</h4>
            <p>1. "서비스"란 회사가 제공하는 모든 게임 및 관련 서비스를 의미합니다.</p>
            <p>2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">제3조 (포인트 정책)</h4>
            <p>1. 포인트는 게임 내에서 다양한 아이템 구매에 사용할 수 있습니다.</p>
            <p>2. 구매한 포인트는 환불이 불가능하며, 계정 삭제 시 소멸됩니다.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">제4조 (프리미엄 서비스)</h4>
            <p>1. 프리미엄 구독 서비스는 월간, 연간 단위로 제공됩니다.</p>
            <p>2. 구독 해지는 언제든지 가능하며, 남은 기간 동안 혜택이 유지됩니다.</p>
          </div>
        </div>
        <div className="mt-4 text-white/60 text-xs">
          최종 수정일: 2024년 3월 1일
        </div>
      </div>

      {/* 개인정보 처리방침 */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">개인정보 처리방침</h3>
        <div className="max-h-60 overflow-y-auto text-white/80 text-sm space-y-4">
          <div>
            <h4 className="font-bold mb-2">1. 개인정보 수집 및 이용 목적</h4>
            <p>- 회원 가입, 서비스 제공, 본인 확인</p>
            <p>- 게임 통계 분석 및 서비스 개선</p>
            <p>- 결제 처리 및 고객 지원</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">2. 수집하는 개인정보 항목</h4>
            <p>- 필수: 이메일, 닉네임</p>
            <p>- 선택: 프로필 사진, 선호도</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">3. 개인정보 보유 및 이용 기간</h4>
            <p>회원 탈퇴 시까지 보유하며, 관련 법령에 따라 일정 기간 보관할 수 있습니다.</p>
          </div>
        </div>
        <div className="mt-4 text-white/60 text-xs">
          최종 수정일: 2024년 3월 1일
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">설정</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            뒤로가기
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 탭 네비게이션 */}
          <div className="lg:w-64">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>
              
              {/* 계정 관리 버튼들 */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                <button
                  onClick={saveSettings}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                >
                  설정 저장
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  로그아웃
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
                >
                  계정 삭제
                </button>
              </div>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'account' && renderAccountTab()}
              {activeTab === 'preferences' && renderPreferencesTab()}
              {activeTab === 'privacy' && renderPrivacyTab()}
              {activeTab === 'terms' && renderTermsTab()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}