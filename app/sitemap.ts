import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

/**
 * Dynamic Neural Sitemap (v7.6.1)
 * Automatically broadcasts all shared intelligence nodes to global search engines.
 * This ensures that every public dataset is discoverable by AI crawlers and bots.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.notes.biz.id'

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/discovery`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
  ]

  try {
    // Fetch all notes that are explicitly marked for public discovery (Privacy-First Gate)
    const { data: sharedNotes, error } = await supabase
      .from('notes')
      .select('share_slug, updated_at')
      .eq('is_shared', true)
      .eq('is_discoverable', true) // MANTATORY: Protocol Privacy-First
      .not('share_slug', 'is', null)

    if (error) throw error

    const noteRoutes = (sharedNotes || []).map((note) => ({
      url: `${baseUrl}/s/${note.share_slug}`,
      lastModified: new Date(note.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    
    return [...staticRoutes, ...noteRoutes]
  } catch (err) {
    console.error('[SITEMAP_PROTOCOL_FAILURE]', err)
    return staticRoutes // Fallback to static routes to prevent build crash
  }
}
