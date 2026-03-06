import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Note } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Calendar, Tag, ArrowRight, Lock, Copy, Check, ClipboardCopy } from 'lucide-react';

export default function SharedNoteView() {
    const { id, slug } = useParams();
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchNote = async () => {
            setIsLoading(true);
            setNotFound(false);

            try {
                if (slug) {
                    const { data, error } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('share_slug', slug)
                        .eq('is_shared', true)
                        .single();

                    if (error || !data) setNotFound(true);
                    else setNote(data as Note);
                } else if (id) {
                    const { data, error } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('id', id)
                        .eq('is_shared', true)
                        .single();

                    if (error || !data) setNotFound(true);
                    else setNote(data as Note);
                } else {
                    setNotFound(true);
                }
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id, slug]);

    const handleCopyAll = (n: Note) => {
        const parts: string[] = [];

        if (n.title) parts.push(n.title);
        if (n.tags && n.tags.length > 0) parts.push(`Tags: ${n.tags.join(', ')}`);
        if (n.content) parts.push(n.content);
        if (n.reminder_date) parts.push(`Reminder: ${new Date(n.reminder_date).toLocaleString()}`);

        const text = parts.join('\n\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading note...</p>
                </div>
            </div>
        );
    }

    if (notFound || !note) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Note Not Found</h1>
                    <p className="text-muted-foreground max-w-sm">
                        This note doesn't exist, was made private, or has been deleted by its author.
                    </p>
                </div>
                <Button onClick={() => window.location.href = '/'} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
                    <ArrowRight className="w-4 h-4" />
                    Go to Smart Notes
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Smart Notes
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 px-2 py-1 rounded-full">
                        <Globe className="w-3 h-3" />
                        <span>Public Note</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Copy All — header shortcut */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyAll(note)}
                        className={`gap-2 transition-all ${copied ? 'border-green-400 text-green-600 bg-green-50' : ''}`}
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy All'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/'}
                        className="gap-2"
                    >
                        Create Your Own Notes
                        <ArrowRight className="w-3 h-3" />
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-8">
                {/* Title & Meta */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-4xl font-bold text-foreground break-words leading-tight flex-1">
                            {note.title || 'Untitled Note'}
                        </h1>
                        {/* Inline Copy All CTA next to title */}
                        <button
                            onClick={() => handleCopyAll(note)}
                            title="Copy everything in this note"
                            className={`shrink-0 mt-1 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all
                                ${copied
                                    ? 'border-green-400 text-green-600 bg-green-50'
                                    : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50'
                                }`}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy Note'}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {note.updated_at && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Last updated {new Date(note.updated_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </div>
                        )}
                    </div>

                    {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {note.tags.map(tag => (
                                <div key={tag} className="flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-muted-foreground" />
                                    <Badge variant="outline" className="text-muted-foreground border-border">
                                        {tag}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <hr className="border-border" />

                {/* Body */}
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed break-words text-base">
                    {note.content || <span className="text-muted-foreground italic">This note has no content.</span>}
                </div>

                {/* Bottom copy CTA — big and clear after reading */}
                <div className="pt-6 border-t border-border">
                    <button
                        onClick={() => handleCopyAll(note)}
                        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200
                            ${copied
                                ? 'border-green-400 text-green-600 bg-green-50'
                                : 'border-dashed border-gray-300 text-gray-500 hover:border-violet-500 hover:text-violet-600 hover:bg-violet-50'
                            }`}
                    >
                        {copied
                            ? <><Check className="w-4 h-4" /> Everything copied to clipboard!</>
                            : <><ClipboardCopy className="w-4 h-4" /> Copy Everything — Title, Tags & Content</>
                        }
                    </button>
                </div>
            </main>

            {/* Footer CTA */}
            <footer className="border-t border-border px-6 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                    Want to create and share your own notes?
                </p>
                <Button onClick={() => window.location.href = '/'} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
                    Try Smart Notes for Free
                </Button>
            </footer>
        </div>
    );
}
