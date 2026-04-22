'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Note, SortOption, User, NoteLog, NoteCollaborator, NoteComment } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateShareSlug } from '@/lib/shareUtils';
import { toast } from 'sonner';

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
  addLog: (noteId: string, action: string, details?: any, snapshot_content?: string) => Promise<void>;
  rateNote: (noteId: string, rating: number) => Promise<{ success: boolean; error?: string }>;
  fetchRatings: (noteId: string) => Promise<{ average: number; count: number }>;
  addComment: (noteId: string, content: string, parentId?: string) => Promise<{ success: boolean; comment?: NoteComment; error?: string }>;
  fetchComments: (noteId: string) => Promise<NoteComment[]>;
  deleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  createVersion: (noteId: string, content: string, message: string) => Promise<{ success: boolean; log?: NoteLog; error?: string }>;
  publishVersion: (noteId: string, logId: string) => Promise<{ success: boolean; error?: string }>;
  reconcileNotes: () => Promise<{ success: boolean; count?: number; error?: string }>;
  diagnostics: { projectId: string; authId: string; notesCount: number };
  forceSync: () => Promise<void>;
  reconcileDiscovery: () => Promise<{ success: boolean; count?: number; error?: string }>;
  syncGuestNotes: (targetUserId: string) => Promise<{ success: boolean; count: number; error?: string }>;
  forkNote: (noteId: string, content: string) => Promise<{ success: boolean; note?: Note; error?: string }>;
  storageLogs: any[];
  logStorageEvent: (action: string, details: any) => Promise<void>;
  deviceList: any[];
  registerDevice: () => Promise<void>;
}

type SyncAction =
  | { type: 'CREATE'; payload: Note }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<Note> } }
  | { type: 'DELETE'; payload: { id: string } };

