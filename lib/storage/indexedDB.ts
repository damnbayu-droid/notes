import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SmartNotes_Intelligence_Hub';
const STORE_NAME = 'manuscript_cache';
const DB_VERSION = 2;

export interface CachedManuscript {
  id: string;
  fileName: string;
  blob: Blob;
  timestamp: string;
  annotations?: any;
}

export interface PDFLog {
  id: string;
  fileName: string;
  timestamp: number;
  action: string;
  fileSize?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('engineering_logs')) {
          db.createObjectStore('engineering_logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const ManuscriptStorage = {
  async save(id: string, fileName: string, blob: Blob, annotations?: any) {
    const db = await getDB();
    await db.put(STORE_NAME, {
      id,
      fileName,
      blob,
      annotations,
      timestamp: new Date().toISOString(),
    });
  },

  async get(id: string): Promise<CachedManuscript | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
  },

  async delete(id: string) {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async getAll(): Promise<CachedManuscript[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async purge() {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};
