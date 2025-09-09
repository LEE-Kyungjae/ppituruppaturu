// frontend/src/pages/_app.tsx
import '@/styles/globals.css'
import '@/styles/flutter-theme.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // AdMob 초기화
    if (process.env.NEXT_PUBLIC_ADMOB_APP_ID) {
      // AdMob SDK 로드 (프로덕션에서)
    }
  }, [])

  return <Component {...pageProps} />
}