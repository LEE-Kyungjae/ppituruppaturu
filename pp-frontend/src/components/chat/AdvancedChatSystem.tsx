// frontend/src/components/chat/AdvancedChatSystem.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  role: 'admin' | 'moderator' | 'vip' | 'user'
  status: 'online' | 'away' | 'busy' | 'offline'
  isTyping?: boolean
  lastSeen?: Date
}

interface ChatMessage {
  id: string
  type: 'text' | 'emoji' | 'sticker' | 'file' | 'image' | 'voice' | 'system' | 'game_invite'
  content: string
  userId: string
  username: string
  displayName: string
  avatar: string
  roomId: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date
  replyTo?: string
  reactions: Record<string, string[]> // emoji -> user_ids
  mentions: string[]
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    imageUrl?: string
    voiceDuration?: number
    stickerPack?: string
    gameType?: string
  }
}

interface ChatRoom {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'game' | 'vip'
  memberCount: number
  maxMembers: number
  owner: string
  moderators: string[]
  settings: {
    allowFiles: boolean
    allowImages: boolean
    allowVoice: boolean
    slowMode: number // seconds between messages
    wordFilter: boolean
  }
}

interface TypingIndicator {
  userId: string
  username: string
  timestamp: Date
}

const EMOJIS = ['😀', '😂', '😍', '😭', '😡', '👍', '👎', '❤️', '🔥', '💎', '🎮', '🎯', '🏆', '⚡', '✨', '🌟']

const STICKER_PACKS = {
  'gaming': [
    { id: 'game1', name: 'Victory!', emoji: '🏆' },
    { id: 'game2', name: 'Good Game', emoji: '🎮' },
    { id: 'game3', name: 'Level Up!', emoji: '⬆️' },
    { id: 'game4', name: 'Epic Win', emoji: '💪' }
  ],
  'emotions': [
    { id: 'happy', name: 'Happy', emoji: '😊' },
    { id: 'sad', name: 'Sad', emoji: '😢' },
    { id: 'excited', name: 'Excited', emoji: '🤩' },
    { id: 'thinking', name: 'Thinking', emoji: '🤔' }
  ]
}

