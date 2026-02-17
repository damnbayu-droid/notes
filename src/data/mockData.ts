import type { User, Note } from '@/types';

export const mockUser: User = {
  id: '1',
  email: 'demo@notesapp.com',
  name: 'Demo User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  created_at: new Date().toISOString(),
};

export const mockNotes: Note[] = [];

export const getNoteById = (id: string): Note | undefined => {
  return mockNotes.find(note => note.id === id);
};

export const getPinnedNotes = (): Note[] => {
  return mockNotes.filter(note => note.is_pinned && !note.is_archived);
};

export const getActiveNotes = (): Note[] => {
  return mockNotes.filter(note => !note.is_pinned && !note.is_archived);
};

export const getArchivedNotes = (): Note[] => {
  return mockNotes.filter(note => note.is_archived);
};

export const getAllTags = (): string[] => {
  return [];
};
