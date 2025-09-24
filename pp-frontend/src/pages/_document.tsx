import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 기본 메타 태그 */}
        <meta charSet="utf-8" />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        
        {/* PWA 메타 태그 */}
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Open Graph 기본 설정 */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="삐뚜루빠뚜루 게임 플랫폼" />
        <meta property="og:locale" content="ko_KR" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ppituru" />
        
        {/* 파비콘 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* 매니페스트 */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* 폰트 최적화 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* 구조화된 데이터 - 웹사이트 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "삐뚜루빠뚜루 게임 플랫폼",
              "alternateName": "피투루 게임 플랫폼",
              "url": "https://ppituruppaturu.com",
              "description": "5종 미니게임을 플레이하고 포인트를 획득하는 무료 게임 플랫폼",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://ppituruppaturu.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://github.com/ppituru",
                "https://discord.gg/ppituru"
              ]
            })
          }}
        />
        
        {/* 구조화된 데이터 - 게임 애플리케이션 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GameApplication",
              "name": "삐뚜루빠뚜루 게임 플랫폼",
              "applicationCategory": "Game",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              },
              "author": {
                "@type": "Organization",
                "name": "삐뚜루빠뚜루"
              },
              "datePublished": "2024-01-01",
              "description": "클릭 스피드, 메모리 매치, 숫자 맞추기 등 다양한 미니게임을 무료로 즐기고 포인트를 획득하세요"
            })
          }}
        />
        
        {/* 구조화된 데이터 - 게임 목록 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "게임 목록",
              "numberOfItems": 5,
              "itemListElement": [
                {
                  "@type": "Game",
                  "position": 1,
                  "name": "클릭 스피드",
                  "description": "10초 안에 최대한 많이 클릭하여 점수를 획득하는 게임",
                  "url": "https://ppituruppaturu.com/games/click-speed"
                },
                {
                  "@type": "Game", 
                  "position": 2,
                  "name": "메모리 매치",
                  "description": "카드 짝을 맞춰 점수를 획득하는 기억력 게임",
                  "url": "https://ppituruppaturu.com/games/memory-match"
                },
                {
                  "@type": "Game",
                  "position": 3, 
                  "name": "숫자 맞추기",
                  "description": "적은 시도로 숫자를 맞히는 추리 게임",
                  "url": "https://ppituruppaturu.com/games/number-guess"
                }
              ]
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
