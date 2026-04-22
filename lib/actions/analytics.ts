'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function trackNoteMetric(noteId: string, metric: 'view' | 'click' | 'fork' | 'permission') {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc(metric === 'view' ? 'increment_note_view' : 'increment_note_metric', {
    [metric === 'view' ? 'note_uuid' : 'note_id']: noteId,
    ...(metric !== 'view' ? { metric_name: metric } : {})
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

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get comment and note author
  const { data: comment, error: cError } = await supabase
    .from('note_comments')
    .select('*, notes(user_id)')
    .eq('id', commentId)
    .single()

  if (cError || !comment) return { success: false, error: 'Comment not found' }

  // 2. Only author or owner can delete
  if (comment.user_id !== user.id && comment.notes.user_id !== user.id) {
    return { success: false, error: 'Forbidden' }
  }

  const { error } = await supabase
    .from('note_comments')
    .delete()
    .eq('id', commentId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/s/[slug]', 'page')
  return { success: true }
}
