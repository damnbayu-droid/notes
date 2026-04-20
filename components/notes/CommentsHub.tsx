'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, User, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addComment, getComments } from '@/lib/actions/analytics'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface CommentsHubProps {
  noteId: string
  user: any
}

export function CommentsHub({ noteId, user }: CommentsHubProps) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getComments(noteId)
      setComments(data)
      setIsLoading(false)
    }
    load()
  }, [noteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Authentication Required', { description: 'Please sign in to join the intelligence exchange.' })
      return
    }
    if (!newComment.trim()) return

    setIsSubmitting(true)
    const res = await addComment(noteId, newComment)
    setIsSubmitting(false)

    if (res.success) {
      setNewComment('')
      toast.success('Comment sequenced into the knowledge graph.')
      // Refresh local list
      const data = await getComments(noteId)
      setComments(data)
    } else {
      toast.error('Sync Failure', { description: 'Failed to broadcast comment.' })
    }
  }

  return (
    <section className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <MessageSquare className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">Intelligence Exchange</h3>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Community Observations ({comments.length})</h4>
        </div>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-10 space-y-10">
        {/* Input Area (v12.0.0 - User-Only Hardening) */}
        {user ? (
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-x-4 inset-y-0 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-violet-500/20 group-within:border-violet-500 transition-all" />
            <div className="relative flex items-center p-2 pr-4">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your perspective on this node..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium px-6 h-12 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !newComment.trim()}
                className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
              >
                {isSubmitting ? 'Syncing...' : <><Send className="w-3.5 h-3.5 mr-2" /> Broadcast</>}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Neural Authentication Needed</p>
             <Link href="/login" className="inline-block px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                Login to Comment
             </Link>
          </div>
        )}

        {/* List of Comments */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-white/50 dark:bg-slate-800/50 rounded-2xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
               <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">No community data yet.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                   {comment.user_profiles?.avatar_url ? (
                      <img src={comment.user_profiles.avatar_url} className="w-full h-full rounded-xl object-cover" />
                   ) : (
                      <User className="w-5 h-5 text-slate-400" />
                   )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
                         {comment.user_profiles?.full_name || 'Verified Explorer'}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                         <Clock className="w-2.5 h-2.5" /> {formatDistanceToNow(new Date(comment.created_at))} ago
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
