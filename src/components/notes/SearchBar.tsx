import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  Grid3X3,
  List,
  ArrowUpDown,
  Check,
  Tag,
  Plus,
  Info,
} from 'lucide-react';
import type { SortOption } from '@/types';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  availableTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onCreate: () => void;
  onOpenInfo?: () => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Date created' },
  { value: 'title', label: 'Title' },
];

export function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedTags,
  availableTags,
  onTagToggle,
  onClearFilters,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  onCreate,
  onOpenInfo,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [adCountdown, setAdCountdown] = useState<string | null>(null);

  // Listen for Ad Countdown updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail.hide) {
        setAdCountdown(null);
        return;
      }
      const remaining = e.detail.remaining;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setAdCountdown(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };
    window.addEventListener('ad-countdown-update', handleUpdate);
    return () => window.removeEventListener('ad-countdown-update', handleUpdate);
  }, []);

  const hasFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="space-y-1.5 px-4 py-1.5 bg-white/70 dark:bg-black/40 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/50 sticky top-0 z-30">
      <div className="flex flex-col gap-2">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFocused ? 'text-violet-600' : 'text-muted-foreground opacity-50'}`} />
          <Input
            placeholder="Search your secured notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`pl-10 pr-10 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 transition-all rounded-xl text-sm ${isFocused ? 'border-violet-500 ring-4 ring-violet-500/10' : ''}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 gap-2 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    {sortOptions.find((o) => o.value === sortBy)?.label.split(' ')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className="flex justify-between items-center py-2.5"
                  >
                    <span className="text-sm">{option.label}</span>
                    <Check className={`w-4 h-4 text-violet-600 ${sortBy === option.value ? 'opacity-100' : 'opacity-0'}`} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tags Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 gap-2 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Tags</span>
                  {selectedTags.length > 0 && (
                    <div className="w-4 h-4 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center font-black">
                      {selectedTags.length}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Filter tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {availableTags.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">No tags yet</div>
                  ) : (
                    availableTags.map((tag) => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => onTagToggle(tag)}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="text-sm">{tag}</span>
                        <Check className={`w-4 h-4 text-violet-600 ${selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'}`} />
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 shadow-inner">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-7 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid3X3 className={`w-3.5 h-3.5 ${viewMode === 'grid' ? 'text-violet-600' : 'text-gray-400'}`} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-7 w-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className={`w-3.5 h-3.5 ${viewMode === 'list' ? 'text-violet-600' : 'text-gray-400'}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {adCountdown && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl animate-in fade-in duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                <span className="text-[10px] font-black font-mono text-violet-700 dark:text-violet-300 tracking-tighter">
                  SUPPORT {adCountdown}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenInfo}
              className="h-10 w-10 text-violet-600 hover:bg-violet-50 rounded-xl border border-violet-100 dark:border-violet-900"
              title="Smart Notes Info"
            >
              <Info className="w-5 h-5" />
            </Button>
            <button
              onClick={onCreate}
              className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110 active:brightness-90"
              aria-label="Create New Note"
            >
              <Plus className="w-5 h-5 font-black" />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.1em]">New Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-in slide-in-from-top-2 duration-300">
          <button
            onClick={onClearFilters}
            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
            title="Clear all filters"
          >
            <X className="w-3 h-3" />
          </button>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1.5 bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-lg animate-in zoom-in-95 duration-200"
            >
              <Tag className="w-2.5 h-2.5 opacity-50" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tag}</span>
              <button
                onClick={() => onTagToggle(tag)}
                className="hover:bg-violet-200 dark:hover:bg-violet-800 p-0.5 rounded-md transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
