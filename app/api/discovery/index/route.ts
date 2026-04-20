import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyGoogleOfUpdate } from '@/lib/googleIndexing'

export const runtime = 'nodejs'

/**
 * Neural Indexing Proxy (v9.5.0)
 * Triggers the Google Indexing API for discoverable nodes.
 * Strictly enforced: Only 'is_discoverable' nodes are indexed.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth Handshake: Ensure the request comes from an authenticated node owner
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication protocol required.' }, { status: 401 })
    }

    const { slug } = await req.json()
    if (!slug) {
      return NextResponse.json({ error: 'Missing intelligence slug.' }, { status: 400 })
    }

    // Node Verification: Verify discoverability and ownership
    const { data: note, error } = await supabase
      .from('notes')
      .select('id, is_discoverable, user_id, share_slug')
      .eq('share_slug', slug)
      .single()

    if (error || !note) {
      return NextResponse.json({ error: 'Intelligence node not found.' }, { status: 404 })
    }

    if (note.user_id !== user.id) {
      return NextResponse.json({ error: 'Permission denied. Node ownership mismatch.' }, { status: 403 })
    }

    // STRICT GUARD: Indexing is exclusively for Discovery files
    if (!note.is_discoverable) {
      return NextResponse.json({ 
        success: true, 
        message: 'Indexing skipped: Node is private/shared only, not discoverable.' 
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notes.biz.id'
    const fullUrl = `${baseUrl}/s/${note.share_slug}`
    
    const indexingResult = await notifyGoogleOfUpdate(fullUrl)

    return NextResponse.json({ 
      success: true, 
      indexing: indexingResult,
      url: fullUrl
    })

  } catch (err: any) {
    console.error('Indexing Proxy Failure:', err)
    return NextResponse.json({ error: 'Neural link synchronization failure.' }, { status: 500 })
  }
}
