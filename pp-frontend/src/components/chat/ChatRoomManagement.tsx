// frontend/src/components/chat/ChatRoomManagement.tsx
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Users, 
  Shield, 
  Crown, 
  Ban, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Filter,
  MessageSquare,
  UserPlus,
  UserMinus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X
} from 'lucide-react'

interface User {
  id: string
  username: string
  avatar: string
  role: 'admin' | 'moderator' | 'vip' | 'user'
  status: 'online' | 'away' | 'busy' | 'offline'
  isMuted: boolean
  isBanned: boolean
  joinedAt: Date
  lastActive: Date
}

interface ChatRoom {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'vip'
  maxUsers: number
  currentUsers: number
  isPasswordProtected: boolean
  allowFileSharing: boolean
  allowVoiceChat: boolean
  wordFilterEnabled: boolean
  slowModeInterval: number
  users: User[]
  createdAt: Date
  ownerId: string
}

interface WordFilter {
  id: string
  word: string
  action: 'warn' | 'mute' | 'ban' | 'delete'
  severity: 'low' | 'medium' | 'high'
}

interface ChatRoomManagementProps {
  currentUser: User
  rooms: ChatRoom[]
  onRoomCreate: (room: Partial<ChatRoom>) => void
  onRoomUpdate: (roomId: string, updates: Partial<ChatRoom>) => void
  onRoomDelete: (roomId: string) => void
  onUserKick: (roomId: string, userId: string) => void
  onUserBan: (roomId: string, userId: string, duration?: number) => void
  onUserMute: (roomId: string, userId: string, duration?: number) => void
  onUserPromote: (roomId: string, userId: string, role: User['role']) => void
}

