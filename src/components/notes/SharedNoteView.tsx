import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitization';
import type { Note, NoteComment } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Globe, Calendar, ArrowRight, Lock, Check, 
    ClipboardCopy, Shield, Key, Save, Loader2, FilePenLine, 
    Star, MessageSquare, Send, Trash2, Cpu, Sparkles 
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Helmet } from 'react-helmet-async';

/**
 * SharedNoteView component provides a premium, secure, and SEO-hardened 
 * view for publicly shared notes. It supports E2EE, password protection,
 * and AI-machine-readability protocols.
 */
export default function SharedNoteView() {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
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

    // Security state
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
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[50vh] text-foreground transition-all duration-300'
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
            window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Broadcast Success', message: 'Intelligence update synced with author.', type: 'success' } }));
        } catch (err: any) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Uplink Error', message: err.message, type: 'error' } }));
        } finally {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 2000);
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
                if (!key) throw new Error('Security key missing from request headers.');
                decryptedContent = await decryptE2EE(rawNote.content, key);
            }

            setNote({ ...rawNote, content: decryptedContent });
            setIsLocked(false);
        } catch (err: any) {
            setDecryptionError(err.message || 'Decryption sequence failed.');
        } finally {
            setIsDecrypting(false);
        }
    };

    useEffect(() => {
        const fetchNote = async () => {
            if (!slug) return;
            setIsLoading(true);
            setNotFound(false);

            try {
                const { data, error } = await supabase.rpc('get_shared_note_by_slug', { p_slug: slug });

                if (error || !data || (Array.isArray(data) && data.length === 0)) {
                    setNotFound(true);
                } else {
                    const fetchedNote = (Array.isArray(data) ? data[0] : data) as Note;
                    if (fetchedNote.share_type === 'password' || fetchedNote.share_type === 'encrypted') {
                        setRawNote(fetchedNote);
                        setIsLocked(true);
                        if (fetchedNote.share_type === 'encrypted' && location.hash) {
                            const { decryptE2EE } = await import('@/lib/crypto');
                            const key = location.hash.replace('#', '');
                            try {
                                const decrypted = await decryptE2EE(fetchedNote.content, key);
                                setNote({ ...fetchedNote, content: decrypted });
                                setIsLocked(false);
                            } catch { setIsLocked(true); }
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
    }, [slug, location.hash]);

    useEffect(() => {
        if (note?.id) {
            fetchRatings(note.id).then(setAvgRating);
            fetchComments(note.id).then(setComments);
        }
    }, [note?.id]);

    const handleRate = async (val: number) => {
        if (!note?.id || !authUser) return;
        setRating(val);
        await rateNote(note.id, val);
        fetchRatings(note.id).then(setAvgRating);
    };

    const handleCopyAll = (n: Note) => {
        const text = `${n.title}\n\n${sanitizeHtml(n.content).replace(/<[^>]*>?/gm, '')}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const jsonLd = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "NoteDigitalDocument",
        "name": note?.title || "Secured Knowledge Snippet",
        "text": note?.content ? sanitizeHtml(note.content).substring(0, 500).replace(/<[^>]*>?/gm, '') : "",
        "datePublished": note?.created_at,
        "dateModified": note?.updated_at,
        "author": { "@type": "Person", "name": "Smart Notes Industrial" }
    }), [note]);

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

    const isMachineMode = new URLSearchParams(window.location.search).get('ai') === 'true';

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-[6px] border-slate-200 border-t-violet-600 rounded-[2rem] animate-spin shadow-xl" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Establishing Secure Uplink</p>
            </div>
        </div>
    );

    if (notFound || !note || isLocked) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-8 px-6">
            <Helmet>
                <title>Access Restricted | Smart Notes Security</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            
            {notFound || !note ? (
                <div className="max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-2xl">
                        <Lock className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Knowledge Redacted</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Transmission Terminated by Author or Protocol</p>
                    </div>
                    <Button onClick={() => navigate('/')} className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-300">Return to Grid</Button>
                </div>
            ) : (
                <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-violet-600 flex items-center justify-center mb-2 shadow-2xl shadow-violet-200 ring-8 ring-violet-50">
                            {rawNote?.share_type === 'encrypted' ? <Shield className="w-10 h-10 text-white" /> : <Key className="w-10 h-10 text-white" />}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                            {rawNote?.share_type === 'encrypted' ? 'End-to-End Encryption' : 'Identity Verification Required'}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Active : Smart Notes Secured Channel</p>
                    </div>

                    {rawNote?.share_type === 'password' && (
                        <div className="space-y-6">
                            <Input
                                type="password"
                                placeholder="Enter Decryption Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                                className="h-16 text-center text-xl font-black bg-white rounded-3xl border-slate-100 shadow-xl"
                                autoFocus
                            />
                            {decryptionError && <p className="text-xs text-red-600 text-center font-black uppercase tracking-widest animate-bounce">{decryptionError}</p>}
                            <Button
                                onClick={() => handleDecrypt()}
                                className="w-full h-16 text-sm font-black uppercase tracking-widest bg-violet-600 hover:bg-violet-700 text-white rounded-3xl shadow-2xl shadow-violet-200 transition-all active:scale-95"
                                disabled={isDecrypting || !password}
                            >
                                {isDecrypting ? 'Decrypting Hub...' : 'Unlock Intelligence'}
                            </Button>
                        </div>
                    )}

                    {rawNote?.share_type === 'encrypted' && decryptionError && (
                        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-2">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Decryption Violation</p>
                            <p className="text-xs text-rose-900 font-medium">{decryptionError}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (isMachineMode) return (
        <div className="p-12 font-mono text-sm leading-loose whitespace-pre-wrap max-w-5xl mx-auto bg-slate-50 border border-slate-100 m-8 rounded-3xl shadow-sm">
            --- MACHINE READABLE UPLINK START ---
            ID: {note.id}
            SLUG: {slug}
            TITLE: {note.title}
            TAGS: {note.tags?.join(', ')}
            CREATED: {note.created_at}
            UPDATED: {note.updated_at}
            
            CONTENT_BLOB:
            {note.content ? sanitizeHtml(note.content).replace(/<[^>]*>?/gm, '') : "EMPTY"}
            
            --- MACHINE READABLE UPLINK END ---
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-violet-100 selection:text-violet-900">
            <Helmet>
                <title>{note.title || 'Knowledge Piece'} | Smart Notes Discovery</title>
                <meta name="description" content={note.content?.substring(0, 160).replace(/<[^>]*>?/gm, '')} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Helmet>

            <header className="border-b border-slate-100 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Public Uplink</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <Cpu className="w-3.5 h-3.5 text-violet-500" />
                         AI Optimization Active
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => handleCopyAll(note)} className={`h-11 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest ${copied ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50' : 'text-slate-500'}`}>
                        {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                        {copied ? 'Captured' : 'Capture Snippet'}
                    </Button>
                    <Button onClick={() => navigate('/')} className="h-11 px-6 rounded-xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-violet-200">
                        Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 space-y-12">
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                             {note.tags?.map(t => (
                               <Badge key={t} variant="outline" className="h-7 px-3 rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest">#{t}</Badge>
                             ))}
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]">
                            {note.title || 'Untitled Dataset'}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                           <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Updated {new Date(note.updated_at).toLocaleDateString()}</div>
                           <div className="flex items-center gap-2 text-violet-500"><Sparkles className="w-4 h-4" /> Verified Intelligence</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-2xl shadow-slate-200/50">
                        {note.share_permission === 'write' ? (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center bg-violet-50 p-4 rounded-3xl border border-violet-100">
                                   <div className="flex items-center gap-3 text-violet-600">
                                      <FilePenLine className="w-5 h-5" />
                                      <span className="text-xs font-black uppercase tracking-widest">Guest Contribution Active</span>
                                   </div>
                                   <Button onClick={handleSave} disabled={isSaving} className="h-11 rounded-2xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest px-8">
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                      Commit Intelligence
                                   </Button>
                                </div>
                                <EditorContent editor={editor} />
                            </div>
                        ) : (
                            <div 
                                className="prose prose-xl dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content || '<p class="text-slate-400 italic">Dataset is empty.</p>') }}
                            />
                        )}
                    </div>
                </section>

                <section className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] -mr-32 -mt-32" />
                    <div className="max-w-2xl space-y-8 relative z-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black tracking-tighter">Community Feedback</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Collective Intelligence Assessment</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                                {[1,2,3,4,5].map(s => (
                                    <button key={s} disabled={!authUser} onClick={() => handleRate(s)} className="p-1 hover:scale-125 transition-transform">
                                        <Star className={`w-8 h-8 ${(rating || avgRating.average) >= s ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                                    </button>
                                ))}
                            </div>
                            <div className="h-10 w-px bg-white/10 hidden sm:block" />
                            <div className="text-center sm:text-left">
                                <p className="text-2xl font-black">{avgRating.average} <span className="text-sm font-normal text-slate-400">/ 5</span></p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{avgRating.count} Verifications</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                  <MessageSquare className="w-6 h-6" />
                               </div>
                               <h3 className="text-2xl font-black">Intelligence Forum</h3>
                            </div>

                            <div className="relative">
                                <textarea 
                                    value={newComment} onChange={e => setNewComment(e.target.value)}
                                    placeholder={authUser ? "Synthesize your thoughts..." : "Identity verification required to contribute."}
                                    disabled={!authUser || isSubmittingComment}
                                    className="w-full min-h-[140px] bg-white/5 border border-white/10 rounded-[2.5rem] p-6 text-sm focus:ring-2 focus:ring-violet-500 transition-all resize-none placeholder:text-slate-500"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <Button disabled={!newComment.trim() || !authUser || isSubmittingComment} onClick={() => handleSubmitComment()} className="h-12 px-8 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
                                        Post Satellite Data <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                               {comments.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-xs italic font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">Satellite communications silent.</div>
                               ) : comments.map(c => (
                                   <div key={c.id} className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                                       <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-black text-xs uppercase shadow-lg">{c.user_email?.[0]}</div>
                                       <div className="flex-1 space-y-1">
                                           <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black uppercase tracking-tighter text-violet-400">{c.user_email?.split('@')[0]}</span>
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                                           </div>
                                           <p className="text-sm text-slate-300 font-medium leading-relaxed">{c.content}</p>
                                       </div>
                                       {authUser?.id === c.user_id && (
                                           <button onClick={() => handleDeleteComment(c.id)} className="text-white/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                       )}
                                   </div>
                               ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="p-12 text-center space-y-6 bg-white dark:bg-slate-900 border-t border-slate-100">
                <div className="inline-flex flex-col gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Engineered for Global Intelligence</p>
                   <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Join the Knowledge Revolution</h4>
                </div>
                <Button onClick={() => navigate('/')} className="h-16 px-12 rounded-3xl bg-slate-900 text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-slate-200">
                    Get Free Secured Dashboard
                </Button>
            </footer>
        </div>
    );
}
