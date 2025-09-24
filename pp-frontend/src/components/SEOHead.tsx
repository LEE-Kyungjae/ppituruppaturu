import Head from 'next/head'
import { SEOProps } from '@/utils/seo'

interface SEOHeadProps extends SEOProps {
  structuredData?: object
  breadcrumbs?: object
  noIndex?: boolean
  canonical?: string
}

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  structuredData,
  breadcrumbs,
  noIndex = false,
  canonical
}: SEOHeadProps) {
  const keywordsString = keywords?.join(', ')
  const tagsString = tags?.join(', ')
  
  return (
    <Head>
      {/* 기본 메타 태그 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      {author && <meta name="author" content={author} />}
      
      {/* 로봇 지시사항 */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* 표준 URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      {url && !canonical && <link rel="canonical" href={url} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content="삐뚜루빠뚜루 게임 플랫폼" />
      <meta property="og:locale" content="ko_KR" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tagsString && <meta property="article:tag" content={tagsString} />}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ppituru" />
      <meta name="twitter:creator" content="@ppituru" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* 추가 SEO 메타 태그 */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* 언어 및 지역 */}
      <meta httpEquiv="content-language" content="ko" />
      <meta name="geo.region" content="KR" />
      <meta name="geo.country" content="KR" />
      
      {/* 구조화된 데이터 */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {/* 빵부스러기 네비게이션 */}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbs)
          }}
        />
      )}
    </Head>
  )
}