export default function ChatRoomManagement({
  currentUser,
  rooms,
  onRoomCreate,
  onRoomUpdate,
  onRoomDelete,
  onUserKick,
  onUserBan,
  onUserMute,
  onUserPromote
}: ChatRoomManagementProps) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'settings'>('overview')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Partial<ChatRoom>>({})
  const [wordFilters, setWordFilters] = useState<WordFilter[]>([
    { id: '1', word: '욕설', action: 'warn', severity: 'low' },
    { id: '2', word: '스팸', action: 'mute', severity: 'medium' },
    { id: '3', word: '광고', action: 'ban', severity: 'high' }
  ])
  const [newFilter, setNewFilter] = useState<Partial<WordFilter>>({})
  const [showUserActions, setShowUserActions] = useState<string | null>(null)

  const handleRoomSelect = useCallback((room: ChatRoom) => {
    setSelectedRoom(room)
    setEditingRoom(room)
  }, [])

  const handleRoomUpdate = useCallback(() => {
    if (selectedRoom && editingRoom) {
      onRoomUpdate(selectedRoom.id, editingRoom)
      setSelectedRoom({ ...selectedRoom, ...editingRoom })
    }
  }, [selectedRoom, editingRoom, onRoomUpdate])

  const handleCreateRoom = useCallback(() => {
    if (editingRoom.name && editingRoom.type) {
      onRoomCreate({
        ...editingRoom,
        id: Date.now().toString(),
        currentUsers: 0,
        users: [],
        createdAt: new Date(),
        ownerId: currentUser.id
      })
      setShowCreateRoom(false)
      setEditingRoom({})
    }
  }, [editingRoom, onRoomCreate, currentUser.id])

  const handleUserAction = useCallback((action: string, userId: string, duration?: number) => {
    if (!selectedRoom) return

    switch (action) {
      case 'kick':
        onUserKick(selectedRoom.id, userId)
        break
      case 'ban':
        onUserBan(selectedRoom.id, userId, duration)
        break
      case 'mute':
        onUserMute(selectedRoom.id, userId, duration)
        break
      case 'promote-mod':
        onUserPromote(selectedRoom.id, userId, 'moderator')
        break
      case 'promote-vip':
        onUserPromote(selectedRoom.id, userId, 'vip')
        break
      case 'demote':
        onUserPromote(selectedRoom.id, userId, 'user')
        break
    }
    setShowUserActions(null)
  }, [selectedRoom, onUserKick, onUserBan, onUserMute, onUserPromote])

  const addWordFilter = useCallback(() => {
    if (newFilter.word && newFilter.action && newFilter.severity) {
      const filter: WordFilter = {
        id: Date.now().toString(),
        word: newFilter.word,
        action: newFilter.action,
        severity: newFilter.severity
      }
      setWordFilters(prev => [...prev, filter])
      setNewFilter({})
    }
  }, [newFilter])

  const removeWordFilter = useCallback((filterId: string) => {
    setWordFilters(prev => prev.filter(f => f.id !== filterId))
  }, [])

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'text-red-500'
      case 'moderator': return 'text-blue-500'
      case 'vip': return 'text-purple-500'
      default: return 'text-gray-400'
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'moderator': return <Shield className="w-4 h-4" />
      case 'vip': return <Users className="w-4 h-4" />
      default: return null
    }
  }

  const canManageRoom = (room: ChatRoom) => {
    return currentUser.role === 'admin' || 
           room.ownerId === currentUser.id || 
           currentUser.role === 'moderator'
  }

  const canManageUser = (user: User) => {
    if (currentUser.role === 'admin') return true
    if (currentUser.role === 'moderator' && user.role === 'user') return true
    return false
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Room List */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">채팅방 관리</h2>
            {currentUser.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateRoom(true)}
                className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </div>
          
          <div className="space-y-2">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoomSelect(room)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{room.name}</h3>
                    <p className="text-sm text-gray-400">
                      {room.currentUsers}/{room.maxUsers} 명
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {room.type === 'private' && <Lock className="w-4 h-4 text-yellow-500" />}
                    {room.type === 'vip' && <Crown className="w-4 h-4 text-purple-500" />}
                    {room.isPasswordProtected && <Eye className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">{selectedRoom.name}</h1>
                  <p className="text-gray-400">{selectedRoom.description}</p>
                </div>
                {canManageRoom(selectedRoom) && (
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRoomUpdate}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>저장</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRoomDelete(selectedRoom.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>삭제</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700">
              <div className="flex space-x-6 px-6">
                {(['overview', 'users', 'moderation', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab === 'overview' && '개요'}
                    {tab === 'users' && '사용자'}
                    {tab === 'moderation' && '관리'}
                    {tab === 'settings' && '설정'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">현재 사용자</p>
                            <p className="text-2xl font-bold text-white">{selectedRoom.currentUsers}</p>
                          </div>
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">최대 사용자</p>
                            <p className="text-2xl font-bold text-white">{selectedRoom.maxUsers}</p>
                          </div>
                          <Users className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">메시지</p>
                            <p className="text-2xl font-bold text-white">1,234</p>
                          </div>
                          <MessageSquare className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">활성도</p>
                            <p className="text-2xl font-bold text-white">87%</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">최근 활동</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-300">사용자 &lsquo;Player123&rsquo;가 입장했습니다</span>
                          <span className="text-sm text-gray-500">5분 전</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-300">메시지 100개가 전송되었습니다</span>
                          <span className="text-sm text-gray-500">10분 전</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-300">사용자 &lsquo;Spammer&rsquo;가 음소거되었습니다</span>
                          <span className="text-sm text-gray-500">15분 전</span>
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
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">사용자 관리</h3>
                      <div className="text-sm text-gray-400">
                        총 {selectedRoom.users.length}명
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedRoom.users.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">{user.username}</span>
                                <span className={`text-sm ${getRoleColor(user.role)}`}>
                                  {getRoleIcon(user.role)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <span className={`w-2 h-2 rounded-full ${
                                  user.status === 'online' ? 'bg-green-500' :
                                  user.status === 'away' ? 'bg-yellow-500' :
                                  user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></span>
                                <span>{user.status}</span>
                                {user.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                                {user.isBanned && <Ban className="w-3 h-3 text-red-500" />}
                              </div>
                            </div>
                          </div>

                          {canManageUser(user) && (
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowUserActions(showUserActions === user.id ? null : user.id)}
                                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                <Settings className="w-4 h-4 text-white" />
                              </motion.button>

                              <AnimatePresence>
                                {showUserActions === user.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 bg-gray-700 rounded-lg shadow-xl z-10 min-w-48"
                                  >
                                    <div className="p-2 space-y-1">
                                      <button
                                        onClick={() => handleUserAction('mute', user.id, 300)}
                                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded flex items-center space-x-2"
                                      >
                                        <MicOff className="w-4 h-4" />
                                        <span>5분 음소거</span>
                                      </button>
                                      <button
                                        onClick={() => handleUserAction('kick', user.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                        <span>강제 퇴장</span>
                                      </button>
                                      <button
                                        onClick={() => handleUserAction('ban', user.id, 3600)}
                                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                                      >
                                        <Ban className="w-4 h-4" />
                                        <span>1시간 차단</span>
                                      </button>
                                      {user.role === 'user' && (
                                        <button
                                          onClick={() => handleUserAction('promote-mod', user.id)}
                                          className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                                        >
                                          <Shield className="w-4 h-4" />
                                          <span>관리자 승급</span>
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'moderation' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">단어 필터</h3>
                      
                      <div className="bg-gray-800 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <input
                            type="text"
                            placeholder="필터 단어"
                            value={newFilter.word || ''}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, word: e.target.value }))}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                          <select
                            value={newFilter.action || ''}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, action: e.target.value as WordFilter['action'] }))}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">조치 선택</option>
                            <option value="warn">경고</option>
                            <option value="mute">음소거</option>
                            <option value="ban">차단</option>
                            <option value="delete">삭제</option>
                          </select>
                          <select
                            value={newFilter.severity || ''}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, severity: e.target.value as WordFilter['severity'] }))}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">심각도</option>
                            <option value="low">낮음</option>
                            <option value="medium">보통</option>
                            <option value="high">높음</option>
                          </select>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addWordFilter}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            추가
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {wordFilters.map((filter) => (
                          <motion.div
                            key={filter.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-800 p-3 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <span className="text-white font-medium">{filter.word}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                filter.action === 'warn' ? 'bg-yellow-900 text-yellow-300' :
                                filter.action === 'mute' ? 'bg-blue-900 text-blue-300' :
                                filter.action === 'ban' ? 'bg-red-900 text-red-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {filter.action}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                filter.severity === 'low' ? 'bg-green-900 text-green-300' :
                                filter.severity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {filter.severity}
                              </span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeWordFilter(filter.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">방 이름</label>
                          <input
                            type="text"
                            value={editingRoom.name || ''}
                            onChange={(e) => setEditingRoom(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">설명</label>
                          <textarea
                            value={editingRoom.description || ''}
                            onChange={(e) => setEditingRoom(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 h-20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">최대 사용자 수</label>
                          <input
                            type="number"
                            value={editingRoom.maxUsers || 100}
                            onChange={(e) => setEditingRoom(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">방 유형</label>
                          <select
                            value={editingRoom.type || 'public'}
                            onChange={(e) => setEditingRoom(prev => ({ ...prev, type: e.target.value as ChatRoom['type'] }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          >
                            <option value="public">공개</option>
                            <option value="private">비공개</option>
                            <option value="vip">VIP 전용</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white">비밀번호 보호</span>
                            <button
                              onClick={() => setEditingRoom(prev => ({ ...prev, isPasswordProtected: !prev.isPasswordProtected }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                editingRoom.isPasswordProtected ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                editingRoom.isPasswordProtected ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white">파일 공유 허용</span>
                            <button
                              onClick={() => setEditingRoom(prev => ({ ...prev, allowFileSharing: !prev.allowFileSharing }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                editingRoom.allowFileSharing ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                editingRoom.allowFileSharing ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white">음성 채팅 허용</span>
                            <button
                              onClick={() => setEditingRoom(prev => ({ ...prev, allowVoiceChat: !prev.allowVoiceChat }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                editingRoom.allowVoiceChat ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                editingRoom.allowVoiceChat ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white">단어 필터 활성화</span>
                            <button
                              onClick={() => setEditingRoom(prev => ({ ...prev, wordFilterEnabled: !prev.wordFilterEnabled }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                editingRoom.wordFilterEnabled ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                editingRoom.wordFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            슬로우 모드 (초)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingRoom.slowModeInterval || 0}
                            onChange={(e) => setEditingRoom(prev => ({ ...prev, slowModeInterval: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">0 = 비활성화</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">채팅방을 선택하세요</h3>
              <p className="text-gray-400">관리할 채팅방을 왼쪽 목록에서 선택해주세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateRoom(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">새 채팅방 만들기</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">방 이름</label>
                  <input
                    type="text"
                    value={editingRoom.name || ''}
                    onChange={(e) => setEditingRoom(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="채팅방 이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">방 유형</label>
                  <select
                    value={editingRoom.type || 'public'}
                    onChange={(e) => setEditingRoom(prev => ({ ...prev, type: e.target.value as ChatRoom['type'] }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="public">공개</option>
                    <option value="private">비공개</option>
                    <option value="vip">VIP 전용</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">최대 사용자</label>
                  <input
                    type="number"
                    value={editingRoom.maxUsers || 100}
                    onChange={(e) => setEditingRoom(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateRoom}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  생성
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}