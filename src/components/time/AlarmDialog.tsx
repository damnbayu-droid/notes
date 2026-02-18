import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Bell, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Alarm {
    id: string;
    time: string; // HH:mm format
    label: string;
    enabled: boolean;
    days: number[]; // 0-6, 0 = Sunday
}

interface AlarmDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AlarmDialog({ isOpen, onClose }: AlarmDialogProps) {
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newTime, setNewTime] = useState('');
    const [newLabel, setNewLabel] = useState('');

    // Load alarms from storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('alarms');
        if (saved) {
            try {
                setAlarms(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse alarms", e);
            }
        }
    }, []);

    // Save alarms when changed
    useEffect(() => {
        localStorage.setItem('alarms', JSON.stringify(alarms));
    }, [alarms]);

    // Check for alarms every minute (or second) - simpler logic here, 
    // real checking should be in a global context/hook (like App.tsx), 
    // but for now let's just manage the list here.
    // The App.tsx notification logic (Phase 2) handles "Reminder" notes.
    // We might need to unify this, or run a separate check.
    // For this task, we create the UI. 
    // The "Alarm Logic" in App.tsx might need to be updated to read 'alarms' too.

    const handleAddAlarm = () => {
        if (!newTime) return;

        const alarm: Alarm = {
            id: Date.now().toString(),
            time: newTime,
            label: newLabel || 'Alarm',
            enabled: true,
            days: [0, 1, 2, 3, 4, 5, 6] // Default daily for now, can expand later
        };

        setAlarms([...alarms, alarm]);
        setIsAdding(false);
        setNewTime('');
        setNewLabel('');
        toast.success("Alarm set for " + newTime + " (Bali Time)");
    };

    const toggleAlarm = (id: string) => {
        setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    };

    const deleteAlarm = (id: string) => {
        setAlarms(alarms.filter(a => a.id !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-violet-600" />
                        Alarms (Bali Time)
                    </DialogTitle>
                    <DialogDescription>
                        Set alarms for your daily tasks.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {alarms.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No alarms set.
                        </div>
                    )}

                    {alarms.map(alarm => (
                        <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => toggleAlarm(alarm.id)}
                                    className={`cursor-pointer w-10 h-6 rounded-full relative transition-colors ${alarm.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alarm.enabled ? 'left-5' : 'left-1'}`} />
                                </div>
                                <div className={alarm.enabled ? 'opacity-100' : 'opacity-50'}>
                                    <div className="text-2xl font-bold font-mono tracking-tight">{alarm.time}</div>
                                    <div className="text-xs text-muted-foreground">{alarm.label}</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteAlarm(alarm.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {isAdding ? (
                        <div className="p-4 border border-violet-200 rounded-lg bg-violet-50/50 space-y-3 animate-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Time (WITA)</Label>
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="font-mono text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    placeholder="Wake up, Meeting, etc."
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddAlarm} disabled={!newTime} className="bg-violet-600 hover:bg-violet-700">Save</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed border-violet-200 text-violet-600 hover:bg-violet-50" onClick={() => setIsAdding(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Alarm
                        </Button>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <p className="text-[10px] text-muted-foreground">
                        * Alarms will notify you based on Bali Time.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
