// frontend/src/components/analytics/AnalyticsSystem.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Activity,
  Clock,
  Calendar,
  Target,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Gamepad2,
  Trophy,
  Star,
  Zap,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUp,
  ArrowDown,
  Minus,
  Info
} from 'lucide-react'

interface AnalyticsData {
  userAnalytics: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    churnRate: number
    retentionRate: number
    averageSessionTime: number
    sessionsPerUser: number
    bounceRate: number
    userGrowthRate: number
    demographics: {
      ageGroups: Array<{ range: string; count: number; percentage: number }>
      countries: Array<{ name: string; count: number; percentage: number }>
      devices: Array<{ type: string; count: number; percentage: number }>
    }
  }
  gameAnalytics: {
    totalGamesPlayed: number
    averageGameDuration: number
    mostPopularGames: Array<{ name: string; plays: number; avgDuration: number; retention: number }>
    gameCompletionRate: number
    averageRating: number
    totalRatings: number
    gameEngagement: {
      daily: number[]
      weekly: number[]
      monthly: number[]
    }
  }
  contentAnalytics: {
    totalContent: number
    totalViews: number
    totalLikes: number
    totalShares: number
    averageEngagement: number
    topContent: Array<{ title: string; views: number; engagement: number; type: string }>
    engagementTrends: {
      views: number[]
      likes: number[]
      comments: number[]
      shares: number[]
    }
  }
  revenueAnalytics: {
    totalRevenue: number
    monthlyRecurringRevenue: number
    averageRevenuePerUser: number
    conversionRate: number
    churnValue: number
    lifetimeValue: number
    revenueGrowth: number
    topProducts: Array<{ name: string; revenue: number; sales: number; conversionRate: number }>
    revenueBreakdown: {
      subscriptions: number
      oneTime: number
      inApp: number
      ads: number
    }
  }
  performanceMetrics: {
    pageLoadTime: number
    serverResponseTime: number
    errorRate: number
    uptime: number
    bandwidthUsage: number
    databasePerformance: number
  }
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  timeRange: '24h' | '7d' | '30d' | '90d' | '1y'
  metric: string
}

interface AnalyticsSystemProps {
  data: AnalyticsData
  onRefresh: () => void
  onExportData: (section: string, format: string) => void
  onUpdateConfig: (config: ChartConfig) => void
}

