import { db } from '@/lib/db';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Plus, Book as BookIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BOOK_TEMPLATES } from './types';
import type { Book, BookType } from './types';
import { BookEditor } from './BookEditor';

export function BookLayout() {
    const [view, setView] = useState<'shelf' | 'editor'>('shelf');
    const [activeBook, setActiveBook] = useState<Book | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    // Loading state removed as per linting rules if not used, or we should use it in UI.
    // For now removing to fix lint error.

    // Load books from DB
    useEffect(() => {
        const loadBooks = async () => {
            try {
                const loadedBooks = await db.books.getAll();
                setBooks(loadedBooks || []);
            } catch (error) {
                console.error("Failed to load books:", error);
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Error', message: "Failed to load your bookshelf", type: 'error' }
                }));
            } finally {
                // setLoading(false);
            }
        };
        loadBooks();
    }, [view]); // Reload when view changes (e.g. coming back from editor)

    const handleCreateBook = async (type: BookType) => {
        const template = BOOK_TEMPLATES[type];

        let coverColor = 'bg-gray-100';
        if (type === 'novel') coverColor = 'bg-green-100';
        if (type === 'non-fiction') coverColor = 'bg-blue-100';
        if (type === 'empty') coverColor = 'bg-slate-100';

        const newBook: Book = {
            id: crypto.randomUUID(),
            title: template.title || 'Untitled Book',
            author: 'Me', // Todo: Get from user profile
            type: type,
            cover: coverColor,
            progress: 0,
            lastEdited: new Date().toISOString(),
            chapters: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...template
        } as Book;

        try {
            await db.books.add(newBook);
            setBooks([newBook, ...books]);
            setActiveBook(newBook);
            setView('editor');
            setIsCreateDialogOpen(false);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Success', message: "New book created", type: 'success' }
            }));
        } catch (error) {
            console.error("Failed to create book:", error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Failed to create book", type: 'error' }
            }));
        }
    };

    const handleSaveBook = async (updatedBook: Book) => {
        try {
            // Update timestamp
            const bookToSave = {
                ...updatedBook,
                updatedAt: Date.now(),
                lastEdited: 'Just now' // You might want to format this better
            };

            await db.books.update(bookToSave);

            // Update local state to reflect changes immediately
            setBooks(prev => prev.map(b => b.id === updatedBook.id ? bookToSave : b));
            setActiveBook(bookToSave);
        } catch (error) {
            console.error("Failed to save book:", error);
            // Don't show toast on every auto-save to avoid spam
        }
    };

    if (view === 'editor' && activeBook) {
        return (
            <BookEditor
                book={activeBook}
                onSave={handleSaveBook}
                onBack={() => setView('shelf')}
            />
        );
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <BookIcon className="w-8 h-8 text-violet-600" />
                        My Bookshelf
                    </h2>
                    <p className="text-muted-foreground mt-1">Manage your long-form writing projects.</p>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Book
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* New Book Card */}
                <Card
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="border-dashed border-2 hover:border-violet-400 hover:bg-violet-50/50 cursor-pointer transition-all flex flex-col items-center justify-center h-[280px] gap-4 group"
                >
                    <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-violet-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-violet-900">Create New Book</h3>
                        <p className="text-sm text-violet-600/80">Start a new masterpiece</p>
                    </div>
                </Card>

                {/* Book List */}
                {books.map((book) => (
                    <Card
                        key={book.id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 h-[280px] flex flex-col overflow-hidden group"
                        onClick={() => {
                            setActiveBook(book);
                            setView('editor');
                        }}
                    >
                        <div className={`h-40 ${book.cover} flex items-center justify-center relative p-6`}>
                            <BookIcon className="w-16 h-16 text-gray-400/50 absolute" />
                            <div className="relative z-10 w-full h-full bg-white/30 backdrop-blur-sm rounded-r-lg shadow-sm border-l-4 border-gray-800/10 p-3 flex flex-col justify-center">
                                <span className="font-serif font-bold text-gray-800 text-lg leading-tight line-clamp-2">{book.title}</span>
                                <span className="text-xs text-gray-600 mt-1">by {book.author}</span>
                            </div>
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base truncate">{book.title}</CardTitle>
                            <CardDescription className="text-xs">Edited {book.lastEdited}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 mt-auto">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-500"
                                    style={{ width: `${book.progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 mt-1 block text-right">{book.progress}% complete</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Book</DialogTitle>
                        <DialogDescription>
                            Choose a template to get started with your new book.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 py-4">
                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-200 justify-start"
                            onClick={() => handleCreateBook('novel')}
                        >
                            <span className="font-semibold text-violet-900">Novel / Fiction</span>
                            <span className="text-xs text-muted-foreground font-normal">Standard 3-act structure with chapters</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start gap-1 hover:bg-blue-50 hover:border-blue-200 justify-start"
                            onClick={() => handleCreateBook('non-fiction')}
                        >
                            <span className="font-semibold text-blue-900">Non-Fiction</span>
                            <span className="text-xs text-muted-foreground font-normal">Structured with intro, chapters, and conclusion</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start gap-1 hover:bg-gray-50 hover:border-gray-200 justify-start"
                            onClick={() => handleCreateBook('empty')}
                        >
                            <span className="font-semibold text-gray-900">Empty Book</span>
                            <span className="text-xs text-muted-foreground font-normal">Start from a blank canvas</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
