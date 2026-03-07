import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Note, NoteColor } from '@/types';
import { NOTE_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
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
} from 'lucide-react';
import { buildShareUrl } from '@/lib/shareUtils';
import { CanvasEditor } from './CanvasEditor';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NoteEditorProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onShareNote?: (id: string, type?: 'public' | 'password' | 'encrypted', password?: string) => Promise<{ success: boolean; slug?: string; key?: string; error?: string }>;
  onUnshareNote?: (id: string) => Promise<{ success: boolean; error?: string }>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function NoteEditor({
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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
  const [textCopied, setTextCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Track initial state to avoid auto-save on mount if nothing changed
  const lastSavedState = useRef({ title: '', content: '', color: '', tags: [] as string[], folder: '', reminderDate: '' });
  // Internal state fallback if prop not provided (though Dashboard provides it)
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isMaximized = onToggleExpand ? isExpanded : internalExpanded;
  const toggleMaximized = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const isNewNote = !note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setIsPinned(note.is_pinned);
      setIsArchived(note.is_archived);
      setTags(note.tags);
      setReminderDate(note.reminder_date || '');
      setFolder(note.folder || 'Main');
      setIsShared(note.is_shared || false);
      setShareSlug(note.share_slug);

      // Update last saved state to CURRENT state to avoid immediate auto-save
      lastSavedState.current = {
        title: note.title,
        content: note.content,
        color: note.color,
        tags: [...note.tags],
        folder: note.folder || 'Main',
        reminderDate: note.reminder_date || ''
      };
    } else {
      setTitle('');
      setContent('');
      setColor('default');
      setIsPinned(false);
      setIsArchived(false);
      setTags([]);
      setReminderDate('');
      setFolder('Main');
      setIsShared(false);
      setShareSlug(undefined);

      lastSavedState.current = {
        title: '',
        content: '',
        color: 'default',
        tags: [],
        folder: 'Main',
        reminderDate: ''
      };
    }
    setNewTag('');
    setIsCanvasOpen(false);
    setSaveStatus('idle');
  }, [note, isOpen]);

  // Debounce the state for auto-save
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedContent = useDebounce(content, 1000);
  const debouncedColor = useDebounce(color, 1000);
  const debouncedFolder = useDebounce(folder, 1000);
  const debouncedTags = useDebounce(tags, 1000);
  const debouncedReminderDate = useDebounce(reminderDate, 1000);

  // Auto-save effect
  useEffect(() => {
    if (!isOpen) return;

    const hasChanged =
      debouncedTitle !== lastSavedState.current.title ||
      debouncedContent !== lastSavedState.current.content ||
      debouncedColor !== lastSavedState.current.color ||
      debouncedFolder !== lastSavedState.current.folder ||
      debouncedReminderDate !== lastSavedState.current.reminderDate ||
      JSON.stringify(debouncedTags) !== JSON.stringify(lastSavedState.current.tags);

    if (hasChanged && (debouncedTitle.trim() || debouncedContent.trim())) {
      setSaveStatus('saving');

      // We don't want to use handleSave here because it closes the dialog
      onUpdate({
        title: debouncedTitle.trim() || 'Untitled Note',
        content: debouncedContent.trim(),
        color: debouncedColor,
        is_pinned: isPinned,
        is_archived: isArchived,
        tags: debouncedTags,
        reminder_date: debouncedReminderDate || undefined,
        folder: debouncedFolder,
      });

      lastSavedState.current = {
        title: debouncedTitle,
        content: debouncedContent,
        color: debouncedColor,
        tags: [...debouncedTags],
        folder: debouncedFolder,
        reminderDate: debouncedReminderDate
      };

      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [debouncedTitle, debouncedContent, debouncedColor, debouncedFolder, debouncedTags, debouncedReminderDate, isOpen, isPinned, isArchived, onUpdate]);

  const handleSaveSketch = (dataUrl: string) => {
    const imageMarkdown = `\n![Sketch](${dataUrl})\n`;
    setContent(prev => prev + imageMarkdown);
    setIsCanvasOpen(false);
  };

  const handleSave = useCallback(() => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }

    // Force immediate save of current local state
    onUpdate({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color,
      is_pinned: isPinned,
      is_archived: isArchived,
      tags,
      reminder_date: reminderDate || undefined,
      folder,
    });

    // Update last saved state to prevent the auto-save effect from firing redundant update
    lastSavedState.current = {
      title, content, color, tags: [...tags], folder, reminderDate
    };

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    onClose();
  }, [title, content, color, isPinned, isArchived, tags, reminderDate, folder, onUpdate, onClose]);

  // Handle immediate save on blur
  const handleBlur = () => {
    if (title !== lastSavedState.current.title || content !== lastSavedState.current.content) {
      onUpdate({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        color,
        is_pinned: isPinned,
        is_archived: isArchived,
        tags,
        reminder_date: reminderDate || undefined,
        folder,
      });
      lastSavedState.current = { ...lastSavedState.current, title, content };
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

  const colorOption = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent
        className={`${isMaximized ? 'w-full h-full sm:max-w-[95vw] sm:h-[95vh]' : 'w-full sm:max-w-2xl h-full sm:h-auto max-h-screen sm:max-h-[90vh]'} flex flex-col p-0 gap-0 ${colorOption.bg} border ${colorOption.border} transition-all duration-300 overflow-hidden shadow-2xl`}
      >
        <DialogHeader className="p-4 pb-2 border-b border-gray-100">
          {/* 3-column layout: [left: expand] [center: actions] [right: close] */}
          <div className="flex items-center gap-2">

            {/* LEFT — Full Screen toggle */}
            <div className="flex items-center shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-700"
                onClick={toggleMaximized}
                title={isMaximized ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
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

              {/* Copy All Text */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${textCopied ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
                title="Copy all text"
                onClick={() => {
                  const fullText = [title, content].filter(Boolean).join('\n\n');
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
                    <div className="space-y-1">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {isShared ? (
                          <>
                            <Globe className="w-4 h-4 text-green-600" />
                            Public Link Active
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-gray-500" />
                            Private Note
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isShared
                          ? 'Manage how others access this note.'
                          : 'Only you can see this note. Share it to collaborate.'}
                      </p>
                    </div>

                    {!isShared ? (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            className="justify-start gap-2 h-10"
                            size="sm"
                            disabled={isSharing || isNewNote}
                            onClick={async () => {
                              if (!note || !onShareNote) return;
                              setIsSharing(true);
                              const result = await onShareNote?.(note.id, 'public');
                              if (result && result.success && result.slug) {
                                setIsShared(true); setShareSlug(result.slug);
                                const url = buildShareUrl(result.slug);
                                navigator.clipboard.writeText(url);
                                setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
                                window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Public Link Created', message: 'Standard link copied to clipboard', type: 'success' } }));
                              }
                              setIsSharing(false);
                            }}
                          >
                            <Globe className="w-4 h-4 text-blue-500" />
                            Standard Public Link
                          </Button>

                          <div className="space-y-2 border rounded-lg p-2 bg-gray-50/50">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                              <Lock className="w-3 h-3" /> Password Protected
                            </div>
                            <div className="flex gap-1">
                              <Input
                                placeholder="Set password..."
                                type="password"
                                className="h-8 text-xs bg-white"
                                id="share-password"
                              />
                              <Button
                                size="sm"
                                className="h-8 px-2 bg-violet-600"
                                disabled={isSharing}
                                onClick={async () => {
                                  const pwd = (document.getElementById('share-password') as HTMLInputElement)?.value;
                                  if (!pwd) return;
                                  setIsSharing(true);
                                  const result = await onShareNote?.(note!.id, 'password', pwd);
                                  if (result && result.success && result.slug) {
                                    setIsShared(true); setShareSlug(result.slug);
                                    const url = buildShareUrl(result.slug);
                                    navigator.clipboard.writeText(url);
                                    setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
                                    window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Password Set', message: 'Note encrypted with password', type: 'success' } }));
                                  }
                                  setIsSharing(false);
                                }}
                              >
                                Set
                              </Button>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="justify-start gap-2 h-10 border-dashed border-violet-300 hover:border-violet-500 hover:bg-violet-50"
                            size="sm"
                            disabled={isSharing || isNewNote}
                            onClick={async () => {
                              if (!note || !onShareNote) return;
                              setIsSharing(true);
                              const result = await onShareNote?.(note.id, 'encrypted');
                              if (result && result.success && result.slug && result.key) {
                                setIsShared(true); setShareSlug(result.slug);
                                const url = `${buildShareUrl(result.slug)}#${result.key}`;
                                navigator.clipboard.writeText(url);
                                setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
                                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                  detail: {
                                    title: 'E2EE Created',
                                    message: 'Zero-knowledge link with key copied!',
                                    type: 'success'
                                  }
                                }));
                              }
                              setIsSharing(false);
                            }}
                          >
                            <Shield className="w-4 h-4 text-violet-600" />
                            Full End-to-End Encryption
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {shareSlug && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md border border-gray-100">
                            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                              {buildShareUrl(shareSlug)}
                            </span>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                              onClick={() => { navigator.clipboard.writeText(buildShareUrl(shareSlug!)); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
                            >
                              {shareCopied ? < Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 text-red-600 hover:bg-red-50 border-red-200"
                          disabled={isSharing}
                          onClick={async () => {
                            if (!note || !onUnshareNote) return;
                            setIsSharing(true);
                            const result = await onUnshareNote(note.id);
                            if (result.success) {
                              setIsShared(false);
                              setShareSlug(undefined);
                              window.dispatchEvent(new CustomEvent('dcpi-notification', { detail: { title: 'Note Made Private', message: 'The share link is now disabled.', type: 'info' } }));
                            }
                            setIsSharing(false);
                          }}
                        >
                          <Lock className="w-4 h-4" />
                          {isSharing ? 'Updating...' : 'Disable Link & Make Private'}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                          Type: {note?.share_type === 'encrypted' ? 'E2E Encrypted' : note?.share_type === 'password' ? 'Password Protected' : 'Public'}
                        </p>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 sm:pb-6 scrollbar-hide">
          {isCanvasOpen ? (
            <div className="h-[400px] border border-gray-200 rounded-lg bg-white overflow-hidden shadow-inner flex flex-col">
              <CanvasEditor
                onSave={handleSaveSketch}
                onCancel={() => setIsCanvasOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* Voice Recorder Section */}
              {isVoiceOpen && (
                <div className="mb-4 p-4 border border-violet-100 rounded-lg bg-violet-50/30 flex flex-col gap-2 items-center justify-center">
                  <span className="text-xs font-medium text-violet-600 mb-1">
                    Voice Note active - Speaking will auto-transcribe
                  </span>
                  <VoiceRecorder
                    onRecordingComplete={(blob) => {
                      console.log('Audio recorded:', blob.size);
                      window.dispatchEvent(new CustomEvent('dcpi-notification', {
                        detail: { title: 'Voice Note Saved', message: 'Transcription added to note', type: 'success' }
                      }));
                      setIsVoiceOpen(false);
                    }}
                    onTranscriptionComplete={(text) => {
                      setContent(prev => prev + text);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVoiceOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                  >
                    Close Voice Recorder
                  </Button>
                </div>
              )}

              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                className="text-xl font-semibold border-0 bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-400"
              />

              <Textarea
                placeholder="Take a note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                className="min-h-[200px] max-h-none resize-y border-0 bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-400"
                rows={10}
              />

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Tags</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Metadata Controls */}
              <div className="flex items-center gap-4">
                {/* Folder Select */}
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-gray-400" />
                  <Select value={folder} onValueChange={setFolder}>
                    <SelectTrigger className="w-[140px] h-8 text-sm">
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main">Main</SelectItem>
                      <SelectItem value="Google Notes">Google Notes</SelectItem>
                      <SelectItem value="iCloud Notes">iCloud Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Picker (Simple Native Input for now) */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    value={reminderDate ? new Date(reminderDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setReminderDate(new Date(e.target.value).toISOString())}
                    className="w-auto h-8 text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 mt-auto bg-gray-50/50">
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
      </DialogContent>
    </Dialog >
  );
}
