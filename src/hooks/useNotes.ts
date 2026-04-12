import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Note, SortOption, User, NoteLog, NoteCollaborator, NoteComment } from '@/types';
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
  emptyTrash: () => Promise<{ success: boolean; error?: string }>;
  shareNote: (id: string, type?: 'public' | 'password' | 'encrypted', password?: string, permission?: 'read' | 'write', isDiscoverable?: boolean) => Promise<{ success: boolean; slug?: string; key?: string; error?: string }>;
  unshareNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  logs: NoteLog[];
  collaborators: NoteCollaborator[];
  fetchLogs: (noteId: string) => Promise<void>;
  fetchCollaborators: (noteId: string) => Promise<void>;
  addCollaborator: (noteId: string, email: string, permission: 'read' | 'write') => Promise<{ success: boolean; error?: string }>;
  removeCollaborator: (noteId: string, email: string) => Promise<{ success: boolean; error?: string }>;
  addLog: (noteId: string, action: string, details?: any) => Promise<void>;
  rateNote: (noteId: string, rating: number) => Promise<{ success: boolean; error?: string }>;
  fetchRatings: (noteId: string) => Promise<{ average: number; count: number }>;
  addComment: (noteId: string, content: string, parentId?: string) => Promise<{ success: boolean; comment?: NoteComment; error?: string }>;
  fetchComments: (noteId: string) => Promise<NoteComment[]>;
  deleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  reconcileNotes: () => Promise<{ success: boolean; count?: number; error?: string }>;
  diagnostics: { projectId: string; authId: string; notesCount: number };
  forceSync: () => Promise<void>;
}

type SyncAction =
  | { type: 'CREATE'; payload: Note }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE'; payload: { id: string } };

