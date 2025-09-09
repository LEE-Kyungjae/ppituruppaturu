/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://ppituruppaturu.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/admin/*',
    '/auth/*',
    '/payment/fail',
    '/server-sitemap.xml'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/games/click-speed'),
    await config.transform(config, '/games/memory-match'), 
    await config.transform(config, '/games/number-guess'),
    await config.transform(config, '/games/word-chain'),
    await config.transform(config, '/games/typing-speed')
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/', '/_next/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/', '/_next/static/'],
      }
    ],
    additionalSitemaps: [
      'https://ppituruppaturu.com/server-sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // 게임 페이지에 높은 우선순위 부여
    if (path.startsWith('/games/')) {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: 0.9,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        alternateRefs: [
          {
            href: 'https://ppituruppaturu.com' + path,
            hreflang: 'ko',
          },
          {
            href: 'https://ppituruppaturu.com' + path,
            hreflang: 'x-default',
          },
        ],
      }
    }
    
    // 메인 페이지 최고 우선순위
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        alternateRefs: [
          {
            href: 'https://ppituruppaturu.com',
            hreflang: 'ko',
          },
          {
            href: 'https://ppituruppaturu.com',
            hreflang: 'x-default',
          },
        ],
      }
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
}