import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import axios from 'axios'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Search,
  Filter,
  MoreVertical,
  User,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  Mail,
  Shield,
  Ban,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'

const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

adminApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface User {
  id: string
  username: string
  email: string
  displayName?: string
  status: 'active' | 'inactive' | 'banned'
  lastLogin?: string
  createdAt: string
  points: number
  totalPurchases: number
  totalSpent: number
  gamePlayCount: number
  sessionCount: number
  isOnline: boolean
  profileImage?: string
}

interface UserFilters {
  status: 'all' | 'active' | 'inactive' | 'banned'
  registrationPeriod: 'all' | '7d' | '30d' | '90d'
  activity: 'all' | 'online' | 'recent' | 'inactive'
  sortBy: 'newest' | 'oldest' | 'lastLogin' | 'totalSpent' | 'points'
}

export default function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({
    status: 'all',
    registrationPeriod: 'all',
    activity: 'all',
    sortBy: 'newest'
  })
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // In a real app, you would fetch users from the API
      // For now, we use mock data and simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'user123',
          email: 'user123@example.com',
          displayName: '김철수',
          status: 'active',
          lastLogin: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          points: 2500,
          totalPurchases: 5,
          totalSpent: 25000,
          gamePlayCount: 142,
          sessionCount: 67,
          isOnline: true
        },
        {
          id: '2',
          username: 'player456',
          email: 'player456@gmail.com',
          displayName: '이영희',
          status: 'active',
          lastLogin: '2024-01-14T15:20:00Z',
          createdAt: '2023-12-15T14:30:00Z',
          points: 5420,
          totalPurchases: 12,
          totalSpent: 87000,
          gamePlayCount: 298,
          sessionCount: 156,
          isOnline: false
        },
        {
          id: '3',
          username: 'gamer789',
          email: 'gamer789@naver.com',
          status: 'inactive',
          lastLogin: '2023-12-20T08:15:00Z',
          createdAt: '2023-11-10T11:45:00Z',
          points: 120,
          totalPurchases: 1,
          totalSpent: 5000,
          gamePlayCount: 45,
          sessionCount: 23,
          isOnline: false
        },
        {
          id: '4',
          username: 'spammer999',
          email: 'spam@fake.com',
          status: 'banned',
          lastLogin: '2024-01-10T12:00:00Z',
          createdAt: '2024-01-08T16:20:00Z',
          points: 0,
          totalPurchases: 0,
          totalSpent: 0,
          gamePlayCount: 12,
          sessionCount: 8,
          isOnline: false
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (action === 'ban') {
      setUserToBan(user);
      setShowBanModal(true);
    } else {
      console.log(`Action: ${action} on user: ${userId}`)
    }
  }

  const handleConfirmBan = async () => {
    if (!userToBan) return;

    try {
      await adminApiClient.post(`/api/v1/admin/users/${userToBan.username}/ban`);
      setShowBanModal(false);
      setUserToBan(null);
      loadUsers(); // Reload users to show updated status
    } catch (error) {
      console.error('Failed to ban user:', error);
      // Handle error UI
    }
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (
        !user.username.toLowerCase().includes(searchLower) &&
        !user.email.toLowerCase().includes(searchLower) &&
        !user.displayName?.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }

    // Status filter
    if (filters.status !== 'all' && user.status !== filters.status) {
      return false
    }

    // Activity filter
    if (filters.activity !== 'all') {
      const now = new Date()
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null
      
      if (filters.activity === 'online' && !user.isOnline) return false
      if (filters.activity === 'recent' && lastLogin) {
        const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLogin > 7) return false
      }
      if (filters.activity === 'inactive' && lastLogin) {
        const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLogin <= 30) return false
      }
    }

    return true
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'lastLogin':
        if (!a.lastLogin && !b.lastLogin) return 0
        if (!a.lastLogin) return 1
        if (!b.lastLogin) return -1
        return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      case 'totalSpent':
        return b.totalSpent - a.totalSpent
      case 'points':
        return b.points - a.points
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'banned':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'banned':
        return '차단됨'
      default:
        return status
    }
  }

  const handleUserSelect = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (selected) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(sortedUsers.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on users: ${Array.from(selectedUsers)}`)
    // TODO: 대량 액션 구현
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
            <p className="text-gray-600 mt-1">
              총 {users.length}명의 회원 • {users.filter(u => u.isOnline).length}명 온라인
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
            
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-flutter-blue-500 text-white rounded-xl hover:bg-flutter-blue-600 transition-colors">
              <Download className="w-4 h-4" />
              Excel 다운로드
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="사용자명, 이메일, 닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters
                  ? 'bg-flutter-blue-50 text-flutter-blue-700 border-flutter-blue-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-flutter-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="banned">차단됨</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">가입 기간</label>
                <select
                  value={filters.registrationPeriod}
                  onChange={(e) => setFilters(prev => ({ ...prev, registrationPeriod: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-flutter-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="7d">최근 7일</option>
                  <option value="30d">최근 30일</option>
                  <option value="90d">최근 90일</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">활동</label>
                <select
                  value={filters.activity}
                  onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-flutter-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="online">온라인</option>
                  <option value="recent">최근 활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-flutter-blue-500"
                >
                  <option value="newest">가입일 (최신순)</option>
                  <option value="oldest">가입일 (오래된순)</option>
                  <option value="lastLogin">최근 로그인</option>
                  <option value="totalSpent">총 구매금액</option>
                  <option value="points">포인트</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-flutter-blue-50 border border-flutter-blue-200 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-flutter-blue-700 font-medium">
                {selectedUsers.size}명의 회원이 선택됨
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  활성화
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  비활성화
                </button>
                <button
                  onClick={() => handleBulkAction('ban')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  차단
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-flutter-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">회원 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === sortedUsers.length && sortedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-flutter-blue-600 rounded focus:ring-flutter-blue-500"
                  />
                  <span className="ml-4 text-sm font-medium text-gray-700">
                    회원 정보
                  </span>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {sortedUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>조건에 맞는 회원이 없습니다.</p>
                  </div>
                ) : (
                  sortedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                            className="w-4 h-4 text-flutter-blue-600 rounded focus:ring-flutter-blue-500"
                          />
                          
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-flutter-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-flutter-blue-600" />
                              </div>
                              {user.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {user.displayName || user.username}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(user.status)}`}>
                                  {getStatusText(user.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                </span>
                                {user.lastLogin && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(user.lastLogin).toLocaleDateString('ko-KR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">포인트</div>
                            <div className="font-semibold text-yellow-600">
                              {user.points.toLocaleString()}P
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">총 구매</div>
                            <div className="font-semibold text-green-600">
                              {user.totalSpent.toLocaleString()}원
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">게임</div>
                            <div className="font-semibold text-purple-600">
                              {user.gamePlayCount}회
                            </div>
                          </div>

                          <div className="relative">
                            <button 
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination would go here */}
      </div>

      {/* Ban Confirmation Modal */}
      {showBanModal && userToBan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl max-w-md w-full mx-4 shadow-lg"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-5">사용자 차단</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  정말로 <span className="font-bold">{userToBan.username}</span>님을 차단하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="mt-5 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBan}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  차단하기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  )
}