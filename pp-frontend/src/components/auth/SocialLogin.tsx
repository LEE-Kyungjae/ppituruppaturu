// frontend/src/components/auth/SocialLogin.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'

const SocialLogin = () => {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setLoading('google')
    try {
      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&response_type=code&scope=email profile`
      window.location.href = googleAuthUrl
    } catch (error) {
      console.error('Google login error:', error)
      setLoading(null)
    }
  }

  const handleKakaoLogin = async () => {
    setLoading('kakao')
    try {
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/kakao/callback')}&response_type=code`
      window.location.href = kakaoAuthUrl
    } catch (error) {
      console.error('Kakao login error:', error)
      setLoading(null)
    }
  }

  const handleNaverLogin = async () => {
    setLoading('naver')
    try {
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/naver/callback')}&response_type=code&state=${state}`
      sessionStorage.setItem('naver_state', state)
      window.location.href = naverAuthUrl
    } catch (error) {
      console.error('Naver login error:', error)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleLogin}
        disabled={loading === 'google'}
        className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading === 'google' ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        구글로 로그인
      </button>

      <button
        onClick={handleKakaoLogin}
        disabled={loading === 'kakao'}
        className="w-full flex items-center justify-center relative overflow-hidden rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading === 'kakao' ? (
          <div className="absolute inset-0 bg-yellow-400/90 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-yellow-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        <img 
          src="/assets/images/auth/kakao_login_medium_wide.png"
          alt="카카오로 로그인"
          className="w-full h-auto max-w-[300px]"
        />
      </button>

      <button
        onClick={handleNaverLogin}
        disabled={loading === 'naver'}
        className="w-full flex items-center justify-center gap-3 bg-green-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 border border-green-600"
      >
        {loading === 'naver' ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
            <span className="text-green-500 text-xs font-bold">N</span>
          </div>
        )}
        네이버로 로그인
      </button>
    </div>
  )
}

export default SocialLogin