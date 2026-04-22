'use client'
import { useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Globe, RefreshCw, Plus, User as UserIcon, GitFork, ShieldCheck, Check, X } from 'lucide-react'
import { approveAccess } from '@/lib/actions/access'
import { Button } from '@/components/ui/button'
import { Note, User, NoteLog } from '@/types'
import { toast } from 'sonner'
import { useNotes } from '@/hooks/useNotes'
import { format } from 'date-fns'

interface LineageHubProps {
  note: Note | null
  user: User | null
  show: boolean
  isSharedPage?: boolean
  onFork?: (id: string, content: string) => Promise<void>
}

export function LineageHub({ note, user, show, isSharedPage = false, onFork }: LineageHubProps) {
  const { logs, fetchLogs, createVersion, publishVersion, updateNote, requests, forks, fetchRequests, fetchForks } = useNotes(user)
  const [commitMessage, setCommitMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (show && note?.id) {
      if (!isSharedPage) fetchLogs(note.id)
      fetchForks(note.id)
      if (user?.id === note.user_id) fetchRequests(note.id)
    }
  }, [show, note?.id, user?.id])

  if (!show) return null

  const handleCommit = async () => {
    if (!note || !commitMessage.trim()) return
    setIsProcessing(true)
    const res = await createVersion(note.id, note.content || '', commitMessage)
    setIsProcessing(false)
    if (res.success) {
      setCommitMessage('')
      await fetchLogs(note.id)
    }
  }

  const handlePublish = async (logId: string) => {
    if (!note) return
    setIsProcessing(true)
    await publishVersion(note.id, logId)
    setIsProcessing(false)
  }

  const handleRestore = async (content: string) => {
    if (!note) return
    setIsProcessing(true)
    await updateNote(note.id, { content })
    setIsProcessing(false)
    toast.success('Intelligence Restored', { description: 'Local cluster updated to selected snapshot.' })
  }

  const versionLogs = logs.filter(l => l.action === 'VERSION_COMMIT' || l.snapshot_content)

  const handleApprove = async (requestId: string) => {
    if (!note) return
    setIsProcessing(true)
    const res = await approveAccess(requestId)
    setIsProcessing(true)
    if (res.success) {
      toast.success('Access Granted', { description: 'Neural bridge established.' })
      await fetchRequests(note.id)
    } else {
      toast.error('Approval Failure')
    }
    setIsProcessing(false)
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isSharedPage ? '100%' : 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`${isSharedPage ? 'w-full lg:w-[320px]' : 'w-[320px]'} border-l border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-2xl overflow-y-auto custom-scrollbar flex flex-col shrink-0`}
      >
         <div className="p-8 space-y-8">
            {/* Access Requests (Author Only) */}
            {note && user?.id === note.user_id && requests.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 italic">Neural Access Requests</p>
                <div className="space-y-3">
                   {requests.filter(r => r.status === 'pending').map(req => (
                     <div key={req.id} className="p-4 rounded-2xl bg-violet-600/5 border border-violet-500/20">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm">
                              {req.requester?.avatar_url ? (
                                <img src={req.requester.avatar_url} className="w-full h-full rounded-lg object-cover" />
                              ) : (
                                <UserIcon className="w-4 h-4 text-slate-400" />
                              )}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase">{req.requester?.full_name || 'Anonymous'}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Wants Edit Access</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                             onClick={() => handleApprove(req.id)}
                             disabled={isProcessing}
                             className="flex-1 h-8 rounded-xl bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest"
                           >
                              Approve
                           </Button>
                           <Button 
                             variant="outline" 
                             disabled={isProcessing}
                             className="h-8 w-8 rounded-xl border-slate-100 dark:border-white/5 text-slate-400"
                           >
                              <X className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* Neural Lineage (Forks) */}
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Neural Lineage (Forks)</p>
               <div className="space-y-3">
                  {forks.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
                       <GitFork className="w-5 h-5 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No forks detected</p>
                    </div>
                  ) : (
                    forks.map(fork => (
                      <a 
                        key={fork.id} 
                        href={`/s/${fork.share_slug}`}
                        className="block p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 hover:border-violet-300 transition-all shadow-sm group"
                      >
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">{fork.title}</span>
                            <GitFork className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 transition-all" />
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[7px] font-black uppercase">
                               {fork.profiles?.full_name?.[0] || '?'}
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{fork.profiles?.full_name || 'Explorer'}</span>
                         </div>
                      </a>
                    ))
                  )}
               </div>
            </div>

            {/* Owner Identity Node */}
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Origin Oracle</p>
               <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black italic shadow-lg">
                        {note?.profiles?.full_name?.[0] || 'NA'}
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{note?.profiles?.full_name || 'Unknown Hub'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Verified Intelligence</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* GitHub-style Commit Control (v10.0.0) */}
            {!isSharedPage && note && user?.id === note.user_id && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Version Control</p>
                <div className="p-5 rounded-[2rem] bg-violet-600/5 border border-violet-500/20 space-y-3">
                   <input 
                      type="text"
                      placeholder="Commit message..."
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-950 border-0 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-violet-500"
                   />
                   <Button 
                      onClick={handleCommit}
                      disabled={isProcessing || !commitMessage.trim()}
                      className="w-full h-10 rounded-xl bg-violet-600 text-white font-black uppercase text-[9px] tracking-widest hover:bg-violet-700 shadow-xl shadow-violet-500/20"
                   >
                      Commit Segment
                   </Button>
                </div>
              </div>
            )}

            {/* Relative Lineage Records */}
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Version History</p>
               <div className="space-y-3 pb-8">
                  {versionLogs.length === 0 ? (
                    <div className="p-5 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                      <Plus className="w-5 h-5 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic text-center">No snapshots archived yet</p>
                    </div>
                  ) : (
                    versionLogs.map((log: NoteLog) => (
                      <div key={log.id} className={`p-4 rounded-2xl border transition-all ${note?.published_log_id === log.id ? 'bg-violet-600 text-white border-violet-500 shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-white/5'}`}>
                        <div className="flex items-start justify-between gap-2">
                           <div className="min-w-0 flex-1">
                              <p className={`text-[10px] font-black uppercase tracking-tighter truncate ${note?.published_log_id === log.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {log.details?.message || 'Archived Snapshot'}
                              </p>
                              <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${note?.published_log_id === log.id ? 'text-white/60' : 'text-slate-400'}`}>
                                {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                              </p>
                           </div>
                           {note?.published_log_id === log.id && (
                             <Globe className="w-3.5 h-3.5 text-white animate-pulse" />
                           )}
                        </div>
                        
                        {!isSharedPage && (
                          <div className="flex items-center gap-2 mt-3">
                             <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleRestore(log.snapshot_content || '')}
                                className={`h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest ${note?.published_log_id === log.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-violet-500 hover:text-white'}`}
                             >
                               <RefreshCw className="w-3 h-3 mr-1.5" /> Revert
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={isProcessing || note?.published_log_id === log.id}
                                onClick={() => handlePublish(log.id)}
                                className={`h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest ${note?.published_log_id === log.id ? 'hidden' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                             >
                               <Globe className="w-3 h-3 mr-1.5" /> Publish
                             </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
               </div>
            </div>
         </div>
      </motion.div>
    </AnimatePresence>
  )
}
