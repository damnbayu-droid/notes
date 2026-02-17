import type { Note } from '@/types';

export interface TrashItem extends Note {
    deleted_at: string;
    auto_delete_at: string; // 30 days from deletion
}

const TRASH_STORAGE_KEY = 'smart-notes-trash';
const AUTO_DELETE_DAYS = 30;

/**
 * Get all items from trash
 */
export function getTrashItems(): TrashItem[] {
    try {
        const trash = localStorage.getItem(TRASH_STORAGE_KEY);
        return trash ? JSON.parse(trash) : [];
    } catch (error) {
        console.error('Error reading trash:', error);
        return [];
    }
}

/**
 * Add note to trash
 */
export function moveToTrash(note: Note): void {
    const trash = getTrashItems();
    const deletedAt = new Date().toISOString();
    const autoDeleteAt = new Date(Date.now() + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const trashItem: TrashItem = {
        ...note,
        deleted_at: deletedAt,
        auto_delete_at: autoDeleteAt,
    };

    trash.push(trashItem);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));
}

/**
 * Restore note from trash
 */
export function restoreFromTrash(noteId: string): TrashItem | null {
    const trash = getTrashItems();
    const itemIndex = trash.findIndex(item => item.id === noteId);

    if (itemIndex === -1) return null;

    const [restoredItem] = trash.splice(itemIndex, 1);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));

    return restoredItem;
}

/**
 * Permanently delete note from trash
 */
export function permanentlyDelete(noteId: string): void {
    const trash = getTrashItems();
    const updatedTrash = trash.filter(item => item.id !== noteId);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(updatedTrash));
}

/**
 * Empty entire trash
 */
export function emptyTrash(): void {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify([]));
}

/**
 * Auto-delete expired items (older than 30 days)
 */
export function cleanupExpiredTrash(): number {
    const trash = getTrashItems();
    const now = new Date().toISOString();

    const validItems = trash.filter(item => item.auto_delete_at > now);
    const deletedCount = trash.length - validItems.length;

    if (deletedCount > 0) {
        localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(validItems));
    }

    return deletedCount;
}

/**
 * Get count of items in trash
 */
export function getTrashCount(): number {
    return getTrashItems().length;
}
