import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Sparkles, Calendar, Globe, Network, Eye, Star, MessageSquare, ArrowUpRight, User as UserIcon } from 'lucide-react'
import { DiscoveryFeed } from '@/components/discovery/DiscoveryFeed'
import { Note } from '@/types'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  subscription_tier: string
  created_at: string
}

async function getUserProfile(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !data) return null
  return data as UserProfile
}

async function getUserNotes(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discovery_notes')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  
  return (data || []) as Note[]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const profile = await getUserProfile(id)
  
  if (!profile) return { title: 'User Not Found' }
  
  return {
    title: `${profile.full_name || profile.email.split('@')[0]} | Neural Profile`,
    description: `Explore the intelligence clusters contributed by ${profile.full_name || 'this community member'} in the Smart Notes Oracle.`
  }
}

export default async function UserDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [profile, notes] = await Promise.all([
    getUserProfile(id),
    getUserNotes(id)
  ])

  if (!profile) return notFound()

  const totalViews = notes.reduce((acc, n) => acc + (n.view_count || 0), 0)
  const totalComments = notes.reduce((acc, n) => acc + (n.comment_count || 0), 0)

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Profile Header */}
        <div className="relative group">
           <div className="absolute inset-0 bg-violet-600/5 blur-3xl rounded-[3rem] -z-10 group-hover:bg-violet-600/10 transition-all duration-700" />
           
           <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 p-8 sm:p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl">
              <div className="relative">
                 <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-violet-600 flex items-center justify-center text-white text-5xl font-black italic shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profile.full_name?.[0] || profile.email[0].toUpperCase()}</span>
                    )}
                 </div>
                 {profile.subscription_tier === 'enterprise' && (
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
                       <Sparkles className="w-4 h-4" />
                    </div>
                 )}
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                 <div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                       {profile.full_name || profile.email.split('@')[0]}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800/30">
                          {profile.subscription_tier} tier
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Calendar className="w-3 h-3" /> Joined {new Date(profile.created_at).toLocaleDateString('en-GB')}
                       </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Intelligence Nodes</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white">{notes.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Reach</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white">{totalViews}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Engagement</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white">{totalComments}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Stability Rank</p>
                       <p className="text-xl font-black text-emerald-500">ALPHA</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Intelligence Feed */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Network className="w-5 h-5 text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Discoverable Nodes</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Knowledge Clusters</p>
                 </div>
              </div>
           </div>

           <div className="min-h-[400px]">
              <DiscoveryFeed initialNotes={notes} />
           </div>
        </div>
      </div>
    </div>
  )
}
