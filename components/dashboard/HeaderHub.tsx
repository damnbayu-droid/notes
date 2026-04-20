'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ArrowUpDown, Tag, Grid3X3, List, Info, Check, Shield, User as UserIcon, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SortOption } from '@/types'

interface HeaderHubProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeFolder: string
  sortBy: SortOption
  setSortBy: (s: SortOption) => void
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void
  selectedTags: string[]
  availableTags: string[]
  onTagToggle: (t: string) => void
  onOpenInfo: () => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Last' },
  { value: 'created', label: 'Created' },
  { value: 'title', label: 'Title' },
]

export function HeaderHub({
  searchQuery,
  setSearchQuery,
  activeFolder,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  selectedTags,
  availableTags,
  onTagToggle,
  onOpenInfo
}: HeaderHubProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer(document.getElementById('header-hub-root'))
  }, [])


  if (!container) return null

  return createPortal(
    <div className="flex-1 flex items-center justify-between gap-2 sm:gap-12 pointer-events-auto min-w-0">

      {/* Mobile Search Overlay Popup */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[250] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tighter italic leading-none">Intelligence Scan</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Neural Cluster: {activeFolder}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative">
            <Input
              autoFocus
              placeholder="Enter query sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 h-14 bg-slate-100 dark:bg-slate-900 border-0 rounded-2xl text-xs font-black uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-violet-500 shadow-inner w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Protocol Optimized for {activeFolder}</p>
            <Button
              onClick={() => setIsSearchOpen(false)}
              className="w-full h-12 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-500/20"
            >
              Apply Tags
            </Button>
          </div>
        </div>
      )}

      {/* NEW: Left-side Search Bar cluster */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Mobile-Only Combined Search & Tags (Relocated per v15.0.3) */}
        <div className="lg:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-violet-600 shadow-sm"
          >
            <Search className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl border shadow-sm transition-all ${selectedTags.length > 0 ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}
              >
                <Tag className={`w-3.5 h-3.5 ${selectedTags.length > 0 ? 'text-white' : 'text-violet-600'}`} />
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-black animate-pulse">
                    {selectedTags.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl z-[300]">
              <div className="max-h-64 overflow-y-auto p-1 py-1 space-y-1 custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {['Shared', 'Discovery'].map(defaultTag => (
                    <DropdownMenuItem
                      key={defaultTag}
                      onClick={() => onTagToggle(defaultTag)}
                      className={`h-10 rounded-xl flex justify-between px-4 transition-colors ${selectedTags.includes(defaultTag) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(defaultTag) ? 'text-violet-600' : 'text-slate-600'}`}>{defaultTag}</span>
                      {selectedTags.includes(defaultTag) && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </DropdownMenuItem>
                  ))}
                  {availableTags.length > 0 && <DropdownMenuSeparator className="my-1" />}
                </div>
                {availableTags.filter(t => t !== 'Shared' && t !== 'Discovery').length === 0 && availableTags.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No Custom Tags</p>
                  </div>
                ) : (
                  <>
                    {selectedTags.length > 0 && (
                      <>
                        <DropdownMenuItem
                          onClick={() => selectedTags.forEach(t => onTagToggle(t))}
                          className="h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest">Clear All</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                      </>
                    )}
                    {availableTags.filter(t => t !== 'Shared' && t !== 'Discovery').map(tag => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => onTagToggle(tag)}
                        className={`h-10 rounded-xl flex justify-between px-4 transition-colors ${selectedTags.includes(tag) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(tag) ? 'text-violet-600' : 'text-slate-600'}`}>{tag}</span>
                        {selectedTags.includes(tag) && <Check className="w-3.5 h-3.5 text-violet-600" />}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Inline Search */}
        <div className="hidden lg:block relative group w-[280px]">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${isFocused ? 'text-violet-600' : 'text-slate-400'}`} />
          <Input
            placeholder={`Scan ${activeFolder}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-10 h-10 bg-slate-100/50 dark:bg-slate-900/50 border-0 rounded-xl text-[10px] font-black uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-violet-500 shadow-inner w-full"
          />
          {searchQuery && (
            <button
              onClick={(e) => { e.stopPropagation(); setSearchQuery('') }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Spacer to push toolbelt content to right */}
      <div className="flex-1" />

      {/* Right: Toolbelt */}
      <div className="flex items-center gap-2 max-w-full overflow-hidden shrink-0">
        {/* Mobile view controls */}
        <div className="lg:hidden flex items-center gap-1">
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-white/5 h-10 items-center">
            <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400'}`}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400'}`}>
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Classification */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 sm:h-11 px-2 sm:px-4 gap-2 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">
                {sortOptions.find(o => o.value === sortBy)?.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-slate-100 shadow-2xl">
            {sortOptions.map(o => (
              <DropdownMenuItem key={o.value} onClick={() => setSortBy(o.value)} className="h-10 rounded-xl flex justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">{o.label}</span>
                {sortBy === o.value && <Check className="w-3.5 h-3.5 text-violet-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Neural Tags (Desktop Only - Mobile version moved to Left) */}
        <div className="hidden lg:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-11 px-4 gap-2 rounded-2xl border shadow-sm shrink-0 transition-all ${selectedTags.length > 0 ? 'bg-violet-600 text-white border-violet-500 hover:bg-violet-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500'}`}
              >
                <Tag className={`w-3.5 h-3.5 ${selectedTags.length > 0 ? 'text-white' : 'text-violet-600'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Intelligence Filter</span>
                {selectedTags.length > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-black ${selectedTags.length > 0 ? 'bg-white text-violet-600' : 'bg-violet-600 text-white'}`}>
                    {selectedTags.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
              <div className="max-h-64 overflow-y-auto p-1 py-1 space-y-1 custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {['Shared', 'Discovery'].map(defaultTag => (
                    <DropdownMenuItem
                      key={defaultTag}
                      onClick={() => onTagToggle(defaultTag)}
                      className={`h-10 rounded-xl flex justify-between px-4 transition-colors ${selectedTags.includes(defaultTag) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(defaultTag) ? 'text-violet-600' : 'text-slate-600'}`}>{defaultTag}</span>
                      {selectedTags.includes(defaultTag) && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </DropdownMenuItem>
                  ))}
                  {availableTags.length > 0 && <DropdownMenuSeparator className="my-1" />}
                </div>
                {availableTags.filter(t => t !== 'Shared' && t !== 'Discovery').length === 0 && availableTags.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No Custom Tags</p>
                  </div>
                ) : (
                  <>
                    {selectedTags.length > 0 && (
                      <>
                        <DropdownMenuItem
                          onClick={() => selectedTags.forEach(t => onTagToggle(t))}
                          className="h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest">Clear All Filters</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                      </>
                    )}
                    {availableTags.filter(t => t !== 'Shared' && t !== 'Discovery').map(tag => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => onTagToggle(tag)}
                        className={`h-10 rounded-xl flex justify-between px-4 transition-colors ${selectedTags.includes(tag) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(tag) ? 'text-violet-600' : 'text-slate-600'}`}>{tag}</span>
                        {selectedTags.includes(tag) && <Check className="w-3.5 h-3.5 text-violet-600" />}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenInfo}
            className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-blue-500 shadow-sm"
            title="System Information"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

        {/* View Selection */}
        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-white/5">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`h-9 w-9 rounded-xl ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400'}`}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={`h-9 w-9 rounded-xl ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400'}`}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>,
    container
  )
}