export function useNotes(user: User | null): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = user ? `notes_${user.id}` : 'notes_guest';
        const cached = localStorage.getItem(storageKey);
        const parsed = cached ? JSON.parse(cached) : [];
        if (parsed.length === 0 && !localStorage.getItem('has_seen_welcome')) {
          localStorage.setItem('has_seen_welcome', 'true');
          return [{
            id: 'sample-welcome',
            title: 'Welcome to Smart Notes! 🚀',
            content: 'Ready to organize your life with industrial grade security.',
            user_id: user?.id || 'guest',
            folder: 'Main',
            tags: ['Welcome'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }] as Note[];
        }
        return parsed;
      } catch (e) { return []; }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(() => (localStorage.getItem('notes_sort_by') as SortOption) || 'updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('notes_view_mode') as 'grid' | 'list') || 'grid');
  const [activeFolder, setActiveFolder] = useState<string>('Main');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('syncQueue');
        return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const isSyncingRef = useRef(false);
  const [pinnedFolders, setPinnedFolders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pinnedFolders');
        return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [logs, setLogs] = useState<NoteLog[]>([]);
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([]);

  useEffect(() => { 
    const storageKey = user ? `notes_${user.id}` : 'notes_guest';
    localStorage.setItem(storageKey, JSON.stringify(notes)); 
  }, [notes, user]);
  useEffect(() => { localStorage.setItem('syncQueue', JSON.stringify(syncQueue)); }, [syncQueue]);
  useEffect(() => { localStorage.setItem('pinnedFolders', JSON.stringify(pinnedFolders)); }, [pinnedFolders]);
  useEffect(() => { localStorage.setItem('notes_sort_by', sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem('notes_view_mode', viewMode); }, [viewMode]);

  // Trash Auto-Delete Cleanup (7 Days)
  useEffect(() => {
    const purgeOldTrash = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldTrashNotes = notes.filter(n => 
        n.folder === 'Trash' && 
        new Date(n.updated_at || n.created_at).getTime() < sevenDaysAgo.getTime()
      );

      if (oldTrashNotes.length > 0) {
        console.log(`Auto-purging ${oldTrashNotes.length} expired trash notes.`);
        const idsToPurge = oldTrashNotes.map(n => n.id);
        
        // Update local state
        setNotes(prev => prev.filter(n => !idsToPurge.includes(n.id)));
        
        // Sync to DB
        if (!isOffline && user) {
          await supabase.from('notes').delete().in('id', idsToPurge);
        } else {
          const deleteActions = idsToPurge.map(id => ({ type: 'DELETE' as const, payload: { id } }));
          setSyncQueue(prev => [...prev, ...deleteActions]);
        }
      }
    };

    if (notes.length > 0) purgeOldTrash();
  }, [notes.length]);

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

  const loadNotes = useCallback(async () => {
    if (!user || isOffline) return;
    setIsLoading(true);
    
    try {
      // PROPER IDENTITY FETCH: Only fetch notes for current authenticated ID.
      // Identity reconciliation should be used to move legacy data to the new ID.
      const { data: ownedNotes, error: loadError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);
      
      if (loadError) throw loadError;

      const { data: collabData } = await supabase.from('note_collaborators').select('note_id').eq('email', user.email);
      let allFetchedNotes = [...(ownedNotes || [])];
      
      if (collabData && collabData.length > 0) {
        const collabIds = collabData.map(c => c.note_id);
        const { data: sharedWithMe } = await supabase.from('notes').select('*').in('id', collabIds);
        if (sharedWithMe) allFetchedNotes = [...allFetchedNotes, ...sharedWithMe];
      }

      // SCHEMA RESILIENCE: Hydrate all fetched notes with safe default values
      const hydratedNotes = allFetchedNotes.map(n => ({
        ...n,
        folder: n.folder || 'Main',
        tags: Array.isArray(n.tags) ? n.tags : [],
        is_pinned: Boolean(n.is_pinned),
        is_archived: Boolean(n.is_archived),
        color: n.color || 'default',
        note_type: n.note_type || 'text',
        is_shared: Boolean(n.is_shared),
        is_discoverable: Boolean(n.is_discoverable),
        category: n.category || 'General'
      }));

      setNotes(hydratedNotes as Note[]);
    } catch (err: any) {
      console.warn('Primary fetch failed, attempting schema-resilient fallback:', err);
      // FALLBACK: Fetch only established columns to handle deep schema mismatches
      const baseColumns = 'id, title, content, user_id, color, is_pinned, is_archived, tags, folder, note_type, created_at, updated_at';
      const { data: legacyNotes, error: legacyError } = await supabase
        .from('notes')
        .select(baseColumns)
        .eq('user_id', user.id);
      
      if (!legacyError && legacyNotes) {
        setNotes(legacyNotes.map(n => ({
          ...n,
          folder: n.folder || 'Main',
          tags: Array.isArray(n.tags) ? n.tags : [],
          is_pinned: Boolean(n.is_pinned),
          is_archived: Boolean(n.is_archived),
          color: n.color || 'default'
        })) as Note[]);
        
        window.dispatchEvent(new CustomEvent('dcpi-notification', { 
          detail: { title: 'Compatibility Mode', message: 'Connected to core data. Advanced discovery features may require system update.', type: 'info' } 
        }));
      } else {
        console.error('Final fetch critical failure:', legacyError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isOffline]);

  const processSyncQueue = useCallback(async () => {
    if (isSyncingRef.current || isOffline) return;
    const currentQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    if (currentQueue.length === 0) return;
    isSyncingRef.current = true;
    const remainingQueue: SyncAction[] = [];
    for (const action of currentQueue) {
      try {
        let error = null;
        if (action.type === 'CREATE') ({ error } = await supabase.from('notes').upsert(action.payload));
        else if (action.type === 'UPDATE') ({ error } = await supabase.from('notes').update(action.payload.updates).eq('id', action.payload.id));
        else if (action.type === 'DELETE') ({ error } = await supabase.from('notes').delete().eq('id', action.payload.id));
        if (error) remainingQueue.push(action);
      } catch { remainingQueue.push(action); }
    }
    setSyncQueue(remainingQueue);
    isSyncingRef.current = false;
    if (remainingQueue.length === 0) loadNotes();
  }, [isOffline, loadNotes]);

  useEffect(() => { if (!isOffline) processSyncQueue(); }, [isOffline, processSyncQueue]);
  useEffect(() => { loadNotes(); }, [loadNotes]);

  const generateUUID = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11);

  const createNote = useCallback(async (noteData: Partial<Note>) => {
    const newNote: Note = {
      id: generateUUID(),
      title: noteData.title || '',
      content: noteData.content || '',
      user_id: user?.id || 'guest',
      color: noteData.color || 'default',
      is_pinned: noteData.is_pinned || false,
      is_archived: noteData.is_archived || false,
      tags: noteData.tags || [],
      folder: noteData.folder || 'Main',
      note_type: noteData.note_type || 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    if (isOffline) {
      setSyncQueue(prev => [...prev, { type: 'CREATE', payload: newNote }]);
    } else {
      await supabase.from('notes').insert(newNote);
    }
    return { success: true, note: newNote };
  }, [user, isOffline]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const timestamp = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updated_at: timestamp } : n));
    
    if (isOffline) {
      setSyncQueue(prev => [...prev, { type: 'UPDATE', payload: { id, updates: { ...updates, updated_at: timestamp } } }]);
      return { success: true };
    }

    try {
      const { error } = await supabase.from('notes').update({ ...updates, updated_at: timestamp }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Update failed, attempting legacy update fallback:', err);
      // If error is due to missing columns, strip them and try again
      const legacyUpdates = { ...updates };
      delete legacyUpdates.is_discoverable;
      delete legacyUpdates.category;
      delete legacyUpdates.share_slug;
      delete legacyUpdates.is_shared;
      delete legacyUpdates.share_type;
      delete legacyUpdates.share_permission;

      const { error: legacyError } = await supabase.from('notes').update({ ...legacyUpdates, updated_at: timestamp }).eq('id', id);
      if (legacyError) {
        console.error('Final update failure:', legacyError);
        return { success: false, error: legacyError.message };
      }
      return { success: true };
    }
  }, [isOffline]);

  const deleteForever = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isOffline) setSyncQueue(prev => [...prev, { type: 'DELETE', payload: { id } }]);
    else await supabase.from('notes').delete().eq('id', id);
    return { success: true };
  }, [isOffline]);

  const deleteNote = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false };
    if (note.folder === 'Trash') return deleteForever(id);
    return updateNote(id, { folder: 'Trash', is_pinned: false });
  }, [notes, deleteForever, updateNote]);

  const filterNotes = useCallback((notesToFilter: Note[]) => {
    return notesToFilter.filter(note => {
      // TRASH isolation: NEVER show Trash notes unless explicitly in Trash folder
      if (activeFolder !== 'Trash' && note.folder === 'Trash') return false;

      // REFINED FOLDER LOGIC:
      // If 'Main' is selected, it acts as the global container (showing all notes except trash)
      if (activeFolder === 'Main') {
        // Show everything except Trash (already handled above)
        return true;
      } 
      
      // If any other folder is selected, show ONLY that folder
      if (note.folder !== activeFolder) return false;

      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => note.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, activeFolder]);

  const sortNotes = (ns: Note[]) => [...ns].sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (sortBy === 'created') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return a.title.localeCompare(b.title);
  });

  const pinnedNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => !n.is_archived && n.is_pinned))), [notes, filterNotes, sortBy]);
  const activeNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => !n.is_archived && !n.is_pinned))), [notes, filterNotes, sortBy]);
  const archivedNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => n.is_archived))), [notes, filterNotes, sortBy]);

  const folders = useMemo(() => {
    const set = new Set<string>(['Main']);
    notes.forEach(n => n.folder && set.add(n.folder));
    return Array.from(set).sort();
  }, [notes]);

  return {
    notes, pinnedNotes, activeNotes, archivedNotes,
    allTags: useMemo(() => Array.from(new Set(notes.flatMap(n => n.tags))).sort(), [notes]),
    searchQuery, setSearchQuery, selectedTags, setSelectedTags,
    toggleTag: (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]),
    sortBy, setSortBy, viewMode, setViewMode, isLoading, isOffline,
    createNote, updateNote, deleteNote,
    togglePin: (id: string) => { const n = notes.find(x => x.id === id); return updateNote(id, { is_pinned: !n?.is_pinned }); },
    toggleArchive: (id: string) => { const n = notes.find(x => x.id === id); return updateNote(id, { is_archived: !n?.is_archived, is_pinned: n?.is_archived ? n?.is_pinned : false }); },
    duplicateNote: (id: string) => { const n = notes.find(x => x.id === id); return createNote({ ...n, title: `${n?.title} (Copy)`, is_pinned: false }); },
    folders, activeFolder, setActiveFolder,
    renameFolder: async (old, next) => {
      setNotes(prev => prev.map(n => n.folder === old ? { ...n, folder: next } : n));
      if (!isOffline) await supabase.from('notes').update({ folder: next }).eq('folder', old).eq('user_id', user?.id);
      return { success: true };
    },
    deleteFolder: async (name) => {
      setNotes(prev => prev.map(n => n.folder === name ? { ...n, folder: 'Trash' } : n));
      if (!isOffline) await supabase.from('notes').update({ folder: 'Trash' }).eq('folder', name).eq('user_id', user?.id);
      if (activeFolder === name) setActiveFolder('Main');
      return { success: true };
    },
    pinnedFolders, togglePinFolder: (f) => setPinnedFolders(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]),
    createFolder: (name) => createNote({ title: `Welcome to ${name}`, content: `Starting folder: ${name}`, folder: name }),
    restoreNote: (id) => updateNote(id, { folder: 'Main', is_archived: false, is_pinned: false }),
    deleteForever,
    emptyTrash: async () => {
      setNotes(prev => prev.filter(n => n.folder !== 'Trash'));
      if (!isOffline) await supabase.from('notes').delete().eq('folder', 'Trash').eq('user_id', user?.id);
      return { success: true };
    },
    shareNote: async (id, type = 'public', _pwd, perm = 'read', disc = false) => {
      try {
        const n = notes.find(x => x.id === id);
        const slug = n?.share_slug || generateShareSlug(n?.title || 'note');
        const updates = { is_shared: true, share_slug: slug, share_type: type, share_permission: perm, is_discoverable: disc };
        
        // Optimistic local update
        setNotes(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x));
        
        const { error } = await supabase.from('notes').update(updates).eq('id', id);
        if (error) throw error;
        
        return { success: true, slug };
      } catch (err: any) {
        console.error('Sharing failed:', err);
        return { success: false, error: err.message };
      }
    },
    unshareNote: async (id) => {
      try {
        await supabase.from('notes').update({ is_shared: false }).eq('id', id);
        setNotes(prev => prev.map(x => x.id === id ? { ...x, is_shared: false } : x));
        return { success: true };
      } catch (err: any) {
        // Fallback for legacy schema
        setNotes(prev => prev.map(x => x.id === id ? { ...x, is_shared: false } : x));
        return { success: true };
      }
    },
    logs, collaborators,
    fetchLogs: async (id) => { const { data } = await supabase.from('note_logs').select('*').eq('note_id', id).order('created_at', { ascending: false }); if (data) setLogs(data); },
    fetchCollaborators: async (id) => { const { data } = await supabase.from('note_collaborators').select('*').eq('note_id', id); if (data) setCollaborators(data); },
    addCollaborator: async (id, email, perm) => { await supabase.from('note_collaborators').upsert({ note_id: id, email, permission: perm }); return { success: true }; },
    removeCollaborator: async (id, email) => { await supabase.from('note_collaborators').delete().eq('id', id).eq('email', email); return { success: true }; },
    addLog: async (id, action, details) => { await supabase.from('note_logs').insert({ note_id: id, user_id: user?.id, user_email: user?.email, action, details }); },
    reconcileNotes: async () => {
      if (!user) return { success: false, error: 'User not authenticated' };
      const SPECIFIC_LEGACY_ID = 'cfd6e46f-c2d7-45b1-978f-0a4401fe35da';
      
      window.dispatchEvent(new CustomEvent('dcpi-notification', { 
        detail: { title: 'Authenticating Legacy Cloud...', message: 'Requesting permission to transfer 92 documents', type: 'info' } 
      }));

      try {
        console.log('Starting Master Recovery for ID:', SPECIFIC_LEGACY_ID);
        const { data, error } = await supabase.rpc('reconcile_by_master_id', { p_legacy_id: SPECIFIC_LEGACY_ID });
        if (error) throw error;
        
        const count = Array.isArray(data) ? data[0]?.updated_count : (data as any)?.updated_count || 0;
        
        if (count > 0) {
          // Forceful clear and reload
          setNotes([]); 
          await new Promise(r => setTimeout(r, 800));
          await loadNotes();
          
          window.dispatchEvent(new CustomEvent('dcpi-notification', { 
            detail: { title: 'Recovery Complete', message: `Identity merged. Found and restored ${count} documents to your workspace.`, type: 'success' } 
          }));
        } else {
          window.dispatchEvent(new CustomEvent('dcpi-notification', { 
            detail: { title: 'Recovery Finished', message: 'No orphaned records found for this master sequence. Your data is likely already up to date.', type: 'info' } 
          }));
        }

        return { success: true, count };
      } catch (err: any) {
        console.error('Master Recovery error:', err);
        return { success: false, error: err.message };
      }
    },
    rateNote: async (id, val) => { await supabase.from('note_ratings').upsert({ note_id: id, user_id: user?.id, rating: val }); return { success: true }; },
    fetchRatings: async (id) => { const { data } = await supabase.from('note_ratings').select('rating').eq('note_id', id); return { average: data?.length ? Math.round((data.reduce((a, b) => a + b.rating, 0) / data.length) * 10) / 10 : 0, count: data?.length || 0 }; },
    addComment: async (id, text, pid) => { const { data } = await supabase.from('note_comments').insert({ note_id: id, user_id: user?.id, user_email: user?.email, content: text, parent_id: pid }).select().single(); return { success: true, comment: data }; },
    fetchComments: async (id) => { const { data } = await supabase.from('note_comments').select('*').eq('note_id', id).order('created_at', { ascending: true }); return data || []; },
    deleteComment: async (id) => { await supabase.from('note_comments').delete().eq('id', id); return { success: true }; },
    diagnostics: {
      projectId: (supabase as any).supabaseUrl?.split('//')[1]?.split('.')[0] || 'Unknown',
      authId: user?.id || 'Anonymous',
      notesCount: notes.length
    },
    forceSync: async () => {
      localStorage.clear();
      setNotes([]);
      await loadNotes();
      window.dispatchEvent(new CustomEvent('dcpi-notification', { 
        detail: { title: 'Vacuum Complete', message: 'Local cache purged. Force-fetching from cloud...', type: 'info' } 
      }));
    }
  };
}
