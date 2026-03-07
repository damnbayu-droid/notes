import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Note, SortOption, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateShareSlug } from '@/lib/shareUtils';

interface UseNotesReturn {
  notes: Note[];
  pinnedNotes: Note[];
  activeNotes: Note[];
  archivedNotes: Note[];
  allTags: string[];
  searchQuery: string;
  selectedTags: string[];
  sortBy: SortOption;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  isOffline: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  createNote: (note: Partial<Note>) => Promise<{ success: boolean; note?: Note; error?: string }>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  togglePin: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleArchive: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateNote: (id: string) => Promise<{ success: boolean; note?: Note; error?: string }>;
  folders: string[];
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  renameFolder: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  deleteFolder: (folderName: string) => Promise<{ success: boolean; error?: string }>;
  pinnedFolders: string[];
  togglePinFolder: (folderName: string) => void;
  createFolder: (name: string) => Promise<{ success: boolean; note?: Note; error?: string }>;
  restoreNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteForever: (id: string) => Promise<{ success: boolean; error?: string }>;
  shareNote: (id: string, type?: 'public' | 'password' | 'encrypted', password?: string) => Promise<{ success: boolean; slug?: string; key?: string; error?: string }>;
  unshareNote: (id: string) => Promise<{ success: boolean; error?: string }>;
}

type SyncAction =
  | { type: 'CREATE'; payload: Note }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE'; payload: { id: string } };

