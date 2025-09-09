// frontend/src/components/social/UserMatchingSystem.tsx
'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Star,
  Trophy,
  Gamepad2,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Filter,
  MapPin,
  Clock,
  Heart,
  Zap,
  Shield,
  Crown,
  Target,
  TrendingUp,
  RefreshCw,
  Settings,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react'

interface User {
  id: string
  username: string
  avatar: string
  level: number
  status: 'online' | 'away' | 'busy' | 'offline'
  location?: string
  bio?: string
  interests: string[]
  favoriteGames: string[]
  playStyle: 'casual' | 'competitive' | 'hardcore'
  languagesSpoken: string[]
  timezone: string
  lastActive: Date
  stats: {
    gamesPlayed: number
    winRate: number
    averageRating: number
    hoursPlayed: number
  }
  personalityTraits: string[]
  badges: Badge[]
  preferences: UserPreferences
}

interface Badge {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
}

interface UserPreferences {
  ageRange: [number, number]
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  gameTypes: string[]
  communicationStyle: 'text' | 'voice' | 'both'
  playTimes: string[]
  maxDistance?: number
  languagePreference: string[]
}

interface MatchCriteria {
  interests: string[]
  games: string[]
  skillLevel: UserPreferences['skillLevel'][]
  playStyle: User['playStyle'][]
  location: boolean
  onlineOnly: boolean
  ageRange?: [number, number]
  maxDistance?: number
  languages: string[]
}

interface MatchResult {
  user: User
  compatibility: number
  matchReasons: string[]
  commonInterests: string[]
  commonGames: string[]
}

interface FriendRequest {
  id: string
  fromUser: User
  toUserId: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date
}

interface UserMatchingSystemProps {
  currentUser: User
  allUsers: User[]
  friends: User[]
  friendRequests: FriendRequest[]
  onSendFriendRequest: (userId: string, message: string) => void
  onAcceptFriendRequest: (requestId: string) => void
  onDeclineFriendRequest: (requestId: string) => void
  onRemoveFriend: (userId: string) => void
}

