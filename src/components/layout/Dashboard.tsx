import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';

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
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { AdRedirectTimer } from '@/components/ads/AdRedirectTimer';
import { PaymentModal } from '@/components/auth/PaymentModal';
import { ContactModal } from './ContactModal';

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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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

  const isCreatingRef = useRef(false);

  // Global Event Coordination
  useEffect(() => {
    const handleCreateNote = async (event: CustomEvent) => {
      if (event.detail && event.detail.title && event.detail.content && !isCreatingRef.current) {
        isCreatingRef.current = true;
        await createNote({
          title: event.detail.title,
          content: event.detail.content,
          folder: event.detail.folder || 'Main',
          note_type: event.detail.note_type || 'text'
        });
        isCreatingRef.current = false;
      }
    };
    
    const handleChangeView = (event: CustomEvent<ViewType>) => {
      if (event.detail) {
        setCurrentView(event.detail);
        if (event.detail === 'trash') setActiveFolder('Trash');
        else if (event.detail === 'archive') setActiveFolder('Archive');
        else if (event.detail === 'notes') setActiveFolder('Main');
      }
    };

    const handleOpenContact = () => setIsContactModalOpen(true);

    window.addEventListener('create-new-note', handleCreateNote as any);
    window.addEventListener('change-view', handleChangeView as any);
    window.addEventListener('open-contact-modal', handleOpenContact);
    
    return () => {
      window.removeEventListener('create-new-note', handleCreateNote as any);
      window.removeEventListener('change-view', handleChangeView as any);
      window.removeEventListener('open-contact-modal', handleOpenContact);
    };
  }, [createNote, setActiveFolder]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleNoteClick = useCallback((note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(false);
  }, []);


  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SEO
        title={
          currentView === 'notes' ? 'Dashboard : Smart Notes' :
            currentView === 'archive' ? 'Archive : Smart Notes' :
              currentView === 'trash' ? 'Trash : Secured Cleanup' :
                currentView === 'settings' ? 'Settings' :
                  currentView === 'scanner' ? 'PDF Editor' :
                    currentView === 'schedule' ? 'Schedule' :
                      currentView === 'books' ? 'Books' :
                        currentView === 'admin' ? 'System Intelligence' : 'Dashboard'
        }
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          user={user}
          tier={tier}
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
            onViewChange={setCurrentView}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setActiveFolder}
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
            userEmail={user?.email || undefined}
            userId={user?.id || undefined}
            onSignIn={onSignIn}
            reconcileIdentity={reconcileNotes}
          />

          <main className="flex-1 overflow-auto w-full relative bg-slate-50/20">
            <Suspense fallback={<div className="h-full flex items-center justify-center p-12"><div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" /></div>}>
              {currentView === 'notes' || currentView === 'archive' || currentView === 'trash' ? (
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
                      <div className="mx-6 mt-4 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                             <AlertTriangle className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-rose-900 uppercase tracking-tight">Security Retention Policy</span>
                             <span className="text-[11px] font-bold text-rose-600/70 uppercase tracking-widest leading-none">Notes in Trash are automatically deleted after 7 days</span>
                           </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-8 shadow-xl shadow-rose-200 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all"
                          onClick={() => {
                             if (confirm("DANGER: This will permanently erase ALL notes in Trash. Are you certain?")) {
                                emptyTrash();
                             }
                          }}
                        >
                          Purge Trash Permanently
                        </Button>
                      </div>
                    )}
                    {activeNotes.length === 0 ? (
                      <EmptyState type={currentView} onClearFilters={() => { setSearchQuery(''); setSelectedTags([]); }} />
                    ) : (
                      <div className="flex-1 p-6">
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
                      </div>
                    )}
                  </div>
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
                <div className="h-full p-6">
                  {user?.email === 'damnbayu@gmail.com' ? (
                    <AdminDashboard />
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 text-center">
                       <div className="max-w-md space-y-6">
                          <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                             <Shield className="w-10 h-10 text-rose-600" />
                          </div>
                          <div className="space-y-2">
                             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Access Denied</h2>
                             <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Restricted System Intelligence Access</p>
                          </div>
                          <p className="text-slate-600 font-medium text-sm leading-relaxed px-8">This terminal is restricted to authorized platform administrators. If you require access, please contact the cloud operations team.</p>
                          <Button onClick={() => setCurrentView('notes')} className="rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-xl shadow-slate-200">Return to Dashboard</Button>
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

            <AdRedirectTimer hasAds={hasAds} user={user} onUpgrade={() => setIsPaymentModalOpen(true)} />
          </main>
        </div>
      </div>

      {/* Overlays / Modals */}
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
          } else if (!isCreatingRef.current) {
            isCreatingRef.current = true;
            try {
              const result = await createNote(noteData);
              if (result.success && result.note) {
                setEditingNote(result.note);
              }
            } finally {
              isCreatingRef.current = false;
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
      
      <ContactModal 
         isOpen={isContactModalOpen} 
         onClose={() => setIsContactModalOpen(false)} 
         userEmail={user?.email} 
      />

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
