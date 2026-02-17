import { useState } from 'react';
import type { User, Note } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SearchBar } from '@/components/notes/SearchBar';
import { NotesGrid } from '@/components/notes/NotesGrid';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { EmptyState } from '@/components/notes/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { ScannerPage } from '@/components/scanner/ScannerPage';
import { AdPopup } from '@/components/ads/AdPopup';

interface DashboardProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

type ViewType = 'notes' | 'archive' | 'trash' | 'scanner';

export function Dashboard({ user, onSignOut, onSignIn }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('notes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    pinnedNotes,
    activeNotes,
    archivedNotes,
    allTags,
    searchQuery,
    selectedTags,
    sortBy,
    viewMode,
    setSearchQuery,
    setSelectedTags,
    toggleTag,
    setSortBy,
    setViewMode,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    duplicateNote,
    folders,
    activeFolder,
    setActiveFolder,
  } = useNotes(user);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await createNote(noteData);
    }
  };

  const handleChangeColor = async (id: string, color: Note['color']) => {
    await updateNote(id, { color });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const displayNotes = currentView === 'archive' ? archivedNotes : activeNotes;
  const displayPinnedNotes = currentView === 'archive' ? [] : pinnedNotes;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onSignOut={onSignOut}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignIn={onSignIn}
      />

      <div className="flex">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onCreateNote={handleCreateNote}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          folders={folders}
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
        />

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
            {/* Search and Filters */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTags={selectedTags}
              availableTags={allTags}
              onTagToggle={toggleTag}
              onClearFilters={clearFilters}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Content */}
            {currentView === 'scanner' ? (
              <ScannerPage />
            ) : currentView === 'archive' && archivedNotes.length === 0 ? (
              <EmptyState type="archive" />
            ) : (
              <NotesGrid
                notes={displayNotes}
                pinnedNotes={displayPinnedNotes}
                viewMode={viewMode}
                searchQuery={searchQuery}
                onEdit={handleEditNote}
                onCreate={handleCreateNote}
                onTogglePin={togglePin}
                onToggleArchive={toggleArchive}
                onDuplicate={duplicateNote}
                onDelete={deleteNote}
                onChangeColor={handleChangeColor}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <Button
        onClick={handleCreateNote}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-300 lg:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Note Editor */}
      <NoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        onDelete={editingNote ? deleteNote : undefined}
        onTogglePin={editingNote ? togglePin : undefined}
        onToggleArchive={editingNote ? toggleArchive : undefined}
      />


      {user && (
        <ChangePasswordDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      <AdPopup />
    </div>
  );
}
