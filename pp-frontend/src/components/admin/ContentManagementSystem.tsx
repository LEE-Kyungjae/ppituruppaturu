// frontend/src/components/admin/ContentManagementSystem.tsx
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Calendar,
  Users,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  Search,
  Filter,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Image,
  Video,
  Music,
  Download,
  Upload,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  Tag,
  Hash,
  MessageSquare,
  Heart,
  Share2,
  Archive,
  Zap
} from 'lucide-react'

interface Content {
  id: string
  title: string
  type: 'article' | 'event' | 'announcement' | 'game_update' | 'patch_notes'
  category: string
  author: string
  status: 'draft' | 'published' | 'archived' | 'scheduled'
  content: string
  excerpt: string
  tags: string[]
  featuredImage?: string
  attachments: Attachment[]
  publishedAt?: Date
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
  views: number
  likes: number
  comments: number
  shares: number
  isSticky: boolean
  isFeatured: boolean
  visibility: 'public' | 'members_only' | 'vip_only'
  language: string
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
}

interface Attachment {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  size: number
  uploadedAt: Date
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  parentId?: string
  isActive: boolean
  contentCount: number
}

interface CMSStats {
  totalContent: number
  publishedContent: number
  draftContent: number
  totalViews: number
  totalLikes: number
  totalComments: number
  averageEngagement: number
}

interface ContentManagementSystemProps {
  contents: Content[]
  categories: Category[]
  stats: CMSStats
  currentUser: { id: string; role: 'admin' | 'moderator' | 'editor' }
  onCreateContent: (content: Partial<Content>) => void
  onUpdateContent: (id: string, updates: Partial<Content>) => void
  onDeleteContent: (id: string) => void
  onPublishContent: (id: string) => void
  onArchiveContent: (id: string) => void
  onCreateCategory: (category: Partial<Category>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onUploadFile: (file: File) => Promise<string>
}

export default function ContentManagementSystem({
  contents,
  categories,
  stats,
  currentUser,
  onCreateContent,
  onUpdateContent,
  onDeleteContent,
  onPublishContent,
  onArchiveContent,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUploadFile
}: ContentManagementSystemProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'categories' | 'media' | 'settings'>('overview')
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingContent, setEditingContent] = useState<Partial<Content>>({})
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'views' | 'likes'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [previewMode, setPreviewMode] = useState(false)

