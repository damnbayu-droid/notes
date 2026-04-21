import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 60
export const runtime = 'edge'

import { sanitizeHtml } from '@/lib/sanitization'
import { Metadata } from 'next'
import { Globe, Calendar, Sparkles, User as UserIcon, Badge as BadgeIcon, Brain, Zap } from 'lucide-react'
import Script from 'next/script'
import { Note } from '@/types'
import { LineageHub } from '@/components/notes/LineageHub'
import { ShareCluster } from '@/components/notes/ShareCluster'
import { buildGraph, flattenGraph, getVersionHistory } from '@/lib/contentGraph'
import { getRecommendations } from '@/lib/recommendations'
import { RecommendationCluster } from '@/components/discovery/RecommendationCluster'
import { CommentsHub } from '@/components/notes/CommentsHub'
import { Brain as BrainIcon, Network, History, Check, ChevronDown, Sun, Moon, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/discovery/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

// Unified Neural Fetch for ISR Stability
async function getNoteData(slug: string) {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('share_slug', slug)
      .eq('is_shared', true)
      .single() as { data: Note | null, error: any }
    
    if (data) return data;
    
    // Fallback if direct fetch is restricted
    const { data: rpcData } = await supabase.rpc('get_shared_note_by_slug', { p_slug: slug }).single() as any;
    return rpcData as Note | null;
  } catch (err) {
    return null;
  }
}

// Next.js 15 requires params to be handled as a Promise
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const note = await getNoteData(slug)
  
  const headersList = await (await import('next/headers')).headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = /GPTBot|ChatGPT-User|Googlebot|Google-InspectionTool|Baiduspider|Bingbot|Slurp|DuckDuckBot|YandexBot|ClaudeBot|AnthropicAI|Applebot/i.test(userAgent);

  if (!note) return { 
    title: 'Intelligence Node Not Found',
    robots: { index: false }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notes.biz.id'
  const pageUrl = `${baseUrl}/s/${slug}`
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(note.title || 'Shared Intelligence')}`

  return {
    title: `${note.title || 'Untitled Dataset'} | Smart Notes AI Oracle`,
    description: note.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || 'AI-indexable shared intelligence node. Optimized for LLM parsing.',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      }
    },
    openGraph: {
      title: note.title || 'Intelligence Node',
      description: note.content?.replace(/<[^>]*>?/gm, '').substring(0, 300) || 'Verified Neural Knowledge Node',
      url: pageUrl,
      type: 'article',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: note.title || 'Intelligence Node',
      description: note.content?.replace(/<[^>]*>?/gm, '').substring(0, 300),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: pageUrl,
      types: {
        'text/plain': `${pageUrl}?format=text`,
      }
    }
  }
}

function JsonLd({ graph, slug }: { graph: any; slug: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notes.biz.id'
  const flattened = flattenGraph(graph)
  
  return (
    <Script
      id="shared-node-jsonld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": ["TechArticle", "Dataset"],
          "headline": graph.title || 'Untitled Intelligence Node',
          "articleBody": graph.content?.replace(/<[^>]*>?/gm, ''),
          "description": graph.content?.replace(/<[^>]*>?/gm, '').substring(0, 160),
          "author": {
            "@type": "Person",
            "name": "Smart Notes AI Hub"
          },
          "datePublished": graph.created_at,
          "dateModified": graph.updated_at,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${baseUrl}/s/${slug}`
          },
          "keywords": graph.tags?.join(', ') || 'intelligence, notes, neural, content graph',
          "interactionStatistic": [
            {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/ViewAction",
              "userInteractionCount": graph.view_count || 0
            },
            {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/CommentAction",
              "userInteractionCount": graph.comment_count || 0
            }
          ],
          "hasPart": flattened.slice(1).map(node => ({
            "@type": "TechArticle",
            "headline": node.title,
            "url": `${baseUrl}/s/${node.share_slug}`,
            "description": node.content?.replace(/<[^>]*>?/gm, '').substring(0, 160)
          }))
        })
      }}
    />
  )
}

