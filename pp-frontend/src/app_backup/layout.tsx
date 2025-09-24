import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '삐뚜루빠뚜루 - 게임 플랫폼',
    template: '%s | 삐뚜루빠뚜루'
  },
  description: '실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼',
  keywords: ['게임', '미니게임', '채팅', '소셜', '플랫폼'],
  authors: [{ name: '삐뚜루빠뚜루 Team' }],
  creator: '삐뚜루빠뚜루',
  publisher: '삐뚜루빠뚜루',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: '삐뚜루빠뚜루',
    title: '삐뚜루빠뚜루 - 게임 플랫폼',
    description: '실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼',
    url: 'https://ppituru-ppaturu.com',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '삐뚜루빠뚜루 - 게임 플랫폼',
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