export default function UserMatchingSystem({
  currentUser,
  allUsers,
  friends,
  friendRequests,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriend
}: UserMatchingSystemProps) {
  const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'requests'>('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [matchCriteria, setMatchCriteria] = useState<MatchCriteria>({
    interests: [],
    games: [],
    skillLevel: [],
    playStyle: [],
    location: false,
    onlineOnly: false,
    languages: []
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [friendRequestMessage, setFriendRequestMessage] = useState('')
  const [showSendRequest, setShowSendRequest] = useState(false)

  const allInterests = useMemo(() => {
    const interests = new Set<string>()
    allUsers.forEach(user => user.interests.forEach(interest => interests.add(interest)))
    return Array.from(interests).sort()
  }, [allUsers])

  const allGames = useMemo(() => {
    const games = new Set<string>()
    allUsers.forEach(user => user.favoriteGames.forEach(game => games.add(game)))
    return Array.from(games).sort()
  }, [allUsers])

  const allLanguages = useMemo(() => {
    const languages = new Set<string>()
    allUsers.forEach(user => user.languagesSpoken.forEach(lang => languages.add(lang)))
    return Array.from(languages).sort()
  }, [allUsers])

  const calculateCompatibility = useCallback((user: User): MatchResult => {
    let score = 0
    const reasons: string[] = []
    const commonInterests: string[] = []
    const commonGames: string[] = []

    user.interests.forEach(interest => {
      if (currentUser.interests.includes(interest)) {
        commonInterests.push(interest)
        score += 10
      }
    })

    user.favoriteGames.forEach(game => {
      if (currentUser.favoriteGames.includes(game)) {
        commonGames.push(game)
        score += 15
      }
    })

    if (user.playStyle === currentUser.playStyle) {
      score += 20
      reasons.push(`같은 플레이 스타일 (${user.playStyle})`)
    }

    const levelDiff = Math.abs(user.level - currentUser.level)
    if (levelDiff <= 5) {
      score += 15 - levelDiff
      reasons.push('비슷한 레벨')
    }

    const skillDiff = ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(user.preferences.skillLevel) -
                     ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(currentUser.preferences.skillLevel)
    if (Math.abs(skillDiff) <= 1) {
      score += 10
      reasons.push('유사한 실력')
    }

    user.languagesSpoken.forEach(lang => {
      if (currentUser.languagesSpoken.includes(lang)) {
        score += 8
        reasons.push(`공통 언어: ${lang}`)
      }
    })

    if (user.timezone === currentUser.timezone) {
      score += 12
      reasons.push('같은 타임존')
    }

    user.personalityTraits.forEach(trait => {
      if (currentUser.personalityTraits.includes(trait)) {
        score += 5
        reasons.push(`공통 성격: ${trait}`)
      }
    })

    if (user.status === 'online') {
      score += 5
    }

    const compatibility = Math.min(Math.round(score), 100)

    if (commonInterests.length > 0) {
      reasons.unshift(`${commonInterests.length}개 공통 관심사`)
    }
    if (commonGames.length > 0) {
      reasons.unshift(`${commonGames.length}개 공통 게임`)
    }

    return {
      user,
      compatibility,
      matchReasons: reasons.slice(0, 3),
      commonInterests,
      commonGames
    }
  }, [currentUser])

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter(user => user.id !== currentUser.id)
      .filter(user => !friends.some(friend => friend.id === user.id))
      .filter(user => {
        if (searchQuery) {
          return user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 user.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase())) ||
                 user.favoriteGames.some(game => game.toLowerCase().includes(searchQuery.toLowerCase()))
        }
        return true
      })
      .filter(user => {
        if (matchCriteria.onlineOnly && user.status === 'offline') return false
        
        if (matchCriteria.interests.length > 0) {
          const hasCommonInterest = matchCriteria.interests.some(interest => 
            user.interests.includes(interest)
          )
          if (!hasCommonInterest) return false
        }

        if (matchCriteria.games.length > 0) {
          const hasCommonGame = matchCriteria.games.some(game => 
            user.favoriteGames.includes(game)
          )
          if (!hasCommonGame) return false
        }

        if (matchCriteria.skillLevel.length > 0) {
          if (!matchCriteria.skillLevel.includes(user.preferences.skillLevel)) return false
        }

        if (matchCriteria.playStyle.length > 0) {
          if (!matchCriteria.playStyle.includes(user.playStyle)) return false
        }

        if (matchCriteria.languages.length > 0) {
          const hasCommonLanguage = matchCriteria.languages.some(lang => 
            user.languagesSpoken.includes(lang)
          )
          if (!hasCommonLanguage) return false
        }

        return true
      })
      .map(calculateCompatibility)
      .sort((a, b) => b.compatibility - a.compatibility)
  }, [allUsers, currentUser.id, friends, searchQuery, matchCriteria, calculateCompatibility])

  const pendingRequests = friendRequests.filter(req => req.status === 'pending')
  const sentRequests = friendRequests.filter(req => req.fromUser.id === currentUser.id)

  const handleSendFriendRequest = useCallback(() => {
    if (selectedUser && friendRequestMessage.trim()) {
      onSendFriendRequest(selectedUser.id, friendRequestMessage.trim())
      setShowSendRequest(false)
      setFriendRequestMessage('')
      setSelectedUser(null)
    }
  }, [selectedUser, friendRequestMessage, onSendFriendRequest])

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

  const getCompatibilityColor = (compatibility: number) => {
    if (compatibility >= 80) return 'text-green-400'
    if (compatibility >= 60) return 'text-yellow-400'
    if (compatibility >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">소셜 시스템</h1>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Filter className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="사용자, 관심사, 게임으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-700 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">관심사</label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {allInterests.slice(0, 8).map(interest => (
                        <label key={interest} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={matchCriteria.interests.includes(interest)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMatchCriteria(prev => ({
                                  ...prev,
                                  interests: [...prev.interests, interest]
                                }))
                              } else {
                                setMatchCriteria(prev => ({
                                  ...prev,
                                  interests: prev.interests.filter(i => i !== interest)
                                }))
                              }
                            }}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">게임</label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {allGames.slice(0, 8).map(game => (
                        <label key={game} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={matchCriteria.games.includes(game)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMatchCriteria(prev => ({
                                  ...prev,
                                  games: [...prev.games, game]
                                }))
                              } else {
                                setMatchCriteria(prev => ({
                                  ...prev,
                                  games: prev.games.filter(g => g !== game)
                                }))
                              }
                            }}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">{game}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">플레이 스타일</label>
                      <div className="space-y-1">
                        {['casual', 'competitive', 'hardcore'].map(style => (
                          <label key={style} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={matchCriteria.playStyle.includes(style as User['playStyle'])}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMatchCriteria(prev => ({
                                    ...prev,
                                    playStyle: [...prev.playStyle, style as User['playStyle']]
                                  }))
                                } else {
                                  setMatchCriteria(prev => ({
                                    ...prev,
                                    playStyle: prev.playStyle.filter(s => s !== style)
                                  }))
                                }
                              }}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">{style}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={matchCriteria.onlineOnly}
                        onChange={(e) => setMatchCriteria(prev => ({ ...prev, onlineOnly: e.target.checked }))}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white">온라인 사용자만</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex space-x-6 px-6">
            {(['discover', 'friends', 'requests'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'discover' && '탐색'}
                {tab === 'friends' && '친구'}
                {tab === 'requests' && '요청'}
                {tab === 'requests' && pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'discover' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map(({ user, compatibility, matchReasons, commonInterests, commonGames }) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-xl p-6 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${getStatusColor(user.status)}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{user.username}</h3>
                            <p className="text-sm text-gray-400">레벨 {user.level}</p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getCompatibilityColor(compatibility)}`}>
                          {compatibility}%
                        </div>
                      </div>

                      <div className="space-y-3">
                        {user.bio && (
                          <p className="text-sm text-gray-300 line-clamp-2">{user.bio}</p>
                        )}

                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{user.location || '위치 미공개'}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Gamepad2 className="w-4 h-4" />
                          <span>{user.playStyle}</span>
                        </div>

                        {commonGames.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">공통 게임</p>
                            <div className="flex flex-wrap gap-1">
                              {commonGames.slice(0, 3).map(game => (
                                <span key={game} className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
                                  {game}
                                </span>
                              ))}
                              {commonGames.length > 3 && (
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                                  +{commonGames.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {matchReasons.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">매칭 이유</p>
                            <div className="space-y-1">
                              {matchReasons.slice(0, 2).map((reason, index) => (
                                <div key={index} className="flex items-center space-x-1">
                                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                                  <span className="text-xs text-gray-300">{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex space-x-1">
                            {user.badges.slice(0, 3).map(badge => (
                              <div
                                key={badge.id}
                                className={`w-6 h-6 rounded-full bg-gradient-to-r ${getBadgeColor(badge.rarity)} flex items-center justify-center text-xs`}
                              >
                                {badge.icon}
                              </div>
                            ))}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUser(user)
                              setShowSendRequest(true)
                            }}
                            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <UserPlus className="w-4 h-4 text-white" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">매칭된 사용자가 없습니다</h3>
                    <p className="text-gray-400">필터를 조정하거나 검색어를 변경해보세요</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'friends' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="space-y-4">
                  {friends.map(friend => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${getStatusColor(friend.status)}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{friend.username}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>레벨 {friend.level}</span>
                            <span>•</span>
                            <span>{friend.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onRemoveFriend(friend.id)}
                          className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <UserX className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {friends.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">아직 친구가 없습니다</h3>
                    <p className="text-gray-400">탐색 탭에서 새로운 친구를 찾아보세요</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">받은 요청</h3>
                  <div className="space-y-3">
                    {pendingRequests.map(request => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <img
                              src={request.fromUser.avatar}
                              alt={request.fromUser.username}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <h4 className="font-medium text-white">{request.fromUser.username}</h4>
                              <p className="text-sm text-gray-400 mb-2">레벨 {request.fromUser.level}</p>
                              {request.message && (
                                <p className="text-sm text-gray-300 bg-gray-700 rounded-lg p-2 max-w-xs">
                                  {request.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onAcceptFriendRequest(request.id)}
                              className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onDeclineFriendRequest(request.id)}
                              className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {pendingRequests.length === 0 && (
                      <p className="text-gray-400 text-center py-8">받은 친구 요청이 없습니다</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">보낸 요청</h3>
                  <div className="space-y-3">
                    {sentRequests.map(request => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={allUsers.find(u => u.id === request.toUserId)?.avatar || ''}
                            alt="User"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h4 className="font-medium text-white">
                              {allUsers.find(u => u.id === request.toUserId)?.username}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {new Date(request.createdAt).toLocaleDateString()} 전송
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-900 text-yellow-300 text-sm rounded-full">
                          대기 중
                        </span>
                      </motion.div>
                    ))}
                    {sentRequests.length === 0 && (
                      <p className="text-gray-400 text-center py-8">보낸 친구 요청이 없습니다</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Friend Request Modal */}
      <AnimatePresence>
        {showSendRequest && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSendRequest(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">친구 요청 보내기</h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium text-white">{selectedUser.username}</h4>
                  <p className="text-sm text-gray-400">레벨 {selectedUser.level}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">메시지 (선택사항)</label>
                <textarea
                  value={friendRequestMessage}
                  onChange={(e) => setFriendRequestMessage(e.target.value)}
                  placeholder="친구 요청과 함께 보낼 메시지를 입력하세요..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">{friendRequestMessage.length}/200</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSendRequest(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendFriendRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  요청 보내기
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}