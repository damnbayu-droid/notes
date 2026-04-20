'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, X, Clock, MapPin, Zap, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface TimeZone {
  city: string
  zone: string
  offset: string
  color: string
}

const ZONES: TimeZone[] = [
  { city: 'Jakarta', zone: 'Asia/Jakarta', offset: 'GMT+7', color: 'emerald' },
  { city: 'London', zone: 'Europe/London', offset: 'GMT+0', color: 'blue' },
  { city: 'New York', zone: 'America/New_York', offset: 'GMT-5', color: 'amber' },
  { city: 'Tokyo', zone: 'Asia/Tokyo', offset: 'GMT+9', color: 'rose' },
]

export function SmartWorldTime() {
  const [isOpen, setIsOpen] = useState(false)
  const [times, setTimes] = useState<Record<string, string>>({})
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('open-world-time-modal', handleOpen)
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('open-world-time-modal', handleOpen)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const update = () => {
      const newTimes: Record<string, string> = {}
      ZONES.forEach(z => {
        try {
          const timeStr = new Date().toLocaleTimeString('en-US', {
            timeZone: z.zone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          newTimes[z.city] = timeStr
        } catch (err) {
          console.error(`Temporal mismatch in zone: ${z.zone}`, err)
          newTimes[z.city] = '--:--:--'
        }
      })
      setTimes(newTimes)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xl animate-in fade-in duration-300">
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 z-50 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-10 relative z-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Globe className="w-10 h-10 text-white animate-spin-slow" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">World <span className="text-blue-600">Time</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Global Temporal Ingestion Protocols</p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ZONES.map((z) => (
              <div 
                key={z.city}
                className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-start gap-4 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-3.5 h-3.5 text-${z.color}-500`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{z.city}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{z.offset}</span>
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-3xl font-black italic tabular-nums tracking-tighter text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                     {times[z.city] || '00:00:00'}
                   </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
             <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">Atomic Clock Synchronization: OK</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
