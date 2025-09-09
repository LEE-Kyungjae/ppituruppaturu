// frontend/src/pages/admin/users/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  CreditCard,
  Activity,
  Play,
  LogIn,
  LogOut,
  AlertTriangle,
  Eye,
  Edit,
  MoreVertical,
  MapPin,
  Phone,
  Globe,
  Coins
} from 'lucide-react'

interface UserDetail {
  id: string
  username: string
  email: string
  displayName?: string
  profileImage?: string
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  lastLogin?: string
  isOnline: boolean
  
  // Profile info
  phoneNumber?: string
  address?: string
  birthDate?: string
  
  // Stats
  points: number
  totalPurchases: number
  totalSpent: number
  gamePlayCount: number
  sessionCount: number
  avgSessionTime: number // minutes
  
  // Recent activity counts
  todayLogins: number
  weeklyPlaytime: number // hours
  monthlySpent: number
}

interface ActivityLog {
  id: string
  timestamp: string
  type: 'login' | 'logout' | 'payment' | 'game' | 'purchase' | 'error'
  description: string
  details?: string
  ipAddress?: string
  userAgent?: string
  success: boolean
}

interface PaymentHistory {
  id: string
  merchantUid: string
  itemName: string
  amount: number
  status: 'paid' | 'failed' | 'cancelled' | 'ready'
  createdAt: string
  paidAt?: string
}

