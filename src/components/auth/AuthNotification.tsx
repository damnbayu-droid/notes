import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';

interface Notification {
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
}

export function AuthNotification() {
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        const handleNotification = (e: CustomEvent) => {
            setNotification(e.detail);
            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        };

        window.addEventListener('dcpi-notification' as any, handleNotification);
        return () => window.removeEventListener('dcpi-notification' as any, handleNotification);
    }, []);

    if (!notification) return null;

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 fade-in duration-500 pointer-events-none">
            <div className="bg-black/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 min-w-[280px] sm:min-w-[320px] max-w-[90vw] flex items-center gap-4 shadow-violet-500/20">
                <div className="p-2 bg-white/10 rounded-xl">
                    {notification.type === 'error' && <X className="w-5 h-5 text-red-500" />}
                    {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {(!notification.type || notification.type === 'info') && <Bell className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold leading-tight">{notification.title}</span>
                    {notification.message && (
                        <span className="text-xs text-white/70 leading-tight mt-1 line-clamp-2">
                            {notification.message}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
