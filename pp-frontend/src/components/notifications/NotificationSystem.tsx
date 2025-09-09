// frontend/src/components/notifications/NotificationSystem.tsx
'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  X,
  Check,
  Clock,
  Users,
  Gamepad2,
  Trophy,
  Gift,
  Star,
  Heart,
  MessageCircle,
  Settings,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Crown,
  Shield,
  Target,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react'

interface Notification {
  id: string
  type: 'friend_request' | 'game_invite' | 'achievement' | 'system' | 'event' | 'message' | 'gift' | 'announcement'
  title: string
  message: string
  data?: any
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isRead: boolean
  isArchived: boolean
  createdAt: Date
  expiresAt?: Date
  actionUrl?: string
  actions?: NotificationAction[]
  sender?: {
    id: string
    username: string
    avatar: string
  }
  groupId?: string
}

interface NotificationAction {
  id: string
  label: string
  action: 'accept' | 'decline' | 'join' | 'view' | 'dismiss' | 'custom'
  style: 'primary' | 'secondary' | 'danger'
  data?: any
}

interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  email: boolean
  types: {
    friend_requests: boolean
    game_invites: boolean
    achievements: boolean
    system: boolean
    events: boolean
    messages: boolean
    gifts: boolean
    announcements: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  priority: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
}

interface NotificationSystemProps {
  notifications: Notification[]
  settings: NotificationSettings
  unreadCount: number
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onArchive: (notificationId: string) => void
  onDelete: (notificationId: string) => void
  onAction: (notificationId: string, actionId: string, data?: any) => void
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void
  onRequestPermission: () => void
}

