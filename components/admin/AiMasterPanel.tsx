'use client'

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bot,
    Send,
    ShieldAlert,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Database,
    Zap,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { askAI } from '@/lib/ai';

export function AiMasterPanel() {
    const supabase = createClient();
    const [personaChat, setPersonaChat] = useState<{role: string, content: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [discoveryFiles, setDiscoveryFiles] = useState<any[]>([]);
    const [aiLogs, setAiLogs] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchSystem = async () => {
            // Fetch Persona
            const { data: sysData } = await supabase.from('system_settings').select('value').eq('key', 'ai_persona').single();
            if (sysData && sysData.value?.prompt) {
                setPersonaChat([{ role: 'system', content: `Current Core Directive:\n${sysData.value.prompt}` }]);
            } else {
                setPersonaChat([{ role: 'system', content: 'No active persona found.' }]);
            }

            // Fetch Discovery Files
            const { data: discData } = await supabase.from('notes').select('id, title, user_id, updated_at, is_discoverable').eq('is_discoverable', true).order('updated_at', { ascending: false });
            setDiscoveryFiles(discData || []);

            // Fetch Logs
            const { data: logData } = await supabase.from('ai_logs').select('*').order('created_at', { ascending: false }).limit(50);
            setAiLogs(logData || []);
        };
        fetchSystem();
    }, [supabase]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [personaChat]);

    const handleSendDirectives = async () => {
        if (!chatInput.trim()) return;
        const newMsg = chatInput;
        setChatInput('');
        setPersonaChat(p => [...p, { role: 'admin', content: newMsg }]);

        // Extract complete history as the new Persona
        const newPromptContext = personaChat.map(p => p.content).join('\n\n') + '\n\nUpdate: ' + newMsg;
        
        setIsSaving(true);
        const { error } = await supabase.from('system_settings').upsert({
            key: 'ai_persona',
            value: { prompt: newPromptContext }
        });
        
        if (!error) {
            setPersonaChat(p => [...p, { role: 'system', content: 'Neural pathways updated. New directives codified into memory.' }]);
            
            // Log immutable event
            await supabase.from('ai_logs').insert({
                action: 'persona_updated',
                details: { new_rule: newMsg },
                severity: 'warning'
            });
            toast.success('Persona Synced');
        } else {
            toast.error('Sync Failed');
        }
        setIsSaving(false);
    };

    const toggleDiscovery = async (id: string, currentStatus: boolean) => {
        try {
            await supabase.from('notes').update({ is_discoverable: !currentStatus }).eq('id', id);
            setDiscoveryFiles(prev => prev.filter(f => f.id !== id));
            toast.success(`File ${!currentStatus ? 'Published' : 'Revoked'}`);
            
            await supabase.from('ai_logs').insert({
                action: !currentStatus ? 'manual_publish' : 'manual_revoke',
                details: { target: id },
                severity: 'info'
            });
        } catch (e: any) {
            toast.error('Failed to change status');
        }
    };

    const runAIAudit = async (fileId: string) => {
        toast.info('Initiating Neural Audit...');
        
        try {
            // Fetch content
            const { data: fileData } = await supabase.from('notes').select('content, title').eq('id', fileId).single();
            if (!fileData) throw new Error('File lost');

            // Extract Persona
            const sysPersona = personaChat.find(p => p.role === 'system')?.content || 'You are an auditor.';

            // Run AI
            const response = await askAI([
                { role: 'system', content: sysPersona + "\nOutput exactly 'PASS' if the note is good and contains real information. Output exactly 'FAIL: [reason]' if it is empty, gibberish, or garbage." },
                { role: 'user', content: `Title: ${fileData.title}\nContent: ${fileData.content.replace(/<[^>]+>/g, '').substring(0, 500)}` }
            ]);

            const aiVerdict = response.content?.toString().trim() || 'FAIL: No response';
            
            if (aiVerdict.startsWith('PASS')) {
                toast.success('Audit Pass: Intelligence verified.');
                const logEntry = { action: 'audit_pass', details: { target: fileId }, severity: 'info' };
                await supabase.from('ai_logs').insert(logEntry);
                setAiLogs(prev => [{ id: crypto.randomUUID(), ...logEntry, created_at: new Date().toISOString() }, ...prev]);
            } else {
                toast.error(`Audit Fail: ${aiVerdict}. Revoking.`);
                await toggleDiscovery(fileId, true); // Revoke
                const logEntry = { action: 'audit_fail_revoke', details: { target: fileId, reason: aiVerdict }, severity: 'critical' };
                await supabase.from('ai_logs').insert(logEntry);
                setAiLogs(prev => [{ id: crypto.randomUUID(), ...logEntry, created_at: new Date().toISOString() }, ...prev]);
            }
        } catch (e: any) {
            toast.error('Audit crashed: ' + e.message);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in fade-in zoom-in-95 duration-700">
            {/* Left: Chat & Controls */}
            <div className="flex flex-col gap-8 h-full">
                <Card className="flex-1 flex flex-col p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-tight">Master Intelligence</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5"><Zap className="w-3 h-3"/> Active & Learning</p>
                        </div>
                    </div>
                    
                    <ScrollArea className="flex-1 pr-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="space-y-6">
                            {personaChat.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{msg.role === 'system' ? 'Neural Core' : 'Admin Authority'}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed shadow-sm ${
                                        msg.role === 'admin' 
                                            ? 'bg-violet-600 text-white rounded-tr-sm' 
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                    }`}>
                                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="mt-4 flex gap-2">
                        <Input 
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendDirectives()}
                            placeholder="Instruct the AI regarding Discovery evaluation standards..."
                            className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500 font-medium"
                        />
                        <Button 
                            onClick={handleSendDirectives}
                            disabled={isSaving || !chatInput.trim()}
                            className="h-14 w-14 rounded-2xl bg-violet-600 shadow-lg shadow-violet-500/20 shrink-0"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right: Discovery Auditor & Logs */}
            <div className="flex flex-col gap-8 h-full">
                <Card className="flex-1 p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <Database className="w-4 h-4 text-violet-600" /> Discovery Network Control
                    </h3>
                    
                    <ScrollArea className="flex-1 -mx-2 px-2 custom-scrollbar">
                        <div className="space-y-3">
                            {discoveryFiles.map(file => (
                                <div key={file.id} className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{file.title || 'Untitled Matrix'}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">ID: {file.id.split('-')[0]}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border-dashed" onClick={() => runAIAudit(file.id)}>
                                            <Bot className="w-3.5 h-3.5 mr-1 text-violet-600" /> Audit
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 hover:bg-rose-50 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest border-rose-200 dark:border-rose-900" onClick={() => toggleDiscovery(file.id, file.is_discoverable)}>
                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Revoke
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600" onClick={() => window.open(`/?view=notes&id=${file.id}`, '_blank')}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {discoveryFiles.length === 0 && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-12">No files active on Discovery Grid</p>}
                        </div>
                    </ScrollArea>
                </Card>

                <Card className="h-64 p-6 rounded-[2.5rem] bg-slate-950 border-0 shadow-2xl overflow-hidden flex flex-col relative text-emerald-500 font-mono text-[10px]">
                    <div className="absolute top-4 right-6 text-slate-700 flex items-center gap-2 font-sans font-black uppercase tracking-widest opacity-50">
                        <Lock className="w-3 h-3" /> Immutable Core
                    </div>
                    <div className="mb-4 font-black uppercase tracking-widest text-white/50 pb-4 border-b border-white/5">System Terminal | Neural Logs</div>
                    <ScrollArea className="flex-1 custom-scrollbar">
                        <div className="space-y-2 opacity-80">
                            {aiLogs.map((log, x) => (
                                <div key={x} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded-sm">
                                    <span className="text-slate-600 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span className={log.severity === 'critical' ? 'text-rose-500 font-bold' : log.severity === 'warning' ? 'text-amber-500' : 'text-emerald-400'}>
                                        {log.action.toUpperCase()}: {JSON.stringify(log.details)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