import { trackNoteMetric } from '@/lib/actions/analytics'

export default async function SharedNotePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ v?: string, format?: string }>
}) {
  const { slug } = await params
  const { v: versionId, format: formatParam } = await searchParams
  const supabase = await createClient()

  // 1. Detect AI Agents via User-Agent
  const headersList = await (await import('next/headers')).headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = /GPTBot|ChatGPT-User|Googlebot|Google-InspectionTool|Baiduspider|Bingbot|Slurp|DuckDuckBot|YandexBot|ClaudeBot|AnthropicAI|Applebot/i.test(userAgent);

  // 2. High-Priority Knowledge Graph Fetch
  const graph = await buildGraph(slug, versionId) as any;

  if (!graph) {
    return notFound();
  }

  // Auth fetch for community logic (optional)
  const { data: { user } } = await supabase.auth.getUser()

  // Trigger server-side view tracking
  trackNoteMetric(graph.id, 'view').catch(() => {});

  const recommendations = await getRecommendations(graph.id)
  const history = await getVersionHistory(graph.id)
  const isPublic = graph.share_type === 'public'
  const sanitizedContent = sanitizeHtml(graph.content || '')

  // 3. AI-FIRST AUTO-INGRESS: If it's a bot or format=text is requested
  if (isBot || versionId === 'text' || formatParam === 'text') {
    const rawText = graph.content
      ?.replace(/<p>/g, '')
      ?.replace(/<\/p>/g, '\n')
      ?.replace(/<br\s*\/?>/g, '\n')
      ?.replace(/<[^>]*>?/gm, '')
      ?.trim();

    return (
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        padding: '2rem', 
        fontFamily: 'monospace', 
        backgroundColor: '#0f172a', 
        color: '#f8fafc',
        lineHeight: '1.6'
      }}>
        {graph.title}\n
        ========================================\n
        {rawText}\n
        ========================================\n
        Metadata: {graph.tags?.join(', ')}\n
        Author: {graph.profiles?.full_name || 'Anonym'}\n
        ID: {graph.id}\n
        Neural Oracle Status: Verified Ingress
      </pre>
    )
  }
  
  // Safe checksum generation (web-standard)
  const checksum = Array.from(new TextEncoder().encode(graph.updated_at))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').substring(0, 16);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-violet-100 selection:text-violet-600 flex flex-col">
      <JsonLd graph={graph} slug={slug} />
      {/* AI Bot Verification Header */}
      <header className="border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5 overflow-hidden group-hover:scale-105 transition-all">
                    <img 
                        src="/Logo.webp" 
                        alt="Neural Intelligence" 
                        className="w-10 h-10 object-contain rounded-xl"
                    />
                </div>
                <div className="hidden sm:block">
                   <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Smart Notes Oracle</h1>
                   <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Pre-rendered for AI Agents</p>
                </div>
             </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
             {/* Author Identity */}
             <div className="flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-white/5">
                <Link href={`/u/${graph.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                   <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden shadow-lg shadow-violet-500/20">
                      {graph.profiles?.avatar_url ? (
                        <img src={graph.profiles.avatar_url} alt="Author" className="w-full h-full object-cover" />
                      ) : (
                        <span>{graph.profiles?.full_name?.[0] || graph.profiles?.email?.[0]?.toUpperCase() || '?'}</span>
                      )}
                   </div>
                   <div className="hidden sm:block">
                      <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-0.5">
                         {graph.profiles?.full_name || 'Anonym'}
                      </p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Author</p>
                   </div>
                </Link>
             </div>

             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified Readability</span>
             </div>
             
             <ThemeToggle />
             
             {/* Ask for Access CTA */}
             {user && user.id !== graph.user_id && graph.share_permission === 'read' && (
                <Button 
                  variant="outline" 
                  className="h-10 rounded-xl gap-2 border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10 text-violet-600 shadow-sm px-4 hover:bg-violet-600 hover:text-white"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                      detail: { title: 'Access Request', message: 'Your request for write permission has been transmitted to the owner.', type: 'info' }
                    }));
                  }}
                >
                   <Plus className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Ask for Access</span>
                </Button>
             )}
             
             {/* Version Switcher */}
             {history.length > 0 && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="h-10 rounded-xl gap-2 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm px-4">
                     <History className="w-3.5 h-3.5 text-violet-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">History</span>
                     <ChevronDown className="w-3 h-3 text-slate-400" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-slate-100 dark:border-white/5 shadow-2xl">
                    <p className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1">Archived Neural Snapshots</p>
                    {history.map((h: any) => (
                      <DropdownMenuItem key={h.id} asChild>
                        <Link 
                          href={`/s/${slug}?v=${h.id}`}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl transition-all ${versionId === h.id ? 'bg-violet-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[140px]">{h.details?.message || 'Archived Snapshot'}</span>
                            {versionId === h.id && <Check className="w-3 h-3" />}
                            {(!versionId && graph.published_log_id === h.id) && <Globe className="w-3 h-3 animate-pulse" />}
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${versionId === h.id ? 'text-white/60' : 'text-slate-400'}`}>
                             {format(new Date(h.created_at), 'MMM dd, HH:mm')}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {versionId && (
                       <DropdownMenuItem asChild>
                         <Link href={`/s/${slug}`} className="mt-2 h-10 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100">
                            Reset to Published
                         </Link>
                       </DropdownMenuItem>
                    )}
                 </DropdownMenuContent>
               </DropdownMenu>
             )}

             <a href="/" className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                Enter Hub
             </a>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
         <main className="flex-1 px-6 py-16 space-y-12">
            {/* SEO Header Section */}
            <section className="space-y-6">
               {graph.is_discoverable && (
                   <Link href="/discovery" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-100 transition-colors">
                      <ChevronDown className="w-4 h-4 rotate-90" /> Back to Discovery Feed
                   </Link>
               )}
               <div className="flex flex-wrap gap-2">
                  {graph.tags?.map((tag: string) => (
                     <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-800">
                        #{tag}
                     </span>
                  ))}
                  {!graph.tags?.length && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No metadata tags</span>}
               </div>

               <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight break-words overflow-hidden">
                  {graph.title || 'Untitled Intelligence Dataset'}
               </h2>

               <div className="flex flex-wrap items-center gap-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-4 h-4 opacity-50" /> 
                     <p>Updated {new Date(graph.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <UserIcon className="w-4 h-4 opacity-50" /> 
                     <p>Source: {graph.user_id ? 'Authenticated Cluster' : 'Guest Satellite'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-violet-500">
                     <BadgeIcon className="w-4 h-4 opacity-50" /> 
                     <p>Security Mode: {graph.share_type}</p>
                  </div>
               </div>
            </section>

            {/* Content Section - The real optimization for AI */}
            <article className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-14 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[500px]">
               {isPublic ? (
                  <div 
                  className="prose prose-slate dark:prose-invert max-w-none prose-h1:text-4xl prose-h1:font-black prose-p:text-lg prose-p:leading-relaxed break-words overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent || '<p class="italic text-slate-400">Content is being processed or is empty.</p>' }}
                  />
               ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-20">
                     <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center animate-pulse">
                        <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Encrypted Transmission</h3>
                        <p className="text-slate-500 font-medium max-w-xs">This data requires secure decryption via client-side protocols. AI crawlers cannot index protected payloads.</p>
                     </div>
                     <a href={`/s/${slug}`} className="px-8 py-3 bg-violet-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-violet-200 dark:shadow-none hover:bg-violet-700 transition-all">
                        Access Secure Node
                     </a>
                  </div>
               )}
            </article>

            {/* AI AGENT RAW INGRESS (Hidden from humans, optimized for LLMs) */}
            <section id="ai-neural-ingress" className="sr-only" aria-hidden="true" style={{ display: 'none' }}>
               <h2>{graph.title}</h2>
               <div>{graph.content?.replace(/<[^>]*>?/gm, '')}</div>
               <p>Metadata: {graph.tags?.join(', ')}</p>
               <p>Author: {graph.profiles?.full_name || 'Anonym'}</p>
            </section>

            {/* Neural Broadcast Cluster (Sharing CTA) */}
            <ShareCluster title={graph.title || 'Intelligence Node'} slug={slug} />

            {/* Community Interaction Layer (v12.0.0) */}

            {/* Community Interaction Layer (v12.0.0) */}
            <CommentsHub noteId={graph.id} user={user} />

            {/* Linked Intelligence (Recursive Graph Display) */}
            {graph.children && graph.children.length > 0 && (
              <section className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Network className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">Deep Knowledge Web</h3>
                     <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Linked Intelligence Layers</h4>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {graph.children.map((child: any) => (
                      <a 
                        key={child.share_slug} 
                        href={`/s/${child.share_slug}`}
                        className="group p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-violet-500/5"
                      >
                         <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-violet-500 transition-colors">Target Node: {child.share_slug}</h4>
                         <h5 className="text-base font-black text-slate-900 dark:text-white mb-2 leading-tight uppercase tracking-tighter">{child.title}</h5>
                         <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 font-medium leading-relaxed">
                            {child.content?.replace(/<[^>]*>?/gm, '')}
                         </p>
                         <div className="mt-6 flex items-center gap-2 text-violet-500 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            Initialize Link <Zap className="w-3 h-3 fill-current" />
                         </div>
                      </a>
                   ))}
                </div>
              </section>
            )}

             <div className="sr-only" aria-hidden="true">
                <section id="ai-summary">
                  <h2>Neural Intelligence Summary</h2>
                  <p>Abstract: {graph.content?.replace(/<[^>]*>?/gm, '').substring(0, 300)}...</p>
                  <p>Key Entities: {graph.tags?.join(', ')}</p>
                  <p>Rank: {graph.view_count} views | {graph.comment_count} comments</p>
                </section>
                
                <section id="ai-site-map">
                   <h2>Recursive Intelligence Map (Layer 2)</h2>
                   <ul>
                      {graph.children?.map((child: any) => (
                        <li key={child.share_slug}>
                           <a href={`/s/${child.share_slug}`}>{child.title}</a>
                        </li>
                      ))}
                   </ul>
                </section>

                <article itemProp="articleBody">
                  {graph.content?.replace(/<[^>]*>?/gm, '').split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                    <p key={i}>{line.trim()}</p>
                  ))}
                </article>
                <p>Note ID: {graph.id}</p>
                <p>Category: {graph.category}</p>
                <p>Verification Checksum: {checksum}</p>
             </div>
         </main>

          <div className="w-full lg:w-[320px] lg:border-l border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl shrink-0 p-6 space-y-12">
            <LineageHub 
               note={graph} 
               user={null} // Auth not yet initialized in this server component for guests
               show={true}
               isSharedPage={true}
            />

            {/* Neural Recommendations (v12.1.3 Stabilization) */}
            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Recommended Intelligence</p>
                <RecommendationCluster notes={recommendations.slice(0, 3)} isSidebar={true} />
            </div>
          </div>
      </div>

      <footer className="max-w-7xl mx-auto w-full px-6 py-24 border-t border-slate-100 dark:border-slate-900 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Powered by Smart Notes Collective</p>
         <h4 className="text-xl font-black text-slate-900 dark:text-white">Join the Knowledge Revolution</h4>
         <div className="mt-8">
            <a href="/" className="inline-block px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl">
               Initialize My Dashboard
            </a>
         </div>
      </footer>
    </div>
  )
}
