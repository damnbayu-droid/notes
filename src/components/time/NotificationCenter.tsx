import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, History, Calendar, Trash2, Plus, Settings } from 'lucide-react';

interface Alarm {
    id: string;
    time: string;
    label: string;
    enabled: boolean;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    type: string;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [activeTab, setActiveTab] = useState<'notifications' | 'alarms' | 'schedule'>('notifications');
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isAddingAlarm, setIsAddingAlarm] = useState(false);
    const [newTime, setNewTime] = useState('');
    const [newLabel, setNewLabel] = useState('');

    useEffect(() => {
        // Load Alarms
        const savedAlarms = localStorage.getItem('alarms');
        if (savedAlarms) setAlarms(JSON.parse(savedAlarms));

        // Load Notification History (if we implement a store for it)
        // For now, let's look at recent events or just use placeholders
        setNotifications([
            { id: '1', title: 'Welcome', message: 'Welcome to Smart Notes Secured and Encrypted.', time: 'Just now', type: 'success' },
            { id: '2', title: 'Auth System', message: 'Identity verified via Supabase.', time: '5m ago', type: 'info' }
        ]);
    }, [isOpen]);

    useEffect(() => {
        localStorage.setItem('alarms', JSON.stringify(alarms));
    }, [alarms]);

    const handleAddAlarm = () => {
        if (!newTime) return;
        const alarm: Alarm = { id: Date.now().toString(), time: newTime, label: newLabel || 'Alarm', enabled: true };
        setAlarms([...alarms, alarm]);
        setIsAddingAlarm(false);
        setNewTime('');
        setNewLabel('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-violet-100 ring-1 ring-black/5">
                <div className="flex flex-col h-[500px]">
                    {/* Header Tabs */}
                    <div className="flex p-1 bg-violet-50/50 border-b border-border gap-1">
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg transition-all ${activeTab === 'notifications' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:bg-white/50'}`}
                        >
                            <History className="w-3.5 h-3.5" />
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('alarms')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg transition-all ${activeTab === 'alarms' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:bg-white/50'}`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Alarms
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg transition-all ${activeTab === 'schedule' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:bg-white/50'}`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                        </button>
                        {/* Space for Dialog Close Button */}
                        <div className="w-10 shrink-0" />
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {activeTab === 'notifications' && (
                            <div className="space-y-3">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-3 bg-white border border-violet-50 rounded-xl shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-violet-900 leading-none">{n.title}</span>
                                            <span className="text-[9px] text-muted-foreground">{n.time}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 leading-tight">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'alarms' && (
                            <div className="space-y-3">
                                {alarms.map(alarm => (
                                    <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={() => setAlarms(alarms.map(a => a.id === alarm.id ? { ...a, enabled: !a.enabled } : a))}
                                                className={`cursor-pointer w-9 h-5 rounded-full relative transition-colors ${alarm.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${alarm.enabled ? 'left-4.5 translate-x-[-100%]' : 'left-0.5'}`} />
                                            </div>
                                            <div>
                                                <div className={`text-xl font-bold font-mono tracking-tighter ${alarm.enabled ? 'text-violet-900' : 'text-gray-400'}`}>{alarm.time}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium">{alarm.label}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => setAlarms(alarms.filter(a => a.id !== alarm.id))}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {isAddingAlarm ? (
                                    <div className="p-4 border border-violet-100 rounded-xl bg-violet-50/30 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase tracking-wider">Time</Label>
                                                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase tracking-wider">Label</Label>
                                                <Input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-8 text-sm" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingAlarm(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleAddAlarm} className="bg-violet-600 h-8">Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full border-dashed border-violet-200 text-violet-600 h-10 rounded-xl" onClick={() => setIsAddingAlarm(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Alarm
                                    </Button>
                                )}
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-50">
                                <Calendar className="w-8 h-8 mb-2 text-violet-300" />
                                <p className="text-xs font-bold text-violet-900 uppercase">Upcoming Events</p>
                                <p className="text-[10px] text-muted-foreground">Connected to your reminders & notes</p>
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-3 border-t border-border bg-gray-50/50 text-[9px] text-center text-muted-foreground font-medium flex items-center justify-center gap-1">
                        <Settings className="w-3 h-3" />
                        SYSTEM TIME (BALI/WITA): {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
