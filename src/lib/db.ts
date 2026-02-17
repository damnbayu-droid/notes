import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book } from '@/components/books/types';

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
    tags: string[];
    isPinned?: boolean;
    folder?: string;
    voiceNotes?: Blob[]; // Array of audio blobs
    sketches?: string[]; // Array of base64 strings or blob URLs (TBD)
}

interface SmartNotesDB extends DBSchema {
    notes: {
        key: string;
        value: Note;
        indexes: { 'by-date': number; 'by-folder': string };
    };
    books: {
        key: string;
        value: Book;
        indexes: { 'by-date': number };
    };
    settings: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'smart-notes-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartNotesDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<SmartNotesDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Notes Store
                if (!db.objectStoreNames.contains('notes')) {
                    const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
                    noteStore.createIndex('by-date', 'updatedAt');
                    noteStore.createIndex('by-folder', 'folder');
                }

                // Books Store
                if (!db.objectStoreNames.contains('books')) {
                    const bookStore = db.createObjectStore('books', { keyPath: 'id' });
                    bookStore.createIndex('by-date', 'updatedAt');
                }

                // Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            },
        });
    }
    return dbPromise;
};

export const db = {
    notes: {
        add: async (note: Note) => (await initDB()).put('notes', note),
        get: async (id: string) => (await initDB()).get('notes', id),
        getAll: async () => (await initDB()).getAllFromIndex('notes', 'by-date'),
        delete: async (id: string) => (await initDB()).delete('notes', id),
        update: async (note: Note) => (await initDB()).put('notes', note), // put updates if key exists
    },
    books: {
        add: async (book: Book) => (await initDB()).put('books', book),
        get: async (id: string) => (await initDB()).get('books', id),
        getAll: async () => (await initDB()).getAllFromIndex('books', 'by-date'),
        delete: async (id: string) => (await initDB()).delete('books', id),
        update: async (book: Book) => (await initDB()).put('books', book),
    },
    settings: {
        set: async (key: string, value: any) => (await initDB()).put('settings', value, key),
        get: async (key: string) => (await initDB()).get('settings', key),
    },
};
