import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitization';
import type { Note, NoteComment } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Globe, Calendar, Tag, ArrowRight, Lock, Copy, Check, ClipboardCopy, Shield, Key, Save, Loader2, FilePenLine, Star, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Helmet } from 'react-helmet-async';

export default function SharedNoteView() {
    const { id, slug } = useParams();
    const location = useLocation();
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { user: authUser } = useAuth();
    const { rateNote, fetchRatings, addComment, fetchComments, deleteComment } = useNotes(authUser);

    // Feedback state
    const [rating, setRating] = useState<number>(0);
    const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
    const [comments, setComments] = useState<NoteComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Encryption state
    const [isLocked, setIsLocked] = useState(false);
    const [password, setPassword] = useState('');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptionError, setDecryptionError] = useState('');
    const [rawNote, setRawNote] = useState<Note | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: true, HTMLAttributes: { class: 'text-violet-500 underline decoration-violet-500/30' } })
        ],
        content: '',
        editable: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[50vh] text-foreground'
            }
        }
    });

    useEffect(() => {
        if (editor && note) {
            editor.commands.setContent(note.content || '');
            editor.setEditable(note.share_permission === 'write');
        }
    }, [note, editor]);

    const handleSave = async () => {
        if (!editor || !note || !slug) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('update_shared_note', {
                p_share_slug: slug,
                p_title: note.title,
                p_content: editor.getHTML()
            });
            if (error) throw error;
            window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Saved', message: 'Guest edits saved to author.', type: 'success' } }));
        } catch (err: any) {
            console.error(err);
            window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Save Failed', message: err.message, type: 'error' } }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDecrypt = async (pwd?: string) => {
        if (!rawNote) return;
        setIsDecrypting(true);
        setDecryptionError('');

        try {
            const { decryptWithPassword, decryptE2EE } = await import('@/lib/crypto');
            let decryptedContent = '';

            if (rawNote.share_type === 'password' && (pwd || password)) {
                decryptedContent = await decryptWithPassword(rawNote.content, pwd || password, rawNote.password_salt!);
            } else if (rawNote.share_type === 'encrypted') {
                const key = location.hash.replace('#', '');
                if (!key) throw new Error('Decryption key missing in URL');
                decryptedContent = await decryptE2EE(rawNote.content, key);
            }

            setNote({ ...rawNote, content: decryptedContent });
            setIsLocked(false);
        } catch (err: any) {
            setDecryptionError(err.message || 'Decryption failed');
        } finally {
            setIsDecrypting(false);
        }
    };

    useEffect(() => {
        const fetchNote = async () => {
            setIsLoading(true);
            setNotFound(false);

            try {
                // NEW SECURE FETCH: Use RPC to get shared note by slug without broad SELECT power
                const { data, error } = await supabase.rpc('get_shared_note_by_slug', {
                    p_slug: slug
                });

                if (error || !data || (Array.isArray(data) && data.length === 0)) {
                    setNotFound(true);
                } else {
                    const fetchedNote = (Array.isArray(data) ? data[0] : data) as Note;
                    if (fetchedNote.is_encrypted) {
                        setRawNote(fetchedNote);
                        setIsLocked(true);
                        // Auto-decrypt if it's E2EE and hash exists
                        if (fetchedNote.share_type === 'encrypted' && location.hash) {
                            // We need to wait for state to set or just pass data
                            const { decryptE2EE } = await import('@/lib/crypto');
                            const key = location.hash.replace('#', '');
                            try {
                                const decrypted = await decryptE2EE(fetchedNote.content, key);
                                setNote({ ...fetchedNote, content: decrypted });
                                setIsLocked(false);
                            } catch {
                                setIsLocked(true); // Stay locked if auto-decrypt fails
                            }
                        }
                    } else {
                        setNote(fetchedNote);
                    }
                }
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id, slug, location.hash]);

    // Load feedback data
    useEffect(() => {
        if (note?.id) {
            fetchRatings(note.id).then(setAvgRating);
            fetchComments(note.id).then(setComments);
        }
    }, [note?.id]);

    const handleRate = async (val: number) => {
        if (!note?.id || !authUser) return;
        setRating(val);
        const res = await rateNote(note.id, val);
        if (res.success) {
            fetchRatings(note.id).then(setAvgRating);
        }
    };

    const handleSubmitComment = async (parentId?: string) => {
        if (!note?.id || !newComment.trim() || !authUser) return;
        setIsSubmittingComment(true);
        const res = await addComment(note.id, newComment, parentId);
        if (res.success) {
            setNewComment('');
            fetchComments(note.id).then(setComments);
        }
        setIsSubmittingComment(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        const res = await deleteComment(commentId);
        if (res.success && note?.id) {
            fetchComments(note.id).then(setComments);
        }
    };

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

    if (notFound || !note || isLocked) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
                {notFound || !note ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">Note Not Found</h1>
                            <p className="text-muted-foreground max-w-sm">
                                This note doesn't exist, was made private, or has been deleted by its author.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center mb-4">
                                {rawNote?.share_type === 'encrypted' ? (
                                    <Shield className="w-10 h-10 text-violet-600" />
                                ) : (
                                    <Key className="w-10 h-10 text-violet-600" />
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {rawNote?.share_type === 'encrypted' ? 'End-to-End Encrypted' : 'Password Protected'}
                            </h1>
                            <p className="text-muted-foreground">
                                {rawNote?.share_type === 'encrypted'
                                    ? 'This note is encrypted with a secret key in the link. Only people with the full link can read it.'
                                    : 'Please enter the password provided by the author to view this note.'}
                            </p>
                        </div>

                        {rawNote?.share_type === 'password' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                                        className="h-12 text-center text-lg shadow-sm"
                                        autoFocus
                                    />
                                    {decryptionError && (
                                        <p className="text-sm text-red-600 text-center font-medium animate-bounce">{decryptionError}</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleDecrypt()}
                                    className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-200 hover:scale-[1.02] transition-transform active:scale-95"
                                    disabled={isDecrypting || !password}
                                >
                                    {isDecrypting ? 'Decrypting...' : 'Unlock Note'}
                                </Button>
                            </div>
                        )}

                        {rawNote?.share_type === 'encrypted' && decryptionError && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                                <p className="text-sm text-red-600 font-medium">Decryption Error</p>
                                <p className="text-xs text-red-500 mt-1">{decryptionError}</p>
                                <p className="text-[10px] text-red-400 mt-2 italic">Make sure you have the full link with the #key part.</p>
                            </div>
                        )}

                        <div className="pt-4 text-center">
                            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="text-muted-foreground">
                                Back to Home
                            </Button>
                        </div>
                    </div>
                )}
                {(notFound || !note) && (
                    <Button onClick={() => window.location.href = '/'} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
                        <ArrowRight className="w-4 h-4" />
                        Go to Smart Notes
                    </Button>
                )}
            </div>
        );
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NoteDigitalDocument",
        "name": note.title || "Untitled Note",
        "text": note.content ? sanitizeHtml(note.content).replace(/<[^>]*>?/gm, '') : "",
        "datePublished": note.created_at,
        "dateModified": note.updated_at,
        "keywords": note.tags?.join(", "),
        "author": {
            "@type": "Person",
            "name": "Smart Notes User"
        }
    };

    // AI Machine Readable format support (?format=text or ?machine=true)
    const isMachineMode = new URLSearchParams(window.location.search).get('machine') === 'true' || 
                         new URLSearchParams(window.location.search).get('format') === 'text';

    if (isMachineMode) {
        return (
            <div className="p-8 font-mono text-sm whitespace-pre-wrap max-w-4xl mx-auto selection:bg-violet-100">
                # {note.title}
                {"\n"}
                {">"} Tags: {note.tags?.join(', ')}
                {"\n"}
                {">"} Updated: {note.updated_at}
                {"\n\n"}
                {note.content ? sanitizeHtml(note.content).replace(/<[^>]*>?/gm, '') : "Empty"}
                {"\n\n"}
                ---
                Generated by Smart Notes AI Export Layer
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>{note.title || 'Shared Note'} | Smart Notes</title>
                <meta name="description" content={note.content ? note.content.substring(0, 160).replace(/<[^>]*>?/gm, '') : 'A note shared via Smart Notes.'} />
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>
            {/* Header */}
            <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                    <div className="hidden xs:flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 px-2 py-1 rounded-full shrink-0">
                        <Globe className="w-3 h-3" />
                        <span className="hidden sm:inline">Public Note</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 text-[10px] uppercase font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded cursor-help transition-all hover:bg-violet-100" title="This page is optimized for AI reading (JSON-LD Enabled)">
                        AI Readable
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Copy All — header shortcut */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyAll(note)}
                        className={`h-8 sm:h-9 px-2 sm:px-3 gap-1.5 sm:gap-2 transition-all ${copied ? 'border-green-400 text-green-600 bg-green-50' : ''}`}
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden xs:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/'}
                        className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 sm:gap-2"
                    >
                        <span className="hidden sm:inline">Create Notes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-8">
                {/* Title & Meta */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground break-words leading-tight flex-1">
                            {note.title || 'Untitled Note'}
                        </h1>
                        {/* Inline Copy All CTA next to title */}
                        <div className="flex sm:block">
                            <button
                                onClick={() => handleCopyAll(note)}
                                title="Copy everything in this note"
                                className={`shrink-0 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all shadow-sm
                                    ${copied
                                        ? 'border-green-400 text-green-600 bg-green-50'
                                        : 'border-border bg-background text-muted-foreground hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                                {copied ? 'Content Copied!' : 'Copy Note'}
                            </button>
                        </div>
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
                {note.share_permission === 'write' ? (
                    <div className="border border-violet-100 dark:border-violet-900/50 rounded-2xl p-6 bg-card shadow-sm mt-8 transition-shadow focus-within:ring-2 focus-within:ring-violet-200">
                        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/30 w-fit px-3 py-1.5 rounded-full">
                            <FilePenLine className="w-3.5 h-3.5" />
                            Guest Edit Mode
                        </div>
                        <EditorContent editor={editor} />
                        <div className="mt-8 flex justify-end border-t border-border pt-4">
                            <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 shadow-md flex-1 sm:flex-none">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed break-words text-base mt-8 tiptap-content"
                        dangerouslySetInnerHTML={{ 
                            __html: note.content ? sanitizeHtml(note.content) : '<span class="text-muted-foreground italic">This note has no content.</span>' 
                        }}
                    />
                )}

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

            {/* Community Section */}
            {note && (
                <section className="bg-slate-50 dark:bg-slate-900/50 border-t border-border">
                    <div className="max-w-3xl mx-auto w-full px-6 py-12 space-y-12">
                        {/* Rating Header */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="text-xl font-bold text-foreground">Community Rating</h3>
                                <p className="text-sm text-muted-foreground">What do you think of this knowledge?</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            disabled={!authUser}
                                            onClick={() => handleRate(star)}
                                            className={`p-1 transition-all hover:scale-125 active:scale-95 ${!authUser ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            <Star 
                                                className={`w-8 h-8 ${
                                                    (rating || avgRating.average) >= star 
                                                        ? 'text-amber-400 fill-amber-400' 
                                                        : 'text-slate-200 dark:text-slate-700'
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {avgRating.count} Reviews • {avgRating.average} Avg
                                </span>
                            </div>
                        </div>

                        {/* Comments Area */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">Discussions</h3>
                            </div>

                            {/* Comment Input */}
                            <div className="relative group">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={authUser ? "Share your thoughts or ask a question..." : "Please log in to join the discussion"}
                                    disabled={!authUser || isSubmittingComment}
                                    className="w-full min-h-[120px] p-5 rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-violet-500 transition-all resize-none shadow-sm"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    {!authUser && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Login Required</span>
                                    )}
                                    <Button
                                        size="sm"
                                        disabled={!newComment.trim() || !authUser || isSubmittingComment}
                                        onClick={() => handleSubmitComment()}
                                        className="rounded-xl px-4 bg-violet-600 hover:bg-violet-700 shadow-md transition-all active:scale-95"
                                    >
                                        <Send className="w-3.5 h-3.5 mr-2" /> Post
                                    </Button>
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                        <p className="text-sm text-slate-400 italic">No comments yet. Be the first to spark a conversation!</p>
                                    </div>
                                ) : (
                                    comments.map((c) => (
                                        <div key={c.id} className="flex gap-4 group animate-in slide-in-from-bottom-4 duration-300">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0 uppercase">
                                                {c.user_email?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground">{c.user_email?.split('@')[0]}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-medium">{new Date(c.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {authUser?.id === c.user_id && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(c.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                    {c.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
