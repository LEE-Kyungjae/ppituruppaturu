// frontend/src/pages/admin/index.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import axios from 'axios'
import AdminLayout from '@/components/admin/AdminLayout'
import RecentActivity from '@/components/admin/RecentActivity'
import SystemMonitor from '@/components/admin/SystemMonitor'
import AdminAuthService from '@/lib/admin/AdminAuthService'
import { 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react'

// Use the centralized admin auth service
const authService = AdminAuthService.getInstance();

interface DashboardData {
  uptime: string;
  totalUsers: number;
  activeUsers24h: number;
  newUsers24h: number;
  totalRevenue: number;
  revenue24h: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  paymentSuccessRate: number;
}

export default function AdminDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h') // 24h, 7d, 30d

  useEffect(() => {
    const loadDashboardData = async () => {
      // 인증 상태 확인
      if (!authService.isAuthenticated()) {
        router.push('/admin/login')
        return
      }

      try {
        // 실제 API 호출 시도 (백엔드가 준비되면)
        // const { data } = await authService.apiClient.get<DashboardData>('/api/v1/admin/stats');
        // setDashboardData(data);

        // 개발/프로덕션 모의 데이터
        const mockData: DashboardData = {
          uptime: '15일 7시간 32분',
          totalUsers: Math.floor(Math.random() * 500 + 1200), // 1200-1700
          activeUsers24h: Math.floor(Math.random() * 50 + 150), // 150-200
          newUsers24h: Math.floor(Math.random() * 20 + 15), // 15-35
          totalRevenue: Math.floor(Math.random() * 2000000 + 8000000), // 8M-10M
          revenue24h: Math.floor(Math.random() * 50000 + 100000), // 100k-150k
          totalPayments: Math.floor(Math.random() * 100 + 300), // 300-400
          successfulPayments: Math.floor(Math.random() * 80 + 280), // 280-360
          failedPayments: Math.floor(Math.random() * 15 + 5), // 5-20
          pendingPayments: Math.floor(Math.random() * 5 + 2), // 2-7
          paymentSuccessRate: Math.random() * 5 + 94 // 94-99%
        }

        // 실제 로딩 경험 시뮬레이션
        setTimeout(() => {
          setDashboardData(mockData)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('Dashboard data loading failed:', error)
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router, timeRange, authService])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-flutter-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">데이터 로드 실패</h2>
          <p className="text-gray-600">대시보드 데이터를 불러올 수 없습니다.</p>
        </div>
      </AdminLayout>
    )
  }

  const stats = [
    {
      title: '총 회원수',
      value: dashboardData.totalUsers.toLocaleString(),
      change: `+${dashboardData.newUsers24h} in 24h`,
      changeType: 'increase' as const,
      icon: Users,
      color: 'blue'
    },
    {
      title: '활성 회원수 (24h)',
      value: dashboardData.activeUsers24h.toLocaleString(),
      change: `${((dashboardData.activeUsers24h / dashboardData.totalUsers) * 100).toFixed(1)}%`,
      changeType: 'neutral' as const,
      icon: Activity,
      color: 'green'
    },
    {
      title: '총 매출',
      value: `${(dashboardData.totalRevenue / 1000000).toFixed(1)}M원`,
      change: `+${dashboardData.revenue24h.toLocaleString()} in 24h`,
      changeType: 'increase' as const,
      icon: CreditCard,
      color: 'purple'
    },
    {
      title: '오늘 매출',
      value: `${(dashboardData.revenue24h / 10000).toFixed(0)}만원`,
      change: '오늘',
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'orange'
    }
  ]

  const paymentStats = [
    {
      title: '총 결제건수',
      value: dashboardData.totalPayments.toLocaleString(),
      color: 'blue'
    },
    {
      title: '성공',
      value: dashboardData.successfulPayments.toLocaleString(),
      color: 'green'
    },
    {
      title: '실패',
      value: dashboardData.failedPayments.toLocaleString(),
      color: 'red'
    },
    {
      title: '대기',
      value: dashboardData.pendingPayments.toLocaleString(),
      color: 'yellow'
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
            >
              <option value="24h">최근 24시간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
            </select>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.changeType === 'increase' ? 'text-green-600' : 'text-gray-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">결제 현황</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {paymentStats.map((stat, index) => (
              <div key={stat.title} className="text-center">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-xl font-bold ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : stat.color === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">결제 성공률</span>
              <span className="text-lg font-bold text-green-600">
                {dashboardData.paymentSuccessRate.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${dashboardData.paymentSuccessRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* System Monitor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SystemMonitor />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <RecentActivity />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/admin/users')}
              className="p-4 bg-flutter-blue-50 rounded-xl hover:bg-flutter-blue-100 transition-colors duration-200 text-center"
            >
              <Users className="w-6 h-6 text-flutter-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-flutter-blue-600">회원 관리</span>
            </button>
            
            <button 
              onClick={() => router.push('/admin/payments')}
              className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200 text-center"
            >
              <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-600">결제 관리</span>
            </button>
            
            <button className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200 text-center">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-600">이벤트 관리</span>
            </button>
            
            <button className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors duration-200 text-center">
              <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-orange-600">통계 분석</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}