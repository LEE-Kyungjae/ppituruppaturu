// frontend/src/hooks/useRealtimeNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export interface RealtimeNotification {
  id: string
  type: 'chat' | 'payment' | 'user' | 'system' | 'error'
  title: string
  message: string
  userId?: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  data?: any // 추가 데이터
}

interface UseRealtimeNotificationsOptions {
  wsUrl?: string
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useRealtimeNotifications({
  wsUrl = 'ws://localhost:8080/ws/admin',
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseRealtimeNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('📡 실시간 알림 연결됨')
        setIsConnected(true)
        setReconnectAttempts(0)
        
        // 인증 토큰 전송
        const token = localStorage.getItem('admin_token')
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'notification') {
            const notification: RealtimeNotification = {
              id: data.id || Date.now().toString(),
              type: data.notificationType || 'system',
              title: data.title,
              message: data.message,
              userId: data.userId,
              timestamp: data.timestamp || new Date().toISOString(),
              read: false,
              priority: data.priority || 'medium',
              data: data.data
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 99)]) // 최대 100개 유지
            setUnreadCount(prev => prev + 1)
            
            // 브라우저 알림 (권한이 있는 경우)
            if (Notification.permission === 'granted' && notification.priority !== 'low') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
              })
            }
            
            // 소리 알림 (critical 우선순위)
            if (notification.priority === 'critical') {
              playNotificationSound()
            }
          } else if (data.type === 'ping') {
            // 서버 ping에 대한 pong 응답
            ws.send(JSON.stringify({ type: 'pong' }))
          }
        } catch (error) {
          console.error('알림 데이터 파싱 오류:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('📡 실시간 알림 연결 해제됨')
        setIsConnected(false)
        wsRef.current = null
        
        // 자동 재연결 (최대 시도 횟수 내에서)
        if (autoConnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('WebSocket 연결 실패:', error)
    }
  }, [wsUrl, autoConnect, reconnectAttempts, maxReconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId)
      return notification && !notification.read ? prev - 1 : prev
    })
  }, [notifications])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  // 알림 소리 재생
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // 소리 재생 실패시 무시 (브라우저 정책)
    })
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, autoConnect])

  // 브라우저 알림 권한 자동 요청
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  return {
    notifications,
    unreadCount,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestNotificationPermission
  }
}

// 모의 알림 생성 함수 (개발용)
export function createMockNotification(): RealtimeNotification {
  const types: RealtimeNotification['type'][] = ['chat', 'payment', 'user', 'system', 'error']
  const priorities: RealtimeNotification['priority'][] = ['low', 'medium', 'high', 'critical']
  
  const mockMessages = {
    chat: ['새 메시지가 도착했습니다', '사용자가 질문을 남겼습니다'],
    payment: ['새 결제가 완료되었습니다', '결제 오류가 발생했습니다'],
    user: ['새 회원이 가입했습니다', '회원이 탈퇴했습니다'],
    system: ['시스템 업데이트가 완료되었습니다', '서버 재시작이 필요합니다'],
    error: ['데이터베이스 연결 오류', '외부 API 응답 없음']
  }
  
  const type = types[Math.floor(Math.random() * types.length)]
  const priority = priorities[Math.floor(Math.random() * priorities.length)]
  const messages = mockMessages[type]
  const message = messages[Math.floor(Math.random() * messages.length)]
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    title: `${type.toUpperCase()} 알림`,
    message,
    userId: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 1000)}` : undefined,
    timestamp: new Date().toISOString(),
    read: false,
    priority,
    data: { mockData: true }
  }
}