export default function AnalyticsSystem({
  data,
  onRefresh,
  onExportData,
  onUpdateConfig
}: AnalyticsSystemProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'games' | 'content' | 'revenue' | 'performance'>('overview')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('users')

  const overviewMetrics = useMemo(() => [
    {
      title: '총 사용자',
      value: data.userAnalytics.totalUsers,
      change: data.userAnalytics.userGrowthRate,
      icon: Users,
      color: 'blue'
    },
    {
      title: '활성 사용자',
      value: data.userAnalytics.activeUsers,
      change: 12.5,
      icon: Activity,
      color: 'green'
    },
    {
      title: '총 수익',
      value: `$${formatNumber(data.revenueAnalytics.totalRevenue)}`,
      change: data.revenueAnalytics.revenueGrowth,
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: '게임 플레이',
      value: data.gameAnalytics.totalGamesPlayed,
      change: 8.3,
      icon: Gamepad2,
      color: 'purple'
    }
  ], [data])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4" />
    if (change < 0) return <ArrowDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">데이터 분석</h2>
        </div>

        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {(['overview', 'users', 'games', 'content', 'revenue', 'performance'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab === 'overview' && <BarChart3 className="w-4 h-4" />}
                {tab === 'users' && <Users className="w-4 h-4" />}
                {tab === 'games' && <Gamepad2 className="w-4 h-4" />}
                {tab === 'content' && <MessageCircle className="w-4 h-4" />}
                {tab === 'revenue' && <DollarSign className="w-4 h-4" />}
                {tab === 'performance' && <Activity className="w-4 h-4" />}
                <span>
                  {tab === 'overview' && '개요'}
                  {tab === 'users' && '사용자'}
                  {tab === 'games' && '게임'}
                  {tab === 'content' && '컨텐츠'}
                  {tab === 'revenue' && '수익'}
                  {tab === 'performance' && '성능'}
                </span>
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-3">빠른 통계</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>일일 활성 사용자</span>
                <span>{formatNumber(data.userAnalytics.activeUsers)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>평균 세션 시간</span>
                <span>{formatTime(data.userAnalytics.averageSessionTime)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>전환율</span>
                <span>{formatPercentage(data.revenueAnalytics.conversionRate)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>서버 가동률</span>
                <span className="text-green-400">{formatPercentage(data.performanceMetrics.uptime)}</span>
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
                {activeTab === 'overview' && '분석 개요'}
                {activeTab === 'users' && '사용자 분석'}
                {activeTab === 'games' && '게임 분석'}
                {activeTab === 'content' && '컨텐츠 분석'}
                {activeTab === 'revenue' && '수익 분석'}
                {activeTab === 'performance' && '성능 분석'}
              </h1>
              <p className="text-gray-400 mt-1">상세한 데이터 분석과 인사이트를 확인하세요</p>
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
                <option value="1y">1년</option>
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
                onClick={() => onExportData(activeTab, 'csv')}
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
                  {overviewMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800 p-6 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 bg-${metric.color}-600 bg-opacity-20 rounded-lg`}>
                          <metric.icon className={`w-6 h-6 text-${metric.color}-400`} />
                        </div>
                        <div className={`flex items-center space-x-1 text-sm ${getChangeColor(metric.change)}`}>
                          {getChangeIcon(metric.change)}
                          <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}</p>
                        <p className="text-sm text-gray-400">{metric.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <LineChart className="w-5 h-5 mr-2" />
                      사용자 성장 추세
                    </h3>
                    <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                        <p>사용자 성장 차트</p>
                        <p className="text-sm">지난 30일 동안 +{data.userAnalytics.userGrowthRate}% 성장</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      수익 분석
                    </h3>
                    <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <DollarSign className="w-12 h-12 mx-auto mb-2" />
                        <p>수익 차트</p>
                        <p className="text-sm">월간 수익: {formatCurrency(data.revenueAnalytics.monthlyRecurringRevenue)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">사용자 참여도</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">평균 세션 시간</span>
                        <span className="text-white">{formatTime(data.userAnalytics.averageSessionTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">세션당 사용자</span>
                        <span className="text-white">{data.userAnalytics.sessionsPerUser.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">이탈률</span>
                        <span className="text-white">{formatPercentage(data.userAnalytics.bounceRate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">유지율</span>
                        <span className="text-green-400">{formatPercentage(data.userAnalytics.retentionRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">게임 성과</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">평균 게임 시간</span>
                        <span className="text-white">{formatTime(data.gameAnalytics.averageGameDuration)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">완료율</span>
                        <span className="text-white">{formatPercentage(data.gameAnalytics.gameCompletionRate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">평균 평점</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-white">{data.gameAnalytics.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">총 평가</span>
                        <span className="text-white">{formatNumber(data.gameAnalytics.totalRatings)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">컨텐츠 성과</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">총 조회수</span>
                        <span className="text-white">{formatNumber(data.contentAnalytics.totalViews)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">총 좋아요</span>
                        <span className="text-white">{formatNumber(data.contentAnalytics.totalLikes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">총 공유</span>
                        <span className="text-white">{formatNumber(data.contentAnalytics.totalShares)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">평균 참여도</span>
                        <span className="text-green-400">{formatPercentage(data.contentAnalytics.averageEngagement)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* User Metrics */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">신규 사용자</h3>
                      <UserPlus className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{formatNumber(data.userAnalytics.newUsers)}</p>
                    <p className="text-sm text-gray-400">이번 달 신규 가입자</p>
                    <div className="flex items-center mt-2 text-sm text-green-400">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>+{data.userAnalytics.userGrowthRate}%</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">활성 사용자</h3>
                      <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{formatNumber(data.userAnalytics.activeUsers)}</p>
                    <p className="text-sm text-gray-400">일일 활성 사용자</p>
                    <div className="flex items-center mt-2 text-sm text-blue-400">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{formatPercentage(data.userAnalytics.activeUsers / data.userAnalytics.totalUsers * 100)} 참여율</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">유지율</h3>
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{formatPercentage(data.userAnalytics.retentionRate)}</p>
                    <p className="text-sm text-gray-400">30일 유지율</p>
                    <div className="flex items-center mt-2 text-sm text-red-400">
                      <UserMinus className="w-4 h-4 mr-1" />
                      <span>{formatPercentage(data.userAnalytics.churnRate)} 이탈률</span>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">연령대 분포</h3>
                    <div className="space-y-3">
                      {data.userAnalytics.demographics.ageGroups.map((group) => (
                        <div key={group.range} className="flex items-center justify-between">
                          <span className="text-gray-300">{group.range}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${group.percentage}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12 text-right">{formatPercentage(group.percentage)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">지역 분포</h3>
                    <div className="space-y-3">
                      {data.userAnalytics.demographics.countries.slice(0, 5).map((country) => (
                        <div key={country.name} className="flex items-center justify-between">
                          <span className="text-gray-300">{country.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${country.percentage}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12 text-right">{formatPercentage(country.percentage)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">디바이스 분포</h3>
                    <div className="space-y-3">
                      {data.userAnalytics.demographics.devices.map((device) => (
                        <div key={device.type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {device.type === 'mobile' && <Smartphone className="w-4 h-4 text-gray-400" />}
                            {device.type === 'desktop' && <Monitor className="w-4 h-4 text-gray-400" />}
                            {device.type === 'tablet' && <Tablet className="w-4 h-4 text-gray-400" />}
                            <span className="text-gray-300">{device.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${device.percentage}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12 text-right">{formatPercentage(device.percentage)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'revenue' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* Revenue Overview */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">총 수익</h3>
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.revenueAnalytics.totalRevenue)}</p>
                    <div className="flex items-center mt-2 text-sm text-green-400">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>+{data.revenueAnalytics.revenueGrowth}%</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">월간 수익</h3>
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.revenueAnalytics.monthlyRecurringRevenue)}</p>
                    <p className="text-sm text-gray-400">월간 반복 수익</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">ARPU</h3>
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.revenueAnalytics.averageRevenuePerUser)}</p>
                    <p className="text-sm text-gray-400">사용자당 평균 수익</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">전환율</h3>
                      <Target className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatPercentage(data.revenueAnalytics.conversionRate)}</p>
                    <p className="text-sm text-gray-400">무료→유료 전환</p>
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">수익 구성</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">구독</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(data.revenueAnalytics.revenueBreakdown.subscriptions / data.revenueAnalytics.totalRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-white">{formatCurrency(data.revenueAnalytics.revenueBreakdown.subscriptions)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">일회성 구매</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(data.revenueAnalytics.revenueBreakdown.oneTime / data.revenueAnalytics.totalRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-white">{formatCurrency(data.revenueAnalytics.revenueBreakdown.oneTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">인앱 구매</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(data.revenueAnalytics.revenueBreakdown.inApp / data.revenueAnalytics.totalRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-white">{formatCurrency(data.revenueAnalytics.revenueBreakdown.inApp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">광고</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${(data.revenueAnalytics.revenueBreakdown.ads / data.revenueAnalytics.totalRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-white">{formatCurrency(data.revenueAnalytics.revenueBreakdown.ads)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">인기 상품</h3>
                    <div className="space-y-3">
                      {data.revenueAnalytics.topProducts.map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-400 font-bold">#{index + 1}</span>
                            <span className="text-white font-medium">{product.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-gray-400">{product.sales} 판매 • {formatPercentage(product.conversionRate)} 전환</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Revenue Metrics */}
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">추가 지표</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatCurrency(data.revenueAnalytics.lifetimeValue)}</p>
                      <p className="text-sm text-gray-400">고객 생애 가치 (LTV)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatCurrency(data.revenueAnalytics.churnValue)}</p>
                      <p className="text-sm text-gray-400">월간 이탈 손실</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatPercentage(data.revenueAnalytics.conversionRate)}</p>
                      <p className="text-sm text-gray-400">전체 전환율</p>
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