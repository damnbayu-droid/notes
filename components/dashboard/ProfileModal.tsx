'use client'

import { useState, useRef, useEffect } from 'react'
import { X, User, Camera, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HardDrive, Database, Key, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadNoteAsset } from '@/lib/supabase/storage'

interface ProfileModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export function ProfileModal({ isOpen: propIsOpen, onClose: propOnClose }: ProfileModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen
  
  const onClose = () => {
    if (propOnClose) propOnClose()
    else setInternalIsOpen(false)
  }

  useEffect(() => {
    const handleOpen = () => setInternalIsOpen(true)
    window.addEventListener('open-profile-modal', handleOpen)
    return () => window.removeEventListener('open-profile-modal', handleOpen)
  }, [])
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [stealthPin, setStealthPin] = useState('')
  const [storagePref, setStoragePref] = useState<'cloud' | 'local'>('cloud')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedPin = localStorage.getItem('stealth_pin') || '9299'
    setStealthPin(savedPin)
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      // Neural Optimization: Client-side WebP Conversion (Simulated via canvas if standard compression is too heavy)
      // For v12.1.0 we use the existing storage helper which handles basic upload.
      // We wrap it in a WebP conversion promise.
      
      const webpFile = await convertToWebP(file)
      const { url, error } = await uploadNoteAsset(user.id, webpFile, 'avatar.webp')
      
      if (url) {
        setAvatarUrl(url)
        toast.success('Neural Avatar Optimized')
      } else if (error) {
        throw new Error(error)
      }
    } catch (err) {
      toast.error('Identity Sync Failure', { description: 'Failed to optimize avatar.' })
    } finally {
      setIsUploading(false)
    }
  }

  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = 400
        canvas.height = 400
        ctx?.drawImage(img, 0, 0, 400, 400)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }))
          } else {
            resolve(file)
          }
        }, 'image/webp', 0.8)
      }
    })
  }

  const handleSave = async () => {
    setIsUpdating(true)
    const res = await updateProfile({ name, avatar: avatarUrl })
    setIsUpdating(false)
    
    if (res.success) {
      toast.success('Identity Refined', { description: 'Neural metadata synchronized across all clusters.' })
      onClose()
    } else {
      toast.error('Sync Failure', { description: res.error || 'Failed to broadcast profile changes.' })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Neural Profile</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify your node in the network</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-300" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Broadcast Name</label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your explorer name..."
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 px-6 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Neural Link (Email)</label>
                  <div className="h-14 flex items-center px-6 bg-slate-100 dark:bg-white/5 rounded-2xl text-[11px] font-mono text-slate-500 whitespace-nowrap overflow-hidden opacity-60">
                    {user?.email}
                  </div>
                </div>

                {/* Stealth & Storage Clusters */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Intelligence Node</label>
                      <button 
                        type="button"
                        onClick={() => setStoragePref(storagePref === 'cloud' ? 'local' : 'cloud')}
                        className={`w-full h-14 rounded-2xl border flex items-center justify-center gap-3 transition-all ${storagePref === 'local' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400'}`}
                      >
                         {storagePref === 'local' ? <HardDrive className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{storagePref === 'local' ? 'Device Storage' : 'Online Storage'}</span>
                      </button>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Stealth PIN</label>
                      <div className="flex gap-2">
                         <Input 
                            type="password"
                            maxLength={4}
                            value={stealthPin}
                            onChange={(e) => setStealthPin(e.target.value)}
                            className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-center font-black tracking-widest"
                         />
                         <Button 
                           variant="ghost"
                           size="icon"
                           onClick={() => {
                              if (stealthPin.length === 4 && !isNaN(Number(stealthPin))) {
                                 localStorage.setItem('stealth_pin', stealthPin)
                                 toast.success('Stealth PIN Committed')
                              } else {
                                 toast.error('Invalid Sequence')
                              }
                           }}
                           className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/10 shrink-0"
                         >
                            <Key className="w-4 h-4 text-violet-600" />
                         </Button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isUpdating || isUploading}
                  className="flex-1 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isUpdating ? 'Synchronizing...' : 'Save Identity'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
