import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User as UserIcon, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { askAI } from '@/lib/openai';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';


interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface AIChatWindowProps {
    onClose: () => void;
    initialMessage?: string | null;
    onClearInitialMessage?: () => void;
}

export default function AIChatWindow({ onClose, initialMessage, onClearInitialMessage }: AIChatWindowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hi! I can help you organize your notes, draft content, or answer questions. What can I do for you?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useAuth();
    const { createNote } = useNotes(user);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load initial message if present
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
            handleSend(initialMessage);
            if (onClearInitialMessage) onClearInitialMessage();
        }
    }, [initialMessage]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim()) return;

        const userMsg: Message = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Get Bali Time (Asia/Makassar)
        const baliTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar', hour12: true });
        const baliDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Makassar', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const contextMessages: any[] = [
            {
                role: 'system',
                content: `You are Note Ai, the intelligent OS for Smart Notes. You can manage notes and schedules directly.
            
            Current Time (Bali/WITA): ${baliDate}, ${baliTime}
            
            Tools available:
            - create_note(title, content, folder): Create a new note.
            - schedule_reminder(task, datetime_iso): Schedule a reminder.
            
            scheduling_rules:
            - You MUST use the provided Bali Time as "now".
            - If user says "tomorrow", add 1 day to the Bali date.
            - If user says "at 5 PM", use 5:00 PM Bali time.
            - Always prefer ISO 8601 format for dates.
            - "on device" means simple notification.
            
            Personality:
            - You are honest, truthful, and helpful.
            - Speak naturally like a human.
            - Keep responses concise unless asked to elaborate.`
            },
            ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: textToSend }
        ];

        try {
            // @ts-ignore
            const response = await askAI(contextMessages);
            let content = response.content || '';

            if (response.tool_calls) {
                for (const toolCall of response.tool_calls) {
                    // @ts-ignore
                    const functionName = toolCall.function.name;
                    // @ts-ignore
                    const args = JSON.parse(toolCall.function.arguments);

                    if (functionName === 'create_note') {
                        content += `\n\n[Action] Creating note: "${args.title}"...`;
                        await createNote({
                            title: args.title,
                            content: args.content,
                            folder: args.folder || 'Main'
                        });
                        content += `\n[Success] Note created!`;
                    } else if (functionName === 'schedule_reminder') {
                        content += `\n\n[Action] Scheduling reminder for: "${args.task}" at ${new Date(args.datetime_iso).toLocaleString()}...`;
                        await createNote({
                            title: `Reminder: ${args.task} `,
                            content: `Scheduled reminder by AI`,
                            reminder_date: args.datetime_iso,
                            folder: 'Main'
                        });
                        content += `\n[Success] Reminder set!`;
                    }
                }
            }

            if (!content && !response.tool_calls) {
                content = "I'm sorry, I couldn't process that.";
            }

            setMessages(prev => [...prev, { role: 'ai', content: content || "Done!" }]);
        } catch (error: any) {
            console.error("AIAssistant Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please checks your API key or connection.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`fixed bottom-24 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'w-[90vw] h-[80vh] sm:w-[600px] sm:h-[700px]' : 'w-[350px] h-[500px]'
                }`}
        >
            <Card className="flex flex-col h-full shadow-2xl border-violet-100 overflow-hidden ring-1 ring-black/5">
                <CardHeader className="p-4 bg-gradient-to-r from-violet-600 to-purple-600 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white text-base">
                            <Bot className="w-5 h-5" />
                            NoteAi
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => setIsExpanded(!isExpanded)}
                                aria-label={isExpanded ? "Minimize chat" : "Maximize chat"}
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={onClose}
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50">
                    <ScrollArea className="h-full px-4 py-4">
                        <div className="space-y-4 pr-3">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'ai' && (
                                        <div className="w-8 h-8 rounded-full bg-white border border-violet-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                            <Bot className="w-4 h-4 text-violet-600" />
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        <pre className="whitespace-pre-wrap font-sans break-words">{msg.content}</pre>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                            <UserIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-white border border-violet-100 flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot className="w-4 h-4 text-violet-600" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 flex items-center shadow-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                        <span className="ml-2 text-xs text-gray-400">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-3 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex w-full gap-2 items-center">
                        <VoiceRecorder
                            onTranscriptionComplete={(text) => {
                                setInput(prev => prev + text);
                            }}
                            onRecordingComplete={() => {
                                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                    detail: { title: 'Success', message: "Voice command captured", type: 'success' }
                                }));
                            }}
                            className="shrink-0"
                        />
                        <Input
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                            className="flex-1 focus-visible:ring-violet-500"
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
