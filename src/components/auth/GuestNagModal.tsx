import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Clock } from 'lucide-react';

interface GuestNagModalProps {
    onSignupClick: () => void;
}

export function GuestNagModal({ onSignupClick }: GuestNagModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<'time' | 'usage'>('time');

    useEffect(() => {
        // Check usage count
        const openCount = parseInt(localStorage.getItem('guest_open_count') || '0');
        const newCount = openCount + 1;
        localStorage.setItem('guest_open_count', newCount.toString());

        if (newCount % 2 === 0) { // Every 2 opens
            setReason('usage');
            setIsOpen(true);
            return;
        }

        // Timer for 15 minutes
        const timer = setTimeout(() => {
            setReason('time');
            setIsOpen(true);
        }, 15 * 60 * 1000); // 15 minutes

        return () => clearTimeout(timer);
    }, []);

    const handleContinueGuest = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-violet-600">
                        {reason === 'time' ? <Clock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        {reason === 'time' ? "Time to Sync?" : "Secure Your Notes"}
                    </DialogTitle>
                    <DialogDescription>
                        {reason === 'time'
                            ? "You've been using Smart Notes for a while. Sign up to sync your notes across devices and ensure you never lose your data."
                            : "You've opened the app a few times as a guest. Create an account to enable cloud backup and advanced AI features."
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 text-sm text-violet-800">
                        Guest data is stored locally on this device. Clearing your browser cache will delete your notes.
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button onClick={onSignupClick} className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                        Create Free Account
                    </Button>
                    <Button variant="ghost" onClick={handleContinueGuest} className="w-full">
                        Continue as Guest
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
