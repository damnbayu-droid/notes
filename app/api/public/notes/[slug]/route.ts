import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeHtml } from '@/lib/sanitization'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Neural Data Bridge (v7.6.0)
 * Provides raw, machine-readable intelligence data for 3rd-party LLMs and agents.
 * Optimized for direct ingestion by systems like OpenAI, Anthropic, and Google Gemini.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Primary fetch for shared content
    const { data: note, error } = await supabase
      .from('notes')
      .select('id, title, content, category, tags, created_at, updated_at, user_id')
      .eq('share_slug', slug)
      .eq('is_shared', true)
      .single()

    if (error || !note) {
      return NextResponse.json(
        { error: 'Intelligence sequence not found or access restricted.' },
        { status: 404 }
      )
    }

    // Prepare machine-optimized payload
    const payload = {
      meta: {
        id: note.id,
        source: 'Smart Notes Collective',
        protocol: 'v7.6.0-AI-READY',
        timestamp: new Date().toISOString(),
      },
      data: {
        title: note.title || 'Untitled Dataset',
        category: note.category || 'General',
        tags: note.tags || [],
        created_at: note.created_at,
        updated_at: note.updated_at,
        // Provide both raw and sanitized content for diverse ingestion needs
        content_raw: note.content,
        content_sanitized: sanitizeHtml(note.content || ''),
        content_plaintext: note.content?.replace(/<[^>]*>?/gm, '') 
      }
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Neural link synchronization failure.' },
      { status: 500 }
    )
  }
}
