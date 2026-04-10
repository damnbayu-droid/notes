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
  PinOff,
  Archive,
  ArchiveRestore,
  Palette,
  Tag,
  X,
  Save,
  Trash2,
  Calendar,
  Folder,
  PenTool,
  Share2,
  Mic,
  Maximize2,
  Minimize2,
  Globe,
  Lock,
  Copy,
  Check,
  Shield,
  Loader2,
  ExternalLink,
  Github,
  FilePlus,
  Link as LinkIcon2,
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
  const [textCopied, setTextCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [externalSourceUrl, setExternalSourceUrl] = useState<string | undefined>();
  const [externalSourceType, setExternalSourceType] = useState<string | undefined>();
  const [externalSourceTitle, setExternalSourceTitle] = useState<string | undefined>();
  const [isOutsourceOpen, setIsOutsourceOpen] = useState(false);

  // Dictation States
  const [liveDictationChunks, setLiveDictationChunks] = useState('');
  const [liveDictationInterim, setLiveDictationInterim] = useState('');
  const [isFormattingDictation, setIsFormattingDictation] = useState(false);

  // Track initial state to avoid auto-save on mount if nothing changed
  const lastSavedState = useRef({ html: '', color: '', tags: [] as string[], folder: '', reminderDate: '' });
  const isCreatingRef = useRef(false);
  // Internal state fallback if prop not provided (though Dashboard provides it)
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isMaximized = onToggleExpand ? isExpanded : internalExpanded;
  const toggleMaximized = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const isNewNote = !note;

  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false,
      }),
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
          class: 'rounded-lg max-w-full bg-gray-50 border border-gray-100 shadow-sm my-4',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Note Title (First Line)';
          }
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
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full max-w-none prose-headings:mt-0 prose-headings:mb-2 prose-h1:text-xl sm:prose-h1:text-2xl prose-h1:font-bold prose-p:leading-relaxed prose-p:my-1 text-foreground border-0',
      },
    },
  });

  useEffect(() => {
    if (note) {
      let initialHtml = '';
      if (note.content && (note.content.startsWith('<h1') || note.content.startsWith('<p'))) {
        initialHtml = note.content;
      } else {
        // Auto-linkify raw text that wasn't previously HTML
        let contentToProcess = note.content || '';
        if (!contentToProcess.includes('<') && contentToProcess.includes('http')) {
          // Simple regex to convert raw urls to a tags
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          contentToProcess = contentToProcess.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
          // Convert newlines to breaks to preserve layout
          contentToProcess = contentToProcess.replace(/\n/g, '<br>');
        }
        initialHtml = `<h1>${note.title || ''}</h1><p>${contentToProcess}</p>`;
      }

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
        html: initialHtml,
        color: note.color,
        tags: [...note.tags],
        folder: note.folder || 'Main',
        reminderDate: note.reminder_date || ''
      };
    } else {
      setEditorHtml('');
      setEditorText('');
      if (editor) {
        editor.commands.setContent('<h1></h1>');
      }
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
        html: '',
        color: 'default',
        tags: [],
        folder: 'Main',
        reminderDate: ''
      };
    }
    setNewTag('');
    setIsCanvasOpen(false);
    setSaveStatus('idle');
  }, [note, isOpen, editor]);

  // Debounce the state for auto-save
  const debouncedHtml = useDebounce(editorHtml, 1000);
  const debouncedText = useDebounce(editorText, 1000);
  const debouncedColor = useDebounce(color, 1000);
  const debouncedFolder = useDebounce(folder, 1000);
  const debouncedTags = useDebounce(tags, 1000);
  const debouncedReminderDate = useDebounce(reminderDate, 1000);

  // Auto-save effect
  useEffect(() => {
    if (!isOpen) return;

    const hasChanged =
      debouncedHtml !== lastSavedState.current.html ||
      debouncedColor !== lastSavedState.current.color ||
      debouncedFolder !== lastSavedState.current.folder ||
      debouncedReminderDate !== lastSavedState.current.reminderDate ||
      JSON.stringify(debouncedTags) !== JSON.stringify(lastSavedState.current.tags);

    if (hasChanged && debouncedText.trim()) {
      if (isNewNote && isCreatingRef.current) return;
      if (isNewNote) isCreatingRef.current = true;

      setSaveStatus('saving');

      const parsedTitle = debouncedText.split('\n')[0]?.trim() || 'Untitled Note';

      // We don't want to use handleSave here because it closes the dialog
      onUpdate({
        title: parsedTitle.substring(0, 100),
        content: debouncedHtml,
        color: debouncedColor,
        is_pinned: isPinned,
        is_archived: isArchived,
        tags: debouncedTags,
        reminder_date: debouncedReminderDate || undefined,
        folder: debouncedFolder,
      });

      lastSavedState.current = {
        html: debouncedHtml,
        color: debouncedColor,
        tags: [...debouncedTags],
        folder: debouncedFolder,
        reminderDate: debouncedReminderDate
      };

      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [debouncedHtml, debouncedText, debouncedColor, debouncedFolder, debouncedTags, debouncedReminderDate, isOpen, isPinned, isArchived, onUpdate]);

  const handleSaveSketch = (dataUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: dataUrl }).run();
    }
    setIsCanvasOpen(false);
  };

  const handleSave = useCallback(() => {
    if (!editorText.trim()) {
      onClose();
      return;
    }

    const parsedTitle = editorText.split('\n')[0]?.trim() || 'Untitled Note';

    // Force immediate save of current local state
    onUpdate({
      title: parsedTitle.substring(0, 100),
      content: editorHtml,
      color,
      is_pinned: isPinned,
      is_archived: isArchived,
      tags,
      reminder_date: reminderDate || undefined,
      folder,
    });

    // Update last saved state to prevent the auto-save effect from firing redundant update
    lastSavedState.current = {
      html: editorHtml, color, tags: [...tags], folder, reminderDate
    };

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    onClose();
  }, [editorText, editorHtml, color, isPinned, isArchived, tags, reminderDate, folder, onUpdate, onClose]);

  // Handle immediate save on blur
  const handleBlur = () => {
    if (editorHtml !== lastSavedState.current.html) {
      const parsedTitle = editorText.split('\n')[0]?.trim() || 'Untitled Note';
      onUpdate({
        title: parsedTitle.substring(0, 100),
        content: editorHtml,
        color,
        is_pinned: isPinned,
        is_archived: isArchived,
        tags,
        reminder_date: reminderDate || undefined,
        folder,
      });
      lastSavedState.current = { ...lastSavedState.current, html: editorHtml };
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImportOutsource = (content: string, metadata: any) => {
    if (editor) {
      // For GitHub/Code, we might want to wrap in code block or just insert
      const formattedContent = metadata.type === 'github_clone' 
        ? `<h2>${metadata.path} (GitHub)</h2><pre><code>${content}</code></pre>`
        : content;
        
      editor.chain().focus().insertContent(formattedContent).run();
      
      // Also update note metadata if possible
      const sourceUrl = metadata.url || '';
      const sourceType = metadata.type || 'web';
      const sourceTitle = metadata.path || metadata.repo || 'Source File';

      setExternalSourceUrl(sourceUrl);
      setExternalSourceType(sourceType);
      setExternalSourceTitle(sourceTitle);

      onUpdate({
        external_source_url: sourceUrl,
        external_source_type: sourceType,
        external_source_title: sourceTitle,
        external_meta: {
          ...(note?.external_meta || {}),
          ...metadata
        }
      });
    }
  };

  const colorOption = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent
        className={`${isMaximized ? 'w-full h-[100dvh] sm:max-w-[100vw] sm:h-[100vh] rounded-none' : 'w-full h-[100dvh] sm:w-[95vw] sm:max-w-[700px] md:max-w-[850px] lg:max-w-[1100px] sm:h-[85vh] lg:h-[90vh] sm:rounded-2xl'} flex flex-col p-0 gap-0 ${colorOption.bg} border ${colorOption.border} transition-all duration-300 overflow-hidden shadow-2xl`}
      >
        <DialogHeader className="p-4 pb-2 border-b border-gray-100">
          {/* 3-column layout: [left: expand] [center: actions] [right: close] */}
          <div className="flex items-center gap-2">

            {/* LEFT — Full Screen toggle & Presence */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-700"
                onClick={toggleMaximized}
                title={isMaximized ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              {/* Presence Avatars */}
              {presentUsers.length > 0 && (
                <div className="flex -space-x-2 ml-2 overflow-hidden">
                  {presentUsers.map(u => (
                    <div 
                      key={u.id} 
                      className={`relative w-7 h-7 rounded-full border-2 border-white bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700 ring-2 ${u.is_typing ? 'ring-green-400 animate-pulse' : 'ring-transparent'}`}
                      title={`${u.name || u.email} ${u.is_typing ? '(Typing...)' : ''}`}
                    >
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        (u.name || u.email).charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CENTER — All action buttons */}
            <div className="flex-1 flex items-center justify-center gap-1 flex-wrap">
              {!isNewNote && onTogglePin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isPinned ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                  onClick={() => { setIsPinned(!isPinned); onTogglePin(note.id); }}
                  title={isPinned ? 'Unpin' : 'Pin'}
                >
                  {isPinned ? <Pin className="w-4 h-4 fill-violet-500" /> : <PinOff className="w-4 h-4" />}
                </Button>
              )}
              {!isNewNote && onToggleArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isArchived ? 'text-amber-600 bg-amber-50' : 'text-gray-500'}`}
                  onClick={() => { setIsArchived(!isArchived); onToggleArchive(note.id); }}
                  title={isArchived ? 'Unarchive' : 'Archive'}
                >
                  {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </Button>
              )}

              {/* Color picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500" title="Color">
                    <Palette className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-violet-500 scale-110' : 'border-transparent hover:scale-105'} ${c.bg} ${c.border} border`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sketch */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isCanvasOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                title="Add Sketch"
              >
                <PenTool className="w-4 h-4" />
              </Button>

              {/* Voice */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isVoiceOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                onClick={() => { setIsVoiceOpen(!isVoiceOpen); setIsCanvasOpen(false); }}
                title="Add Voice Note"
              >
                <Mic className="w-4 h-4" />
              </Button>

              {/* Add from Outsource */}
              {!isNewNote && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    title="Add from External Source (GitHub, Google, etc.)"
                    onClick={() => setIsOutsourceOpen(true)}
                  >
                    <FilePlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Attach External Resource Link"
                    onClick={() => setIsOutsourceOpen(true)}
                  >
                    <LinkIcon2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Copy All Text */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${textCopied ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
                title="Copy all text"
                onClick={() => {
                  const fullText = editorText;
                  navigator.clipboard.writeText(fullText);
                  setTextCopied(true);
                  setTimeout(() => setTextCopied(false), 2000);
                }}
              >
                {textCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>

              {/* Share / Public link */}
              {!isNewNote && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${isShared ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                      title={isShared ? 'Note is Public — click to manage' : 'Share Note'}
                    >
                      {isShared ? <Globe className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 space-y-4" align="center">
                    {!isShared ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex bg-gray-100 p-1 rounded-xl">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex-1 h-7 text-[10px] uppercase font-bold tracking-tight ${sharePermission === 'read' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                              onClick={() => setSharePermission('read')}
                            >
                              View Only
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex-1 h-7 text-[10px] uppercase font-bold tracking-tight ${sharePermission === 'write' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                              onClick={() => setSharePermission('write')}
                            >
                              Can Edit
                            </Button>
                          </div>

                          <div 
                            className="flex items-center space-x-2 p-2 bg-violet-50/50 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors cursor-pointer group" 
                            onClick={() => setIsDiscoverable(!isDiscoverable)}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isDiscoverable ? 'bg-violet-500 border-violet-500' : 'bg-white border-gray-300 group-hover:border-violet-400'}`}>
                              {isDiscoverable && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 flex flex-col">
                              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-tight">Post to Discovery</span>
                              <span className="text-[9px] text-violet-600/70">Show this note in a public library</span>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-1.5 px-1 pb-2 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Library Category</span>
                            <div className="flex flex-wrap gap-1">
                              {(['General', 'Work', 'Education', 'Code', 'Personal', 'Other'] as NoteCategory[]).map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setNoteCategory(cat)}
                                  className={`h-6 px-2 text-[9px] font-bold uppercase rounded-lg transition-all ${noteCategory === cat ? 'bg-violet-100 text-violet-700 border border-violet-200 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border border-transparent'}`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="default"
                            className="justify-center gap-2 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md transition-all active:scale-95"
                            disabled={isSharing}
                            onClick={async () => {
                              if (!note || !onShareNote) return;
                              setIsSharing(true);
                              if (note.category !== noteCategory) {
                                onUpdate({ category: noteCategory });
                              }
                              const result = await onShareNote(note.id, 'public', undefined, sharePermission, isDiscoverable);
                              if (result.success && result.slug) {
                                setIsShared(true);
                                setShareSlug(result.slug);
                                const url = buildShareUrl(result.slug);
                                navigator.clipboard.writeText(url);
                                window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Link Copied', message: 'Shared link copied to clipboard', type: 'success' } }));
                              }
                              setIsSharing(false);
                            }}
                          >
                            <Globe className="w-5 h-5" />
                            {isSharing ? 'Creating...' : 'Create Public Share'}
                          </Button>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] gap-2 h-8 text-slate-500 hover:text-violet-600"
                              onClick={() => {
                                const pwd = prompt("Enter a password:");
                                if (pwd) onShareNote?.(note!.id, 'password', pwd, sharePermission, isDiscoverable);
                              }}
                            >
                              <Lock className="w-3.5 h-3.5" /> Password
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] gap-2 h-8 text-slate-500 hover:text-violet-600"
                              onClick={() => {
                                onShareNote?.(note!.id, 'encrypted', undefined, sharePermission, isDiscoverable);
                              }}
                            >
                              <Shield className="w-3.5 h-3.5" /> Encrypted
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl text-center">
                          <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                            <Check className="w-6 h-6 text-green-500" />
                          </div>
                          <h4 className="text-sm font-bold text-violet-900 mb-1">Link is Active!</h4>
                          <p className="text-[10px] text-violet-600 opacity-80 mb-3">
                            Anyone with this link can access your note.
                          </p>
                          <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-violet-200">
                             <span className="text-[10px] text-violet-900 flex-1 truncate font-mono">
                               {buildShareUrl(shareSlug!)}
                             </span>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 hover:bg-violet-50"
                               onClick={() => {
                                 navigator.clipboard.writeText(buildShareUrl(shareSlug!));
                                 setShareCopied(true);
                                 setTimeout(() => setShareCopied(false), 2000);
                               }}
                             >
                               {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                             </Button>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-[10px] text-red-500 hover:bg-red-50 font-bold uppercase"
                          onClick={async () => {
                            if (!note || !onUnshareNote) return;
                            await onUnshareNote(note.id);
                            setIsShared(false);
                            setShareSlug(undefined);
                          }}
                        >
                          Disable Link & Make Private
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}

              {/* Delete */}
              {!isNewNote && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Delete note"
                  onClick={() => { onDelete(note.id); onClose(); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* RIGHT — Close button (has its own Radix X, but we also add explicit spacing) */}
            <div className="shrink-0 w-8" />
          </div>
          <DialogTitle className="sr-only">
            {isNewNote ? 'Create Note' : 'Edit Note'}
          </DialogTitle>
        </DialogHeader>

      <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-2">
        {/* External Source Link Badge (If exists) */}
        {externalSourceUrl && (
          <div className="flex items-center gap-2 p-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl mb-4 animate-in slide-in-from-top-1 transition-all shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-blue-100 dark:ring-white/5">
              {externalSourceType?.includes('github') ? (
                <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
              ) : (
                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest leading-none">Smart File Integration</p>
                <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <p className="text-[13px] text-blue-800 dark:text-blue-100 font-bold truncate mt-1">{externalSourceTitle || externalSourceUrl}</p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-10 px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
              onClick={() => window.open(externalSourceUrl, '_blank')}
            >
              Open Original <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Case: Canvas or Voice (Keeping these as is for now) */}
          {isCanvasOpen ? (
            <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-inner flex flex-col">
              <CanvasEditor
                onSave={handleSaveSketch}
                onCancel={() => setIsCanvasOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* Voice Recorder Section */}
              {isVoiceOpen && (
                <div className="p-4 border border-violet-100 rounded-2xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 flex flex-col gap-4 shrink-0 shadow-sm animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                      Voice Dictation
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-violet-400 hover:text-violet-700 hover:bg-violet-100/50 rounded-full"
                      onClick={() => setIsVoiceOpen(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-3">
                    <VoiceRecorder
                      onTranscriptionChunk={(text) => {
                        setLiveDictationChunks(prev => prev + text);
                      }}
                      onInterimTranscription={(text) => {
                        setLiveDictationInterim(text);
                      }}
                      onRecordingComplete={async (_blob) => {
                        const fullText = liveDictationChunks + liveDictationInterim;
                        if (!fullText.trim()) {
                          setIsVoiceOpen(false);
                          return;
                        }

                        setIsFormattingDictation(true);
                        try {
                          // AI Post-processing
                          const formatted = await formatDictation(fullText);
                          if (editor) {
                            editor.chain().focus().insertContent(formatted + ' ').run();
                          }
                        } finally {
                          setIsFormattingDictation(false);
                          setIsVoiceOpen(false);
                          setLiveDictationChunks('');
                          setLiveDictationInterim('');
                        }
                      }}
                    />

                    <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl border border-violet-100/50 p-3 min-h-[60px] text-sm text-gray-700 shadow-inner overflow-y-auto max-h-[150px]">
                      {isFormattingDictation ? (
                        <div className="flex items-center justify-center h-full text-violet-600 gap-2 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-medium">AI Formatting...</span>
                        </div>
                      ) : !liveDictationChunks && !liveDictationInterim ? (
                        <span className="text-gray-400 italic text-xs flex items-center h-full">Start speaking...</span>
                      ) : (
                        <p className="leading-relaxed">
                          {liveDictationChunks}
                          <span className="text-gray-400">{liveDictationInterim}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TIPTAP RICH TEXT EDITOR */}
              <div
                className="flex-1 flex flex-col min-h-0 cursor-text px-1 overflow-y-auto"
                onClick={() => { if (editor) editor.commands.focus(); }}
              >
                <EditorContent
                  editor={editor}
                  className="flex-1"
                  onBlur={handleBlur}
                />
              </div>

              {/* Metadata Section - Pushed to the very bottom */}
              <div className="pt-4 space-y-3 border-t border-gray-100/50 shrink-0">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                  <Tag className="w-3 h-3 text-gray-400 mr-0.5" />
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors py-0 px-1.5 text-[9px] font-bold uppercase tracking-tighter"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="w-2 h-2 ml-1" />
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="+"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-16 h-6 text-[10px] bg-white/40 border-dashed"
                    />
                  </div>
                </div>

                {/* Automation & Info Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded-md border border-gray-100/50">
                    <Folder className="w-3 h-3 text-gray-400" />
                    <Select value={folder} onValueChange={setFolder}>
                      <SelectTrigger className="w-[100px] h-5 border-0 bg-transparent p-0 text-[10px] font-bold uppercase hover:bg-transparent">
                        <SelectValue placeholder="Folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main">Main</SelectItem>
                        <SelectItem value="Google Notes">Google Notes</SelectItem>
                        <SelectItem value="iCloud Notes">iCloud Notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded-md border border-gray-100/50">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <Input
                      type="datetime-local"
                      value={reminderDate ? new Date(reminderDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setReminderDate(new Date(e.target.value).toISOString())}
                      className="w-auto h-5 border-0 bg-transparent p-0 text-[10px] font-bold uppercase focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 flex items-center justify-between border-t border-gray-100 mt-auto bg-gray-50/50 pb-[env(safe-area-inset-bottom,1.5rem)]">
          <div className="flex flex-col text-[10px] text-gray-400">
            {saveStatus === 'saving' ? (
              <span className="text-violet-600 font-medium animate-pulse flex items-center gap-1">
                <Save className="w-3 h-3 animate-bounce" /> Auto-saving...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Save className="w-3 h-3" /> Changes saved
              </span>
            ) : (
              <>
                <span>Created: {note?.created_at ? new Date(note.created_at).toLocaleString('id-ID') : 'New'}</span>
                <span>Updated: {note?.updated_at ? new Date(note.updated_at).toLocaleString('id-ID') : 'Now'}</span>
              </>
            )}
          </div>

          {!isCanvasOpen && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                Exit
              </Button>
              <Button onClick={handleSave} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          )}
        </div>

        <OutsourcePicker 
          isOpen={isOutsourceOpen}
          onClose={() => setIsOutsourceOpen(false)}
          onImport={handleImportOutsource}
        />
      </DialogContent>
    </Dialog>
  );
}
