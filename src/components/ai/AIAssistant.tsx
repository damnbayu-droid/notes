import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

const AIChatWindow = lazy(() => import('./AIChatWindow'));

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    // Listen for custom AI events from Sidebar
    useEffect(() => {
        const handleCustomMessage = (event: CustomEvent) => {
            if (event.detail) {
                setPendingMessage(event.detail);
                setIsOpen(true);
            }
        };

        window.addEventListener('ai-message' as any, handleCustomMessage);
        return () => {
            window.removeEventListener('ai-message' as any, handleCustomMessage);
        };
    }, []);

    const handleMouseEnter = () => {
        import('./AIChatWindow');
    };

    return (
        <>
            {/* Chat Window (Lazy Loaded) */}
            {isOpen && (
                <Suspense fallback={
                    <div className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] flex items-center justify-center bg-white rounded-xl shadow-2xl border border-violet-100">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                            <p className="text-sm text-gray-500">Loading Note-Ai...</p>
                        </div>
                    </div>
                }>
                    <AIChatWindow
                        onClose={() => setIsOpen(false)}
                        initialMessage={pendingMessage}
                        onClearInitialMessage={() => setPendingMessage(null)}
                    />
                </Suspense>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={handleMouseEnter}
                    aria-label="Open AI Assistant"
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-300 z-40 transition-all hover:scale-105 hover:shadow-xl animate-in fade-in zoom-in duration-300"
                >
                    <Sparkles className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}
