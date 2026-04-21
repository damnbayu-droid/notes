'use client'

import { useState, useMemo } from 'react'
import { 
  Sparkles, 
  Search, 
  ArrowUpRight, 
  Clock, 
  X,
  Share2,
  MessageSquare,
  Mail,
  Copy,
  Check,
  BookOpen,
  LayoutGrid,
  List,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Note } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DiscoveryFeedProps {
  initialNotes: Note[]
}

const CATEGORIES = ['All', 'Education', 'Work', 'Code', 'Personal', 'Other'] as const

export function DiscoveryFeed({ initialNotes }: DiscoveryFeedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredNotes = useMemo(() => {
    return initialNotes.filter(note => {
      const matchesSearch = (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (note.content || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [initialNotes, searchQuery, selectedCategory])

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Search & Filter Controls */}
      <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto w-full">
         <div className="relative w-full group">
            <div className="absolute inset-0 bg-violet-500/10 blur-2xl rounded-2xl group-hover:bg-violet-500/20 transition-all duration-500" />
            <div className="relative flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-2xl transition-all group-within:border-violet-500 group-within:ring-4 group-within:ring-violet-500/10">
               <div className="flex-1 flex items-center pl-6">
                  <Search className="w-5 h-5 text-slate-400 mr-4" />
                  <input 
                     type="text"
                     placeholder="Search Files"
                     className="bg-transparent border-0 focus:ring-0 w-full text-slate-900 dark:text-white font-medium placeholder:text-slate-400 text-base"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onFocus={() => setIsSearchActive(true)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 mr-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
               </div>
               <Button 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl px-8 py-4 font-black uppercase text-xs tracking-widest hover:bg-violet-600 hover:text-white transition-all shadow-lg active:scale-95"
               >
                  Search
               </Button>
            </div>
         </div>

         <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
               {CATEGORIES.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500 ring-offset-2' : 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            <div className="flex items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
               <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <List className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredNotes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-32 space-y-6"
          >
            <div className="bg-slate-100 dark:bg-slate-900 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-300 dark:border-slate-700">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Nodes Found</h3>
               <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">We couldn't find any intelligence nodes matching your search criteria.</p>
               <Button 
                variant="ghost" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-50 dark:hover:bg-violet-900/10 mt-4 h-10 rounded-xl"
               >
                Clear all filters
               </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
              : "flex flex-col gap-4"
            }
          >
            {filteredNotes.map((note) => (
              viewMode === 'grid' ? (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={note.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 shadow-sm shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded text-[8px] uppercase font-black tracking-widest text-slate-500 truncate max-w-[80px]">
                      {note.category || 'General'}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 sm:space-y-3 mb-3 sm:mb-4 min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white line-clamp-2 text-[11px] sm:text-base group-hover:text-violet-600 transition-colors tracking-tight uppercase leading-tight italic break-words overflow-hidden">
                      {note.title || 'Untitled Dataset'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium opacity-80 break-words overflow-hidden hidden sm:block">
                      {note.content?.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).slice(0, 5).join(' ') + '...'}
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 mt-auto border-t border-slate-50 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1 hidden sm:flex">
                      {note.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded">
                          #{tag.substring(0, 8)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2.5 min-w-0">
                      <Link 
                        href={`/u/${note.user_id}`}
                        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity min-w-0"
                      >
                         <div className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[8px] font-black text-violet-600 shrink-0 overflow-hidden">
                            {note.profiles?.avatar_url ? (
                              <img src={note.profiles.avatar_url} alt="Author" className="w-full h-full object-cover" />
                            ) : (
                              <span>{note.profiles?.full_name?.[0] || note.profiles?.email?.[0]?.toUpperCase() || '?'}</span>
                            )}
                         </div>
                         <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 truncate">
                            {note.profiles?.full_name || 'Anonym'}
                         </span>
                      </Link>

                      <div className="flex items-center gap-2.5 ml-auto">
                        <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-tight text-slate-400 italic shrink-0">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{new Date(note.updated_at).toLocaleDateString('en-GB')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-tight text-slate-400 italic shrink-0">
                          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-violet-500" />
                          <span>{note.view_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-violet-600 border border-slate-100 dark:border-white/5 shadow-sm transition-all shrink-0"
                          >
                             <Share2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
                           <DropdownMenuItem 
                              onClick={() => {
                                const url = `${window.location.origin}/s/${note.share_slug}`;
                                window.open(`https://wa.me/?text=Check this node: ${encodeURIComponent(note.title || '')} ${url}`, '_blank');
                              }}
                              className="h-10 rounded-xl gap-3 cursor-pointer"
                           >
                              <MessageSquare className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                              onClick={() => {
                                const url = `${window.location.origin}/s/${note.share_slug}`;
                                window.location.href = `mailto:?subject=Intelligence Node&body=Access this node: ${url}`;
                              }}
                              className="h-10 rounded-xl gap-3 cursor-pointer"
                           >
                              <Mail className="w-4 h-4 text-blue-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Email Hub</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                              onClick={() => {
                                const url = `${window.location.origin}/s/${note.share_slug}`;
                                navigator.clipboard.writeText(url);
                                toast.success('Neural Link Sequenced');
                              }}
                              className="h-10 rounded-xl gap-3 cursor-pointer"
                           >
                              <Copy className="w-4 h-4 text-violet-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Copy Link</span>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Link 
                        href={`/s/${note.share_slug}`} 
                        className="h-7 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase text-[8px] sm:text-[9px] tracking-widest px-2.5 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-violet-600 hover:text-white border border-slate-200 dark:border-white/5 transition-all active:scale-95 shadow-sm whitespace-nowrap shrink-0 min-w-fit"
                        title="Access Node"
                      >
                        <span className="hidden xl:inline">Access</span>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={note.id}
                  className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-100 dark:border-slate-800 p-4 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center gap-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3 mb-1 min-w-0">
                      <h3 className="font-black text-slate-900 dark:text-white truncate text-xs uppercase italic tracking-tight break-words overflow-hidden">{note.title || 'Untitled Dataset'}</h3>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 border border-slate-100 dark:border-slate-800 rounded shrink-0">{note.category || 'General'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate opacity-60 italic break-words overflow-hidden">
                        {note.content?.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).slice(0, 6).join(' ') + '...'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase hidden sm:flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updated_at).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-[9px] font-black text-violet-500 uppercase hidden sm:flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      {note.view_count || 0}
                    </span>
                    <Link 
                      href={`/s/${note.share_slug}`} 
                      className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-2 hover:bg-violet-600 hover:text-white transition-all shadow-lg"
                    >
                      <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Access</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
