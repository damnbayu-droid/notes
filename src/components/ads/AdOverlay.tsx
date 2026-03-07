import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react';

const AD_INTERVAL = 300000; // 5 Minutes in MS
const UNLOCK_TIME = 5; // 5 Seconds countdown

export function AdOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [countdown, setCountdown] = useState(0);
    // lastTriggered tracks the start of the current 5-minute grace period.
    // Initializing to Date.now() ensures 5 minutes of peace after opening the app.
    const [lastTriggered, setLastTriggered] = useState<number>(Date.now());

    // Countdown logic for the next ad
    useEffect(() => {
        if (isOpen) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastTriggered;
            const remaining = Math.max(0, AD_INTERVAL - elapsed);

            // Update SearchBar via Custom Event
            window.dispatchEvent(new CustomEvent('ad-countdown-update', {
                detail: { remaining }
            }));

            if (remaining === 0) {
                setIsOpen(true);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, lastTriggered]);

    // Handle the 5-second unlock countdown when ad is active
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && isOpen && isUnlocked) {
            // Success! Reset everything
            setIsOpen(false);
            setIsUnlocked(false);
            const now = Date.now();
            setLastTriggered(now);
            localStorage.setItem('last_ad_shown', now.toString()); // Keep for history but trigger is session-based

            // Show success on Dynamic Island
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'App Unlocked', message: 'Thank you for your support!', type: 'success' }
            }));
        }
        return () => clearInterval(timer);
    }, [countdown, isOpen, isUnlocked]);

    const handleContinue = () => {
        // Open the sponsor tab
        window.open('https://indonesianvisas.com', '_blank');

        // Start the 5-second unlock timer
        setIsUnlocked(true);
        setCountdown(UNLOCK_TIME);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
            <Card className="w-full max-w-md shadow-2xl border-none bg-white rounded-[2rem] overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-8 text-center text-white relative">
                    <div className="absolute top-4 right-4 opacity-20">
                        <ShieldCheck className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/30">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight mb-2">
                            Support Window
                        </CardTitle>
                        <CardDescription className="text-white/80 font-medium">
                            To keep Smart Notes free, please briefly support our sponsors every 5 minutes.
                        </CardDescription>
                    </div>
                </div>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-500 text-center px-4 leading-relaxed">
                            Click below to open our sponsor site. The app will unlock automatically in <strong>{UNLOCK_TIME} seconds</strong> after you support.
                        </p>

                        <div className="pt-2">
                            {countdown > 0 ? (
                                <Button
                                    disabled
                                    className="w-full h-14 text-lg font-bold bg-gray-100 text-gray-400 rounded-2xl border-2 border-gray-100"
                                >
                                    Unlocking in {countdown}s...
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleContinue}
                                    className="w-full h-14 text-lg font-bold bg-black text-white hover:bg-gray-900 rounded-2xl shadow-xl transition-all active:scale-[0.98] group"
                                >
                                    Unlock Smart Notes
                                    <ExternalLink className="ml-2 w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secured & Verified Access</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
