'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestAccess(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('access_requests')
    .insert({
      note_id: noteId,
      requester_id: user.id
    })

  if (error) {
    if (error.code === '23505') return { success: true, message: 'Request already pending.' }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function approveAccess(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get request details
  const { data: request, error: rError } = await supabase
    .from('access_requests')
    .select('*, notes(user_id)')
    .eq('id', requestId)
    .single()

  if (rError || !request) return { success: false, error: 'Request not found.' }
  
  // 2. Verify author
  if (request.notes.user_id !== user.id) return { success: false, error: 'Forbidden' }

  // 3. Approve and add collaborator
  await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId)
  
  await supabase.from('note_collaborators').insert({
    note_id: request.note_id,
    user_id: request.requester_id,
    permission: 'write'
  })

  revalidatePath('/dashboard')
  return { success: true }
}
