import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    ArrowUpRight, 
    BookOpen, 
    Clock, 
    Compass,
    Sparkles,
    Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { NoteCategory } from '@/types';

export function DiscoveryPage() {
    const [notes, setNotes] = useState<(Note & { averageRating?: number; ratingCount?: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'All'>('All');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchDiscoverableNotes() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('is_discoverable', true)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    // Fetch ratings for each note
                    const notesWithRatings = await Promise.all((data as Note[]).map(async (n) => {
                        const { data: ratings } = await supabase
                            .from('note_ratings')
                            .select('rating')
                            .eq('note_id', n.id);
                        
                        if (ratings && ratings.length > 0) {
                            const avg = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
                            return { ...n, averageRating: Math.round(avg * 10) / 10, ratingCount: ratings.length };
                        }
                        return { ...n, averageRating: 0, ratingCount: 0 };
                    }));
                    setNotes(notesWithRatings);
                }
            } catch (err: any) {
                console.error('Failed to fetch discovery feed:', err);
                if (err.code === 'PGRST204' || err.message?.includes('is_discoverable')) {
                    // Specific error for missing column
                    window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                        detail: { title: 'Discovery Not Syncing', message: 'Your database needs a core update to enable Community Library features. Check the Admin panel for guide.', type: 'info' } 
                    }));
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchDiscoverableNotes();
    }, []);

    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [notes, searchQuery, selectedCategory]);

    const handleOpenNote = (slug: string) => {
        if (slug) {
            navigate(`/s/${slug}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-6 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Compass className="w-3.5 h-3.5" />
                        Community Library
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Discover <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Smart Knowledge</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Explore public notes shared by the community. From coding snippets to study guides, find what you need to grow.
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="max-w-3xl mx-auto w-full space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-violet-500/10 blur-xl group-hover:bg-violet-500/20 transition-all rounded-full" />
                        <Input
                            placeholder="Search library by title, content or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="relative h-14 w-full pl-12 rounded-2xl border-white/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg ring-offset-violet-500 focus:ring-violet-500 text-base"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {(['All', 'Education', 'Work', 'Code', 'Personal', 'Other'] as const).map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat as any)}
                                className={`rounded-xl h-9 px-4 text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-violet-600 shadow-lg shadow-violet-200 ring-2 ring-violet-500 ring-offset-2' : 'hover:border-violet-300 hover:text-violet-600'}`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-violet-600 animate-pulse uppercase tracking-widest">Scanning Discovery Feed...</p>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No discoverable notes found</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Be the first to share your knowledge! Mark one of your notes as 'Discoverable' to see it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-500">
                        {filteredNotes.map((note) => (
                            <div 
                                key={note.id}
                                className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold tracking-tight px-2 py-0.5">
                                            {note.category || 'General'}
                                        </Badge>
                                        {note.ratingCount! > 0 && (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="w-3 h-3 fill-amber-500" />
                                                <span className="text-[10px] font-bold">{note.averageRating}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2 mb-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg group-hover:text-violet-600 transition-colors">
                                        {note.title || 'Untitled Note'}
                                    </h3>
                                    <div 
                                        className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: note.content.substring(0, 200).replace(/<[^>]*>?/gm, '') }}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                        {note.tags.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="outline" className="text-[10px] font-medium border-slate-200">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(note.updated_at).toLocaleDateString()}
                                        </div>
                                        <Button 
                                            size="sm" 
                                            className="h-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 transition-all active:scale-95 px-4"
                                            onClick={() => handleOpenNote(note.share_slug!)}
                                        >
                                            Read <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiscoveryPage;
