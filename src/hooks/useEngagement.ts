import { useEffect } from 'react';
import type { User } from '@/types';

export function useEngagement(user: User | null) {
    useEffect(() => {
        const notify = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title, message, type }
            }));
        };

        const timers: NodeJS.Timeout[] = [];

        // --- ADS TIMERS (5, 10, 15, 30 min) ---
        const adIntervals = [5, 10, 15, 30];
        adIntervals.forEach(min => {
            timers.push(setTimeout(() => {
                // Placeholder for Ad logic - for now a notification
                notify('Special Offer', `Keep using Smart Notes! This free version is powered by Bali.Enterprises.`, 'info');
            }, min * 60 * 1000));
        });

        // --- SIGN UP TIMERS (6, 16 min) ---
        if (!user) {
            const signUpIntervals = [6, 16];
            signUpIntervals.forEach((min, index) => {
                timers.push(setTimeout(() => {
                    const hasSeen = localStorage.getItem(`seen_signup_prompt_${index}`);
                    if (!hasSeen) {
                        notify('Secure Your Notes', 'Sign up now to sync your notes across devices and enable advanced encryption.', 'success');
                    }
                }, min * 60 * 1000));
            });
        }

        // --- AUTO SYNC ASK (10 min) ---
        timers.push(setTimeout(() => {
            notify('Cloud Sync', 'It has been 10 minutes. Click "Sync Drive" to ensure your local notes are synchronized.', 'info');
        }, 10 * 60 * 1000));

        // --- PHONE / NOTIFICATION ASK (6 min or on login) ---
        const askNotifications = () => {
            if ('Notification' in window && Notification.permission === 'default') {
                notify('Stay Connected', 'Enable browser notifications to receive reminders and security alerts on your phone.', 'info');
            }
        };

        timers.push(setTimeout(askNotifications, 6 * 60 * 1000));

        return () => timers.forEach(t => clearTimeout(t));
    }, [user]);

    // Handle immediate triggers on Login
    useEffect(() => {
        if (user) {
            // Auto ask for notifications on login if not set
            if ('Notification' in window && Notification.permission === 'default') {
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: {
                        title: 'Enable Notifications',
                        message: 'Get your note reminders on the go!',
                        type: 'info'
                    }
                }));
            }
        }
    }, [user]);
}
