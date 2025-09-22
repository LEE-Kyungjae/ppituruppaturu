import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function KakaoCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const { code, error: oauthError } = router.query

        if (oauthError) {
          setError('로그인이 취소되었거나 오류가 발생했습니다.')
          setStatus('error')
          return
        }

        if (!code) {
          setError('인증 코드를 받지 못했습니다.')
          setStatus('error')
          return
        }

        // 백엔드로 카카오 인증 코드 전송
        const response = await fetch('/api/auth/kakao/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '로그인 처리 중 오류가 발생했습니다.')
        }

        // JWT 토큰을 localStorage에 저장
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        setStatus('success')

        // 2초 후 메인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/')
        }, 2000)

      } catch (error) {
        console.error('Kakao login error:', error)
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
        setStatus('error')
      }
    }

    if (router.isReady) {
      handleKakaoCallback()
    }
  }, [router.isReady, router.query])

  return (
    <>
      <Head>
        <title>카카오 로그인 처리 중... - PittuRu PpattuRu</title>
      </Head>

      <div className="game-container">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="card-game">
              {status === 'processing' && (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold mb-2">카카오 로그인 처리 중...</h2>
                  <p className="text-gray-400">잠시만 기다려주세요.</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <h2 className="text-xl font-bold mb-2 text-green-400">로그인 성공!</h2>
                  <p className="text-gray-400">메인 페이지로 이동합니다...</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="text-red-500 text-6xl mb-4">✗</div>
                  <h2 className="text-xl font-bold mb-2 text-red-400">로그인 실패</h2>
                  <p className="text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="btn-game"
                  >
                    다시 시도하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}