export function useNotes(user: User | null): UseNotesReturn {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const dId = localStorage.getItem('neural_device_id') || 'root';
        const storageKey = user ? `notes_${user.id}_${dId}` : 'notes_guest';
        const cached = localStorage.getItem(storageKey);
        return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('notes_sort_by');
        return (saved as SortOption) || 'updated';
    }
    return 'updated';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('notes_view_mode');
        return (saved as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const [activeFolder, setActiveFolder] = useState<string>('Main');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('syncQueue');
        return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const deviceId = useMemo(() => {
    if (typeof window === 'undefined') return 'root';
    let id = localStorage.getItem('neural_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('neural_device_id', id);
    }
    return id;
  }, []);

  const deviceLabel = useMemo(() => {
    if (typeof window === 'undefined') return 'Neural Node';
    const ua = navigator.userAgent;
    let label = 'Generic Device';
    if (ua.includes('Macintosh')) label = 'Apple MacBook Node';
    else if (ua.includes('iPhone')) label = 'Apple iPhone Node';
    else if (ua.includes('Android')) label = 'Android Intelligence Node';
    else if (ua.includes('Windows')) label = 'Windows Workstation Node';
    else if (ua.includes('iPad')) label = 'Apple iPad Node';
    return label;
  }, []);

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
  const [storageLogs, setStorageLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('storage_logs');
        return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
    }
    return [];
  });
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([]);
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const isMounted = useRef(true);

  // Phase: Device Sovereignty (v18.1.7-ENHANCED)
  const registerDevice = useCallback(async () => {
    if (!user || typeof window === 'undefined') return;
    
    const ua = navigator.userAgent;
    let browser = 'Unknown Neural Agent';
    if (ua.includes('Chrome')) browser = 'Google Chrome / Engine V8';
    else if (ua.includes('Safari')) browser = 'Apple Safari / WebKit';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox / Gecko';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge / Engine V8';

    const storageKey = `notes_${user.id}_${deviceId}`;
    
    const deviceData = {
      user_id: user.id,
      device_id: deviceId,
      label: deviceLabel,
      user_agent: ua,
      browser_engine: browser,
      storage_key: storageKey,
      last_seen: new Date().toISOString(),
      notes_count: notes.length
    };

    try {
      // 1. Sync to Supabase
      const { error } = await supabase
        .from('user_devices')
        .upsert(deviceData, { onConflict: 'user_id,device_id' });
      
      // 2. Local State Reconciliation
      const { data: allDevices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });
      
      if (allDevices) setDeviceList(allDevices);
      else setDeviceList([deviceData]); // Fallback

    } catch (err) {
      console.warn('Device Registry Trace Failed: Using local fallback node.');
      setDeviceList([{ ...deviceData, is_current_node: true }]);
    }
  }, [user, deviceId, deviceLabel, notes.length, supabase]);

  useEffect(() => {
    if (user) registerDevice();
  }, [user, registerDevice]);

  // Phase: Neural Quota Guard (v14.0.0)
  // Ensures storage operations survive browser quota limits through tiered pruning.
  const safeSetItem = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('Neural Storage Quota Exceeded. Initiating Emergency Purge...');
        // Tier 1: Purge Recovery Buffer
        localStorage.removeItem('recovery_buffer');
        // Tier 2: Purge Legacy Storage Keys
        const keys = Object.keys(localStorage);
        const legacyKeys = keys.filter(k => k.startsWith('notes_') && !k.includes(deviceId));
        legacyKeys.forEach(k => localStorage.removeItem(k));
        
        try {
          // Retry original operation
          localStorage.setItem(key, value);
        } catch (retryError) {
          toast.error('Local Storage Critical', { 
            description: 'Database is full. Cloud-only mode active.' 
          });
        }
      }
    }
  }, [deviceId]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const broadcastNotification = useCallback((title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dcpi-notification', {
        detail: { title, message, type }
      }));
    }
  }, []);

  // Local Storage persistence
  useEffect(() => { 
    const storageKey = user ? `notes_${user.id}_${deviceId}` : 'notes_guest';
    // Limit local storage to top 50 notes for performance and quota safety
    const localSlice = notes.slice(0, 50);
    safeSetItem(storageKey, JSON.stringify(localSlice)); 
  }, [notes, user, deviceId, safeSetItem]);

  useEffect(() => { safeSetItem('syncQueue', JSON.stringify(syncQueue)); }, [syncQueue, safeSetItem]);
  useEffect(() => { safeSetItem('pinnedFolders', JSON.stringify(pinnedFolders)); }, [pinnedFolders, safeSetItem]);
  useEffect(() => { localStorage.setItem('notes_sort_by', sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem('notes_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { safeSetItem('storage_logs', JSON.stringify(storageLogs)); }, [storageLogs, safeSetItem]);

  const syncGuestNotes = async (targetUserId: string) => {
    const guestNotes = JSON.parse(localStorage.getItem('notes_guest') || '[]');
    if (guestNotes.length === 0) return { success: true, count: 0 };
    const notesToSync = guestNotes.map((n: Note) => ({ ...n, user_id: targetUserId }));
    const { error } = await supabase.from('notes').insert(notesToSync);
    if (error) return { success: false, error: error.message, count: 0 };
    localStorage.removeItem('notes_guest');
    loadNotesWithMerge();
    return { success: true, count: notesToSync.length };
  };

  const flushSyncQueue = async () => {
    if (syncQueue.length === 0) return { success: true };
    const items = [...syncQueue];
    setSyncQueue([]); // Optimistic clear
    
    try {
      const interestSignals: string[] = [];
      for (const item of items) {
        if (item.type === 'CREATE' || item.type === 'UPDATE') {
          const payload = item.type === 'CREATE' ? item.payload : item.payload.updates;
          if (payload.tags) interestSignals.push(...payload.tags);
          if (payload.category) interestSignals.push(payload.category);
        }

        if (item.type === 'CREATE') {
          await supabase.from('notes').insert(item.payload);
        } else if (item.type === 'UPDATE') {
          await supabase.from('notes').update(item.payload.updates).eq('id', item.payload.id);
        } else if (item.type === 'DELETE') {
          await supabase.from('notes').delete().eq('id', item.payload.id);
        }
      }

      // Phase: Neural Behavior Learning (v11.0.0)
      if (user && interestSignals.length > 0) {
        const uniqueInterests = Array.from(new Set(interestSignals));
        await supabase.rpc('update_user_interests', { 
          p_user_id: user.id, 
          p_interests: uniqueInterests 
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Neural Bridge Flush Failure:', err);
      // Put back in queue? 
      setSyncQueue(prev => [...items, ...prev]);
      throw err;
    }
  };


  useEffect(() => {
    if (user) {
        // Trigger automatic migration of local 'memory' to cloud database
        const guestNotes = localStorage.getItem('notes_guest');
        if (guestNotes && JSON.parse(guestNotes).length > 0) {
            toast.promise(syncGuestNotes(user.id), {
                loading: 'Merging local intelligence with cloud...',
                success: (data: any) => `Successfully synchronized ${data.count} nodes to your account.`,
                error: 'Migration failed. Manual sync required.'
            });
        }
    }
  }, [user]);

  // Draft Recovery Buffer (Protocol BUFF-DATA-INTEGRITY)
  // Maintains a "Black Box" of the last 20 edited notes, surviving even cloud sync failures.
  useEffect(() => {
    if (notes.length === 0) return;
    try {
      const buffer = JSON.parse(localStorage.getItem('recovery_buffer') || '[]');
      const updatedBuffer = [
        ...notes.slice(0, 20), // Store current top 20 notes as a fail-safe
        ...buffer.filter((bn: Note) => !notes.find(n => n.id === bn.id))
      ].slice(0, 50);
      localStorage.setItem('recovery_buffer', JSON.stringify(updatedBuffer));
    } catch (e) {
      console.warn('Recovery buffer overflow.');
    }
  }, [notes]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Phase: Neural Sync Bridge (v10.0.0)
      // Automatically flush the outbox when connectivity is restored
      if (syncQueue.length > 0) {
        toast.promise(flushSyncQueue(), {
            loading: 'Re-establishing Neural Bridge...',
            success: 'Intelligence clusters synchronized.',
            error: 'Bridge failure. Background retry pending.'
        });
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadNotesWithMerge = useCallback(async () => {
    if (!user || isOffline) return;
    
    try {
      const { data: cloudNotes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Smart Checker: Mirroring & Conflict Resolution
      setNotes(prev => {
        const localMap = new Map(prev.map(n => [n.id, n]));
        const merged = [...prev];

        (cloudNotes as any[])?.forEach(cn => {
          const ln = localMap.get(cn.id);
          if (!ln) {
            // New cloud note, inject to local
            merged.push(cn);
          } else {
            // Check timestamps
            const cloudTime = new Date(cn.updated_at).getTime();
            const localTime = new Date(ln.updated_at).getTime();
            
            if (cloudTime > localTime) {
              // Cloud is newer, mirror to local
              const idx = merged.findIndex(n => n.id === cn.id);
              merged[idx] = cn;
            }
          }
        });

        return merged;
      });

      toast.info('Neural Mirroring Complete', { 
        description: 'Intelligence layers synchronized across local and cloud nodes.' 
      });
    } catch (err) {
      console.error('Mirroring Protocol Failed:', err);
    }
  }, [user, isOffline, supabase]);

  // Phase: Neural Sync Bridge (v12.0.0)
  // Implements 15-second delayed mirroring for high-performance local-first access.
  useEffect(() => {
    if (!user) return;

    // Phase: Neural Sync Deferral (v12.0.0)
    // We prioritize local storage for the first 30 seconds of the session.
    // Cloud sync only triggers if explicitly needed or after the stability window.
    const isPwa = window.matchMedia('(display-mode: standalone)').matches;
    const deferTime = isPwa ? 60000 : 30000; // Longer deferral for installed apps

    const timer = setTimeout(() => {
      loadNotesWithMerge();
    }, deferTime);

    return () => clearTimeout(timer);
  }, [user, loadNotesWithMerge]);

  const createNote = useCallback(async (noteData: Partial<Note>) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: noteData.title || '',
      content: noteData.content || '',
      user_id: user?.id || 'guest',
      color: noteData.color || 'default',
      is_pinned: noteData.is_pinned || false,
      is_archived: noteData.is_archived || false,
      tags: noteData.tags || [],
      folder: noteData.folder || activeFolder || 'Main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_premium: noteData.is_premium || false,
      domain: noteData.domain || 'default'
    };
    setNotes(prev => [newNote, ...prev]);
    if (user && !isOffline) {
      // Enforcement Logic: Device Limit (v9.6.0)
      // Standard: 4 Devices | Enterprise/Admin: Unlimited
      const isUnlimited = user.role === 'admin' || user.isSuperAdmin || user.subscription_tier === 'enterprise';
      
      // Note: Device count logic would typically fetch from a 'user_devices' table.
      // For this implementation, we simulate the guard check.
      const deviceCount = 1; // Placeholder for actual device count fetch
      
      if (!isUnlimited && deviceCount > 4) {
        toast.error('Device Limit Reached', { description: 'Please upgrade to Enterprise for unlimited device synchronization.' });
        return { success: false, error: 'Device limit exceeded' };
      }

      const { error } = await supabase.from('notes').insert(newNote);
      if (error) {
        broadcastNotification('Sync Interrupted', 'Note saved locally. Neural bridge retry pending.', 'error');
        return { success: false, error: error.message };
      }
    } else if (!user) {
        // Guest handling: Already handled by setNotes + LocalStorage useEffect
    } else {
      setSyncQueue(prev => [...prev, { type: 'CREATE', payload: newNote }]);
    }
    broadcastNotification('Intelligence Initialized', `Node "${newNote.title}" is now active.`);
    return { success: true, note: newNote };
  }, [user, isOffline, activeFolder, supabase]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const timestamp = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updated_at: timestamp } : n));
    
    if (user && !isOffline) {
      const { error } = await supabase.from('notes').update({ ...updates, updated_at: timestamp }).eq('id', id);
      if (error) {
        broadcastNotification('Save Failed', 'Local copy maintained. Bridge retry pending.', 'error');
        return { success: false, error: error.message };
      }
    } else if (user && isOffline) {
      setSyncQueue(prev => [...prev, { type: 'UPDATE', payload: { id, updates: { ...updates, updated_at: timestamp } } }]);
    }
    // Only broadcast update for significant title changes to avoid noise
    if (updates.title) broadcastNotification('Intelligence Updated', `Properties for "${updates.title}" synchronized.`);
    return { success: true };
  }, [user, isOffline, supabase]);

  const deleteForever = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (user && !isOffline) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) toast.error('Neural Deletion Failed');
    }
    else if (user && isOffline) setSyncQueue(prev => [...prev, { type: 'DELETE', payload: { id } }]);
    broadcastNotification('Intelligence Purged', 'Node has been permanently removed from the cluster.', 'info');
    return { success: true };
  }, [user, isOffline, supabase]);

  const deleteNote = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return { success: false };
    if (note.folder === 'Trash') return deleteForever(id);
    return updateNote(id, { folder: 'Trash', is_pinned: false });
  }, [notes, deleteForever, updateNote]);

  const filterNotes = useCallback((notesToFilter: Note[]) => {
    return notesToFilter.filter(note => {
      // Basic Folder Filtering
      if (activeFolder === 'Trash' && note.folder !== 'Trash') return false;
      if (activeFolder !== 'Trash' && note.folder === 'Trash') return false;
      
      // If we are looking at a specific folder, only show that folder's notes
      if (activeFolder !== 'Main' && activeFolder !== 'Trash' && activeFolder !== 'Archive' && note.folder !== activeFolder) return false;

      // Search & Tags
      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => {
        if (tag === 'Shared') return note.is_shared;
        if (tag === 'Discovery') return note.is_discoverable;
        return note.tags?.includes(tag);
      });
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, activeFolder]);

  const sortNotes = (ns: Note[]) => [...ns].sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return a.title.localeCompare(b.title);
  });

  const pinnedNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => !n.is_archived && n.is_pinned))), [notes, filterNotes, sortBy]);
  const activeNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => !n.is_archived && !n.is_pinned))), [notes, filterNotes, sortBy]);
  const archivedNotes = useMemo(() => sortNotes(filterNotes(notes.filter(n => n.is_archived))), [notes, filterNotes, sortBy]);

  const folders = useMemo(() => {
    const set = new Set<string>(['Main']);
    notes.forEach(n => n.folder && n.folder !== 'Trash' && n.folder !== 'Archive' && set.add(n.folder));
    return Array.from(set).sort();
  }, [notes]);

  return {
    notes, pinnedNotes, activeNotes, archivedNotes,
    allTags: useMemo(() => Array.from(new Set(notes.flatMap(n => n.tags || []))).sort(), [notes]),
    searchQuery, setSearchQuery, selectedTags, setSelectedTags,
    toggleTag: (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]),
    sortBy, setSortBy, viewMode, setViewMode, isLoading, isOffline,
    createNote, updateNote, deleteNote,
    togglePin: (id: string) => { const n = notes.find(x => x.id === id); return updateNote(id, { is_pinned: !n?.is_pinned }); },
    toggleArchive: (id: string) => { const n = notes.find(x => x.id === id); return updateNote(id, { is_archived: !n?.is_archived, is_pinned: false }); },
    duplicateNote: (id: string) => { const n = notes.find(x => x.id === id); if (!n) return Promise.resolve({ success: false }); return createNote({ ...n, title: `${n.title} (Copy)`, is_pinned: false }); },
    folders, activeFolder, setActiveFolder,
    renameFolder: async (oldName, newName) => {
      setNotes(prev => prev.map(n => n.folder === oldName ? { ...n, folder: newName } : n));
      if (user && !isOffline) await supabase.from('notes').update({ folder: newName }).eq('folder', oldName).eq('user_id', user.id);
      return { success: true };
    },
    deleteFolder: async (name) => {
      setNotes(prev => prev.map(n => n.folder === name ? { ...n, folder: 'Trash' } : n));
      if (user && !isOffline) await supabase.from('notes').update({ folder: 'Trash' }).eq('folder', name).eq('user_id', user.id);
      if (activeFolder === name) setActiveFolder('Main');
      return { success: true };
    },
    pinnedFolders, togglePinFolder: (f) => setPinnedFolders(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]),
    createFolder: (name) => createNote({ title: `Cluster: ${name}`, content: `<p>New intelligence segment initialized.</p>`, folder: name }),
    restoreNote: (id) => updateNote(id, { folder: 'Main', is_archived: false }),
    deleteForever,
    emptyTrash: async () => {
      setNotes(prev => prev.filter(n => n.folder !== 'Trash'));
      if (user && !isOffline) await supabase.from('notes').delete().eq('folder', 'Trash').eq('user_id', user.id);
      return { success: true };
    },
    shareNote: async (id, type = 'public', _password, permission = 'read', isDiscoverable = false) => {
      try {
        const n = notes.find(x => x.id === id);
        if (!n) throw new Error('Note not found');
        const slug = n.share_slug || generateShareSlug(n.title);
        const updates = { is_shared: true, share_slug: slug, share_type: type, share_permission: permission, is_discoverable: isDiscoverable };
        const { error } = await supabase.from('notes').update(updates).eq('id', id);
        if (error) throw error;
        setNotes(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x));
        
        // Phase: Neural Indexing Handshake (v9.5.0)
        // Strictly trigger only if discoverability is enabled
        if (isDiscoverable) {
          fetch('/api/discovery/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug })
          }).catch(err => console.error('Indexing background failure:', err));
        }

        return { success: true, slug };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    unshareNote: async (id) => {
      try {
        const updates = { is_shared: false, share_slug: undefined, is_discoverable: false };
        const { error } = await supabase.from('notes').update(updates).eq('id', id);
        if (error) throw error;
        setNotes(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    logs, collaborators,
    fetchLogs: async (id) => { 
        const { data } = await supabase.from('note_logs').select('*').eq('note_id', id).order('created_at', { ascending: false }); 
        if (data) setLogs(data); 
    },
    fetchCollaborators: async (id) => { 
        const { data } = await supabase.from('note_collaborators').select('*').eq('note_id', id); 
        if (data) setCollaborators(data); 
    },
    addCollaborator: async (id, email, perm) => { 
        await supabase.from('note_collaborators').upsert({ note_id: id, email, permission: perm }); 
        return { success: true }; 
    },
    removeCollaborator: async (id, email) => { 
        await supabase.from('note_collaborators').delete().eq('id', id).eq('email', email); 
        return { success: true }; 
    },
    addLog: async (id: string, action: string, details: any, snapshot_content?: string) => { 
        await supabase.from('note_logs').insert({ 
          note_id: id, 
          user_id: user?.id, 
          user_email: user?.email, 
          action, 
          details,
          snapshot_content 
        }); 
    },
    createVersion: async (noteId, content, message) => {
        try {
            const logEntry = {
                note_id: noteId,
                user_id: user?.id,
                user_email: user?.email,
                action: 'VERSION_COMMIT',
                details: { message },
                snapshot_content: content
            };
            const { data, error } = await supabase.from('note_logs').insert(logEntry).select().single();
            if (error) throw error;
            
            setLogs(prev => [data as NoteLog, ...prev]);
            broadcastNotification('Version Committed', `New snapshot archived: ${message}`);
            return { success: true, log: data };
        } catch (err: any) {
            broadcastNotification('Commit Failure', err.message, 'error');
            return { success: false, error: err.message };
        }
    },
    publishVersion: async (noteId, logId) => {
        try {
            const { error } = await supabase.from('notes').update({ published_log_id: logId }).eq('id', noteId);
            if (error) throw error;
            
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, published_log_id: logId } : n));
            broadcastNotification('Neural Promotion', 'Intelligence version is now live on the public Oracle.');
            return { success: true };
        } catch (err: any) {
            broadcastNotification('Promotion Failed', err.message, 'error');
            return { success: false, error: err.message };
        }
    },
    rateNote: async (id, val) => { await supabase.from('note_ratings').upsert({ note_id: id, user_id: user?.id, rating: val }); return { success: true }; },
    fetchRatings: async (id) => { 
        const { data } = await supabase.from('note_ratings').select('rating').eq('note_id', id); 
        return { average: data?.length ? data.reduce((a: number, b: any) => a + b.rating, 0) / data.length : 0, count: data?.length || 0 }; 
    },
    addComment: async (id, text, pid) => { 
        const { data } = await supabase.from('note_comments').insert({ note_id: id, user_id: user?.id, user_email: user?.email, content: text, parent_id: pid }).select().single(); 
        return { success: true, comment: data }; 
    },
    fetchComments: async (id) => { 
        const { data } = await supabase.from('note_comments').select('*').eq('note_id', id).order('created_at', { ascending: true }); 
        return data || []; 
    },
    deleteComment: async (id) => { 
        await supabase.from('note_comments').delete().eq('id', id); 
        return { success: true }; 
    },
    reconcileNotes: async () => {
      if (!user) return { success: false, error: 'User not authenticated' };
      try {
        const { data, error } = await supabase.rpc('reconcile_by_master_id', { p_legacy_id: 'cfd6e46f-c2d7-45b1-978f-0a4401fe35da' });
        if (error) throw error;
        loadNotesWithMerge();
        return { success: true, count: data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    diagnostics: {
      projectId: (supabase as any).supabaseUrl?.split('//')[1]?.split('.')[0] || 'Unknown',
      authId: user?.id || 'Anonymous',
      notesCount: notes.length
    },
    forceSync: async () => {
      try {
        toast.loading('Synchronizing Neural Bridge...', { id: 'force-sync' });
        
        // Phase: Neural Storage Trace (v13.0.0)
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: 'FORCE_SYNC_PURGE',
          details: { notesBeforePurge: notes.length },
          device: deviceLabel
        };
        setStorageLogs(prev => [logEntry, ...prev]);

        // 1. Purge Local Cache
        localStorage.removeItem(`notes_${user?.id || 'guest'}`);
        localStorage.removeItem('syncQueue');
        setNotes([]);
        
        // 2. Fetch Owned Notes
        await loadNotesWithMerge();
        
        toast.success('Neural Database Re-linked', { 
          id: 'force-sync',
          description: 'Local cache purged. All cloud intelligence has been re-synchronized.' 
        });
      } catch (err: any) {
        toast.error('Sync Recovery Failed', { id: 'force-sync', description: err.message });
      }
    },
    reconcileDiscovery: async () => {
        return { success: true, count: 0 }; // Placeholder
    },
    syncGuestNotes,
    forkNote: async (noteId: string, content: string) => {
        if (!user) return { success: false, error: 'Authentication required' };
        const sourceNote = notes.find(n => n.id === noteId);
        
        const forkedNote: Note = {
          id: crypto.randomUUID(),
          title: sourceNote ? `${sourceNote.title} (Forked)` : 'Forked Intelligence',
          content,
          user_id: user.id,
          parent_id: noteId,
          tags: sourceNote?.tags || [],
          folder: 'Main',
          color: 'default',
          is_pinned: false,
          is_archived: false,
          is_premium: sourceNote?.is_premium || false,
          domain: sourceNote?.domain || 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('notes').insert(forkedNote);
        if (error) return { success: false, error: error.message };

        setNotes(prev => [forkedNote, ...prev]);
        toast.success('Neural Node Forked', { description: 'New independent dataset initialized with ancestry tracking.' });
        return { success: true, note: forkedNote };
    },
    storageLogs,
    logStorageEvent: async (action, details) => {
      const entry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        device: deviceLabel
      };
      setStorageLogs(prev => [entry, ...prev]);
      if (user && !isOffline) {
        await supabase.from('note_logs').insert({
          action: `STORAGE_${action}`,
          details: entry,
          user_id: user.id
        });
      }
    },
    deviceList,
    registerDevice,
  };
}
