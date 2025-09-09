// frontend/src/components/admin/NotificationCenter.tsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  MessageCircle,
  CreditCard,
  User,
  Server,
  AlertTriangle,
  Circle,
  Clock,
  Settings
} from 'lucide-react'
import { useRealtimeNotifications, RealtimeNotification, createMockNotification } from '@/hooks/useRealtimeNotifications'

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  } = useRealtimeNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'chat' | 'payment' | 'user' | 'system' | 'error'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 개발용 모의 알림 생성
  const addMockNotification = () => {
    // 이 함수는 실제로는 서버에서 WebSocket을 통해 알림이 올 것입니다
    console.log('Mock notification would be sent from server')
  }

  const getNotificationIcon = (type: RealtimeNotification['type']) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'chat':
        return <MessageCircle className={`${iconClass} text-blue-600`} />
      case 'payment':
        return <CreditCard className={`${iconClass} text-green-600`} />
      case 'user':
        return <User className={`${iconClass} text-purple-600`} />
      case 'system':
        return <Server className={`${iconClass} text-orange-600`} />
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-600`} />
      default:
        return <Bell className={`${iconClass} text-gray-600`} />
    }
  }

  const getPriorityColor = (priority: RealtimeNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'all') return true
    return notification.type === filter
  })

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {/* Connection Status */}
        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  알림
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                
                <div className="flex items-center gap-1">
                  {/* Connection Status */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    isConnected 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <Circle className={`w-2 h-2 fill-current ${
                      isConnected ? 'text-green-500' : 'text-red-500'
                    }`} />
                    {isConnected ? '실시간' : '연결 끊김'}
                  </div>
                  
                  {/* Dev: Add Mock Notification */}
                  <button
                    onClick={addMockNotification}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="테스트 알림 추가"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { key: 'all', label: '전체', count: notifications.length },
                  { key: 'unread', label: '읽지않음', count: unreadCount },
                  { key: 'chat', label: '채팅', count: notifications.filter(n => n.type === 'chat').length },
                  { key: 'payment', label: '결제', count: notifications.filter(n => n.type === 'payment').length },
                  { key: 'system', label: '시스템', count: notifications.filter(n => n.type === 'system').length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                      filter === tab.key
                        ? 'bg-flutter-blue-100 text-flutter-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} {tab.count > 0 && `(${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-flutter-blue-600 hover:text-flutter-blue-700 font-medium flex items-center gap-1"
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="w-3 h-3" />
                    모두 읽음
                  </button>
                  
                  <span className="text-gray-300">|</span>
                  
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    모두 삭제
                  </button>
                </div>
                
                <span className="text-xs text-gray-500">
                  {filteredNotifications.length}개 알림
                </span>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                        getPriorityColor(notification.priority)
                      } ${!notification.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-flutter-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                                {notification.userId && (
                                  <>
                                    <span>•</span>
                                    <User className="w-3 h-3" />
                                    {notification.userId}
                                  </>
                                )}
                              </div>
                              
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                notification.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                notification.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {notification.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="p-1 text-gray-400 hover:text-flutter-blue-600 transition-colors"
                              title="읽음 처리"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="삭제"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}