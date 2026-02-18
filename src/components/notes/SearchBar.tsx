import { useState } from 'react';
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
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'
            }`} />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`pl-11 pr-10 h-12 bg-background border-border transition-all ${isFocused ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-3 gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {sortOptions.find(o => o.value === sortBy)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                >
                  <Check className={`w-4 h-4 mr-2 ${sortBy === option.value ? 'opacity-100' : 'opacity-0'}`} />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-3 gap-2">
                <Tag className="w-4 h-4" />
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No tags available
                </div>
              ) : (
                availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                  >
                    <Check className={`w-4 h-4 mr-2 ${selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'}`} />
                    {tag}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-12 w-12 rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-12 w-12 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="w-3 h-3" />
              {tag}
              <button onClick={() => onTagToggle(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={onClearFilters}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
