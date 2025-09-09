// frontend/src/components/chat/ChatSystem.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
  type: 'user' | 'system' | 'admin'
  avatar?: string
}

interface ChatUser {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  isPremium: boolean
  role: 'user' | 'admin' | 'moderator'
}

interface ChatSystemProps {
  gameRoom?: string
  className?: string
  maxHeight?: string
}

const ChatSystem: React.FC<ChatSystemProps> = ({
  gameRoom = 'global',
  className = '',
  maxHeight = '400px'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 현재 사용자 정보 (실제로는 auth context에서 가져와야 함)
  const currentUser: ChatUser = {
    id: 'user123',
    username: '플레이어123',
    avatar: '🎮',
    isOnline: true,
    isPremium: false,
    role: 'user'
  }

  // WebSocket 연결 시뮬레이션
  useEffect(() => {
    // 실제로는 WebSocket 연결
    const connectChat = () => {
      setIsConnected(true)
      
      // 초기 메시지 로드
      setMessages([
        {
          id: '1',
          userId: 'system',
          username: '시스템',
          message: '게임 채팅에 오신 것을 환영합니다!',
          timestamp: new Date(Date.now() - 60000),
          type: 'system'
        },
        {
          id: '2',
          userId: 'user456',
          username: '게임러789',
          message: '안녕하세요! 같이 게임해요~',
          timestamp: new Date(Date.now() - 30000),
          type: 'user'
        }
      ])

      // 온라인 사용자 시뮬레이션
      setOnlineUsers([
        currentUser,
        {
          id: 'user456',
          username: '게임러789',
          avatar: '🏆',
          isOnline: true,
          isPremium: true,
          role: 'user'
        },
        {
          id: 'admin1',
          username: '운영자',
          avatar: '👨‍💼',
          isOnline: true,
          isPremium: true,
          role: 'admin'
        }
      ])
    }

    const timer = setTimeout(connectChat, 1000)
    
    return () => {
      clearTimeout(timer)
      setIsConnected(false)
    }
  }, [gameRoom])

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 메시지 전송
  const sendMessage = () => {
    if (!currentMessage.trim() || !isConnected) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      message: currentMessage.trim(),
      timestamp: new Date(),
      type: 'user'
    }

    setMessages(prev => [...prev, newMessage])
    setCurrentMessage('')
    
    // 실제로는 WebSocket으로 메시지 전송
    // websocket.send(JSON.stringify(newMessage))
  }

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 메시지 타입별 스타일
  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'system':
        return 'bg-blue-500/20 text-blue-300 text-center'
      case 'admin':
        return 'bg-red-500/20 border-l-4 border-red-500'
      default:
        return 'bg-white/10'
    }
  }

  // 사용자 역할 배지
  const getUserBadge = (user: ChatUser) => {
    switch (user.role) {
      case 'admin':
        return <span className="text-red-400 text-xs">👨‍💼</span>
      case 'moderator':
        return <span className="text-yellow-400 text-xs">🛡️</span>
      default:
        return user.isPremium ? <span className="text-purple-400 text-xs">👑</span> : null
    }
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-md rounded-xl ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <h3 className="font-bold text-white">
            게임 채팅 ({gameRoom === 'global' ? '전체' : gameRoom})
          </h3>
          <span className="text-white/60 text-sm">
            {onlineUsers.length}명 접속
          </span>
        </div>
        
        <button
          onClick={() => setShowUserList(!showUserList)}
          className="text-white/60 hover:text-white transition-colors"
        >
          👥
        </button>
      </div>

      <div className="flex">
        {/* 메시지 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 메시지 목록 */}
          <div 
            className="p-4 overflow-y-auto space-y-3"
            style={{ maxHeight }}
          >
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`rounded-lg p-3 ${getMessageStyle(message)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {message.type === 'system' ? (
                    <p className="text-sm">{message.message}</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {message.username}
                        </span>
                        {getUserBadge(onlineUsers.find(u => u.id === message.userId) || currentUser)}
                        <span className="text-white/40 text-xs">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm break-words">
                        {message.message}
                      </p>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
                disabled={!isConnected}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                maxLength={200}
              />
              <motion.button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || !isConnected}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                전송
              </motion.button>
            </div>
            <div className="text-white/40 text-xs mt-2">
              {currentMessage.length}/200
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <AnimatePresence>
          {showUserList && (
            <motion.div
              className="w-48 border-l border-white/10 bg-white/5"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 192, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              <div className="p-4">
                <h4 className="font-bold text-white mb-3">접속자</h4>
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className="flex-1 text-white text-sm truncate">
                        {user.username}
                      </span>
                      {getUserBadge(user)}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ChatSystem