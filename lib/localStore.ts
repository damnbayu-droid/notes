// Neural Local Store (IndexedDB Wrapper)
export async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('SmartNotesLocal', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMedia(id: string, blob: Blob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('media', 'readwrite');
    const store = transaction.objectStore('media');
    const request = store.put({ id, blob, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMedia(id: string) {
  const db = await openDB();
  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = db.transaction('media', 'readonly');
    const store = transaction.objectStore('media');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMedia(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('media', 'readwrite');
    const store = transaction.objectStore('media');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
