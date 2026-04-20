import { MetadataRoute } from 'next'

/**
 * Neural Robots Protocol (v7.6.1)
 * Optimized for universal crawler access and AI discoverability.
 * Grants permissions to all legal bots while mapping the neural sitemap hub.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.notes.biz.id'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/auth/', '/admin/', '/api/notifications/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
