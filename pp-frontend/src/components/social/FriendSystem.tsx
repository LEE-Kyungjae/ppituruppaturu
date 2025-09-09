// frontend/src/components/social/FriendSystem.tsx
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  UserMinus,
  Flag,
  Star,
  Calendar,
  Clock,
  Gamepad2,
  Trophy,
  Heart,
  Gift,
  Settings,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Zap,
  MapPin,
  Globe,
  Camera,
  Edit3,
  Save,
  X,
  Plus
} from 'lucide-react'

interface User {
  id: string
  username: string
  avatar: string
  level: number
  status: 'online' | 'away' | 'busy' | 'offline'
  customStatus?: string
  location?: string
  bio?: string
  interests: string[]
  favoriteGames: string[]
  playStyle: 'casual' | 'competitive' | 'hardcore'
  stats: {
    gamesPlayed: number
    winRate: number
    averageRating: number
    hoursPlayed: number
  }
  badges: Badge[]
  friendshipDate: Date
  lastSeen: Date
  mutualFriends: number
  isFavorite: boolean
  isBlocked: boolean
}

interface Badge {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
}

interface FriendGroup {
  id: string
  name: string
  color: string
  members: string[]
}

interface GameSession {
  id: string
  game: string
  participants: User[]
  status: 'active' | 'completed'
  startTime: Date
  endTime?: Date
  result?: 'win' | 'loss' | 'draw'
}

interface FriendSystemProps {
  currentUser: User
  friends: User[]
  onRemoveFriend: (userId: string) => void
  onBlockUser: (userId: string) => void
  onReportUser: (userId: string, reason: string) => void
  onToggleFavorite: (userId: string) => void
  onStartChat: (userId: string) => void
  onStartVoiceCall: (userId: string) => void
  onStartVideoCall: (userId: string) => void
  onInviteToGame: (userId: string, gameId: string) => void
  onCreateGroup: (groupName: string, members: string[]) => void
  onUpdateGroup: (groupId: string, updates: Partial<FriendGroup>) => void
  onDeleteGroup: (groupId: string) => void
}

