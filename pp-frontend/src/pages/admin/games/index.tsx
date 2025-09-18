// frontend/src/pages/admin/games/index.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Gamepad2, 
  Eye, 
  EyeOff,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

interface Game {
  id: string
  name: string
  description: string
  isActive: boolean
  displayOrder: number
  category: string
  iconEmoji: string
  maxPlayers: number
  minPlayers: number
  difficultyLevel: 'easy' | 'medium' | 'hard'
  createdAt: string
  updatedAt: string
}

const CATEGORIES = {
  strategy: '전략',
  puzzle: '퍼즐',
  action: '액션',
  educational: '교육',
  music: '음악',
  general: '일반'
}

const DIFFICULTY_LEVELS = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
}

export default function GamesAdminPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setRefreshing(true)
      // TODO: 실제 API 호출로 대체
      const mockGames: Game[] = [
        {
          id: '1',
          name: '주사위 배틀',
          description: '운과 전략을 겨루는 주사위 게임',
          isActive: true,
          displayOrder: 1,
          category: 'strategy',
          iconEmoji: '🎲',
          maxPlayers: 4,
          minPlayers: 2,
          difficultyLevel: 'easy',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: '카드 매치',
          description: '기억력을 시험하는 카드 맞추기 게임',
          isActive: true,
          displayOrder: 2,
          category: 'puzzle',
          iconEmoji: '🃏',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'medium',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '3',
          name: '퍼즐 챌린지',
          description: '논리적 사고를 요구하는 퍼즐 게임',
          isActive: true,
          displayOrder: 3,
          category: 'puzzle',
          iconEmoji: '🧩',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'hard',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '4',
          name: '스피드 레이싱',
          description: '빠른 반응속도가 필요한 레이싱 게임',
          isActive: true,
          displayOrder: 4,
          category: 'action',
          iconEmoji: '🏎️',
          maxPlayers: 8,
          minPlayers: 1,
          difficultyLevel: 'medium',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '5',
          name: '숫자 맞추기',
          description: '수학적 감각을 키우는 숫자 게임',
          isActive: true,
          displayOrder: 5,
          category: 'educational',
          iconEmoji: '🔢',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'easy',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '6',
          name: '타워 디펜스',
          description: '전략적 사고가 필요한 디펜스 게임',
          isActive: false,
          displayOrder: 6,
          category: 'strategy',
          iconEmoji: '🏰',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'hard',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '7',
          name: '메모리 게임',
          description: '기억력 향상을 위한 훈련 게임',
          isActive: false,
          displayOrder: 7,
          category: 'puzzle',
          iconEmoji: '🧠',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'medium',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '8',
          name: '리듬 게임',
          description: '음악에 맞춰 플레이하는 리듬 게임',
          isActive: false,
          displayOrder: 8,
          category: 'music',
          iconEmoji: '🎵',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'medium',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '9',
          name: '워드 퍼즐',
          description: '단어 실력을 늘리는 단어 게임',
          isActive: false,
          displayOrder: 9,
          category: 'educational',
          iconEmoji: '📝',
          maxPlayers: 1,
          minPlayers: 1,
          difficultyLevel: 'easy',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '10',
          name: '액션 슈터',
          description: '빠른 판단력이 필요한 슈팅 게임',
          isActive: false,
          displayOrder: 10,
          category: 'action',
          iconEmoji: '🎯',
          maxPlayers: 6,
          minPlayers: 1,
          difficultyLevel: 'hard',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]
      
      setGames(mockGames)
    } catch (error) {
      console.error('Failed to load games:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleToggleActive = async (gameId: string, currentStatus: boolean) => {
    try {
      // TODO: 실제 API 호출로 대체
      console.log(`Toggle game ${gameId} from ${currentStatus} to ${!currentStatus}`)
      
      setGames(games.map(game => 
        game.id === gameId 
          ? { ...game, isActive: !currentStatus, updatedAt: new Date().toISOString() }
          : game
      ))
    } catch (error) {
      console.error('Failed to toggle game status:', error)
    }
  }

  const handleUpdateOrder = async (gameId: string, direction: 'up' | 'down') => {
    try {
      const gameIndex = games.findIndex(g => g.id === gameId)
      if (gameIndex === -1) return

      const newGames = [...games]
      const currentGame = newGames[gameIndex]
      
      if (direction === 'up' && gameIndex > 0) {
        // Swap with previous game
        const previousGame = newGames[gameIndex - 1]
        newGames[gameIndex - 1] = { ...currentGame, displayOrder: previousGame.displayOrder }
        newGames[gameIndex] = { ...previousGame, displayOrder: currentGame.displayOrder }
      } else if (direction === 'down' && gameIndex < newGames.length - 1) {
        // Swap with next game
        const nextGame = newGames[gameIndex + 1]
        newGames[gameIndex + 1] = { ...currentGame, displayOrder: nextGame.displayOrder }
        newGames[gameIndex] = { ...nextGame, displayOrder: currentGame.displayOrder }
      }

      // Sort by display order
      newGames.sort((a, b) => a.displayOrder - b.displayOrder)
      setGames(newGames)
      
      // TODO: 실제 API 호출로 대체
      console.log(`Move game ${gameId} ${direction}`)
    } catch (error) {
      console.error('Failed to update game order:', error)
    }
  }

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || game.category === categoryFilter
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && game.isActive) ||
                         (activeFilter === 'inactive' && !game.isActive)
    
    return matchesSearch && matchesCategory && matchesActive
  })

  const activeGamesCount = games.filter(g => g.isActive).length
  const totalGamesCount = games.length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-flutter-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">게임 관리</h1>
            <p className="text-gray-600 mt-1">
              게임의 활성화 상태와 순서를 관리합니다
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadGames}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-flutter-blue-600 hover:bg-flutter-blue-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              게임 추가
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 게임</p>
                <p className="text-2xl font-bold text-gray-900">{totalGamesCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">활성 게임</p>
                <p className="text-2xl font-bold text-green-600">{activeGamesCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">비활성 게임</p>
                <p className="text-2xl font-bold text-gray-600">{totalGamesCount - activeGamesCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="게임 이름 또는 설명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
              >
                <option value="all">모든 카테고리</option>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    게임
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    난이도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    플레이어
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGames.map((game, index) => (
                  <motion.tr
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {game.displayOrder}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleUpdateOrder(game.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleUpdateOrder(game.id, 'down')}
                            disabled={index === filteredGames.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{game.iconEmoji}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {game.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {game.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {CATEGORIES[game.category as keyof typeof CATEGORIES]}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        game.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
                        game.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {DIFFICULTY_LEVELS[game.difficultyLevel]}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}-${game.maxPlayers}`}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(game.id, game.isActive)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          game.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {game.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {game.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-flutter-blue-600 hover:text-flutter-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">게임이 없습니다</h3>
              <p className="text-gray-600">검색 조건을 변경하거나 새 게임을 추가해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}