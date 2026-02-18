import type { Note } from '@/types';
import { NoteCard } from './NoteCard';
import { CreateNoteButton } from './CreateNoteButton';
import { EmptyState } from './EmptyState';
import { VirtuosoGrid } from 'react-virtuoso';
import React from 'react';

interface NotesGridProps {
  notes: Note[];
  pinnedNotes: Note[];
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onNoteClick: (note: Note) => void;
  onCreate: () => void;
  onTogglePin: (id: string) => void | Promise<any>;
  onToggleArchive: (id: string) => void | Promise<any>;
  onDuplicate: (id: string) => void | Promise<any>;
  onDelete: (id: string) => void | Promise<any>;
  onRestore?: (id: string) => void | Promise<any>;
  onChangeColor: (id: string, color: Note['color']) => void | Promise<any>;
}

export function NotesGrid({
  notes,
  pinnedNotes,
  viewMode,
  searchQuery,
  onNoteClick,
  onCreate,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onChangeColor,
}: NotesGridProps) {

  if (notes.length === 0 && pinnedNotes.length === 0 && !searchQuery) {
    return <EmptyState type="notes" onAction={onCreate} />;
  }

  const ItemContainer = React.useMemo(() => {
    return ({ children, ...props }: any) => (
      <div {...props} className="mb-4 break-inside-avoid">
        {children}
      </div>
    );
  }, []);

  const ListContainer = React.useMemo(() => {
    return React.forwardRef(({ style, children, ...props }: any, ref) => (
      <div
        ref={ref}
        {...props}
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid'
            ? 'repeat(auto-fill, minmax(280px, 1fr))'
            : '1fr',
          gap: '1rem',
          ...style,
        }}
        className="w-full"
      >
        {children}
      </div>
    ));
  }, [viewMode]);

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Create Note Button */}
      <div className={`grid gap-4 flex-shrink-0 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        <CreateNoteButton onClick={onCreate} />
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-4 flex-shrink-0">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Pinned ({pinnedNotes.length})
          </h2>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onNoteClick}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onChangeColor={onChangeColor}
                onRestore={onRestore}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Notes - Virtualized */}
      {notes.length > 0 && (
        <div className="flex-1 min-h-[400px]">
          {pinnedNotes.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              Others ({notes.length})
            </h2>
          )}

          <VirtuosoGrid
            style={{ height: '100%', width: '100%' }}
            totalCount={notes.length}
            overscan={200}
            components={{
              List: ListContainer,
              Item: ItemContainer
            }}
            itemContent={(index: number) => {
              const note = notes[index];
              return (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={onNoteClick}
                  onTogglePin={onTogglePin}
                  onToggleArchive={onToggleArchive}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onChangeColor={onChangeColor}
                  onRestore={onRestore}
                  viewMode={viewMode}
                />
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
