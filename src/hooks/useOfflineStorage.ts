import { useState, useEffect } from 'react';


export function useOfflineStorage() {
    const [isStorageSupported, setIsStorageSupported] = useState(false);
    const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);

    useEffect(() => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            setIsStorageSupported(true);
            updateStorageUsage();
        }
    }, []);

    const updateStorageUsage = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const { usage, quota } = await navigator.storage.estimate();
            setStorageUsage({ usage: usage || 0, quota: quota || 0 });
        }
    };

    const clearAllData = async () => {
        try {
            // We delete the database to clear everything
            const { deleteDB } = await import('idb');
            await deleteDB('smart-notes-db');
            window.location.reload(); // Reload to re-initialize DB
        } catch (error) {
            console.error("Failed to clear data:", error);
        }
    };

    // Assuming 'db' is an imported or globally available IndexedDB instance,
    // for example, from a separate 'db.ts' file like:
    // import { openDB } from 'idb';
    // export const db = openDB('smart-notes-db', 1, { ... });
    // If 'db' is not defined, this code will cause a runtime error.
    // For this change, we assume 'db' is accessible in this scope.
    const exportData = async () => {
        try {
            // Placeholder for db import or definition if not globally available
            // For example: const { db } = await import('./db');
            // Or pass db as a parameter to useOfflineStorage
            const { openDB } = await import('idb');
            const db = await openDB('smart-notes-db', 1); // Re-open DB to access stores

            const notes = await db.getAll('notes');
            const books = await db.getAll('books');
            const data = {
                version: 1,
                timestamp: Date.now(),
                notes,
                books
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smart-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error("Export failed:", error);
            return false;
        }
    };

    const importData = (file: File) => {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);

                    if (!data.notes && !data.books) {
                        throw new Error("Invalid backup file");
                    }

                    const { openDB } = await import('idb');
                    const db = await openDB('smart-notes-db', 1); // Re-open DB to access stores

                    // Import notes
                    if (data.notes && Array.isArray(data.notes)) {
                        const tx = db.transaction('notes', 'readwrite');
                        const store = tx.objectStore('notes');
                        for (const note of data.notes) {
                            await store.put(note); // Use put to update or add
                        }
                        await tx.done;
                    }

                    // Import books
                    if (data.books && Array.isArray(data.books)) {
                        const tx = db.transaction('books', 'readwrite');
                        const store = tx.objectStore('books');
                        for (const book of data.books) {
                            await store.put(book); // Use put to update or add
                        }
                        await tx.done;
                    }

                    resolve(true);
                } catch (error) {
                    console.error("Import failed:", error);
                    resolve(false);
                }
            };
            reader.onerror = () => resolve(false);
            reader.readAsText(file);
        });
    };

    return {
        isStorageSupported,
        storageUsage,
        updateStorageUsage,
        clearAllData,
        exportData,
        importData
    };
}