  const filteredContents = useMemo(() => {
    return contents
      .filter(content => {
        if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !content.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
          return false
        }
        if (filterType !== 'all' && content.type !== filterType) return false
        if (filterStatus !== 'all' && content.status !== filterStatus) return false
        if (filterCategory !== 'all' && content.category !== filterCategory) return false
        return true
      })
      .sort((a, b) => {
        let compareValue = 0
        switch (sortBy) {
          case 'createdAt':
            compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            break
          case 'updatedAt':
            compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            break
          case 'views':
            compareValue = a.views - b.views
            break
          case 'likes':
            compareValue = a.likes - b.likes
            break
        }
        return sortOrder === 'asc' ? compareValue : -compareValue
      })
  }, [contents, searchQuery, filterType, filterStatus, filterCategory, sortBy, sortOrder])

  const handleCreateContent = useCallback(() => {
    if (editingContent.title && editingContent.content) {
      const newContent: Partial<Content> = {
        ...editingContent,
        id: Date.now().toString(),
        author: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        tags: editingContent.tags || [],
        attachments: editingContent.attachments || [],
        isSticky: false,
        isFeatured: false,
        visibility: 'public',
        seo: {
          metaTitle: editingContent.title || '',
          metaDescription: editingContent.excerpt || '',
          keywords: editingContent.tags || []
        }
      }
      onCreateContent(newContent)
      setShowCreateModal(false)
      setEditingContent({})
    }
  }, [editingContent, currentUser.id, onCreateContent])

  const handleUpdateContent = useCallback(() => {
    if (selectedContent && editingContent) {
      onUpdateContent(selectedContent.id, {
        ...editingContent,
        updatedAt: new Date()
      })
      setSelectedContent({ ...selectedContent, ...editingContent, updatedAt: new Date() })
    }
  }, [selectedContent, editingContent, onUpdateContent])

  const handleCreateCategory = useCallback(() => {
    if (editingCategory.name) {
      const newCategory: Partial<Category> = {
        ...editingCategory,
        id: Date.now().toString(),
        isActive: true,
        contentCount: 0
      }
      onCreateCategory(newCategory)
      setShowCategoryModal(false)
      setEditingCategory({})
    }
  }, [editingCategory, onCreateCategory])

  const getStatusColor = (status: Content['status']) => {
    switch (status) {
      case 'published': return 'bg-green-900 text-green-300'
      case 'draft': return 'bg-yellow-900 text-yellow-300'
      case 'archived': return 'bg-gray-700 text-gray-300'
      case 'scheduled': return 'bg-blue-900 text-blue-300'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  const getTypeIcon = (type: Content['type']) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'announcement': return <AlertTriangle className="w-4 h-4" />
      case 'game_update': return <Zap className="w-4 h-4" />
      case 'patch_notes': return <Settings className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">컨텐츠 관리</h2>
        </div>

        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {(['overview', 'content', 'categories', 'media', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab === 'overview' && <BarChart3 className="w-4 h-4" />}
                {tab === 'content' && <FileText className="w-4 h-4" />}
                {tab === 'categories' && <Tag className="w-4 h-4" />}
                {tab === 'media' && <Image className="w-4 h-4" />}
                {tab === 'settings' && <Settings className="w-4 h-4" />}
                <span>
                  {tab === 'overview' && '개요'}
                  {tab === 'content' && '컨텐츠'}
                  {tab === 'categories' && '카테고리'}
                  {tab === 'media' && '미디어'}
                  {tab === 'settings' && '설정'}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-2">빠른 통계</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>총 컨텐츠</span>
                <span>{stats.totalContent}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>게시됨</span>
                <span>{stats.publishedContent}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>초안</span>
                <span>{stats.draftContent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 p-6"
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">대시보드 개요</h1>
                <p className="text-gray-400">컨텐츠 관리 시스템의 전체 현황을 확인하세요</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">총 조회수</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</p>
                    </div>
                    <Eye className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+12.5%</span>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">총 좋아요</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(stats.totalLikes)}</p>
                    </div>
                    <Heart className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+8.3%</span>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">총 댓글</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(stats.totalComments)}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+15.7%</span>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">참여도</p>
                      <p className="text-2xl font-bold text-white">{stats.averageEngagement}%</p>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+5.2%</span>
                  </div>
                </div>
              </div>

              {/* Recent Content */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">최근 컨텐츠</h3>
                  <div className="space-y-3">
                    {contents.slice(0, 5).map(content => (
                      <div key={content.id} className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(content.status)}`}>
                          {getTypeIcon(content.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{content.title}</p>
                          <p className="text-xs text-gray-400">{formatDate(content.updatedAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(content.views)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">인기 카테고리</h3>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map(category => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                          <span className="text-sm text-white">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{category.contentCount}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-white">컨텐츠 관리</h1>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 컨텐츠</span>
                  </motion.button>
                </div>

                {/* Search and Filters */}
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="컨텐츠 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  >
                    <option value="all">모든 타입</option>
                    <option value="article">기사</option>
                    <option value="event">이벤트</option>
                    <option value="announcement">공지사항</option>
                    <option value="game_update">게임 업데이트</option>
                    <option value="patch_notes">패치 노트</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  >
                    <option value="all">모든 상태</option>
                    <option value="published">게시됨</option>
                    <option value="draft">초안</option>
                    <option value="archived">보관됨</option>
                    <option value="scheduled">예약됨</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                  >
                    <option value="createdAt">생성일</option>
                    <option value="updatedAt">수정일</option>
                    <option value="views">조회수</option>
                    <option value="likes">좋아요</option>
                  </select>
                </div>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div className="space-y-4">
                    {filteredContents.map(content => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.01 }}
                        className="bg-gray-800 p-6 rounded-lg cursor-pointer"
                        onClick={() => setSelectedContent(content)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`p-1 rounded ${getStatusColor(content.status)}`}>
                                {getTypeIcon(content.type)}
                              </div>
                              <h3 className="font-semibold text-white">{content.title}</h3>
                              {content.isSticky && <Star className="w-4 h-4 text-yellow-400" />}
                              {content.isFeatured && <Zap className="w-4 h-4 text-purple-400" />}
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{content.excerpt}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>작성자: {content.author}</span>
                              <span>•</span>
                              <span>{formatDate(content.updatedAt)}</span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatNumber(content.views)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{formatNumber(content.likes)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{formatNumber(content.comments)}</span>
                              </span>
                            </div>
                            
                            {content.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {content.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                                {content.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                                    +{content.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedContent(content)
                                setEditingContent(content)
                              }}
                              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-white" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteContent(content.id)
                              }}
                              className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {filteredContents.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">컨텐츠가 없습니다</h3>
                      <p className="text-gray-400 mb-4">첫 번째 컨텐츠를 만들어보세요</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        새 컨텐츠 만들기
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">카테고리 관리</h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>새 카테고리</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-800 p-6 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full bg-${category.color}-500`} />
                        <h3 className="font-semibold text-white">{category.name}</h3>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        category.isActive 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {category.isActive ? '활성' : '비활성'}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">{category.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{category.contentCount}개 컨텐츠</span>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDeleteCategory(category.id)}
                          className="p-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Content Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-6">새 컨텐츠 만들기</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">제목</label>
                    <input
                      type="text"
                      value={editingContent.title || ''}
                      onChange={(e) => setEditingContent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                      placeholder="컨텐츠 제목을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">타입</label>
                    <select
                      value={editingContent.type || 'article'}
                      onChange={(e) => setEditingContent(prev => ({ ...prev, type: e.target.value as Content['type'] }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="article">기사</option>
                      <option value="event">이벤트</option>
                      <option value="announcement">공지사항</option>
                      <option value="game_update">게임 업데이트</option>
                      <option value="patch_notes">패치 노트</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">요약</label>
                  <textarea
                    value={editingContent.excerpt || ''}
                    onChange={(e) => setEditingContent(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 h-20"
                    placeholder="컨텐츠의 간단한 요약을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">내용</label>
                  <textarea
                    value={editingContent.content || ''}
                    onChange={(e) => setEditingContent(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 h-40"
                    placeholder="컨텐츠 내용을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">카테고리</label>
                    <select
                      value={editingContent.category || ''}
                      onChange={(e) => setEditingContent(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">상태</label>
                    <select
                      value={editingContent.status || 'draft'}
                      onChange={(e) => setEditingContent(prev => ({ ...prev, status: e.target.value as Content['status'] }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="draft">초안</option>
                      <option value="published">게시</option>
                      <option value="scheduled">예약</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">태그</label>
                  <input
                    type="text"
                    placeholder="태그를 쉼표로 구분하여 입력하세요"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      setEditingContent(prev => ({ ...prev, tags }))
                    }}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  만들기
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-xl max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">새 카테고리 만들기</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">이름</label>
                  <input
                    type="text"
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="카테고리 이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">설명</label>
                  <textarea
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 h-20"
                    placeholder="카테고리 설명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">색상</label>
                  <select
                    value={editingCategory.color || 'blue'}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="blue">파란색</option>
                    <option value="green">초록색</option>
                    <option value="red">빨간색</option>
                    <option value="yellow">노란색</option>
                    <option value="purple">보라색</option>
                    <option value="pink">분홍색</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  만들기
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}