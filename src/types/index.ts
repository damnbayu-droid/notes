export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  tags: string[];
  reminder_date?: string; // ISO string
  folder?: string; // e.g., 'Main', 'Google Notes', 'iCloud Notes'
  created_at: string;
  updated_at: string;
}

export type NoteColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

export interface NoteColorOption {
  value: NoteColor;
  label: string;
  bg: string;
  border: string;
}

export const NOTE_COLORS: NoteColorOption[] = [
  { value: 'default', label: 'Default', bg: 'bg-white', border: 'border-gray-200' },
  { value: 'red', label: 'Red', bg: 'bg-red-50', border: 'border-red-200' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'green', label: 'Green', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200' },
];

export type ViewMode = 'grid' | 'list';
export type SortOption = 'updated' | 'created' | 'title';
