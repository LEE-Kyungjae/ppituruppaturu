// frontend/src/components/admin/AdminLayout.tsx
import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  AlertTriangle,
  Search,
  Gamepad2,
  Shield
} from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import AdminAuthService, { AdminUser } from '@/lib/admin/AdminAuthService'

interface AdminLayoutProps {
  children: ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
}

const navigation: NavItem[] = [
  { name: '대시보드', href: '/admin', icon: LayoutDashboard },
  { name: '회원 관리', href: '/admin/users', icon: Users },
  { name: '게임 관리', href: '/admin/games', icon: Gamepad2 },
  { name: '결제 관리', href: '/admin/payments', icon: CreditCard },
  { name: '시스템 로그', href: '/admin/logs', icon: Activity, badge: 'new' },
  { name: '공지사항', href: '/admin/notices', icon: FileText },
  { name: '설정', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const authService = AdminAuthService.getInstance()

  useEffect(() => {
    // Check authentication and load user data
    if (!authService.isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    const user = authService.getCurrentUser()
    setCurrentUser(user)
    setLoading(false)
  }, [router, authService])

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout even if API call fails
      router.push('/admin/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-flutter-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -320,
        }}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out lg:transition-none`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">PITTURU</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-flutter-blue-100 rounded-full flex items-center justify-center">
              {currentUser?.role === 'super_admin' ? (
                <Shield className="w-5 h-5 text-flutter-blue-600" />
              ) : (
                <span className="text-flutter-blue-600 font-semibold">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentUser?.username || '관리자'}</p>
              <p className="text-sm text-gray-600">{currentUser?.email || 'admin@ppituruppaturu.com'}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentUser?.role === 'super_admin'
                    ? 'bg-red-100 text-red-700'
                    : currentUser?.role === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {currentUser?.role === 'super_admin' ? '최고 관리자' :
                   currentUser?.role === 'admin' ? '관리자' : '운영자'}
                </span>
                {currentUser?.twoFactorEnabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    2FA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-flutter-blue-50 text-flutter-blue-700 border border-flutter-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:ml-80">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationCenter />

              {/* System Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">시스템 정상</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}