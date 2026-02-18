import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

interface NotificationManagerProps {
    notes: any[];
}

export function useNotificationManager({ notes }: NotificationManagerProps) {
    const [hasPermission, setHasPermission] = useState(false);
    const [hasMediaPermission, setHasMediaPermission] = useState(false);
    const [processedAlarms, setProcessedAlarms] = useState<Set<string>>(new Set());

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setHasPermission(true);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                    setHasPermission(permission === 'granted');
                });
            }
        }
    }, []);

    const dispatchDynamicStatus = (text: string, type: 'info' | 'record' | 'scan' = 'info') => {
        const event = new CustomEvent('dynamic-status', {
            detail: { icon: null, text, type, duration: 8000 } // 8s duration for DCPI
        });
        window.dispatchEvent(event);
    };

    // Check reminders & alarms
    const checkNotifications = () => {
        if (!hasPermission) return;

        const now = new Date();
        const BALI_TZ = 'Asia/Makassar';

        // 1. Check Notes Reminders
        if (notes && notes.length > 0) {
            notes.forEach((note: any) => {
                if (note.reminder_date) {
                    const reminderTime = new Date(note.reminder_date);
                    const diff = now.getTime() - reminderTime.getTime();
                    // Check if due within last 30s
                    if (diff > 0 && diff < 30000) {
                        triggerNotification(`Reminder: ${note.title}`, note.content, note.id);
                    }
                }
            });
        }

        // 2. Check Alarms (Bali Time)
        // Read from localStorage to get latest
        try {
            const savedAlarms = JSON.parse(localStorage.getItem('alarms') || '[]');
            const currentBaliTime = formatInTimeZone(now, BALI_TZ, 'HH:mm');
            // AlarmDialog uses: 0-6. Let's assume 0=Sun, 1=Mon...
            // date-fns format 'i' returns ISO day of week (1-7). 7 is Sunday.
            // Let's adjust: if 'i' is 7, use 0. Else use 'i'.
            const isoDay = parseInt(formatInTimeZone(now, BALI_TZ, 'i'));
            const dayIndex = isoDay === 7 ? 0 : isoDay;

            savedAlarms.forEach((alarm: any) => {
                if (alarm.enabled && alarm.time === currentBaliTime && alarm.days.includes(dayIndex)) {
                    // Create unique ID for this instance (ID + Date + Time)
                    const instanceId = `${alarm.id}-${formatInTimeZone(now, BALI_TZ, 'yyyy-MM-dd-HH-mm')}`;

                    if (!processedAlarms.has(instanceId)) {
                        triggerNotification(`Alarm: ${alarm.label}`, `It is ${alarm.time} (Bali Time)`, instanceId);
                        // Add to processed set
                        setProcessedAlarms(prev => {
                            const newSet = new Set(prev);
                            newSet.add(instanceId);
                            return newSet;
                        });
                    }
                }
            });
        } catch (e) {
            console.error("Error checking alarms", e);
        }
    };

    const triggerNotification = (title: string, body: string, tag: string) => {
        // System Notification
        const notification = new Notification(title, {
            body: body,
            icon: '/vite.svg',
            tag: tag,
            requireInteraction: true,
        });

        // Sound
        if (hasMediaPermission) {
            playNotificationSound();
        }

        // DCPI (Dynamic Island)
        dispatchDynamicStatus(title, 'info');

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    };

    // Play notification sound
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Play a pleasant chime: High -> Low
            const now = audioContext.currentTime;

            oscillator.frequency.setValueAtTime(880, now); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5); // A4

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);

            oscillator.start(now);
            oscillator.stop(now + 1);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    };

    // Check every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(checkNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [notes, hasPermission, hasMediaPermission, processedAlarms]);


    // Auto-calibrate time every 6 hours
    useEffect(() => {
        const calibrateInterval = setInterval(() => {
            // Force re-check of reminders with calibrated time
            checkNotifications();
        }, 6 * 60 * 60 * 1000); // 6 hours

        return () => clearInterval(calibrateInterval);
    }, [notes, hasPermission]);

    return {
        hasPermission,
        hasMediaPermission,
        requestMediaPermission: async () => {
            try {
                // Request microphone access (this also enables audio playback)
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just needed permission
                setHasMediaPermission(true);
                return true;
            } catch (error) {
                console.error('Media permission denied:', error);
                return false;
            }
        },
    };
}
