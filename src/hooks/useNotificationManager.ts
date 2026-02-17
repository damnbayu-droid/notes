import { useEffect, useState } from 'react';

interface NotificationManagerProps {
    notes: any[];
}

export function useNotificationManager({ notes }: NotificationManagerProps) {
    const [hasPermission, setHasPermission] = useState(false);
    const [hasMediaPermission, setHasMediaPermission] = useState(false);

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

    // Request media/audio permission for notification sounds
    const requestMediaPermission = async () => {
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
    };

    // Check reminders using Bali time
    const checkReminders = () => {
        if (!hasPermission || !notes || notes.length === 0) return;

        const now = new Date();

        notes.forEach((note: any) => {
            if (note.reminder_date) {
                const reminderTime = new Date(note.reminder_date);

                const diff = now.getTime() - reminderTime.getTime();

                // Check if due within the last 30 seconds to catch it once
                if (diff > 0 && diff < 30000) {
                    // Create notification
                    const notification = new Notification(`Reminder: ${note.title}`, {
                        body: note.content.substring(0, 100) || 'You have a note reminder.',
                        icon: '/vite.svg',
                        badge: '/vite.svg',
                        tag: note.id, // Prevent duplicate notifications
                        requireInteraction: true, // Keep notification visible until user interacts
                    });

                    // Play notification sound if media permission granted
                    if (hasMediaPermission) {
                        playNotificationSound();
                    }

                    // Handle notification click
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                        // Could navigate to the note here
                    };
                }
            }
        });
    };

    // Play notification sound
    const playNotificationSound = () => {
        try {
            // Use Web Audio API for notification sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    };

    // Check reminders every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(checkReminders, 10000);
        return () => clearInterval(intervalId);
    }, [notes, hasPermission, hasMediaPermission]);

    // Auto-calibrate time every 6 hours
    useEffect(() => {
        const calibrateInterval = setInterval(() => {
            // Force re-check of reminders with calibrated time
            checkReminders();
        }, 6 * 60 * 60 * 1000); // 6 hours

        return () => clearInterval(calibrateInterval);
    }, [notes, hasPermission]);

    return {
        hasPermission,
        hasMediaPermission,
        requestMediaPermission,
    };
}