export default function NotificationSystem({
  notifications,
  settings,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onAction,
  onUpdateSettings,
  onRequestPermission
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [playSound, setPlaySound] = useState(true)
  
  // 실시간 알림 표시용 상태
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([])

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(notification => {
        if (activeTab === 'unread' && notification.isRead) return false
        if (activeTab === 'archived' && !notification.isArchived) return false
        if (activeTab === 'all' && notification.isArchived) return false
        if (filterType !== 'all' && notification.type !== filterType) return false
        if (filterPriority !== 'all' && notification.priority !== filterPriority) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, activeTab, filterType, filterPriority])

  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'friend_request': return <Users className="w-5 h-5" />
      case 'game_invite': return <Gamepad2 className="w-5 h-5" />
      case 'achievement': return <Trophy className="w-5 h-5" />
      case 'system': return <Settings className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'message': return <MessageCircle className="w-5 h-5" />
      case 'gift': return <Gift className="w-5 h-5" />
      case 'announcement': return <Bell className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }, [])

  const getPriorityColor = useCallback((priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
    }
  }, [])

  const getTypeColor = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'friend_request': return 'text-blue-400'
      case 'game_invite': return 'text-purple-400'
      case 'achievement': return 'text-yellow-400'
      case 'system': return 'text-gray-400'
      case 'event': return 'text-green-400'
      case 'message': return 'text-cyan-400'
      case 'gift': return 'text-pink-400'
      case 'announcement': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }, [])

  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }, [])

  const handleNotificationAction = useCallback((notification: Notification, actionId: string) => {
    onAction(notification.id, actionId, notification.data)
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }, [onAction, onMarkAsRead])

  const handleBulkAction = useCallback((action: 'read' | 'archive' | 'delete') => {
    selectedNotifications.forEach(notificationId => {
      switch (action) {
        case 'read':
          onMarkAsRead(notificationId)
          break
        case 'archive':
          onArchive(notificationId)
          break
        case 'delete':
          onDelete(notificationId)
          break
      }
    })
    setSelectedNotifications([])
  }, [selectedNotifications, onMarkAsRead, onArchive, onDelete])

  // 새로운 알림이 추가될 때 토스트 표시
  useEffect(() => {
    const newNotifications = notifications.filter(
      notification => !notification.isRead && 
      Date.now() - notification.createdAt.getTime() < 5000 // 5초 이내
    )

    newNotifications.forEach(notification => {
      if (!toastNotifications.find(toast => toast.id === notification.id)) {
        setToastNotifications(prev => [...prev, notification])
        
        // 사운드 재생
        if (settings.sound && playSound) {
          const audio = new Audio('/notification.mp3')
          audio.volume = 0.5
          audio.play().catch(() => {}) // 에러 무시
        }

        // 데스크톱 알림
        if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          })
        }

        // 3초 후 토스트 제거
        setTimeout(() => {
          setToastNotifications(prev => prev.filter(toast => toast.id !== notification.id))
        }, 3000)
      }
    })
  }, [notifications, settings.sound, settings.desktop, playSound, toastNotifications])

  const removeToast = useCallback((notificationId: string) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== notificationId))
  }, [])

  return (
    <>
      {/* Notification Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-lg transition-colors relative ${
            unreadCount > 0 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </motion.button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-96 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">알림</h3>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsOpen(false)}
                      className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                  {(['all', 'unread', 'archived'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {tab === 'all' && '전체'}
                      {tab === 'unread' && '읽지않음'}
                      {tab === 'archived' && '보관됨'}
                      {tab === 'unread' && unreadCount > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex space-x-2 mt-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600"
                  >
                    <option value="all">모든 타입</option>
                    <option value="friend_request">친구 요청</option>
                    <option value="game_invite">게임 초대</option>
                    <option value="achievement">업적</option>
                    <option value="system">시스템</option>
                    <option value="event">이벤트</option>
                    <option value="message">메시지</option>
                    <option value="gift">선물</option>
                    <option value="announcement">공지</option>
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600"
                  >
                    <option value="all">모든 우선순위</option>
                    <option value="urgent">긴급</option>
                    <option value="high">높음</option>
                    <option value="normal">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedNotifications.length > 0 && (
                  <div className="flex items-center justify-between mt-3 p-2 bg-gray-700 rounded-lg">
                    <span className="text-sm text-white">{selectedNotifications.length}개 선택됨</span>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBulkAction('read')}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        읽음 표시
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBulkAction('archive')}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500"
                      >
                        보관
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBulkAction('delete')}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        삭제
                      </motion.button>
                    </div>
                  </div>
                )}

                {activeTab === 'unread' && unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onMarkAllAsRead}
                    className="w-full mt-2 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    모두 읽음 표시
                  </motion.button>
                )}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                          notification.isRead 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-750 hover:bg-gray-600 border-l-2 border-blue-500'
                        }`}
                        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              if (e.target.checked) {
                                setSelectedNotifications(prev => [...prev, notification.id])
                              } else {
                                setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                              }
                            }}
                            className="mt-1 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />

                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)} bg-opacity-20`}>
                            <div className={getTypeColor(notification.type)}>
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                                  {notification.title}
                                </h4>
                                <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-400' : 'text-gray-300'}`}>
                                  {notification.message}
                                </p>
                                
                                {notification.sender && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <img
                                      src={notification.sender.avatar}
                                      alt={notification.sender.username}
                                      className="w-4 h-4 rounded-full"
                                    />
                                    <span className="text-xs text-gray-400">{notification.sender.username}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                                  {notification.expiresAt && (
                                    <span className="text-xs text-orange-400 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      만료: {formatTimeAgo(notification.expiresAt)}
                                    </span>
                                  )}
                                </div>

                                {/* Actions */}
                                {notification.actions && notification.actions.length > 0 && (
                                  <div className="flex space-x-2 mt-3">
                                    {notification.actions.map((action) => (
                                      <motion.button
                                        key={action.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleNotificationAction(notification, action.id)
                                        }}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${
                                          action.style === 'primary' 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : action.style === 'danger'
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-gray-600 text-white hover:bg-gray-500'
                                        }`}
                                      >
                                        {action.label}
                                      </motion.button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* More Actions */}
                              <div className="relative ml-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Toggle more actions menu
                                  }}
                                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                                >
                                  <MoreVertical className="w-3 h-3 text-gray-400" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Priority Indicator */}
                            {notification.priority !== 'normal' && (
                              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Bell className="w-12 h-12 mb-3" />
                    <p className="text-sm">
                      {activeTab === 'unread' && '읽지 않은 알림이 없습니다'}
                      {activeTab === 'archived' && '보관된 알림이 없습니다'}
                      {activeTab === 'all' && '알림이 없습니다'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        <AnimatePresence>
          {toastNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.3 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)} bg-opacity-20 flex-shrink-0`}>
                  <div className={getTypeColor(notification.type)}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white">{notification.title}</h4>
                  <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                  {notification.sender && (
                    <div className="flex items-center space-x-2 mt-2">
                      <img
                        src={notification.sender.avatar}
                        alt={notification.sender.username}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-xs text-gray-400">{notification.sender.username}</span>
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeToast(notification.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-6">알림 설정</h3>

              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h4 className="font-medium text-white mb-3">일반 설정</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">알림 활성화</span>
                      <button
                        onClick={() => onUpdateSettings({ enabled: !settings.enabled })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.enabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">사운드</span>
                      <button
                        onClick={() => onUpdateSettings({ sound: !settings.sound })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.sound ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.sound ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">데스크톱 알림</span>
                      <button
                        onClick={() => {
                          if (!settings.desktop) {
                            onRequestPermission()
                          }
                          onUpdateSettings({ desktop: !settings.desktop })
                        }}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.desktop ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.desktop ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h4 className="font-medium text-white mb-3">알림 타입</h4>
                  <div className="space-y-2">
                    {Object.entries(settings.types).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-gray-300">
                          {type === 'friend_requests' && '친구 요청'}
                          {type === 'game_invites' && '게임 초대'}
                          {type === 'achievements' && '업적'}
                          {type === 'system' && '시스템'}
                          {type === 'events' && '이벤트'}
                          {type === 'messages' && '메시지'}
                          {type === 'gifts' && '선물'}
                          {type === 'announcements' && '공지사항'}
                        </span>
                        <button
                          onClick={() => onUpdateSettings({
                            types: { ...settings.types, [type]: !enabled }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            enabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Settings */}
                <div>
                  <h4 className="font-medium text-white mb-3">우선순위 필터</h4>
                  <div className="space-y-2">
                    {Object.entries(settings.priority).map(([priority, enabled]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="text-gray-300">
                          {priority === 'urgent' && '긴급'}
                          {priority === 'high' && '높음'}
                          {priority === 'normal' && '보통'}
                          {priority === 'low' && '낮음'}
                        </span>
                        <button
                          onClick={() => onUpdateSettings({
                            priority: { ...settings.priority, [priority]: !enabled }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            enabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  완료
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}