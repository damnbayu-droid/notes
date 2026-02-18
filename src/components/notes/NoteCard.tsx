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
  ArchiveRestore,
  MoreVertical,
  Copy,
  Trash2,
  Tag,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  viewMode: 'grid' | 'list';
  onEdit: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onChangeColor: (id: string, color: Note['color']) => void;
}

export function NoteCard({
  note,
  viewMode,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onChangeColor,
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
        ${viewMode === 'grid' ? 'h-full' : 'flex flex-row items-start gap-4'}
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm'}
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

      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Title */}
        {note.title && (
          <h3 className="font-semibold text-foreground mb-2 pr-6 line-clamp-2">
            {note.title}
          </h3>
        )}

        {/* Content */}
        <p className={`text-muted-foreground text-sm whitespace-pre-wrap ${viewMode === 'grid' ? 'line-clamp-6' : 'line-clamp-2'}`}>
          {truncateContent(note.content)}
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatDistanceToNow(note.updated_at)}
          </div>

          {/* Actions */}
          <div
            className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-violet-600 hover:bg-violet-50"
              onClick={() => onTogglePin(note.id)}
              title={note.is_pinned ? 'Unpin' : 'Pin'}
              aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              {note.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-violet-600 hover:bg-violet-50"
              onClick={() => onToggleArchive(note.id)}
              title={note.is_archived ? 'Unarchive' : 'Archive'}
              aria-label={note.is_archived ? 'Unarchive note' : 'Archive note'}
            >
              {note.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </Button>

            {note.folder === 'Trash' && onRestore && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(note.id);
                }}
                title="Restore"
                aria-label="Restore note"
              >
                <ArchiveRestore className="w-4 h-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-violet-600 hover:bg-violet-50"
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onDuplicate(note.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <p className="text-xs text-gray-500 mb-2">Change color</p>
                  <div className="flex flex-wrap gap-1">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => onChangeColor(note.id, color.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${note.color === color.value
                          ? 'border-violet-500 scale-110'
                          : 'border-transparent hover:scale-105'
                          } ${color.bg} ${color.border} border`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
