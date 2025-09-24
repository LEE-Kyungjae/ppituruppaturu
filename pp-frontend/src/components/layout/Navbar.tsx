// frontend/src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import PointsDisplay from '../ui/PointsDisplay'

interface NavbarProps {
  isLoggedIn?: boolean
  username?: string
  points?: number
  onLogin?: () => void
  onLogout?: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn = false,
  username = '',
  points = 0,
  onLogin,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const menuItems = [
    { name: '홈', href: '/', icon: '🏠' },
    { name: '게임', href: '/games', icon: '🎮' },
    { name: '리더보드', href: '/leaderboard', icon: '🏆' },
    { name: '상점', href: '/shop', icon: '🛒' },
    { name: '채팅', href: '/chat', icon: '💬' },
    { name: '설정', href: '/settings', icon: '⚙️' },
    { name: '프로필', href: '/profile', icon: '👤' }
  ]

  return (
    <motion.nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-flutter-gray-200/50 shadow-lg' 
          : 'bg-transparent'
        }
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl">🎮</div>
            <span className={`text-xl font-bold hidden sm:block transition-colors duration-300 ${
              isScrolled ? 'text-flutter-gray-800' : 'text-flutter-gray-800'
            }`}>
              삐뚜루빠뚜루 게임
            </span>
          </motion.div>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 rounded-lg ${
                  isScrolled 
                    ? 'text-flutter-gray-600 hover:text-flutter-gray-900 hover:bg-flutter-gray-100/50'
                    : 'text-flutter-gray-700 hover:text-flutter-gray-900 hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </motion.a>
            ))}
          </div>

          {/* 우측 사용자 영역 */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* 포인트 표시 */}
                <PointsDisplay 
                  points={points} 
                  size="small" 
                  variant="gold"
                />

                {/* 사용자 드롭다운 */}
                <div className="relative">
                  <motion.button
                    className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 rounded-lg ${
                      isScrolled 
                        ? 'bg-flutter-gray-100/70 hover:bg-flutter-gray-200/70 text-flutter-gray-800'
                        : 'bg-white/20 hover:bg-white/30 text-flutter-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block font-medium">{username}</span>
                    <motion.div
                      animate={{ rotate: isMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link href="/profile" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                          👤 프로필
                        </Link>
                        <Link href="/settings" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                          ⚙️ 설정
                        </Link>
                        <hr className="border-gray-700 my-2" />
                        <button 
                          onClick={onLogout}
                          className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                        >
                          🚪 로그아웃
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.button
                onClick={onLogin}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                로그인
              </motion.button>
            )}

            {/* 모바일 메뉴 버튼 */}
            <motion.button
              className="md:hidden text-white p-2"
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-around">
                <motion.div
                  className="w-full h-0.5 bg-white"
                  animate={{ 
                    rotate: isMenuOpen ? 45 : 0,
                    y: isMenuOpen ? 8 : 0 
                  }}
                />
                <motion.div
                  className="w-full h-0.5 bg-white"
                  animate={{ opacity: isMenuOpen ? 0 : 1 }}
                />
                <motion.div
                  className="w-full h-0.5 bg-white"
                  animate={{ 
                    rotate: isMenuOpen ? -45 : 0,
                    y: isMenuOpen ? -8 : 0 
                  }}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-800/50"
                  whileHover={{ x: 10 }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
