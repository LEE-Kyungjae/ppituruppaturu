import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PittuRu PpattuRu - 게임 플랫폼',
    template: '%s | PittuRu PpattuRu'
  },
  description: '실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼',
  keywords: ['게임', '미니게임', '채팅', '소셜', '플랫폼'],
  authors: [{ name: 'PittuRu PpattuRu Team' }],
  creator: 'PittuRu PpattuRu',
  publisher: 'PittuRu PpattuRu',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'PittuRu PpattuRu',
    title: 'PittuRu PpattuRu - 게임 플랫폼',
    description: '실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼',
    url: 'https://pitturu-ppaturu.com',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PittuRu PpattuRu - 게임 플랫폼',
    description: '실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}