'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, Zap, Eye } from 'lucide-react'
import Link from 'next/link'

interface RecommendationClusterProps {
  notes: any[]
  isSidebar?: boolean
  layout?: 'grid' | 'list'
}

export function RecommendationCluster({ notes, isSidebar, layout = 'grid' }: RecommendationClusterProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (notes.length === 0) return null
  
  // Hydration Stability: Force a consistent initial render
  const isListView = isSidebar || layout === 'list'
  
  // Use a stable conditional return that Next.js/React can reconcile
  if (!mounted) {
     return (
       <section 
         className={isListView ? "space-y-4" : "mt-24 space-y-12"} 
         suppressHydrationWarning
       >
         <div className="opacity-0 h-20" />
       </section>
     )
  }

  // Limit to 3 for high-density sidebars
  const displayNotes = notes.slice(0, 3)

  if (isListView) {
    return (
      <section className="space-y-4" suppressHydrationWarning>
        {displayNotes.map((note, i) => (
          <Link 
            key={note.id} 
            href={`/s/${note.share_slug}`}
            className="group flex items-start gap-4 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5"
          >
             <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-sm">
                <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
             </div>
             <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between mb-1">
                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                      {i === 0 ? 'Top Priority' : 'Contextual'}
                   </span>
                   <div className="flex items-center gap-1 text-[8px] font-black text-slate-400">
                      <Eye className="w-2.5 h-2.5" /> {note.view_count || 0}
                   </div>
                </div>
                <h5 className="text-[11px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2 group-hover:text-violet-600 transition-colors">
                   {note.title}
                </h5>
             </div>
          </Link>
        ))}
        <Link href="/discovery" className="mt-6 w-full h-10 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all shadow-lg active:scale-95">
          Explore Intelligence <ArrowRight className="w-3 h-3 ml-2" />
        </Link>
      </section>
    )
  }

  return (
    <section className="mt-24 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 border border-white/20">
            <Sparkles className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 leading-none mb-1.5">Neural Recommendations</h3>
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Priority Intelligence</h4>
          </div>
        </div>
        <Link href="/discovery" className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-violet-600 dark:hover:text-violet-400 transition-all flex items-center gap-2 border border-slate-200 dark:border-white/5">
          Full Discovery Library <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {displayNotes.map((note, i) => (
          <Link 
            key={note.id} 
            href={`/s/${note.share_slug}`}
            className="group grid grid-cols-1 md:grid-cols-[1fr,200px] gap-6 p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[2.5rem] hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:shadow-2xl hover:shadow-violet-500/5 relative overflow-hidden"
          >
             {/* Rank Background Glow */}
             {i === 0 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[64px] rounded-full -translate-y-1/2 translate-x-1/2" />
             )}

             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {i === 0 ? 'Top Ranked' : i === 1 ? 'Similar Context' : 'Real-Time Velocity'}
                   </span>
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                      <Eye className="w-3.5 h-3.5" /> {note.view_count || 0} Clusters
                   </div>
                </div>
                
                <h5 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter group-hover:text-violet-600 transition-colors">
                   {note.title}
                </h5>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">
                   {note.content?.replace(/<[^>]*>?/gm, '').substring(0, 180)}
                </p>

                <div className="flex items-center gap-3 mt-2">
                   {note.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[9px] font-black text-violet-500 uppercase tracking-widest">#{tag}</span>
                   ))}
                </div>
             </div>

             <div className="flex items-center justify-end md:border-l border-slate-100 dark:border-white/5 md:pl-6">
                <div className="w-14 h-14 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-all shadow-xl shadow-slate-500/10">
                   <Zap className="w-6 h-6 fill-current" />
                </div>
             </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
