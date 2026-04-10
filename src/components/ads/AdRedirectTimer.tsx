import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Zap, ShieldCheck } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AdRedirectTimerProps {
  hasAds: boolean;
  user: User | null;
  onUpgrade: () => void;
}

export function AdRedirectTimer({ hasAds, user, onUpgrade }: AdRedirectTimerProps) {
  const [, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [showInterstitial, setShowInterstitial] = useState(false);

  useEffect(() => {
    if (!hasAds) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowInterstitial(true);
          return 15 * 60; // Reset
        }
        
        // Broadcast remaining time for UI indicators (e.g. in SearchBar)
        window.dispatchEvent(new CustomEvent('ad-countdown-update', { 
            detail: { remaining: (prev - 1) * 1000 } 
        }));
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [hasAds]);

  // Automatically hide interstitial if ads are removed (e.g. successful payment)
  useEffect(() => {
    if (!hasAds && showInterstitial) {
      setShowInterstitial(false);
    }
  }, [hasAds, showInterstitial]);

  if (!showInterstitial) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-500" />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-950 rounded-[2.5rem] p-10 shadow-2xl border border-violet-100 dark:border-violet-900/30 text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="w-20 h-20 bg-violet-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <Zap className="w-10 h-10 text-white fill-white" />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-tight">Support Smart Notes</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium leading-relaxed">
          You are using the <span className="text-violet-600 font-bold uppercase">Limited Tier</span>. To continue using the platform for free, please visit our sponsor or upgrade to <span className="text-emerald-600 font-bold uppercase tracking-widest">Full Access</span>.
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          <Button
            size="lg"
            className="h-14 bg-black dark:bg-violet-600 hover:brightness-110 text-white font-black uppercase tracking-widest rounded-2xl gap-3 text-xs w-full shadow-xl transition-all active:scale-95"
            onClick={async () => {
                window.open('https://indonesianvisas.com', '_blank');
                setShowInterstitial(false);
                
                if (user) {
                  // Permanent ad-blocking reward for engagement
                  const { error } = await supabase
                    .from('profiles')
                    .update({ ads_disabled: true })
                    .eq('id', user.id);
                  
                  if (!error) {
                    window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                        detail: { title: 'Neural Access Granted', message: 'Ads disabled. Thank you for your support!', type: 'success' } 
                    }));
                  }
                } else {
                  window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                      detail: { title: 'Thank You!', message: 'Ad break complete. Enjoy your session.', type: 'info' } 
                  }));
                }
            }}
          >
            Support & Continue <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="h-14 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest rounded-2xl gap-3 text-xs w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shadow-sm"
            onClick={() => {
                // DON'T setShowInterstitial(false) here. 
                // The block should stay until the payment is detected and hasAds becomes false.
                onUpgrade();
            }}
          >
            Upgrade to Ad-Free <ShieldCheck className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold opacity-60">Redirect helps keep Smart Notes free for everyone</p>
      </div>
    </div>
  );
}
