// frontend/src/components/admin/RecentActivity.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  LogIn,
  LogOut,
  Shield
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'login' | 'logout' | 'payment' | 'game' | 'error' | 'signup'
  user: string
  description: string
  timestamp: string
  status?: 'success' | 'failed' | 'pending'
  amount?: number
  details?: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'payment' | 'auth' | 'game' | 'error'>('all')

  useEffect(() => {
    // TODO: 실제 API 호출로 대체
    const loadRecentActivity = async () => {
      try {
        // Mock data
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'payment',
            user: 'user123',
            description: '포인트 5,000원 결제 완료',
            timestamp: '2분 전',
            status: 'success',
            amount: 5000
          },
          {
            id: '2',
            type: 'login',
            user: 'user456',
            description: '로그인',
            timestamp: '3분 전',
            status: 'success'
          },
          {
            id: '3',
            type: 'error',
            user: 'user789',
            description: '결제 실패 - 카드 오류',
            timestamp: '5분 전',
            status: 'failed',
            amount: 10000,
            details: 'INVALID_CARD_COMPANY'
          },
          {
            id: '4',
            type: 'game',
            user: 'user321',
            description: '클릭 스피드 게임 완료 (+50P)',
            timestamp: '7분 전',
            status: 'success'
          },
          {
            id: '5',
            type: 'signup',
            user: 'user654',
            description: '신규 회원 가입',
            timestamp: '10분 전',
            status: 'success'
          },
          {
            id: '6',
            type: 'payment',
            user: 'user987',
            description: '프리미엄 구독 결제',
            timestamp: '12분 전',
            status: 'success',
            amount: 9900
          },
          {
            id: '7',
            type: 'logout',
            user: 'user123',
            description: '로그아웃',
            timestamp: '15분 전',
            status: 'success'
          },
          {
            id: '8',
            type: 'error',
            user: 'system',
            description: '데이터베이스 연결 지연',
            timestamp: '18분 전',
            status: 'failed',
            details: 'Connection timeout after 30s'
          }
        ]
        
        setActivities(mockActivities)
      } catch (error) {
        console.error('Failed to load recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentActivity()
  }, [])

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = "w-4 h-4"
    
    switch (type) {
      case 'login':
        return <LogIn className={`${iconClass} text-blue-600`} />
      case 'logout':
        return <LogOut className={`${iconClass} text-gray-600`} />
      case 'payment':
        return status === 'failed' ? 
          <XCircle className={`${iconClass} text-red-600`} /> :
          <CreditCard className={`${iconClass} text-green-600`} />
      case 'game':
        return <Play className={`${iconClass} text-purple-600`} />
      case 'signup':
        return <User className={`${iconClass} text-blue-600`} />
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-600`} />
      default:
        return <Clock className={`${iconClass} text-gray-600`} />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            성공
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-3 h-3" />
            실패
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" />
            대기
          </span>
        )
      default:
        return null
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    if (filter === 'payment') return activity.type === 'payment'
    if (filter === 'auth') return ['login', 'logout', 'signup'].includes(activity.type)
    if (filter === 'game') return activity.type === 'game'
    if (filter === 'error') return activity.type === 'error'
    return true
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">실시간 활동 로그</h3>
        
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'payment', label: '결제' },
            { key: 'auth', label: '인증' },
            { key: 'game', label: '게임' },
            { key: 'error', label: '오류' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === key
                  ? 'bg-flutter-blue-100 text-flutter-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>활동 로그가 없습니다.</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                {getActivityIcon(activity.type, activity.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  {getStatusBadge(activity.status)}
                  {activity.amount && (
                    <span className="text-sm font-semibold text-green-600">
                      {activity.amount.toLocaleString()}원
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {activity.user}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.timestamp}
                  </span>
                </div>
                
                {activity.details && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {activity.details}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* View all button */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <button className="text-sm text-flutter-blue-600 hover:text-flutter-blue-700 font-medium">
          전체 로그 보기
        </button>
      </div>
    </div>
  )
}