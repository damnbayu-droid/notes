import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, FileText, Plus, Trash2, Bot, Sparkles, Send, X, Loader2, Menu } from 'lucide-react';
import type { Book, Chapter } from './types';
import { toast } from 'sonner';
import { askAI } from '@/lib/openai';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface BookEditorProps {
    book: Book;
    onSave: (book: Book) => void;
    onBack: () => void;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export function BookEditor({ book: initialBook, onSave, onBack }: BookEditorProps) {
    const [book, setBook] = useState<Book>(initialBook);
    const [activeChapterId, setActiveChapterId] = useState<string>(initialBook.chapters[0]?.id || '');
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState<Message[]>([
        { role: 'ai', content: 'I am your writing assistant. How can I help you with your book today?' }
    ]);
    const [isAILoading, setIsAILoading] = useState(false);
    const aiScrollRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const activeChapter = book.chapters.find(c => c.id === activeChapterId);

    // Auto-save logic
    useEffect(() => {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const timer = setTimeout(() => {
            onSave(book);
        }, 3000);
        setAutoSaveTimer(timer);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book]);

    // Scroll AI chat to bottom
    useEffect(() => {
        if (aiScrollRef.current) {
            aiScrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages, isAIOpen]);

    const handleChapterContentChange = (content: string) => {
        if (!activeChapter) return;

        setBook(prev => ({
            ...prev,
            chapters: prev.chapters.map(c =>
                c.id === activeChapterId ? { ...c, content } : c
            )
        }));
    };

    const handleChapterTitleChange = (title: string, chapterId: string) => {
        setBook(prev => ({
            ...prev,
            chapters: prev.chapters.map(c =>
                c.id === chapterId ? { ...c, title } : c
            )
        }));
    };

    const handleAddChapter = () => {
        const newChapter: Chapter = {
            id: crypto.randomUUID(),
            title: `Chapter ${book.chapters.length + 1}`,
            content: '',
            order: book.chapters.length + 1
        };

        setBook(prev => ({
            ...prev,
            chapters: [...prev.chapters, newChapter]
        }));
        setActiveChapterId(newChapter.id);
        toast.success("Chapter added");
    };

    const handleDeleteChapter = (chapterId: string) => {
        if (book.chapters.length <= 1) {
            toast.error("Cannot delete the last chapter");
            return;
        }

        setBook(prev => ({
            ...prev,
            chapters: prev.chapters.filter(c => c.id !== chapterId)
        }));

        if (activeChapterId === chapterId) {
            setActiveChapterId(book.chapters.find(c => c.id !== chapterId)?.id || '');
        }
        toast.success("Chapter deleted");
    };

    const handleAskAI = async () => {
        if (!aiInput.trim()) return;

        const userMsg: Message = { role: 'user', content: aiInput };
        setAiMessages(prev => [...prev, userMsg]);
        setAiInput('');
        setIsAILoading(true);

        const systemPrompt = `
            You are an AI writing assistant helping the user write a book titled "${book.title}".
            Current Chapter: "${activeChapter?.title}".
            Current Content Context:
            "${activeChapter?.content.slice(-2000) || ''}"
            
            Help the user with plot, character development, grammar, or continuing the story.
            Keep responses helpful and concise.
        `;

        const contextMessages: any[] = [
            { role: 'system', content: systemPrompt },
            ...aiMessages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: aiInput }
        ];

        try {
            // @ts-ignore
            const response = await askAI(contextMessages);
            const content = response.content || "I couldn't generate a response.";
            setAiMessages(prev => [...prev, { role: 'ai', content }]);
        } catch (error) {
            console.error(error);
            setAiMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error." }]);
        } finally {
            setIsAILoading(false);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-muted/10">
            <div className="p-4 border-b border-border">
                <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Shelf
                </Button>
                <div className="space-y-1">
                    <Input
                        value={book.title}
                        onChange={(e) => setBook(prev => ({ ...prev, title: e.target.value }))}
                        className="font-bold text-lg border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
                    />
                    <p className="text-xs text-muted-foreground">by {book.author}</p>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {book.chapters.map((chapter) => (
                        <div
                            key={chapter.id}
                            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${activeChapterId === chapter.id
                                ? 'bg-violet-100 text-violet-900'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            onClick={() => {
                                setActiveChapterId(chapter.id);
                                if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate text-sm font-medium">{chapter.title}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChapter(chapter.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
                <Button onClick={handleAddChapter} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chapter
                </Button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex bg-background overflow-hidden relative">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 border-r border-border shrink-0">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-80">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Main Content - Editor */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="font-semibold truncate max-w-[200px]">{book.title}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={isAIOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600'}
                        onClick={() => setIsAIOpen(!isAIOpen)}
                    >
                        <Sparkles className="w-5 h-5" />
                    </Button>
                </div>

                {/* Desktop AI Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={`hidden md:flex absolute top-4 right-4 z-10 ${isAIOpen ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600'}`}
                    onClick={() => setIsAIOpen(!isAIOpen)}
                    title="Toggle AI Assistant"
                >
                    <Sparkles className="w-5 h-5" />
                </Button>

                {activeChapter ? (
                    <>
                        <div className="p-6 md:p-8 pb-4 max-w-3xl mx-auto w-full">
                            <Input
                                value={activeChapter.title}
                                onChange={(e) => handleChapterTitleChange(e.target.value, activeChapter.id)}
                                className="text-2xl md:text-3xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-gray-300"
                                placeholder="Chapter Title"
                            />
                        </div>
                        <div className="flex-1 overflow-auto px-6 md:px-8 pb-8">
                            <Textarea
                                value={activeChapter.content}
                                onChange={(e) => handleChapterContentChange(e.target.value)}
                                className="max-w-3xl mx-auto w-full h-full min-h-[500px] border-0 focus-visible:ring-0 resize-none text-base md:text-lg leading-relaxed p-0 placeholder:text-gray-300 font-serif"
                                placeholder="Start writing..."
                            />
                        </div>
                        <div className="p-2 border-t text-xs text-center text-gray-400">
                            Word Count: {activeChapter.content.split(/\s+/).filter(w => w.length > 0).length} | {book.chapters.reduce((acc, c) => acc + c.content.split(/\s+/).filter(w => w.length > 0).length, 0)} Total
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a chapter to start writing
                    </div>
                )}
            </div>

            {/* AI Sidebar / Overlay */}
            {isAIOpen && (
                <div className="fixed inset-0 z-50 md:static md:w-80 md:border-l md:border-border bg-white flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-violet-50/50">
                        <div className="flex items-center gap-2 text-violet-700 font-semibold">
                            <Bot className="w-5 h-5" />
                            Book Assistant
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAIOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {aiMessages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'ai' && (
                                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-3 h-3 text-violet-600" />
                                        </div>
                                    )}
                                    <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${msg.role === 'user'
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isAILoading && (
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                        <Bot className="w-3 h-3 text-violet-600" />
                                    </div>
                                    <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                        <span className="ml-2 text-xs text-gray-500">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={aiScrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-border">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ask for suggestions..."
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                disabled={isAILoading}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleAskAI} disabled={isAILoading || !aiInput.trim()} className="bg-violet-600">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-xs h-7 px-2" onClick={() => setAiInput("Suggest a plot twist")}>Plot Twist</Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-xs h-7 px-2" onClick={() => setAiInput("Describe the setting")}>Setting</Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-xs h-7 px-2" onClick={() => setAiInput("Develop this character")}>Character</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
