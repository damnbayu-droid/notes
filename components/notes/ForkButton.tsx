'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GitFork, Loader2 } from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ForkButtonProps {
  noteId: string
  content: string
  title: string
}

export function ForkButton({ noteId, content, title }: ForkButtonProps) {
  const { user } = useAuth()
  const { forkNote } = useNotes(user)
  const [isForking, setIsForking] = useState(false)
  const router = useRouter()

  const handleFork = async () => {
    setIsForking(true)
    const res = await forkNote(noteId, content)
    setIsForking(false)
    if (res.success && res.note) {
      toast.success('Neural Node Cloned', { description: 'Opening your independent dataset.' })
      router.push('/dashboard') // Or to the specific note if possible
    } else {
      toast.error('Forking Failure', { description: res.error || 'Failed to initialize unique clone.' })
    }
  }

  return (
    <Button 
      onClick={handleFork}
      disabled={isForking}
      variant="outline" 
      className="h-10 rounded-xl gap-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 shadow-sm px-4 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
    >
       {isForking ? (
         <Loader2 className="w-3.5 h-3.5 animate-spin" />
       ) : (
         <GitFork className="w-3.5 h-3.5" />
       )}
       <span className="text-[10px] font-black uppercase tracking-widest">Fork to My Hub</span>
    </Button>
  )
}
