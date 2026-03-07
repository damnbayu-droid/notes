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
            ? 'repeat(auto-fill, minmax(140px, 1fr))'
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
    <div className="space-y-8 h-full flex flex-col pt-2 px-1">
      {/* Create Note Button - Hidden on Mobile (moved to SearchBar) */}
      <div className={`hidden sm:grid gap-4 flex-shrink-0 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        <CreateNoteButton onClick={onCreate} />
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-4 flex-shrink-0">
          <h2 className="text-[11px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Pinned ({pinnedNotes.length})
          </h2>
          <div
            className="px-2"
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : '1fr',
              gap: '1rem'
            }}
          >
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
            <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              Recent ({notes.length})
            </h2>
          )}

          <VirtuosoGrid
            key={viewMode}
            style={{ height: '100%', width: '100%' }}
            totalCount={notes.length}
            overscan={200}
            className="px-2"
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