export default function UserDetail() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState<UserDetail | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'payments' | 'settings'>('overview')
  const [logFilter, setLogFilter] = useState<'all' | 'login' | 'payment' | 'game' | 'error'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'failed' | 'cancelled'>('all')

  useEffect(() => {
    if (id) {
      loadUserData()
    }
  }, [id])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // TODO: 실제 API 호출로 대체
      // Mock data
      const mockUser: UserDetail = {
        id: id as string,
        username: 'user123',
        email: 'user123@example.com',
        displayName: '김철수',
        status: 'active',
        createdAt: '2024-01-01T09:00:00Z',
        lastLogin: '2024-01-15T10:30:00Z',
        isOnline: true,
        phoneNumber: '010-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        points: 2500,
        totalPurchases: 5,
        totalSpent: 25000,
        gamePlayCount: 142,
        sessionCount: 67,
        avgSessionTime: 28.5,
        todayLogins: 3,
        weeklyPlaytime: 12.5,
        monthlySpent: 15000
      }

      const mockActivityLogs: ActivityLog[] = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00Z',
          type: 'login',
          description: '로그인 성공',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          success: true
        },
        {
          id: '2',
          timestamp: '2024-01-15T10:25:00Z',
          type: 'payment',
          description: '포인트 구매 완료 (5,000원)',
          details: 'merchant_uid: PITTURU_20240115_001',
          success: true
        },
        {
          id: '3',
          timestamp: '2024-01-15T09:45:00Z',
          type: 'game',
          description: '클릭 스피드 게임 완료 (+50P)',
          details: 'Score: 1250, Rank: 12',
          success: true
        },
        {
          id: '4',
          timestamp: '2024-01-14T18:20:00Z',
          type: 'logout',
          description: '로그아웃',
          success: true
        },
        {
          id: '5',
          timestamp: '2024-01-14T15:30:00Z',
          type: 'error',
          description: '결제 실패',
          details: 'Error: INVALID_CARD_COMPANY',
          success: false
        }
      ]

      const mockPaymentHistory: PaymentHistory[] = [
        {
          id: '1',
          merchantUid: 'PITTURU_20240115_001',
          itemName: '포인트 5,000개',
          amount: 5000,
          status: 'paid',
          createdAt: '2024-01-15T10:25:00Z',
          paidAt: '2024-01-15T10:25:30Z'
        },
        {
          id: '2',
          merchantUid: 'PITTURU_20240110_002',
          itemName: '프리미엄 월간 패스',
          amount: 9900,
          status: 'paid',
          createdAt: '2024-01-10T14:20:00Z',
          paidAt: '2024-01-10T14:20:15Z'
        },
        {
          id: '3',
          merchantUid: 'PITTURU_20240105_003',
          itemName: '포인트 10,000개',
          amount: 10000,
          status: 'failed',
          createdAt: '2024-01-05T16:45:00Z'
        }
      ]

      setUser(mockUser)
      setActivityLogs(mockActivityLogs)
      setPaymentHistory(mockPaymentHistory)
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'banned':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'banned': return '차단됨'
      default: return status
    }
  }

  const getActivityIcon = (type: string, success: boolean) => {
    const iconClass = "w-4 h-4"
    const color = success ? 'text-green-600' : 'text-red-600'
    
    switch (type) {
      case 'login':
        return <LogIn className={`${iconClass} ${success ? 'text-blue-600' : 'text-red-600'}`} />
      case 'logout':
        return <LogOut className={`${iconClass} text-gray-600`} />
      case 'payment':
        return <CreditCard className={`${iconClass} ${color}`} />
      case 'game':
        return <Play className={`${iconClass} ${success ? 'text-purple-600' : 'text-red-600'}`} />
      case 'purchase':
        return <Coins className={`${iconClass} ${color}`} />
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-600`} />
      default:
        return <Activity className={`${iconClass} text-gray-600`} />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'ready':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredLogs = activityLogs.filter(log => {
    if (logFilter === 'all') return true
    return log.type === logFilter
  })

  const filteredPayments = paymentHistory.filter(payment => {
    if (paymentFilter === 'all') return true
    return payment.status === paymentFilter
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">사용자를 찾을 수 없습니다</h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-flutter-blue-500 text-white rounded-lg hover:bg-flutter-blue-600"
          >
            돌아가기
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">회원 상세</h1>
            <p className="text-gray-600 mt-1">회원 정보 및 활동 내역</p>
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            계정 차단
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-flutter-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-flutter-blue-600" />
                </div>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.displayName || user.username}
                  </h2>
                  <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                  {user.isOnline && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      온라인
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      최근 로그인: {new Date(user.lastLogin).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {user.points.toLocaleString()}P
              </div>
              <div className="text-sm text-gray-600">보유 포인트</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {user.totalSpent.toLocaleString()}원
              </div>
              <div className="text-sm text-gray-600">총 구매금액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user.gamePlayCount}회
              </div>
              <div className="text-sm text-gray-600">게임 플레이</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {user.avgSessionTime.toFixed(1)}분
              </div>
              <div className="text-sm text-gray-600">평균 세션</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 로그인</p>
                <p className="text-xl font-bold text-blue-600">{user.todayLogins}회</p>
              </div>
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">주간 플레이타임</p>
                <p className="text-xl font-bold text-purple-600">{user.weeklyPlaytime}시간</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 구매</p>
                <p className="text-xl font-bold text-green-600">{user.monthlySpent.toLocaleString()}원</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { key: 'overview', label: '개요', icon: User },
                { key: 'activity', label: '활동 로그', icon: Activity },
                { key: 'payments', label: '결제 내역', icon: CreditCard },
                { key: 'settings', label: '설정', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-flutter-blue-600 border-b-2 border-flutter-blue-600 bg-flutter-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">사용자명</label>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">이메일</label>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">닉네임</label>
                        <p className="font-medium">{user.displayName || '설정 안함'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">계정 상태</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">상태</label>
                        <p className="font-medium">{getStatusText(user.status)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">세션 수</label>
                        <p className="font-medium">{user.sessionCount}회</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">평균 세션 시간</label>
                        <p className="font-medium">{user.avgSessionTime.toFixed(1)}분</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">활동 로그</h3>
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="login">로그인</option>
                    <option value="payment">결제</option>
                    <option value="game">게임</option>
                    <option value="error">오류</option>
                  </select>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center mt-0.5">
                        {getActivityIcon(log.type, log.success)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{log.description}</p>
                          {log.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString('ko-KR')}
                          {log.ipAddress && ` • ${log.ipAddress}`}
                        </div>
                        {log.details && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{log.details}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">결제 내역</h3>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="paid">결제완료</option>
                    <option value="failed">결제실패</option>
                    <option value="cancelled">결제취소</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  {filteredPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{payment.itemName}</p>
                          <p className="text-sm text-gray-600">{payment.merchantUid}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {payment.amount.toLocaleString()}원
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status === 'paid' ? '완료' :
                           payment.status === 'failed' ? '실패' :
                           payment.status === 'cancelled' ? '취소' : '대기'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">계정 관리</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Ban className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800">계정 일시 정지</p>
                          <p className="text-sm text-yellow-600">사용자의 계정을 일시적으로 비활성화합니다</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">계정 영구 차단</p>
                          <p className="text-sm text-red-600">사용자의 계정을 영구적으로 차단합니다</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}