export const AdvancedChatSystem: React.FC = () => {
  // State management
  const [activeRoom, setActiveRoom] = useState<string>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [currentUser] = useState<User>({
    id: 'user1',
    username: 'gamer123',
    displayName: 'Pro Gamer',
    avatar: '🎮',
    role: 'user',
    status: 'online'
  })

  // UI state
  const [messageInput, setMessageInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data initialization
  useEffect(() => {
    const mockRooms: ChatRoom[] = [
      {
        id: 'general',
        name: '일반 채팅',
        description: '자유로운 대화 공간',
        type: 'public',
        memberCount: 156,
        maxMembers: 500,
        owner: 'admin1',
        moderators: ['mod1', 'mod2'],
        settings: {
          allowFiles: true,
          allowImages: true,
          allowVoice: true,
          slowMode: 0,
          wordFilter: true
        }
      },
      {
        id: 'game',
        name: '게임 채팅',
        description: '게임 관련 대화',
        type: 'game',
        memberCount: 89,
        maxMembers: 200,
        owner: 'admin1',
        moderators: ['mod1'],
        settings: {
          allowFiles: true,
          allowImages: true,
          allowVoice: true,
          slowMode: 2,
          wordFilter: true
        }
      },
      {
        id: 'vip',
        name: 'VIP 라운지',
        description: 'VIP 회원 전용',
        type: 'vip',
        memberCount: 23,
        maxMembers: 50,
        owner: 'admin1',
        moderators: ['mod1'],
        settings: {
          allowFiles: true,
          allowImages: true,
          allowVoice: true,
          slowMode: 0,
          wordFilter: false
        }
      }
    ]

    const mockUsers: User[] = [
      { id: 'user1', username: 'gamer123', displayName: 'Pro Gamer', avatar: '🎮', role: 'user', status: 'online' },
      { id: 'user2', username: 'speedster', displayName: 'Speed King', avatar: '⚡', role: 'vip', status: 'online' },
      { id: 'mod1', username: 'chatmod', displayName: 'Chat Moderator', avatar: '🛡️', role: 'moderator', status: 'online' },
      { id: 'admin1', username: 'admin', displayName: 'Administrator', avatar: '👑', role: 'admin', status: 'away' }
    ]

    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        type: 'text',
        content: '안녕하세요! 새로운 채팅 시스템에 오신 걸 환영합니다! 🎉',
        userId: 'admin1',
        username: 'admin',
        displayName: 'Administrator',
        avatar: '👑',
        roomId: 'general',
        timestamp: new Date(Date.now() - 300000),
        reactions: { '👍': ['user2', 'mod1'], '❤️': ['user1'] },
        mentions: []
      },
      {
        id: 'msg2',
        type: 'text',
        content: '와! 정말 멋진 기능들이 많네요. 특히 리액션 기능이 마음에 들어요!',
        userId: 'user2',
        username: 'speedster',
        displayName: 'Speed King',
        avatar: '⚡',
        roomId: 'general',
        timestamp: new Date(Date.now() - 240000),
        reactions: { '😊': ['user1', 'admin1'] },
        mentions: []
      },
      {
        id: 'msg3',
        type: 'sticker',
        content: 'game2',
        userId: 'user1',
        username: 'gamer123',
        displayName: 'Pro Gamer',
        avatar: '🎮',
        roomId: 'general',
        timestamp: new Date(Date.now() - 180000),
        reactions: { '🎮': ['user2'], '🔥': ['mod1'] },
        mentions: [],
        metadata: {
          stickerPack: 'gaming'
        }
      }
    ]

    setRooms(mockRooms)
    setOnlineUsers(mockUsers)
    setMessages(mockMessages)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Typing indicator simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        if (onlineUsers.length === 0) {
          return
        }
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
        if (!randomUser || randomUser.id === currentUser.id) {
          return
        }
        setTypingUsers(prev => {
          const existing = prev.find(t => t.userId === randomUser.id)
          if (!existing) {
            return [...prev, { userId: randomUser.id, username: randomUser.displayName, timestamp: new Date() }]
          }
          return prev
        })

        setTimeout(() => {
          setTypingUsers(prev => prev.filter(t => t.userId !== randomUser.id))
        }, 2000)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [onlineUsers, currentUser.id])

  // Message sending
  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'text', metadata?: any) => {
    if (!content.trim() && type === 'text') return

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type,
      content,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      roomId: activeRoom,
      timestamp: new Date(),
      reactions: {},
      mentions: [],
      replyTo: replyingTo?.id,
      metadata
    }

    setMessages(prev => [...prev, newMessage])
    setMessageInput('')
    setReplyingTo(null)
    setShowEmojiPicker(false)
    setShowStickerPicker(false)
  }, [activeRoom, currentUser, replyingTo])

  // Handle message reactions
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions }
        if (reactions[emoji]) {
          if (reactions[emoji].includes(currentUser.id)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== currentUser.id)
            if (reactions[emoji].length === 0) {
              delete reactions[emoji]
            }
          } else {
            reactions[emoji].push(currentUser.id)
          }
        } else {
          reactions[emoji] = [currentUser.id]
        }
        return { ...msg, reactions }
      }
      return msg
    }))
  }, [currentUser.id])

  // File upload handling
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const messageType: ChatMessage['type'] = isImage ? 'image' : 'file'

    // Simulate file upload
    setTimeout(() => {
      sendMessage(file.name, messageType, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageUrl: isImage ? URL.createObjectURL(file) : undefined
      })
    }, 1000)
  }, [sendMessage])

  // Voice recording (mock)
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false)
      // Simulate voice message
      setTimeout(() => {
        sendMessage('Voice Message', 'voice', {
          voiceDuration: Math.floor(Math.random() * 30) + 5
        })
      }, 500)
    } else {
      setIsRecording(true)
    }
  }, [isRecording, sendMessage])

  // Get user role styling
  const getUserRoleStyle = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'text-red-400 border-red-400'
      case 'moderator': return 'text-blue-400 border-blue-400'
      case 'vip': return 'text-yellow-400 border-yellow-400'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  // Filter messages for active room
  const roomMessages = useMemo(() => {
    return messages.filter(msg => msg.roomId === activeRoom)
  }, [messages, activeRoom])

  // Message component
  const MessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isOwn = message.userId === currentUser.id
    const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-4 ${isOwn ? 'flex justify-end' : 'flex justify-start'}`}
      >
        <div className={`max-w-xl ${isOwn ? 'order-1' : 'order-2'}`}>
          {/* Reply indicator */}
          {repliedMessage && (
            <div className="mb-1 text-xs text-gray-500 border-l-2 border-gray-600 pl-2">
              답장: {repliedMessage.displayName} - {repliedMessage.content.substring(0, 50)}...
            </div>
          )}
          
          <div className={`p-3 rounded-2xl ${
            isOwn 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-white/10 text-white border border-white/20'
          }`}>
            {/* Message header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{message.avatar}</span>
              <span className="font-semibold text-sm">{message.displayName}</span>
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.edited && <span className="text-xs opacity-50">(편집됨)</span>}
            </div>

            {/* Message content */}
            <div className="message-content">
              {message.type === 'text' && (
                <div>{message.content}</div>
              )}
              
              {message.type === 'sticker' && message.metadata?.stickerPack && (
                <div className="text-center">
                  <div className="text-4xl">
                    {STICKER_PACKS[message.metadata.stickerPack as keyof typeof STICKER_PACKS]?.find(s => s.id === message.content)?.emoji}
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {STICKER_PACKS[message.metadata.stickerPack as keyof typeof STICKER_PACKS]?.find(s => s.id === message.content)?.name}
                  </div>
                </div>
              )}

              {message.type === 'image' && message.metadata?.imageUrl && (
                <div>
                  <img 
                    src={message.metadata.imageUrl} 
                    alt={message.content}
                    className="max-w-full rounded-lg"
                  />
                  <div className="text-xs mt-1 opacity-70">{message.content}</div>
                </div>
              )}

              {message.type === 'file' && (
                <div className="flex items-center gap-2 p-2 bg-black/20 rounded">
                  <div className="text-xl">📄</div>
                  <div>
                    <div className="text-sm font-medium">{message.metadata?.fileName}</div>
                    <div className="text-xs opacity-70">
                      {message.metadata?.fileSize ? (message.metadata.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                    </div>
                  </div>
                </div>
              )}

              {message.type === 'voice' && (
                <div className="flex items-center gap-2 p-2 bg-black/20 rounded">
                  <div className="text-xl">🎤</div>
                  <div className="text-sm">음성 메시지 ({message.metadata?.voiceDuration}초)</div>
                  <button className="ml-2 text-blue-400 hover:text-blue-300">▶️</button>
                </div>
              )}
            </div>

            {/* Reactions */}
            {Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleReaction(message.id, emoji)}
                    className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                      userIds.includes(currentUser.id) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{userIds.length}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Message actions */}
          {!isOwn && (
            <div className="flex gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setReplyingTo(message)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
              >
                답장
              </button>
              <div className="flex gap-1">
                {EMOJIS.slice(0, 3).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(message.id, emoji)}
                    className="text-xs hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          isOwn ? 'order-2 ml-2' : 'order-1 mr-2'
        }`}>
          {!isOwn && message.avatar}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="game-container h-screen flex">
      {/* Room list */}
      <div className="w-64 bg-gray-900/50 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">채팅방</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.map(room => (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveRoom(room.id)}
              className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 ${
                activeRoom === room.id ? 'border-blue-500 bg-white/10' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{room.name}</div>
                  <div className="text-sm text-gray-400">{room.memberCount}명</div>
                </div>
                {room.type === 'vip' && <span className="text-yellow-400">👑</span>}
                {room.type === 'game' && <span className="text-blue-400">🎮</span>}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Online users */}
        <div className="p-4 border-t border-white/10">
          <h3 className="text-sm font-semibold mb-2">온라인 ({onlineUsers.filter(u => u.status === 'online').length})</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {onlineUsers.filter(u => u.status === 'online').map(user => (
              <div key={user.id} className="flex items-center gap-2 text-sm">
                <span>{user.avatar}</span>
                <span className={getUserRoleStyle(user.role)}>{user.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-white/10 bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {rooms.find(r => r.id === activeRoom)?.name}
              </h1>
              <div className="text-sm text-gray-400">
                {rooms.find(r => r.id === activeRoom)?.description}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {rooms.find(r => r.id === activeRoom)?.memberCount}명 참여 중
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {roomMessages.map(message => (
              <MessageComponent key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.map(u => u.username).join(', ')} 님이 입력 중...
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="p-2 mx-4 bg-gray-700 rounded-t-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-blue-400">{replyingTo.displayName}</span>
                <span className="text-gray-400 ml-2">{replyingTo.content.substring(0, 50)}...</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-white/10 bg-gray-900/30">
          {/* Emoji picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-3 bg-gray-800 rounded-lg grid grid-cols-8 gap-2"
              >
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessageInput(prev => prev + emoji)
                      messageInputRef.current?.focus()
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticker picker */}
          <AnimatePresence>
            {showStickerPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-3 bg-gray-800 rounded-lg"
              >
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(STICKER_PACKS).map(([packName, stickers]) => (
                    <div key={packName}>
                      <div className="text-sm font-semibold mb-2 capitalize">{packName}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {stickers.map(sticker => (
                          <button
                            key={sticker.id}
                            onClick={() => sendMessage(sticker.id, 'sticker', { stickerPack: packName })}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
                          >
                            <div className="text-2xl">{sticker.emoji}</div>
                            <div className="text-xs text-gray-300">{sticker.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input controls */}
          <div className="flex items-end gap-2">
            {/* Action buttons */}
            <div className="flex gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  showEmojiPicker ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                😊
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  showStickerPicker ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                🎯
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                📎
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                🎤
              </motion.button>
            </div>

            {/* Message input */}
            <div className="flex-1">
              <input
                ref={messageInputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(messageInput)
                  }
                }}
                placeholder="메시지를 입력하세요..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
            </div>

            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(messageInput)}
              disabled={!messageInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
            >
              전송
            </motion.button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </div>
  )
}

export default AdvancedChatSystem
