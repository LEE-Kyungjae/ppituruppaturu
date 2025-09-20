// frontend/src/components/admin/AdminDashboard.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Users,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Heart,
  Star,
  DollarSign,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Settings,
  Database,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Target,
  Zap,
  Crown,
  Trophy,
  Gift,
  Bell,
  Mail,
  Phone,
  Globe,
  MapPin,
  Cpu,
  HardDrive,
  MemoryStick
} from 'lucide-react'

interface SystemMetrics {
  users: {
    total: number
    online: number
    registered24h: number
    activeUsers: number
    retentionRate: number
  }
  games: {
    totalPlayed: number
    activeSessions: number
    averageSessionTime: number
    popularGames: Array<{ name: string; players: number; growth: number }>
  }
  content: {
    totalPosts: number
    postsToday: number
    totalComments: number
    commentsToday: number
    totalLikes: number
    likesToday: number
  }
  revenue: {
    totalRevenue: number
    monthlyRevenue: number
    averageRevenuePerUser: number
    premiumUsers: number
    conversionRate: number
  }
  performance: {
    serverLoad: number
    responseTime: number
    uptime: number
    errorRate: number
    bandwidth: number
  }
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface UserActivity {
  timestamp: Date
  user: string
  action: string
  details: string
  ip: string
}

interface AdminDashboardProps {
  metrics: SystemMetrics
  alerts: SystemAlert[]
  recentActivity: UserActivity[]
  onRefresh: () => void
  onExportData: (type: string) => void
  onResolveAlert: (alertId: string) => void
}

export default function AdminDashboard({
  metrics,
  alerts,
  recentActivity,
  onRefresh,
  onExportData,
  onResolveAlert
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'games' | 'system' | 'alerts'>('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h')
  const [selectedAlertType, setSelectedAlertType] = useState<string>('all')

  const criticalAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'critical' && !alert.isRead)
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (selectedAlertType === 'all') return true
      return alert.type === selectedAlertType
    })
  }, [alerts, selectedAlertType])

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-400' : 'text-red-400'
  }

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'info': return <Bell className="w-5 h-5" />
      case 'success': return <CheckCircle className="w-5 h-5" />
    }
  }

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      case 'success': return 'text-green-400'
    }
  }

  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
    }
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">관리자 대시보드</h2>
        </div>

        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {(['overview', 'users', 'content', 'games', 'system', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab === 'overview' && <BarChart3 className="w-4 h-4" />}
                  {tab === 'users' && <Users className="w-4 h-4" />}
                  {tab === 'content' && <MessageCircle className="w-4 h-4" />}
                  {tab === 'games' && <Gamepad2 className="w-4 h-4" />}
                  {tab === 'system' && <Server className="w-4 h-4" />}
                  {tab === 'alerts' && <AlertTriangle className="w-4 h-4" />}
                  <span>
                    {tab === 'overview' && '개요'}
                    {tab === 'users' && '사용자'}
                    {tab === 'content' && '컨텐츠'}
                    {tab === 'games' && '게임'}
                    {tab === 'system' && '시스템'}
                    {tab === 'alerts' && '알림'}
                  </span>
                </div>
                {tab === 'alerts' && criticalAlerts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {criticalAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* System Status */}
          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              시스템 상태
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">서버 상태</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-400">온라인</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">CPU 사용률</span>
                <span className="text-xs text-white">{metrics.performance.serverLoad}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">응답시간</span>
                <span className="text-xs text-white">{metrics.performance.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">가동시간</span>
                <span className="text-xs text-green-400">{metrics.performance.uptime}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeTab === 'overview' && '시스템 개요'}
                {activeTab === 'users' && '사용자 관리'}
                {activeTab === 'content' && '컨텐츠 분석'}
                {activeTab === 'games' && '게임 통계'}
                {activeTab === 'system' && '시스템 모니터링'}
                {activeTab === 'alerts' && '알림 관리'}
              </h1>
              <p className="text-gray-400 mt-1">실시간 시스템 현황을 확인하고 관리하세요</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
              >
                <option value="24h">24시간</option>
                <option value="7d">7일</option>
                <option value="30d">30일</option>
                <option value="90d">90일</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onExportData(activeTab)}
                className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(12.5)}`}>
                        {getGrowthIcon(12.5)}
                        <span>+12.5%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatNumber(metrics.users.total)}</p>
                      <p className="text-sm text-gray-400">총 사용자</p>
                      <p className="text-xs text-green-400 mt-1">
                        {formatNumber(metrics.users.online)} 명 온라인
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(8.3)}`}>
                        {getGrowthIcon(8.3)}
                        <span>+8.3%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatNumber(metrics.games.totalPlayed)}</p>
                      <p className="text-sm text-gray-400">총 게임 수</p>
                      <p className="text-xs text-green-400 mt-1">
                        {formatNumber(metrics.games.activeSessions)} 세션 진행 중
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(15.7)}`}>
                        {getGrowthIcon(15.7)}
                        <span>+15.7%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">${formatNumber(metrics.revenue.totalRevenue)}</p>
                      <p className="text-sm text-gray-400">총 수익</p>
                      <p className="text-xs text-green-400 mt-1">
                        월 ${formatNumber(metrics.revenue.monthlyRevenue)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                        <Activity className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(-2.1)}`}>
                        {getGrowthIcon(-2.1)}
                        <span>-2.1%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{metrics.performance.uptime}%</p>
                      <p className="text-sm text-gray-400">서버 가동률</p>
                      <p className="text-xs text-green-400 mt-1">
                        {metrics.performance.responseTime}ms 평균 응답
                      </p>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">사용자 활동</h3>
                    <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>차트 데이터</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">수익 분석</h3>
                    <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                        <p>수익 차트</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Games */}
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">인기 게임</h3>
                  <div className="space-y-3">
                    {metrics.games.popularGames.map((game, index) => (
                      <div key={game.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 font-bold">#{index + 1}</span>
                          <span className="text-white font-medium">{game.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-300">{formatNumber(game.players)} 플레이어</span>
                          <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(game.growth)}`}>
                            {getGrowthIcon(game.growth)}
                            <span>{game.growth > 0 ? '+' : ''}{game.growth}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* Alert Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <select
                    value={selectedAlertType}
                    onChange={(e) => setSelectedAlertType(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  >
                    <option value="all">모든 알림</option>
                    <option value="error">오류</option>
                    <option value="warning">경고</option>
                    <option value="info">정보</option>
                    <option value="success">성공</option>
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">심각한 알림:</span>
                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm">
                      {criticalAlerts.length}
                    </span>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.isRead ? 'bg-gray-800' : 'bg-gray-750'
                      } ${
                        alert.type === 'error' ? 'border-red-500' :
                        alert.type === 'warning' ? 'border-yellow-500' :
                        alert.type === 'info' ? 'border-blue-500' :
                        'border-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={getAlertColor(alert.type)}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-medium ${alert.isRead ? 'text-gray-300' : 'text-white'}`}>
                                {alert.title}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)} text-white`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className={`text-sm ${alert.isRead ? 'text-gray-400' : 'text-gray-300'}`}>
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {alert.timestamp.toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        
                        {!alert.isRead && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onResolveAlert(alert.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            해결
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">모든 알림이 해결되었습니다</h3>
                    <p className="text-gray-400">시스템이 정상적으로 운영되고 있습니다</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* System Health */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                        <Cpu className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-400">CPU</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{metrics.performance.serverLoad}%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${metrics.performance.serverLoad}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                        <MemoryStick className="w-6 h-6 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-400">메모리</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">67%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <HardDrive className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-400">디스크</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">43%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '43%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">네트워크 상태</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">대역폭 사용량</span>
                        <span className="text-white">{formatNumber(metrics.performance.bandwidth)} MB/s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">평균 응답시간</span>
                        <span className="text-white">{metrics.performance.responseTime}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">에러율</span>
                        <span className={`${metrics.performance.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                          {metrics.performance.errorRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">가동시간</span>
                        <span className="text-green-400">{metrics.performance.uptime}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">최근 활동</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {recentActivity.slice(0, 10).map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 bg-gray-700 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{activity.action}</p>
                            <p className="text-xs text-gray-400">{activity.user} - {activity.timestamp.toLocaleTimeString('ko-KR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}