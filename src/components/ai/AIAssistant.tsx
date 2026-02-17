import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Sparkles, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { askAI } from '@/lib/openai';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hi! I can help you organize your notes, draft content, or answer questions. What can I do for you?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useAuth();
    const { createNote } = useNotes(user);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const contextMessages: any[] = [
            {
                role: 'system',
                content: `You are the intelligent OS for MyNotes. You can manage notes and schedules directly.
            Current Date: ${new Date().toISOString()}
            
            Tools available:
            - create_note(title, content, folder): Create a new note.
            - schedule_reminder(task, datetime_iso): Schedule a reminder.
            
            scheduling_rules:
            - If user says "tomorrow", calculate date = now + 1 day.
            - If user says "1 day before [date]", parse [date] and subtract 1 day.
            - Always prefer ISO 8601 format for dates.
            - "on device" means simple notification.
            
            Always try to use tools when the user asks to perform an action.`
            },
            ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: input }
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
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-200 z-50 transition-transform hover:scale-105"
                >
                    <Sparkles className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b border-gray-100">
                    <SheetTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                        <Bot className="w-5 h-5 text-teal-500" />
                        AI Assistant
                    </SheetTitle>
                    <SheetDescription>
                        Powered by OpenAI
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-teal-600" />
                                    </div>
                                )}
                                <div
                                    className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4 text-violet-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-teal-600" />
                                </div>
                                <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                            className="bg-white"
                        />
                        <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="bg-violet-600 hover:bg-violet-700">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
