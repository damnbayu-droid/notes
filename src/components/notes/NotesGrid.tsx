import type { Note } from '@/types';
import { NoteCard } from './NoteCard';
import { CreateNoteButton } from './CreateNoteButton';
import { EmptyState } from './EmptyState';

interface NotesGridProps {
  notes: Note[];
  pinnedNotes: Note[];
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onEdit: (note: Note) => void;
  onCreate: () => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeColor: (id: string, color: Note['color']) => void;
}

export function NotesGrid({
  notes,
  pinnedNotes,
  viewMode,
  searchQuery,
  onEdit,
  onCreate,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onChangeColor,
}: NotesGridProps) {
  const hasNotes = pinnedNotes.length > 0 || notes.length > 0;
  const isSearching = searchQuery.length > 0;

  if (!hasNotes) {
    return (
      <div className="space-y-8">
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          <CreateNoteButton onClick={onCreate} />
        </div>
        <EmptyState 
          type={isSearching ? 'search' : 'notes'} 
          onAction={onCreate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Note Button - Only show in grid mode */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        <CreateNoteButton onClick={onCreate} />
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Pinned ({pinnedNotes.length})
          </h2>
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onEdit={onEdit}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onChangeColor={onChangeColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Notes */}
      {notes.length > 0 && (
        <div className="space-y-4">
          {pinnedNotes.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              Others ({notes.length})
            </h2>
          )}
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onEdit={onEdit}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onChangeColor={onChangeColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
