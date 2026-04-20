import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * AI-Native Raw Endpoint (v9.5.0)
 * Provides a pure Markdown/Plaintext view of the intelligence node.
 * Optimized for scraping and direct ingestion by LLMs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch the note (Strict Immutable Read)
    const { data: note, error } = await supabase
      .from('notes')
      .select('title, content, updated_at, share_slug')
      .eq('share_slug', slug)
      .eq('is_shared', true)
      .single()

    if (error || !note) {
      return new NextResponse('Neural link not found or restricted.', { status: 404 })
    }

    // Convert HTML to simple Markdown-ish text for AI parsing
    const cleanContent = note.content
      ?.replace(/<h1>/g, '# ')
      ?.replace(/<\/h1>/g, '\n\n')
      ?.replace(/<h2>/g, '## ')
      ?.replace(/<\/h2>/g, '\n\n')
      ?.replace(/<h3>/g, '### ')
      ?.replace(/<\/h3>/g, '\n\n')
      ?.replace(/<p>/g, '')
      ?.replace(/<\/p>/g, '\n\n')
      ?.replace(/<br\s*\/?>/g, '\n')
      ?.replace(/<[^>]*>?/gm, '') // Strip remaining tags
      ?.trim()

    const markdown = `# ${note.title}\n\n${cleanContent}\n\n---\nSource: https://notes.biz.id/s/${slug}\nUpdated: ${new Date(note.updated_at).toISOString()}\nProtocol: v9.5.0-AI-READY`

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    return new NextResponse('Neural synchronization failure.', { status: 500 })
  }
}
