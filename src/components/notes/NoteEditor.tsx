import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import type { Note, NoteColor, User, NoteCategory } from '@/types';
import { NOTE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Palette,
  Tag,
  X,
  Trash2,
  Calendar,
  Folder,
  PenTool,
  Share2,
  Mic,
  Maximize2,
  Minimize2,
  Globe,
  Loader2,
  Github,
  FilePlus,
  Link as LinkIcon2,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { buildShareUrl } from '@/lib/shareUtils';
import { formatDictation } from '@/lib/openai';
import { CanvasEditor } from './CanvasEditor';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { usePresence } from '@/hooks/usePresence';
import { OutsourcePicker } from './OutsourcePicker';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CustomDocument = Document.extend({
  content: 'heading block*',
});

interface NoteEditorProps {
  user: User | null;
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onShareNote?: (id: string, type?: 'public' | 'password' | 'encrypted', password?: string, permission?: 'read' | 'write', isDiscoverable?: boolean) => Promise<{ success: boolean; slug?: string; key?: string; error?: string }>;
  onUnshareNote?: (id: string) => Promise<{ success: boolean; error?: string }>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  folders?: string[];
}

export function NoteEditor({
  user,
  note,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onShareNote,
  onUnshareNote,
  isExpanded = false,
  onToggleExpand,
  folders = ['Main']
}: NoteEditorProps) {
  const { presentUsers } = usePresence(note?.id || null, user);
  const [editorHtml, setEditorHtml] = useState('');
  const [editorText, setEditorText] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [folder, setFolder] = useState('Main');
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | undefined>();
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('read');
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('General');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [externalSourceUrl, setExternalSourceUrl] = useState<string | undefined>();
  const [externalSourceType, setExternalSourceType] = useState<string | undefined>();
  const [externalSourceTitle, setExternalSourceTitle] = useState<string | undefined>();
  const [isOutsourceOpen, setIsOutsourceOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dictation States
  const [liveDictationChunks, setLiveDictationChunks] = useState('');
  const [liveDictationInterim, setLiveDictationInterim] = useState('');
  const [isFormattingDictation, setIsFormattingDictation] = useState(false);

  const lastSavedState = useRef({ html: '', color: '', tags: [] as string[], folder: '', reminderDate: '', isDiscoverable: false, category: 'General' as NoteCategory });
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isMaximized = onToggleExpand ? isExpanded : internalExpanded;
  const toggleMaximized = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const isNewNote = !note;

  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({ document: false }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-violet-500 underline decoration-violet-500/30 underline-offset-4 hover:decoration-violet-500 transition-colors cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full bg-slate-50 border border-slate-100 shadow-xl my-6',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Note Title (First Line)';
          return 'Start writing...';
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML());
      setEditorText(editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full max-w-none prose-headings:mt-0 prose-headings:mb-2 prose-h1:text-xl sm:prose-h1:text-2xl prose-h1:font-black prose-p:leading-relaxed prose-p:my-1 text-slate-900 border-0',
      },
    },
  });

  useEffect(() => {
    if (note) {
      const initialHtml = note.content?.startsWith('<') ? note.content : `<h1>${note.title}</h1><p>${note.content}</p>`;
      setEditorHtml(initialHtml);
      if (editor) {
        editor.commands.setContent(initialHtml);
        setEditorText(editor.getText());
      }
      setColor(note.color);
      setIsPinned(note.is_pinned);
      setIsArchived(note.is_archived);
      setTags(note.tags);
      setReminderDate(note.reminder_date || '');
      setFolder(note.folder || 'Main');
      setIsShared(note.is_shared || false);
      setShareSlug(note.share_slug);
      setIsDiscoverable(note.is_discoverable || false);
      setNoteCategory(note.category || 'General');
      setExternalSourceUrl(note.external_source_url);
      setExternalSourceType(note.external_source_type);
      setExternalSourceTitle(note.external_source_title);

      lastSavedState.current = {
        html: initialHtml, color: note.color, tags: [...note.tags],
        folder: note.folder || 'Main', reminderDate: note.reminder_date || '',
        isDiscoverable: note.is_discoverable || false, category: note.category || 'General'
      };
    } else {
      setEditorHtml('');
      setEditorText('');
      if (editor) editor.commands.setContent('<h1></h1>');
      setColor('default');
      setIsPinned(false);
      setIsArchived(false);
      setTags([]);
      setReminderDate('');
      setFolder('Main');
      setIsShared(false);
      setShareSlug(undefined);
      setIsDiscoverable(false);
      setNoteCategory('General');
      setExternalSourceUrl(undefined);
      setExternalSourceType(undefined);
      setExternalSourceTitle(undefined);
      lastSavedState.current = { 
        html: '', color: 'default', tags: [], folder: 'Main', 
        reminderDate: '', isDiscoverable: false, category: 'General' 
      };
    }
  }, [note, isOpen, editor]);

  const debouncedHtml = useDebounce(editorHtml, 1000);
  const debouncedText = useDebounce(editorText, 1000);
  const debouncedColor = useDebounce(color, 1000);
  const debouncedFolder = useDebounce(folder, 1000);
  const debouncedTags = useDebounce(tags, 1000);
  const debouncedReminderDate = useDebounce(reminderDate, 1000);

  useEffect(() => {
    if (!isOpen) return;
    const hasChanged = debouncedHtml !== lastSavedState.current.html ||
      debouncedColor !== lastSavedState.current.color ||
      debouncedFolder !== lastSavedState.current.folder ||
      debouncedReminderDate !== lastSavedState.current.reminderDate ||
      isDiscoverable !== lastSavedState.current.isDiscoverable ||
      noteCategory !== lastSavedState.current.category ||
      JSON.stringify(debouncedTags) !== JSON.stringify(lastSavedState.current.tags);

    if (hasChanged && debouncedText.trim()) {
      setSaveStatus('saving');
      const parsedTitle = debouncedText.split('\n')[0]?.trim() || 'Untitled Note';
      onUpdate({
        title: parsedTitle.substring(0, 100),
        content: debouncedHtml,
        color: debouncedColor,
        is_pinned: isPinned,
        is_archived: isArchived,
        tags: debouncedTags,
        reminder_date: debouncedReminderDate || undefined,
        folder: debouncedFolder,
        is_discoverable: isDiscoverable,
        category: noteCategory
      });
      lastSavedState.current = { 
        html: debouncedHtml, color: debouncedColor, tags: [...debouncedTags], 
        folder: debouncedFolder, reminderDate: debouncedReminderDate,
        isDiscoverable, category: noteCategory
      };
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [debouncedHtml, debouncedText, debouncedColor, debouncedFolder, debouncedTags, debouncedReminderDate, isOpen, isPinned, isArchived, isDiscoverable, noteCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = useCallback(() => {
    if (!editorText.trim()) { onClose(); return; }
    const parsedTitle = editorText.split('\n')[0]?.trim() || 'Untitled Note';
    onUpdate({ title: parsedTitle.substring(0, 100), content: editorHtml, color, is_pinned: isPinned, is_archived: isArchived, tags, reminder_date: reminderDate || undefined, folder });
    onClose();
  }, [editorText, editorHtml, color, isPinned, isArchived, tags, reminderDate, folder, onUpdate, onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For now, we support images and plain text
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editor) {
          editor.chain().focus().setImage({ src: event.target.result as string }).run();
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editor) {
          editor.chain().focus().insertContent(`<pre><code>${event.target.result}</code></pre>`).run();
        }
      };
      reader.readAsText(file);
    } else {
      window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'File Type Unsupported', message: 'Currently supporting Images and Text/MD files.', type: 'info' } }));
    }
  };

  const handleImportOutsource = (content: string, metadata: any) => {
    if (editor) {
      const formattedContent = metadata.type === 'github_clone' ? `<h2>${metadata.path}</h2><pre><code>${content}</code></pre>` : content;
      editor.chain().focus().insertContent(formattedContent).run();
      setExternalSourceUrl(metadata.url);
      setExternalSourceType(metadata.type);
      setExternalSourceTitle(metadata.path || metadata.repo);
      onUpdate({ external_source_url: metadata.url, external_source_type: metadata.type, external_source_title: metadata.path || metadata.repo });
    }
  };

  const colorOption = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent
        className={`${isMaximized ? 'w-full h-[100dvh] rounded-none' : 'w-full h-[100dvh] sm:w-[95vw] sm:max-w-[700px] md:max-w-[900px] lg:max-w-[1200px] sm:h-[90vh] sm:rounded-[3rem]'} flex flex-col p-0 gap-0 ${colorOption.bg} border-0 transition-all duration-500 overflow-hidden shadow-2xl`}
      >
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 flex-row items-center gap-4 space-y-0">
          <div className="flex items-center gap-3 shrink-0">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-slate-100 rounded-2xl" onClick={toggleMaximized}>
               {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
             </Button>
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
            {!isNewNote && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-11 w-11 rounded-2xl transition-all ${isPinned ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-400 hover:bg-slate-100'}`}
                  onClick={() => { setIsPinned(!isPinned); onTogglePin?.(note.id); }}
                >
                  <Pin className={`w-5 h-5 ${isPinned ? 'fill-white' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-11 w-11 rounded-2xl transition-all ${isArchived ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:bg-slate-100'}`}
                  onClick={() => { setIsArchived(!isArchived); onToggleArchive?.(note.id); }}
                >
                  {isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                </Button>
              </div>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:bg-slate-100 rounded-2xl">
                  <Palette className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 rounded-[2rem] shadow-2xl border-slate-100">
                <div className="flex flex-wrap gap-2 w-40">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-9 h-9 rounded-xl border-2 transition-all ${color === c.value ? 'border-violet-600 scale-110 shadow-lg' : 'border-transparent hover:scale-105 active:scale-95'} ${c.bg} ${c.border}`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className={`h-11 w-11 ${isCanvasOpen ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-400 hover:bg-slate-100'} rounded-2xl transition-all`} onClick={() => setIsCanvasOpen(!isCanvasOpen)}>
              <PenTool className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="icon" className={`h-11 w-11 ${isVoiceOpen ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-400 hover:bg-slate-100'} rounded-2xl transition-all`} onClick={() => setIsVoiceOpen(!isVoiceOpen)}>
              <Mic className="w-5 h-5" />
            </Button>
            
            {/* Category Selector */}
            <Select value={noteCategory} onValueChange={(val: NoteCategory) => setNoteCategory(val)}>
              <SelectTrigger className="h-11 px-4 gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all border border-blue-100 focus:ring-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-blue-100 shadow-2xl">
                {['General', 'Education', 'Work', 'Code', 'Personal', 'Other'].map(cat => (
                  <SelectItem key={cat} value={cat} className="text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Folder / Move CTA */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-11 px-4 gap-2 text-violet-600 font-black uppercase tracking-widest text-[10px] bg-violet-50 hover:bg-violet-100 rounded-2xl transition-all border border-violet-100">
                  <Folder className="w-4 h-4" />
                  {folder}
                  <ChevronRight className="w-3 h-3 opacity-40 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 rounded-2xl shadow-2xl border-violet-100">
                 <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Move to Folder</p>
                 <div className="flex flex-col gap-1">
                   {folders.map(f => (
                     <button
                        key={f}
                        onClick={() => setFolder(f)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${folder === f ? 'bg-violet-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                     >
                       {f}
                     </button>
                   ))}
                 </div>
              </PopoverContent>
            </Popover>

            {/* Discoverable Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-2xl transition-all ${isDiscoverable ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:bg-slate-100'}`}
              onClick={() => setIsDiscoverable(!isDiscoverable)}
              title="Global Discovery Library"
            >
              <Globe className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <div className="flex -space-x-3 overflow-hidden mr-2">
                {presentUsers.map(u => (
                  <div key={u.id} className="relative w-8 h-8 rounded-2xl border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm transition-transform hover:-translate-y-1">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-2xl object-cover" /> : (u.name || 'U').charAt(0)}
                  </div>
                ))}
             </div>
             <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl" onClick={onClose}>
               <X className="w-5 h-5" />
             </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Action Row: [Add File] [Select Drive] [Connect Resource] */}
          <div className="flex flex-wrap items-center gap-3">
             <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                onClick={() => fileInputRef.current?.click()}
             >
               <FilePlus className="w-4 h-4 text-violet-600" />
               Add from Device
             </Button>
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

             <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                onClick={() => setIsOutsourceOpen(true)}
             >
               <Cloud className="w-4 h-4 text-blue-500" />
               Select from Drive
             </Button>

             <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                onClick={() => setIsOutsourceOpen(true)}
             >
               <LinkIcon2 className="w-4 h-4 text-emerald-500" />
               Connect Resource
             </Button>
          </div>

          {externalSourceUrl && (
            <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-lg animate-in slide-in-from-top-1">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                  {externalSourceType?.includes('github') ? <Github className="w-6 h-6 text-slate-900" /> : <Globe className="w-6 h-6 text-blue-600" />}
               </div>
               <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Integration</p>
                  <p className="text-sm font-black text-slate-900 truncate">{externalSourceTitle || 'Source Integration'}</p>
               </div>
               <Button size="sm" className="h-10 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-6" onClick={() => window.open(externalSourceUrl, '_blank')}>
                 Open Original
               </Button>
            </div>
          )}

          {isCanvasOpen ? (
            <div className="flex-1 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-2xl ring-4 ring-slate-50/50">
               <CanvasEditor onSave={(url) => { editor?.chain().focus().setImage({ src: url }).run(); setIsCanvasOpen(false); }} onCancel={() => setIsCanvasOpen(false)} />
            </div>
          ) : (
            <>
              {isVoiceOpen && (
                <div className="p-6 bg-violet-600 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-2">
                   {/* Voice Content Here */}
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                         <span className="text-xs font-black uppercase tracking-widest text-white">Dictation Master AI</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsVoiceOpen(false)} className="h-8 w-8 text-white/60 hover:text-white rounded-xl hover:bg-white/10">
                        <X className="w-4 h-4" />
                      </Button>
                   </div>
                   <div className="flex gap-4 items-start">
                     <VoiceRecorder 
                        onTranscriptionChunk={t => setLiveDictationChunks(p => p + t)} 
                        onInterimTranscription={setLiveDictationInterim} 
                        onRecordingComplete={async () => {
                          const full = liveDictationChunks + liveDictationInterim;
                          if (!full.trim()) { setIsVoiceOpen(false); return; }
                          setIsFormattingDictation(true);
                          const fmt = await formatDictation(full);
                          editor?.chain().focus().insertContent(fmt).run();
                          setIsFormattingDictation(false);
                          setIsVoiceOpen(false);
                          setLiveDictationChunks('');
                          setLiveDictationInterim('');
                        }}
                     />
                     <div className="flex-1 bg-black/20 backdrop-blur-md rounded-3xl p-5 min-h-[80px] text-white/90 text-sm font-medium border border-white/10 shadow-inner">
                        {isFormattingDictation ? <div className="flex items-center gap-3 animate-pulse text-violet-200"><Loader2 className="w-4 h-4 animate-spin" /> AI Perfecting content...</div> : (liveDictationChunks + liveDictationInterim || 'System listening...')}
                     </div>
                   </div>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 cursor-text px-2 overflow-y-auto" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} className="flex-1" />
              </div>
              
              <div className="pt-6 space-y-4 border-t border-slate-50 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-300" />
                  {tags.map(t => (
                    <Badge key={t} variant="outline" className="h-7 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold uppercase text-[9px] tracking-tight hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer" onClick={() => handleRemoveTag(t)}>
                      {t} <X className="w-2.5 h-2.5 ml-1.5" />
                    </Badge>
                  ))}
                  <Input placeholder="Add Tag..." value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleKeyDown} className="w-24 h-7 text-[10px] rounded-xl border-dashed border-slate-200 bg-transparent px-3" />
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                        <Calendar className="w-4 h-4" />
                        <Input type="datetime-local" value={reminderDate ? new Date(reminderDate).toISOString().slice(0, 16) : ''} onChange={e => setReminderDate(new Date(e.target.value).toISOString())} className="border-0 bg-transparent p-0 text-[10px] font-black uppercase w-36 h-auto focus-visible:ring-0" />
                    </div>
                    {isShared && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-black tracking-widest px-3 h-8 rounded-xl"><Globe className="w-3 h-3 mr-2" /> Live Public Link</Badge>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-8 flex items-center justify-between bg-slate-50/50 rounded-b-[3rem] border-t border-slate-100">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{saveStatus === 'saving' ? 'Syncing to Cloud...' : saveStatus === 'saved' ? 'Security Protocol Verified' : 'Local Sandbox Environment'}</p>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${saveStatus === 'saving' ? 'bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
               <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                 {saveStatus === 'saving' ? 'Processing Snapshot' : 'Encrypted & Stored'}
               </p>
             </div>
          </div>

          <div className="flex gap-3">
             {!isNewNote && (
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all" onClick={() => { if(confirm("Erase this intelligence snapshot permanently?")) { onDelete?.(note!.id); onClose(); } }}>
                   <Trash2 className="w-5 h-5" />
                </Button>
             )}
             {!isNewNote && onShareNote && (
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 text-slate-900 font-black uppercase text-xs tracking-widest hover:bg-white shadow-sm transition-all active:scale-95" onClick={() => setIsSharing(true)}>
                  <Share2 className="w-5 h-5 mr-3 text-violet-600" /> Share Access
                </Button>
             )}
             <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-300 hover:bg-black transition-all active:scale-95" onClick={handleSave}>
               Finalize & Close
             </Button>
          </div>
        </div>

        <Dialog open={isSharing} onOpenChange={setIsSharing}>
          <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-slate-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Share Intelligence</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <Button 
                   onClick={async () => {
                     const res = await onShareNote?.(note!.id, 'public', undefined, sharePermission, isDiscoverable);
                     if (res?.success) {
                       setIsShared(true);
                       setShareSlug(res.slug);
                       window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Broadcast Active', message: 'Public link generated successfully.', type: 'success' } }));
                     }
                   }}
                   className="w-full h-14 rounded-2xl bg-violet-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-200"
                >
                  Generate Public Link
                </Button>
                {isShared && shareSlug && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-mono text-slate-500 truncate mr-4">{buildShareUrl(shareSlug)}</span>
                       <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 px-4 rounded-xl text-violet-600 font-black uppercase text-[9px] tracking-widest bg-violet-100"
                          onClick={() => {
                            navigator.clipboard.writeText(buildShareUrl(shareSlug));
                            setShareCopied(true);
                            setTimeout(() => setShareCopied(false), 2000);
                          }}
                       >
                         {shareCopied ? 'Copied' : 'Copy'}
                       </Button>
                    </div>

                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-4">
                          <button onClick={() => setSharePermission('read')} className={`text-[10px] font-black uppercase tracking-widest ${sharePermission === 'read' ? 'text-violet-600' : 'text-slate-400'}`}>Read Only</button>
                          <button onClick={() => setSharePermission('write')} className={`text-[10px] font-black uppercase tracking-widest ${sharePermission === 'write' ? 'text-violet-600' : 'text-slate-400'}`}>Collab</button>
                       </div>
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest h-8"
                          onClick={async () => {
                             await onUnshareNote?.(note!.id);
                             setIsShared(false);
                             setShareSlug(undefined);
                          }}
                       >
                         Revoke Access
                       </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <OutsourcePicker isOpen={isOutsourceOpen} onClose={() => setIsOutsourceOpen(false)} onImport={handleImportOutsource} />
      </DialogContent>
    </Dialog>
  );
}
