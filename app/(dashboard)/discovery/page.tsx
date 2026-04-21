import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const revalidate = 60
export const runtime = 'edge'
import { Compass, Sparkles, Search, Star, Clock, ArrowUpRight, BookOpen, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { Note } from '@/types'

export const metadata: Metadata = {
  title: 'Discovery | Smart Notes Community Library',
  description: 'Explore public notes shared by the community. Find coding snippets, study guides, and collective intelligence hubs.',
}

function JsonLd({ notes }: { notes: Note[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notes.biz.id'
  return (
    <Script
      id="discovery-hub-jsonld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": ["CollectionPage", "Dataset"],
          "name": "Smart Notes Discovery Feed",
          "description": "A public hub of shared intelligence nodes and community knowledge. Verified and pre-indexed datasets.",
          "url": `${baseUrl}/discovery`,
          "provider": {
            "@type": "Organization",
            "name": "Smart Notes Collective"
          },
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": notes.map((note, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `${baseUrl}/s/${note.share_slug}`,
              "name": note.title || 'Untitled Intelligence Node',
              "description": note.content?.replace(/<[^>]*>?/gm, '').substring(0, 100)
            }))
          }
        })
      }}
    />
  )
}

import { DiscoveryFeed } from '@/components/discovery/DiscoveryFeed'
import { RecommendationCluster } from '@/components/discovery/RecommendationCluster'
import { History, Zap, Network } from 'lucide-react'

export default async function DiscoveryPage() {
  const supabase = await createClient()

  // 1. Fetch from discovery_notes with Profile Join
  const { data: notesRaw, error } = await supabase
    .from('discovery_notes')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch discovery feed:', error)
  }

  const notes = (notesRaw || []) as Note[]

  // 2. Extract note IDs for bulk rating fetch
  const noteIds = notes.map(n => n.id)
  const { data: allRatings } = await supabase
    .from('note_ratings')
    .select('note_id, rating')
    .in('note_id', noteIds)

  // 3. Map ratings to notes
  const processedNotes = notes.map(n => {
    const noteRatings = allRatings?.filter(r => r.note_id === n.id) || []
    if (noteRatings.length > 0) {
      const avg = noteRatings.reduce((acc, curr) => acc + curr.rating, 0) / noteRatings.length
      return { ...n, averageRating: Math.round(avg * 10) / 10, ratingCount: noteRatings.length }
    }
    return { ...n, averageRating: 0, ratingCount: 0 }
  })

  // 4. Derive Top Recommendations for Sidebar
  const recommendations = [...processedNotes]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 3);

  return (
    <div className="animate-in fade-in duration-700 pt-20 sm:pt-24">
      <JsonLd notes={processedNotes} />
      
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto relative px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-widest mb-2 border border-violet-200 dark:border-violet-900/50 shadow-sm">
            <Compass className="w-4 h-4" />
            Intelligence Registry
          </div>
          <h1 className="text-4xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic">
            Discovery <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Hub</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto opacity-80">
            Access the community's shared intelligence nodes. Filter through specialized clusters or search for specific datasets via the neural bridge.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
           {/* Primary Feed */}
           <div className="flex-1 min-w-0">
              <DiscoveryFeed initialNotes={processedNotes} />
           </div>

           {/* Discovery Side Page — v12.1.4 Stabilization */}
           <aside className="w-full lg:w-[320px] shrink-0 space-y-12 pb-20">
              {/* Context Registry Metadata */}
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                       <Network className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Node Status</p>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">Verified Cluster</h4>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
                       You are currently browsing the verified neural feed. All intelligence nodes are pre-vetted for AI readability.
                    </p>
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                       <span className="text-[9px] font-black uppercase text-slate-400">Total Nodes:</span>
                       <span className="text-[9px] font-black uppercase text-violet-500">{processedNotes.length} Layers</span>
                    </div>
                 </div>
              </div>

              {/* Version History Placeholder (As requested for continuity) */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 px-2">
                    <History className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Version History</p>
                 </div>
                 <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-50">No global snapshots archived</p>
                 </div>
              </div>

              {/* Neural Recommendations (v12.1.4 List Style) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 px-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Recommended Intelligence</p>
                 </div>
                 <RecommendationCluster notes={recommendations} layout="list" />
              </div>
           </aside>
        </div>

      </div>
    </div>
  )
}
