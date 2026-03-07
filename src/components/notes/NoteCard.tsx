import { useState } from 'react';
import type { Note } from '@/types';
import { NOTE_COLORS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pin,
  PinOff,
  Archive,
  MoreVertical,
  Copy,
  Trash2,
  Tag,
  Globe,
} from 'lucide-react';


interface NoteCardProps {
  note: Note;
  viewMode: 'grid' | 'list';
  onEdit: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({
  note,
  viewMode,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colorOption = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 cursor-pointer
        ${colorOption.bg} ${colorOption.border} border
        ${viewMode === 'grid' ? 'h-full' : 'flex flex-row items-center gap-2'}
        ${isHovered ? 'shadow-lg scale-[1.01]' : 'shadow-sm'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(note)}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute top-3 right-3 z-10">
          <Pin className="w-4 h-4 text-violet-500 fill-violet-500" />
        </div>
      )}

      {/* Public share indicator */}
      {note.is_shared && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">
            <Globe className="w-2.5 h-2.5" />
            <span>Public</span>
          </div>
        </div>
      )}

      <div className={`p-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Title */}
        {note.title && (
          <h3 className="font-bold text-foreground mb-0.5 pr-6 line-clamp-1 text-[13px]">
            {note.title}
          </h3>
        )}

        {/* Content */}
        <p className={`text-muted-foreground text-[10px] leading-relaxed whitespace-pre-wrap ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-1'}`}>
          {truncateContent(note.content, 60)}
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground"
              >
                <Tag className="w-2.5 h-2.5 mr-1" />
                {tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions Overlay */}
        <div
          className={`absolute bottom-2 right-2 flex items-center gap-0.5 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-violet-600 hover:bg-violet-50"
            onClick={() => onTogglePin(note.id)}
          >
            {note.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-violet-600 hover:bg-violet-50"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(note.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(note.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
