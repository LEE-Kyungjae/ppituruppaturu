// frontend/src/pages/admin/login.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader
} from 'lucide-react'
import { apiClient } from '@/services/api'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: '',
    remember: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('admin_token')
    if (token) {
      router.push('/admin')
    }
  }, [router])

  const handleInputChange = (field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<{ access_token: string, refresh_token: string }>('/api/v1/auth/login', {
        username: form.username,
        password: form.password,
      })

      localStorage.setItem('admin_token', response.access_token)
      if (form.remember) {
        localStorage.setItem('admin_remember', 'true')
      }
      
      router.push('/admin')

    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('사용자 이름 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = form.username && form.password

  return (
    <div className="min-h-screen bg-gradient-to-br from-flutter-blue-900 via-flutter-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4"
          >
            <Shield className="w-8 h-8 text-flutter-blue-600" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-2"
          >
            PITTURU 관리자
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/70"
          >
            관리자 계정으로 로그인하세요
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                사용자 이름
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-flutter-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="admin"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-flutter-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="비밀번호 입력"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={form.remember}
                onChange={(e) => handleInputChange('remember', e.target.checked)}
                className="w-4 h-4 text-flutter-blue-600 bg-white/10 border-white/20 rounded focus:ring-flutter-blue-500 focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-3 text-white/90 text-sm">
                로그인 상태 유지
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 hover:from-flutter-blue-600 hover:to-flutter-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  로그인 중...
                </div>
              ) : (
                '관리자 로그인'
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center mt-8"
        >
          <p className="text-white/50 text-sm">
            © 2024 PITTURU. 모든 권리 보유.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}