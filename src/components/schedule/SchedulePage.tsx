import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { askAI } from '@/lib/openai';
import { toast } from 'sonner';

export function SchedulePage() {
    const { user } = useAuth();
    const { notes, updateNote, createNote } = useNotes(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isScheduling, setIsScheduling] = useState(false);

    // Get notes with reminders
    const scheduledNotes = useMemo(() => {
        return notes.filter(note => note.reminder_date && !note.is_archived);
    }, [notes]);

    // Get notes for selected date
    const notesForSelectedDate = useMemo(() => {
        return scheduledNotes.filter(note =>
            note.reminder_date && isSameDay(new Date(note.reminder_date), selectedDate)
        ).sort((a, b) => new Date(a.reminder_date!).getTime() - new Date(b.reminder_date!).getTime());
    }, [scheduledNotes, selectedDate]);

    // Calendar generation
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleAutoSchedule = async () => {
        setIsScheduling(true);
        try {
            // 1. Identify tasks needing schedule (no reminder)
            const backlog = notes.filter(n => !n.reminder_date && !n.is_archived);
            if (backlog.length === 0) {
                toast.info("No unscheduled tasks found.");
                return;
            }

            // 2. Prepare context for AI
            const existingSchedule = scheduledNotes.map(n => ({
                title: n.title,
                time: n.reminder_date
            }));

            const tasksToSchedule = backlog.slice(0, 5).map(n => ({ // Limit to 5 for demo
                id: n.id,
                title: n.title,
                content: n.content
            }));

            const prompt = `
                I have a list of unscheduled tasks and my current schedule.
                Please assign a realistic deadline/reminder for the unscheduled tasks starting from tomorrow.
                Spread them out reasonably (e.g., 1-2 tasks per day).
                
                Current Time: ${new Date().toISOString()}
                
                Existing Schedule:
                ${JSON.stringify(existingSchedule)}
                
                Tasks to Schedule:
                ${JSON.stringify(tasksToSchedule)}
                
                Return a JSON object where keys are Note IDs and values are ISO 8601 date strings.
                Example: { "note-id-1": "2023-10-27T10:00:00.000Z" }
            `;

            // 3. Call AI
            // We use a simplified direct call logic here, assuming askAI can handle raw prompt or we structure it as messages
            const response = await askAI([
                { role: 'system', content: 'You are a helpful scheduling assistant. Return ONLY valid JSON.' },
                { role: 'user', content: prompt }
            ]);

            const content = response.content;
            // Parse JSON (simple extraction)
            const jsonMatch = content?.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse schedule from AI");

            const scheduleMap = JSON.parse(jsonMatch[0]);

            // 4. Apply updates
            let count = 0;
            for (const [noteId, dateStr] of Object.entries(scheduleMap)) {
                if (dateStr && typeof dateStr === 'string') {
                    await updateNote(noteId, { reminder_date: dateStr });
                    count++;
                }
            }

            toast.success(`Automatically scheduled ${count} tasks!`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to auto-schedule. Try again.");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleAddEvent = async () => {
        // Create a new note for the selected date
        // Default time: 9 AM
        const date = new Date(selectedDate);
        date.setHours(9, 0, 0, 0);

        await createNote({
            title: 'New Event',
            content: '',
            reminder_date: date.toISOString(),
            folder: 'Schedule'
        });
        toast.success("Event created!");
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-2">
            {/* Calendar Section */}
            <div className="flex-1 space-y-4">
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-xl font-bold text-gray-800">
                            {format(currentDate, 'MMMM yyyy')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date())}>
                                <span className="text-xs font-semibold">Today</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day) => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isTodayDate = isToday(day);
                                const hasEvents = scheduledNotes.some(n => n.reminder_date && isSameDay(new Date(n.reminder_date), day));

                                // Placeholder for correct grid alignment if starting mid-week?
                                // Date-fns `eachDayOfInterval` returns exact days. We might need padding.
                                // simpler to just map.

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            h-10 md:h-14 rounded-xl flex flex-col items-center justify-center relative transition-all
                                            ${isSelected
                                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-105'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }
                                            ${isTodayDate && !isSelected ? 'text-violet-600 font-bold bg-violet-50' : ''}
                                        `}
                                    >
                                        <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {hasEvents && (
                                            <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-violet-500'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar / Event List */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4">
                <Card className="flex-1 border-0 shadow-sm bg-white/80 backdrop-blur-sm flex flex-col max-h-[calc(100vh-140px)]">
                    <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-violet-500" />
                                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
                            </CardTitle>
                            <Button size="sm" onClick={handleAddEvent} className="h-8 w-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {notesForSelectedDate.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No events scheduled
                                </div>
                            ) : (
                                notesForSelectedDate.map(note => (
                                    <div key={note.id} className="group flex flex-col gap-1 p-3 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-violet-100 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800 line-clamp-1">{note.title || 'Untitled'}</span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {note.reminder_date && format(new Date(note.reminder_date), 'h:mm a')}
                                            </span>
                                        </div>
                                        {note.content && (
                                            <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-600 to-purple-700 text-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Auto-Schedule</h3>
                            <p className="text-xs text-white/80">Let AI arrange your tasks</p>
                        </div>
                        <Button
                            onClick={handleAutoSchedule}
                            disabled={isScheduling}
                            className="bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                            {isScheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
