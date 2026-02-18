import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, X } from 'lucide-react';

interface GuestNagModalProps {
    onSignupClick: () => void;
}

export function GuestNagModal({ onSignupClick }: GuestNagModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check cooldown
        const lastShown = parseInt(localStorage.getItem('last_guest_nag') || '0');
        const now = Date.now();
        const cooldown = 15 * 60 * 1000; // 15 mins

        if (now - lastShown < cooldown) {
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
            localStorage.setItem('last_guest_nag', Date.now().toString());
        }, 10000); // 10 seconds delay

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-violet-100 rounded-full px-5 py-3 flex items-center gap-4 max-w-[90vw] md:max-w-md">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-violet-600" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">Secure Your Notes</p>
                    <p className="text-xs text-gray-500 truncate">Create an account to backup data.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        onClick={onSignupClick}
                        className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4"
                    >
                        Sign Up
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
