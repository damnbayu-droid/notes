import { createClient } from '@/lib/supabase/server'
import { Note } from '@/types'

export async function getRecommendations(currentNoteId?: string) {
  const supabase = await createClient()
  
  // 1. Nodes by Rank (Highest Views)
  const { data: topRanked } = await supabase
    .from('notes')
    .select('id, title, share_slug, content, view_count, tags')
    .eq('is_shared', true)
    .eq('is_discoverable', true)
    .order('view_count', { ascending: false })
    .limit(5)

  // 2. Nodes by Real-Time Velocity (Score: views / age)
  // Approximated by highest views in the last 7 days or just high view count
  const { data: realTime } = await supabase
    .from('notes')
    .select('id, title, share_slug, content, view_count, tags')
    .eq('is_shared', true)
    .eq('is_discoverable', true)
    .order('updated_at', { ascending: false })
    .limit(5)

  // 3. Similarity Logic (Simplified: Tag overlap)
  let similar: any[] = []
  if (currentNoteId) {
    const { data: currentNote } = await supabase
      .from('notes')
      .select('tags')
      .eq('id', currentNoteId)
      .single()

    if (currentNote?.tags?.length) {
      const { data: tagMatches } = await supabase
        .from('notes')
        .select('id, title, share_slug, content, view_count, tags')
        .eq('is_shared', true)
        .eq('is_discoverable', true)
        .neq('id', currentNoteId)
        .contains('tags', currentNote.tags.slice(0, 1)) // Match at least one tag
        .limit(3)
      similar = tagMatches || []
    }
  }

  // Combine and pick Top 3 unique ones
  const pool = [...(topRanked || []), ...(realTime || []), ...similar]
  const uniquePool = Array.from(new Map(pool.map(item => [item.id, item])).values())
    .filter(n => n.id !== currentNoteId)
  
  return uniquePool.slice(0, 3)
}
