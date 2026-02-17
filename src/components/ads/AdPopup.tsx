import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Lock } from 'lucide-react';

export function AdPopup() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const ADMIN_EMAIL = 'damnbayu@gmail.com';
    const POPUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

    useEffect(() => {
        if (!user || user.email === ADMIN_EMAIL) return;

        const timer = setInterval(() => {
            setIsOpen(true);
        }, POPUP_INTERVAL);

        return () => clearInterval(timer);
    }, [user]);

    const handleContinue = () => {
        window.open('https://indonesianvisas.com', '_blank');
        setIsOpen(false);
    };

    // If user is not logged in or is admin, don't render anything (or timer won't start)
    if (!user || user.email === ADMIN_EMAIL) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing by clicking outside or escape, force user to interact
            if (!open) return;
            // Actually, we want to force the click. So maybe we don't allow closing via normal means?
            // But for better UX, maybe we let them close ONLY after clicking?
            // The requirement says: "after they click it and redirect, they can continue"
            // So we strictly control the close.
        }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Lock className="w-5 h-5 text-violet-600" />
                        Session Check
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        To continue using the free version of MyNotes, please verify your session by visiting our partner site.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                        <p className="text-sm text-violet-800 font-medium">
                            Click the button below to continue working on your notes.
                        </p>
                    </div>
                    <Button
                        onClick={handleContinue}
                        className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 gap-2 shadow-lg shadow-violet-200"
                    >
                        Continue to App <ExternalLink className="w-5 h-5" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
