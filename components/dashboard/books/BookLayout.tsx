'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Book as BookIcon, 
    Plus, 
    Trash2, 
    Clock, 
    ChevronRight, 
    Sparkles, 
    BookOpen 
} from 'lucide-react';
import { Book, Chapter, BookType, BOOK_TEMPLATES } from '@/types/books';
import { BookEditor } from './BookEditor';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export function BookLayout() {
    const { user } = useAuth();
    const supabase = createClient();
    const [books, setBooks] = useState<Book[]>([]);
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isEnterprise = user?.subscription_tier === 'full-intelligence' || user?.subscription_tier === 'enterprise-hub';

    // Fetch from Supabase Book Storage
    useEffect(() => {
        const fetchBooks = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('book_storage')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (error) throw error;
                
                // Map snake_case to camelCase Book interface
                if (data) {
                    const parsedBooks = data.map((b: any) => ({
                        id: b.id,
                        title: b.title,
                        author: b.author || 'Anonymous',
                        type: b.type as BookType,
                        cover: b.cover || '',
                        progress: b.progress || 0,
                        lastEdited: b.updated_at,
                        chapters: b.chapters || [],
                        createdAt: new Date(b.created_at).getTime(),
                        updatedAt: new Date(b.updated_at).getTime()
                    }));
                    setBooks(parsedBooks);
                }
            } catch (e) { 
                console.error('Shelf read error:', e); 
            } finally {
                setIsLoading(false);
            }
        };
        fetchBooks();
    }, [user]);

    const activeBook = books.find(b => b.id === activeBookId);

    const handleCreateBook = async (type: BookType = 'empty') => {
        if (!user) return;
        const template = BOOK_TEMPLATES[type];
        
        const newBookRecord = {
            user_id: user.id,
            title: template.title || 'Untitled Node',
            author: user.email?.split('@')[0] || 'Anonymous Intelligence',
            type,
            cover: 'bg-gradient-to-br from-violet-600 to-indigo-600',
            progress: 0,
            chapters: template.chapters || []
        };

        try {
            const { data, error } = await supabase
                .from('book_storage')
                .insert([newBookRecord])
                .select()
                .single();
                
            if (error) throw error;
            
            const newBook: Book = {
                id: data.id,
                title: data.title,
                author: data.author,
                type: data.type as BookType,
                cover: data.cover,
                progress: data.progress,
                lastEdited: data.updated_at,
                chapters: data.chapters,
                createdAt: new Date(data.created_at).getTime(),
                updatedAt: new Date(data.updated_at).getTime()
            };

            setBooks(prev => [newBook, ...prev]);
            setActiveBookId(newBook.id);
            toast.success('Protocol Initialized', { description: `New ${type} intelligence node created.` });
        } catch (e: any) {
            toast.error('Initialization Failed', { description: e.message });
        }
    };

    const handleDeleteBook = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Terminate this intelligence node? Recovery is impossible.")) {
            // Optimistic UI update
            setBooks(prev => prev.filter(b => b.id !== id));
            if (activeBookId === id) setActiveBookId(null);
            toast.info('Node Purged');
            
            // Delete from DB
            await supabase.from('book_storage').delete().eq('id', id);
        }
    };

    const handleSaveBook = (updatedBook: Book) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? { ...updatedBook, updatedAt: Date.now() } : b));
    };

    if (activeBook) {
        return (
            <BookEditor 
                book={activeBook} 
                onSave={handleSaveBook} 
                onBack={() => setActiveBookId(null)} 
            />
        );
    }

    if (!isEnterprise && !activeBook) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-violet-100 dark:bg-violet-900/30 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/20">
                    <BookIcon className="w-10 h-10 text-violet-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Enterprise Hub Locked</h2>
                <p className="text-sm font-bold text-slate-500 max-w-md uppercase tracking-widest leading-relaxed mb-8">
                    Neural manuscript synthesis and deep storage is restricted to Full Access Enterprise deployments. The cloud payload is secured.
                </p>
                <Button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-payment-modal'))}
                    className="h-14 px-8 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-violet-500/30"
                >
                    Unlock Intelligence Tier
                </Button>
            </div>
        );
    }

    if (isLoading && books.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-4" />
                <div className="w-48 h-4 bg-slate-100 dark:bg-slate-900 rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Hub */}
            <div className="px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-full text-xs font-black uppercase tracking-widest border border-violet-200 dark:border-violet-900/50 shadow-sm">
                        <BookOpen className="w-4 h-4" />
                        Reader Protocol 1.0
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        The <span className="text-violet-600">Intelligence</span> Shelf
                    </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                   <Button 
                    onClick={() => handleCreateBook('novel')}
                    variant="outline"
                    className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all shadow-sm active:scale-95 bg-white dark:bg-slate-900"
                   >
                     <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                     Novel Template
                   </Button>
                   <Button 
                    onClick={() => handleCreateBook('empty')}
                    className="h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl group hover:brightness-110 active:scale-95 transition-all"
                   >
                     <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
                     New Manuscript
                   </Button>
                </div>
            </div>

            {/* Shelf Grid */}
            <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {books.length === 0 ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem]">
                                <BookIcon className="w-16 h-16 text-slate-300" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Shelf Empty</h3>
                                <p className="text-sm text-slate-500 font-medium">Your neural manuscripts haven't been synthesized yet. Start a new book to begin writing.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {books.map(book => (
                                <div 
                                    key={book.id}
                                    onClick={() => setActiveBookId(book.id)}
                                    className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 cursor-pointer hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-500 flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-16 h-20 rounded-xl shadow-lg ${book.cover} flex items-center justify-center`}>
                                            <BookIcon className="w-8 h-8 text-white/50" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-violet-100 dark:border-violet-900/50">
                                                {book.type}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(book.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2 mb-8">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1 group-hover:text-violet-600 transition-colors">
                                            {book.title}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {book.chapters.length} Linked Chapters
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-600 rounded-full" style={{ width: '15%' }} />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase">15%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={(e) => handleDeleteBook(book.id, e)}
                                                className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="h-10 w-10 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-lg active:scale-95">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Glass Accent */}
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-violet-600/10 rounded-[2.5rem] transition-colors pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
