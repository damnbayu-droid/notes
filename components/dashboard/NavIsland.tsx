'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Info, X, Clock, User, Bell, Timer, AlarmClock, Plus, Download, LogOut, RefreshCw, Settings, Shield, ShieldCheck, Database, HelpCircle, Boxes, Calendar, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function useRealTimeClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const day = days[now.getDay()]
      const dd = String(now.getDate()).padStart(2, '0')
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      setTime(`${hh}:${mm}:${ss}`)
      setDate(`${day}. ${dd}/${mo}/${yyyy}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return { time, date }
}

export function NavIsland({ compact = false }: { compact?: boolean }) {
  const { user, signOut: logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { time, date } = useRealTimeClock()

  const [isExpanded, setIsExpanded] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'tools' | 'settings' | 'alerts'>('alerts')
  const [notification, setNotification] = useState<{ title: string; message: string; type: string } | null>(null)
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string }[]>([])
  const [pinInput, setPinInput] = useState('')
  const [isPinMode, setIsPinMode] = useState(false)
  const islandRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Close on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // System Permissions
  const requestPermissions = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  }

  // Handle notifications — pop in, show 4s (per user request), then hide
  // Onboarding Notification — Show after 7s for guests, stay for 5s
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        const hasShown = localStorage.getItem('onboarding_notif_shown')
        if (!hasShown) {
          window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: {
              title: 'Neural Sync Recommended',
              message: 'Initialize your account to synchronize intelligence across all clusters.',
              type: 'info'
            }
          }))
          localStorage.setItem('onboarding_notif_shown', 'true')
        }
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [user])

  // System Permission Onboarding — Show after 30s
  useEffect(() => {
    const timer = setTimeout(() => {
      const permissionsShown = sessionStorage.getItem('permissions_prompt_shown')
      if (!permissionsShown) {
        window.dispatchEvent(new CustomEvent('dcpi-notification', {
          detail: {
            title: 'Neural Permissions Required',
            message: 'Camera and Notification access are needed for high-fidelity scanning.',
            type: 'warning',
            action: {
                label: 'Authorize Now',
                onClick: async () => {
                    try {
                        toast.loading('Requesting Neural Access...', { id: 'nav-permissions' });
                        await navigator.mediaDevices.getUserMedia({ video: true });
                        if ('Notification' in window) await Notification.requestPermission();
                        toast.success('Permissions Authorized', { id: 'nav-permissions' });
                    } catch (err) {
                        toast.error('Access Restricted', { id: 'nav-permissions', description: 'Please enable camera access in your browser settings.' });
                    }
                }
            }
          }
        }))
        sessionStorage.setItem('permissions_prompt_shown', 'true')
      }
    }, 30000) // 30 second delay as requested
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleNotification = (e: any) => {
      const newNotif = { ...e.detail, id: crypto.randomUUID(), time: new Date().toLocaleTimeString() };
      setNotification(e.detail)
      setNotifications(prev => [newNotif, ...prev].slice(0, 10))
      
      // Auto-expand on new notif only if not already manually expanded
      if (!isExpanded) {
        setIsExpanded(true)
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => {
            setNotification(null)
            setIsExpanded(false)
        }, 5000)
      } else {
        // Just show notification in the pill without forcing a close timer if user is already in there
        setNotification(e.detail)
      }
    }
    window.addEventListener('dcpi-notification', handleNotification)
    return () => {
      window.removeEventListener('dcpi-notification', handleNotification)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  // Focus search input when shown
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [showSearch])

  // Global search handler
  const handlePinInput = (num: string) => {
    const newPin = pinInput + num;
    if (newPin.length <= 4) {
      setPinInput(newPin);
      const targetPin = localStorage.getItem('stealth_pin') || '9299';
      if (newPin === targetPin) {
        sessionStorage.setItem('is_neural_unlocked', 'true');
        setIsPinMode(false);
        setPinInput('');
        setIsExpanded(false);
        toast.success('Neural Node Unlocked');
        
        // If we were trying to open settings, open it now
        if (activeTab === 'settings') {
           window.dispatchEvent(new CustomEvent('open-settings-modal'));
        } else {
           router.push('/?view=spymaster');
        }
      } else if (newPin.length === 4) {
        setPinInput('');
        toast.error('Access Denied', { description: 'Incorrect authorization code.' });
      }
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.dispatchEvent(new CustomEvent('island-search', { detail: { query: searchQuery } }))
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  useEffect(() => {
    if (!isExpanded) {
      setPinInput('')
      setIsPinMode(false)
    }
  }, [isExpanded])

  return (
    <>
      {/* Main Pill — Positioned by Parent Layout with Mobile Left-Shift (v14.2.3) */}
      <div className="flex flex-col items-center gap-2 sm:translate-x-0">
        <motion.div
          layout
          onClick={() => {
            if (!showSearch) {
              if (!isExpanded) setActiveTab('alerts');
              setIsExpanded(!isExpanded);
            }
          }}
          className={`
            relative flex items-center gap-2 sm:gap-3 px-5 py-2.5 sm:py-2.5 cursor-pointer select-none
            bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl
            border border-slate-200/60 dark:border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            rounded-full transition-all duration-300 scale-100
            hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)] hover:border-violet-300/50 dark:hover:border-violet-700/50
          `}
        >
          {/* Notification mode */}
          <AnimatePresence mode="wait">
            {notification && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center gap-3 overflow-hidden pr-3 border-r border-slate-200 dark:border-white/10"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  notification.type === 'success' ? 'bg-emerald-500' :
                  notification.type === 'error' ? 'bg-rose-500' : 'bg-violet-500'
                } animate-pulse`} />
                <div className="min-w-[150px]">
                  <p className="text-[9px] font-black uppercase tracking-tight text-slate-900 dark:text-white line-clamp-1">{notification.title}</p>
                  <p className="text-[8px] font-bold text-slate-400 line-clamp-1">{notification.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Clock */}
          <div 
            onClick={(e) => {
               if (isExpanded) {
                  e.stopPropagation();
                  setIsPinMode(true);
               }
            }}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black font-mono tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {time}
            </span>
            <span className="text-[9px] font-bold text-slate-400 hidden md:block whitespace-nowrap">|</span>
            <span className="text-[9px] font-bold text-slate-400 hidden md:block whitespace-nowrap">{date}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 shrink-0" />

          {/* Actions: Settings & Profile (Redundant Icons hidden on Mobile v15.0.7) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (sessionStorage.getItem('is_neural_unlocked') === 'true') {
                      window.dispatchEvent(new CustomEvent('open-settings-modal')); 
                    } else {
                      setIsExpanded(true);
                      setIsPinMode(true);
                      setActiveTab('settings');
                    }
                  }}
                  className="hidden md:flex p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                 <p>System Configuration</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-info-panel')); }}
                  className="hidden md:flex p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                 <p>System Information</p>
              </TooltipContent>
            </Tooltip>

            <div className="relative">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center overflow-hidden border transition-all ${user ? 'bg-violet-100 border-violet-200' : 'bg-slate-100 border-slate-200'}`}>
                <span className="text-[8px] sm:text-[9px] font-black text-violet-600">
                  {user ? user.email?.[0]?.toUpperCase() : '?'}
                </span>
              </div>
              {user && <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />}
            </div>
          </div>
        </motion.div>

        {/* Search Mini Popup */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              style={{ width: 320 }}
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-3">
                <Search className="w-4 h-4 text-violet-500 shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search intelligence..."
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchQuery('') }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Redesigned Popup — Below the Navigation Island */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="absolute top-full mt-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-white/10 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.6)] overflow-hidden z-[200]"
              style={{ width: compact ? '260px' : 'min(340px, 90vw)' }}
            >
              {/* Top: Core Icon Actions (v12.1.0 Refined) */}
              <div className="p-4 grid grid-cols-4 gap-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all shadow-lg ${activeTab === 'settings' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}
                  title="System Settings"
                >
                  <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'animate-spin-slow' : ''}`} />
                </button>
                <button 
                   onClick={() => setIsPinMode(true)}
                   className={`aspect-square rounded-2xl flex items-center justify-center transition-all shadow-lg ${isPinMode ? 'bg-rose-600 text-white scale-110' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                   title="Spy Master Access"
                >
                   <Bell className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => setActiveTab('tools')}
                   className={`aspect-square rounded-2xl flex items-center justify-center transition-all shadow-lg ${activeTab === 'tools' ? 'bg-emerald-600 text-white scale-110' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                   title="Neural Tools"
                >
                   <Boxes className="w-5 h-5" />
                </button>
                {user ? (
                   <button 
                     onClick={() => { logout(); setIsExpanded(false); router.push('/') }}
                     className="aspect-square rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-600 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-white/5"
                     title="Terminate Session"
                   >
                     <LogOut className="w-5 h-5" />
                   </button>
                ) : (
                  <button 
                    onClick={() => { router.push('/login'); setIsExpanded(false) }}
                    className="aspect-square rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-white/5"
                    title="Account Login"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content Switching Area (v12.1.0) */}
              <div className="p-6">
                {isPinMode ? (
                  <div className="space-y-6 animate-in zoom-in-95 duration-200">
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Authorization Required</p>
                        <div className="flex justify-center gap-3">
                           {[1,2,3,4].map(i => (
                              <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all ${pinInput.length >= i ? 'bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/50' : 'border-slate-200 dark:border-slate-800'}`} />
                           ))}
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6,7,8,9, 'C', 0, 'X'].map((val) => (
                           <button
                              key={String(val)}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 if (val === 'C') setPinInput('');
                                 else if (val === 'X') setIsPinMode(false);
                                 else handlePinInput(String(val));
                              }}
                              className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-white/5"
                           >
                              {val}
                           </button>
                        ))}
                     </div>
                  </div>
                ) : activeTab === 'alerts' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notification Center</p>
                       <button onClick={() => setNotifications([])} className="text-[8px] font-black uppercase text-rose-500 hover:opacity-70">Clear All</button>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       {notifications.length > 0 ? (
                          notifications.map(n => (
                             <motion.div 
                                key={n.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1 relative group"
                             >
                                <div className="flex items-center justify-between">
                                   <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900 dark:text-white line-clamp-1">{n.title}</span>
                                   <span className="text-[7px] font-bold text-slate-400 uppercase shrink-0">{n.time}</span>
                                </div>
                                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">{n.message}</p>
                                {(n as any).action && (
                                    <Button 
                                       size="sm" 
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           (n as any).action.onClick();
                                       }}
                                       className="h-7 w-full mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black uppercase tracking-widest shadow-lg"
                                    >
                                        {(n as any).action.label}
                                    </Button>
                                )}
                             </motion.div>
                          ))
                       ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                             <Bell className="w-8 h-8 text-slate-300" />
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">No active alerts</p>
                          </div>
                       )}
                    </div>
                  </div>
                ) : activeTab === 'tools' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Intelligence Tools</p>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-timer-modal')); setIsExpanded(false) }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                       >
                          <Timer className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Timer</span>
                       </button>

                       <button 
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-timer-modal', { detail: { tab: 'alarm' } })); setIsExpanded(false) }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                       >
                          <AlarmClock className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Alarm</span>
                       </button>

                       <button 
                          onClick={() => { router.push('/?view=schedule'); setIsExpanded(false) }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                       >
                          <Calendar className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Schedule</span>
                       </button>

                       <button 
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-world-time-modal')); setIsExpanded(false) }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                       >
                          <Globe className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">World</span>
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Neural Configuration</p>
                    
                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('open-info-panel')); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <Info className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">System Information</span>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </button>

                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('open-profile-modal')); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <User className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Profile Identity</span>
                    </button>

                    <button 
                      onClick={() => { 
                         if (sessionStorage.getItem('is_neural_unlocked') === 'true') {
                            window.dispatchEvent(new CustomEvent('open-settings-modal')); 
                            setIsExpanded(false);
                         } else {
                            setIsPinMode(true);
                            setActiveTab('settings');
                         }
                      }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Security & Access</span>
                    </button>

                    <button 
                      onClick={() => { router.push('/?view=logs'); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <Shield className="w-4 h-4 text-violet-600 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Storage Trace</span>
                    </button>
                    
                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('open-settings-modal', { detail: { tab: 'database' } })); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <Database className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Database Cluster</span>
                    </button>

                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('open-privacy-modal')); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <Shield className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Privacy / Policy</span>
                    </button>

                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('open-help-modal')); setIsExpanded(false) }}
                      className="w-full h-14 flex items-center gap-4 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Neural Help Hub</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom: Mobile Apps & Support */}
              <div className="px-6 pb-6 space-y-3">
                <button 
                  onClick={() => {
                    const ua = navigator.userAgent.toLowerCase();
                    if (ua.includes('android')) {
                        window.open('https://median.co/share/rdjmokn#apk', '_blank');
                        toast.success('Dispatched Neural APK', { description: 'Initializing Android installation package...' });
                    } else if (ua.includes('iphone') || ua.includes('ipad')) {
                        toast.info('iOS Native Handshake Restricted', { 
                            description: 'To install the Sovereign version: Tap Share (up arrow) -> "Add to Home Screen"',
                            duration: 8000 
                        });
                    } else {
                        window.open('https://median.co/share/rdjmokn#apk', '_blank');
                        toast.success('Forwarding to Deployment Hub', { description: 'Opening Android APK repository.' });
                    }
                  }}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none hover:bg-violet-700 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Download Mobil Hub</span>
                </button>
                
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Neural Sync Secured</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop — Refined Overlay for Visual Clarity (No Blur per v10.0 mandate) */}
      {(isExpanded || showSearch) && (
        <div
          className="fixed inset-0 z-[190] bg-slate-950/20 animate-in fade-in duration-300"
          onClick={() => { setIsExpanded(false); setShowSearch(false) }}
        />
      )}
    </>
  )
}
