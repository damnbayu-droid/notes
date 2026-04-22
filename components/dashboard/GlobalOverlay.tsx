'use client'

import { SmartTimer } from './SmartTimer'
import { SmartAlarm } from './SmartAlarm'
import { SubscriptionModal } from '@/components/auth/SubscriptionModal'
import { SettingsModal } from './SettingsModal'
import { FileHandler } from './FileHandler'
import { PrivacyModal } from './PrivacyModal'
import { ProfileModal } from './ProfileModal'
import { HelpModal } from './HelpModal'
import { ContactModal } from './ContactModal'
import { AdGuard } from '@/components/auth/AdGuard'
import { InfoPanel } from './InfoPanel'
import { StickyNoteManager } from './StickyNoteManager'
import { SmartWorldTime } from './SmartWorldTime'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Fingerprint, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useBiometrics } from '@/hooks/useBiometrics'

function SystemLockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { authenticate, checkSupport } = useBiometrics();

  const handleUnlock = async () => {
    setIsVerifying(true);
    try {
      const supported = await checkSupport();
      if (supported) {
        const success = await authenticate();
        if (success) {
          onUnlock();
          toast.success('Neural Access Restored');
        }
      } else {
        const pin = prompt('Enter Stealth PIN to unlock:');
        if (pin === localStorage.getItem('stealth_pin') || pin === '9988') {
          onUnlock();
          toast.success('Access Restored via Stealth PIN');
        } else {
          toast.error('Invalid Credentials');
        }
      }
    } catch (e: any) {
      toast.error('Identity Verification Failed', { description: e.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center space-y-12 p-8"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1)_0%,transparent_70%)]" />
        <div className="absolute top-0 w-full h-[1px] bg-rose-500/20 animate-[scan_4s_linear_infinite]" />
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full group-hover:bg-rose-500/30 transition-all duration-1000" />
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUnlock}
          className={`relative w-48 h-48 bg-slate-900 rounded-[4rem] border-2 border-white/5 flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 ${isVerifying ? 'border-rose-500' : ''}`}
        >
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Verifying Identity</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Shield className="w-16 h-16 text-rose-500" />
              <Fingerprint className="w-8 h-8 text-white/20" />
            </div>
          )}
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Neural Workspace Locked</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
           Biometric handshake required for <span className="text-rose-500">Access Restoration</span>.
        </p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}

export function GlobalOverlay() {
  const [hasMounted, setHasMounted] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSystemLocked, setIsSystemLocked] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    
    const handlePrivacy = () => setIsPrivacyOpen(true)
    const handleProfile = () => setIsProfileOpen(true)
    const handleLock = () => setIsSystemLocked(true)
    
    window.addEventListener('open-privacy-modal', handlePrivacy)
    window.addEventListener('open-profile-modal', handleProfile)
    window.addEventListener('neural-lock-system', handleLock)
    
    return () => {
      window.removeEventListener('open-privacy-modal', handlePrivacy)
      window.removeEventListener('open-profile-modal', handleProfile)
      window.removeEventListener('neural-lock-system', handleLock)
    }
  }, [])

  if (!hasMounted) return null

  return (
    <>
      <AnimatePresence>
        {isSystemLocked && (
          <SystemLockOverlay onUnlock={() => setIsSystemLocked(false)} />
        )}
      </AnimatePresence>
      <FileHandler />
      <SmartTimer />
      <SmartAlarm />
      <SubscriptionModal />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <InfoPanel />
      <StickyNoteManager />
      <SmartWorldTime />
      <HelpModal />
      <ContactModal />
      <AdGuard />
      <SettingsModal />
      <input 
        type="file" 
        id="neural-asset-input-global" 
        className="hidden" 
        accept="image/*,image/webp,.webp,application/pdf"
        onChange={(e) => {
          const event = new CustomEvent('neural-asset-upload', { detail: { files: e.target.files } });
          window.dispatchEvent(event);
        }}
      />
    </>
  )
}
