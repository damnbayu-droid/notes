import { useState, useEffect, useCallback, lazy, Suspense } from 'react';

import type { User, Note } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SearchBar } from '@/components/notes/SearchBar';
import { NotesGrid } from '@/components/notes/NotesGrid';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { EmptyState } from '@/components/notes/EmptyState';
import { SEO } from '@/components/seo/SEO';
import { SmartInfoPanel } from '@/components/info/SmartInfoPanel';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { AdRedirectTimer } from '@/components/ads/AdRedirectTimer';
import { PaymentModal } from '@/components/auth/PaymentModal';

// Lazy load heavy components
const ScannerPage = lazy(() => import('@/components/scanner/ScannerPage').then(module => ({ default: module.ScannerPage })));
const SettingsPage = lazy(() => import('./SettingsPage').then(module => ({ default: module.SettingsPage })));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const SchedulePage = lazy(() => import('@/components/schedule/SchedulePage').then(module => ({ default: module.SchedulePage })));
const BookLayout = lazy(() => import('@/components/books/BookLayout').then(module => ({ default: module.BookLayout })));
const NotificationCenter = lazy(() => import('@/components/time/NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const DiscoveryPage = lazy(() => import('@/components/notes/DiscoveryPage').then(module => ({ default: module.DiscoveryPage })));

interface DashboardProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

type ViewType = 'notes' | 'archive' | 'trash' | 'scanner' | 'settings' | 'schedule' | 'books' | 'admin' | 'discovery';

export function Dashboard({ user, onSignOut, onSignIn }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('notes');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  const {
    tier,
    hasAds,
    isPaymentModalOpen,
    setIsPaymentModalOpen
  } = useSubscription(user);

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
    shareNote,
    unshareNote,
    emptyTrash,
    notes,
  } = useNotes(user);

  // Listen for Voice Note creation events globally
  useEffect(() => {
    const handleCreateNote = async (event: CustomEvent) => {
      if (event.detail && event.detail.title && event.detail.content) {
        await createNote({
          title: event.detail.title,
          content: event.detail.content,
          folder: event.detail.folder || 'Main',
          note_type: event.detail.note_type || 'text'
        });
      }
    };
    // Listen for global view change events
    const handleChangeView = (event: CustomEvent<ViewType>) => {
      if (event.detail) {
        setCurrentView(event.detail);
      }
    };

    window.addEventListener('create-new-note', handleCreateNote as any);
    window.addEventListener('change-view', handleChangeView as any);
    return () => {
      window.removeEventListener('create-new-note', handleCreateNote as any);
      window.removeEventListener('change-view', handleChangeView as any);
    };
  }, [createNote]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleNoteClick = useCallback((note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(false); // Start unexpanded
  }, []);


  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SEO
        title={
          currentView === 'notes' ? 'Smart Notes : Secured and Encrypted' :
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
          onOpenAlarm={() => setIsNotificationCenterOpen(true)}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            currentView={currentView}
            onViewChange={(v) => {
              setCurrentView(v);
              if (v === 'trash') setActiveFolder('Trash');
              else if (v === 'archive') setActiveFolder('Archive');
              else if (v === 'notes') setActiveFolder('Main');
            }}
            user={user}
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
            subscriptionTier={tier}
            onUpgrade={() => setIsPaymentModalOpen(true)}
          />

          <main className="flex-1 overflow-auto w-full relative">
            <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>}>
              {currentView === 'notes' || currentView === 'archive' || currentView === 'trash' ? (
                // ... (Notes View Logic)
                editingNote ? (
                  <NoteEditor
                    user={user}
                    note={editingNote}
                    isOpen={!!editingNote || isEditorOpen}
                    onUpdate={async (updates) => {
                      if (editingNote) await updateNote(editingNote.id, updates);
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
                        activeFolder={activeFolder}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedTags={selectedTags}
                        availableTags={allTags}
                        onTagToggle={toggleTag}
                        onClearFilters={() => { setSearchQuery(''); setSelectedTags([]); }}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onOpenInfo={() => setIsInfoPanelOpen(true)}
                      />
                    {currentView === 'trash' && (
                      <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                           <Shield className="w-4 h-4" />
                           Notes in Trash are deleted after 7 days for your security.
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-9 px-6 shadow-lg shadow-red-500/20"
                          onClick={() => {
                             if (confirm("Permanently delete all notes in Trash? This action cannot be undone.")) {
                                emptyTrash();
                             }
                          }}
                        >
                          Empty Trash
                        </Button>
                      </div>
                    )}
                    {activeNotes.length === 0 ? (
                      <EmptyState type={currentView} onClearFilters={() => { setSearchQuery(''); setSelectedTags([]); }} />
                    ) : (
                      <NotesGrid
                        notes={currentView === 'trash' ? notes.filter((n: Note) => n.folder === 'Trash') : activeNotes}
                        pinnedNotes={currentView === 'trash' ? [] : pinnedNotes}
                        searchQuery={searchQuery}
                        onCreate={handleCreateNote}
                        viewMode={viewMode}
                        onNoteClick={handleNoteClick}
                        onTogglePin={togglePin}
                        onDelete={deleteNote}
                        onToggleArchive={toggleArchive}
                        onDuplicate={duplicateNote}
                      />
                    )}
                  </div>
                )
              ) : currentView === 'settings' ? (
                <div className="p-6">
                  <SettingsPage
                    defaultTab={settingsTab}
                    onClose={() => setCurrentView('notes')}
                  />
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
                <div className="h-full">
                  {user?.email === 'damnbayu@gmail.com' ? (
                    <AdminDashboard />
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 text-center">
                       <div className="max-w-md space-y-4">
                          <Shield className="w-12 h-12 text-red-500 mx-auto" />
                          <h2 className="text-xl font-bold">Access Restricted</h2>
                          <p className="text-gray-500">This area is reserved for system administrators. Contact damnbayu@gmail.com if you believe this is an error.</p>
                       </div>
                    </div>
                  )}
                </div>
              ) : currentView === 'discovery' ? (
                <div className="h-full">
                  <DiscoveryPage />
                </div>
              ) : null}
            </Suspense>

            <AdRedirectTimer hasAds={hasAds} onUpgrade={() => setIsPaymentModalOpen(true)} />
          </main>
        </div>
      </div>

      {/* Note Editor */}
      <NoteEditor
        user={user}
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
            const result = await createNote(noteData);
            if (result.success && result.note) {
              setEditingNote(result.note);
            }
          }
        }}
        onDelete={editingNote ? async (id) => {
          await deleteNote(id);
          setEditingNote(null);
          setIsEditorOpen(false);
        } : undefined}
        onTogglePin={editingNote ? togglePin : undefined}
        onToggleArchive={editingNote ? toggleArchive : undefined}
        onShareNote={editingNote ? shareNote : undefined}
        onUnshareNote={editingNote ? unshareNote : undefined}
      />

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />

      <Suspense fallback={null}>
        {isNotificationCenterOpen && <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />}
      </Suspense>

      <SmartInfoPanel
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
      />
    </Suspense>
  );
}