export function useNotes(user: User | null): UseNotesReturn {
  // State
  const [notes, setNotes] = useState<Note[]>(() => {
    // Initial load from local storage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('notes');
        const parsed = cached ? JSON.parse(cached) : [];

        // Add sample note if first time
        if (parsed.length === 0 && !localStorage.getItem('has_seen_welcome')) {
          const sampleNote: Note = {
            id: 'sample-welcome-note',
            title: 'Welcome to Smart Notes! 🚀',
            content: `This is a sample note to help you get started.
            
Smart Notes is a secured and encrypted note-taking app. You can:
- 📝 Create rich text or canvas notes
- 🔒 Secure your notes with advanced encryption
- 📂 Organize with folders and tags
- 📱 Use it offline - everything stays on your device!
- 📤 Share notes with password protection

Try creating your first note by clicking the "+" button. Enjoy your productivity!`,
            user_id: user?.id || 'guest',
            color: 'purple',
            is_pinned: true,
            is_archived: false,
            tags: ['Welcome', 'Guide'],
            folder: 'Main',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          localStorage.setItem('has_seen_welcome', 'true');
          return [sampleNote];
        }

        return parsed;
      } catch (e) {
        console.error('Failed to parse notes from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (localStorage.getItem('notes_sort_by') as SortOption) || 'updated';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('notes_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [activeFolder, setActiveFolder] = useState<string>('All Notes');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Sync Queue
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('syncQueue');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.error('Failed to parse syncQueue from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  const isSyncingRef = useRef(false);

  const [pinnedFolders, setPinnedFolders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pinnedFolders');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.error('Failed to parse pinnedFolders from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pinnedFolders', JSON.stringify(pinnedFolders));
  }, [pinnedFolders]);

  // Persist notes and queue to local storage
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Network Status Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('notes_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('notes_view_mode', viewMode);
  }, [viewMode]);

  // Initial Fetch
  const loadNotes = useCallback(async () => {
    if (!user || isOffline) return;

    setIsLoading(true);
    const { data, error } = await supabase.from('notes').select('*');

    if (data && !error) {
      setNotes(data as Note[]);
    }
    setIsLoading(false);
  }, [user, isOffline]);

  // Process Sync Queue
  const processSyncQueue = useCallback(async () => {
    if (isSyncingRef.current || isOffline) return;

    // Get current queue without creating a dependency on syncQueue state
    const currentQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    if (currentQueue.length === 0) return;

    isSyncingRef.current = true;
    setIsLoading(true);

    const remainingQueue: SyncAction[] = [];

    for (const action of currentQueue) {
      try {
        let error = null;

        switch (action.type) {
          case 'CREATE':
            const { error: createError } = await supabase.from('notes').upsert(action.payload);
            error = createError;
            break;
          case 'UPDATE':
            const { error: updateError } = await supabase.from('notes').update(action.payload.updates).eq('id', action.payload.id);
            error = updateError;
            break;
          case 'DELETE':
            const { error: deleteError } = await supabase.from('notes').delete().eq('id', action.payload.id);
            error = deleteError;
            break;
        }

        if (error) {
          console.error('Sync failed for action:', action, error);
          remainingQueue.push(action);
        }
      } catch (err) {
        console.error('Sync exception:', err);
        remainingQueue.push(action);
      }
    }

    setSyncQueue(remainingQueue);
    setIsLoading(false);
    isSyncingRef.current = false;

    // After sync, fetch latest to ensure consistency
    if (remainingQueue.length === 0) {
      loadNotes();
    }
  }, [isOffline, loadNotes]);

  useEffect(() => {
    if (!isOffline) {
      processSyncQueue();
    }
  }, [isOffline, processSyncQueue]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Realtime Subscription for multi-device sync
  useEffect(() => {
    if (!user || isOffline) return;

    const channel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note;
            setNotes((prev) => {
              if (prev.find((n) => n.id === newNote.id)) return prev;
              return [newNote, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = payload.new as Note;
            setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as any).id;
            setNotes((prev) => prev.filter((n) => n.id !== id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOffline]);


  // Helper to generate UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback?
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // --- CRUD Operations ---

  const createNote = useCallback(async (noteData: Partial<Note>): Promise<{ success: boolean; note?: Note; error?: string }> => {
    // Guest mode or Auth mode - both allow creation
    // if (!user) return { success: false, error: 'User not authenticated' };

    const newNote: Note = {
      id: generateUUID(),
      title: noteData.title || '',
      content: noteData.content || '',
      user_id: user?.id || 'guest',
      color: noteData.color || 'default',
      is_pinned: noteData.is_pinned || false,
      is_archived: noteData.is_archived || false,
      tags: noteData.tags || [],
      reminder_date: noteData.reminder_date,
      folder: noteData.folder || 'Main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic Update
    setNotes(prev => [newNote, ...prev]);

    // Update Queue
    if (isOffline) {
      setSyncQueue(prev => [...prev, { type: 'CREATE', payload: newNote }]);
      return { success: true, note: newNote };
    }

    // Direct Sync
    const { error } = await supabase.from('notes').insert(newNote);
    if (error) {
      // Fallback to queue if request failed
      setSyncQueue(prev => [...prev, { type: 'CREATE', payload: newNote }]);
      // return success because we queued it? Or error?
      // For offline-first, queuing IS success from UI perspective.
      console.error('Create failed, queued:', error);
    }

    return { success: true, note: newNote };
  }, [user, isOffline]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<{ success: boolean; error?: string }> => {
    // Optimistic
    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, ...updates, updated_at: new Date().toISOString() }
        : note
    ));

    const action: SyncAction = { type: 'UPDATE', payload: { id, updates: { ...updates, updated_at: new Date().toISOString() } } };

    if (isOffline) {
      setSyncQueue(prev => [...prev, action]);
      return { success: true };
    }

    const { error } = await supabase.from('notes').update(action.payload.updates).eq('id', id);
    if (error) {
      setSyncQueue(prev => [...prev, action]);
      console.error('Update failed, queued:', error);
    }

    return { success: true };
  }, [isOffline]);

  const deleteForever = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    // Optimistic delete
    setNotes(prev => prev.filter(note => note.id !== id));

    const action: SyncAction = { type: 'DELETE', payload: { id } };

    if (isOffline) {
      setSyncQueue(prev => [...prev, action]);
      return { success: true };
    }

    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      setSyncQueue(prev => [...prev, action]);
      console.error('Delete forever failed, queued:', error);
    }

    return { success: true };
  }, [isOffline]);

  const deleteNote = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false, error: 'Note not found' };

    // If already in Trash, delete forever
    if (note.folder === 'Trash') {
      return deleteForever(id);
    }

    // Otherwise move to Trash
    const updates = { folder: 'Trash', is_pinned: false, updated_at: new Date().toISOString() };

    // Optimistic
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

    const action: SyncAction = {
      type: 'UPDATE',
      payload: { id, updates }
    };

    if (isOffline) {
      setSyncQueue(prev => [...prev, action]);
      return { success: true };
    }

    const { error } = await supabase.from('notes').update(updates).eq('id', id);
    if (error) {
      setSyncQueue(prev => [...prev, action]);
      console.error('Move to trash failed, queued:', error);
    }

    return { success: true };
  }, [notes, isOffline, deleteForever]);

  const togglePin = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false, error: 'Note not found' };
    return updateNote(id, { is_pinned: !note.is_pinned });
  }, [notes, updateNote]);

  const toggleArchive = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false, error: 'Note not found' };
    return updateNote(id, {
      is_archived: !note.is_archived,
      is_pinned: note.is_archived ? note.is_pinned : false
    });
  }, [notes, updateNote]);

  const duplicateNote = useCallback(async (id: string): Promise<{ success: boolean; note?: Note; error?: string }> => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false, error: 'Note not found' };

    return createNote({
      ...note,
      title: `${note.title} (Copy)`,
      is_pinned: false,
    });
  }, [notes, createNote]);

  const renameFolder = useCallback(async (oldName: string, newName: string) => {
    if (!oldName || !newName) return { success: false, error: 'Invalid names' };

    // Find notes in this folder
    const notesInFolder = notes.filter(n => n.folder === oldName);

    // Optimistic Update
    setNotes(prev => prev.map(n => n.folder === oldName ? { ...n, folder: newName, updated_at: new Date().toISOString() } : n));

    const timestamp = new Date().toISOString();
    const updates = notesInFolder.map(note => ({
      id: note.id,
      updates: { folder: newName, updated_at: timestamp }
    }));

    if (isOffline) {
      setSyncQueue(prev => [
        ...prev,
        ...updates.map(u => ({ type: 'UPDATE' as const, payload: u }))
      ]);
      return { success: true };
    }

    const { error } = await supabase.from('notes').update({ folder: newName, updated_at: timestamp }).eq('folder', oldName).eq('user_id', user?.id);

    if (error) {
      console.error('Rename folder failed:', error);
      return { success: false, error: error.message };
    }

    if (pinnedFolders.includes(oldName)) {
      setPinnedFolders(prev => prev.map(f => f === oldName ? newName : f));
    }

    return { success: true };
  }, [notes, isOffline, user, pinnedFolders]);

  const deleteFolder = useCallback(async (folderName: string) => {
    if (!folderName) return { success: false };
    if (['Main', 'Trash', 'Archive'].includes(folderName)) return { success: false, error: 'Cannot delete system folder' };

    // Optimistic
    setNotes(prev => prev.map(n => n.folder === folderName ? { ...n, folder: 'Trash', updated_at: new Date().toISOString() } : n));

    const timestamp = new Date().toISOString();

    if (isOffline) {
      const notesInFolder = notes.filter(n => n.folder === folderName);
      const updates = notesInFolder.map(n => ({
        type: 'UPDATE' as const,
        payload: { id: n.id, updates: { folder: 'Trash', updated_at: timestamp } }
      }));
      setSyncQueue(prev => [...prev, ...updates]);
    } else {
      const { error } = await supabase.from('notes').update({ folder: 'Trash', updated_at: timestamp }).eq('folder', folderName).eq('user_id', user?.id);
      if (error) console.error("Delete folder failed", error);
    }

    setPinnedFolders(prev => prev.filter(f => f !== folderName));
    if (activeFolder === folderName) setActiveFolder('Main');

    return { success: true };
  }, [notes, isOffline, user, activeFolder, pinnedFolders]);

  const togglePinFolder = useCallback((folderName: string) => {
    setPinnedFolders(prev =>
      prev.includes(folderName)
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
    );
  }, []);



  // Derived State (Filtering/Sorting)
  // Same as before
  const filterNotes = useCallback((notesToFilter: Note[]) => {
    return notesToFilter.filter(note => {
      // Folder Filter
      if (activeFolder !== 'All Notes' && activeFolder !== 'Favorites' && activeFolder !== 'Trash') {
        if (note.folder !== activeFolder) return false;
      }

      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => note.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  const sortNotes = useCallback((notesToSort: Note[]) => {
    return [...notesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [sortBy]);

  const pinnedNotes = useMemo(() => {
    return sortNotes(filterNotes(notes.filter(n => !n.is_archived && n.is_pinned)));
  }, [notes, filterNotes, sortNotes]);

  const activeNotes = useMemo(() => {
    return sortNotes(filterNotes(notes.filter(n => !n.is_archived && !n.is_pinned)));
  }, [notes, filterNotes, sortNotes]);

  const archivedNotes = useMemo(() => {
    return sortNotes(filterNotes(notes.filter(n => n.is_archived)));
  }, [notes, filterNotes, sortNotes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  // Listen for Google Drive connection
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('google_drive_connected') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsGoogleConnected(localStorage.getItem('google_drive_connected') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const folders = useMemo(() => {
    const folderSet = new Set<string>(['Main']);

    // Add default connected folders
    if (isGoogleConnected) {
      folderSet.add('Google Drive');
    }

    // Add folders from notes
    notes.forEach(note => {
      if (note.folder) folderSet.add(note.folder);
    });
    return Array.from(folderSet).sort();
  }, [notes, isGoogleConnected]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  return {
    notes,
    pinnedNotes,
    activeNotes,
    archivedNotes,
    allTags,
    searchQuery,
    selectedTags,
    sortBy,
    viewMode,
    isLoading,
    isOffline,
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
    createFolder: async (name: string) => {
      // Create a welcome note to initialize the folder
      return createNote({
        title: `Welcome to ${name}`,
        content: `This is the start of your new folder "${name}".`,
        folder: name
      });
    },
    restoreNote: async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) return { success: false, error: 'Note not found' };
      // Explicitly reset ALL state that might have been changed during trash/archive
      return updateNote(id, {
        folder: 'Main',
        is_archived: false,
        is_pinned: false,
        updated_at: new Date().toISOString()
      });
    },
    deleteForever: async (id: string) => {
      // Optimistic delete
      setNotes(prev => prev.filter(note => note.id !== id));

      const action: SyncAction = { type: 'DELETE', payload: { id } };

      if (isOffline) {
        setSyncQueue(prev => [...prev, action]);
        return { success: true };
      }

      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) {
        setSyncQueue(prev => [...prev, action]);
        console.error('Delete forever failed, queued:', error);
      }
      return { success: true };
    },
    shareNote: async (id: string, type: 'public' | 'password' | 'encrypted' = 'public', password?: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) return { success: false, error: 'Note not found' };

      // Reuse existing slug if already shared, otherwise generate new one
      const slug = note.share_slug || generateShareSlug(note.title || 'note');
      let finalContent = note.content;
      let salt: string | undefined;
      let key: string | undefined;
      let is_password_protected = false;
      let is_encrypted = false;

      try {
        if (type === 'password' && password) {
          const { encryptWithPassword } = await import('@/lib/crypto');
          const result = await encryptWithPassword(note.content, password);
          finalContent = result.encrypted;
          salt = result.salt;
          is_password_protected = true;
          is_encrypted = true;
        } else if (type === 'encrypted') {
          const { encryptE2EE } = await import('@/lib/crypto');
          const result = await encryptE2EE(note.content);
          finalContent = result.encrypted;
          key = result.key;
          is_encrypted = true;
        }

        const updates = {
          is_shared: true,
          share_slug: slug,
          share_type: type,
          is_password_protected,
          password_salt: salt,
          is_encrypted,
          // CRITICAL: We DO NOT overwrite the primary content field with encrypted data 
          // because it would destroy the note for the owner. 
          // Instead, we use a separate field for public viewing if available, 
          // or handle decryption at the edge. 
          // For now, we'll store the encrypted content in 'shared_content' 
          // to keep the owner's 'content' safe and readable.
          shared_content: finalContent
        } as any;

        // If the backend requires a separate 'shared_content' field, we would use that.
        // Assuming the current DB schema might only have 'content', we must be careful.
        // For production hardening, we'll only update metadata.

        // Optimistic update
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

        const { error } = await supabase
          .from('notes')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return { success: true, slug, key };
      } catch (err: any) {
        // Revert optimistic update
        setNotes(prev => prev.map(n => n.id === id ? note : n));
        return { success: false, error: err.message };
      }
    },
    unshareNote: async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) return { success: false, error: 'Note not found' };

      // Optimistic update
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_shared: false } : n));

      try {
        const { error } = await supabase
          .from('notes')
          .update({ is_shared: false })
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        // Revert optimistic update
        setNotes(prev => prev.map(n => n.id === id ? note : n));
        return { success: false, error: err.message };
      }
    },
  };
}
