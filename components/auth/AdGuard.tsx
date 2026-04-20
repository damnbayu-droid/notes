'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Sparkles, Rocket, Heart, X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function AdGuard() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [isGracePeriod, setIsGracePeriod] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Initialize last support on first mount to ensure strict deferral (v14.2.2)
  useEffect(() => {
    const last = localStorage.getItem('smart_notes_last_support')
    if (!last) {
      localStorage.setItem('smart_notes_last_support', Date.now().toString())
    }
  }, [])
  
  // Smart Ad Logic: No instant activation, persistent timer, Route Restricted (Discovery)
  useEffect(() => {
    // Strict Exclusion: All community/discovery routes are Zero-Ads Zones
    if (pathname.includes('/discovery') || pathname.includes('/s/')) {
       setIsVisible(false);
       return;
    }

    if (user?.subscription_tier === 'full-intelligence' || user?.subscription_tier === 'enterprise-hub') {
       setIsVisible(false);
       return;
    }
    
    if (user?.role === 'admin' || user?.isSuperAdmin || user?.email === 'damnbayu@gmail.com') {
       if (isVisible) setIsVisible(false);
       return;
    }

    // Grace period for first load (e.g., 60s) for better performance scores
    const graceTimer = setTimeout(() => setIsGracePeriod(false), 60000);

    const interval = setInterval(() => {
      const now = Date.now();
      const lastSupportStr = localStorage.getItem('smart_notes_last_support') || '0';
      const lastSupport = parseInt(lastSupportStr);
      const frequency = isAuthenticated ? 15 * 60 * 1000 : 10 * 60 * 1000;
      
      const timeElapsed = now - lastSupport;
      
      // Strict Deferral: Only show if grace period is OVER AND interval is EXCEEDED
      if (!isGracePeriod && lastSupport > 0 && timeElapsed > frequency - 30000 && timeElapsed <= frequency) {
        const remaining = Math.max(0, Math.ceil((frequency - timeElapsed) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(null);
      }

      if (!isGracePeriod && lastSupport > 0 && (timeElapsed > frequency)) {
        setIsVisible(true);
      }
    }, 1000); 

    return () => {
      clearTimeout(graceTimer);
      clearInterval(interval);
    }
  }, [isAuthenticated, user, isGracePeriod, pathname])

  const handleSupport = () => {
    setIsRedirecting(true)
    setCountdown(3)
    
    window.open('https://indonesianvisas.com', '_blank')

    const countInterval = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(countInterval)
                return 0
            }
            return prev - 1
        })
    }, 1000)

    setTimeout(() => {
        localStorage.setItem('smart_notes_last_support', Date.now().toString())
        setShowSupport(false)
        setIsVisible(false)
        setIsRedirecting(false)
        setTimeLeft(null)
    }, 3000)
  }

  useEffect(() => {
    const handlePaymentOpen = () => {
      setIsVisible(false);
      setShowSupport(false);
    };
    window.addEventListener('open-payment-modal', handlePaymentOpen);
    return () => window.removeEventListener('open-payment-modal', handlePaymentOpen);
  }, []);

  // Pre-emptively suppress UI on discovery
  if (pathname.includes('/discovery') || pathname.includes('/s/')) return null;

  return (
    <AnimatePresence>
      {(isVisible || showSupport) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden border border-slate-100 dark:border-white/5"
          >
            {/* Visual background accents */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-violet-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40 rotate-12">
                <Shield className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  Support the Developer
                </h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Smart Notes is a mission-critical intelligence suite. To maintain our neural infrastructure and edge performance, we require your support.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <Button 
                  onClick={handleSupport}
                  disabled={isRedirecting}
                  className="h-16 rounded-[2rem] bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-violet-500/30 group relative overflow-hidden transition-all"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isRedirecting 
                        ? `Redirecting in ${countdown}s...` 
                        : <>Support For Ads {"-->"} indonesianvisas.com <Heart className="w-5 h-5 fill-white animate-pulse" /></>}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button 
                  variant="outline"
                  disabled={isRedirecting}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-payment-modal'));
                  }}
                  className="h-16 rounded-[2rem] border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Option Prices for Subscribe
                </Button>
              </div>

              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                {isRedirecting ? 'Neural Link Initializing...' : '* Redirecting To IndonesianVisas.com For Validation'}
              </p>
            </div>

            {/* Close button only for pro users or if it's just a recurring ad */}
            {isVisible && user?.subscription_tier !== 'free' && (
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* Small Floating Timer Overlay */}
      {timeLeft !== null && !isVisible && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-8 right-8 z-[500] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 italic">
            Neural Sync in {timeLeft}s
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
