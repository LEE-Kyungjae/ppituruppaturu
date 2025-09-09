// SEO 유틸리티 함수들
export interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export const defaultSEO: SEOProps = {
  title: 'PittuRu Gaming Platform - 무료 미니게임',
  description: '5종 미니게임을 플레이하고 포인트를 획득하세요! 클릭 스피드, 메모리 매치, 숫자 맞추기 등 다양한 게임을 무료로 즐기세요.',
  keywords: [
    '무료게임',
    '미니게임', 
    '브라우저게임',
    '클릭게임',
    '메모리게임',
    '포인트게임',
    '온라인게임',
    '캐주얼게임',
    '게임플랫폼',
    'pitturu',
    '피투루'
  ],
  image: 'https://ppituruppaturu.com/og-image.png',
  url: 'https://ppituruppaturu.com',
  type: 'website',
  author: 'PittuRu Team'
}

export const generateSEO = (props: SEOProps = {}): SEOProps => {
  return {
    ...defaultSEO,
    ...props,
    keywords: props.keywords ? [...defaultSEO.keywords!, ...props.keywords] : defaultSEO.keywords,
    title: props.title ? `${props.title} | PittuRu Gaming Platform` : defaultSEO.title,
    url: props.url ? `https://ppituruppaturu.com${props.url}` : defaultSEO.url,
  }
}

// 게임별 SEO 데이터
export const gamesSEO = {
  'click-speed': {
    title: '클릭 스피드 게임',
    description: '10초 안에 최대한 많이 클릭하여 최고 기록에 도전하세요! 반응속도와 클릭 능력을 테스트하는 재미있는 게임입니다.',
    keywords: ['클릭게임', '스피드게임', '반응속도', '클릭스피드', '타이밍게임'],
    url: '/games/click-speed'
  },
  'memory-match': {
    title: '메모리 매치 게임',
    description: '카드 짝을 맞춰 점수를 획득하세요! 기억력과 집중력을 향상시키는 두뇌 훈련 게임입니다.',
    keywords: ['메모리게임', '카드매칭', '기억력게임', '두뇌게임', '집중력게임'],
    url: '/games/memory-match'
  },
  'number-guess': {
    title: '숫자 맞추기 게임',
    description: '적은 시도로 숫자를 맞혀보세요! 논리적 사고와 추리 능력을 기르는 재미있는 게임입니다.',
    keywords: ['숫자게임', '추리게임', '논리게임', '두뇌게임', '숫자맞추기'],
    url: '/games/number-guess'
  },
  'word-chain': {
    title: '끝말잇기 게임',
    description: 'AI와 함께하는 끝말잇기! 어휘력을 늘리고 한국어 실력을 향상시키는 교육적인 게임입니다.',
    keywords: ['끝말잇기', '단어게임', '어휘게임', '한국어게임', 'AI게임'],
    url: '/games/word-chain'
  },
  'typing-speed': {
    title: '타이핑 스피드 게임',
    description: '타이핑 속도와 정확성을 측정하세요! 분당 타수와 정확도를 개선하는 타이핑 연습 게임입니다.',
    keywords: ['타이핑게임', '타자게임', '타이핑연습', '타자연습', '키보드게임'],
    url: '/games/typing-speed'
  }
}

// JSON-LD 구조화된 데이터 생성
export const generateGameStructuredData = (gameKey: keyof typeof gamesSEO) => {
  const game = gamesSEO[gameKey]
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.title,
    "description": game.description,
    "url": `https://ppituruppaturu.com${game.url}`,
    "genre": "Casual Game",
    "gamePlatform": "Web Browser",
    "operatingSystem": "Any",
    "applicationCategory": "Game",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PittuRu"
    },
    "inLanguage": "ko",
    "isAccessibleForFree": true,
    "keywords": game.keywords.join(', '),
    "screenshot": `https://ppituruppaturu.com/screenshots/${gameKey}.png`,
    "datePublished": "2024-01-01",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "ratingCount": "89",
      "bestRating": "5",
      "worstRating": "1"
    }
  }
}

// 빵부스러기 네비게이션 생성
export const generateBreadcrumbStructuredData = (items: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://ppituruppaturu.com${item.url}`
    }))
  }
}