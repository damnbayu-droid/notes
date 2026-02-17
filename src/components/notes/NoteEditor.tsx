import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { CanvasEditor } from './CanvasEditor';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { toast } from 'sonner';
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
  onSave: (note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
}

export function NoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onTogglePin,
  onToggleArchive,
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
    } else {
      setTitle('');
      setContent('');
      setColor('default');
      setIsPinned(false);
      setIsArchived(false);
      setTags([]);
      setReminderDate('');
      setFolder('Main');
    }
    setNewTag('');
    setIsCanvasOpen(false);
  }, [note, isOpen]);

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

    onSave({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color,
      is_pinned: isPinned,
      is_archived: isArchived,

      tags,
      reminder_date: reminderDate || undefined,
      folder,
    });
    onClose();
  }, [title, content, color, isPinned, isArchived, tags, onSave, onClose]);

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
        className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 ${colorOption.bg} border ${colorOption.border}`}
      >
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">
              {isNewNote ? 'Create Note' : 'Edit Note'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isNewNote && onTogglePin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isPinned ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                  onClick={() => {
                    setIsPinned(!isPinned);
                    onTogglePin(note.id);
                  }}
                >
                  {isPinned ? <Pin className="w-4 h-4 fill-violet-500" /> : <PinOff className="w-4 h-4" />}
                </Button>
              )}
              {!isNewNote && onToggleArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isArchived ? 'text-amber-600 bg-amber-50' : 'text-gray-500'}`}
                  onClick={() => {
                    setIsArchived(!isArchived);
                    onToggleArchive(note.id);
                  }}
                >
                  {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
                    <Palette className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value
                          ? 'border-violet-500 scale-110'
                          : 'border-transparent hover:scale-105'
                          } ${c.bg} ${c.border} border`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isCanvasOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                title="Add Sketch"
              >
                <PenTool className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isVoiceOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-500'}`}
                onClick={() => {
                  setIsVoiceOpen(!isVoiceOpen);
                  setIsCanvasOpen(false); // Close canvas if open
                }}
                title="Add Voice Note"
              >
                <Mic className="w-4 h-4" />
              </Button>

              {!isNewNote && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    const url = `${window.location.origin}/share/${note.id}`;
                    navigator.clipboard.writeText(url);
                    // Ideally show a toast here
                    alert('Link copied to clipboard!');
                    // I should use toast from sonner if available, but I don't have access to toast hook here easily without importing. 
                    // Actually App.tsx has Toaster. I can import { toast } from 'sonner'.
                  }}
                  title="Share Note"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              )}

              {!isNewNote && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    onDelete(note.id);
                    onClose();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
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
                      toast.success("Voice note recorded (Transcription added)");
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
                className="text-xl font-semibold border-0 bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-400"
              />

              <Textarea
                placeholder="Take a note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
        {!isCanvasOpen && (
          <div className="p-4 pt-0 flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog >
  );
}
