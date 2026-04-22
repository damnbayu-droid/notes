'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Check, Loader2 } from 'lucide-react'
import { requestAccess } from '@/lib/actions/access'
import { toast } from 'sonner'

interface RequestAccessButtonProps {
  noteId: string
  isRequested?: boolean
}

export function RequestAccessButton({ noteId, isRequested = false }: RequestAccessButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'requested'>(isRequested ? 'requested' : 'idle')

  const handleRequest = async () => {
    setStatus('loading')
    const res = await requestAccess(noteId)
    if (res.success) {
      setStatus('requested')
      toast.success('Access request dispatched to the author cluster.')
    } else {
      setStatus('idle')
      toast.error('Dispatch Failure', { description: res.error || 'Failed to send request.' })
    }
  }

  return (
    <Button 
      onClick={handleRequest}
      disabled={status !== 'idle'}
      variant="outline" 
      className="h-10 rounded-xl gap-2 border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10 text-violet-600 shadow-sm px-4 hover:bg-violet-600 hover:text-white transition-all active:scale-95"
    >
       {status === 'loading' ? (
         <Loader2 className="w-3.5 h-3.5 animate-spin" />
       ) : status === 'requested' ? (
         <Check className="w-3.5 h-3.5 text-emerald-500" />
       ) : (
         <Plus className="w-3.5 h-3.5" />
       )}
       <span className="text-[10px] font-black uppercase tracking-widest">
         {status === 'requested' ? 'Access Pending' : 'Ask for Access'}
       </span>
    </Button>
  )
}
