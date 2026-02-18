import { useState, lazy, Suspense } from 'react';

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
import { AdOverlay } from '@/components/ads/AdOverlay';
import { SEO } from '@/components/seo/SEO';

// Lazy load heavy components
const ScannerPage = lazy(() => import('@/components/scanner/ScannerPage').then(module => ({ default: module.ScannerPage })));
const SettingsPage = lazy(() => import('./SettingsPage').then(module => ({ default: module.SettingsPage })));
const AdminUserList = lazy(() => import('@/components/admin/AdminUserList').then(module => ({ default: module.AdminUserList })));
const SchedulePage = lazy(() => import('@/components/schedule/SchedulePage').then(module => ({ default: module.SchedulePage })));
const BookLayout = lazy(() => import('@/components/books/BookLayout').then(module => ({ default: module.BookLayout })));
const AlarmDialog = lazy(() => import('@/components/time/AlarmDialog').then(module => ({ default: module.AlarmDialog })));

interface DashboardProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

type ViewType = 'notes' | 'archive' | 'trash' | 'scanner' | 'settings' | 'schedule' | 'books' | 'admin';

export function Dashboard({ user, onSignOut, onSignIn }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('notes');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);

  const {
    pinnedNotes,
    activeNotes,
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
    renameFolder,
    deleteFolder,
    pinnedFolders,
    togglePinFolder,
    createFolder,
    restoreNote,

  } = useNotes(user);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };



  /* 
  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await createNote(noteData);
    }
  };
  */

  const handleChangeColor = async (id: string, color: Note['color']) => {
    await updateNote(id, { color });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SEO
        title={
          currentView === 'notes' ? 'Notes' :
            currentView === 'archive' ? 'Archive' :
              currentView === 'trash' ? 'Trash' :
                currentView === 'settings' ? 'Settings' :
                  currentView === 'scanner' ? 'Scanner' :
                    currentView === 'schedule' ? 'Schedule' :
                      currentView === 'books' ? 'Books' :
                        currentView === 'admin' ? 'Admin Panel' : 'Dashboard'
        }
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          user={user}
          onSignOut={onSignOut}
          onSignIn={onSignIn}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={(tab) => {
            setSettingsTab(tab || 'profile');
            setCurrentView('settings');
          }}
          onOpenAlarm={() => setIsAlarmOpen(true)}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            onCreateNote={async () => {
              await createNote({
                title: 'New Note',
                content: '',
                folder: activeFolder === 'Trash' || activeFolder === 'Google Drive' ? 'Main' : activeFolder
              });
              // Note creation events are handled by the list/editor
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setActiveFolder}
            onOpenSettings={() => setCurrentView('settings')}
            onAddFolder={() => {
              const name = prompt("New Folder Name:");
              if (name) createFolder(name);
            }}
            renameFolder={renameFolder}
            deleteFolder={deleteFolder}
            pinnedFolders={pinnedFolders}
            togglePinFolder={togglePinFolder}
          />

          <main className="flex-1 overflow-auto w-full relative">
            <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>}>
              {currentView === 'notes' || currentView === 'archive' || currentView === 'trash' ? (
                // ... (Notes View Logic)
                editingNote ? (
                  <NoteEditor
                    note={editingNote}
                    isOpen={!!editingNote || isEditorOpen}
                    onUpdate={(updates) => {
                      if (editingNote) updateNote(editingNote.id, updates);
                    }}
                    onClose={() => {
                      setEditingNote(null);
                      setIsEditorOpen(false);
                    }}
                    isExpanded={isEditorOpen}
                    onToggleExpand={() => setIsEditorOpen(!isEditorOpen)}
                    onDelete={() => {
                      deleteNote(editingNote.id);
                      setEditingNote(null);
                      setIsEditorOpen(false);
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col">
                    <SearchBar
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedTags={selectedTags}
                      availableTags={allTags}
                      onTagToggle={toggleTag}
                      onClearFilters={clearFilters}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                    />
                    {currentView === 'trash' && (
                      <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-600 text-sm flex items-center justify-center">
                        Notes in Trash are deleted after 30 days.
                      </div>
                    )}
                    {activeNotes.length === 0 ? (
                      <EmptyState type={currentView} onClearFilters={() => { setSearchQuery(''); setSelectedTags([]); }} />
                    ) : (
                      <NotesGrid
                        notes={activeNotes}
                        pinnedNotes={pinnedNotes}
                        searchQuery={searchQuery}
                        onCreate={handleCreateNote}
                        viewMode={viewMode}
                        onNoteClick={(note) => {
                          setEditingNote(note);
                          setIsEditorOpen(false); // Start unexpanded
                        }}
                        onTogglePin={togglePin}
                        onDelete={deleteNote}
                        onRestore={restoreNote}

                        onToggleArchive={toggleArchive}
                        onDuplicate={duplicateNote}
                        onChangeColor={handleChangeColor}
                      />
                    )}
                  </div>
                )
              ) : currentView === 'settings' ? (
                <div className="p-6">
                  <SettingsPage defaultTab={settingsTab} />
                </div>
              ) : currentView === 'scanner' ? (
                <div className="h-full">
                  <ScannerPage />
                </div>
              ) : currentView === 'schedule' ? (
                <div className="h-full">
                  <SchedulePage />
                </div>
              ) : currentView === 'books' ? (
                <div className="h-full bg-stone-50">
                  <BookLayout />
                </div>
              ) : currentView === 'admin' ? (
                <div className="p-6">
                  <AdminUserList />
                </div>
              ) : null}
            </Suspense>

            <AdOverlay />
          </main>
        </div>
      </div>
      {/* Floating Action Button for Mobile */}
      {['notes', 'archive'].includes(currentView) && !editingNote && (
        <Button
          onClick={handleCreateNote}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-300 lg:hidden"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Note Editor */}
      <NoteEditor
        note={editingNote}
        isOpen={!!editingNote || isEditorOpen}
        onClose={() => {
          setEditingNote(null);
          setIsEditorOpen(false);
        }}
        onUpdate={async (noteData) => {
          if (editingNote) {
            await updateNote(editingNote.id, noteData);
          } else {
            await createNote(noteData);
          }
          setEditingNote(null);
          setIsEditorOpen(false);
        }}
        onDelete={editingNote ? async (id) => {
          await deleteNote(id);
          setEditingNote(null);
          setIsEditorOpen(false);
        } : undefined}
        onTogglePin={editingNote ? togglePin : undefined}
        onToggleArchive={editingNote ? toggleArchive : undefined}
      />

      <AdOverlay />

      <Suspense fallback={null}>
        {isAlarmOpen && <AlarmDialog isOpen={isAlarmOpen} onClose={() => setIsAlarmOpen(false)} />}
      </Suspense>
    </Suspense>
  );
}
