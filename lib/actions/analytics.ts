'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function trackNoteMetric(noteId: string, metric: 'view' | 'click' | 'fork' | 'permission') {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('increment_note_metric', {
    note_id: noteId,
    metric_name: metric
  })

  if (error) {
    console.error(`Failed to track ${metric} for note ${noteId}:`, error)
    return { success: false, error }
  }

  return { success: true }
}

export async function addComment(noteId: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('note_comments')
    .insert({
      note_id: noteId,
      user_id: user.id,
      content
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add comment:', error)
    return { success: false, error }
  }

  revalidatePath(`/s/[slug]`, 'page')
  return { success: true, data }
}

export async function getComments(noteId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('note_comments')
    .select(`
      *,
      user_profiles:user_id(full_name, avatar_url)
    `)
    .eq('note_id', noteId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }

  return data
}
