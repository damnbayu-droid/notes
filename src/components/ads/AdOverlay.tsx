import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AdOverlay() {
    const { user, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        // Determine if user should see ads
        if (isLoading) return;

        // Check if user is the admin (damnbayu@gmail.com)
        const isAdmin = user?.email === 'damnbayu@gmail.com';

        // Check if user is verified in the admin list
        let isVerified = false;
        if (user?.email) {
            try {
                const savedUsers = localStorage.getItem('admin_users_list');
                if (savedUsers) {
                    const users = JSON.parse(savedUsers);
                    const currentUser = users.find((u: any) => u.email === user.email);
                    if (currentUser?.verified) {
                        isVerified = true;
                    }
                }
            } catch (e) {
                console.error("Failed to parse admin users list", e);
            }
        }

        // Logic: Show ads if NOT admin AND NOT verified, AND frequency conditions met
        if (!isAdmin && !isVerified && !isUnlocked) {
            const now = Date.now();
            const lastAdShown = parseInt(localStorage.getItem('last_ad_shown') || '0');
            // const appOpenCount = parseInt(sessionStorage.getItem('app_open_count') || '0'); // Unused

            // Increment session open count (using sessionStorage to track per session, 
            // but requirement says "Every 2 times click/open this web app". 
            // Persistent open count is better tracked in localStorage.)

            const persistentOpenCount = parseInt(localStorage.getItem('persistent_open_count') || '0');

            // We need to trigger this check once per mount.
            // Let's use a ref or just run this once.

            // Check conditions:
            // 1. 5 minutes (300000 ms) passed since last ad
            // 2. OR 2nd open (persistentOpenCount % 2 === 0)

            const timeElapsed = now - lastAdShown > 300000; // 5 mins
            const isEverySecondOpen = persistentOpenCount > 0 && persistentOpenCount % 2 === 0;

            if (timeElapsed || isEverySecondOpen) {
                setIsOpen(true);
                // We don't update last_ad_shown here, we update it when they unlock? 
                // Or when it's shown? Usually when shown.
                localStorage.setItem('last_ad_shown', now.toString());
            }
        }
    }, [user, isLoading, isUnlocked]);

    // Track app opens
    useEffect(() => {
        // Run once on mount
        const currentCount = parseInt(localStorage.getItem('persistent_open_count') || '0');
        localStorage.setItem('persistent_open_count', (currentCount + 1).toString());
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && isOpen && isUnlocked) {
            // Timer finished, close overlay
            setIsOpen(false);
        }
        return () => clearInterval(timer);
    }, [countdown, isOpen, isUnlocked]);

    const handleContinue = () => {
        // Open the new tab
        window.open('https://indonesianvisas.com', '_blank');

        // Start the 5-second countdown to unlock
        setIsUnlocked(true); // Mark as effectively unlocked, just waiting for timer
        setCountdown(5);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-2 border-violet-100 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-violet-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Free Version Access
                    </CardTitle>
                    <CardDescription className="text-base text-gray-500 max-w-sm mx-auto">
                        Support the developer to continue using the free version of Smart Notes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 text-center">
                        <p className="text-sm text-gray-600">
                            Click continue to support us. You'll be redirected briefly, and the app will unlock in <strong>5 seconds</strong>.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {countdown > 0 ? (
                            <Button
                                disabled
                                className="w-full h-12 text-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                            >
                                Unlocking in {countdown}s...
                            </Button>
                        ) : (
                            <Button
                                onClick={handleContinue}
                                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-200 transition-all hover:scale-[1.02]"
                            >
                                Click to Continue
                                <ExternalLink className="ml-2 w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-center text-gray-400">
                        Thank you for your support!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
