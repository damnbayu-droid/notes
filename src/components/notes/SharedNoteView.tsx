import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Note } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SharedNoteView() {
    // In a real app, this would fetch from a public API endpoint without auth
    // For this demo, we'll try to find it in local storage or mock data
    const { id } = useParams();
    const { notes } = useNotes(null);
    const [note, setNote] = useState<Note | null>(null);

    useEffect(() => {
        if (id && notes.length > 0) {
            const found = notes.find(n => n.id === id);
            if (found) setNote(found);
        }
    }, [id, notes]);

    if (!note) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <h1 className="text-2xl font-bold text-foreground">Note Not Found</h1>
                <p className="text-muted-foreground mt-2">This link might be invalid or expired.</p>
                <Button className="mt-6" onClick={() => window.location.href = '/'}>
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Smart Notes
                    </span>
                    <Badge variant="secondary">Public View</Badge>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Create Your Own Notes
                </Button>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-8 overflow-y-auto">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-foreground break-words">{note.title}</h1>
                    <div className="flex flex-wrap gap-2">
                        {note.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-muted-foreground border-border">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed break-words">
                    {note.content}
                </div>
            </main>
        </div>
    );
}
