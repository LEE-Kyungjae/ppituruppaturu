// frontend/src/components/admin/DashboardStats.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CreditCard,
  Target,
  Activity,
  Zap
} from 'lucide-react'

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
  description?: string
}

interface RevenueStats {
  todayRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
}

interface UserEngagementStats {
  avgSessionTime: number // minutes
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  avgGamesPerUser: number
  totalPlaytime: number // hours
}

export default function DashboardStats() {
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [engagementStats, setEngagementStats] = useState<UserEngagementStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // TODO: 실제 API 호출로 대체
        const mockRevenueStats: RevenueStats = {
          todayRevenue: 2450000,
          weeklyRevenue: 15800000,
          monthlyRevenue: 67200000,
          revenueGrowth: 12.5
        }

        const mockEngagementStats: UserEngagementStats = {
          avgSessionTime: 28.5,
          dailyActiveUsers: 3420,
          weeklyActiveUsers: 8930,
          monthlyActiveUsers: 24500,
          avgGamesPerUser: 4.2,
          totalPlaytime: 15847
        }

        setRevenueStats(mockRevenueStats)
        setEngagementStats(mockEngagementStats)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading || !revenueStats || !engagementStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const stats: StatCard[] = [
    {
      title: '오늘 매출',
      value: `${(revenueStats.todayRevenue / 10000).toFixed(0)}만원`,
      change: '+8.2%',
      changeType: 'increase',
      icon: CreditCard,
      color: 'green',
      description: '어제 대비'
    },
    {
      title: '이번 주 매출',
      value: `${(revenueStats.weeklyRevenue / 10000).toFixed(0)}만원`,
      change: `+${revenueStats.revenueGrowth}%`,
      changeType: 'increase',
      icon: TrendingUp,
      color: 'blue',
      description: '지난주 대비'
    },
    {
      title: '평균 세션 시간',
      value: `${engagementStats.avgSessionTime.toFixed(1)}분`,
      change: '+3.8%',
      changeType: 'increase',
      icon: Clock,
      color: 'purple',
      description: '지난 30일 평균'
    },
    {
      title: '일일 활성 사용자',
      value: engagementStats.dailyActiveUsers.toLocaleString(),
      change: '+5.2%',
      changeType: 'increase',
      icon: Users,
      color: 'orange',
      description: '어제 대비'
    },
    {
      title: '월간 매출',
      value: `${(revenueStats.monthlyRevenue / 100000000).toFixed(1)}억원`,
      change: '+15.3%',
      changeType: 'increase',
      icon: Target,
      color: 'indigo',
      description: '지난달 대비'
    },
    {
      title: '월간 활성 사용자',
      value: `${(engagementStats.monthlyActiveUsers / 1000).toFixed(1)}K`,
      change: '+18.7%',
      changeType: 'increase',
      icon: Activity,
      color: 'pink',
      description: '지난달 대비'
    },
    {
      title: '평균 게임 플레이',
      value: `${engagementStats.avgGamesPerUser.toFixed(1)}회`,
      change: '+2.1%',
      changeType: 'increase',
      icon: Zap,
      color: 'yellow',
      description: '사용자당'
    },
    {
      title: '총 플레이 타임',
      value: `${(engagementStats.totalPlaytime / 1000).toFixed(1)}K시간`,
      change: '+22.4%',
      changeType: 'increase',
      icon: Clock,
      color: 'cyan',
      description: '이번 달'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      cyan: 'bg-cyan-100 text-cyan-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Revenue Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          매출 현황
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.slice(0, 3).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : stat.changeType === 'decrease' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : null}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' :
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                    {stat.description && (
                      <span className="text-xs text-gray-500 ml-1">
                        {stat.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* User Engagement Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          사용자 활동
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.slice(3).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 3) * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : stat.changeType === 'decrease' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' :
                    stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  {stat.description && (
                    <span className="text-xs text-gray-500">
                      {stat.description}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-flutter-blue-50 to-flutter-purple-50 rounded-2xl p-6 border border-flutter-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          주요 인사이트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📈 매출 성장</h4>
            <p className="text-sm text-gray-600">
              이번 주 매출이 지난 주 대비 <strong className="text-green-600">{revenueStats.revenueGrowth}%</strong> 증가했습니다. 
              결제 성공률도 95.2%로 우수한 수준을 유지하고 있습니다.
            </p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">⏱️ 사용자 참여도</h4>
            <p className="text-sm text-gray-600">
              평균 세션 시간이 <strong className="text-purple-600">{engagementStats.avgSessionTime.toFixed(1)}분</strong>으로 
              업계 평균(22분)보다 높은 수치를 기록하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}