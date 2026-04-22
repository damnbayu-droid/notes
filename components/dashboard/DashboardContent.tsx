'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useNotes } from '@/hooks/useNotes'
import { HeaderHub } from '@/components/dashboard/HeaderHub'
import { NotesGrid } from '@/components/notes/NotesGrid'
import { GuestSyncModal } from '@/components/auth/GuestSyncModal'
import { toast } from 'sonner'
import type { Note } from '@/types'
import { useSearchParams, useRouter } from 'next/navigation'

// Heavy Components
const NoteEditor = dynamicImport(() => import('@/components/notes/NoteEditor').then(m => m.NoteEditor), { ssr: false })
const PDFMaster = dynamicImport(() => import('@/components/dashboard/scanner/PDFMaster').then(m => m.PDFMaster), { ssr: false })
const BookLayout = dynamicImport(() => import('@/components/dashboard/books/BookLayout').then(m => m.BookLayout), { ssr: false })
const ScheduleView = dynamicImport(() => import('@/components/dashboard/schedule/ScheduleView').then(m => m.ScheduleView), { ssr: false })
const SpyMaster = dynamicImport(() => import('./spy/SpyMaster'), { ssr: false })
const SystemLogs = dynamicImport(() => import('./logs/SystemLogs').then(m => m.SystemLogs), { ssr: false })

export function DashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const currentView = (searchParams.get('view') || 'notes') as any

  const { 
    notes, 
    pinnedNotes: hookPinned,
    activeNotes: hookActive,
    archivedNotes: hookArchived,
    isLoading: notesLoading, 
    activeFolder, 
    setActiveFolder, 
    createNote, 
    updateNote, 
    deleteNote,
    syncGuestNotes,
    shareNote,
    unshareNote,
    allTags,
    togglePin,
    forkNote,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    toggleArchive,
    duplicateNote,
    storageLogs,
  } = useNotes(user)
  
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Phase: Neural Payment Verification (v11.0.0)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'check') {
      toast.success('Neural Bridge: Payment Verified', {
        description: 'Your intelligence tier has been upgraded. Re-linking clusters...',
        duration: 5000
      });
      // Clean up URL
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Sync active folder with URL view
  useEffect(() => {
    if (currentView === 'archive') {
       if (activeFolder !== 'Archive') setActiveFolder('Archive')
    } else if (currentView === 'trash') {
       if (activeFolder !== 'Trash') setActiveFolder('Trash')
    } else if (currentView === 'notes' && activeFolder !== 'Main') {
       setActiveFolder('Main')
    }
  }, [currentView, activeFolder, setActiveFolder])

  // NavIsland Bridge
  useEffect(() => {
    const handleAddNode = () => handleCreateNew();
    window.addEventListener('create-new-node', handleAddNode);
    return () => window.removeEventListener('create-new-node', handleAddNode);
  }, []);

  const handleCreateNew = async () => {
    const result = await createNote({
      title: 'New Intelligence Node',
      content: '',
      folder: activeFolder === 'Trash' || activeFolder === 'Archive' ? 'Main' : activeFolder
    })
    if (result.success && result.note) {
      setEditingNote(result.note)
      setIsEditorOpen(true)
      toast.success('New node initialized')
    }
  }

  const onTagToggle = (tag: string) => {
    setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag])
  }

  const displayPinned = useMemo(() => {
    if (currentView !== 'notes') return []
    return hookPinned
  }, [hookPinned, currentView])

  const displayActive = useMemo(() => {
    if (currentView === 'archive') return hookArchived
    if (currentView === 'trash') return notes.filter(n => n.folder === 'Trash')
    return hookActive
  }, [hookActive, hookArchived, notes, currentView])

  useEffect(() => {
    if ('launchQueue' in window && (window as any).launchQueue) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files.length) return;
        
        for (const fileHandle of launchParams.files) {
          const file = await fileHandle.getFile();
          if (file.type === 'application/pdf') {
             router.push('/?view=scanner');
             setTimeout(() => {
                window.dispatchEvent(new CustomEvent('pwa-open-pdf', { detail: { file } }));
             }, 1000);
          }
        }
      });
    }
  }, [router]);

  return (
    <div className="flex-1 flex flex-col h-full relative">
       <HeaderHub 
         activeFolder={activeFolder}
         searchQuery={searchQuery}
         setSearchQuery={setSearchQuery}
         selectedTags={selectedTags}
         availableTags={allTags}
         onTagToggle={onTagToggle}
         sortBy={sortBy}
         setSortBy={setSortBy}
         viewMode={viewMode}
         setViewMode={setViewMode}
         onOpenInfo={() => window.dispatchEvent(new CustomEvent('open-info-panel'))}
       />

       <div className="flex-1 px-1 sm:px-8">
          <div className="max-w-7xl mx-auto py-8">
             {notesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                   {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="h-72 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800" />
                   ))}
                </div>
             ) : currentView === 'books' ? (
                <BookLayout />
             ) : currentView === 'schedule' ? (
                <ScheduleView />
             ) : currentView === 'scanner' ? (
                <PDFMaster />
             ) : currentView === 'spymaster' ? (
                <SpyMaster />
             ) : currentView === 'logs' ? (
                <SystemLogs logs={storageLogs} />
             ) : (
                <NotesGrid 
                  notes={displayActive}
                  pinnedNotes={displayPinned}
                  viewMode={viewMode}
                  searchQuery={searchQuery}
                  activeFolder={activeFolder}
                  onCreate={handleCreateNew}
                  onNoteClick={(n) => {
                     setEditingNote(n)
                     setIsEditorOpen(true)
                  }}
                  onTogglePin={togglePin}
                  onDelete={deleteNote}
                  onUpdateColor={(id, color) => updateNote(id, { color })}
                  onToggleArchive={toggleArchive}
                  onDuplicate={duplicateNote}
                />
             )}
          </div>
       </div>

       <NoteEditor 
         user={user}
         note={editingNote}
         isOpen={isEditorOpen}
         onClose={() => {
            setIsEditorOpen(false)
            setEditingNote(null)
         }}
         onUpdate={(updates) => {
            if (editingNote) updateNote(editingNote.id, updates)
         }}
         onDelete={async (id) => {
            await deleteNote(id)
            setIsEditorOpen(false)
            setEditingNote(null)
         }}
         onShareNote={async (id, type, permission, isDiscoverable) => {
            return shareNote(id, type, undefined, permission, isDiscoverable)
         }}
         onUnshareNote={(id) => unshareNote(id)}
         onTogglePin={(id) => togglePin(id)}
         onForkNote={async (id, content) => {
            await forkNote(id, content)
         }}
       />

       {user && (
         <GuestSyncModal onSync={() => syncGuestNotes(user.id)} />
       )}
       
       <div className="absolute inset-0 pointer-events-none border-0 sm:border-[12px] border-white/5 dark:border-slate-950/5 rounded-0 sm:rounded-[3rem] z-50 mix-blend-overlay" />
    </div>
  )
}
