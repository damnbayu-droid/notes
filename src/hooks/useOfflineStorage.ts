import { useState, useEffect } from 'react';

// Simplified encryption helper using Web Crypto API
async function encryptData(data: string, secret: string) {
    const encoder = new TextEncoder();
    const dataUint8 = encoder.encode(data);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('smart-notes-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataUint8
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string, secret: string) {
    const encoder = new TextEncoder();
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('smart-notes-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    );
    return new TextDecoder().decode(decrypted);
}

export function useOfflineStorage() {
    const [isStorageSupported, setIsStorageSupported] = useState(false);
    const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);
    const [isConnectedToFolder, setIsConnectedToFolder] = useState(false);

    useEffect(() => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            setIsStorageSupported(true);
            updateStorageUsage();
        }
        // Check if we have a saved directory handle (logic would require storing in IDB)
        const checkFs = async () => {
            const { get } = await import('idb-keyval');
            const handle = await get('local_sync_handle');
            if (handle) {
                const p = await handle.queryPermission({ mode: 'readwrite' });
                setIsConnectedToFolder(p === 'granted');
            }
        };
        checkFs();
    }, []);

    const updateStorageUsage = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const { usage, quota } = await navigator.storage.estimate();
            setStorageUsage({ usage: usage || 0, quota: quota || 0 });
        }
    };

    const syncWithLocalStorage = async () => {
        try {
            // @ts-ignore - File System Access API
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            const { set } = await import('idb-keyval');
            await set('local_sync_handle', handle);
            setIsConnectedToFolder(true);

            // Create a test file to confirm
            const fileHandle = await handle.getFileHandle('smart_notes_data.snb', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write("Smart Notes Local Sync Initialized");
            await writable.close();

            return true;
        } catch (error) {
            console.error("Folder sync failed:", error);
            return false;
        }
    };

    const clearAllData = async () => {
        try {
            const { deleteDB } = await import('idb');
            await deleteDB('smart-notes-db');
            window.location.reload();
        } catch (error) {
            console.error("Failed to clear data:", error);
        }
    };

    const exportData = async (password = 'smart-notes-locked') => {
        try {
            const { openDB } = await import('idb');
            const db = await openDB('smart-notes-db', 1);
            const notes = await db.getAll('notes');
            const books = await db.getAll('books');

            const rawData = JSON.stringify({
                version: 2,
                timestamp: Date.now(),
                notes,
                books
            });

            const encrypted = await encryptData(rawData, password);

            const blob = new Blob([encrypted], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smart-notes-${new Date().toISOString().slice(0, 10)}.snb`;
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

    const importData = async (file: File, password = 'smart-notes-locked') => {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const decrypted = await decryptData(content, password);
                    const data = JSON.parse(decrypted);

                    if (!data.notes && !data.books) throw new Error("Invalid backup");

                    const { openDB } = await import('idb');
                    const db = await openDB('smart-notes-db', 1);

                    if (data.notes) {
                        const tx = db.transaction('notes', 'readwrite');
                        for (const note of data.notes) await tx.objectStore('notes').put(note);
                        await tx.done;
                    }
                    if (data.books) {
                        const tx = db.transaction('books', 'readwrite');
                        for (const book of data.books) await tx.objectStore('books').put(book);
                        await tx.done;
                    }

                    resolve(true);
                } catch (error) {
                    console.error("Import failed:", error);
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    };

    return {
        isStorageSupported,
        storageUsage,
        isConnectedToFolder,
        updateStorageUsage,
        syncWithLocalStorage,
        clearAllData,
        exportData,
        importData
    };
}