export default function FriendSystem({
  currentUser,
  friends,
  onRemoveFriend,
  onBlockUser,
  onReportUser,
  onToggleFavorite,
  onStartChat,
  onStartVoiceCall,
  onStartVideoCall,
  onInviteToGame,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}: FriendSystemProps) {
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'level' | 'lastSeen' | 'friendship'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all')
  const [showUserActions, setShowUserActions] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'friends' | 'favorites' | 'groups' | 'activity'>('friends')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([
    { id: '1', name: '게임 친구들', color: 'blue', members: [] },
    { id: '2', name: '오프라인 친구들', color: 'green', members: [] },
    { id: '3', name: 'VIP', color: 'purple', members: [] }
  ])
  const [recentActivity] = useState<GameSession[]>([
    {
      id: '1',
      game: 'League of Legends',
      participants: friends.slice(0, 2),
      status: 'completed',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1800000),
      result: 'win'
    },
    {
      id: '2',
      game: 'Valorant',
      participants: friends.slice(1, 4),
      status: 'active',
      startTime: new Date(Date.now() - 1800000)
    }
  ])

  const filteredAndSortedFriends = useMemo(() => {
    let filtered = friends.filter(friend => {
      if (searchQuery && !friend.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      if (filterStatus === 'online' && friend.status === 'offline') {
        return false
      }
      
      if (filterStatus === 'offline' && friend.status !== 'offline') {
        return false
      }
      
      return true
    })

    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'name':
          compareValue = a.username.localeCompare(b.username)
          break
        case 'status':
          const statusOrder = { online: 4, away: 3, busy: 2, offline: 1 }
          compareValue = statusOrder[b.status] - statusOrder[a.status]
          break
        case 'level':
          compareValue = b.level - a.level
          break
        case 'lastSeen':
          compareValue = new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
          break
        case 'friendship':
          compareValue = new Date(a.friendshipDate).getTime() - new Date(b.friendshipDate).getTime()
          break
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [friends, searchQuery, sortBy, sortOrder, filterStatus])

  const favoriteFriends = useMemo(() => {
    return friends.filter(friend => friend.isFavorite)
  }, [friends])

  const onlineFriends = useMemo(() => {
    return friends.filter(friend => friend.status !== 'offline')
  }, [friends])

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getBadgeColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500'
      case 'epic': return 'from-purple-400 to-pink-500'
      case 'rare': return 'from-blue-400 to-cyan-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getTimeSince = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  const handleCreateGroup = useCallback(() => {
    if (newGroupName.trim() && selectedMembers.length > 0) {
      const newGroup: FriendGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        color: 'blue',
        members: selectedMembers
      }
      setFriendGroups(prev => [...prev, newGroup])
      onCreateGroup(newGroup.name, newGroup.members)
      setNewGroupName('')
      setSelectedMembers([])
      setShowCreateGroup(false)
    }
  }, [newGroupName, selectedMembers, onCreateGroup])

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">친구</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{friends.length}명</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateGroup(true)}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="친구 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600"
            >
              <option value="all">전체</option>
              <option value="online">온라인</option>
              <option value="offline">오프라인</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600"
            >
              <option value="name">이름</option>
              <option value="status">상태</option>
              <option value="level">레벨</option>
              <option value="lastSeen">최근 접속</option>
              <option value="friendship">친구된 날</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 bg-gray-800 rounded border border-gray-600 hover:bg-gray-700"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-white" /> : <SortDesc className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-sm font-medium text-green-400">{onlineFriends.length}</div>
              <div className="text-xs text-gray-400">온라인</div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-sm font-medium text-yellow-400">{favoriteFriends.length}</div>
              <div className="text-xs text-gray-400">즐겨찾기</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex">
            {(['friends', 'favorites', 'groups', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-1 text-xs font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-400 bg-gray-800'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'friends' && '친구'}
                {tab === 'favorites' && '즐겨찾기'}
                {tab === 'groups' && '그룹'}
                {tab === 'activity' && '활동'}
              </button>
            ))}
          </div>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'friends' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 space-y-1"
              >
                {filteredAndSortedFriends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedFriend(friend)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFriend?.id === friend.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(friend.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-white font-medium truncate">{friend.username}</span>
                          {friend.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                        </div>
                        <div className="text-xs text-gray-400">
                          {friend.status !== 'offline' ? (
                            friend.customStatus || friend.status
                          ) : (
                            `${getTimeSince(friend.lastSeen)} 접속`
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {friend.level}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 space-y-1"
              >
                {favoriteFriends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedFriend(friend)}
                    className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={friend.avatar} alt={friend.username} className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-white font-medium">{friend.username}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        </div>
                        <div className="text-xs text-gray-400">{friend.status}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {favoriteFriends.length === 0 && (
                  <p className="text-center text-gray-400 py-8">즐겨찾기한 친구가 없습니다</p>
                )}
              </motion.div>
            )}

            {activeTab === 'groups' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 space-y-2"
              >
                {friendGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${group.color}-500`} />
                        <span className="text-white font-medium">{group.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{group.members.length}명</span>
                    </div>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 5).map((memberId) => {
                        const member = friends.find(f => f.id === memberId)
                        if (!member) return null
                        return (
                          <img
                            key={memberId}
                            src={member.avatar}
                            alt={member.username}
                            className="w-6 h-6 rounded-full border-2 border-gray-800"
                          />
                        )
                      })}
                      {group.members.length > 5 && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center">
                          <span className="text-xs text-white">+{group.members.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 space-y-2"
              >
                {recentActivity.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Gamepad2 className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{session.game}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'active' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {session.status === 'active' ? '진행중' : '완료'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      {session.participants.slice(0, 3).map(participant => (
                        <img
                          key={participant.id}
                          src={participant.avatar}
                          alt={participant.username}
                          className="w-5 h-5 rounded-full"
                        />
                      ))}
                      {session.participants.length > 3 && (
                        <span className="text-xs text-gray-400">+{session.participants.length - 3}명</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getTimeSince(session.startTime)}
                      {session.result && (
                        <span className={`ml-2 ${
                          session.result === 'win' ? 'text-green-400' :
                          session.result === 'loss' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {session.result === 'win' ? '승리' : session.result === 'loss' ? '패배' : '무승부'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-gray-400 py-8">최근 활동이 없습니다</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Friend Profile Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={selectedFriend.avatar}
                      alt={selectedFriend.username}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 ${getStatusColor(selectedFriend.status)}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-white">{selectedFriend.username}</h1>
                      {selectedFriend.isFavorite && <Star className="w-5 h-5 text-yellow-400 fill-current" />}
                    </div>
                    <p className="text-gray-400 mb-2">레벨 {selectedFriend.level}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedFriend.status)}`} />
                      <span>
                        {selectedFriend.status !== 'offline' 
                          ? (selectedFriend.customStatus || selectedFriend.status)
                          : `${getTimeSince(selectedFriend.lastSeen)} 접속`
                        }
                      </span>
                    </div>
                    {selectedFriend.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedFriend.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartChat(selectedFriend.id)}
                    className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartVoiceCall(selectedFriend.id)}
                    className="p-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartVideoCall(selectedFriend.id)}
                    className="p-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Video className="w-5 h-5 text-white" />
                  </motion.button>
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserActions(showUserActions === selectedFriend.id ? null : selectedFriend.id)}
                      className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-white" />
                    </motion.button>

                    <AnimatePresence>
                      {showUserActions === selectedFriend.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 bg-gray-700 rounded-lg shadow-xl z-10 min-w-48"
                        >
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => onToggleFavorite(selectedFriend.id)}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <Star className={`w-4 h-4 ${selectedFriend.isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
                              <span>{selectedFriend.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}</span>
                            </button>
                            <button
                              onClick={() => onInviteToGame(selectedFriend.id, 'general')}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <Gamepad2 className="w-4 h-4" />
                              <span>게임 초대</span>
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <Gift className="w-4 h-4" />
                              <span>선물하기</span>
                            </button>
                            <hr className="border-gray-600" />
                            <button
                              onClick={() => onBlockUser(selectedFriend.id)}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <Shield className="w-4 h-4" />
                              <span>차단하기</span>
                            </button>
                            <button
                              onClick={() => onReportUser(selectedFriend.id, 'inappropriate_behavior')}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <Flag className="w-4 h-4" />
                              <span>신고하기</span>
                            </button>
                            <button
                              onClick={() => onRemoveFriend(selectedFriend.id)}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 rounded flex items-center space-x-2"
                            >
                              <UserMinus className="w-4 h-4" />
                              <span>친구 삭제</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Friend Profile Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Profile Info */}
                <div className="col-span-2 space-y-6">
                  {selectedFriend.bio && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">소개</h3>
                      <p className="text-gray-300">{selectedFriend.bio}</p>
                    </div>
                  )}

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">게임 통계</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{selectedFriend.stats.gamesPlayed}</div>
                        <div className="text-sm text-gray-400">플레이한 게임</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{Math.round(selectedFriend.stats.winRate)}%</div>
                        <div className="text-sm text-gray-400">승률</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{selectedFriend.stats.averageRating}</div>
                        <div className="text-sm text-gray-400">평균 점수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{Math.round(selectedFriend.stats.hoursPlayed)}h</div>
                        <div className="text-sm text-gray-400">플레이 시간</div>
                      </div>
                    </div>
                  </div>

                  {selectedFriend.interests.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-white mb-3">관심사</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedFriend.interests.map(interest => (
                          <span key={interest} className="px-3 py-1 bg-blue-900 text-blue-300 text-sm rounded-full">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFriend.favoriteGames.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-white mb-3">즐겨하는 게임</h3>
                      <div className="space-y-2">
                        {selectedFriend.favoriteGames.map(game => (
                          <div key={game} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <span className="text-white">{game}</span>
                            <Gamepad2 className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">뱃지</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFriend.badges.map(badge => (
                        <div
                          key={badge.id}
                          className={`aspect-square rounded-lg bg-gradient-to-r ${getBadgeColor(badge.rarity)} flex items-center justify-center text-xl`}
                          title={badge.description}
                        >
                          {badge.icon}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">정보</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">플레이 스타일</span>
                        <span className="text-white">{selectedFriend.playStyle}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">친구된 날</span>
                        <span className="text-white">{getTimeSince(selectedFriend.friendshipDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">공통 친구</span>
                        <span className="text-white">{selectedFriend.mutualFriends}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">친구를 선택하세요</h3>
              <p className="text-gray-400">왼쪽 목록에서 친구를 선택하여 프로필을 확인하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">새 그룹 만들기</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">그룹 이름</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="그룹 이름을 입력하세요"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">멤버 선택</label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {friends.map(friend => (
                      <label key={friend.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers(prev => [...prev, friend.id])
                            } else {
                              setSelectedMembers(prev => prev.filter(id => id !== friend.id))
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <img src={friend.avatar} alt={friend.username} className="w-6 h-6 rounded-full" />
                        <span className="text-white">{friend.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || selectedMembers.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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