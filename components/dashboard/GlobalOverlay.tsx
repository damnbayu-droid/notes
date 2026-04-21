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
import { useState, useEffect } from 'react'

export function GlobalOverlay() {
  const [hasMounted, setHasMounted] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    
    const handlePrivacy = () => setIsPrivacyOpen(true)
    const handleProfile = () => setIsProfileOpen(true)
    
    window.addEventListener('open-privacy-modal', handlePrivacy)
    window.addEventListener('open-profile-modal', handleProfile)
    
    return () => {
      window.removeEventListener('open-privacy-modal', handlePrivacy)
      window.removeEventListener('open-profile-modal', handleProfile)
    }
  }, [])

  if (!hasMounted) return null

  return (
    <>
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
