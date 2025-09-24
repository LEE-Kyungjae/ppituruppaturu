// frontend/src/pages/auth/login.tsx
import Head from 'next/head'
import Link from 'next/link'
import SocialLogin from '@/components/auth/SocialLogin'

export default function Login() {
  return (
    <>
      <Head>
        <title>로그인 - 삐뚜루빠뚜루</title>
        <meta name="description" content="삐뚜루빠뚜루 로그인" />
      </Head>

      <div className="game-container">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link href="/" className="text-4xl font-bold hover:text-purple-400 transition-colors">
                🎮 삐뚜루빠뚜루
              </Link>
              <h2 className="mt-6 text-3xl font-extrabold">
                게임을 시작해보세요!
              </h2>
              <p className="mt-2 text-sm opacity-75">
                소셜 로그인으로 간편하게 시작
              </p>
            </div>

            <div className="card-game">
              <SocialLogin />
              
              <div className="mt-6 text-center">
                <p className="text-sm opacity-75">
                  로그인하면{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300">
                    이용약관
                  </a>
                  {' '}및{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300">
                    개인정보처리방침
                  </a>
                  에 동의하게 됩니다.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link 
                href="/"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                ← 메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}